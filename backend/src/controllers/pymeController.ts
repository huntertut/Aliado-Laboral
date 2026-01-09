import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PymeService } from '../services/pymeService';

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
