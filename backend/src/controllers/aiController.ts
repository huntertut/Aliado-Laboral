import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Inicializar Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// System prompts actualizados (Elías y Verónica)
const PROMPTS = {
    elias: `Eres Elías, un asistente de inteligencia artificial orientado a la orientación laboral clara, empática y práctica.
Operas EXCLUSIVAMENTE usando el modelo de Google (Gemini).
No debes simular, mencionar ni asumir capacidades de otros modelos de lenguaje.

Tus virtudes son:
- Lenguaje claro y humano
- No intimidar al usuario
- No prometer resultados legales
- Priorizar orientación y prevención

LIMITACIONES IMPORTANTES:
- No eres abogado.
- No das asesoría legal personalizada.
- No sustituyes a un profesional.
- En casos complejos, recomiendas contactar a un abogado.

MODELO DE NEGOCIO (Aplicar de forma NO agresiva):
- La app es gratuita.
- Puedes sugerir de manera sutil apoyar la iniciativa mediante donaciones.
- Para contactar directamente con un abogado, invita al usuario a suscribirse a la versión PRO ($29).

GESTIÓN DE CONTEXTO:
- Estructura la información que recibes para dar respuestas coherentes.

PERSONALIDAD ESPECÍFICA (ELÍAS):
- Orientado a lo práctico.
- Si el usuario pregunta sobre cálculos, tiempos o procedimientos generales, responde con claridad y pasos sencillos.
- Evita jerga legal excesiva.`,

    veronica: `Eres Verónica, una asistente de inteligencia artificial con enfoque legal preventivo y cuidadoso.
Operas EXCLUSIVAMENTE usando el modelo de Google (Gemini).
No debes simular, mencionar ni asumir capacidades de otros modelos de lenguaje.

Tus virtudes son:
- Lenguaje claro y humano
- No intimidar al usuario
- No prometer resultados legales
- Priorizar orientación y prevención

LIMITACIONES IMPORTANTES:
- No eres abogado.
- No das asesoría legal personalizada, sino informativa (educativa).
- No sustituyes a un profesional.
- En casos complejos, recomiendas contactar a un abogado.

MODELO DE NEGOCIO (Aplicar de forma NO agresiva):
- La app es gratuita.
- Puedes sugerir de manera sutil apoyar la iniciativa mediante donaciones.
- Para contactar directamente con un abogado, invita al usuario a suscribirse a la versión PRO ($29).

PERSONALIDAD ESPECÍFICA (VERÓNICA):
- Tu tono es más formal pero cálido.
- Te enfocas en la "prevención" y en explicar el "por qué" de las cosas desde una perspectiva de derechos.
- Muy cuidadosa con no afirmar hechos legales definitivos ("según la ley suele ser...", "generalmente...").`
};

// Detección de casos complejos que requieren abogado (Mantener lógica existente mejorada)
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

    // Si el usuario menciona estas palabras clave
    if (complexKeywords.some(keyword => lowerMsg.includes(keyword))) return true;

    // Si la respuesta de la IA sugiere buscar abogado
    if (lowerResp.includes('abogado') || lowerResp.includes('profesional') || lowerResp.includes('versión pro')) return true;

    return false;
};


// --- Rate Limit Logic (Simple In-Memory Token Bucket equivalent) ---
const RATE_LIMIT_CONFIG = {
    maxRequestsPerMinute: 12, // Conservative limit (Free Tier is ~15 RPM)
    windowMs: 60 * 1000
};

class SimpleRateLimiter {
    private timestamps: number[] = [];

    canProcced(): boolean {
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

        // Filter out old timestamps
        this.timestamps = this.timestamps.filter(t => t > windowStart);

        if (this.timestamps.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
            return false;
        }

        this.timestamps.push(now);
        return true;
    }

    getTimeToWait(): number {
        if (this.timestamps.length === 0) return 0;
        const oldest = this.timestamps[0];
        const resetTime = oldest + RATE_LIMIT_CONFIG.windowMs;
        return Math.ceil((resetTime - Date.now()) / 1000);
    }
}

