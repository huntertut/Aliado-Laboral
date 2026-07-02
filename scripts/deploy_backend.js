const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
  const cmd = `cd /root/Aliado-Laboral && git pull origin main && cd backend && npm run build 2>&1 | tail -5 && pm2 restart aliado-api && echo "✅ Backend reiniciado"`;
  c.exec(cmd, (err, stream) => {
    if (err) { console.error(err); c.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({
  host: '142.93.186.75',
  port: 22,
  username: 'root',
  password: 'yA7%pA1{vD7_rR2R'
});
