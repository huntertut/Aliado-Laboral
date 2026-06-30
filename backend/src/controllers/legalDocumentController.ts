import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
});

// ─────────────────────────────────────────────────────────────────
// DOCUMENT CATALOG
// ─────────────────────────────────────────────────────────────────

export const DOCUMENT_CATALOG = {
    severance_claim: {
        name: 'Reclamación de Liquidación',
        description: 'Escrito formal para reclamar tu liquidación completa ante el patrón o autoridad.',
        price: 9900, // $99 MXN in cents
        icon: '📄',
    },
    unfair_dismissal: {
        name: 'Escrito de Despido Injustificado',
        description: 'Documento para presentar ante el patrón o Junta de Conciliación por despido sin causa.',
        price: 14900, // $149 MXN in cents
        icon: '⚖️',
    },
    benefits_claim: {
        name: 'Reclamación de Prestaciones Pendientes',
        description: 'Carta formal para exigir pago de vacaciones, aguinaldo, prima vacacional u otras prestaciones no pagadas.',
        price: 9900, // $99 MXN in cents
        icon: '💼',
    },
};

type DocumentType = keyof typeof DOCUMENT_CATALOG;

// ─────────────────────────────────────────────────────────────────
// GET CATALOG — Public, shows available documents
// ─────────────────────────────────────────────────────────────────

export const getDocumentCatalog = async (req: Request, res: Response) => {
    const catalog = Object.entries(DOCUMENT_CATALOG).map(([type, info]) => ({
        type,
        ...info,
        priceDisplay: `$${(info.price / 100).toFixed(0)} MXN`,
    }));
    res.json({ documents: catalog });
};

// ─────────────────────────────────────────────────────────────────
// GET MY DOCUMENTS — Returns documents purchased by this worker
// ─────────────────────────────────────────────────────────────────

export const getMyDocuments = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const docs = await prisma.legalDocument.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ documents: docs });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
};

// ─────────────────────────────────────────────────────────────────
// CREATE PAYMENT INTENT — Initiates purchase flow
// ─────────────────────────────────────────────────────────────────

