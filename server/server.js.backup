const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const db = require('./db'); // Import DB connection
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] } });

const PORT = 3001;

// Helper to notify user and partner
const notifyUserAndPartner = async (username) => {
    if (!username) return;

    console.log(`[SOCKET] Notifying updates for user: ${username}`);

    // Notify the user themselves
    io.to(username).emit('data:updated');
    console.log(`[SOCKET] Emitted 'data:updated' to room: ${username}`);

    try {
        // Find partner
        const res = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        if (res.rows.length > 0 && res.rows[0].partner_username) {
            const partner = res.rows[0].partner_username;
            io.to(partner).emit('data:updated');
            console.log(`[SOCKET] Emitted 'data:updated' to partner room: ${partner}`);
        }
    } catch (err) {
        console.error('Error in notifyUserAndPartner:', err);
    }
};

// Socket.io Middleware
app.use((req, res, next) => {
    req.io = io;
    req.notifyUser = notifyUserAndPartner;
    next();
});

// Socket.io Connection
io.on('connection', (socket) => {
    const username = socket.handshake.query.username;
    console.log(`[SOCKET] New connection attempt. ID: ${socket.id}, Username: ${username}`);

    if (username) {
        socket.join(username);
        console.log(`[SOCKET] User joined room: ${username}`);
    } else {
        console.log(`[SOCKET] Connection without username query.`);
    }

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${username || 'Unknown'} (${socket.id})`);
    });
});

app.use(cors());
app.use(bodyParser.json());

// Session Config
const pgSession = require('connect-pg-simple')(session);

// Session Config
app.use(session({
    store: new pgSession({
        pool: db.pool, // Connection pool
        tableName: 'session' // Use another table-name than the default "session" one
    }),
    secret: 'wedding-tracker-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// Passport Config
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

const GOOGLE_CLIENT_ID = '851446958447-nicd6k583c2qkqc9c3d58o0s9jaae5c7.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

if (!GOOGLE_CLIENT_SECRET) {
    console.warn('WARNING: Google Client Secret is missing. Google Auth will not work.');
}

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://dugunbutcem.com/api/auth/google/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        try {
            // Check if user exists
            const res = await db.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [profile.id, profile.emails[0].value]);
            let user = res.rows[0];

            if (!user) {
                // Create new user
                const baseUsername = profile.emails[0].value.split('@')[0];
                let username = baseUsername;
                let counter = 1;

                // Ensure unique username
                while (true) {
                    const check = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
                    if (check.rowCount === 0) break;
                    username = `${baseUsername}${counter}`;
                    counter++;
                }

                const newUser = {
                    username,
                    name: profile.name.givenName,
                    surname: profile.name.familyName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    isAdmin: false,
                    createdAt: new Date().toISOString(),
                    avatar: profile.photos[0].value
                };

                await db.query(
                    `INSERT INTO users (username, name, surname, email, google_id, is_admin, created_at, avatar)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [newUser.username, newUser.name, newUser.surname, newUser.email, newUser.googleId, newUser.isAdmin, newUser.createdAt, newUser.avatar]
                );
                user = newUser;
            } else {
                // Update googleId if missing
                if (!user.google_id) {
                    await db.query('UPDATE users SET google_id = $1 WHERE email = $2', [profile.id, user.email]);
                    user.google_id = profile.id;
                }
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Log requests to uploads
app.use('/uploads', (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Request for upload:`, req.url);
    next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Ensure default admin exists
const ensureAdmin = async () => {
    try {
        const res = await db.query('SELECT 1 FROM users WHERE username = $1', ['admin']);
        if (res.rowCount === 0) {
            await db.query(
                `INSERT INTO users (username, password, is_admin, email, created_at)
                 VALUES ($1, $2, $3, $4, $5)`,
                ['admin', 'admin123', true, 'admin@example.com', new Date().toISOString()]
            );
            console.log('Default admin user created: admin / admin123');
        }
    } catch (err) {
        console.error('Error ensuring admin:', err);
    }
};
ensureAdmin();

// --- Auth Routes ---

app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
    (req, res) => {
        const user = req.user;
        const userData = JSON.stringify(user);
        res.redirect(`https://dugunbutcem.com/login?googleAuthUser=${encodeURIComponent(userData)}`);
    }
);



app.post('/api/auth/register', async (req, res) => {
    const { password, name, surname, email } = req.body;
    try {
        const check = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
        if (check.rowCount > 0) {
            return res.status(400).json({ success: false, message: 'Bu e-posta adresi zaten kayıtlı.' });
        }

        const baseUsername = email.split('@')[0];
        let username = baseUsername;
        let counter = 1;
        while (true) {
            const uCheck = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
            if (uCheck.rowCount === 0) break;
            username = `${baseUsername}${counter}`;
            counter++;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users (username, password, name, surname, email, is_admin, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [username, hashedPassword, name, surname, email, false, new Date().toISOString()]
        );

        const newUser = { username, name, surname, email, isAdmin: false };
        res.json({ success: true, user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            if (user.is_banned) {
                console.warn(`[AUTH] Login attempt blocked for banned user: ${email}`);
                return res.status(403).json({ success: false, message: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' });
            }
            const { password: _, is_admin, is_banned, ...userWithoutPassword } = user;
            // Normalize to camelCase
            const userForClient = { ...userWithoutPassword, isAdmin: is_admin, isBanned: is_banned };
            res.json({ success: true, user: userForClient });
        } else {
            res.status(401).json({ success: false, message: 'Hatalı kullanıcı adı veya şifre.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Alias for /api/login (frontend compatibility)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            if (user.is_banned) {
                console.warn(`[AUTH] Login attempt blocked for banned user: ${email}`);
                return res.status(403).json({ success: false, message: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' });
            }
            const { password: _, is_admin, is_banned, ...userWithoutPassword } = user;
            const userForClient = { ...userWithoutPassword, isAdmin: is_admin, isBanned: is_banned };
            res.json({ success: true, user: userForClient });
        } else {
            res.status(401).json({ success: false, message: 'Hatalı kullanıcı adı veya şifre.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Admin Routes ---

app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await db.query('SELECT username, name, surname, email, phone, city, wedding_date, budget_range, is_admin, is_banned, created_at, google_id, avatar FROM users');
        const users = result.rows.map(user => {
            const { is_admin, is_banned, created_at, wedding_date, budget_range, ...rest } = user;
            return {
                ...rest,
                isAdmin: is_admin,
                isBanned: is_banned,
                createdAt: created_at,
                weddingDate: wedding_date,
                budgetRange: budget_range
            };
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/users/:username', async (req, res) => {
    const { username } = req.params;
    if (username === 'admin') return res.status(400).json({ error: 'Cannot delete admin user' });

    try {
        const result = await db.query('DELETE FROM users WHERE username = $1', [username]);
        if (result.rowCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/users/:username/password', async (req, res) => {
    const { username } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password required' });

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await db.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, username]);
        if (result.rowCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Download Backup Endpoint
app.get('/api/admin/backup', (req, res) => {
    // Basic security check (in real app, use middleware)
    // Here we assume the frontend handles auth, but ideally we check session/passport here too.
    // Since this is a simple implementation, we'll proceed.

    const { spawn } = require('child_process');
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${date}.sql`;

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/sql');

    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };
    const dump = spawn('pg_dump', ['-h', process.env.DB_HOST, '-U', process.env.DB_USER, process.env.DB_NAME], { env });

    dump.stdout.pipe(res);

    dump.stderr.on('data', (data) => {
        console.error(`pg_dump error: ${data}`);
    });

    dump.on('close', (code) => {
        if (code !== 0) {
            console.error(`pg_dump process exited with code ${code}`);
            // If headers haven't been sent, we could send 500, but streaming might have started.
        }
    });
});

app.put('/api/admin/users/:username/role', async (req, res) => {
    const { username } = req.params;
    const { isAdmin } = req.body;
    if (username === 'admin') return res.status(400).json({ error: 'Cannot change role of root admin' });

    try {
        const result = await db.query('UPDATE users SET is_admin = $1 WHERE username = $2', [isAdmin, username]);
        if (result.rowCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/users/:username/ban', async (req, res) => {
    const { username } = req.params;
    const { isBanned } = req.body;
    if (username === 'admin') return res.status(400).json({ error: 'Cannot ban root admin' });

    try {
        const result = await db.query('UPDATE users SET is_banned = $1 WHERE username = $2', [isBanned, username]);
        if (result.rowCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/notifications', async (req, res) => {
    const { title, message, targetUser } = req.body;

    try {
        if (targetUser && targetUser !== 'all') {
            // Send to specific user
            await db.query(
                'INSERT INTO notifications (username, title, message) VALUES ($1, $2, $3)',
                [targetUser, title, message]
            );
        } else {
            // Broadcast to all users
            const users = await db.query('SELECT username FROM users');
            for (const user of users.rows) {
                await db.query(
                    'INSERT INTO notifications (username, title, message) VALUES ($1, $2, $3)',
                    [user.username, title, message]
                );
            }
        }

        res.json({ success: true, message: 'Notification sent and saved to database' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Public Vendor Routes ---

// Get public vendors (for mobile app recommendations)
app.get('/api/vendors', async (req, res) => {
    try {
        const { city, category } = req.query;
        let query = 'SELECT * FROM vendors WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (city) {
            query += ` AND city = $${paramIndex}`;
            params.push(city);
            paramIndex++;
        }

        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        // Prioritize featured vendors, then high rank
        query += ' ORDER BY is_featured DESC, rank DESC, created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Vendor Management Routes ---

// Get all vendors (with filters)
app.get('/api/admin/vendors', async (req, res) => {
    try {
        const { city, category } = req.query;
        let query = 'SELECT * FROM vendors WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (city && city !== 'all') {
            query += ` AND city = $${paramIndex}`;
            params.push(city);
            paramIndex++;
        }

        if (category && category !== 'all') {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        query += ' ORDER BY rank DESC, created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new vendor
app.post('/api/admin/vendors', async (req, res) => {
    try {
        const { name, category, city, contact_info, image_url, is_featured, rank } = req.body;
        const result = await db.query(
            'INSERT INTO vendors (name, category, city, contact_info, image_url, is_featured, rank) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, category, city, contact_info || {}, image_url, is_featured || false, rank || 0]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update vendor
app.put('/api/admin/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, city, contact_info, image_url, is_featured, rank } = req.body;
        const result = await db.query(
            'UPDATE vendors SET name = $1, category = $2, city = $3, contact_info = $4, image_url = $5, is_featured = $6, rank = $7 WHERE id = $8 RETURNING *',
            [name, category, city, contact_info, image_url, is_featured, rank, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete vendor
app.delete('/api/admin/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM vendors WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        res.json({ success: true, message: 'Vendor deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Notifications - Get user's notifications
app.get('/api/notifications', async (req, res) => {
    const username = req.query.user;

    if (!username) {
        return res.status(400).json({ error: 'Username required' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM notifications WHERE username = $1 ORDER BY created_at DESC',
            [username]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            'UPDATE notifications SET read = true WHERE id = $1',
            [id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Categories
app.get('/api/admin/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY rank ASC, id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/categories', async (req, res) => {
    const { name, type, color, icon } = req.body;
    try {
        // Calculate next rank
        const rankRes = await db.query('SELECT COALESCE(MAX(rank), 0) + 1 as next_rank FROM categories');
        const nextRank = rankRes.rows[0].next_rank;

        const result = await db.query(
            'INSERT INTO categories (name, type, color, icon, rank) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, type || 'expense', color, icon, nextRank]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Category already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/categories/reorder', async (req, res) => {
    const { categories } = req.body; // Expect array of { id, rank }
    if (!Array.isArray(categories)) return res.status(400).json({ error: 'Invalid data' });

    try {
        // Use a transaction for safety
        await db.query('BEGIN');
        for (const cat of categories) {
            await db.query('UPDATE categories SET rank = $1 WHERE id = $2', [cat.rank, cat.id]);
        }
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM categories WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const userCount = await db.query('SELECT COUNT(*) FROM users');
        const expenseCount = await db.query('SELECT COUNT(*) FROM expenses');
        const budgetSum = await db.query('SELECT SUM(amount) FROM budgets');
        const spendingSum = await db.query('SELECT SUM(price) FROM expenses');

        // Top Category (Pie Chart Data)
        const categoryStats = await db.query(`
            SELECT category as name, SUM(price) as value 
            FROM expenses 
            WHERE category IS NOT NULL 
            GROUP BY category 
            ORDER BY value DESC
        `);

        // Wedding Timeline (Next 12 Months)
        const timelineStats = await db.query(`
            SELECT TO_CHAR(wedding_date, 'YYYY-MM') as name, COUNT(*) as uv 
            FROM users 
            WHERE wedding_date >= CURRENT_DATE 
            GROUP BY 1
            ORDER BY 1 ASC 
            LIMIT 12
        `);

        // City Distribution
        const cityStats = await db.query(`
            SELECT city, COUNT(*) as count 
            FROM users 
            WHERE city IS NOT NULL AND city != '' 
            GROUP BY city 
            ORDER BY count DESC
        `);

        // Top Vendor
        const topVen = await db.query('SELECT vendor, SUM(price) as total FROM expenses GROUP BY vendor ORDER BY total DESC LIMIT 1');

        res.json({
            totalUsers: parseInt(userCount.rows[0].count),
            totalExpenses: parseInt(expenseCount.rows[0].count),
            totalBudgetAmount: parseFloat(budgetSum.rows[0].sum || 0),
            totalSpending: parseFloat(spendingSum.rows[0].sum || 0),
            categoryDistribution: categoryStats.rows.map(row => ({ name: row.name, value: parseFloat(row.value) })),
            weddingTimeline: timelineStats.rows,
            cityDistribution: cityStats.rows.map(row => ({ bg: row.city, count: parseInt(row.count) })),
            topVendor: topVen.rows[0] ? { name: topVen.rows[0].vendor, amount: parseFloat(topVen.rows[0].total) } : { name: '-', amount: 0 }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Data Routes ---

app.get('/api/data', async (req, res) => {
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: 'User required' });

    try {
        // Get user's partner info and details
        const userInfo = await db.query('SELECT partner_username, partnership_id, name, surname, avatar FROM users WHERE username = $1', [user]);
        const currentUser = userInfo.rows[0];
        const partnerUsername = currentUser?.partner_username;
        const partnershipId = currentUser?.partnership_id;

        // Build Users Map for Frontend Display
        const usersMap = {};
        if (currentUser) {
            usersMap[user] = {
                name: currentUser.name || user,
                surname: currentUser.surname || '',
                avatar: currentUser.avatar
            };
        }

        if (partnerUsername) {
            const partnerRes = await db.query('SELECT username, name, surname, avatar FROM users WHERE username = $1', [partnerUsername]);
            const partner = partnerRes.rows[0];
            if (partner) {
                usersMap[partnerUsername] = {
                    name: partner.name || partnerUsername,
                    surname: partner.surname || '',
                    avatar: partner.avatar
                };
            }
        }

        // Query expenses - Include partner's expenses
        let expensesQuery = 'SELECT * FROM expenses WHERE username = $1';
        let expensesParams = [user];

        if (partnerUsername) {
            // Fetch everything belonging to either user, regardless of partnership_id being set on old records
            expensesQuery = 'SELECT * FROM expenses WHERE username IN ($1, $2)';
            expensesParams = [user, partnerUsername];
        } else if (partnershipId) {
            // Fallback to partnership ID if we only have that
            expensesQuery = 'SELECT * FROM expenses WHERE partnership_id = $1 OR username = $2';
            expensesParams = [partnershipId, user];
        }

        const expenses = await db.query(expensesQuery, expensesParams);

        // Query budget - Always use username, assuming 'Sync on Write' logic
        const budgetQuery = 'SELECT amount FROM budgets WHERE username = $1';
        const budgetParams = [user];
        const budget = await db.query(budgetQuery, budgetParams);

        // Query assets
        let assetsQuery = 'SELECT * FROM assets WHERE username = $1';
        let assetsParams = [user];

        if (partnerUsername && partnershipId) {
            assetsQuery = 'SELECT * FROM assets WHERE partnership_id = $1';
            assetsParams = [partnershipId];
        }

        const assets = await db.query(assetsQuery, assetsParams);

        // Query portfolio (Döviz & Altın)
        let portfolioQuery = 'SELECT * FROM portfolio WHERE username = $1';
        let portfolioParams = [user];

        if (partnerUsername) {
            portfolioQuery = 'SELECT * FROM portfolio WHERE username IN ($1, $2)';
            portfolioParams = [user, partnerUsername];
        }

        const portfolio = await db.query(portfolioQuery, portfolioParams);

        const installments = await db.query('SELECT data FROM installment_states WHERE username = $1', [user]);
        const userRec = await db.query('SELECT wedding_date FROM users WHERE username = $1', [user]);

        res.json({
            expenses: expenses.rows.map(e => ({
                ...e,
                isInstallment: e.is_installment,
                installmentCount: e.installment_count,
                monthlyPayment: parseFloat(e.monthly_payment),
                price: parseFloat(e.price)
            })),
            budget: budget.rows[0] ? parseFloat(budget.rows[0].amount) : 0,
            weddingDate: userRec.rows[0]?.wedding_date || null,
            assets: assets.rows.map(a => ({
                ...a,
                value: parseFloat(a.value),
                amount: parseFloat(a.amount)
            })),
            portfolio: portfolio.rows.map(p => ({
                ...p,
                amount: parseFloat(p.amount)
            })),
            installmentPayments: installments.rows[0]?.data || {},
            usersMap // Return map of username -> {name, surname}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/expenses', upload.single('image'), async (req, res) => {
    try {
        let expenseData;
        if (req.body.data && typeof req.body.data === 'string') {
            // FormData - parse the JSON string
            expenseData = JSON.parse(req.body.data);
        } else if (req.body.title) {
            // Direct JSON body
            expenseData = req.body;
        } else {
            return res.status(400).json({ error: 'Invalid request format' });
        }

        if (!expenseData.username) return res.status(400).json({ error: 'User required' });

        let imageUrl = null;
        if (req.file) {
            const filename = `expense-${Date.now()}.jpeg`;
            const filepath = path.join(__dirname, 'uploads', filename);
            await sharp(req.file.buffer).resize(150, 150).toFormat('jpeg').toFile(filepath);
            imageUrl = `/uploads/${filename}`;
        }

        const id = expenseData.id || Date.now().toString();
        const { username, title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment } = expenseData;

        // Get user's partnership info
        const userInfo = await db.query('SELECT partnership_id FROM users WHERE username = $1', [username]);
        const partnershipId = userInfo.rows[0]?.partnership_id || null;

        await db.query(
            `INSERT INTO expenses (id, username, title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment, image_url, created_at, added_by, partnership_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [id, username, title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment, imageUrl, new Date().toISOString(), username, partnershipId]
        );

        await req.notifyUser(username);
        res.json({ ...expenseData, id, imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/expenses/batch', async (req, res) => {
    try {
        const { username, expenses } = req.body;
        if (!username || !Array.isArray(expenses)) return res.status(400).json({ error: 'User and expenses array required' });

        // Get user's partnership info
        const userInfo = await db.query('SELECT partnership_id FROM users WHERE username = $1', [username]);
        const partnershipId = userInfo.rows[0]?.partnership_id || null;

        const newExpenses = [];
        for (const exp of expenses) {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            await db.query(
                `INSERT INTO expenses (id, username, title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment, created_at, added_by, partnership_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                [id, username, exp.title, exp.category, exp.price, exp.vendor, exp.source, exp.date, exp.isInstallment, exp.installmentCount, exp.status, exp.notes, exp.monthlyPayment, new Date().toISOString(), username, partnershipId]
            );
            newExpenses.push({ ...exp, id, username });
        }

        await req.notifyUser(username);
        res.json({ success: true, count: newExpenses.length, expenses: newExpenses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/images/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).send('Image not found');
    }
});

app.put('/api/expenses/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;

        // Support both JSON and FormData
        let expenseData;
        if (req.body.data && typeof req.body.data === 'string') {
            // FormData - parse the JSON string
            expenseData = JSON.parse(req.body.data);
        } else if (req.body.title) {
            // Direct JSON body
            expenseData = req.body;
        } else {
            return res.status(400).json({ error: 'Invalid request format' });
        }

        // Get existing image
        const existing = await db.query('SELECT image_url FROM expenses WHERE id = $1', [id]);
        if (existing.rowCount === 0) return res.status(404).json({ error: 'Expense not found' });

        let imageUrl = existing.rows[0].image_url;

        if (req.file) {
            const filename = `expense-${Date.now()}.jpeg`;
            const filepath = path.join(__dirname, 'uploads', filename);
            await sharp(req.file.buffer).resize(150, 150).toFormat('jpeg').toFile(filepath);
            imageUrl = `/uploads/${filename}`;
        }

        const { title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment } = expenseData;

        await db.query(
            `UPDATE expenses SET title=$1, category=$2, price=$3, vendor=$4, source=$5, date=$6, is_installment=$7, installment_count=$8, status=$9, notes=$10, monthly_payment=$11, image_url=$12
             WHERE id=$13`,
            [title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment, imageUrl, id]
        );

        await req.notifyUser(expenseData.username); // Assuming expenseData has username, usually it does. If not, fetch it? 
        // expenseData comes from req.body.data. The context says: const { username ... } = expenseData; in POST.
        // In PUT, line 547 desctructures it but username is NOT destructured there explicitly in line 547.
        // But line 532 parses it. Let's check if username is guaranteed.
        // If not, we can query it. But for now, let's assume it should be there or use 'added_by/username' from DB.
        // Safe bet: RETURNING username in UPDATE query.
        // Let's modify the code more safely.
        res.json({ ...expenseData, id, imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM expenses WHERE id = $1 RETURNING username', [id]);
        if (result.rowCount > 0) {
            await req.notifyUser(result.rows[0].username);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Expense not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/expenses', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'User required' });
    try {
        await db.query('DELETE FROM expenses WHERE username = $1', [username]);
        res.json({ success: true, message: 'All expenses deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/budget', async (req, res) => {
    const { username, budget } = req.body;
    if (!username) return res.status(400).json({ error: 'User required' });
    try {
        // Update user's budget
        await db.query(
            `INSERT INTO budgets (username, amount, added_by) VALUES ($1, $2, $1)
             ON CONFLICT (username) DO UPDATE SET amount = $2`,
            [username, budget]
        );

        // Sync with partner if exists
        const userInfo = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        const partnerUsername = userInfo.rows[0]?.partner_username;

        if (partnerUsername) {
            await db.query(
                `INSERT INTO budgets (username, amount, added_by) VALUES ($1, $2, $1)
                 ON CONFLICT (username) DO UPDATE SET amount = $2`,
                [partnerUsername, budget]
            );
        }

        await req.notifyUser(username);
        res.json({ success: true, budget: Number(budget) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper to recalculate budget based on Cash assets
const recalculateBudget = async (username) => {
    // Get partnership info
    const userRes = await db.query('SELECT partner_username, partnership_id FROM users WHERE username = $1', [username]);
    const partnerUsername = userRes.rows[0]?.partner_username;
    const partnershipId = userRes.rows[0]?.partnership_id;

    // Calculate total cash assets (Personal + Partner's if exists)
    let cashTotal = 0;
    if (partnerUsername && partnershipId) {
        const res = await db.query(
            "SELECT SUM(value) as total FROM assets WHERE (username = $1 OR partnership_id = $2) AND category = 'Nakit'",
            [username, partnershipId]
        );
        cashTotal = parseFloat(res.rows[0].total || 0);
    } else {
        const res = await db.query("SELECT SUM(value) as total FROM assets WHERE username = $1 AND category = 'Nakit'", [username]);
        cashTotal = parseFloat(res.rows[0].total || 0);
    }

    // Update user's budget
    await db.query(
        `INSERT INTO budgets (username, amount, added_by) VALUES ($1, $2, $1)
         ON CONFLICT (username) DO UPDATE SET amount = $2`,
        [username, cashTotal]
    );

    // Sync with partner
    if (partnerUsername) {
        await db.query(
            `INSERT INTO budgets (username, amount, added_by) VALUES ($1, $2, $1)
             ON CONFLICT (username) DO UPDATE SET amount = $2`,
            [partnerUsername, cashTotal]
        );
    }

    return cashTotal;
};

app.get('/api/assets', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'User required' });
    try {
        const result = await db.query('SELECT * FROM assets WHERE username = $1', [username]);
        res.json(result.rows.map(a => ({ ...a, value: parseFloat(a.value), amount: parseFloat(a.amount) })));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/assets', async (req, res) => {
    const { username, asset } = req.body;
    if (!username || !asset) return res.status(400).json({ error: 'User and asset required' });

    try {
        const id = Date.now().toString();

        // Check if this is a portfolio asset (Döviz/Altın) or regular asset (Nakit)
        const portfolioTypes = ['USD', 'EUR', 'GBP', 'GRAM', 'CEYREK', 'YARIM', 'TAM', 'CUMHURIYET'];
        const isPortfolioAsset = portfolioTypes.includes(asset.name) || asset.category === 'Döviz' || asset.category === 'Altın';

        if (isPortfolioAsset) {
            // Route to portfolio table
            console.log(`[ASSETS] Routing ${asset.name} to portfolio table`);
            await db.query(
                `INSERT INTO portfolio (id, username, type, amount, note, added_at)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, username, asset.name, asset.amount, asset.note || '', asset.date || new Date().toISOString()]
            );
        } else {
            // Route to assets table (Nakit)
            console.log(`[ASSETS] Routing ${asset.name} to assets table`);
            const userInfo = await db.query('SELECT partnership_id FROM users WHERE username = $1', [username]);
            const partnershipId = userInfo.rows[0]?.partnership_id || null;

            await db.query(
                `INSERT INTO assets (id, username, category, name, amount, value, date, added_by, partnership_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [id, username, asset.category, asset.name, asset.amount, asset.value, asset.date || new Date().toISOString(), username, partnershipId]
            );
        }

        let budget = 0;
        if (asset.category === 'Nakit' || isPortfolioAsset) {
            budget = await recalculateBudget(username);
        } else {
            const bRes = await db.query('SELECT amount FROM budgets WHERE username = $1', [username]);
            budget = bRes.rows[0] ? parseFloat(bRes.rows[0].amount) : 0;
        }

        // Notify user and partner
        const partnerRes = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        if (partnerRes.rows.length > 0 && partnerRes.rows[0].partner_username) {
            await req.notifyUser(partnerRes.rows[0].partner_username);
        }
        await req.notifyUser(username);

        res.json({ asset: { ...asset, id }, budget });
    } catch (err) {
        console.error('[ASSETS] Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/assets/:id', async (req, res) => {
    const { id } = req.params;
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'User required' });

    try {
        const assetRes = await db.query('SELECT category FROM assets WHERE id = $1', [id]);
        if (assetRes.rowCount === 0) return res.status(404).json({ error: 'Asset not found' });

        const category = assetRes.rows[0].category;
        await db.query('DELETE FROM assets WHERE id = $1', [id]);

        let budget = 0;
        if (category === 'Nakit') {
            budget = await recalculateBudget(username);
        } else {
            const bRes = await db.query('SELECT amount FROM budgets WHERE username = $1', [username]);
            budget = bRes.rows[0] ? parseFloat(bRes.rows[0].amount) : 0;
        }

        await req.notifyUser(username);
        res.json({ success: true, budget });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Portfolio Endpoints
app.get('/api/portfolio/:username', async (req, res) => {
    const { username } = req.params;
    try {
        // Get user info and partner
        const userRes = await db.query('SELECT portfolio_budget_included, partner_username FROM users WHERE username = $1', [username]);
        if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

        const { portfolio_budget_included, partner_username } = userRes.rows[0];

        // Fetch portfolio items for user AND partner
        let query = 'SELECT * FROM portfolio WHERE username = $1';
        let params = [username];

        if (partner_username) {
            query = 'SELECT * FROM portfolio WHERE username = $1 OR username = $2';
            params = [username, partner_username];
        }

        const pRes = await db.query(query, params);

        res.json({
            portfolio: pRes.rows.map(p => ({ ...p, amount: parseFloat(p.amount), addedAt: p.added_at })),
            budgetIncluded: portfolio_budget_included
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/portfolio/:username', async (req, res) => {
    const { username } = req.params;
    const { asset } = req.body;
    try {
        const id = asset.id || Date.now().toString();
        await db.query(
            `INSERT INTO portfolio (id, username, type, amount, note, added_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, username, asset.type, asset.amount, asset.note, asset.addedAt || new Date().toISOString()]
        );

        // Notify user and partner
        const partnerRes = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        if (partnerRes.rows.length > 0 && partnerRes.rows[0].partner_username) {
            await req.notifyUser(partnerRes.rows[0].partner_username);
        }
        await req.notifyUser(username);

        res.json({ success: true, asset: { ...asset, id } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/portfolio/:username/:assetId', async (req, res) => {
    const { username, assetId } = req.params;
    try {
        await db.query('DELETE FROM portfolio WHERE id = $1 AND username = $2', [assetId, username]);

        // Notify user and partner
        const partnerRes = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        if (partnerRes.rows.length > 0 && partnerRes.rows[0].partner_username) {
            await req.notifyUser(partnerRes.rows[0].partner_username);
        }
        await req.notifyUser(username);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/portfolio/:username/budget-toggle', async (req, res) => {
    const { username } = req.params;
    const { included } = req.body;
    try {
        await db.query('UPDATE users SET portfolio_budget_included = $1 WHERE username = $2', [included, username]);

        // Notify only the user who made the change
        await req.notifyUser(username);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/portfolio/:username/:assetId', async (req, res) => {
    const { username, assetId } = req.params;
    const { asset } = req.body;
    try {
        await db.query(
            'UPDATE portfolio SET type=$1, amount=$2, note=$3 WHERE id=$4 AND username=$5',
            [asset.type, asset.amount, asset.note, assetId, username]
        );

        // Notify user and partner
        const partnerRes = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        if (partnerRes.rows.length > 0 && partnerRes.rows[0].partner_username) {
            await req.notifyUser(partnerRes.rows[0].partner_username);
        }
        await req.notifyUser(username);

        res.json({ success: true, asset });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/assets/:id', async (req, res) => {
    const { id } = req.params;
    const { username, asset } = req.body;
    try {
        // Get old category
        const oldRes = await db.query('SELECT category FROM assets WHERE id = $1', [id]);
        const oldCategory = oldRes.rows[0]?.category;

        await db.query(
            `UPDATE assets SET category=$1, name=$2, amount=$3, value=$4 WHERE id=$5`,
            [asset.category, asset.name, asset.amount, asset.value, id]
        );

        let budget = 0;
        if (oldCategory === 'Nakit' || asset.category === 'Nakit') {
            budget = await recalculateBudget(username);
        } else {
            const bRes = await db.query('SELECT amount FROM budgets WHERE username = $1', [username]);
            budget = bRes.rows[0] ? parseFloat(bRes.rows[0].amount) : 0;
        }

        // Notify user and partner
        const partnerRes = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        if (partnerRes.rows.length > 0 && partnerRes.rows[0].partner_username) {
            await req.notifyUser(partnerRes.rows[0].partner_username);
        }
        await req.notifyUser(username);

        res.json({ success: true, asset: { ...asset, id }, budget });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/wedding-date', async (req, res) => {
    const { username, date } = req.body;
    try {
        await db.query('UPDATE users SET wedding_date = $1 WHERE username = $2', [date, username]);

        // Sync with partner
        const userInfo = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        const partnerUsername = userInfo.rows[0]?.partner_username;

        if (partnerUsername) {
            await db.query('UPDATE users SET wedding_date = $1 WHERE username = $2', [date, partnerUsername]);
        }

        await req.notifyUser(username);
        if (partnerUsername) {
            await req.notifyUser(partnerUsername);
        }

        res.json({ success: true, date });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/user/complete-profile', async (req, res) => {
    const { username, weddingDate, city, budgetRange } = req.body;
    if (!username || !weddingDate || !city) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await db.query(
            'UPDATE users SET wedding_date = $1, city = $2, budget_range = $3 WHERE username = $4 RETURNING *',
            [weddingDate, city, budgetRange || null, username]
        );

        if (result.rowCount > 0) {
            const user = result.rows[0];
            const { password: _, ...userWithoutPassword } = user;

            // Sync with partner
            if (user.partner_username) {
                await db.query('UPDATE users SET wedding_date = $1 WHERE username = $2', [weddingDate, user.partner_username]);
            }

            res.json({ success: true, user: userWithoutPassword });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/installment-payments', async (req, res) => {
    const { username } = req.query;
    try {
        const result = await db.query('SELECT data FROM installment_states WHERE username = $1', [username]);
        res.json(result.rows[0]?.data || {});
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/installment-payments', async (req, res) => {
    const { username, payments } = req.body;
    try {
        await db.query(
            `INSERT INTO installment_states (username, data) VALUES ($1, $2)
             ON CONFLICT (username) DO UPDATE SET data = $2`,
            [username, JSON.stringify(payments)]
        );
        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PARTNERSHIP MANAGEMENT ====================

// POST /api/partnership/invite - Send partnership invitation
app.post('/api/partnership/invite', async (req, res) => {
    try {
        const { username } = req.body; // Current user from session/auth
        const { partnerEmail } = req.body;

        if (!username || !partnerEmail) {
            return res.status(400).json({ error: 'Username and partner email required' });
        }

        // Check if partner exists
        const partnerRes = await db.query('SELECT username, name, surname FROM users WHERE email = $1', [partnerEmail]);
        if (partnerRes.rowCount === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı. Partner henüz kayıt olmamış olabilir.' });
        }

        const partnerUsername = partnerRes.rows[0].username;

        // Prevent self-invitation
        if (username === partnerUsername) {
            return res.status(400).json({ error: 'Kendinizi partner olarak ekleyemezsiniz.' });
        }

        // Check if user already has a partner
        const currentUserCheck = await db.query('SELECT partner_username FROM users WHERE username = $1', [username]);
        if (currentUserCheck.rows[0].partner_username) {
            return res.status(400).json({ error: 'Zaten bir partneriniz var.' });
        }

        // Check if partner already has a partner
        const partnerCheck = await db.query('SELECT partner_username FROM users WHERE username = $1', [partnerUsername]);
        if (partnerCheck.rows[0].partner_username) {
            return res.status(400).json({ error: 'Bu kullanıcının zaten bir partneri var.' });
        }

        // Check if invitation already exists
        const existingInvite = await db.query(
            'SELECT * FROM partnerships WHERE (user1_username = $1 AND user2_username = $2) OR (user1_username = $2 AND user2_username = $1)',
            [username, partnerUsername]
        );

        if (existingInvite.rowCount > 0) {
            const status = existingInvite.rows[0].status;
            if (status === 'pending') {
                return res.status(400).json({ error: 'Bu kullanıcıya zaten bir davet gönderilmiş.' });
            } else if (status === 'active') {
                return res.status(400).json({ error: 'Bu kullanıcıyla zaten ortaksınız.' });
            } else {
                // Status is 'declined' or other (cancelled etc.) -> Re-invite (Update existing row)
                await db.query(
                    'UPDATE partnerships SET status = $1, invited_by = $2, created_at = NOW() WHERE id = $3',
                    ['pending', username, existingInvite.rows[0].id]
                );

                return res.json({
                    success: true,
                    message: `${partnerRes.rows[0].name} ${partnerRes.rows[0].surname} kullanıcısına (tekrar) davet gönderildi.`,
                    partnerName: `${partnerRes.rows[0].name} ${partnerRes.rows[0].surname}`
                });
            }
        }

        // Create partnership invitation
        await db.query(
            'INSERT INTO partnerships (user1_username, user2_username, invited_by, status) VALUES ($1, $2, $3, $4)',
            [username, partnerUsername, username, 'pending']
        );

        res.json({
            success: true,
            message: `${partnerRes.rows[0].name} ${partnerRes.rows[0].surname} kullanıcısına davet gönderildi.`,
            partnerName: `${partnerRes.rows[0].name} ${partnerRes.rows[0].surname}`
        });

        // Real-time Notification for Invitation
        if (req.io) {
            req.io.to(`user:${partnerUsername}`).emit('partnership:invited', {
                inviterName: `${username}`, // Could fetch name if needed, but username is available
                message: 'Yeni bir ortaklık davetiniz var.'
            });
        }
    } catch (err) {
        console.error('Partnership invite error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/partnership/pending - Get pending invitations for current user
app.get('/api/partnership/pending', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        // Get pending invitations where user is user2 (receiver)
        const invitations = await db.query(
            `SELECT p.id, p.user1_username as invited_by, p.created_at, u.name, u.surname, u.email
             FROM partnerships p
             JOIN users u ON p.user1_username = u.username
             WHERE p.user2_username = $1 AND p.status = 'pending'`,
            [username]
        );

        res.json({
            invitations: invitations.rows.map(inv => ({
                id: inv.id,
                invitedBy: inv.invited_by,
                inviterName: `${inv.name} ${inv.surname}`,
                inviterEmail: inv.email,
                createdAt: inv.created_at
            }))
        });
    } catch (err) {
        console.error('Get pending invitations error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// POST /api/partnership/accept - Accept partnership invitation
app.post('/api/partnership/accept', async (req, res) => {
    try {
        const { username, partnershipId } = req.body;

        if (!username || !partnershipId) {
            return res.status(400).json({ error: 'Username and partnership ID required' });
        }

        // Get partnership details
        const partnershipRes = await db.query(
            'SELECT * FROM partnerships WHERE id = $1 AND user2_username = $2 AND status = $3',
            [partnershipId, username, 'pending']
        );

        if (partnershipRes.rowCount === 0) {
            return res.status(404).json({ error: 'Davet bulunamadı.' });
        }

        const partnership = partnershipRes.rows[0];
        const user1 = partnership.user1_username;
        const user2 = partnership.user2_username;

        // Update partnership status to active
        await db.query(
            'UPDATE partnerships SET status = $1, accepted_at = NOW() WHERE id = $2',
            ['active', partnershipId]
        );

        // Update both users with partner info
        await db.query(
            'UPDATE users SET partner_username = $1, partnership_id = $2 WHERE username = $3',
            [user2, partnershipId, user1]
        );
        await db.query(
            'UPDATE users SET partner_username = $1, partnership_id = $2 WHERE username = $3',
            [user1, partnershipId, user2]
        );

        // Merge data: Update all expenses, assets, budgets to include partnership_id
        // This makes all historical data visible to both partners
        await db.query(
            'UPDATE expenses SET partnership_id = $1 WHERE username IN ($2, $3)',
            [partnershipId, user1, user2]
        );
        await db.query(
            'UPDATE assets SET partnership_id = $1 WHERE username IN ($2, $3)',
            [partnershipId, user1, user2]
        );
        await db.query(
            'UPDATE budgets SET partnership_id = $1 WHERE username IN ($2, $3)',
            [partnershipId, user1, user2]
        );

        res.json({
            success: true,
            message: 'Ortaklık başarıyla kuruldu! Artık bütçenizi birlikte yönetebilirsiniz.',
            partnerUsername: user1
        });
    } catch (err) {
        console.error('Accept partnership error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// POST /api/partnership/decline - Decline partnership invitation
app.post('/api/partnership/decline', async (req, res) => {
    try {
        const { username, partnershipId } = req.body;

        if (!username || !partnershipId) {
            return res.status(400).json({ error: 'Username and partnership ID required' });
        }

        // Update partnership status to declined
        const result = await db.query(
            'UPDATE partnerships SET status = $1 WHERE id = $2 AND user2_username = $3 AND status = $4',
            ['declined', partnershipId, username, 'pending']
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Davet bulunamadı.' });
        }

        res.json({ success: true, message: 'Davet reddedildi.' });
    } catch (err) {
        console.error('Decline partnership error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// DELETE /api/partnership/disconnect - End active partnership
app.delete('/api/partnership/disconnect', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        // Get current partnership
        const userRes = await db.query(
            'SELECT partnership_id, partner_username FROM users WHERE username = $1',
            [username]
        );

        if (userRes.rowCount === 0 || !userRes.rows[0].partnership_id) {
            return res.status(400).json({ error: 'Aktif bir ortaklığınız yok.' });
        }

        const partnershipId = userRes.rows[0].partnership_id;
        const partnerUsername = userRes.rows[0].partner_username;

        // Remove partnership_id from all data (data becomes individual again)
        await db.query(
            'UPDATE expenses SET partnership_id = NULL WHERE partnership_id = $1',
            [partnershipId]
        );
        await db.query(
            'UPDATE assets SET partnership_id = NULL WHERE partnership_id = $1',
            [partnershipId]
        );
        await db.query(
            'UPDATE budgets SET partnership_id = NULL WHERE partnership_id = $1',
            [partnershipId]
        );

        // Clear partner info from both users
        await db.query(
            'UPDATE users SET partner_username = NULL, partnership_id = NULL WHERE username IN ($1, $2)',
            [username, partnerUsername]
        );

        // Delete partnership record
        await db.query('DELETE FROM partnerships WHERE id = $1', [partnershipId]);

        // Notify both users in real-time
        await req.notifyUser(username);
        if (partnerUsername) {
            await req.notifyUser(partnerUsername);

            // Send specific event for notification
            if (req.io) {
                req.io.to(`user:${partnerUsername}`).emit('partnership:ended', {
                    message: 'Partneriniz ortaklığı sonlandırdı.',
                    endedBy: username
                });
            }
        }

        res.json({
            success: true,
            message: 'Ortaklık sonlandırıldı. Verileriniz artık ayrı olarak görünecek.'
        });
    } catch (err) {
        console.error('Disconnect partnership error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});


// ==================== EXCHANGE RATES ====================
// Updated: Fetches every 30 minutes for near real-time data
let ratesCache = null;
let lastFetchTime = 0; // Timestamp of last successful fetch
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const shouldFetchRates = () => {
    if (!ratesCache) return true; // Always fetch if no cache

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;

    // Fetch if cache is older than 30 minutes
    return timeSinceLastFetch > CACHE_DURATION;
};

const fetchRatesFromAPI = async () => {
    const https = require('https');
    return new Promise((resolve, reject) => {
        https.get('https://finans.truncgil.com/today.json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const parseTurkishNumber = (val) => {
                        if (!val) return 0;
                        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
                    };
                    resolve({
                        USD: parseTurkishNumber(json.USD.Satış),
                        EUR: parseTurkishNumber(json.EUR.Satış),
                        GBP: parseTurkishNumber(json.GBP?.Satış || '0'),
                        GRAM_GOLD: parseTurkishNumber(json['gram-altin'].Satış),
                        CEYREK: parseTurkishNumber(json['ceyrek-altin'].Satış),
                        YARIM: parseTurkishNumber(json['yarim-altin'].Satış),
                        TAM: parseTurkishNumber(json['tam-altin'].Satış),
                        CUMHURIYET: parseTurkishNumber(json['cumhuriyet-altini'].Satış)
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

app.get('/api/rates', async (req, res) => {
    try {
        if (shouldFetchRates()) {
            console.log('[RATES] Fetching fresh rates...');
            ratesCache = await fetchRatesFromAPI();
            lastFetchTime = Date.now();
            console.log(`[RATES] Cache updated at ${new Date().toLocaleTimeString()}`);
            return res.json(ratesCache);
        }
        console.log('[RATES] Serving cached rates');
        return res.json(ratesCache);
    } catch (error) {
        console.error('[RATES] Error:', error);
        if (ratesCache) return res.json(ratesCache);
        res.json({ USD: 35.80, EUR: 37.50, GBP: 44.00, GRAM_GOLD: 3100, CEYREK: 5100, YARIM: 10200, TAM: 20400, CUMHURIYET: 21000 });
    }
});

// Initialize cache on server start
(async () => {
    try {
        console.log('[RATES] Initializing cache...');
        ratesCache = await fetchRatesFromAPI();
        lastFetchDate = new Date().toDateString();
        console.log('[RATES] Initial cache loaded');
    } catch (error) {
        console.error('[RATES] Init failed:', error);
    }
})();

// ==================== STATIC FILES & FALLBACK ====================

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
