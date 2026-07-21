import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
});

// ─────────────────────────────────────────────────────────────────
// WORKER ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/**
 * List all available courses with completion progress and enrollment status
 */
export const getCourses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        const courses = await prisma.course.findMany({
            where: { isActive: true },
            include: {
                modules: {
                    include: {
                        _count: { select: { lessons: true } }
                    }
                }
            }
        });

        // If no user token, return basic list
        if (!userId) {
            return res.json({
                courses: courses.map(c => ({
                    ...c,
                    totalLessons: c.modules.reduce((acc, m) => acc + m._count.lessons, 0),
                    isPurchased: false,
                    progressPercent: 0
                }))
            });
        }

        // Get purchases
        const purchases = await prisma.coursePurchase.findMany({
            where: { userId, status: 'completed' },
            select: { courseId: true }
        });
        const purchasedIds = new Set(purchases.map(p => p.courseId));

        // Get completed lessons progress
        const completedProgress = await prisma.userLessonProgress.findMany({
            where: { userId, isCompleted: true },
            select: { lessonId: true }
        });
        const completedLessonIds = new Set(completedProgress.map(p => p.lessonId));

        const coursesWithProgress = await Promise.all(courses.map(async (course) => {
            const isPurchased = purchasedIds.has(course.id);
            
            // Gather all lesson ids in this course
            const courseLessons = await prisma.courseLesson.findMany({
                where: { module: { courseId: course.id } },
                select: { id: true }
            });
            const totalLessons = courseLessons.length;
            const completedInCourse = courseLessons.filter(l => completedLessonIds.has(l.id)).length;
            const progressPercent = totalLessons > 0 ? Math.round((completedInCourse / totalLessons) * 100) : 0;

            return {
                id: course.id,
                title: course.title,
                description: course.description,
                coverImage: course.coverImage,
                price: course.price,
                category: course.category,
                totalLessons,
                isPurchased,
                progressPercent,
                completedLessonsCount: completedInCourse
            };
        }));

        res.json({ courses: coursesWithProgress });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Error al obtener los cursos' });
    }
};

/**
 * Get detailed course syllabus. Lock premium lessons content if not purchased.
 */
export const getCourseDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                modules: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { sortOrder: 'asc' }
                        }
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }

        // Check purchase status
        let isPurchased = false;
        if (userId) {
            const purchase = await prisma.coursePurchase.findFirst({
                where: { userId, courseId: id, status: 'completed' }
            });
            isPurchased = !!purchase;
        }

        // Get completed lessons list for UI checkmarks
        const completedLessonIds = new Set<string>();
        if (userId) {
            const completed = await prisma.userLessonProgress.findMany({
                where: { userId, isCompleted: true },
                select: { lessonId: true }
            });
            completed.forEach(c => completedLessonIds.add(c.lessonId));
        }

        // Build locked/unlocked lesson details
        const structuredModules = course.modules.map(module => ({
            id: module.id,
            title: module.title,
            sortOrder: module.sortOrder,
            lessons: module.lessons.map((lesson, idx) => {
                const isCompleted = completedLessonIds.has(lesson.id);
                // First lesson of the first module is FREE to preview
                const isFreePreview = module.sortOrder === 1 && idx === 0;
                const isUnlocked = isPurchased || isFreePreview;

                return {
                    id: lesson.id,
                    title: lesson.title,
                    durationMin: lesson.durationMin,
                    sortOrder: lesson.sortOrder,
                    isCompleted,
                    isUnlocked,
                    // If locked, hide content and attachments
                    content: isUnlocked ? lesson.content : null,
                    videoUrl: isUnlocked ? lesson.videoUrl : null,
                    attachmentUrl: isUnlocked ? lesson.attachmentUrl : null,
                    attachmentName: isUnlocked ? lesson.attachmentName : null,
                    isFreePreview
                };
            })
        }));

        res.json({
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                coverImage: course.coverImage,
                price: course.price,
                category: course.category,
                isPurchased,
                modules: structuredModules
            }
        });

    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ error: 'Error al obtener detalles del curso' });
    }
};

/**
 * Buy course via Stripe Payment Sheets
 */
