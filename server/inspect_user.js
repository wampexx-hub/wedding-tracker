const db = require('./db');

const inspectUser = async () => {
    try {
        const res = await db.query('SELECT * FROM users WHERE email = $1', ['wampex@admin.com']);
        console.log(`Found ${res.rowCount} users.`);
        res.rows.forEach(u => {
            console.log('Columns:', Object.keys(u));
            console.log('User:', u);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectUser();
