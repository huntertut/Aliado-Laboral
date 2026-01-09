import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as storageService from '../services/storageService';

const prisma = new PrismaClient();

// PÚBLICO - Listar abogados con suscripción activa
export const getPublicLawyers = async (req: Request, res: Response) => {
    try {
        const { specialty, state, caseType } = req.query;

        const whereClause: any = {
            // Solo mostrar abogados con suscripción activa y verificados
            lawyer: {
                subscription: {
                    status: 'active'
                },
                isVerified: true
            },
            // Debe tener al menos 2 casos ganados
            wonCase1Summary: { not: null },
            wonCase2Summary: { not: null }
        };

        // Filtro por Especialidad
        if (specialty) {
            whereClause.lawyer.specialty = specialty as string;
        }

        // Filtro por Estado (Jurisdicción)
        if (state) {
            whereClause.lawyer.OR = [
                { nationalScope: true },
                { availableStates: { has: state as string } }
            ];
        }

        // Filtro por Tipo de Caso (Federal/Local)
        if (caseType) {
            if (caseType === 'federal') {
                whereClause.lawyer.acceptsFederalCases = true;
            } else if (caseType === 'local') {
                whereClause.lawyer.acceptsLocalCases = true;
            }
        }

        const lawyers = await prisma.lawyerProfile.findMany({
            where: whereClause,
            include: {
                lawyer: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                id: true
                            }
                        }
                    }
                }
            },
            orderBy: { profileViews: 'desc' }
        });

        // Mapear a formato público (SIN datos de contacto)
        const publicProfiles = lawyers.map(profile => ({
            id: profile.id,
            lawyerId: profile.lawyerId,
            name: profile.lawyer.user.fullName,
            specialty: profile.lawyer.specialty,
            photoUrl: profile.photoUrl,
            yearsOfExperience: profile.yearsOfExperience,
            bio: profile.bio,
            wonCases: [
                profile.wonCase1Summary,
                profile.wonCase2Summary,
                profile.wonCase3Summary
            ].filter(Boolean),
            successRate: profile.successRate,
            profileViews: profile.profileViews,
            licenseNumber: profile.lawyer.licenseNumber,
            isVerified: profile.lawyer.isVerified,
            // Reputation Metadata
            reputationScore: profile.reputationScore,
            totalCases: profile.totalCases,
            successfulCases: profile.successfulCases,
            // Scope Info
            nationalScope: profile.lawyer.nationalScope,
            availableStates: profile.lawyer.availableStates,
            acceptsFederalCases: profile.lawyer.acceptsFederalCases,
            acceptsLocalCases: profile.lawyer.acceptsLocalCases,
            requiresPhysicalPresence: profile.lawyer.requiresPhysicalPresence,
            physicalPresenceStates: profile.lawyer.physicalPresenceStates
            // NO incluir: phone, whatsapp, email
        }));

        res.json({ lawyers: publicProfiles });

    } catch (error: any) {
        console.error('Error al obtener abogados:', error);
        res.status(500).json({ error: 'Error al obtener abogados' });
    }
};

// PÚBLICO - Ver perfil público de un abogado específico
export const getPublicProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const profile = await prisma.lawyerProfile.findUnique({
            where: { id },
            include: {
                lawyer: {
                    include: {
                        user: {
                            select: {
                                fullName: true
                            }
                        },
                        subscription: {
                            select: {
                                status: true
                            }
                        }
                    }
                }
            }
        });

        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        // Verificar que tenga suscripción activa
        if (profile.lawyer.subscription?.status !== 'active') {
            return res.status(404).json({
                error: 'Este abogado no está disponible actualmente'
            });
        }

        // Incrementar contador de vistas
        await prisma.lawyerProfile.update({
            where: { id },
            data: { profileViews: { increment: 1 } }
        });

        // Retornar solo información pública
        const publicProfile = {
            id: profile.id,
            lawyerId: profile.lawyerId,
            name: profile.lawyer.user.fullName,
            specialty: profile.lawyer.specialty,
            photoUrl: profile.photoUrl,
            yearsOfExperience: profile.yearsOfExperience,
            bio: profile.bio,
            wonCases: [
                profile.wonCase1Summary,
                profile.wonCase2Summary,
                profile.wonCase3Summary
            ].filter(Boolean),
            successRate: profile.successRate,
            profileViews: profile.profileViews,
            licenseNumber: profile.lawyer.licenseNumber,
            isVerified: profile.lawyer.isVerified
        };

        res.json({ profile: publicProfile });

    } catch (error: any) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};

