const fs = require('fs');
const path = require('path');

function checkImage(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        if (buffer.length === 0) return "EMPTY FILE";

        // Simple header checks
        if (filePath.toLowerCase().endsWith('.png')) {
            if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
                return "INVALID PNG HEADER";
            }
        } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
            if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
                return "INVALID JPG HEADER";
            }
        }
        return "OK";
    } catch (e) {
        return "READ ERROR: " + e.message;
    }
}

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
            const result = checkImage(fullPath);
            if (result !== "OK") {
                console.error(`❌ BAD IMAGE: ${fullPath} -> ${result}`);
            } else {
                // Uncomment to see all checked files
                // console.log(`✅ OK: ${file}`);
            }
        }
    }
}

const dirsToCheck = [
    path.resolve(__dirname, 'assets'),
    path.resolve(__dirname, 'src', 'assets')
];

console.log("🔍 Scanning for corrupted images...");
dirsToCheck.forEach(d => {
    console.log(`Checking ${d}...`);
    scanDir(d);
});
console.log("Done.");
