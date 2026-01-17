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

        // Verify User is Pro/Premium (or allow basic for now with limits?)
        // For now, let's allow all authenticated users to ask to seed content
        const post = await prisma.forumPost.create({
            data: {
                userId,
                topic,
                title,
                content,
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

export const getPostDetails = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;

        const post = await prisma.forumPost.findUnique({
            where: { id: postId },
            include: {
                answers: {
                    include: {
                        lawyer: {
                            include: {
                                user: {
                                    select: { fullName: true }
                                }
                            }
                        }
                    },
                    orderBy: { upvotes: 'desc' }
                }
            }
        });

        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Increment views
        await prisma.forumPost.update({
            where: { id: postId },
            data: { views: { increment: 1 } }
        });

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch post details' });
    }
};

export const answerPost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const lawyerUserId = (req as any).user?.userId;

        // Verify Lawyer Role
        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: lawyerUserId }
        });

        if (!lawyer) {
            return res.status(403).json({ error: 'Only lawyers can answer' });
        }

        const answer = await prisma.forumAnswer.create({
            data: {
                postId,
                lawyerId: lawyer.id,
                content
            }
        });

        // Gamification: Add Reputation
        // TODO: Implement reputation update logic here

        res.status(201).json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit answer' });
    }
};

export const voteAnswer = async (req: Request, res: Response) => {
    try {
        const { answerId } = req.params;
        const { value } = req.body; // 1 or -1
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

        if (existingVote) {
            // Update vote or remove if same? Let's just update for now
            if (existingVote.value === value) {
                return res.json({ message: 'Already voted' });
            }
            // Update logic would be complex, simplistic approach:
            await prisma.forumVote.update({
                where: { id: existingVote.id },
                data: { value }
            });
            // Update counter
            await prisma.forumAnswer.update({
                where: { id: answerId },
                data: { upvotes: { increment: value * 2 } } // Swing of 2
            });
        } else {
            await prisma.forumVote.create({
                data: { userId, answerId, value }
            });
            await prisma.forumAnswer.update({
                where: { id: answerId },
                data: { upvotes: { increment: value } }
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to vote' });
    }
};