// ABOGADO - Editar mi perfil
export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const {
            // Frontend fields (LawyerProfessionalDataSection)
            professionalName,
            specialty,
            experienceYears, // Frontend sends this
            attentionHours,
            phone,
            email,
            // Legacy/additional fields
            photoUrl,
            yearsOfExperience, // Fallback
            bio,
            wonCase1Summary,
            wonCase2Summary,
            wonCase3Summary,
            whatsapp,
            // Scope Fields
            nationalScope,
            availableStates,
            acceptsFederalCases,
            acceptsLocalCases,
            requiresPhysicalPresence,
            physicalPresenceStates,
            isCorrespondent
        } = req.body;

        console.log('📝 [updateMyProfile] Datos recibidos:', { specialty, experienceYears, attentionHours, phone, email });

        // Map experienceYears to yearsOfExperience if provided
        const finalYearsOfExperience = experienceYears !== undefined ? experienceYears : yearsOfExperience;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true, user: true }
        });

        console.log('🔍 [updateMyProfile] Info Usuario:', { userId, role: (req as any).user?.role });
        console.log('🔍 [updateMyProfile] Lawyer Record found:', !!lawyer, lawyer?.id);
        console.log('🔍 [updateMyProfile] Profile Record found:', !!lawyer?.profile, lawyer?.profile?.id);

        if (!lawyer) {
            console.error('❌ [updateMyProfile] No se encontró el abogado para el usuario:', userId);
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }

        console.log('🔍 [updateMyProfile] Abogado encontrado:', lawyer.id);

        // Extraer campos de contacto del objeto contactInfo si el frontend los envió ahí (legacy/compat)
        const finalPhone = phone || req.body.contactInfo?.phone;
        const finalEmail = email || req.body.contactInfo?.email;

        // Actualizar datos base del abogado
        const lawyerUpdateResult = await prisma.lawyer.update({
            where: { id: lawyer.id },
            data: {
                specialty: specialty || undefined,
                professionalName: professionalName || undefined
            }
        });
        console.log('✅ [updateMyProfile] Lawyer Update Result:', {
            specialty: lawyerUpdateResult.specialty,
            professionalName: lawyerUpdateResult.professionalName
        });

        // Sincronizar con el nombre real del usuario si es necesario
        if (professionalName && userId) {
            console.log('👤 [updateMyProfile] Sincronizando nombre de usuario:', professionalName);
            const userUpdateResult = await prisma.user.update({
                where: { id: userId },
                data: { fullName: professionalName }
            });
            console.log('✅ [updateMyProfile] User Name Update Result:', userUpdateResult.fullName);
        }

        console.log('DEBUG: Updating bio to:', bio);
        console.log('DEBUG: Updating attentionHours to:', attentionHours);

        let finalPhotoUrl = photoUrl;

        // Si photoUrl es un Base64, subirlo a Firebase Storage
        if (photoUrl && photoUrl.startsWith('data:image')) {
            console.log('🖼️ [updateMyProfile] Detectado Base64, subiendo a Firebase...');
            try {
                const base64Data = photoUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const extension = photoUrl.split(';')[0].split('/')[1];
                const destination = `profiles/lawyer_${lawyer.id}/avatar_${Date.now()}.${extension}`;

                finalPhotoUrl = await storageService.uploadBuffer(buffer, destination, `image/${extension}`);
                console.log('✅ [updateMyProfile] Imagen subida:', finalPhotoUrl);
            } catch (uploadError) {
                console.error('❌ [updateMyProfile] Error subiendo imagen:', uploadError);
                // Keep the old one or continue without updating photo
            }
        }

        if (lawyer.profile) {
            // Actualizar perfil existente
            const updatedProfile = await prisma.lawyerProfile.update({
                where: { id: lawyer.profile.id },
                data: {
                    photoUrl: finalPhotoUrl !== undefined ? finalPhotoUrl : undefined,
                    yearsOfExperience: finalYearsOfExperience !== undefined ? Number(finalYearsOfExperience) : undefined,
                    bio: bio !== undefined ? bio : undefined,
                    wonCase1Summary,
                    wonCase2Summary,
                    wonCase3Summary,
                    phone: finalPhone || undefined,
                    whatsapp,
                    attentionHours: attentionHours || undefined,
                    email: finalEmail || undefined
                }
            });

            console.log('✅ [updateMyProfile] Perfil actualizado con éxito. New attentionHours:', updatedProfile.attentionHours);

            res.json({
                message: 'Perfil actualizado',
                profile: updatedProfile
            });
        } else {
            // Crear perfil nuevo
            const newProfile = await prisma.lawyerProfile.create({
                data: {
                    lawyerId: lawyer.id,
                    photoUrl: finalPhotoUrl,
                    yearsOfExperience: finalYearsOfExperience !== undefined ? Number(finalYearsOfExperience) : 0,
                    bio,
                    wonCase1Summary,
                    wonCase2Summary,
                    wonCase3Summary,
                    phone: finalPhone,
                    whatsapp,
                    attentionHours,
                    email: finalEmail
                }
            });

            console.log('✅ [updateMyProfile] Perfil creado con éxito');

            res.json({
                message: 'Perfil creado',
                profile: newProfile
            });
        }

    } catch (error: any) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
};

