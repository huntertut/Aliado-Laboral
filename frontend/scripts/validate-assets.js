const fs = require('fs');
const path = require('path');

/**
 * Script de Validación de Assets para Aliado Laboral
 * Verifica que los archivos con extensión de imagen tengan cabeceras válidas.
 * Previene errores de compilación en Android (AAPT) e iOS.
 */

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let errorCount = 0;
let scannedCount = 0;

function checkImageIntegrity(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);

        if (buffer.length === 0) return { valid: false, reason: "EMPTY FILE (0 bytes)" };

        const ext = path.extname(filePath).toLowerCase();

        // Verificación de Numéros Mágicos (Magic Bytes)
        if (ext === '.png') {
            // PNG debe empezar con: 89 50 4E 47 0D 0A 1A 0A
            if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
                return { valid: false, reason: "INVALID PNG HEADER (Posiblemente JPG renombrado)" };
            }
        }
        else if (ext === '.jpg' || ext === '.jpeg') {
            // JPG debe empezar con: FF D8
            if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
                return { valid: false, reason: "INVALID JPG HEADER" };
            }
        }
        else if (ext === '.webp') {
            // WebP es complejo (RIFF...WEBP), verificamos RIFF
            if (buffer[0] !== 0x52 || buffer[1] !== 0x49 || buffer[2] !== 0x46 || buffer[3] !== 0x46) {
                return { valid: false, reason: "INVALID WEBP HEADER (No es RIFF)" };
            }
        }

        return { valid: true };

    } catch (e) {
        return { valid: false, reason: `READ ERROR: ${e.message}` };
    }
}

function scanDirectory(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`${YELLOW}⚠ Directorio no encontrado, saltando: ${directory}${RESET}`);
        return;
    }

    const items = fs.readdirSync(directory);

    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (item !== 'node_modules' && item !== '.git') {
                scanDirectory(fullPath);
            }
        } else {
            if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
                scannedCount++;
                const result = checkImageIntegrity(fullPath);

                if (!result.valid) {
                    console.error(`${RED}❌ ASSET CORRUPTO: ${fullPath}${RESET}`);
                    console.error(`   Causa: ${result.reason}`);
                    errorCount++;
                }
            }
        }
    }
}

// Directorios a escanear
const targetDirs = [
    path.resolve(__dirname, '../assets'),
    path.resolve(__dirname, '../src/assets')
];

console.log("🔍 Iniciando escaneo de integridad de assets...");
console.log("=============================================");

targetDirs.forEach(dir => scanDirectory(dir));

console.log("=============================================");
if (errorCount > 0) {
    console.error(`${RED}🚫 SE ENCONTRARON ${errorCount} ARCHIVOS CORRUPTOS.${RESET}`);
    console.error("Corrige estos archivos antes de intentar compilar.");
    process.exit(1); // Fail the build/script
} else {
    console.log(`${GREEN}✅ Todo limpio. ${scannedCount} imágenes verificadas correctamente.${RESET}`);
    process.exit(0);
}
