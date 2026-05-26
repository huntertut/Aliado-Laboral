const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function main() {
    const commands = process.argv.slice(2).join(' ');
    
    try {
        await ssh.connect({
            host: '142.93.186.75',
            username: 'root',
            password: 'yA7%pA1{vD7_rR2R'
        });
        
        const result = await ssh.execCommand(commands, { cwd: '/' });
        console.log('STDOUT: ' + result.stdout);
        if (result.stderr) {
            console.error('STDERR: ' + result.stderr);
        }
    } catch (e) {
        console.error('CONNECTION ERROR: ', e);
    } finally {
        ssh.dispose();
    }
}

main();
