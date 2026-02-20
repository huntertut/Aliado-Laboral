import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPost = async (req: Request, res: Response) => {
    try {
        const { topic, title, content } = req.body;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Security Check: Phone Numbers
        if (containsPhoneNumber(title) || containsPhoneNumber(content)) {
            return res.status(400).json({
                error: 'Por seguridad y privacidad, no está permitido publicar números de teléfono en el foro.'
            });
        }

        // 2. Content Moderation: Profanity Masking
        const cleanTitle = maskProfanity(title);
        const cleanContent = maskProfanity(content);

        const post = await prisma.forumPost.create({
            data: {
                userId,
                topic,
                title: cleanTitle,
                content: cleanContent,
                status: 'open'
            }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

export const getPosts = async (req: Request, res: Response) => {
    try {
        const { topic, filter } = req.query;

        const where: any = {};
        if (topic) where.topic = String(topic);
        if (filter === 'unanswered') where.answers = { none: {} };

        // 7-Day Visibility Rule (Except for Admin)
        const userRole = (req as any).user?.role;
        if (userRole !== 'admin') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            where.createdAt = {
                gte: sevenDaysAgo
            };
        }

        const posts = await prisma.forumPost.findMany({
            where,
            include: {
                _count: {
                    select: { answers: true }
                },
                answers: {
                    take: 1,
                    orderBy: { upvotes: 'desc' },
                    include: {
                        lawyer: {
                            select: {
                                professionalName: true,
                                specialty: true, // Fixed property name
                                licenseNumber: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};

// Basic Profanity List (Generic for Mexico context)
const BAD_WORDS = ['puto', 'puta', 'pendejo', 'pendeja', 'verga', 'mierda', 'imbecil', 'estupido', 'idiota', 'chinga', 'chingar', 'pinche', 'cabron', 'mamada', 'zorra'];

const containsPhoneNumber = (text: string): boolean => {
    // Detects sequences of 10 digits, allowing for common separators like space, dot, dash
    const phoneRegex = /(\d[\s.-]?){10,}/;
    return phoneRegex.test(text);
};

const maskProfanity = (text: string): string => {
    let cleanText = text;
    BAD_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleanText = cleanText.replace(regex, '*'.repeat(word.length));
    });
    return cleanText;
};

// ... existing createPost was modified in previous step, now updating answerPost ...

export const getPostDetails = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;

        const post = await prisma.forumPost.findUnique({
            where: { id: postId },
            include: {
                answers: {
                    include: {
                        lawyer: {
                            include: { user: { select: { fullName: true } } }
                        },
                        user: {
                            select: { fullName: true, role: true } // Include user details for non-active lawyers
                        }
                    },
                    // Sort order: Accepted first, then by date (oldest first usually makes sense for reading flow, or newest?)
                    // Usually oldest first for threads.
                    orderBy: [
                        { isAccepted: 'desc' },
                        { createdAt: 'asc' }
                    ]
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Increment views
        await prisma.forumPost.update({
            where: { id: postId },
            data: { views: { increment: 1 } }
        });

        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch post details' });
    }
};

export const answerPost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const { content, parentId } = req.body;
        const userId = (req as any).user?.userId;
        const userRole = (req as any).user?.role;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Security Check: Phone Numbers
        if (containsPhoneNumber(content)) {
            return res.status(400).json({
                error: 'Por seguridad y privacidad, no está permitido publicar números de teléfono.'
            });
        }

        // 2. Content Moderation
        const cleanContent = maskProfanity(content);

        // 3. Determine Author Type (Lawyer vs User)
        let lawyerId = null;
        let finalUserId = null;

        // Try to find if user is acting as a lawyer
        const lawyer = await prisma.lawyer.findUnique({ where: { userId } });

        if (lawyer) {
            lawyerId = lawyer.id;
        } else {
            // Regular user (Worker/Pyme)
            finalUserId = userId;
        }

        const answer = await prisma.forumAnswer.create({
            data: {
                postId,
                parentId: parentId || null, // Threading
                lawyerId: lawyerId,
                userId: finalUserId,
                content: cleanContent
            }
        });

        res.status(201).json(answer);
    } catch (error) {
        console.error('Error answering post:', error);
        res.status(500).json({ error: 'Failed to post answer' });
    }
};

export const voteAnswer = async (req: Request, res: Response) => {
    try {
        const { answerId } = req.params;
        const { value } = req.body; // 1 (Like) or -1 (Dislike)
        const userId = (req as any).user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Check if already voted
        const existingVote = await prisma.forumVote.findUnique({
            where: {
                userId_answerId: {
                    userId,
                    answerId
                }
            }
        });

        // Get answer to find author
        const answer = await prisma.forumAnswer.findUnique({
            where: { id: answerId },
            include: { lawyer: true }
        });

        if (!answer) return res.status(404).json({ error: 'Answer not found' });

        let scoreDelta = 0;

        if (existingVote) {
            if (existingVote.value === value) {
                return res.json({ message: 'Already voted' });
            }
            // Changing vote (e.g., -1 to 1 => +2 delta)
            scoreDelta = value * 2; // Not strictly accurate for reputation but simpler for now

            await prisma.forumVote.update({
                where: { id: existingVote.id },
                data: { value }
            });
            await prisma.forumAnswer.update({
                where: { id: answerId },
                data: { upvotes: { increment: scoreDelta } }
            });

        } else {
            // New Vote
            scoreDelta = value;

            await prisma.forumVote.create({
                data: { userId, answerId, value }
            });
            await prisma.forumAnswer.update({
                where: { id: answerId },
                data: { upvotes: { increment: value } }
            });
        }

        // --- REPUTATION SYSTEM ---
        // Only affect reputation if the author is a Lawyer and it's a positive interactions
        if (answer.lawyerId) {
            // Define points: Like = +0.5, Dislike = -0.1 (Punish less than Reward)
            // Simpler: Just map the scoreDelta (1 vote = 0.5 points)
            const points = scoreDelta * 0.5;

            // Update Lawyer Profile
            // We need to find the profile first potentially or just update
            try {
                await prisma.lawyerProfile.update({
                    where: { lawyerId: answer.lawyerId },
                    data: {
                        reputationScore: { increment: points }
                    }
                });
            } catch (err) {
                // Ignore if profile doesn't exist yet or other minor issue, don't fail the vote
                console.log('Skipped reputation update (Profile might not exist)');
            }
        }

        res.json({ success: true, newScore: (answer.upvotes + scoreDelta) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to vote' });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = (req as any).user?.userId;
        const userRole = (req as any).user?.role;

        const post = await prisma.forumPost.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (userRole !== 'admin' && post.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Delete associated answers and votes manually if cascade not set
        // Or simply delete post
        await prisma.forumAnswer.deleteMany({ where: { postId: postId } }); // Pragma cascade might handle this but safer
        await prisma.forumPost.delete({ where: { id: postId } });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};

export const hidePost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const userRole = (req as any).user?.role;

        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin only' });
        }

        await prisma.forumPost.update({
            where: { id: postId },
            data: { status: 'hidden' }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to hide post' });
    }
};

export const deleteAnswer = async (req: Request, res: Response) => {
    try {
        const { answerId } = req.params;
        const userId = (req as any).user?.userId;
        const userRole = (req as any).user?.role;

        const answer = await prisma.forumAnswer.findUnique({
            where: { id: answerId },
            include: { lawyer: true }
        });

        if (!answer) return res.status(404).json({ error: 'Answer not found' });

        // Admin or Owner (Lawyer User or Regular User)
        if (userRole !== 'admin') {
            let isOwner = false;

            if (answer.lawyer && answer.lawyer.userId === userId) {
                isOwner = true;
            } else if (answer.userId === userId) {
                isOwner = true;
            }

            if (!isOwner) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        await prisma.forumAnswer.delete({ where: { id: answerId } });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete answer' });
    }
};
