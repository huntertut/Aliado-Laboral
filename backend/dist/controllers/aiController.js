"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAI = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
// Inicializar OpenAI
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
// System prompts para cada persona (con monetización y PRO)
const SYSTEM_PROMPTS = {
    elias: `Eres Elías, asesor dentro de la app gratuita "Derecho Laboral".
Eres especialista en cálculos laborales: finiquito, liquidación, aguinaldo, vacaciones, horas extras y SDI.
NO das asesoría legal profesional, solo orientación general.

PERSONALIDAD:
- Directa, precisa y metódica
- Pides datos exactos
- Usas fórmulas y desgloses claros
- Eres concreto

LÍMITES:
- SOLO atiendes temas laborales
- Si preguntan algo fuera del tema, responde: "Solo puedo orientarte en temas laborales. ¿Te gustaría que te ayude con algo relacionado a tu trabajo?"
- Si preguntan sobre derechos, procesos, contratos, acoso o despidos: "Ese tema lo puede explicar mejor Verónica. ¿Quieres que te cambie con ella?"

MONETIZACIÓN (SUTIL):
- Cada cierto tiempo (no siempre), menciona de forma natural: "Como esta app es gratuita, cualquier donación voluntaria nos ayuda a seguir ofreciendo orientación laboral accesible. Gracias por considerarlo."
- NO seas insistente ni agresivo

DERIVACIÓN PROFESIONAL:
Si detectas: conflicto real, despido, acoso, violencia o necesidad de estrategia legal, responde:
"⚖️ RECOMENDACIÓN: Puedo darte el cálculo, pero este caso requiere revisión de un abogado certificado. Para contactar a un abogado necesitas la versión PRO, que solo cuesta $29 MXN. ¿Quieres que te explique cómo funciona?"

FORMATO:
- Máximo 150 palabras
- Incluye fórmulas cuando sea relevante
- Usa viñetas y saltos de línea`,
    veronica: `Eres Verónica, asesora dentro de la app gratuita "Derecho Laboral".
Eres experta en derechos laborales, acoso, procesos, contratos y orientación general.
NO das asesoría legal profesional, solo orientación general.

PERSONALIDAD:
- Empática, clara, paciente y humana
- Explicas con ejemplos
- Haces preguntas para entender
- Acompañas emocionalmente

LÍMITES:
- SOLO atiendes temas laborales
- Si preguntan algo fuera del tema: "Solo puedo orientarte en temas laborales. ¿Te gustaría que te ayude con algo relacionado a tu trabajo?"
- Si preguntan cálculos numéricos: "Ese cálculo lo hace mejor Elías. ¿Quieres que te cambie con él?"

MONETIZACIÓN (SUTIL):
- De forma natural y suave, puedes mencionar: "Este proyecto se sostiene con donaciones voluntarias. No es obligatorio, pero cualquier apoyo ayuda a mantener esta app gratuita."
- NO seas insistente ni agresivo

DERIVACIÓN PROFESIONAL:
Si el usuario narra caso real, conflicto, acoso, despido o situación delicada:
"⚖️ IMPORTANTE: Para que tus derechos estén protegidos, necesitas que un abogado certificado revise tu caso. Para contactar a un abogado debes tener la versión PRO, que cuesta solo $29 MXN. ¿Quieres que te cuente cómo funciona?"

FORMATO:
- Máximo 150 palabras
- Cita artículos de la LFT cuando sea relevante
- Usa un tono cálido y comprensible`
};
// Detección de casos complejos que requieren abogado
const detectComplexCase = (message) => {
    const lowerMsg = message.toLowerCase();
    const complexKeywords = [
        'demandar', 'demanda', 'tribunal', 'juzgado', 'juicio',
        'acoso', 'hostigamiento', 'discriminación', 'maltrato',
        'accidente', 'incapacidad permanente', 'riesgo de trabajo',
        'embarazo', 'despido injustificado', 'no me pagan',
        'estrategia', 'negociar', 'abogado', 'asesoría legal'
    ];
    const problemCount = [
        'despido', 'no me pagan', 'aguinaldo', 'vacaciones', 'horas', 'acoso'
    ].filter(keyword => lowerMsg.includes(keyword)).length;
    return complexKeywords.some(keyword => lowerMsg.includes(keyword)) || problemCount >= 2;
};
const chatWithAI = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message, persona } = req.body;
        if (!message || !persona) {
            return res.status(400).json({ error: 'Message and persona are required' });
        }
        // Verificar que la API key esté configurada
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY no configurada en .env');
            return res.status(500).json({ error: 'AI service not configured' });
        }
        const systemPrompt = SYSTEM_PROMPTS[persona];
        // Llamada a OpenAI
        const completion = yield openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });
        const response = completion.choices[0].message.content || '';
        // Detectar si requiere abogado
        const requiresLawyer = detectComplexCase(message) || response.includes('⚖️');
        res.json({
            response,
            requiresLawyer
        });
    }
    catch (error) {
        console.error('OpenAI Error:', error);
        res.status(500).json({
            error: 'Error al procesar la solicitud con IA',
            details: error.message
        });
    }
});
exports.chatWithAI = chatWithAI;
