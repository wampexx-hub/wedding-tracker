
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const DEFAULT_CATEGORIES = [
    { name: 'Düğün', color: '#ec4899', icon: 'heart' },
    { name: 'Nişan', color: '#a855f7', icon: 'ring' },
    { name: 'Mobilya', color: '#eab308', icon: 'sofa' },
    { name: 'Beyaz Eşya', color: '#3b82f6', icon: 'fridge' },
    { name: 'Elektronik Eşya', color: '#6366f1', icon: 'tv' },
    { name: 'Salon', color: '#10b981', icon: 'home' },
    { name: 'Yatak Odası', color: '#f43f5e', icon: 'bed' },
    { name: 'Mutfak', color: '#f97316', icon: 'utensils' },
    { name: 'Diğer', color: '#64748b', icon: 'more' },
];

async function seed() {
    try {
        await pool.query('BEGIN');

        // Clear existing just in case (optional, but good for reset)
        // await pool.query('DELETE FROM categories');

        for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
            const cat = DEFAULT_CATEGORIES[i];
            const query = `
                INSERT INTO categories (name, color, type, icon, rank)
                VALUES ($1, $2, 'expense', $3, $4)
                ON CONFLICT (name) DO NOTHING;
            `;
            await pool.query(query, [cat.name, cat.color, cat.icon, i]);
        }

        await pool.query('COMMIT');
        console.log("Categories seeded successfully");
        process.exit(0);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Error seeding categories:", err);
        process.exit(1);
    }
}

seed();
