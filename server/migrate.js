const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_FILE = path.join(__dirname, 'data.json');

const migrate = async () => {
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(rawData);

        console.log('Starting migration...');

        // 1. Users
        for (const username in data.users) {
            const u = data.users[username];
            // Ensure email is unique (some dummy data might have duplicates, though JSON keys are unique)
            // We use ON CONFLICT DO NOTHING to be safe.

            try {
                await db.query(
                    `INSERT INTO users (username, password, name, surname, email, phone, is_admin, created_at, google_id, avatar, wedding_date, portfolio_budget_included)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                     ON CONFLICT (username) DO NOTHING`,
                    [
                        u.username, u.password || null, u.name, u.surname, u.email || `${u.username}@example.com`, u.phone || null,
                        u.isAdmin || false, u.createdAt, u.googleId || null, u.avatar || null,
                        u.weddingDate || null, u.portfolioBudgetIncluded || false
                    ]
                );

                // Assets
                if (u.assets && Array.isArray(u.assets)) {
                    for (const a of u.assets) {
                        await db.query(
                            `INSERT INTO assets (id, username, category, name, amount, value, unit_price, type, date)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                             ON CONFLICT (id) DO NOTHING`,
                            [
                                a.id, username, a.category, a.name, a.amount || a.quantity, a.value,
                                a.unitPrice || null, a.type || null, a.date
                            ]
                        );
                    }
                }

                // Portfolio
                if (u.portfolio && Array.isArray(u.portfolio)) {
                    for (const p of u.portfolio) {
                        await db.query(
                            `INSERT INTO portfolio (id, username, type, amount, note, added_at)
                             VALUES ($1, $2, $3, $4, $5, $6)
                             ON CONFLICT (id) DO NOTHING`,
                            [
                                p.id, username, p.type, p.amount, p.note || null, p.addedAt
                            ]
                        );
                    }
                }
            } catch (err) {
                console.error(`Error migrating user ${username}:`, err.message);
            }
        }
        console.log(`Migrated ${Object.keys(data.users).length} users.`);

        // 2. Expenses
        if (data.expenses && Array.isArray(data.expenses)) {
            for (const e of data.expenses) {
                try {
                    await db.query(
                        `INSERT INTO expenses (id, username, title, category, price, vendor, source, date, is_installment, installment_count, status, notes, monthly_payment, image_url, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                         ON CONFLICT (id) DO NOTHING`,
                        [
                            e.id, e.username, e.title, e.category, e.price, e.vendor, e.source, e.date,
                            e.isInstallment || false, e.installmentCount || 1, e.status, e.notes || '',
                            e.monthlyPayment || 0, e.imageUrl || null, e.createdAt
                        ]
                    );
                } catch (err) {
                    console.error(`Error migrating expense ${e.id}:`, err.message);
                }
            }
            console.log(`Migrated ${data.expenses.length} expenses.`);
        }

        // 3. Budgets
        if (data.budgets) {
            for (const username in data.budgets) {
                try {
                    await db.query(
                        `INSERT INTO budgets (username, amount) VALUES ($1, $2)
                         ON CONFLICT (username) DO UPDATE SET amount = $2`,
                        [username, data.budgets[username]]
                    );
                } catch (err) {
                    console.error(`Error migrating budget for ${username}:`, err.message);
                }
            }
            console.log(`Migrated budgets.`);
        }

        // 4. Installment States
        if (data.installmentPayments) {
            for (const username in data.installmentPayments) {
                try {
                    await db.query(
                        `INSERT INTO installment_states (username, data) VALUES ($1, $2)
                         ON CONFLICT (username) DO UPDATE SET data = $2`,
                        [username, JSON.stringify(data.installmentPayments[username])]
                    );
                } catch (err) {
                    console.error(`Error migrating installments for ${username}:`, err.message);
                }
            }
            console.log(`Migrated installment states.`);
        }

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
