const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'ts_errors_utf8.log');
if (!fs.existsSync(logPath)) {
    console.log("No log found.");
    process.exit(0);
}

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const fixes = {};

lines.forEach(line => {
    const match = line.match(/^(src\/.*?\.tsx?)\((\d+),(\d+)\): error TS(\d+): (.*)/);
    if (match) {
        const file = match[1];
        const row = parseInt(match[2], 10) - 1; // 0-indexed
        const col = parseInt(match[3], 10) - 1;
        const tsCode = match[4];
        const msg = match[5];

        if (!fixes[file]) fixes[file] = [];
        fixes[file].push({ row, col, tsCode, msg });
    }
});

for (const [file, fileFixes] of Object.entries(fixes)) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');
    let codeLines = content.split('\n');

    // Sort descending by row to avoid shifting
    fileFixes.sort((a, b) => b.row - a.row);

    for (const fix of fileFixes) {
        let lineStr = codeLines[fix.row];

        if (fix.tsCode === '2339' && fix.msg.includes("does not exist on type 'unknown'") || fix.msg.includes("does not exist on type '{}'")) {
            // Replace e.g. response.data.contactRequest -> (response.data as any).contactRequest
            // Or response.data.uploadUrl -> (response.data as any).uploadUrl
            // Or result.error -> (result as any).error

            // Extract the variable name before the property
            const propMatch = fix.msg.match(/Property '(.*?)' does not exist/);
            if (propMatch) {
                const prop = propMatch[1];
                // Regex to find `.prop` and replace its predecessor
                // Very naive: just cast common things
                lineStr = lineStr.replace(/response\.data\./g, '(response.data as any).');
                lineStr = lineStr.replace(/result\.error/g, '(result as any).error');
                lineStr = lineStr.replace(/error\.message/g, '(error as any).message');
                lineStr = lineStr.replace(/data\./g, '(data as any).');
            }
        } else if (fix.tsCode === '2345' && fix.msg.includes("Argument of type 'unknown' is not assignable to parameter of type 'SetStateAction")) {
            // e.g. setPosts(response.data) -> setPosts(response.data as any)
            lineStr = lineStr.replace(/response\.data\)/g, 'response.data as any)');
        } else if (fix.tsCode === '1323' && fix.msg.includes("Dynamic imports")) {
            // Replace `await import(...)` with `require(...)`
            lineStr = lineStr.replace(/await import\((.*?)\)/g, 'require($1)');
        } else if (fix.tsCode === '2307' && fix.msg.includes("Cannot find module")) {
            lineStr = lineStr.replace(/\.\.\/theme\/colors/, '../../theme/colors').replace(/\.\.\/\.\.\/\.\.\/theme\/colors/, '../../../../theme/colors');
        } else if (fix.tsCode === '2305' && fix.msg.includes("getReactNativePersistence")) {
            lineStr = lineStr.replace(/, getReactNativePersistence /, ' ');
        }

        codeLines[fix.row] = lineStr;
    }

    fs.writeFileSync(fullPath, codeLines.join('\n'), 'utf8');
    console.log("Auto-fixed:", file);
}
