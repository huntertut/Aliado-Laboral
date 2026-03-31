const { Client } = require('ssh2');

console.log('Iniciando conexión SSH a DigitalOcean (142.93.186.75)...');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Client Ready. Ejecutando actualización Forzada...');
  const cmd = 'cd Aliado-Laboral && git fetch --all && git reset --hard origin/main && cd backend && docker compose build && docker compose up -d';
  console.log('Ejecutando: ' + cmd);
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
        console.error('Error al ejecutar comando:', err);
        conn.end();
        return;
    }
    stream.on('close', (code, signal) => {
      console.log('Proceso terminado con código: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect({
  host: '142.93.186.75',
  port: 22,
  username: 'root',
  password: 'yA7%pA1{vD7_rR2R'
});
