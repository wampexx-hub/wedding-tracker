const db = require('./db');

const checkDuplicates = async () => {
    try {
        const res = await db.query('SELECT id, username, email, password FROM users WHERE email = $1', ['wampex@admin.com']);
        console.log(`Found ${res.rowCount} users with email wampex@admin.com`);
        res.rows.forEach(u => {
            console.log(`User: ${u.username}, ID: ${u.id}, Pass: ${u.password ? u.password.substring(0, 15) + '...' : 'NULL'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDuplicates();
