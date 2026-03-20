const { Client } = require('ssh2');

const command = process.argv[2];
if (!command) {
    console.error('No command provided.');
    process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect({
    host: '142.93.186.75',
    port: 22,
    username: 'root',
    password: 'Z3lG$@*gN(H!n_q',
    readyTimeout: 20000
});