export const createCoursePaymentIntent = async (req: Request, res: Response) => {
    try {
        // requireRole middleware overwrites req.user with the Prisma User object (.id, not .userId)
        const userId = (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });
        const { courseId } = req.body;

        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

        const priceInCents = Math.round(Number(course.price) * 100);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId, role: 'worker' }
            });
            customerId = customer.id;
            await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
        }

        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: '2022-11-15' }
        );

        // Register pending purchase record
        const purchase = await prisma.coursePurchase.create({
            data: {
                userId,
                courseId,
                status: 'pending',
                amount: course.price
            }
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: priceInCents,
            currency: 'mxn',
            customer: customerId,
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId,
                type: 'course_purchase',
                courseId,
                purchaseId: purchase.id
            }
        }, {
            idempotencyKey: `course_pi_${userId}_${purchase.id}`
        });

        await prisma.coursePurchase.update({
            where: { id: purchase.id },
            data: { stripePaymentIntentId: paymentIntent.id }
        });

        res.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerId,
            paymentIntentId: paymentIntent.id,
            purchaseId: purchase.id,
            courseTitle: course.title,
            price: course.price
        });

    } catch (error: any) {
        console.error('Error creating course payment intent:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Mark a lesson completed/uncompleted
 */
export const toggleLessonCompletion = async (req: Request, res: Response) => {
    try {
        // requireRole middleware overwrites req.user with the Prisma User object (.id, not .userId)
        const userId = (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });
        const { lessonId } = req.params;
        const { isCompleted } = req.body; // boolean

        // Verify lesson exists
        const lesson = await prisma.courseLesson.findUnique({
            where: { id: lessonId },
            include: { module: true }
        });
        if (!lesson) return res.status(404).json({ error: 'Lección no encontrada' });

        // Update progress
        const progress = await prisma.userLessonProgress.upsert({
            where: { id: `prog_${userId}_${lessonId}` }, // Arbitrary unique string since @@id isn't defined
            update: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
                lastAccessedAt: new Date()
            },
            create: {
                id: `prog_${userId}_${lessonId}`,
                userId,
                lessonId,
                isCompleted,
                completedAt: isCompleted ? new Date() : null
            }
        });

        // Recalculate whole course progress
        const courseId = lesson.module.courseId;
        const totalLessons = await prisma.courseLesson.count({
            where: { module: { courseId } }
        });

        const courseLessons = await prisma.courseLesson.findMany({
            where: { module: { courseId } },
            select: { id: true }
        });
        const lessonIds = courseLessons.map(l => l.id);

        const completedCount = await prisma.userLessonProgress.count({
            where: {
                userId,
                lessonId: { in: lessonIds },
                isCompleted: true
            }
        });

        const isCourseCompleted = totalLessons > 0 && completedCount === totalLessons;

        await prisma.userCourseProgress.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: {
                isCompleted: isCourseCompleted,
                completedAt: isCourseCompleted ? new Date() : null
            },
            create: {
                userId,
                courseId,
                isCompleted: isCourseCompleted,
                completedAt: isCourseCompleted ? new Date() : null
            }
        });

        res.json({
            isCompleted: progress.isCompleted,
            courseCompleted: isCourseCompleted,
            completedLessonsCount: completedCount,
            totalLessonsCount: totalLessons
        });

    } catch (error) {
        console.error('Error updating lesson progress:', error);
        res.status(500).json({ error: 'Error al registrar progreso de lección' });
    }
};

// ─────────────────────────────────────────────────────────────────
// ADMIN CRUD ENDPOINTS
// ─────────────────────────────────────────────────────────────────

export const adminCreateCourse = async (req: Request, res: Response) => {
    try {
        const { title, description, coverImage, price, category } = req.body;
        const course = await prisma.course.create({
            data: {
                title,
                description,
                coverImage: coverImage || null,
                price: parseFloat(price),
                category
            }
        });
        res.json({ course });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el curso' });
    }
};

export const adminUpdateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, coverImage, price, category, isActive } = req.body;
        const course = await prisma.course.update({
            where: { id },
            data: {
                title,
                description,
                coverImage,
                price: price ? parseFloat(price) : undefined,
                category,
                isActive
            }
        });
        res.json({ course });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
};

export const adminDeleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.course.delete({ where: { id } });
        res.json({ success: true, message: 'Curso eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el curso' });
    }
};

export const adminAddModule = async (req: Request, res: Response) => {
    try {
        const { courseId, title, sortOrder } = req.body;
        const module = await prisma.courseModule.create({
            data: { courseId, title, sortOrder: parseInt(sortOrder) }
        });
        res.json({ module });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar el módulo' });
    }
};

export const adminAddLesson = async (req: Request, res: Response) => {
    try {
        const { moduleId, title, content, videoUrl, durationMin, sortOrder, attachmentUrl, attachmentName } = req.body;
        const lesson = await prisma.courseLesson.create({
            data: {
                moduleId,
                title,
                content: content || null,
                videoUrl: videoUrl || null,
                durationMin: durationMin ? parseInt(durationMin) : 5,
                sortOrder: parseInt(sortOrder),
                attachmentUrl: attachmentUrl || null,
                attachmentName: attachmentName || null
            }
        });
        res.json({ lesson });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar la lección' });
    }
};
