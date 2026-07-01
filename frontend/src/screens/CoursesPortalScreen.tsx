import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, Image, ActivityIndicator, RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface CourseProduct {
    id: string;
    title: string;
    description: string;
    coverImage: string | null;
    price: string;
    category: string;
    totalLessons: number;
    isPurchased: boolean;
    progressPercent: number;
    completedLessonsCount: number;
}

const CATEGORIES = [
    { id: 'all', label: 'Todos', icon: 'grid-outline' },
    { id: 'retirement', label: 'Pensiones IMSS', icon: 'cash-outline' },
    { id: 'defense', label: 'Defensa Laboral', icon: 'shield-outline' },
    { id: 'freelancer', label: 'Freelancers', icon: 'rocket-outline' },
    { id: 'bureaucracy', label: 'Hacks Trámites', icon: 'document-text-outline' },
];

// ─────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────

const CoursesPortalScreen = () => {
    const navigation = useNavigation<any>();
    const { getAccessToken } = useAuth();

    const [courses, setCourses] = useState<CourseProduct[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCourses = useCallback(async () => {
        try {
            const token = await getAccessToken();
            const res = await fetch(endpoints.courses.list, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCourses(data.courses || []);
            }
        } catch (err) {
            console.error('Error fetching courses list:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses();
    };

    const filteredCourses = selectedCategory === 'all'
        ? courses
        : courses.filter(c => c.category === selectedCategory);

    // ─────────────────────────────────────────────────
    // RENDERS
    // ─────────────────────────────────────────────────

    const renderCategoryTab = ({ item }: { item: typeof CATEGORIES[0] }) => {
        const isSelected = selectedCategory === item.id;
        return (
            <TouchableOpacity
                style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
                onPress={() => setSelectedCategory(item.id)}
            >
                <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={isSelected ? '#fff' : '#1a237e'}
                    style={{ marginRight: 6 }}
                />
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderCourseCard = ({ item }: { item: CourseProduct }) => {
        return (
            <TouchableOpacity
                style={styles.courseCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
                activeOpacity={0.9}
            >
                {/* Cover Image */}
                <Image
                    source={{ uri: item.coverImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400' }}
                    style={styles.courseImage}
                    resizeMode="cover"
                />

                {/* Status Badge */}
                <View style={styles.badgeContainer}>
                    {item.isPurchased ? (
                        <View style={[styles.badge, styles.badgePurchased]}>
                            <Ionicons name="checkmark-circle" size={12} color="#fff" />
                            <Text style={styles.badgeText}>Adquirido</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, styles.badgePrice]}>
                            <Text style={styles.badgeText}>${parseFloat(item.price).toFixed(0)} MXN</Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.courseDesc} numberOfLines={2}>{item.description}</Text>

                    {/* Stats & Progress */}
                    {item.isPurchased ? (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${item.progressPercent}%` }]} />
                            </View>
                            <View style={styles.progressTextRow}>
                                <Text style={styles.progressText}>{item.progressPercent}% Completado</Text>
                                <Text style={styles.lessonsCountText}>
                                    {item.completedLessonsCount}/{item.totalLessons} lecciones
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.courseFooter}>
                            <Ionicons name="book-outline" size={14} color="#666" />
                            <Text style={styles.lessonsCountText}> {item.totalLessons} lecciones de capacitación</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>Cargando portal de capacitación...</Text>
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
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🎓 Capacitación Laboral</Text>
                    <Text style={styles.headerSubtitle}>Aprende, protégete y aumenta tus ingresos</Text>
                </View>
            </LinearGradient>

            {/* Categories Selector */}
            <View style={styles.categoriesWrapper}>
                <FlatList
                    data={CATEGORIES}
                    renderItem={renderCategoryTab}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                />
            </View>

            {/* Courses List */}
            <FlatList
                data={filteredCourses}
                renderItem={renderCourseCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.coursesList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="school-outline" size={48} color="#aaa" />
                        <Text style={styles.emptyText}>No hay cursos disponibles en esta categoría</Text>
                    </View>
                }
            />
        </View>
    );
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
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

    categoriesWrapper: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    categoriesList: { paddingHorizontal: 16, gap: 8 },
    categoryTab: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#e8eaf6', borderWidth: 1, borderColor: '#c5cae9',
    },
    categoryTabSelected: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
    categoryLabel: { fontSize: 13, fontWeight: '600', color: '#1a237e' },
    categoryLabelSelected: { color: '#fff' },

    coursesList: { padding: 18, gap: 18 },
    courseCard: {
        backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    courseImage: { width: '100%', height: 160 },
    badgeContainer: { position: 'absolute', top: 12, right: 12 },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    },
    badgePurchased: { backgroundColor: '#2e7d32' },
    badgePrice: { backgroundColor: 'rgba(0,0,0,0.75)' },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    courseInfo: { padding: 16 },
    courseTitle: { fontSize: 16, fontWeight: '700', color: '#1a237e', marginBottom: 6, lineHeight: 22 },
    courseDesc: { fontSize: 12.5, color: '#666', lineHeight: 18, marginBottom: 14 },
    courseFooter: { flexDirection: 'row', alignItems: 'center' },

    progressContainer: { marginTop: 4 },
    progressBarBg: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', backgroundColor: '#1a237e' },
    progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressText: { fontSize: 11.5, fontWeight: '700', color: '#1a237e' },
    lessonsCountText: { fontSize: 11.5, color: '#666' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
    emptyText: { color: '#888', fontSize: 14, textAlign: 'center' }
});

export default CoursesPortalScreen;
