const { Pool } = require('pg');

const pool = new Pool({
    user: 'wedding_user',
    host: 'localhost',
    database: 'wedding_db',
    password: 'wedding_pass',
    port: 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
