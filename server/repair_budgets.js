const db = require('./db');

// Helper to recalculate budget based on Cash assets (Copied from server.js with minor adjustments)
const recalculateBudget = async (username) => {
    // Get partnership info
    const userRes = await db.query('SELECT partner_username, partnership_id FROM users WHERE username = $1', [username]);
    const partnerUsername = userRes.rows[0]?.partner_username;
    const partnershipId = userRes.rows[0]?.partnership_id;

    if (!partnerUsername) {
        console.log(`Skipping ${username}: No partner.`);
        return;
    }

    // Calculate total cash assets (Personal + Partner's if exists)
    let cashTotal = 0;
    if (partnershipId) {
        // Query both by username OR partnership_id to be safe
        const res = await db.query(
            "SELECT SUM(value) as total FROM assets WHERE (username = $1 OR partnership_id = $2) AND category = 'Nakit'",
            [username, partnershipId]
        );
        cashTotal = parseFloat(res.rows[0].total || 0);
    } else {
        // Fallback if no partnership ID (shouldn't happen for paired users based on recent logic, but just in case)
        const res = await db.query("SELECT SUM(value) as total FROM assets WHERE (username = $1 OR username = $2) AND category = 'Nakit'", [username, partnerUsername]);
        cashTotal = parseFloat(res.rows[0].total || 0);
    }

    console.log(`User: ${username}, Partner: ${partnerUsername}, Calculated Total: ${cashTotal}`);

    // Update user's budget
    await db.query(
        `INSERT INTO budgets (username, amount, added_by) VALUES ($1, $2, $1)
         ON CONFLICT (username) DO UPDATE SET amount = $2`,
        [username, cashTotal]
    );

    // Update partner's budget
    await db.query(
        `INSERT INTO budgets (username, amount, added_by) VALUES ($1, $2, $1)
         ON CONFLICT (username) DO UPDATE SET amount = $2`,
        [partnerUsername, cashTotal]
    );
};

const repair = async () => {
    try {
        const res = await db.query("SELECT username FROM users WHERE partner_username IS NOT NULL");
        console.log(`Found ${res.rowCount} users with partners.`);

        for (const row of res.rows) {
            await recalculateBudget(row.username);
        }

        console.log('Repair complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

repair();
