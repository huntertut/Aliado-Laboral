const { Client } = require('ssh2');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

function runCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '', errOut = '';
            stream.on('data', d => out += d).on('stderr', d => errOut += d)
                  .on('close', (code) => {
                      if (code !== 0) reject(new Error(errOut || out));
                      else resolve({ out, errOut });
                  });
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    try {
        const remoteCmd = `sqlite3 /root/Aliado-Laboral/backend/prisma/dev.db "
-- Delete LawyerSubscription for fake SYNC_ lawyers (except lic.samuel)
DELETE FROM LawyerSubscription WHERE lawyerId IN (
  SELECT l.id FROM Lawyer l
  JOIN User u ON u.id = l.userId
  WHERE l.licenseNumber LIKE 'SYNC_%'
  AND u.email != 'lic.samuel@hotmail.com'
);
-- Delete LawyerProfile for fake SYNC_ lawyers
DELETE FROM LawyerProfile WHERE lawyerId IN (
  SELECT l.id FROM Lawyer l
  JOIN User u ON u.id = l.userId
  WHERE l.licenseNumber LIKE 'SYNC_%'
  AND u.email != 'lic.samuel@hotmail.com'
);
-- Delete Lawyer record
DELETE FROM Lawyer WHERE licenseNumber LIKE 'SYNC_%'
AND userId NOT IN (SELECT id FROM User WHERE email='lic.samuel@hotmail.com');
-- Convert fake SYNC_ Users back to worker role
UPDATE User SET role='worker' WHERE id IN (
  SELECT id FROM User WHERE role='lawyer'
  AND email NOT IN (
    'lawyer_basic@test.com','lawyer_pro@test.com',
    'lawyer_pitch_1771544725668@lawyer.com','lawyer_pitch_1771545095822@lawyer.com',
    'lawyer_pitch_1771545265567@lawyer.com','lawyer.v.1771547291295@test.com',
    'lawyer.v.1771547388218@test.com','lawyer.v.1771547442202@test.com',
    'lic.samuel@hotmail.com'
  )
);
SELECT role, COUNT(*) FROM User GROUP BY role;
"`;
        const { out } = await runCommand(conn, remoteCmd);
        console.log("CLEANUP:\\n", out);

    } catch(e) { console.log('Find error:', e.message); }
    conn.end();
}).connect(CONN);
