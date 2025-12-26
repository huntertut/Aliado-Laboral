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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = exports.verifyFirebaseToken = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const firebase_1 = __importDefault(require("../config/firebase"));
// Verify Firebase ID Token and return user data with role
const verifyFirebaseToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'ID Token is required' });
        }
        // Verify the Firebase ID token
        const decodedToken = yield firebase_1.default.auth().verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email;
        // Look up user role in database
        const userRole = yield prisma.userRole.findUnique({
            where: { firebaseUid }
        });
        if (!userRole) {
            console.error(`[verifyFirebaseToken] UserRole not found for UID: ${firebaseUid}`);
            return res.status(404).json({
                error: 'Usuario no encontrado en el sistema. Contacta al administrador.'
            });
        }
        // Fetch full User record matching the email to be safe
        let user = yield prisma.user.findUnique({
            where: { email: userRole.email }
        });
        if (user) {
            // Update UserRole to stay in sync with User
            if (userRole.userId !== user.id || userRole.fullName !== user.fullName) {
                console.log(`[verifyFirebaseToken] Syncing UserRole data for ${user.email}`);
                yield prisma.userRole.update({
                    where: { id: userRole.id },
                    data: {
                        userId: user.id,
                        fullName: user.fullName || userRole.fullName
                    }
                });
            }
        }
        console.log(`[verifyFirebaseToken] Final Check -> Email: ${userRole.email}, Plan Found: ${user === null || user === void 0 ? void 0 : user.plan}, Name Found: ${user === null || user === void 0 ? void 0 : user.fullName}`);
        // Return user data with plan
        res.json({
            user: {
                id: firebaseUid,
                uid: firebaseUid,
                email: userRole.email,
                fullName: (user === null || user === void 0 ? void 0 : user.fullName) || userRole.fullName,
                role: userRole.role,
                plan: (user === null || user === void 0 ? void 0 : user.plan) || 'free',
                _debug: { source: 'UserTable', sync: !!user } // Diagnostic field
            }
        });
    }
    catch (error) {
        console.error('Error verifying Firebase token:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' });
        }
        if (error.code === 'auth/argument-error') {
            return res.status(400).json({ error: 'Token inválido' });
        }
        res.status(500).json({ error: 'Error al verificar token' });
    }
});
exports.verifyFirebaseToken = verifyFirebaseToken;
// Keep old endpoints for backward compatibility (deprecated)
var authController_1 = require("./authController");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return authController_1.register; } });
Object.defineProperty(exports, "login", { enumerable: true, get: function () { return authController_1.login; } });
