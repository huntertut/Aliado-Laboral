import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
import { AppTheme } from '../theme/colors';

const NewsFeedScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [news, setNews] = useState<any[]>([]);

    // Modal State
    const [selectedNews, setSelectedNews] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchNews = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/news`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNews(response.data);
        } catch (error: any) {
            console.error('Error fetching news:', error);
            Alert.alert('Error', 'No se pudieron cargar las noticias. ' + (error.message || 'Intenta más tarde'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNews();
    };

    const openNewsDetail = (item: any) => {
        setSelectedNews(item);
        setModalVisible(true);
    };

    const closeNewsDetail = () => {
        setModalVisible(false);
        setSelectedNews(null);
    };

    const renderNewsItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => openNewsDetail(item)}
        >
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
            )}
            <View style={styles.cardContent}>
                <View style={styles.tagContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.roleContext === 'lawyer' ? 'TÉCNICO' : 'ACTUALIDAD'}</Text>
                    </View>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.summary} numberOfLines={3}>{item.summary}</Text>

                <View style={styles.readMoreRow}>
                    <Text style={styles.readMoreText}>Leer noticia completa</Text>
                    <Ionicons name="arrow-forward" size={16} color={AppTheme.colors.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderDetailModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeNewsDetail}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header with Back Button */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeNewsDetail} style={styles.backButton}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderText} numberOfLines={1}>Detalle de Noticia</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.modalScroll}>
                        {selectedNews?.imageUrl && (
                            <Image source={{ uri: selectedNews.imageUrl }} style={styles.modalImage} />
                        )}

                        <View style={styles.modalBody}>
                            <Text style={styles.modalTitle}>{selectedNews?.title}</Text>

                            <View style={styles.modalMeta}>
                                <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
                                <Text style={styles.modalDate}>
                                    Publicado el {selectedNews ? new Date(selectedNews.createdAt).toLocaleDateString() : ''}
                                </Text>
                            </View>

                            <View style={styles.separator} />

                            <Text style={styles.sectionHeader}>Resumen para ti:</Text>
                            <Text style={styles.modalText}>{selectedNews?.summary}</Text>

                            {/* Show full content or context if available */}
                            {selectedNews?.originalText && (
                                <>
                                    <View style={styles.separator} />
                                    <Text style={styles.sectionHeader}>Información Adicional:</Text>
                                    <Text style={styles.modalTextSmall}>
                                        {/* Simplistic extraction or just showing snippet */}
                                        {selectedNews.originalText.replace(/TITULO:.*|LINK:.*|FUENTE:.*/g, '').trim().substring(0, 300) + '...'}
                                    </Text>
                                </>
                            )}

                            {selectedNews?.quiz && (
                                <View style={styles.quizSection}>
                                    <View style={styles.quizHeader}>
                                        <Ionicons name="bulb-outline" size={24} color={AppTheme.colors.primary} />
                                        <Text style={styles.quizTitle}>Quiz Rápido</Text>
                                    </View>
                                    <Text style={styles.quizText}>{selectedNews.quiz}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppTheme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[AppTheme.colors.primary, '#2c3e50']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 15, width: 40 }}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Noticias Legales</Text>
                <Text style={styles.headerSubtitle}>Actualizaciones Laborales de México</Text>
            </LinearGradient>

            <FlatList
                data={news}
                renderItem={renderNewsItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="newspaper-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No hay noticias por ahora</Text>
                    </View>
                }
            />

            {renderDetailModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f6f8',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
        paddingTop: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 160,
    },
    cardContent: {
        padding: 16,
    },
    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tag: {
        backgroundColor: AppTheme.colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        color: AppTheme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
        color: '#95a5a6',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 8,
        lineHeight: 24,
    },
    summary: {
        fontSize: 14,
        color: '#636e72',
        lineHeight: 20,
        marginBottom: 12,
    },
    readMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    readMoreText: {
        color: AppTheme.colors.primary,
        fontSize: 13,
        fontWeight: '600',
        marginRight: 4,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Backdrop
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '92%',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    backButton: {
        padding: 5,
    },
    modalHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    modalScroll: {
        paddingBottom: 40,
    },
    modalImage: {
        width: '100%',
        height: 220,
        resizeMode: 'cover',
    },
    modalBody: {
        padding: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2d3436',
        marginBottom: 10,
        lineHeight: 30,
    },
    modalMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalDate: {
        marginLeft: 6,
        color: '#7f8c8d',
        fontSize: 13,
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        color: '#4a4a4a',
        lineHeight: 26,
        fontWeight: '400',
    },
    modalTextSmall: {
        fontSize: 14,
        color: '#7f8c8d',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    quizSection: {
        marginTop: 25,
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: AppTheme.colors.primary,
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    quizTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginLeft: 8,
    },
    quizText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: '#95a5a6',
        fontSize: 16,
    },
});

export default NewsFeedScreen;

