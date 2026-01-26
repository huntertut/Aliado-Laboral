import { Request, Response } from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// PROMPTS (Preserved)
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

// 1. CONFIGURACIÓN DE MODELOS
const MODEL_FAST = 'llama3-8b-8192';
const MODEL_SMART = 'llama3-70b-8192';

// 3. LIMITADOR DE HISTORIAL (Context Sanitizer)
const trimHistory = (messages: any[], systemPrompt: string) => {
    // Siempre mantenemos el System Prompt (se construirá nuevo, así que no asumimos que viene en messages)
    // Messages viene del frontend como [{role, content}...]

    // Si el historial es muy largo, nos quedamos con los últimos 5
    let trimmed = messages;
    if (messages.length > 5) {
        trimmed = messages.slice(-5);
    }

    // Construimos el array final para Groq
    return [
        { role: 'system', content: systemPrompt },
        ...trimmed
    ];
};

// 4. RATE LIMITING & QUOTA (Database Driven)
const checkAndTrackQuota = async (userId: string | undefined): Promise<boolean> => {
    // Si no hay usuario (guest), aplicamos un límite simple en memoria o permitimos poco (MVP: Allow)
    // Pero idealmente requerimos Auth. Asumiremos Auth es opcional en chat básico? 
    // Si es ruta protegida, req.user existe.
    if (!userId) return true;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Reset diario
    const now = new Date();
    const lastReset = user.lastTokenReset ? new Date(user.lastTokenReset) : new Date(0); // Safe Date conversion
    const isNewDay = now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth();

    if (isNewDay) {
        await prisma.user.update({
            where: { id: userId },
            data: { dailyTokenCount: 0, lastTokenReset: now }
        });
        return true;
    }

    // Reglas de Negocio
    const LIMIT_FREE = 5000;
    const isFreeWorker = user.role === 'worker' && user.plan === 'free';

    if (isFreeWorker && user.dailyTokenCount >= LIMIT_FREE) {
        return false;
    }

    return true;
};

const updateTokenUsage = async (userId: string | undefined, usage: number) => {
    if (!userId) return;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { dailyTokenCount: { increment: usage } }
        });
    } catch (e) {
        console.error('Failed to update token usage', e);
    }
};

export const chatWithAI = async (req: any, res: Response) => {
    try {
        const { message, messages, persona, complexity = 'CHAT_BASIC' } = req.body;
        const userId = req.user?.id;

        // Validar Quota
        const canProceed = await checkAndTrackQuota(userId);
        if (!canProceed) {
            return res.status(429).json({
                error: 'Límite diario excedido 🛑',
                message: 'Has alcanzado tu límite diario de consultas gratuitas. Suscríbete a Premium para continuar ilimitadamente.',
                requiresLawyer: false,
                isQuotaError: true
            });
        }

        const systemPrompt = PROMPTS[persona as 'elias' | 'veronica'] || PROMPTS.elias;

        // Normalizar entrada: Support both single 'message' and history 'messages'
        let conversationHistory: any[] = [];
        if (messages && Array.isArray(messages)) {
            conversationHistory = messages;
        } else if (message) {
            conversationHistory = [{ role: 'user', content: message }];
        } else {
            return res.status(400).json({ error: 'Message or messages array required' });
        }

        // 3. Trim History
        const finalMessages = trimHistory(conversationHistory, systemPrompt);

        // 2. Routing Logic
        let selectedModel = MODEL_FAST;
        let maxTokens = 250;

        if (complexity === 'LEGAL_DRAFTING') {
            selectedModel = MODEL_SMART;
            maxTokens = 2048;
        }

        // Init Groq (OpenAI SDK)
        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
        });

        const completion = await groq.chat.completions.create({
            messages: finalMessages,
            model: selectedModel,
            temperature: 0.5,
            max_tokens: maxTokens,
        });

        const responseText = completion.choices[0]?.message?.content || "Lo siento, hubo un error de conexión.";
        const totalTokens = completion.usage?.total_tokens || 0;

        // Actualizar consumo
        await updateTokenUsage(userId, totalTokens);

        // Detect complex case (Simple keyword match)
        const complexKeywords = ['demandar', 'juzgado', 'despido injustificado', 'violencia', 'amenaza'];
        const requiresLawyer = complexKeywords.some(kw => responseText.toLowerCase().includes(kw));

        // LEGAL ARMOR: DISCLAIMER INJECTION
        const legalDisclaimer = `\n\n> ⚖️ *Aviso Legal*: Esta respuesta es informativa y generada por IA. No constituye asesoría legal vinculante. Para casos reales, contacta a un abogado verificado en la sección "Solicitar Abogado".`;

        res.json({
            response: responseText + legalDisclaimer,
            requiresLawyer,
            usage: totalTokens
        });

    } catch (error: any) {
        console.error('AI Error:', error);
        res.status(500).json({
            error: 'Error interno de IA',
            message: 'El servicio está experimentando alta demanda.',
            details: error.message
        });
    }
};
