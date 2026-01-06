const db = require('./db');

async function createSessionTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS "session" (
              "sid" varchar NOT NULL COLLATE "default",
              "sess" json NOT NULL,
              "expire" timestamp(6) NOT NULL
            )
            WITH (OIDS=FALSE);
        `);

        // Add constraint if not exists (Postgres doesn't support IF NOT EXISTS for constraints easily, so we catch error)
        try {
            await db.query('ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;');
        } catch (e) {
            // Ignore if already exists
        }

        try {
            await db.query('CREATE INDEX "IDX_session_expire" ON "session" ("expire");');
        } catch (e) {
            // Ignore if index exists
        }

        console.log('Session table created successfully');
    } catch (error) {
        console.error('Error creating session table:', error);
    } finally {
        // We can't exit process if we use the pool from db.js because it might hang? 
        // Actually db.query uses pool.query. 
        process.exit();
    }
}

createSessionTable();