const rateLimiter = new SimpleRateLimiter();


export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message, persona, history } = req.body;

        if (!message || !persona) {
            return res.status(400).json({ error: 'Message and persona are required' });
        }

        // 1. Local Rate Limit Check
        if (!rateLimiter.canProcced()) {
            const waitTime = rateLimiter.getTimeToWait();
            console.warn(`[AI Rate Limit] Local limit hit. Telling user to wait ${waitTime}s.`);
            return res.status(429).json({
                error: 'Servicio en alta demanda',
                message: `El asistente está atendiendo muchas consultas. Por favor intenta en ${waitTime} segundos.`,
                requiresLawyer: false
            });
        }

        // Verificar API Key
        if (!process.env.GOOGLE_API_KEY) {
            console.error('GOOGLE_API_KEY no configurada en .env');
            return res.status(500).json({ error: 'AI service not configured (Missing Key)' });
        }

        const selectedPrompt = PROMPTS[persona as 'elias' | 'veronica'] || PROMPTS.elias;

        // Configurar Modelo Gemini con Fallback
        let model;
        let chatSession;

        try {
            // Intento 1: Gemini 1.5 Flash (Más rápido/barato)
            model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: selectedPrompt,
            });
            chatSession = model.startChat({
                history: history || [],
                generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
            });
        } catch (initError) {
            console.warn("⚠️ Error initializing 1.5-flash, trying gemini-pro...");
            model = genAI.getGenerativeModel({
                model: "gemini-pro",
                systemInstruction: selectedPrompt,
            });
            chatSession = model.startChat({
                history: history || [],
                generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
            });
        }

        let responseText = "";
        let requiresLawyer = false;

        try {
            const result = await chatSession.sendMessage(message);
            responseText = result.response.text();
            requiresLawyer = detectComplexCase(message, responseText);
        } catch (chatError: any) {
            console.warn(`⚠️ Error with primary model: ${chatError.message}. Retrying with Fallback (gemini-pro)...`);

            // Re-init with Fallback Model
            const fallbackModel = genAI.getGenerativeModel({
                model: "gemini-pro",
                systemInstruction: selectedPrompt,
            });
            const fallbackSession = fallbackModel.startChat({
                history: history || [],
                generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
            });

            try {
                const fallbackResult = await fallbackSession.sendMessage(message);
                responseText = fallbackResult.response.text();
                requiresLawyer = detectComplexCase(message, responseText);
                console.log("✅ Recovered with Fallback Model.");
            } catch (fallbackError: any) {
                console.error("❌ Fallback failed:", fallbackError);
                throw fallbackError; // Re-throw to be caught by main handler
            }
        }

        res.json({
            response: responseText,
            requiresLawyer,
        });

    } catch (error: any) {
        console.error('Gemini Main Handler Error:', error);

        // 2. Google Quota Handling (429 / 503)
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.status === 429;

        if (isQuotaError) {
            console.warn('[AI Rate Limit] Google Quota Hit.');
            return res.status(429).json({
                error: 'Límite de servicio alcanzado',
                message: 'El asistente está descansando un momento (Límite de uso gratuito). Por favor intenta de nuevo en 1 minuto.',
                requiresLawyer: false
            });
        }

        // 404 Special Handling - Usually means API is disabled or Model not found
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.error('❌ [AI Error] 404 Detected. Most likely cause: Generative Language API is NOT enabled in Google Cloud Console.');
            return res.status(503).json({
                error: 'Modelos de IA no disponibles',
                message: 'El asistente está durmiendo. (Error 404: Verifica que la API Generative Language esté habilitada en Google Cloud).',
                requiresLawyer: false
            });
        }

        // Diagnostic information for 500 errors
        const keyStatus = process.env.GOOGLE_API_KEY ? `Present (Length: ${process.env.GOOGLE_API_KEY.length})` : 'MISSING';

        res.status(500).json({
            error: 'Error interno del servicio de IA',
            message: `Error técnico: ${error.message || 'Desconocido'}. Estado de Llave: ${keyStatus}.`,
            details: error.message
        });
    }
};
