import { createWorker } from 'tesseract.js';

/**
 * Extracts text from an image buffer and looks for a Mexican Professional License (Cédula).
 * @param imageBuffer Buffer of the image (PNG/JPG)
 * @returns { cedula: string | null, rawText: string }
 */
export const extractTextFromImage = async (imageBuffer: Buffer): Promise<{ cedula: string | null, rawText: string }> => {
    let worker = null;
    try {
        console.log('🔍 [OCR] Iniciando Tesseract Worker...');
        worker = await createWorker('spa'); // Spanish language

        const ret = await worker.recognize(imageBuffer);
        const text = ret.data.text;

        console.log('📄 [OCR] Texto extraído (longitud):', text.length);

        // Regex for Cédula Profesional:
        // Usually 7-8 digits. Sometimes preceded by "CEDULA" or "PROF".
        // We act broadly: look for standalone 7-8 digit sequences.
        const cedulaRegex = /\b\d{7,8}\b/g;
        const matches = text.match(cedulaRegex);

        const foundCedula = matches ? matches[0] : null;

        if (foundCedula) {
            console.log('✅ [OCR] Cédula encontrada:', foundCedula);
        } else {
            console.log('⚠️ [OCR] No se detectó patrón de cédula.');
        }

        await worker.terminate();
        return { cedula: foundCedula, rawText: text };

    } catch (error) {
        console.error('❌ [OCR] Error procesando imagen:', error);
        if (worker) await worker.terminate();
        throw new Error('Error en servicio de OCR');
    }
};

/**
 * Extracts settlement amount and potential dates from a document text.
 * @param text The raw text from OCR
 * @returns { amount: number | null, date: string | null }
 */
export const extractSettlementDetails = (text: string): { amount: number | null, date: string | null } => {
    // 1. Extract Amounts (Look for $ or "pesos")
    // Regex: $ followed by digits, commas, dots.
    // Examples: $100,000.00, $ 45,000, 50000 pesos
    const amountRegex = /\$\s?([0-9]{1,3}(,[0-9]{3})*(\.[0-9]{2})?)/g;
    const matches = text.match(amountRegex);

    let maxAmount = 0;

    if (matches) {
        // We assume the settlement amount is usually the largest dollar figure in the doc
        // (Risk: could be a penalty or aggregate, but it's a good heuristic for MVP)
        matches.forEach(m => {
            const clean = m.replace(/[^0-9.]/g, ''); // Remove $ and commas
            const val = parseFloat(clean);
            if (val > maxAmount) maxAmount = val;
        });
    }

    // 2. Extract Date (Date of agreement)
    // Regex: DD/MM/YYYY or DD de [Month] de YYYY
    const dateRegex = /(\d{1,2})\s?(de|\/|-)\s?(\d{1,2}|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\w*\s?(de|\/|-)\s?(\d{4})/i;
    const dateMatch = text.match(dateRegex);
    const foundDate = dateMatch ? dateMatch[0] : null;

    return {
        amount: maxAmount > 0 ? maxAmount : null,
        date: foundDate
    };
};
