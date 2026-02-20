import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateCaseFile = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;

        // Fetch Full Case Data
        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId },
            include: {
                worker: true
            }
        });

        if (!request) {
            return res.status(404).send('Expediente no encontrado');
        }

        const worker = request.worker;
        const now = new Date();

        // HTML TEMPLATE

        const puppeteer = require('puppeteer');
        const path = require('path');
        const fs = require('fs');

        // ... (previous code)

        // HTML TEMPLATE with Local Image
        // Note: For Puppeteer, we can use base64 for reliable image rendering
        const logoPath = path.join(__dirname, '../../public/assets/logo.png');
        let logoBase64 = '';
        try {
            const logoData = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        } catch (e) {
            console.warn('Logo not found for PDF', e);
        }

        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                .logo-img { max-height: 80px; margin-bottom: 10px; }
                .title { font-size: 20px; font-weight: bold; margin-top: 10px; text-transform: uppercase; }
                .section { margin-bottom: 25px; page-break-inside: avoid; }
                .section-title { background: #f3f4f6; padding: 8px; font-weight: bold; border-left: 4px solid #2563EB; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }
                .field { margin-bottom: 5px; }
                .label { font-weight: bold; font-size: 0.9em; color: #666; }
                .value { font-size: 1.1em; }
                .carta-poder { border: 1px dashed #999; padding: 20px; background: #fffdf0; margin-top: 30px; page-break-inside: avoid; }
                .firma-box { margin-top: 60px; text-align: center; }
                .firma-line { border-top: 1px solid #000; width: 300px; margin: 0 auto; margin-bottom: 10px; }
                .footer { font-size: 0.8em; text-align: center; margin-top: 50px; color: #999; }
            </style>
        </head>
        <body>
            <div class="header">
                ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" />` : '<div style="font-size: 24px; font-weight: bold; color: #2563EB;">ALIADO LABORAL ⚖️</div>'}
                <div class="title">EXPEDIENTE DIGITAL ESTRUCTURADO</div>
                <div>Folio: #${request.id.slice(0, 8).toUpperCase()}</div>
                <div>Fecha de Generación: ${now.toLocaleDateString()}</div>
            </div>

            <div class="section">
                <div class="section-title">1. DATOS DEL TRABAJADOR (Cliente)</div>
                <div class="grid">
                    <div class="field">
                        <div class="label">Nombre Completo:</div>
                        <div class="value">${worker.fullName || 'No registrado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">Email:</div>
                        <div class="value">${worker.email}</div>
                    </div>
                    <div class="field">
                        <div class="label">Teléfono:</div>
                        <div class="value">${worker.phoneNumber || 'No registrado'} ${worker.isPhoneVerified ? '✅ Verificado' : '⚠️ No Verificado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">ID Sistema:</div>
                        <div class="value">${worker.id}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">2. DETALLES DEL CONFLICTO</div>
                <div class="field">
                    <div class="label">Resumen del Usuario:</div>
                    <div class="value" style="background: #f9fafb; padding: 10px; border-radius: 4px;">"${request.caseSummary}"</div>
                </div>
                <div class="grid">
                    <div class="field">
                        <div class="label">Tipo de Caso:</div>
                        <div class="value">${request.caseType || 'No especificado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">Patrón/Empresa:</div>
                        <div class="value">${request.employerName || 'No especificado'}</div>
                    </div>
                    <div class="field">
                        <div class="label">Nivel de Urgencia:</div>
                        <div class="value">${request.urgency.toUpperCase()}</div>
                    </div>
                    <div class="field">
                        <div class="label">Liquidación Estimada LFT:</div>
                        <div class="value">$${Number(request.estimatedSeverance || 0).toLocaleString()} MXN</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">3. ANÁLISIS PRELIMINAR (IA)</div>
                <div class="field">
                    <div class="value" style="white-space: pre-wrap;">${request.aiSummary || 'Pendiente de análisis detallado.'}</div>
                </div>
            </div>

            <!-- CARTA PODER SECTION (PITCH PROMISE) -->
            <div class="carta-poder">
                <h3 style="text-align: center; margin-top: 0;">FORMATO DE CARTA PODER (Borrador)</h3>
                <p>
                    Yo, <strong>${worker.fullName || '__________________________'}</strong>, por la presente otorgo PODER AMPLIO, CUMPLIDO Y BASTANTE, 
                    para que a mi nombre y representación, promueva juicio laboral en contra de <strong>${request.employerName || '__________________________'}</strong>, 
                    ante la autoridad competente.
                </p>
                <p>
                    Asimismo, faculto a mi apoderado legal para que conteste demandas, oponga excepciones, ofrezca pruebas, 
                    interponga recursos y realice cuantos actos sean necesarios para la defensa de mis intereses.
                </p>
                
                <div class="firma-box">
                    <div class="firma-line"></div>
                    <div>Firma del Trabajador</div>
                    <div style="font-size: 0.9em; color: #666;">(Imprimir y Firmar)</div>
                </div>
            </div>

            <div class="footer">
                Generado por el Sistema Aliado Laboral para uso exclusivo del Abogado Asignado.<br>
                Este documento contiene datos sensibles protegidos por la Ley Federal de Protección de Datos Personales.
            </div>
        </body>
        </html>
        `;

        // GENERATE PDF WITH PUPPETEER
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some environments (like DigitalOcean droplets)
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Expediente_${worker.fullName?.replace(/\s+/g, '_') || 'Laboral'}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate PDF Error:', error);
        res.status(500).send('Error generando PDF');
    }
};
