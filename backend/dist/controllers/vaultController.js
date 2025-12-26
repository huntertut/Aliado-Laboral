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
exports.getDownloadUrl = exports.deleteVaultFile = exports.getVaultFiles = exports.saveFileMetadata = exports.getUploadUrl = void 0;
const firebase_1 = __importDefault(require("../config/firebase"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const db = firebase_1.default.firestore();
const bucket = firebase_1.default.storage().bucket();
/**
 * Generate a pre-signed URL for direct upload to Firebase Storage
 */
const getUploadUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileName, fileType } = req.body;
        const userId = req.user.id;
        if (!fileName || !fileType) {
            return res.status(400).json({ error: 'Nombre de archivo y tipo son requeridos' });
        }
        // Generate unique path: users/{userId}/vault/{timestamp}_{fileName}
        const filePath = `users/${userId}/vault/${Date.now()}_${fileName}`;
        const file = bucket.file(filePath);
        // Pre-signed URL for PUT request
        const [url] = yield file.getSignedUrl({
            action: 'write',
            version: 'v4',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: fileType,
        });
        res.json({ uploadUrl: url, filePath });
    }
    catch (error) {
        console.error('Error generating vault upload URL:', error);
        res.status(500).json({ error: 'Error al preparar la subida al baúl' });
    }
});
exports.getUploadUrl = getUploadUrl;
/**
 * Save file metadata to Firestore after successful upload
 */
const saveFileMetadata = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileName, filePath, fileType, size, tags } = req.body;
        const userId = req.user.id;
        if (!fileName || !filePath) {
            return res.status(400).json({ error: 'Metadata de archivo incompleta' });
        }
        // Store in Firestore specifically for unstructured/metadata-heavy vault files
        const docRef = yield db.collection('vaultFiles').add({
            userId,
            fileName,
            filePath,
            fileType,
            size: size || 0,
            tags: tags || [],
            uploadedAt: firebase_1.default.firestore.FieldValue.serverTimestamp(),
        });
        res.json({
            id: docRef.id,
            message: 'Archivo guardado exitosamente en tu baúl personal'
        });
    }
    catch (error) {
        console.error('Error saving vault metadata:', error);
        res.status(500).json({ error: 'Error al registrar el archivo en el sistema' });
    }
});
exports.saveFileMetadata = saveFileMetadata;
/**
 * Get all files in the user's vault
 */
const getVaultFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const snapshot = yield db.collection('vaultFiles')
            .where('userId', '==', userId)
            .orderBy('uploadedAt', 'desc')
            .get();
        const files = snapshot.docs.map(doc => {
            var _a;
            return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { 
                // Firestore timestamps need to be converted for JSON
                uploadedAt: ((_a = doc.data().uploadedAt) === null || _a === void 0 ? void 0 : _a.toDate()) || null }));
        });
        res.json(files);
    }
    catch (error) {
        console.error('Error fetching vault files:', error);
        res.status(500).json({ error: 'Error al obtener tus archivos' });
    }
});
exports.getVaultFiles = getVaultFiles;
/**
 * Delete a file from vault (Storage + Firestore)
 */
const deleteVaultFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;
        const docRef = db.collection('vaultFiles').doc(fileId);
        const doc = yield docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este archivo' });
        }
        // 1. Delete from Storage
        try {
            yield bucket.file(data.filePath).delete();
        }
        catch (storageErr) {
            console.warn('File not found in storage during deletion:', data.filePath);
        }
        // 2. Delete from Firestore
        yield docRef.delete();
        res.json({ success: true, message: 'Archivo eliminado' });
    }
    catch (error) {
        console.error('Error deleting vault file:', error);
        res.status(500).json({ error: 'Error al eliminar el archivo' });
    }
});
exports.deleteVaultFile = deleteVaultFile;
/**
 * Generate a temporary download URL for a vault file
 */
const getDownloadUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;
        const { requestId } = req.query; // If provided, check if user is the lawyer for this request
        const doc = yield db.collection('vaultFiles').doc(fileId).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        const fileData = doc.data();
        let hasAccess = fileData.userId === userId;
        if (!hasAccess && requestId) {
            // Check if requester is a lawyer linked to the OWNER of this file in THIS request
            const request = yield prisma.contactRequest.findFirst({
                where: {
                    id: requestId,
                    workerId: fileData.userId,
                    // The requester must be the lawyer in this request
                    lawyerProfile: {
                        lawyer: {
                            userId: userId
                        }
                    },
                    status: 'accepted' // Only shared if accepted
                }
            });
            if (request)
                hasAccess = true;
        }
        if (!hasAccess) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a este archivo' });
        }
        const { filePath } = fileData;
        const file = bucket.file(filePath);
        const [url] = yield file.getSignedUrl({
            action: 'read',
            version: 'v4',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });
        res.json({
            downloadUrl: url,
            fileName: fileData.fileName,
            fileType: fileData.fileType
        });
    }
    catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({ error: 'Error al generar enlace de descarga' });
    }
});
exports.getDownloadUrl = getDownloadUrl;
