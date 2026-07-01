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
    
    Tu objetivo es reescribir la noticia para que sea adictiva, profesional y muy útil.
    
    INSTRUCCIONES DE FORMATO:
    Responde ÚNICAMENTE con un objeto JSON válido.
    NO incluyas texto antes ni después del JSON (sin markdown ' \`\`\`json ').
    
    Estructura JSON requerida:
    {
      "titulo_clickeable": "Un título corto, intrigante y directo (max 15 palabras).",
      "resumen_trabajador": "Explicación detallada para el empleado. Debe tener entre 120 y 200 palabras, estructurada en 2 a 3 párrafos, sin tecnicismos complejos, explicando claramente cómo le afecta y qué debe hacer.",
      "resumen_pyme": "Explicación detallada para el dueño de negocio (PYME). Tono urgente y preventivo. Debe tener entre 120 y 200 palabras, estructurada en 2 a 3 párrafos, enfocada en riesgos, multas y cumplimiento legal.",
      "resumen_abogado": "Explicación técnica detallada para abogados con referencias de ley (ej. LFT, artículos). Debe tener entre 120 y 200 palabras, estructurada en 2 a 3 párrafos.",
      "pregunta_quiz": "Una pregunta interactiva basada en la noticia en formato de opción múltiple, seguida del caracter pipe '|' y la letra de la opción correcta. Estructura exacta: '¿Pregunta? A) Opción 1 B) Opción 2 C) Opción 3 | B) Opción 2'"
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

/**
 * Select the best news item from candidates that is not semantically redundant with recently published ones.
 */
export async function selectBestNewsItem(
    candidates: { title: string; snippet: string }[],
    recentlyPublished: string[]
): Promise<number | null> {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return 0; // Only one option, return it

    console.log(`🤖 [AI] Filtering ${candidates.length} candidates against ${recentlyPublished.length} recent news...`);

    const systemPrompt = `
    Eres un editor experto de una App de Derecho Laboral en México.
    Tu objetivo es seleccionar la mejor noticia de la lista de candidatos que sea RELEVANTE para el derecho laboral mexicano y que NO sea semánticamente redundante ni repetitiva comparada con las noticias publicadas recientemente.
    
    Noticias publicadas recientemente (¡Evita temas que repitan esto!):
    ${recentlyPublished.length > 0 ? recentlyPublished.map((title, idx) => `${idx + 1}. ${title}`).join('\n') : '(Ninguna reciente)'}
    
    Instrucción:
    Analiza la lista de nuevas candidatas y responde ÚNICAMENTE con un objeto JSON indicando el índice (0-indexed) de la mejor noticia. Si todas son irrelevantes, de baja calidad o repetitivas sobre el mismo tema ya publicado (como volver a debatir la misma propuesta de ley sin novedades), responde con "selected_index": null.
    
    Ejemplo de respuesta válida:
    {
      "selected_index": 2,
      "reason": "Explica brevemente por qué es la mejor opción no repetitiva"
    }
    `;

    const userPrompt = `
    Candidatas a evaluar:
    ${candidates.map((c, idx) => `[Índice ${idx}]:
    Título: ${c.title}
    Resumen: ${c.snippet}`).join('\n\n')}
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
                    { role: 'user', content: userPrompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2, // Low temperature for more deterministic choice
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            console.error('Groq API selection error:', response.statusText);
            return 0; // Fallback to first
        }

        const data: any = await response.json();
        const content = data.choices[0]?.message?.content || "{}";
        const result = JSON.parse(content);
        
        if (result.selected_index === null || result.selected_index === undefined) {
            console.log("⚠️ [AI] All candidates are repetitive or irrelevant.");
            return null;
        }

        const idx = Number(result.selected_index);
        if (idx >= 0 && idx < candidates.length) {
            console.log(`✅ [AI] Selected index ${idx}: ${candidates[idx].title} (Reason: ${result.reason})`);
            return idx;
        }

        return 0;
    } catch (err) {
        console.error('Error during AI news selection:', err);
        return 0; // Fallback
    }
}