// ABOGADO - Ver mis métricas
export const getMyMetrics = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: {
                profile: {
                    include: {
                        requests: {
                            select: {
                                status: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        });

        if (!lawyer || !lawyer.profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        const requests = lawyer.profile.requests;

        const metrics = {
            profileViews: lawyer.profile.profileViews,
            totalRequests: requests.length,
            pendingRequests: requests.filter(r => r.status === 'pending').length,
            acceptedRequests: requests.filter(r => r.status === 'accepted').length,
            rejectedRequests: requests.filter(r => r.status === 'rejected').length,
            successRate: lawyer.profile.successRate,
            requestsThisMonth: requests.filter(r => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return r.createdAt > monthAgo;
            }).length
        };

        res.json({ metrics });

    } catch (error: any) {
        console.error('Error al obtener métricas:', error);
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
};

// ABOGADO - Obtener mi perfil completo (privado)
export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId },
            include: {
                profile: true,
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        if (!lawyer) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        // Return flattened structure or structured?
        // Let's return structured properly
        res.json({
            lawyerId: lawyer.id,
            licenseNumber: lawyer.licenseNumber,
            specialty: lawyer.specialty,
            professionalName: lawyer.user.fullName,
            email: lawyer.user.email,
            // Profile data (might be null if new)
            experienceYears: lawyer.profile?.yearsOfExperience || 0,
            bio: lawyer.profile?.bio || '',
            phone: lawyer.profile?.phone || '',
            whatsapp: lawyer.profile?.whatsapp || '',
            attentionHours: lawyer.profile?.attentionHours || '9:00 AM - 6:00 PM',
            // ... add other fields as needed matching frontend expectations or DB schema
        });

    } catch (error: any) {
        console.error('Error al obtener mi perfil:', error);
        res.status(500).json({ error: 'Error al obtener mi perfil' });
    }
};
