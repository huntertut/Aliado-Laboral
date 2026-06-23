import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as storageService from '../services/storageService';
import * as ocrService from '../services/ocrService';
import * as stripeService from '../services/stripeService';
import OpenAI from 'openai';

const prisma = new PrismaClient();

/**
 * EL PUENTE: Upload Settlement Document & Auto-Invoice
 */
export const uploadSettlementDoc = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { fileBase64, fileName, fileType, processType } = req.body; // processType: 'CONCILIACION' | 'JUICIO'
        const userId = (req as any).user?.id;

        console.log(`[El Puente] Uploading settlement doc for Request ${requestId}`);

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { subscription: true }
        });
        if (!lawyer) return res.status(404).json({ error: 'Abogado no encontrado' });

        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId },
            include: { worker: true }
        });
        if (!request) return res.status(404).json({ error: 'Caso no encontrado' });

        // 1. Process File
        const buffer = Buffer.from(fileBase64, 'base64');
        const destination = `settlements/${requestId}/${Date.now()}_${fileName}`;
        const fileUrl = await storageService.uploadBuffer(buffer, destination, fileType);

        // 2. OCR Analysis (Eye of Antigravity)
        let extractedAmount: number | null = null;
        let ocrText = "";

        // Only try OCR on images for now (PDF support requires pdf-parse usually, assuming Image for MVP)
        if (fileType.includes('image')) {
            const result = await ocrService.extractTextFromImage(buffer);
            ocrText = result.rawText;
            const details = ocrService.extractSettlementDetails(ocrText);
            extractedAmount = details.amount;
            console.log(`[El Puente] OCR Result: Found Amount $${extractedAmount}`);
        } else {
            // Fallback for PDFs or skip OCR
            console.log('[El Puente] PDF uploaded, skipping OCR for MVP');
        }

        // 3. 🔒 COMMISSION FREEZE: Use rate stored at acceptance time if available
        // This prevents plan upgrades from lowering the rate on already-active cases
        const type = (processType || 'JUICIO').toUpperCase();
        const isPro = lawyer.subscription?.plan === 'pro';

        let rate: number;
        if (request.commissionRate != null) {
            // Frozen rate exists — respect the snapshot from acceptance time
            // Adjust for CONCILIACION vs JUICIO multiplier while keeping base rate
            const baseRate = Number(request.commissionRate); // e.g. 0.07 or 0.10
            // Apply a small discount for conciliacion (faster = slightly higher, but capped at frozen rate)
            rate = (type === 'CONCILIACION') ? baseRate : Math.max(baseRate - 0.02, 0.05);
            console.log(`[Commission Freeze] Using frozen rate ${request.commissionRate} → adjusted: ${rate} (${type})`);
        } else {
            // No frozen rate: fallback to current plan (old cases without snapshot)
            if (isPro) {
                rate = (type === 'CONCILIACION') ? 0.07 : 0.05;
            } else {
                rate = (type === 'CONCILIACION') ? 0.10 : 0.08;
            }
        }

        let commissionAmount = 0;
        let invoiceId = null;

        if (extractedAmount && extractedAmount > 0) {
            commissionAmount = extractedAmount * rate;

            // 4. Generate Stripe Invoice
            if (lawyer.stripeCustomerId) {
                const invoice = await stripeService.createCommissionInvoice(
                    lawyer.stripeCustomerId,
                    commissionAmount,
                    `Comisión por Éxito (${(rate * 100).toFixed(0)}%) - ${type} - Caso #${requestId}`
                );
                invoiceId = invoice.id;
                console.log(`[El Puente] Invoice Created: ${invoiceId} (Rate: ${rate})`);
            }
        }

        // 5. Update Database (The Vault)
        await prisma.contactRequest.update({
            where: { id: requestId },
            data: {
                settlementDocUrl: fileUrl,
                settlementDocStatus: 'uploaded',
                settlementAmount: extractedAmount ? extractedAmount : undefined,
                commissionAmount: commissionAmount > 0 ? commissionAmount : undefined,
                commissionInvoiceId: invoiceId || undefined,
                commissionStatus: invoiceId ? 'pending' : 'not_applicable',
                crmStatus: 'CLOSED_WON' // Auto-close case
            }
        });

        // 6. Gamification: Reputation Boost & Loyalty Message (The "Feel Good" Logic)
        // Calculate Savings if PRO
        const basicRate = (type === 'CONCILIACION') ? 0.10 : 0.08;
        const currentSavings = isPro ? (extractedAmount! * (basicRate - rate)) : 0;

        await prisma.lawyerProfile.update({
            where: { lawyerId: lawyer.id },
            data: {
                reputationScore: { increment: 10 },
                successfulCases: { increment: 1 },
                lifetimeCommissionSavings: { increment: currentSavings }
            }
        });

        // RE-FETCH to get updated total savings
        const updatedProfile = await prisma.lawyerProfile.findUnique({ where: { lawyerId: lawyer.id } });
        const totalSavings = Number(updatedProfile?.lifetimeCommissionSavings || 0);

        // A. LOYALTY NOTIFICATION (LAWYER)
        if (commissionAmount > 0) {
            let messageContent = `⚖️ ¡Felicidades por la victoria, Colega!\n\nHemos procesado el documento de cierre. Se ha generado la factura de tu Comisión por Éxito ($${commissionAmount.toLocaleString()} MXN).`;

            if (isPro && currentSavings > 0) {
                messageContent += `\n\n💎 **Efecto PRO:** En este caso ahorraste **$${currentSavings.toLocaleString()}**.`;
                messageContent += `\n💰 **Ahorro Acumulado:** Tu suscripción PRO te ha ahorrado **$${totalSavings.toLocaleString()} MXN** en total.`;
            }

            messageContent += `\n\nEl link de pago está en tu correo. Al liquidarlo, se liberará el expediente digital para tu cliente.`;

            // Insert into Chat (Lawyer View)
            await prisma.chatMessage.create({
                data: {
                    requestId,
                    senderId: lawyer.userId,
                    content: messageContent,
                    type: 'system_notification'
                }
            });
        }

        // B. WORKER VALUE PROP (SOCIAL AUDIT)
        // Notify worker that "Something happened" but process is pending lawyer action
        if (request.workerId) {
            const workerMsg = `👋 Hola ${(request as any).worker?.fullName || 'Usuario'}, tu abogado ha marcado tu caso como 'Ganado' y ha subido el Convenio/Sentencia.\n\nPara que puedas descargar tu copia oficial y tener el respaldo legal, tu abogado debe completar el registro de cierre final en la plataforma.\n\n¡Felicidades por este gran paso!`;

            await prisma.chatMessage.create({
                data: {
                    requestId,
                    senderId: lawyer.userId, // System message appearing in chat
                    content: workerMsg,
                    type: 'text' // Visible to worker
                }
            });
        }

        res.json({
            success: true,
            message: 'Convenio subido correctamente. Caso cerrado con éxito.',
            ocrAnalysis: {
                amountDetected: extractedAmount,
                commissionGenerated: commissionAmount,
                savingsApplied: currentSavings
            }
        });

    } catch (error: any) {
        console.error('Error uploading settlement doc:', error);
        res.status(500).json({ error: 'Error procesando el convenio' });
    }
};

