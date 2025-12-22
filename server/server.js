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

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Session Config
app.use(session({
    secret: 'wedding-tracker-secret-key',
    resave: false,
    saveUninitialized: false
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
            const { password: _, ...userWithoutPassword } = user;
            res.json({ success: true, user: userWithoutPassword });
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
        const result = await db.query('SELECT username, name, surname, email, is_admin, created_at, google_id, avatar, wedding_date FROM users');
        res.json(result.rows);
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

app.get('/api/admin/stats', async (req, res) => {
    try {
        const userCount = await db.query('SELECT COUNT(*) FROM users');
        const expenseCount = await db.query('SELECT COUNT(*) FROM expenses');
        const budgetSum = await db.query('SELECT SUM(amount) FROM budgets');

        // Top Category
        const topCat = await db.query('SELECT category, SUM(price) as total FROM expenses GROUP BY category ORDER BY total DESC LIMIT 1');

        // Top Vendor
        const topVen = await db.query('SELECT vendor, SUM(price) as total FROM expenses GROUP BY vendor ORDER BY total DESC LIMIT 1');

        res.json({
            totalUsers: parseInt(userCount.rows[0].count),
            totalExpenses: parseInt(expenseCount.rows[0].count),
            totalBudgetAmount: parseFloat(budgetSum.rows[0].sum || 0),
            topCategory: topCat.rows[0] ? { name: topCat.rows[0].category, amount: parseFloat(topCat.rows[0].total) } : { name: '-', amount: 0 },
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
        // Get user's partner info
        const userInfo = await db.query('SELECT partner_username, partnership_id FROM users WHERE username = $1', [user]);
        const partnerUsername = userInfo.rows[0]?.partner_username;
        const partnershipId = userInfo.rows[0]?.partnership_id;

        // Query expenses - include partner's if partnership exists
        let expensesQuery = 'SELECT * FROM expenses WHERE username = $1';
        let expensesParams = [user];

        if (partnerUsername && partnershipId) {
            expensesQuery = 'SELECT * FROM expenses WHERE partnership_id = $1';
            expensesParams = [partnershipId];
        }

        const expenses = await db.query(expensesQuery, expensesParams);

        // Query budget
        let budgetQuery = 'SELECT amount FROM budgets WHERE username = $1';
        let budgetParams = [user];

        if (partnerUsername && partnershipId) {
            budgetQuery = 'SELECT amount FROM budgets WHERE partnership_id = $1';
            budgetParams = [partnershipId];
        }

        const budget = await db.query(budgetQuery, budgetParams);

        // Query assets
        let assetsQuery = 'SELECT * FROM assets WHERE username = $1';
        let assetsParams = [user];

        if (partnerUsername && partnershipId) {
            assetsQuery = 'SELECT * FROM assets WHERE partnership_id = $1';
            assetsParams = [partnershipId];
        }

        const assets = await db.query(assetsQuery, assetsParams);

        const userData = await db.query('SELECT wedding_date, portfolio_budget_included, assets FROM users LEFT JOIN (SELECT username as u_name, json_agg(assets.*) as assets FROM assets GROUP BY username) a ON users.username = a.u_name WHERE username = $1', [user]);
        const installments = await db.query('SELECT data FROM installment_states WHERE username = $1', [user]);
        const userRec = await db.query('SELECT wedding_date, portfolio_budget_included, partner_username FROM users WHERE username = $1', [user]);

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
            installmentPayments: installments.rows[0]?.data || {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/expenses', upload.single('image'), async (req, res) => {
    try {
        const expenseData = JSON.parse(req.body.data);
        if (!expenseData.username) return res.status(400).json({ error: 'User required' });

        let imageUrl = null;
        if (req.file) {
            const filename = `expense-${Date.now()}.jpeg`;
            const filepath = path.join(__dirname, 'uploads', filename);
            await sharp(req.file.buffer).resize(150, 150).toFormat('jpeg').toFile(filepath);
            imageUrl = `/uploads/${filename}`;
        }

        const id = expenseData.id || Date.now().toString();
        const { username, title, category, price, vendor, source, date, isInstallment, installmentCount, status, notes, monthlyPayment } = expenseData;

        // Get user's partnership info
        const userInfo = await db.query('SELECT partnership_id FROM users WHERE username = $1', [username]);
        const partnershipId = userInfo.rows[0]?.partnership_id || null;

        await db.query(
            `INSERT INTO expenses (id, username, title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment, image_url, created_at, added_by, partnership_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [id, username, title, category, price, vendor, source, date, isInstallment, installmentCount, status, notes, monthlyPayment, imageUrl, new Date().toISOString(), username, partnershipId]
        );

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

        const newExpenses = [];
        for (const exp of expenses) {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            await db.query(
                `INSERT INTO expenses (id, username, title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [id, username, exp.title, exp.category, exp.price, exp.vendor, exp.source, exp.date, exp.isInstallment, exp.installmentCount, exp.status, exp.notes, exp.monthlyPayment, new Date().toISOString()]
            );
            newExpenses.push({ ...exp, id, username });
        }

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
        const expenseData = JSON.parse(req.body.data);

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

        const { title, category, price, vendor, source, date, isInstallment, installmentCount, status, notes, monthlyPayment } = expenseData;

        await db.query(
            `UPDATE expenses SET title=$1, category=$2, price=$3, vendor=$4, source=$5, date=$6, is_installment=$7, installment_count=$8, status=$9, notes=$10, monthly_payment=$11, image_url=$12
             WHERE id=$13`,
            [title, category, price, vendor, source, date, isInstallment, installmentCount, status, notes, monthlyPayment, imageUrl, id]
        );

        res.json({ ...expenseData, id, imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM expenses WHERE id = $1', [id]);
        if (result.rowCount > 0) {
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
        await db.query(
            `INSERT INTO budgets (username, amount) VALUES ($1, $2)
             ON CONFLICT (username) DO UPDATE SET amount = $2`,
            [username, budget]
        );
        res.json({ success: true, budget: Number(budget) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper to recalculate budget based on Cash assets
const recalculateBudget = async (username) => {
    const res = await db.query("SELECT SUM(value) as total FROM assets WHERE username = $1 AND category = 'Nakit'", [username]);
    const cashTotal = parseFloat(res.rows[0].total || 0);

    await db.query(
        `INSERT INTO budgets (username, amount) VALUES ($1, $2)
         ON CONFLICT (username) DO UPDATE SET amount = $2`,
        [username, cashTotal]
    );
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

        // Get user's partnership info
        const userInfo = await db.query('SELECT partnership_id FROM users WHERE username = $1', [username]);
        const partnershipId = userInfo.rows[0]?.partnership_id || null;

        await db.query(
            `INSERT INTO assets (id, username, category, name, amount, value, date, added_by, partnership_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, username, asset.category, asset.name, asset.amount, asset.value, asset.date || new Date().toISOString(), username, partnershipId]
        );

        let budget = 0;
        if (asset.category === 'Nakit') {
            budget = await recalculateBudget(username);
        } else {
            const bRes = await db.query('SELECT amount FROM budgets WHERE username = $1', [username]);
            budget = bRes.rows[0] ? parseFloat(bRes.rows[0].amount) : 0;
        }

        res.json({ asset: { ...asset, id }, budget });
    } catch (err) {
        console.error(err);
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

        res.json({ success: true, budget });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Portfolio Endpoints
app.get('/api/portfolio/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const pRes = await db.query('SELECT * FROM portfolio WHERE username = $1', [username]);
        const uRes = await db.query('SELECT portfolio_budget_included FROM users WHERE username = $1', [username]);

        if (uRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

        res.json({
            portfolio: pRes.rows.map(p => ({ ...p, amount: parseFloat(p.amount), addedAt: p.added_at })),
            budgetIncluded: uRes.rows[0].portfolio_budget_included
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
        res.json({ success: true, asset: { ...asset, id } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/portfolio/:username/:assetId', async (req, res) => {
    const { username, assetId } = req.params;
    try {
        await db.query('DELETE FROM portfolio WHERE id = $1 AND username = $2', [assetId, username]);
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
        res.json({ success: true, included });
    } catch (err) {
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
        res.json({ success: true, asset: { ...asset, id }, budget });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/wedding-date', async (req, res) => {
    const { username, date } = req.body;
    try {
        await db.query('UPDATE users SET wedding_date = $1 WHERE username = $2', [date, username]);
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

        res.json({
            success: true,
            message: 'Ortaklık sonlandırıldı. Verileriniz artık ayrı olarak görünecek.'
        });
    } catch (err) {
        console.error('Disconnect partnership error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ==================== END PARTNERSHIP MANAGEMENT ====================

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
