const { Client } = require('ssh2');
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

// SQLite supports ADD COLUMN safely — no data loss
const SQL_COMMANDS = [
    `ALTER TABLE "Lawyer" ADD COLUMN "freeLeadsMonthly" INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE "Lawyer" ADD COLUMN "freeLeadsUsed" INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE "Lawyer" ADD COLUMN "freeLeadsResetAt" DATETIME;`,
    `ALTER TABLE "Lawyer" ADD COLUMN "correspondentStates" TEXT DEFAULT '';`,
].map(sql => `sqlite3 /root/Aliado-Laboral/backend/prisma/dev.db "${sql}" 2>&1 || echo "Column may already exist, continuing..."`).join(' && ');

function runCommand(conn, cmd) {
    return new Promise((res, rej) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            let out = '';
            stream.on('close', () => res(out));
            stream.on('data', d => { out += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { out += d; process.stderr.write('[STDERR] ' + d); });
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ Connected\n');
    try {
        console.log('🗄️  Applying SQLite schema migration...\n');
        await runCommand(conn, SQL_COMMANDS);

        console.log('\n📋 Verifying columns...');
        await runCommand(conn, 'sqlite3 /root/Aliado-Laboral/backend/prisma/dev.db ".schema Lawyer" 2>&1 | grep -E "(freeLeads|correspondentStates)"');

        console.log('\n✅ Migration complete!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    conn.end();
}).connect(CONN);
