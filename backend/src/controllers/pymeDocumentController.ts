import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// MOCK: En producción esto subiría a S3/GCS
const uploadDocument = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const { type, name, base64 } = req.body;

        const pymeProfile = await prisma.pymeProfile.findUnique({ where: { userId } });
        if (!pymeProfile) return res.status(404).json({ error: 'Perfil Pyme no encontrado' });

        // Basic Plan Restriction: Max 3 documents
        // Check current count
        const docCount = await prisma.pymeDocument.count({
            where: { pymeProfileId: pymeProfile.id }
        });

        // NOTA: En un caso real, validaríamos aquí el plan, pero el frontend controlará el UI
        // Para Basic, advertimos si excede
        // if (docCount >= 3 && user.subscriptionLevel === 'basic') ...

        // Mock upload: Save metadata only
        const newDoc = await prisma.pymeDocument.create({
            data: {
                pymeProfileId: pymeProfile.id,
                type,
                name: name || `Documento ${docCount + 1}`,
                url: 'https://via.placeholder.com/150', // Mock URL
                fileSize: 1024 * 50 // 50KB Mock
            }
        });

        // Update Risk Score (Simple Rule: Each doc reduces risk by 5 points, min 10)
        let newRisk = pymeProfile.riskScore - 5;
        if (newRisk < 10) newRisk = 10;

        await prisma.pymeProfile.update({
            where: { id: pymeProfile.id },
            data: { riskScore: newRisk }
        });

        res.json(newDoc);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Error interno' });
    }
};

const getDocuments = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const pymeProfile = await prisma.pymeProfile.findUnique({ where: { userId } });
        if (!pymeProfile) return res.status(404).json({ error: 'Perfil Pyme no encontrado' });

        const docs = await prisma.pymeDocument.findMany({
            where: { pymeProfileId: pymeProfile.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
};

const analyzeContract = async (req: Request, res: Response) => {
    // Basic Plan: Mock Analysis (Static Educational Content)
    // No guarda nada real, solo devuelve feedback simulado

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.json({
        riskLevel: 'medium', // low, medium, high
        issues: [
            { id: 1, text: 'No se detectó jornada laboral específica', severity: 'high' },
            { id: 2, text: 'Falta cláusula de confidencialidad', severity: 'medium' },
            { id: 3, text: 'Lugar de trabajo no definido claramente', severity: 'low' }
        ],
        recommendation: 'Te recomendamos usar nuestros formatos estándar (Pro) para asegurar cumplimiento.'
    });
};

export default {
    uploadDocument,
    getDocuments,
    analyzeContract
};
