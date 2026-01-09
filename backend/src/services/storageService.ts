import admin from '../config/firebase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const bucket = admin.storage().bucket();

/**
 * Upload a file buffer to Firebase Storage
 * @param buffer - File content
 * @param destination - Path in bucket (e.g., 'profiles/lawyer123/avatar.jpg')
 * @param contentType - MIME type
 */
export const uploadBuffer = async (buffer: Buffer, destination: string, contentType: string): Promise<string> => {
    const file = bucket.file(destination);

    await file.save(buffer, {
        metadata: { contentType },
        public: true, // Making public for easy access, but can use signed URLs if preferred
    });

    // Return public URL (Firebase format)
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (destination: string) => {
    try {
        const file = bucket.file(destination);
        await file.delete();
        console.log(`🗑️ Deleted file from storage: ${destination}`);
    } catch (error) {
        console.warn(`⚠️ Could not delete file: ${destination}. It might not exist.`);
    }
};

/**
 * Purge all sensitive data related to a ContactRequest
 */
export const purgeContactRequestData = async (requestId: string) => {
    console.log(`🛡️ Starting privacy purge for Request: ${requestId}`);

    // 1. Find all documents
    const documents = await prisma.requestDocument.findMany({
        where: { requestId }
    });

    // 2. Delete files from Storage
    for (const doc of documents) {
        // Extract destination from URL or store it in DB (schema has fileUrl)
        // If fileUrl is a GS URL, we need to parse it. 
        // For now, assuming fileUrl contains the path or we deduce it.
        // Best practice is to store the path.
        const path = doc.fileUrl.split(`${bucket.name}/`)[1];
        if (path) await deleteFile(path);
    }

    // 3. Clear sensitive fields in Request, delete Documents and Chat
    await prisma.$transaction([
        prisma.requestDocument.deleteMany({ where: { requestId } }),
        prisma.chatMessage.deleteMany({ where: { requestId } }),
        prisma.contactRequest.update({
            where: { id: requestId },
            data: {
                caseSummary: "[DATOS ELIMINADOS POR PRIVACIDAD]",
                rejectionReason: null,
                // keep status and financial info for accounting
            }
        })
    ]);

    console.log(`✅ Privacy purge completed for Request: ${requestId}`);
};
