import { Request, Response } from 'express';
import admin from '../config/firebase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = admin.firestore();
const bucket = admin.storage().bucket();

/**
 * Generate a pre-signed URL for direct upload to Firebase Storage
 */
export const getUploadUrl = async (req: any, res: Response) => {
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
        const [url] = await file.getSignedUrl({
            action: 'write',
            version: 'v4',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: fileType,
        });

        res.json({ uploadUrl: url, filePath });
    } catch (error) {
        console.error('Error generating vault upload URL:', error);
        res.status(500).json({ error: 'Error al preparar la subida al baúl' });
    }
};

/**
 * Save file metadata to Firestore after successful upload
 */
export const saveFileMetadata = async (req: any, res: Response) => {
    try {
        const { fileName, filePath, fileType, size, tags } = req.body;
        const userId = req.user.id;

        if (!fileName || !filePath) {
            return res.status(400).json({ error: 'Metadata de archivo incompleta' });
        }

        // Store in Firestore specifically for unstructured/metadata-heavy vault files
        const docRef = await db.collection('vaultFiles').add({
            userId,
            fileName,
            filePath,
            fileType,
            size: size || 0,
            tags: tags || [],
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            id: docRef.id,
            message: 'Archivo guardado exitosamente en tu baúl personal'
        });
    } catch (error) {
        console.error('Error saving vault metadata:', error);
        res.status(500).json({ error: 'Error al registrar el archivo en el sistema' });
    }
};

/**
 * Get all files in the user's vault
 */
export const getVaultFiles = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const snapshot = await db.collection('vaultFiles')
            .where('userId', '==', userId)
            .orderBy('uploadedAt', 'desc')
            .get();

        const files = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Firestore timestamps need to be converted for JSON
            uploadedAt: (doc.data() as any).uploadedAt?.toDate() || null
        }));

        res.json(files);
    } catch (error) {
        console.error('Error fetching vault files:', error);
        res.status(500).json({ error: 'Error al obtener tus archivos' });
    }
};

/**
 * Delete a file from vault (Storage + Firestore)
 */
export const deleteVaultFile = async (req: any, res: Response) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        const docRef = db.collection('vaultFiles').doc(fileId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        const data = doc.data()!;
        if (data.userId !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este archivo' });
        }

        // 1. Delete from Storage
        try {
            await bucket.file(data.filePath).delete();
        } catch (storageErr) {
            console.warn('File not found in storage during deletion:', data.filePath);
        }

        // 2. Delete from Firestore
        await docRef.delete();

        res.json({ success: true, message: 'Archivo eliminado' });
    } catch (error) {
        console.error('Error deleting vault file:', error);
        res.status(500).json({ error: 'Error al eliminar el archivo' });
    }
};

/**
 * Generate a temporary download URL for a vault file
 */
export const getDownloadUrl = async (req: any, res: Response) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;
        const { requestId } = req.query; // If provided, check if user is the lawyer for this request

        const doc = await db.collection('vaultFiles').doc(fileId).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        const fileData = doc.data() as any;
        let hasAccess = fileData.userId === userId;

        if (!hasAccess && requestId) {
            // Check if requester is a lawyer linked to the OWNER of this file in THIS request
            const request = await prisma.contactRequest.findFirst({
                where: {
                    id: requestId as string,
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
            if (request) hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a este archivo' });
        }

        const { filePath } = fileData;
        const file = bucket.file(filePath);

        const [url] = await file.getSignedUrl({
            action: 'read',
            version: 'v4',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        res.json({
            downloadUrl: url,
            fileName: fileData.fileName,
            fileType: fileData.fileType
        });
    } catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({ error: 'Error al generar enlace de descarga' });
    }
};
