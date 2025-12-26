require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetUsers() {
    const emails = ['dummy2@test.com', 'dummy3@test.com'];

    try {
        console.log('Resolving usernames for emails:', emails);
        const res = await pool.query('SELECT username FROM users WHERE email = ANY($1)', [emails]);
        const users = res.rows.map(r => r.username);

        if (users.length === 0) {
            console.log('No users found with these emails.');
            return;
        }

        console.log('Found usernames:', users);
        console.log('Resetting data...');

        // 1. Delete Expenses
        await pool.query('DELETE FROM expenses WHERE username = ANY($1)', [users]);
        console.log('Expenses deleted.');

        // 2. Delete Assets
        await pool.query('DELETE FROM assets WHERE username = ANY($1)', [users]);
        console.log('Assets deleted.');

        // 3. Delete Portfolio
        await pool.query('DELETE FROM portfolio WHERE username = ANY($1)', [users]);
        console.log('Portfolio deleted.');

        // 4. Reset Budgets
        await pool.query('UPDATE budgets SET amount = 0 WHERE username = ANY($1)', [users]);
        console.log('Budgets reset to 0.');

        // 5. Reset User Fields
        await pool.query('UPDATE users SET wedding_date = NULL, portfolio_budget_included = false WHERE username = ANY($1)', [users]);
        console.log('User metadata reset.');

        console.log('✅ All data cleared for test users.');
    } catch (err) {
        console.error('Error resetting users:', err);
    } finally {
        await pool.end();
    }
}

resetUsers();
