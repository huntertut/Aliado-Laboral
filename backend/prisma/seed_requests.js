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
        var _a, _b;
        console.log('Seeding Contact Requests...');
        // 1. Fetch Users
        const workerStd = yield prisma.user.findUnique({ where: { email: 'worker_std@test.com' } });
        const workerPro = yield prisma.user.findUnique({ where: { email: 'worker_pro@test.com' } });
        // Note: schema User.lawyerProfile is type Lawyer. Lawyer.profile is type LawyerProfile.
        const lawyerPro1 = yield prisma.user.findUnique({
            where: { email: 'lawyer_pro1@test.com' },
            include: { lawyerProfile: { include: { profile: true } } }
        });
        const lawyerPro2 = yield prisma.user.findUnique({
            where: { email: 'lawyer_pro2@test.com' },
            include: { lawyerProfile: { include: { profile: true } } }
        });
        if (!workerStd || !workerPro || !((_a = lawyerPro1 === null || lawyerPro1 === void 0 ? void 0 : lawyerPro1.lawyerProfile) === null || _a === void 0 ? void 0 : _a.profile) || !((_b = lawyerPro2 === null || lawyerPro2 === void 0 ? void 0 : lawyerPro2.lawyerProfile) === null || _b === void 0 ? void 0 : _b.profile)) {
            console.error('Missing seed users or profiles. Run seed_users.ts first.');
            return;
        }
        // 2. Create Request: Worker Std -> Lawyer 1 (Pending)
        yield prisma.contactRequest.create({
            data: {
                workerId: workerStd.id,
                lawyerProfileId: lawyerPro1.lawyerProfile.profile.id,
                caseSummary: 'Tengo dudas sobre mi liquidación, me despidieron ayer injustificadamente.',
                caseType: 'despido',
                urgency: 'high',
                status: 'pending'
            }
        });
        console.log('Created Request: Worker Std -> Lawyer 1 (Pending)');
        // 3. Create Request: Worker Pro -> Lawyer 2 (Accepted)
        yield prisma.contactRequest.create({
            data: {
                workerId: workerPro.id,
                lawyerProfileId: lawyerPro2.lawyerProfile.profile.id,
                caseSummary: 'Necesito revisión de contrato de confidencialidad.',
                caseType: 'otro',
                urgency: 'normal',
                status: 'accepted',
                acceptedAt: new Date()
            }
        });
        console.log('Created Request: Worker Pro -> Lawyer 2 (Accepted)');
        console.log('Seeding Requests Complete.');
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
