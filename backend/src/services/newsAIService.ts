import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.warn("⚠️ GOOGLE_API_KEY no encontrada en .env");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ProcessedNews {
    titulo_clickeable: string;
    resumen_trabajador: string;
    resumen_pyme: string;
    resumen_abogado: string;
    pregunta_quiz: string;
}

/**
 * Process legal news text using Google Gemini AI
 */
export async function processLegalNews(originalText: string): Promise<ProcessedNews | null> {
    console.log("🚀 Enviando noticia a la IA de Google (Gemini)...");

    const prompt = `
    Eres un editor experto de una App Laboral en México.
    IMPORTANTE: Solo procesa noticias que ocurran en MÉXICO o que afecten directamente al sistema laboral mexicano (incluyendo entidades federativas como CDMX, Nuevo León, Jalisco, etc.).
    A continuación te paso una noticia legal o texto legislativo.
    Tu objetivo es reescribirla para que sea adictiva de leer y útil para diferentes perfiles.

    TEXTO ORIGINAL:
    """${originalText}"""

    INSTRUCCIONES DE FORMATO:
    Responde ÚNICAMENTE con un objeto JSON válido (sin texto antes ni después, sin markdown).
    Si el texto original NO tiene relación con México o su sistema laboral, devuelve un JSON con campos vacíos pero con la estructura correcta.

    Estructura del JSON requerido:
    {
      "titulo_clickeable": "Un título corto, intrigante y directo (max 15 palabras).",
      "resumen_trabajador": "Explicación sencilla para el empleado, sin tecnicismos, usando emojis. Enfocado en: ¿Cómo afecta mi sueldo, mis vacaciones o mis derechos?",
      "resumen_pyme": "Enfocado en el dueño de negocio (PYME). Habla de costes, nuevas obligaciones, multas y cómo evitar problemas legales. Tono urgente.",
      "resumen_abogado": "Enfoque técnico de alto nivel para abogados. Menciona artículos de la LFT, jurisprudencia o reformas específicas si aplica.",
      "pregunta_quiz": "Haz una pregunta sencilla de opción múltiple (solo la pregunta) sobre esta noticia para poner en la app."
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textoRespuesta = response.text();

        // Limpiar la respuesta de markdown
        const textoLimpio = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();

        const datosProcesados = JSON.parse(textoLimpio) as ProcessedNews;

        console.log("✅ Noticia procesada con éxito por IA.");
        return datosProcesados;

    } catch (error) {
        console.error("❌ Error procesando con Google AI:", error);
        return null;
    }
}
