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
exports.updateProfile = exports.getProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get Worker Profile
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Defensive check: If userId is missing, something went wrong in auth
        if (!userId) {
            console.error('GET /worker-profile: req.user.id is missing');
            return res.status(400).json({
                error: 'User ID not found. Please log out and log in again.'
            });
        }
        const profile = yield prisma.workerProfile.findUnique({
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
            const user = yield prisma.user.findUnique({ where: { id: userId } });
            return res.json({
                fullName: (user === null || user === void 0 ? void 0 : user.fullName) || '',
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
        res.json(Object.assign(Object.assign({}, profile), { fullName: ((_b = profile.user) === null || _b === void 0 ? void 0 : _b.fullName) || '', profedetInitialContact: initialContact, profedetDocuments: documents }));
    }
    catch (error) {
        console.error('Error fetching worker profile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
});
exports.getProfile = getProfile;
// Update/Upsert Worker Profile
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { fullName, occupation, federalEntity, startDate, monthlySalary, profedetIsActive, profedetStage, profedetCaseFile, profedetInitialContact, // Expecting object
        profedetDocuments // Expecting array
         } = req.body;
        // Serialize objects to JSON strings for SQLite
        const initialContactStr = profedetInitialContact ? JSON.stringify(profedetInitialContact) : null;
        const documentsStr = profedetDocuments ? JSON.stringify(profedetDocuments) : null;
        // Update User's fullName if provided
        if (fullName !== undefined) {
            yield prisma.user.update({
                where: { id: userId },
                data: { fullName }
            });
        }
        const profile = yield prisma.workerProfile.upsert({
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
    }
    catch (error) {
        console.error('Error updating worker profile:', error);
        res.status(500).json({ error: 'Error updating profile' });
    }
});
exports.updateProfile = updateProfile;
