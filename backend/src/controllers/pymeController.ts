import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PymeService } from '../services/pymeService';
import OpenAI from 'openai';

const prisma = new PrismaClient();

export const getPymeProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.pymeProfile.findUnique({
            where: { userId },
            include: {
                assignedLawyer: {
                    include: {
                        user: {
                            select: { fullName: true, email: true }
                        }
                    }
                }
            } as any
        });

        if (!profile) {
            return res.status(404).json({ error: 'Perfil Pyme no encontrado' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching pyme profile:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const updatePymeProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { razonSocial, rfc, industry } = req.body;

        const profile = await prisma.pymeProfile.update({
            where: { userId },
            data: {
                razonSocial,
                rfc,
                industry
            }
        });

        res.json(profile);
    } catch (error) {
        console.error('Error updating pyme profile:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
};

export const getCompliance = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.pymeProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Pyme no encontrada' });

        const compliance = await PymeService.evaluateCompliance(profile.id);
        res.json(compliance);
    } catch (error) {
        console.error('Error at getCompliance:', error);
        res.status(500).json({ error: 'Error al evaluar cumplimiento' });
    }
};

export const calculateLiquidation = async (req: Request, res: Response) => {
    try {
        const result = PymeService.calculateLiquidation(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error en el cálculo' });
    }
};

export const getEmployees = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.pymeProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Pyme no encontrada' });

        const employees = await prisma.pymeEmployee.findMany({
            where: { pymeProfileId: profile.id }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar empleados' });
    }
};

export const addEmployee = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.pymeProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Pyme no encontrada' });

        const employee = await prisma.pymeEmployee.create({
            data: {
                ...req.body,
                pymeProfileId: profile.id,
                joinDate: new Date(req.body.joinDate)
            }
        });
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar empleado' });
    }
};

export const getPymeLiability = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.pymeProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Pyme no encontrada' });

        const liability = await PymeService.getLiabilityReport(profile.id);
        res.json(liability);
    } catch (error) {
        console.error('Liability Error:', error);
        res.status(500).json({ error: 'Error al calcular pasivo laboral' });
    }
};

export const generateAdministrativeAct = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { employeeId, incident, date } = req.body;

        const profile = await prisma.pymeProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Pyme no encontrada' });

        const employee = await prisma.pymeEmployee.findUnique({ where: { id: employeeId } });
        if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });

        // AI Generation
        if (!process.env.GROQ_API_KEY) {
            return res.json({
                content: `<h1>Acta Administrativa (MOCK)</h1><p>Empleado: ${employee.fullName}</p><p>Incidente: ${incident}</p><p>Nota: Configura GROQ_API_KEY para contenido real.</p>`
            });
        }

        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
        });

        const prompt = `
            Eres un abogado laboral experto en México.
            Redacta un "Acta Administrativa" formal.
            
            Datos:
            - Empresa: ${profile.razonSocial || 'La Empresa'}
            - Empleado: ${employee.fullName} (RFC: ${employee.rfc || 'N/A'})
            - Fecha del incidente: ${date}
            - Descripción de los hechos: "${incident}"
            
            Instrucciones:
            - Cita los artículos de la Ley Federal del Trabajo (LFT) aplicables.
            - Usa lenguaje legal formal, firme pero respetuoso.
            - Estructura: Lugar y Fecha, Comparecientes, Declaración de Hechos, Fundamento Legal, Cierre y Firmas.
            - Devuelve el resultado en formato MARKDOWN limpio interactivo (negritas, listas, titulos). NO uses HTML.
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192", // Smart Model for Drafting
        });

        const htmlContent = completion.choices[0]?.message?.content;
        res.json({ content: htmlContent });

    } catch (error: any) {
        console.error('Act Generation Error:', error);
        res.status(500).json({ error: 'Error al generar el acta' });
    }
};
