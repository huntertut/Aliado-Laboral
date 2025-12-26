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
        console.log('🔥 Seeding UserRole mappings for Firebase users...');
        const userRoles = [
            {
                firebaseUid: 'Y4ySax5hWYd6dh1lXOkDskeQwNB2', // worker_std@test.com
                email: 'worker_std@test.com',
                role: 'worker',
                fullName: 'Trabajador Estándar'
            },
            {
                firebaseUid: 'PwugREpGo5cVDERLgk9D1dxu4f02', // worker_pro@test.com
                email: 'worker_pro@test.com',
                role: 'worker',
                fullName: 'Trabajador Pro'
            },
            {
                firebaseUid: 'oESboUThn8Zp7URzysPCG861Ajh1', // lawyer_pro1@test.com
                email: 'lawyer_pro1@test.com',
                role: 'lawyer',
                fullName: 'Abogado Pro 1'
            },
            {
                firebaseUid: 'vvEv7RzoXccusQTNndoAiiDYevJ2', // lawyer_pro2@test.com
                email: 'lawyer_pro2@test.com',
                role: 'lawyer',
                fullName: 'Abogado Pro 2'
            },
            {
                firebaseUid: 'TjPDy7Lyf9MVLIu7e30DOzMysSf1', // admin@test.com
                email: 'admin@test.com',
                role: 'admin',
                fullName: 'Administrador'
            }
        ];
        for (const roleData of userRoles) {
            const existing = yield prisma.userRole.findUnique({
                where: { firebaseUid: roleData.firebaseUid }
            });
            if (existing) {
                console.log(`✅ ${roleData.email} ya existe`);
            }
            else {
                yield prisma.userRole.create({ data: roleData });
                console.log(`✨ Creado: ${roleData.email} (${roleData.role})`);
            }
        }
        console.log('✅ Seeding completado');
    });
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
