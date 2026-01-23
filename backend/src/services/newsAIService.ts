import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.warn("⚠️ GROQ_API_KEY no encontrada en .env");
}

export interface ProcessedNews {
    titulo_clickeable: string;
    resumen_trabajador: string;
    resumen_pyme: string;
    resumen_abogado: string;
    pregunta_quiz: string;
}

/**
 * Process legal news text using Groq AI (Llama 3)
 */
export async function processLegalNews(originalText: string): Promise<ProcessedNews | null> {
    console.log("🚀 Enviando noticia a la IA de Groq (Llama 3)...");

    const systemPrompt = `
    Eres un editor experto de una App Laboral en México.
    IMPORTANTE: Solo procesa noticias que ocurran en MÉXICO o que afecten directamente al sistema laboral mexicano.
    
    Tu objetivo es reescribir la noticia para que sea adictiva y útil.
    
    INSTRUCCIONES DE FORMATO:
    Responde ÚNICAMENTE con un objeto JSON válido.
    NO incluyas texto antes ni después del JSON (sin markdown ' \`\`\`json ').
    
    Estructura JSON requerida:
    {
      "titulo_clickeable": "Un título corto, intrigante y directo (max 15 palabras).",
      "resumen_trabajador": "Explicación sencilla para el empleado, sin tecnicismos.",
      "resumen_pyme": "Enfocado en el dueño de negocio. Tono urgente.",
      "resumen_abogado": "Enfoque técnico para abogados.",
      "pregunta_quiz": "Pregunta sencilla de opción múltiple (solo la pregunta)."
    }
    `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `TEXTO ORIGINAL:\n"""${originalText}"""` }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                response_format: { type: "json_object" } // Force JSON
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Groq API Error: ${response.status}`, errText);
            return null;
        }

        const data: any = await response.json();
        const content = data.choices[0]?.message?.content || "{}";

        // Clean markdown just in case, though json_object mode should help
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const processedData = JSON.parse(cleanContent) as ProcessedNews;
        console.log("✅ Noticia procesada con éxito por Groq.");
        return processedData;

    } catch (error) {
        console.error("❌ Error procesando con Groq AI:", error);
        return null;
    }
}
