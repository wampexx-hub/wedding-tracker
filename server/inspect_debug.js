const db = require('./db');

async function inspect() {
    try {
        console.log('--- USERS ---');
        const users = await db.query("SELECT username, partner_username, partnership_id FROM users WHERE username IN ('test2', 'test3') OR username IN ('TEST2', 'TEST3')");
        console.table(users.rows);

        console.log('\n--- BUDGETS ---');
        const budgets = await db.query("SELECT * FROM budgets WHERE username IN ('test2', 'test3', 'TEST2', 'TEST3')");
        console.table(budgets.rows);

        console.log('\n--- ASSETS (Nakit) ---');
        const assets = await db.query("SELECT username, category, value, amount FROM assets WHERE (username IN ('test2', 'test3', 'TEST2', 'TEST3')) AND category = 'Nakit'");
        console.table(assets.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