/**
 * LAWYER: Suggest first message reply using Groq AI
 */
export const suggestReply = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });

        if (!lawyer || !lawyer.profile) return res.status(404).json({ error: 'Abogado no encontrado' });

        const request = await prisma.contactRequest.findUnique({ where: { id }, include: { worker: true } });
        if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });

        if (request.lawyerProfileId !== lawyer.profile.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.json({
                suggestions: [
                    "Hola, soy el abogado asignado a tu caso. ¿Podemos hablar y revisar los detalles?",
                    "Saludos, he revisado parte de tu problema laboral y me gustaría brindarte apoyo.",
                    "¡Hola! Entiendo que tuviste problemas en el trabajo. Estoy aquí para orientarte sin compromiso inicial."
                ]
            });
        }

        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
        });

        const prompt = `Eres un experto redactor legal y asistente de servicio al cliente para abogados laboralistas en México.
        El trabajador ha descrito su caso así (puede ser un resumen de otra IA o palabras suyas):
        "${request.aiSummary || request.caseSummary}"

        Tu tarea:
        Redacta 3 opciones separadas para enviar un "Primer Mensaje" que el abogado le enviará por chat al prospecto.
        Las reglas son:
        - Empático, humano, dando confianza.
        - Breve (ideal para un chat celular), sin aburrir con leyes en el saludo.
        - Debe invitar a seguir conversando.

        Obligatorio: Imprime la respuesta como un objeto JSON válido con un arreglo de textos llamado "suggestions".
        Formato exacto esperado: { "suggestions": ["Mensaje 1...", "Mensaje 2...", "Mensaje 3..."] }`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            temperature: 0.7
        });

        const responseContent = completion.choices[0]?.message?.content || '{"suggestions":[]}';
        const result = JSON.parse(responseContent);

        res.json({ suggestions: result.suggestions });

    } catch (error: any) {
        console.error('Error generating AI suggestions:', error);
        res.status(500).json({ error: 'Error generando sugerencias', details: error.message });
    }
};
