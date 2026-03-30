const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Recreate test worker using python since bcrypt is already in the node modules
    const cmd = `python3 -c "
import sqlite3, uuid, hashlib, time

db = sqlite3.connect('/root/Aliado-Laboral/backend/prisma/dev.db')
cur = db.cursor()

# Check if already exists
existing = cur.execute(\\\"SELECT id FROM User WHERE email='worker_free@test.com'\\\").fetchone()
if existing:
    print('User already exists:', existing[0])
    db.close()
    exit()

# Create user with a known password hash (bcrypt of 'WorkerTest123!')
# Since we can't easily bcrypt in python, we insert with a temp marker and update via node later
# Actually let's just note the user needs to be recreated via the app's register endpoint
print('User does not exist. Will create via API.')
db.close()
"`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' });
