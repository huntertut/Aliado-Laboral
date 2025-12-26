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
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_1 = __importDefault(require("../config/firebase"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(' ')[1];
    try {
        // 1. Try Legacy JWT Verification
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;
            return next();
        }
        catch (jwtError) {
            // JWT verification failed, proceed to try Firebase
        }
        // 2. Try Firebase ID Token Verification
        const decodedToken = yield firebase_1.default.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        // 3. Resolve Database User ID from Firebase UID
        const userRole = yield prisma.userRole.findUnique({
            where: { firebaseUid }
        });
        if (userRole) {
            // CRITICAL FIX: Ensure User record exists
            // WorkerProfile and LawyerProfile rely on User.id foreign key
            let userId = userRole.userId;
            if (!userId) {
                console.warn(`UserRole linked to Firebase UID ${firebaseUid} has no associated User record. Fixing...`);
                // First, try to find existing User by email
                let existingUser = yield prisma.user.findFirst({
                    where: { email: userRole.email }
                });
                if (!existingUser) {
                    // User doesn't exist, create it
                    console.log(`Creating new User record for ${userRole.email}...`);
                    existingUser = yield prisma.user.create({
                        data: {
                            email: userRole.email,
                            fullName: userRole.fullName || userRole.email.split('@')[0],
                            role: userRole.role,
                            passwordHash: 'firebase_managed' // Placeholder since Firebase handles auth
                        }
                    });
                    console.log(`✅ User record created with ID ${existingUser.id}`);
                }
                else {
                    console.log(`✅ Found existing User record with ID ${existingUser.id} for ${userRole.email}`);
                }
                // Link UserRole to the User (whether found or created)
                yield prisma.userRole.update({
                    where: { firebaseUid },
                    data: { userId: existingUser.id }
                });
                userId = existingUser.id;
                console.log(`✅ UserRole linked to User ID ${userId} for Firebase UID ${firebaseUid}`);
            }
            req.user = {
                id: userId, // Now guaranteed to be a valid User.id
                email: userRole.email,
                role: userRole.role,
                firebaseUid: firebaseUid
            };
            return next();
        }
        else {
            // User exists in Firebase but not in our SQL DB? 
            // This shouldn't happen if flow is correct, but returning 403 is safe.
            console.warn(`User with valid Firebase Token (${firebaseUid}) not found in DB.`);
            return res.sendStatus(403);
        }
    }
    catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.sendStatus(403);
    }
});
exports.authMiddleware = authMiddleware;
