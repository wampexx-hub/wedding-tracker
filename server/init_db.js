
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'expense',
    color VARCHAR(20) DEFAULT '#ec4899',
    icon VARCHAR(50),
    rank INTEGER DEFAULT 0
);
`;

async function init() {
    try {
        await pool.query(createTableQuery);
        console.log("Categories table created successfully");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
}

init();
