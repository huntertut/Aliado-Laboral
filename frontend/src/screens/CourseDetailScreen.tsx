import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface Lesson {
    id: string;
    title: string;
    durationMin: number;
    sortOrder: number;
    isCompleted: boolean;
    isUnlocked: boolean;
    isFreePreview: boolean;
}

interface Module {
    id: string;
    title: string;
    sortOrder: number;
    lessons: Lesson[];
}

interface CourseDetail {
    id: string;
    title: string;
    description: string;
    coverImage: string | null;
    price: string;
    category: string;
    isPurchased: boolean;
    modules: Module[];
}

// ─────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────

const CourseDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { getAccessToken } = useAuth();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const { courseId } = route.params;

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    const fetchCourseDetails = useCallback(async () => {
        try {
            const token = await getAccessToken();
            const res = await fetch(endpoints.courses.detail(courseId), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCourse(data.course || null);
            }
        } catch (err) {
            console.error('Error fetching course detail:', err);
        } finally {
            setLoading(false);
        }
    }, [courseId, getAccessToken]);

    useEffect(() => {
        fetchCourseDetails();
    }, [fetchCourseDetails]);

    const handleLessonClick = (lesson: Lesson) => {
        if (!lesson.isUnlocked) {
            Alert.alert(
                '🔒 Contenido Exclusivo',
                'Adquiere este curso para tener acceso a todos los videos de capacitación, explicaciones detalladas y herramientas descargables.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Comprar Curso', onPress: () => startPurchase() }
                ]
            );
            return;
        }

        // Navigate to Lesson Viewer Screen
        navigation.navigate('LessonViewer', {
            lessonId: lesson.id,
            courseId: course?.id,
            title: lesson.title
        });
    };

    // ── STRIPE PURCHASE FLOW ────────────────────────

    const startPurchase = async () => {
        if (!course) return;
        try {
            setPurchasing(true);
            const token = await getAccessToken();

            const res = await fetch(endpoints.courses.purchase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ courseId: course.id })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al iniciar la orden');
            }

            const { paymentIntent, ephemeralKey, customer } = await res.json();

            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Aliado Laboral',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                allowsDelayedPaymentMethods: false,
            });

            if (initError) throw new Error(initError.message);

            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code !== 'Canceled') {
                    Alert.alert('Error', presentError.message);
                }
                return;
            }

            Alert.alert(
                '🎉 ¡Felicidades!',
                'Has desbloqueado el curso con éxito. Disfruta tus lecciones.',
                [{ text: 'Comenzar', onPress: () => fetchCourseDetails() }]
            );

        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo procesar la compra');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading || !course) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>Cargando temario...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#1a237e', '#283593']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Detalle del Curso</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Course Intro Image */}
                <Image
                    source={{ uri: course.coverImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400' }}
                    style={styles.courseImage}
                />

                {/* Course Info */}
                <View style={styles.infoBlock}>
                    <Text style={styles.title}>{course.title}</Text>
                    <Text style={styles.description}>{course.description}</Text>
                </View>

                {/* Buy Banner (if not purchased) */}
                {!course.isPurchased && (
                    <View style={styles.buyCard}>
                        <View style={styles.buyTextCol}>
                            <Text style={styles.buyPriceLabel}>Precio del Curso</Text>
                            <Text style={styles.buyPrice}>${parseFloat(course.price).toFixed(0)} MXN</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.buyButton, purchasing && styles.buyButtonDisabled]}
                            onPress={startPurchase}
                            disabled={purchasing}
                        >
                            {purchasing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="cart-outline" size={18} color="#fff" />
                                    <Text style={styles.buyButtonText}>Comprar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Syllabus / Modules */}
                <Text style={styles.syllabusTitle}>Plan de Estudios</Text>
                {course.modules.map((module) => (
                    <View key={module.id} style={styles.moduleBlock}>
                        <Text style={styles.moduleTitle}>{module.title}</Text>
                        <View style={styles.lessonsList}>
                            {module.lessons.map((lesson) => (
                                <TouchableOpacity
                                    key={lesson.id}
                                    style={styles.lessonItem}
                                    onPress={() => handleDownloadCheck(lesson)}
                                >
                                    <View style={styles.lessonLeft}>
                                        <Ionicons
                                            name={
                                                lesson.isCompleted
                                                    ? 'checkmark-circle'
                                                    : !lesson.isUnlocked
                                                    ? 'lock-closed'
                                                    : 'play-circle-outline'
                                            }
                                            size={20}
                                            color={lesson.isCompleted ? '#2e7d32' : !lesson.isUnlocked ? '#888' : '#1a237e'}
                                        />
                                        <View style={styles.lessonMeta}>
                                            <Text style={[styles.lessonName, !lesson.isUnlocked && styles.lessonNameLocked]}>
                                                {lesson.title}
                                            </Text>
                                            <View style={styles.lessonFooterRow}>
                                                <Text style={styles.lessonDuration}>⏱️ {lesson.durationMin} min</Text>
                                                {lesson.isFreePreview && (
                                                    <View style={styles.previewTag}>
                                                        <Text style={styles.previewTagText}>Muestra Gratis</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                    {lesson.isUnlocked && (
                                        <Ionicons name="chevron-forward" size={16} color="#aaa" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );

    function handleDownloadCheck(lesson: Lesson) {
        handleLessonClick(lesson);
    }
};

// ─────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#555', fontSize: 14 },

    header: { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 14, padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1 },

    scrollContent: { paddingBottom: 20 },
    courseImage: { width: '100%', height: 180 },

    infoBlock: { padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    title: { fontSize: 18, fontWeight: '800', color: '#1a237e', marginBottom: 8, lineHeight: 24 },
    description: { fontSize: 13, color: '#555', lineHeight: 20 },

    buyCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff8e1', padding: 18, borderBottomWidth: 1, borderBottomColor: '#ffe082',
    },
    buyTextCol: {},
    buyPriceLabel: { fontSize: 12, color: '#757575', fontWeight: '600' },
    buyPrice: { fontSize: 24, fontWeight: '800', color: '#d84315', marginTop: 2 },
    buyButton: {
        backgroundColor: '#d84315', flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 22, paddingVertical: 12, borderRadius: 8,
    },
    buyButtonDisabled: { opacity: 0.6 },
    buyButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    syllabusTitle: { fontSize: 15, fontWeight: '700', color: '#1a237e', marginTop: 22, marginHorizontal: 18, marginBottom: 8 },

    moduleBlock: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 18, marginBottom: 14, padding: 14, elevation: 1 },
    moduleTitle: { fontSize: 14, fontWeight: '700', color: '#1a237e', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8, marginBottom: 8 },
    lessonsList: { gap: 12 },
    lessonItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    lessonLeft: { flexDirection: 'row', gap: 10, flex: 1, alignItems: 'flex-start' },
    lessonMeta: { flex: 1 },
    lessonName: { fontSize: 13, fontWeight: '600', color: '#333', lineHeight: 18 },
    lessonNameLocked: { color: '#888' },
    lessonFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    lessonDuration: { fontSize: 11, color: '#777' },

    previewTag: { backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    previewTagText: { fontSize: 9.5, fontWeight: '700', color: '#2e7d32' }
});

export default CourseDetailScreen;
