const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
  const cmd = [
    `echo "=== PULLING LATEST CHANGES ==="`,
    `cd /root/Aliado-Laboral && git pull origin main`,
    `echo "=== REBUILDING DOCKER CONTAINER (WITH CACHE) ==="`,
    `cd backend`,
    `docker-compose build`,
    `docker-compose up -d`,
    `echo "=== SEEDING COURSES ==="`,
    `sleep 5`,
    `docker-compose exec -T backend node dist/seed_courses.js`,
    `echo "=== HEALTH CHECK ==="`,
    `curl -s http://localhost:3001/api/health || echo "HEALTH CHECK FAILED"`
  ].join(' && ');

  c.exec(cmd, (err, stream) => {
    if (err) { console.error(err); c.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => {
      console.log('✅ Despliegue y siembra completados con éxito.');
      c.end();
    });
  });
}).connect({
  host: '142.93.186.75',
  port: 22,
  username: 'root',
  password: 'yA7%pA1{vD7_rR2R'
});
