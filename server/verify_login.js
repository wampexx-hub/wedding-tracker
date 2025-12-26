const bcrypt = require('bcrypt');
const db = require('./db');

const verifyLogin = async () => {
    const email = 'wampex@admin.com';
    const password = 'admin123';

    try {
        console.log(`Checking user: ${email}...`);
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rowCount === 0) {
            console.log('User not found!');
            process.exit(1);
        }

        const user = result.rows[0];
        console.log(`User found: ${user.username}, ID: ${user.id || 'N/A'}`);
        console.log(`Stored Hash: ${user.password}`);

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            console.log('SUCCESS: Password matches hash in DB.');
        } else {
            console.log('FAILURE: Password does NOT match hash.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error verifying login:', err);
        process.exit(1);
    }
};

verifyLogin();