export const createDocumentPaymentIntent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { documentType, workerName, employerName, dailySalary, yearsOfService, separationDate, additionalData } = req.body;

        if (!documentType || !DOCUMENT_CATALOG[documentType as DocumentType]) {
            return res.status(400).json({ error: 'Tipo de documento no válido' });
        }

        const docInfo = DOCUMENT_CATALOG[documentType as DocumentType];

        // Get or create Stripe customer
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId, role: 'worker' },
            });
            customerId = customer.id;
            await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
        }

        // Create ephemeral key for mobile SDK
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: '2022-11-15' }
        );

        // Create LegalDocument record (pending payment)
        const legalDoc = await prisma.legalDocument.create({
            data: {
                userId,
                documentType,
                status: 'pending_payment',
                amount: docInfo.price / 100,
                workerName: workerName || user.fullName,
                employerName: employerName || null,
                dailySalary: dailySalary ? parseFloat(dailySalary) : null,
                yearsOfService: yearsOfService ? parseFloat(yearsOfService) : null,
                separationDate: separationDate || null,
                additionalData: additionalData ? JSON.stringify(additionalData) : null,
            },
        });

        // Create Payment Intent with document reference
        const paymentIntent = await stripe.paymentIntents.create({
            amount: docInfo.price,
            currency: 'mxn',
            customer: customerId,
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId,
                type: 'document_purchase',
                documentId: legalDoc.id,
                documentType,
            },
        }, {
            idempotencyKey: `doc_pi_${userId}_${legalDoc.id}`,
        });

        // Link payment intent to document record
        await prisma.legalDocument.update({
            where: { id: legalDoc.id },
            data: { stripePaymentIntentId: paymentIntent.id },
        });

        res.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerId,
            paymentIntentId: paymentIntent.id,
            documentId: legalDoc.id,
            documentName: docInfo.name,
            price: docInfo.price,
        });

    } catch (error: any) {
        console.error('Error creating document payment intent:', error);
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GENERATE PDF — Called after payment confirmation
// ─────────────────────────────────────────────────────────────────

export const generateLegalDocument = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { documentId } = req.params;

        const doc = await prisma.legalDocument.findUnique({
            where: { id: documentId },
            include: { user: true },
        });

        if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
        if (doc.userId !== userId) return res.status(403).json({ error: 'Acceso denegado' });
        if (doc.status === 'pending_payment') {
            return res.status(402).json({ error: 'Pago pendiente. Completa el pago para descargar este documento.' });
        }

        const html = buildDocumentHTML(doc);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '30px', bottom: '30px', left: '40px', right: '40px' },
        });

        await browser.close();

        // Mark as generated
        await prisma.legalDocument.update({
            where: { id: documentId },
            data: { status: 'generated' },
        });

        const docInfo = DOCUMENT_CATALOG[doc.documentType as DocumentType];
        const filename = `AliadoLaboral_${docInfo?.name.replace(/\s+/g, '_') || 'Escrito'}_${doc.id.slice(0, 6)}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating legal document PDF:', error);
        res.status(500).json({ error: 'Error al generar el documento' });
    }
};

// ─────────────────────────────────────────────────────────────────
// PDF HTML BUILDER — 3 document templates
// ─────────────────────────────────────────────────────────────────

function buildDocumentHTML(doc: any): string {
    const logoPath = path.join(__dirname, '../../public/assets/logo.png');
    let logoBase64 = '';
    try {
        const logoData = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
    } catch {
        // Logo not found, use text fallback
    }

    const logoHtml = logoBase64
        ? `<img src="${logoBase64}" class="logo-img" />`
        : `<div class="logo-text">ALIADO LABORAL ⚖️</div>`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const workerName = doc.workerName || 'Nombre del Trabajador';
    const employerName = doc.employerName || 'Nombre del Patrón / Empresa';
    const salary = doc.dailySalary ? `$${Number(doc.dailySalary).toLocaleString('es-MX')} MXN` : '____________________';
    const years = doc.yearsOfService ? `${Number(doc.yearsOfService).toFixed(1)} años` : '____________________';
    const separationDate = doc.separationDate || '____________________';

    const commonStyles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Open+Sans:wght@400;600&display=swap');
            body { font-family: 'Open Sans', Arial, sans-serif; color: #1a1a2e; background: #fff; margin: 0; padding: 0; }
            .page { padding: 40px 50px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #1a237e; padding-bottom: 18px; margin-bottom: 28px; }
            .logo-img { max-height: 55px; margin-bottom: 6px; }
            .logo-text { font-size: 22px; font-weight: bold; color: #1a237e; letter-spacing: 1px; }
            .doc-title { font-family: 'Crimson Text', serif; font-size: 22px; font-weight: 600; color: #1a237e; margin: 10px 0 4px; text-transform: uppercase; letter-spacing: 1px; }
            .doc-subtitle { font-size: 12px; color: #666; }
            .meta { font-size: 11px; color: #888; margin-top: 6px; }
            .body-text { font-size: 13.5px; line-height: 1.85; text-align: justify; margin-bottom: 18px; }
            .body-text strong { color: #1a237e; }
            .section-title { font-size: 13px; font-weight: 600; color: #1a237e; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #c5cae9; padding-bottom: 4px; margin: 24px 0 10px; }
            .field-row { display: flex; margin-bottom: 8px; font-size: 13px; }
            .field-label { color: #555; font-weight: 600; min-width: 200px; }
            .field-value { color: #1a1a2e; border-bottom: 1px solid #999; flex: 1; padding-bottom: 2px; }
            .disclaimer { background: #fff8e1; border-left: 4px solid #f9a825; padding: 12px 16px; border-radius: 4px; font-size: 11.5px; color: #5d4037; margin-top: 30px; line-height: 1.6; }
            .signature-section { margin-top: 50px; }
            .signature-block { display: inline-block; text-align: center; width: 45%; margin-right: 8%; }
            .signature-line { border-top: 1px solid #333; margin-bottom: 6px; }
            .signature-label { font-size: 11px; color: #666; }
            .footer { margin-top: 40px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
            .folio { background: #e8eaf6; display: inline-block; padding: 2px 10px; border-radius: 3px; font-size: 11px; color: #3949ab; font-weight: 600; margin-top: 6px; }
        </style>
    `;

    // ── TEMPLATE 1: Reclamación de Liquidación ──
    if (doc.documentType === 'severance_claim') {
        return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${commonStyles}</head><body><div class="page">
            <div class="header">
                ${logoHtml}
                <div class="doc-title">Carta de Reclamación de Liquidación</div>
                <div class="doc-subtitle">Ley Federal del Trabajo — Art. 89, 162 y 76</div>
                <div class="meta">Fecha: ${dateStr}</div>
                <div class="folio">Folio: AL-LIQ-${doc.id.slice(0, 8).toUpperCase()}</div>
            </div>

            <div class="section-title">Datos del Trabajador</div>
            <div class="field-row"><span class="field-label">Nombre del Trabajador:</span><span class="field-value">${workerName}</span></div>
            <div class="field-row"><span class="field-label">Nombre del Patrón / Empresa:</span><span class="field-value">${employerName}</span></div>
            <div class="field-row"><span class="field-label">Salario Diario:</span><span class="field-value">${salary}</span></div>
            <div class="field-row"><span class="field-label">Antigüedad:</span><span class="field-value">${years}</span></div>
            <div class="field-row"><span class="field-label">Fecha de Separación:</span><span class="field-value">${separationDate}</span></div>

            <div class="section-title">Cuerpo del Escrito</div>
            <p class="body-text">
                Por medio del presente escrito, yo, <strong>${workerName}</strong>, con fundamento en los artículos 89, 162 y 76 de la 
                <strong>Ley Federal del Trabajo</strong>, me dirijo a usted, representante legal y/o titular de 
                <strong>${employerName}</strong>, a fin de reclamar el pago íntegro y correcto de mi 
                <strong>liquidación constitucional</strong>, la cual incluye los siguientes conceptos:
            </p>
            <p class="body-text">
                <strong>a) Partes proporcionales de aguinaldo</strong> (Art. 87 LFT) — equivalente a 15 días de salario por año;<br/>
                <strong>b) Prima vacacional</strong> (Art. 80 LFT) — 25% sobre los días de vacaciones correspondientes;<br/>
                <strong>c) Días de vacaciones devengadas</strong> (Art. 76 LFT) no disfrutadas al momento de la separación;<br/>
                <strong>d) Partes proporcionales de PTU</strong> correspondientes al ejercicio fiscal en curso;<br/>
                <strong>e) Salarios devengados y no pagados</strong> hasta la fecha de separación efectiva.
            </p>
            <p class="body-text">
                Lo anterior con base en un salario diario de <strong>${salary}</strong> y una antigüedad efectiva de 
                <strong>${years}</strong>, conforme a los registros correspondientes ante el IMSS y los controles internos de la empresa.
            </p>
            <p class="body-text">
                Solicito que el pago correspondiente se realice en un plazo no mayor a <strong>72 horas hábiles</strong> a partir 
                de la recepción del presente escrito, ya que de lo contrario me reservo el derecho de acudir ante las autoridades 
                laborales competentes para hacer valer mis derechos.
            </p>

            <div class="disclaimer">
                ⚠️ <strong>Aviso Legal:</strong> Este documento es un borrador orientativo generado mediante tecnología de Aliado Laboral. 
                No constituye asesoría jurídica formal. Para mayor certeza legal, se recomienda presentarlo ante un abogado laboralista 
                colegiado antes de su entrega. Los cálculos específicos de liquidación deben validarse contra recibos de nómina y 
                documentación del IMSS.
            </div>

            <div class="signature-section">
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-label"><strong>${workerName}</strong><br/>Trabajador Reclamante</div>
                </div>
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-label">Representante Legal / Patrón<br/>Acuse de Recibido</div>
                </div>
            </div>

            <div class="footer">Generado por Aliado Laboral — aliadolaboral.com | Folio AL-LIQ-${doc.id.slice(0, 8).toUpperCase()} | ${dateStr}<br/>
            Este documento es de uso personal del trabajador. Contiene información protegida por la LFPDPPP.</div>
        </div></body></html>`;
    }

    // ── TEMPLATE 2: Despido Injustificado ──
    if (doc.documentType === 'unfair_dismissal') {
        return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${commonStyles}</head><body><div class="page">
            <div class="header">
                ${logoHtml}
                <div class="doc-title">Escrito por Despido Injustificado</div>
                <div class="doc-subtitle">Ley Federal del Trabajo — Art. 48, 50 y 51</div>
                <div class="meta">Fecha: ${dateStr}</div>
                <div class="folio">Folio: AL-DEP-${doc.id.slice(0, 8).toUpperCase()}</div>
            </div>

            <div class="section-title">Datos del Trabajador</div>
            <div class="field-row"><span class="field-label">Nombre del Trabajador:</span><span class="field-value">${workerName}</span></div>
            <div class="field-row"><span class="field-label">Nombre del Patrón / Empresa:</span><span class="field-value">${employerName}</span></div>
            <div class="field-row"><span class="field-label">Salario Diario:</span><span class="field-value">${salary}</span></div>
            <div class="field-row"><span class="field-label">Antigüedad:</span><span class="field-value">${years}</span></div>
            <div class="field-row"><span class="field-label">Fecha de Despido:</span><span class="field-value">${separationDate}</span></div>

            <div class="section-title">Cuerpo del Escrito</div>
            <p class="body-text">
                Yo, <strong>${workerName}</strong>, por medio del presente escrito y con fundamento en los artículos 
                <strong>47, 48, 50 y 51 de la Ley Federal del Trabajo</strong>, hago constar que fui despedido(a) de manera 
                <strong>injustificada e intempestiva</strong> por parte de <strong>${employerName}</strong>, 
                con fecha <strong>${separationDate}</strong>, sin que mediara causa alguna justificada conforme a derecho.
            </p>
            <p class="body-text">
                Por lo anterior, solicito de manera formal que se me cubran las siguientes indemnizaciones contempladas en la Ley:
            </p>
            <p class="body-text">
                <strong>a) Indemnización constitucional:</strong> equivalente a <strong>3 meses de salario</strong> (Art. 50, fracc. I LFT);<br/>
                <strong>b) 20 días de salario por año de servicio</strong> prestado (Art. 50, fracc. II LFT);<br/>
                <strong>c) Partes proporcionales de prestaciones:</strong> aguinaldo, vacaciones, prima vacacional y PTU;<br/>
                <strong>d) Salarios vencidos</strong> desde la fecha del despido hasta que se efectúe el pago correspondiente.
            </p>
            <p class="body-text">
                Asimismo, me reservo el derecho de acudir ante el <strong>Centro de Conciliación y Registro Laboral (CECRL)</strong> 
                o ante la <strong>Junta Local de Conciliación y Arbitraje</strong> correspondiente, a fin de hacer valer mis 
                derechos laborales en su totalidad, en caso de que no se dé solución a la presente reclamación en un plazo 
                de <strong>5 días hábiles</strong>.
            </p>

            <div class="disclaimer">
                ⚠️ <strong>Aviso Legal:</strong> Este documento es un borrador orientativo generado mediante tecnología de Aliado Laboral. 
                No constituye demanda formal ante autoridad. Se recomienda la asesoría de un abogado laboralista para determinar la 
                instancia competente (CECRL, JLCA) y la estrategia legal más adecuada para tu caso específico.
            </div>

            <div class="signature-section">
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-label"><strong>${workerName}</strong><br/>Trabajador Afectado</div>
                </div>
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-label">Acuse de Recibido<br/>Patrón / Empresa</div>
                </div>
            </div>

            <div class="footer">Generado por Aliado Laboral — aliadolaboral.com | Folio AL-DEP-${doc.id.slice(0, 8).toUpperCase()} | ${dateStr}</div>
        </div></body></html>`;
    }

    // ── TEMPLATE 3: Reclamación de Prestaciones Pendientes ──
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${commonStyles}</head><body><div class="page">
        <div class="header">
            ${logoHtml}
            <div class="doc-title">Reclamación de Prestaciones Pendientes</div>
            <div class="doc-subtitle">Ley Federal del Trabajo — Art. 76, 80, 87 y 117</div>
            <div class="meta">Fecha: ${dateStr}</div>
            <div class="folio">Folio: AL-PRE-${doc.id.slice(0, 8).toUpperCase()}</div>
        </div>

        <div class="section-title">Datos del Trabajador</div>
        <div class="field-row"><span class="field-label">Nombre del Trabajador:</span><span class="field-value">${workerName}</span></div>
        <div class="field-row"><span class="field-label">Nombre del Patrón / Empresa:</span><span class="field-value">${employerName}</span></div>
        <div class="field-row"><span class="field-label">Salario Diario:</span><span class="field-value">${salary}</span></div>
        <div class="field-row"><span class="field-label">Antigüedad:</span><span class="field-value">${years}</span></div>

        <div class="section-title">Cuerpo del Escrito</div>
        <p class="body-text">
            Por medio del presente, yo <strong>${workerName}</strong>, trabajador(a) activo(a) o que ha prestado 
            servicios a <strong>${employerName}</strong>, con base en los artículos 76, 80, 87 y 117 de la 
            <strong>Ley Federal del Trabajo</strong>, hago formal reclamación del pago de las siguientes 
            <strong>prestaciones legales devengadas y no cubiertas</strong>:
        </p>
        <p class="body-text">
            <strong>a) Días de vacaciones no disfrutadas</strong> (Art. 76 LFT), conforme a la tabla de antigüedad vigente;<br/>
            <strong>b) Prima vacacional</strong> equivalente al 25% del salario por los días de vacaciones correspondientes (Art. 80 LFT);<br/>
            <strong>c) Aguinaldo o parte proporcional del mismo</strong> (Art. 87 LFT), equivalente a mínimo 15 días de salario por año;<br/>
            <strong>d) Participación en las Utilidades (PTU)</strong> proporcional al tiempo laborado durante el ejercicio fiscal (Art. 117 LFT).
        </p>
        <p class="body-text">
            Solicito que se dé respuesta y pago a lo anterior en un término no mayor a <strong>72 horas hábiles</strong>, 
            apercibido(a) de que ante la omisión o negativa infundada, acudiré ante la autoridad laboral competente 
            para la defensa de mis derechos.
        </p>

        <div class="disclaimer">
            ⚠️ <strong>Aviso Legal:</strong> Documento orientativo generado por Aliado Laboral. No constituye demanda formal. 
            El cálculo exacto de las prestaciones deberá validarse con los recibos de nómina del período correspondiente 
            y la tabla actualizada de vacaciones. Para asesoría personalizada, consulta un abogado laboralista.
        </div>

        <div class="signature-section">
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label"><strong>${workerName}</strong><br/>Trabajador Reclamante</div>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Acuse de Recibido<br/>Patrón / Empresa</div>
            </div>
        </div>

        <div class="footer">Generado por Aliado Laboral — aliadolaboral.com | Folio AL-PRE-${doc.id.slice(0, 8).toUpperCase()} | ${dateStr}</div>
    </div></body></html>`;
}
