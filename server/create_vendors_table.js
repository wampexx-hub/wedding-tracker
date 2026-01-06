const db = require('./db');

async function createVendorsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS vendors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                city VARCHAR(100) NOT NULL,
                contact_info JSONB DEFAULT '{}'::jsonb,
                image_url TEXT,
                is_featured BOOLEAN DEFAULT false,
                rank INTEGER DEFAULT 0,
                click_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Vendors table created successfully');
    } catch (error) {
        console.error('Error creating vendors table:', error);
    } finally {
        process.exit();
    }
}

createVendorsTable();
