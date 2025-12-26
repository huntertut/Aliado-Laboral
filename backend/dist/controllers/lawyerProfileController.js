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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = exports.getMyMetrics = exports.updateMyProfile = exports.getPublicProfile = exports.getPublicLawyers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// PÚBLICO - Listar abogados con suscripción activa
const getPublicLawyers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { specialty, state, caseType } = req.query;
        const whereClause = {
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
            whereClause.lawyer.specialty = specialty;
        }
        // Filtro por Estado (Jurisdicción)
        if (state) {
            whereClause.lawyer.OR = [
                { nationalScope: true },
                { availableStates: { has: state } }
            ];
        }
        // Filtro por Tipo de Caso (Federal/Local)
        if (caseType) {
            if (caseType === 'federal') {
                whereClause.lawyer.acceptsFederalCases = true;
            }
            else if (caseType === 'local') {
                whereClause.lawyer.acceptsLocalCases = true;
            }
        }
        const lawyers = yield prisma.lawyerProfile.findMany({
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
    }
    catch (error) {
        console.error('Error al obtener abogados:', error);
        res.status(500).json({ error: 'Error al obtener abogados' });
    }
});
exports.getPublicLawyers = getPublicLawyers;
// PÚBLICO - Ver perfil público de un abogado específico
const getPublicProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const profile = yield prisma.lawyerProfile.findUnique({
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
        if (((_a = profile.lawyer.subscription) === null || _a === void 0 ? void 0 : _a.status) !== 'active') {
            return res.status(404).json({
                error: 'Este abogado no está disponible actualmente'
            });
        }
        // Incrementar contador de vistas
        yield prisma.lawyerProfile.update({
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
    }
    catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});
exports.getPublicProfile = getPublicProfile;
// ABOGADO - Editar mi perfil
const updateMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { 
        // Frontend fields (LawyerProfessionalDataSection)
        professionalName, specialty, experienceYears, // Frontend sends this
        attentionHours, phone, email, 
        // Legacy/additional fields
        photoUrl, yearsOfExperience, // Fallback
        bio, wonCase1Summary, wonCase2Summary, wonCase3Summary, whatsapp, 
        // Scope Fields
        nationalScope, availableStates, acceptsFederalCases, acceptsLocalCases, requiresPhysicalPresence, physicalPresenceStates, isCorrespondent } = req.body;
        // Map experienceYears to yearsOfExperience if provided
        const finalYearsOfExperience = experienceYears !== undefined ? experienceYears : yearsOfExperience;
        const lawyer = yield prisma.lawyer.findUnique({
            where: { userId },
            include: { profile: true }
        });
        if (!lawyer) {
            return res.status(404).json({ error: 'Perfil de abogado no encontrado' });
        }
        // Actualizar datos base del abogado
        // NOTE: Only updating fields that exist in schema
        // professionalName, nationalScope, etc. don't exist yet - would need migration
        yield prisma.lawyer.update({
            where: { id: lawyer.id },
            data: {
                specialty // Only field that exists in Lawyer table
            }
        });
        if (lawyer.profile) {
            // Actualizar perfil existente
            // NOTE: attentionHours and email don't exist in schema yet
            const updatedProfile = yield prisma.lawyerProfile.update({
                where: { id: lawyer.profile.id },
                data: {
                    photoUrl,
                    yearsOfExperience: finalYearsOfExperience,
                    bio,
                    wonCase1Summary,
                    wonCase2Summary,
                    wonCase3Summary,
                    phone,
                    whatsapp,
                    attentionHours,
                    email
                }
            });
            res.json({
                message: 'Perfil actualizado',
                profile: updatedProfile
            });
        }
        else {
            // Crear perfil nuevo
            const newProfile = yield prisma.lawyerProfile.create({
                data: {
                    lawyerId: lawyer.id,
                    photoUrl,
                    yearsOfExperience: finalYearsOfExperience || 0,
                    bio,
                    wonCase1Summary,
                    wonCase2Summary,
                    wonCase3Summary,
                    phone,
                    whatsapp,
                    attentionHours,
                    email
                }
            });
            res.json({
                message: 'Perfil creado',
                profile: newProfile
            });
        }
    }
    catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});
exports.updateMyProfile = updateMyProfile;
// ABOGADO - Ver mis métricas
const getMyMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const lawyer = yield prisma.lawyer.findUnique({
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
    }
    catch (error) {
        console.error('Error al obtener métricas:', error);
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
});
exports.getMyMetrics = getMyMetrics;
// ABOGADO - Obtener mi perfil completo (privado)
const getMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const lawyer = yield prisma.lawyer.findUnique({
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
            experienceYears: ((_b = lawyer.profile) === null || _b === void 0 ? void 0 : _b.yearsOfExperience) || 0,
            bio: ((_c = lawyer.profile) === null || _c === void 0 ? void 0 : _c.bio) || '',
            phone: ((_d = lawyer.profile) === null || _d === void 0 ? void 0 : _d.phone) || '',
            whatsapp: ((_e = lawyer.profile) === null || _e === void 0 ? void 0 : _e.whatsapp) || '',
            attentionHours: '', // Not in DB yet? Warning.
            // ... add other fields as needed matching frontend expectations or DB schema
        });
    }
    catch (error) {
        console.error('Error al obtener mi perfil:', error);
        res.status(500).json({ error: 'Error al obtener mi perfil' });
    }
});
exports.getMyProfile = getMyProfile;
