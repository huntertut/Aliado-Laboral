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
exports.updateUserPlan = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// TEMPORARY ENDPOINT - FOR DEVELOPMENT ONLY
const updateUserPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, plan } = req.body;
        const user = yield prisma.user.update({
            where: { email },
            data: { plan }
        });
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Error updating user plan:', error);
        res.status(500).json({ error: 'Failed to update user plan' });
    }
});
exports.updateUserPlan = updateUserPlan;
