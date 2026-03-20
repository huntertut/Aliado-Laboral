const { Client } = require('ssh2');
const conn = new Client();

const remoteScript = `
cat << 'EOF' > /tmp/cwp_automator.js
const fs = require('fs');

function fix(file, rootFolder) {
    if (!fs.existsSync(file)) return console.log("[MISSING] " + file);
    let text = fs.readFileSync(file, 'utf8');
    
    // 1. Fix DocumentRoot and Directory paths unconditionally
    text = text.replace(/DocumentRoot \\/home\\/savecom\\/public_html[^\\n]*/g, 'DocumentRoot /home/savecom/public_html/' + rootFolder);
    text = text.replace(/<Directory "\\/home\\/savecom\\/public_html[^"]*">/g, '<Directory "/home/savecom/public_html/' + rootFolder + '/">');
    
    // 2. Remove all CWP bugged SSL clone entries
    text = text.replace(/^\\s*SSLCertificateFile[^\\n]+\\n/gm, '');
    text = text.replace(/^\\s*SSLCertificateKeyFile[^\\n]+\\n/gm, '');
    text = text.replace(/^\\s*SSLCertificateChainFile[^\\n]+\\n/gm, '');
    
    // 3. Inject strict SSL cert paths
    const cert = "/etc/pki/tls/certs/" + rootFolder + ".cert";
    const key = "/etc/pki/tls/private/" + rootFolder + ".key";
    const bundle = "/etc/pki/tls/certs/" + rootFolder + ".bundle";
    
    // 4. Attach the single clean block under Engine
    text = text.replace(/SSLEngine on\\r?\\n/, 'SSLEngine on\\n        SSLCertificateFile ' + cert + '\\n        SSLCertificateKeyFile ' + key + '\\n        SSLCertificateChainFile ' + bundle + '\\n');
    
    fs.writeFileSync(file, text);
    console.log("[FIXED SUCCESS] Config Rebuilt: " + file);
}

console.log("Starting CWP Config Injector...");
fix('/usr/local/apache/conf.d/vhosts/juancbonilla.edu.mx.ssl.conf', 'juancbonilla.edu.mx');
fix('/usr/local/apache/conf.d/vhosts/juancbonilla.edu.mx.conf', 'juancbonilla.edu.mx');
fix('/usr/local/apache/conf.d/vhosts/higeo.juancbonilla.edu.mx.ssl.conf', 'higeo.juancbonilla.edu.mx');
fix('/usr/local/apache/conf.d/vhosts/higeo.juancbonilla.edu.mx.conf', 'higeo.juancbonilla.edu.mx');
EOF

node /tmp/cwp_automator.js

echo ""
echo "[INFO] Securing strict suPHP Ownership and Execution rules..."
chown -R savecom:savecom /home/savecom/public_html/juancbonilla.edu.mx
chown -R savecom:savecom /home/savecom/public_html/higeo.juancbonilla.edu.mx
chmod -R 755 /home/savecom/public_html/juancbonilla.edu.mx
chmod -R 755 /home/savecom/public_html/higeo.juancbonilla.edu.mx

echo "[INFO] Shutting down OS parasitic processes and restarting CWP Master Engine..."
systemctl stop httpd
killall -9 httpd
/usr/local/apache/bin/apachectl start
echo "[SUCCESS] DEPLOYMENT AUTOMATION COMPLETE."
`;

conn.on('ready', () => {
    conn.exec(remoteScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
            .on('data', d => process.stdout.write(d))
            .stderr.on('data', d => process.stderr.write(d));
    });
}).connect({ host: '142.93.186.75', port: 22, username: 'root', password: 'Z3lG$@*gN(H!n_q', readyTimeout: 15000 });
