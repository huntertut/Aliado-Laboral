import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface LessonDetails {
    id: string;
    title: string;
    content: string | null;
    videoUrl: string | null;
    durationMin: number;
    sortOrder: number;
    isCompleted: boolean;
    attachmentUrl: string | null;
    attachmentName: string | null;
}

// ─────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────

const LessonViewerScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { getAccessToken } = useAuth();

    const { lessonId, courseId, title } = route.params;

    const [lesson, setLesson] = useState<LessonDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [toggling, setToggling] = useState(false);

    const fetchLessonDetails = useCallback(async () => {
        try {
            const token = await getAccessToken();
            // We fetch the course detail, and extract our target lesson
            const res = await fetch(endpoints.courses.detail(courseId), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const allLessons: LessonDetails[] = [];
                
                data.course.modules.forEach((mod: any) => {
                    mod.lessons.forEach((les: any) => {
                        allLessons.push(les);
                    });
                });

                const target = allLessons.find(l => l.id === lessonId);
                setLesson(target || null);
            }
        } catch (err) {
            console.error('Error fetching lesson details:', err);
        } finally {
            setLoading(false);
        }
    }, [courseId, lessonId, getAccessToken]);

    useEffect(() => {
        fetchLessonDetails();
    }, [fetchLessonDetails]);

    // ── PROGRESS TOGGLE ─────────────────────────────

    const handleToggleComplete = async () => {
        if (!lesson) return;
        try {
            setToggling(true);
            const token = await getAccessToken();
            const nextState = !lesson.isCompleted;

            const res = await fetch(endpoints.courses.completeLesson(lesson.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isCompleted: nextState })
            });

            if (res.ok) {
                const data = await res.json();
                setLesson(prev => prev ? { ...prev, isCompleted: data.isCompleted } : null);
                
                if (data.courseCompleted && nextState) {
                    Alert.alert('🏆 ¡Curso Completado!', '¡Excelente trabajo! Has finalizado todas las lecciones de este curso de capacitación.');
                }
            }
        } catch (err) {
            Alert.alert('Error', 'No se pudo actualizar el progreso');
        } finally {
            setToggling(false);
        }
    };

    // ── DOWNLOAD ATTACHMENT FLOW ────────────────────

    const handleDownloadAttachment = async () => {
        if (!lesson || !lesson.attachmentUrl) return;
        try {
            setDownloading(true);

            const filename = lesson.attachmentName || 'recurso_aliado.pdf';
            const localUri = FileSystem.documentDirectory + filename.replace(/\s+/g, '_');

            // Download file to local document folder
            const { uri } = await FileSystem.downloadAsync(lesson.attachmentUrl, localUri);

            // Share / Open the file natively on iOS/Android
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Recurso Guardado', `Archivo guardado en: ${uri}`);
            }

        } catch (err) {
            console.error('Download error:', err);
            Alert.alert('Error', 'No se pudo descargar el recurso de apoyo.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>Cargando lección...</Text>
            </View>
        );
    }

    if (!lesson) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se pudo cargar la lección.</Text>
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
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Video Player (if available) */}
                {lesson.videoUrl ? (
                    <Video
                        source={{ uri: lesson.videoUrl }}
                        rate={1.0}
                        volume={1.0}
                        isMuted={false}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={false}
                        useNativeControls
                        style={styles.videoPlayer}
                    />
                ) : (
                    <View style={styles.noVideoPlaceholder}>
                        <Ionicons name="document-text" size={42} color="#999" />
                        <Text style={styles.noVideoText}>Lección de lectura teórica</Text>
                    </View>
                )}

                {/* Lesson Title */}
                <Text style={styles.lessonTitle}>{lesson.title}</Text>

                {/* Markdown Rich Content */}
                {lesson.content ? (
                    <View style={styles.markdownWrapper}>
                        <Markdown style={markdownStyles}>
                            {lesson.content}
                        </Markdown>
                    </View>
                ) : (
                    <Text style={styles.noContentText}>Sin contenido escrito disponible.</Text>
                )}

                {/* Attached Tool ("Curso + Herramienta") */}
                {lesson.attachmentUrl && (
                    <View style={styles.attachmentCard}>
                        <View style={styles.attachmentIconBox}>
                            <Ionicons name="document-attach-outline" size={24} color="#0d47a1" />
                        </View>
                        <View style={styles.attachmentInfo}>
                            <Text style={styles.attachmentTitle}>Herramienta Adjunta Desbloqueada</Text>
                            <Text style={styles.attachmentFilename} numberOfLines={1}>
                                {lesson.attachmentName || 'Recurso descargable'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.downloadBtn, downloading && styles.btnDisabled]}
                            onPress={handleDownloadAttachment}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-download-outline" size={16} color="#fff" />
                                    <Text style={styles.downloadBtnText}>Obtener</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Complete Button */}
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        lesson.isCompleted ? styles.completeBtnActive : styles.completeBtnInactive,
                        toggling && styles.btnDisabled
                    ]}
                    onPress={handleToggleComplete}
                    disabled={toggling}
                >
                    {toggling ? (
                        <ActivityIndicator size="small" color={lesson.isCompleted ? '#2e7d32' : '#fff'} />
                    ) : (
                        <>
                            <Ionicons
                                name={lesson.isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                size={18}
                                color={lesson.isCompleted ? '#2e7d32' : '#fff'}
                            />
                            <Text style={[styles.completeBtnText, lesson.isCompleted && styles.completeBtnTextActive]}>
                                {lesson.isCompleted ? 'Lección Completada' : 'Marcar como Completada'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

// ─────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#555', fontSize: 14 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#888' },

    header: { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 14, padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1 },

    scrollContent: { paddingBottom: 30 },
    videoPlayer: { width: '100%', height: width * 0.56, backgroundColor: '#000' }, // 16:9 Aspect Ratio
    noVideoPlaceholder: {
        width: '100%', height: 120, backgroundColor: '#f0f0f0',
        justifyContent: 'center', alignItems: 'center', gap: 6,
    },
    noVideoText: { fontSize: 12, color: '#888' },

    lessonTitle: { fontSize: 18, fontWeight: '800', color: '#1a237e', marginTop: 18, marginHorizontal: 18, lineHeight: 24 },
    markdownWrapper: { paddingHorizontal: 18, marginTop: 12 },
    noContentText: { fontSize: 13, color: '#888', marginHorizontal: 18, marginTop: 14 },

    attachmentCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#e3f2fd', borderRadius: 10, borderWidth: 1, borderColor: '#bbdefb',
        marginHorizontal: 18, marginTop: 22, padding: 14,
    },
    attachmentIconBox: { backgroundColor: '#bbdefb', padding: 8, borderRadius: 8 },
    attachmentInfo: { flex: 1 },
    attachmentTitle: { fontSize: 12, fontWeight: '700', color: '#0d47a1' },
    attachmentFilename: { fontSize: 11, color: '#555', marginTop: 2 },
    downloadBtn: {
        backgroundColor: '#0d47a1', flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
    },
    btnDisabled: { opacity: 0.6 },
    downloadBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    completeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginHorizontal: 18, marginTop: 20, paddingVertical: 14, borderRadius: 10,
        borderWidth: 1.5,
    },
    completeBtnInactive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
    completeBtnActive: { backgroundColor: '#fff', borderColor: '#2e7d32' },
    completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    completeBtnTextActive: { color: '#2e7d32' },
});

// Markdown renderer styling
const markdownStyles = {
    body: { fontSize: 14, lineHeight: 22, color: '#333' },
    heading3: { fontSize: 15, fontWeight: '700', color: '#1a237e', marginTop: 14, marginBottom: 6 },
    bullet_list: { marginTop: 6, marginBottom: 6 },
    list_item: { fontSize: 13.5, lineHeight: 20, marginBottom: 4 }
};

export default LessonViewerScreen;
