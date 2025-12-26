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
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding special users...');
        // Supervisor Data
        const supervisor = {
            email: 'supervisor@test.com',
            uid: 'owa4rNOIESdMmJIucA06OSXKbh72',
            role: 'supervisor',
            fullName: 'Supervisor General'
        };
        // Accountant Data
        const accountant = {
            email: 'contador@test.com',
            uid: 'pubVX53drUgWZD6WUfB6TQ0el1y2',
            role: 'accountant',
            fullName: 'Contador Principal'
        };
        const users = [supervisor, accountant];
        for (const userData of users) {
            try {
                // 1. Create or Update in User table
                const user = yield prisma.user.upsert({
                    where: { email: userData.email },
                    update: {
                        role: userData.role,
                        fullName: userData.fullName
                    },
                    create: {
                        email: userData.email,
                        role: userData.role,
                        fullName: userData.fullName,
                        passwordHash: 'firebase_managed', // Placeholder
                    },
                });
                console.log(`User seeded: ${user.email} (${user.id})`);
                // 2. Create or Update in UserRole table (Firebase mapping)
                yield prisma.userRole.upsert({
                    where: { firebaseUid: userData.uid },
                    update: {
                        role: userData.role,
                        userId: user.id
                    },
                    create: {
                        firebaseUid: userData.uid,
                        role: userData.role,
                        email: userData.email,
                        fullName: userData.fullName,
                        userId: user.id
                    },
                });
                console.log(`UserRole mapping seeded for: ${userData.email}`);
            }
            catch (error) {
                console.error(`Error seeding ${userData.email}:`, error);
            }
        }
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
