const bcrypt = require('bcrypt');
const db = require('./db');

const hashPasswords = async () => {
    try {
        console.log('Fetching users...');
        const res = await db.query('SELECT username, password FROM users');
        const users = res.rows;

        console.log(`Found ${users.length} users. Hashing passwords...`);

        for (const user of users) {
            // Skip if password looks like a bcrypt hash (starts with $2b$)
            if (user.password && user.password.startsWith('$2b$')) {
                console.log(`Skipping ${user.username} (already hashed)`);
                continue;
            }

            if (user.password) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await db.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, user.username]);
                console.log(`Updated password for ${user.username}`);
            }
        }

        console.log('All passwords processed.');
        process.exit(0);
    } catch (err) {
        console.error('Error hashing passwords:', err);
        process.exit(1);
    }
};

hashPasswords();
