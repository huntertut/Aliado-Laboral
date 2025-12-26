
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Worker Profile
export const getProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;

        // Defensive check: If userId is missing, something went wrong in auth
        if (!userId) {
            console.error('GET /worker-profile: req.user.id is missing');
            return res.status(400).json({
                error: 'User ID not found. Please log out and log in again.'
            });
        }

        const profile = await prisma.workerProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        fullName: true
                    }
                }
            }
        });

        if (!profile) {
            // Get user to return fullName even if no profile yet
            const user = await prisma.user.findUnique({ where: { id: userId } });
            return res.json({
                fullName: user?.fullName || '',
                occupation: '',
                federalEntity: '',
                startDate: null,
                monthlySalary: null,
                profedetIsActive: false,
                profedetStage: null,
                profedetCaseFile: null,
                profedetInitialContact: null,
                profedetDocuments: []
            });
        }

        // Parse JSON strings back to objects
        const initialContact = profile.profedetInitialContact ? JSON.parse(profile.profedetInitialContact) : null;
        const documents = profile.profedetDocuments ? JSON.parse(profile.profedetDocuments) : [];

        res.json({
            ...profile,
            fullName: profile.user?.fullName || '',
            profedetInitialContact: initialContact,
            profedetDocuments: documents
        });
    } catch (error) {
        console.error('Error fetching worker profile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
};

// Update/Upsert Worker Profile
export const updateProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const {
            fullName,
            occupation,
            federalEntity,
            startDate,
            monthlySalary,
            profedetIsActive,
            profedetStage,
            profedetCaseFile,
            profedetInitialContact, // Expecting object
            profedetDocuments // Expecting array
        } = req.body;

        // Serialize objects to JSON strings for SQLite
        const initialContactStr = profedetInitialContact ? JSON.stringify(profedetInitialContact) : null;
        const documentsStr = profedetDocuments ? JSON.stringify(profedetDocuments) : null;

        // Update User's fullName if provided
        if (fullName !== undefined) {
            await prisma.user.update({
                where: { id: userId },
                data: { fullName }
            });
        }

        const profile = await prisma.workerProfile.upsert({
            where: { userId },
            update: {
                occupation,
                federalEntity,
                startDate: startDate ? new Date(startDate) : null,
                monthlySalary,
                profedetIsActive,
                profedetStage,
                profedetCaseFile,
                profedetInitialContact: initialContactStr,
                profedetDocuments: documentsStr
            },
            create: {
                userId,
                occupation,
                federalEntity,
                startDate: startDate ? new Date(startDate) : null,
                monthlySalary,
                profedetIsActive,
                profedetStage,
                profedetCaseFile,
                profedetInitialContact: initialContactStr,
                profedetDocuments: documentsStr
            }
        });

        res.json(profile);
    } catch (error) {
        console.error('Error updating worker profile:', error);
        res.status(500).json({ error: 'Error updating profile' });
    }
};
