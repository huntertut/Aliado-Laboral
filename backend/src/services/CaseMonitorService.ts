import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SERVICE: Anti-Flojera (Nudge System)
 * Monitors case inactivity and triggers automated interventions.
 */

export const runInactivityScan = async () => {
    console.log('🕵️‍♀️ [Anti-Flojera] Starting scan...');

    // Time thresholds
    const now = new Date();
    const fourDaysAgo = new Date(now.setDate(now.getDate() - 4));
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 3)); // 7 days total (4+3)

    // 1. LEVEL 1: NUDGE (4 Days Inactivity)
    // Find cases where last message was > 4 days ago AND no penalty yet
    // Simplify query: Find active cases updated < 4 days ago? 
    // Usually we'd query ChatMessage, but relying on ContactRequest.updatedAt is a good proxy for "Status Change" or "Message" 
    // if we ensure ChatMessage updates the ContactRequest timestamp.

    const staleCases = await prisma.contactRequest.findMany({
        where: {
            updatedAt: { lte: fourDaysAgo }, // "Old"
            crmStatus: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED'] }, // Only active
            status: 'accepted'
        },
        include: {
            lawyerProfile: { include: { lawyer: { include: { user: true } } } },
            worker: true
        }
    });

    console.log(`⚠️ [Anti-Flojera] Found ${staleCases.length} stale cases (4+ days).`);

    for (const ticket of staleCases) {
        // Calculate exact days inactive
        const diffTime = Math.abs(now.getTime() - ticket.updatedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) {
            // 🔴 RED LIGHT (Crisis Mode)
            // 1. Worker Message (Wellness Strategy)
            if (ticket.lawyerProfile) {
                await prisma.chatMessage.create({
                    data: {
                        requestId: ticket.id,
                        senderId: ticket.lawyerProfile.lawyer.userId,
                        content: `🔴 **Semáforo Rojo:** Tu caso requiere atención. Estamos contactando al despacho directamente.\n\n**Mientras tanto, recuerda tus derechos:**\n1. Tienes derecho a una copia de todo lo actuado.\n2. La inactividad no extingue tu derecho a la liquidación.\n3. Antigravity ha penalizado la reputación del abogado por esta demora.`,
                        type: 'ai_response'
                    }
                });
            }
            // 2. Lawyer Penalty
            if (ticket.lawyerProfile) {
                await prisma.lawyerProfile.update({
                    where: { id: ticket.lawyerProfile.id },
                    data: { reputationScore: { decrement: 1 } }
                });
            }

        } else {
            // 🟡 YELLOW LIGHT (Warning Mode)
            // 1. Lawyer Nudge (Gamified)
            if (ticket.lawyerProfile) { // Added check for lawyerProfile
                await prisma.chatMessage.create({
                    data: {
                        requestId: ticket.id,
                        senderId: ticket.lawyerProfile.lawyer.userId,
                        content: `⚡ **¡Lic. ${ticket.lawyerProfile.lawyer.user.fullName || 'Colega'}, no bajes tu ritmo!**\n\nTu tiempo de respuesta ha subido a 4 días. Los abogados con respuesta < 24h tienen un **40% más de probabilidad** de recibir casos HOT.\n\n¡Contesta ahora y recupera tu Score de Oro!`,
                        type: 'system_notification'
                    }
                });
            }

            // 2. Worker Reassurance
            if (ticket.lawyerProfile) {
                await prisma.chatMessage.create({
                    data: {
                        requestId: ticket.id,
                        senderId: ticket.lawyerProfile.lawyer.userId,
                        content: `🟡 **Semáforo Amarillo:** Estamos esperando una actualización. Elías (IA) ya ha enviado un recordatorio prioritario a tu abogado para que no pierda el hilo.`,
                        type: 'ai_response'
                    }
                });
            }
        }

        // Update timestamp to reset cycle (or we could use a specific 'lastNudge' field for stricter logic)
        await prisma.contactRequest.update({
            where: { id: ticket.id },
            data: { updatedAt: new Date() }
        });
    }

    // 2. LEVEL 2: PENALTY (7 Days Inactivity)
    // Real implementation would check detailed logs to not penalize if we just nudged.
    // Assuming we have a way to track "Unanswered Nudges".
    // For MVP, we'll implementing a Reputation deduction for EXTREMELY stale cases (e.g., filtered differently)
    // or we leave it for V2. 

    console.log('✅ [Anti-Flojera] Scan complete.');
    return { scanned: staleCases.length };
};
