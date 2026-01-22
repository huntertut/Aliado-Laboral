import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

// System prompts actualizados
const PROMPTS = {
    elias: `Eres Elías, un asistente de inteligencia artificial orientado a la orientación laboral clara, empática y práctica.
Operas usando el modelo Llama 3 en Groq.
Tu misión es ayudar a trabajadores mexicanos a entender sus derechos.

Tus virtudes son:
- Lenguaje claro y humano (no robotico)
- No intimidar al usuario
- No prometer resultados legales garantizados
- Priorizar orientación y prevención

LIMITACIONES IMPORTANTES:
- No eres abogado.
- No das asesoría legal personalizada vinculante.
- No sustituyes a un profesional.
- En casos complejos, recomiendas contactar a un abogado (Versión PRO).

MODELO DE NEGOCIO (Aplicar de forma sutil):
- La app es gratuita.
- Para contactar directamente con un abogado, invita al usuario a suscribirse a la versión PRO ($29).

PERSONALIDAD ESPECÍFICA (ELÍAS):
- Orientado a lo práctico.
- Si el usuario pregunta sobre cálculos, tiempos o procedimientos generales, responde con claridad y pasos sencillos.
- Evita jerga legal excesiva.`,

    veronica: `Eres Verónica, una asistente de inteligencia artificial con enfoque legal preventivo y cuidadoso.
Operas usando el modelo Llama 3 en Groq.

Tus virtudes son:
- Lenguaje claro, formal pero cálido y empático.
- No intimidar al usuario.
- Priorizar la educación sobre derechos laborales.

LIMITACIONES IMPORTANTES:
- No eres abogado.
- No das asesoría legal personalizada, sino informativa.
- No sustituyes a un profesional.
- En casos complejos, recomiendas contactar a un abogado.

MODELO DE NEGOCIO:
- La app es gratuita.
- Para contactar directamente con un abogado, invita al usuario a suscribirse a la versión PRO ($29).

PERSONALIDAD ESPECÍFICA (VERÓNICA):
- Enfoque en la "prevención" y el "por qué" legal.
- Muy cuidadosa con no afirmar hechos legales definitivos. Usa frases como "según la Ley Federal del Trabajo..." o "generalmente...".`
};

// Detección de casos complejos
const detectComplexCase = (message: string, response: string): boolean => {
    const lowerMsg = message.toLowerCase();
    const lowerResp = response.toLowerCase();

    const complexKeywords = [
        'demandar', 'demanda', 'tribunal', 'juzgado', 'juicio',
        'acoso', 'hostigamiento', 'discriminación', 'violencia',
        'accidente grave', 'incapacidad permanente',
        'embarazo', 'despido injustificado', 'fraude',
        'amenaza', 'cárcel', 'penal'
    ];

    if (complexKeywords.some(keyword => lowerMsg.includes(keyword))) return true;
    if (lowerResp.includes('abogado') || lowerResp.includes('profesional') || lowerResp.includes('versión pro')) return true;

    return false;
};

// Rate Limiter
const RATE_LIMIT_CONFIG = {
    maxRequestsPerMinute: 20, // Groq is fast, we can allow more
    windowMs: 60 * 1000
};

class SimpleRateLimiter {
    private timestamps: number[] = [];

    canProcced(): boolean {
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
        this.timestamps = this.timestamps.filter(t => t > windowStart);
        if (this.timestamps.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) return false;
        this.timestamps.push(now);
        return true;
    }
}

const rateLimiter = new SimpleRateLimiter();

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message, persona } = req.body;

        if (!message || !persona) {
            return res.status(400).json({ error: 'Message and persona are required' });
        }

        if (!rateLimiter.canProcced()) {
            return res.status(429).json({
                error: 'Servicio en alta demanda',
                message: 'El asistente está atendiendo muchas consultas. Por favor intenta en unos segundos.',
                requiresLawyer: false
            });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('GROQ_API_KEY missing');
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'El asistente no tiene su llave de activación (GROQ_API_KEY faltante).'
            });
        }

        const systemPrompt = PROMPTS[persona as 'elias' | 'veronica'] || PROMPTS.elias;

        // Call Groq API using native fetch
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                model: 'llama3-70b-8192', // High intelligence model
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', response.status, errorText);
            throw new Error(`Groq API returned ${response.status}: ${errorText}`);
        }

        const data: any = await response.json();
        const responseText = data.choices[0]?.message?.content || "Lo siento, no pude procesar tu respuesta.";
        const requiresLawyer = detectComplexCase(message, responseText);

        res.json({
            response: responseText,
            requiresLawyer
        });

    } catch (error: any) {
        console.error('AI Controller Error:', error);
        res.status(500).json({
            error: 'Error interno de IA',
            message: 'Hubo un problema conectando con el asistente. Intenta de nuevo.',
            details: error.message
        });
    }
};
