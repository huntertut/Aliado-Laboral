import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image, ActivityIndicator,
    RefreshControl, TouchableOpacity, Modal, ScrollView, Animated,
    Alert, Linking, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const NewsFeedScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    
    // Tabs state
    const [activeTab, setActiveTab] = useState<'notifications' | 'news'>('notifications');
    
    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);
    const [refreshingNotifications, setRefreshingNotifications] = useState(false);
    
    // News State
    const [news, setNews] = useState<any[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [refreshingNews, setRefreshingNews] = useState(false);

    // Modal State
    const [selectedNews, setSelectedNews] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [perspectiveTab, setPerspectiveTab] = useState<'worker' | 'sme' | 'lawyer'>('worker');
    const [isOfflineNotifications, setIsOfflineNotifications] = useState(false);
    const [isOfflineNews, setIsOfflineNews] = useState(false);

    // ─────────────────────────────────────────────
    // Fetch Notifications
    // ─────────────────────────────────────────────
    const fetchNotifications = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data as any[];
            setNotifications(data);
            setIsOfflineNotifications(false);
            await AsyncStorage.setItem('cached_notifications', JSON.stringify(data));
        } catch (error: any) {
            console.error('Error fetching notifications, loading from cache:', error);
            try {
                const cachedData = await AsyncStorage.getItem('cached_notifications');
                if (cachedData) {
                    setNotifications(JSON.parse(cachedData));
                    setIsOfflineNotifications(true);
                }
            } catch (cacheErr) {
                console.error('Error reading notifications cache:', cacheErr);
            }
        } finally {
            setLoadingNotifications(false);
            setRefreshingNotifications(false);
        }
    };

    // ─────────────────────────────────────────────
    // Fetch News
    // ─────────────────────────────────────────────
    const fetchNews = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/news`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = response.data as any[];
            setNews(data);
            setIsOfflineNews(false);
            await AsyncStorage.setItem('cached_news', JSON.stringify(data));
        } catch (error: any) {
            console.error('Error fetching news, loading from cache:', error);
            try {
                const cachedData = await AsyncStorage.getItem('cached_news');
                if (cachedData) {
                    setNews(JSON.parse(cachedData));
                    setIsOfflineNews(true);
                } else {
                    Alert.alert('Sin conexión', 'No hay noticias en la caché y no se pudo conectar al servidor.');
                }
            } catch (cacheErr) {
                console.error('Error reading news cache:', cacheErr);
            }
        } finally {
            setLoadingNews(false);
            setRefreshingNews(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchNews();
    }, []);

    // ─────────────────────────────────────────────
    // Pull to Refresh
    // ─────────────────────────────────────────────
    const onRefreshNotifications = () => {
        setRefreshingNotifications(true);
        fetchNotifications();
    };

    const onRefreshNews = () => {
        setRefreshingNews(true);
        fetchNews();
    };

    // ─────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────
    const handleNotificationPress = async (item: any) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            // Mark as read in DB if unread
            if (!item.isRead) {
                await axios.put(`${API_URL}/notifications/${item.id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Update local state
                setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
            }

            // Redirect based on type & user role
            if (item.type === 'chat' || item.type === 'case_update' || item.type === 'contact') {
                if (user?.role === 'lawyer') {
                    navigation.navigate('LawyerRequests' as never);
                } else if (user?.role === 'pyme') {
                    navigation.navigate('HomePyme' as never);
                } else {
                    navigation.navigate('MyContactRequests' as never);
                }
            } else if (item.type === 'document_ready') {
                navigation.navigate('LegalDocuments' as never);
            } else if (item.type === 'course_unlocked') {
                navigation.navigate('CoursesPortal' as never);
            } else if (item.type === 'subscription_activated' || item.type === 'renewal_warning') {
                navigation.navigate('SubscriptionManagement' as never);
            } else if (item.type === 'news') {
                setActiveTab('news');
            }
        } catch (err) {
            console.error('Error processing notification press:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            await axios.put(`${API_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            Alert.alert('Éxito', 'Todos los avisos marcados como leídos');
        } catch (error) {
            console.error('Error marking all as read:', error);
            Alert.alert('Error', 'No se pudo realizar la acción');
        }
    };

    const openNewsDetail = (item: any) => {
        setSelectedNews(item);
        setModalVisible(true);
        // Default perspective based on user role
        if (user?.role === 'lawyer') {
            setPerspectiveTab('lawyer');
        } else if (user?.role === 'pyme') {
            setPerspectiveTab('sme');
        } else {
            setPerspectiveTab('worker');
        }
    };

    const closeNewsDetail = () => {
        setModalVisible(false);
        setSelectedNews(null);
    };

    const handleOpenSource = () => {
        if (selectedNews?.sourceUrl) {
            Linking.openURL(selectedNews.sourceUrl).catch((err) => {
                console.error('Error opening source URL:', err);
                Alert.alert('Error', 'No se pudo abrir el enlace original.');
            });
        }
    };

    // ─────────────────────────────────────────────
    // Render Items
    // ─────────────────────────────────────────────
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'chat':
                return { name: 'chatbubble-ellipses-outline', color: '#0984e3', bgColor: '#e1f5fe' };
            case 'case_update':
                return { name: 'briefcase-outline', color: '#e17055', bgColor: '#fbe9e7' };
            case 'news':
                return { name: 'newspaper-outline', color: '#2ecc71', bgColor: '#e8f5e9' };
            case 'document_ready':
                return { name: 'document-text-outline', color: '#0097a7', bgColor: '#e0f7fa' }; // Teal
            case 'course_unlocked':
                return { name: 'school-outline', color: '#6200ea', bgColor: '#f3e5f5' }; // Purple
            case 'subscription_activated':
                return { name: 'star-outline', color: '#e65100', bgColor: '#fff3e0' }; // Amber
            case 'renewal_warning':
                return { name: 'card-outline', color: '#c2185b', bgColor: '#fce4ec' }; // Pink
            default:
                return { name: 'notifications-outline', color: '#1e3799', bgColor: '#e8eaf6' };
        }
    };

    const renderNotificationItem = ({ item }: { item: any }) => {
        const iconConfig = getNotificationIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.notiCard, !item.isRead && styles.notiCardUnread]}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={[styles.notiIconCircle, { backgroundColor: iconConfig.bgColor }]}>
                    <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
                </View>
                <View style={styles.notiTextContainer}>
                    <View style={styles.notiHeaderRow}>
                        <Text style={[styles.notiTitle, !item.isRead && styles.notiTitleUnread]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notiBody} numberOfLines={2}>
                        {item.body}
                    </Text>
                    <Text style={styles.notiTime}>
                        {new Date(item.createdAt).toLocaleDateString('es-MX')} a las{' '}
                        {new Date(item.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderNewsItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.newsCard}
            activeOpacity={0.9}
            onPress={() => openNewsDetail(item)}
        >
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
            )}
            <View style={styles.newsCardContent}>
                <View style={styles.tagContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>
                            {item.sourceName ? item.sourceName.toUpperCase() : 'ACTUALIDAD'}
                        </Text>
                    </View>
                    <Text style={styles.newsDate}>
                        {new Date(item.createdAt).toLocaleDateString('es-MX')}
                    </Text>
                </View>

                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.newsSummary} numberOfLines={3}>{item.summary}</Text>

                <View style={styles.readMoreRow}>
                    <Text style={styles.readMoreText}>Leer análisis completo</Text>
                    <Ionicons name="arrow-forward" size={14} color={AppTheme.colors.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    // ─────────────────────────────────────────────
    // Render Modal (News Details)
    // ─────────────────────────────────────────────
    const getActiveSummary = () => {
        if (perspectiveTab === 'lawyer') return selectedNews?.summaryLawyer || selectedNews?.summary;
        if (perspectiveTab === 'sme') return selectedNews?.summarySme || selectedNews?.summary;
        return selectedNews?.summaryWorker || selectedNews?.summary;
    };

    const renderDetailModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeNewsDetail}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Drag indicator/handle */}
                    <View style={styles.modalDragHandle} />

                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeNewsDetail} style={styles.closeButton}>
                            <Ionicons name="close" size={26} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderText} numberOfLines={1}>Noticia Detallada</Text>
                        <View style={{ width: 36 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                        {selectedNews?.imageUrl && (
                            <Image source={{ uri: selectedNews.imageUrl }} style={styles.modalImage} />
                        )}

                        <View style={styles.modalBody}>
                            <Text style={styles.modalTitle}>{selectedNews?.title}</Text>

                            <View style={styles.modalMeta}>
                                <Ionicons name="calendar-outline" size={14} color="#7f8c8d" />
                                <Text style={styles.modalDate}>
                                    Publicado el {selectedNews ? new Date(selectedNews.createdAt).toLocaleDateString('es-MX') : ''}
                                </Text>
                            </View>

                            <View style={styles.separator} />

                            {/* Perspective Tab Selector */}
                            <Text style={styles.perspectiveLabel}>Ver análisis especializado:</Text>
                            <View style={styles.perspectiveContainer}>
                                <TouchableOpacity
                                    style={[styles.perspectivePill, perspectiveTab === 'worker' && styles.perspectivePillActive]}
                                    onPress={() => setPerspectiveTab('worker')}
                                >
                                    <Text style={[styles.perspectiveText, perspectiveTab === 'worker' && styles.perspectiveTextActive]}>
                                        👷 Trabajador
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.perspectivePill, perspectiveTab === 'sme' && styles.perspectivePillActive]}
                                    onPress={() => setPerspectiveTab('sme')}
                                >
                                    <Text style={[styles.perspectiveText, perspectiveTab === 'sme' && styles.perspectiveTextActive]}>
                                        🏢 PYME
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.perspectivePill, perspectiveTab === 'lawyer' && styles.perspectivePillActive]}
                                    onPress={() => setPerspectiveTab('lawyer')}
                                >
                                    <Text style={[styles.perspectiveText, perspectiveTab === 'lawyer' && styles.perspectiveTextActive]}>
                                        ⚖️ Abogado
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.summaryCard}>
                                <Text style={styles.modalText}>{getActiveSummary()}</Text>
                            </View>

                            {/* Trivia Quiz */}
                            {selectedNews?.quiz && (
                                <View style={styles.quizSection}>
                                    <View style={styles.quizHeader}>
                                        <Ionicons name="bulb" size={20} color={AppTheme.colors.primary} />
                                        <Text style={styles.quizTitle}>Sabías que...</Text>
                                    </View>
                                    <Text style={styles.quizText}>{selectedNews.quiz}</Text>
                                </View>
                            )}

                            {/* Atribución de fuente */}
                            <View style={styles.sourceCard}>
                                <View style={styles.sourceHeader}>
                                    <Ionicons name="newspaper" size={20} color="#2c3e50" />
                                    <Text style={styles.sourceTitle}>Fuente y Atribución</Text>
                                </View>
                                <Text style={styles.sourceNameText}>
                                    Esta noticia proviene originalmente de:{' '}
                                    <Text style={{ fontWeight: 'bold' }}>
                                        {selectedNews?.sourceName || 'Google News México'}
                                    </Text>
                                </Text>
                                {selectedNews?.sourceUrl && (
                                    <TouchableOpacity style={styles.sourceButton} onPress={handleOpenSource}>
                                        <Text style={styles.sourceButtonText}>Ver nota completa en la fuente</Text>
                                        <Ionicons name="open-outline" size={16} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // ─────────────────────────────────────────────
    // Main Render
    // ─────────────────────────────────────────────
    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    return (
        <View style={styles.container}>
            {/* Header Area */}
            <LinearGradient
                colors={[AppTheme.colors.primary, '#2c3e50']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={26} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notificaciones</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={styles.headerSubtitle}>Avisos y Actualizaciones Laborales</Text>
            </LinearGradient>

            {/* Custom Sliding Tab Bar */}
            <View style={styles.tabBarContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('notifications')}
                >
                    <View style={styles.tabButtonContent}>
                        <Ionicons
                            name={activeTab === 'notifications' ? "notifications" : "notifications-outline"}
                            size={18}
                            color={activeTab === 'notifications' ? '#fff' : '#636e72'}
                        />
                        <Text style={[styles.tabButtonText, activeTab === 'notifications' && styles.tabButtonTextActive]}>
                            Avisos
                        </Text>
                        {unreadNotificationsCount > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{unreadNotificationsCount}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'news' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('news')}
                >
                    <View style={styles.tabButtonContent}>
                        <Ionicons
                            name={activeTab === 'news' ? "newspaper" : "newspaper-outline"}
                            size={18}
                            color={activeTab === 'news' ? '#fff' : '#636e72'}
                        />
                        <Text style={[styles.tabButtonText, activeTab === 'news' && styles.tabButtonTextActive]}>
                            Noticias
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Lists content */}
            {activeTab === 'notifications' ? (
                loadingNotifications ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        {unreadNotificationsCount > 0 && (
                            <View style={styles.markAllContainer}>
                                <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllAsRead}>
                                    <Ionicons name="checkmark-done-outline" size={18} color={AppTheme.colors.primary} />
                                    <Text style={styles.markAllBtnText}>Marcar todos como leídos</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {isOfflineNotifications && (
                            <View style={styles.offlineBanner}>
                                <Ionicons name="cloud-offline" size={16} color="#7f8c8d" />
                                <Text style={styles.offlineBannerText}>Mostrando avisos locales (sin conexión)</Text>
                            </View>
                        )}
                        <FlatList
                            data={notifications}
                            renderItem={renderNotificationItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={refreshingNotifications} onRefresh={onRefreshNotifications} />}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                                    <Text style={styles.emptyText}>No tienes avisos nuevos</Text>
                                    <Text style={styles.emptySubtext}>Te avisaremos aquí cuando haya actualizaciones en tus casos o mensajes.</Text>
                                </View>
                            }
                        />
                    </View>
                )
            ) : (
                loadingNews ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        {isOfflineNews && (
                            <View style={styles.offlineBanner}>
                                <Ionicons name="cloud-offline" size={16} color="#7f8c8d" />
                                <Text style={styles.offlineBannerText}>Mostrando noticias locales (sin conexión)</Text>
                            </View>
                        )}
                        <FlatList
                            data={news}
                            renderItem={renderNewsItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={refreshingNews} onRefresh={onRefreshNews} />}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="newspaper-outline" size={60} color="#ccc" />
                                    <Text style={styles.emptyText}>No hay noticias por ahora</Text>
                                </View>
                            }
                        />
                    </View>
                )
            )}

            {renderDetailModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f6f8',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        textAlign: 'center',
    },

    // Tab Bar Styles
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -15,
        borderRadius: 14,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    tabButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonActive: {
        backgroundColor: AppTheme.colors.primary,
    },
    tabButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636e72',
    },
    tabButtonTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    tabBadge: {
        backgroundColor: '#e74c3c',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginLeft: 2,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },

    // List & Cards General
    listContent: {
        padding: 18,
        paddingTop: 15,
    },

    // Notifications List
    markAllContainer: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppTheme.colors.primary + '30',
    },
    markAllBtnText: {
        color: AppTheme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    notiCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    notiCardUnread: {
        backgroundColor: '#f0f4ff',
        borderColor: AppTheme.colors.primary + '25',
        borderLeftWidth: 4,
        borderLeftColor: AppTheme.colors.primary,
    },
    notiIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notiTextContainer: {
        flex: 1,
    },
    notiHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    notiTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        flex: 1,
        marginRight: 6,
    },
    notiTitleUnread: {
        color: '#1e293b',
        fontWeight: '800',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3498db',
    },
    notiBody: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 17,
        marginBottom: 4,
    },
    notiTime: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
    },

    // News Card
    newsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eef2f6',
    },
    newsImage: {
        width: '100%',
        height: 160,
    },
    newsCardContent: {
        padding: 16,
    },
    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tag: {
        backgroundColor: '#f1f2f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        color: '#2c3e50',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.2,
    },
    newsDate: {
        fontSize: 11,
        color: '#95a5a6',
        fontWeight: '500',
    },
    newsTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#2d3436',
        marginBottom: 6,
        lineHeight: 22,
    },
    newsSummary: {
        fontSize: 13,
        color: '#636e72',
        lineHeight: 18,
        marginBottom: 12,
    },
    readMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
    },
    readMoreText: {
        color: AppTheme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },

    // Empty States
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 30,
    },
    emptyText: {
        marginTop: 12,
        color: '#7f8c8d',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 6,
        color: '#bdc3c7',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },

    // Modal Details Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '92%',
        width: '100%',
    },
    modalDragHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#e2e8f0',
        alignSelf: 'center',
        marginTop: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    closeButton: {
        padding: 5,
    },
    modalHeaderText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalScroll: {
        paddingBottom: 40,
    },
    modalImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    modalBody: {
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 8,
        lineHeight: 26,
    },
    modalMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalDate: {
        marginLeft: 6,
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    perspectiveLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    perspectiveContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 4,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    perspectivePill: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    perspectivePillActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    perspectiveText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    perspectiveTextActive: {
        color: AppTheme.colors.primary,
        fontWeight: '800',
    },
    summaryCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    modalText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
        fontWeight: '400',
    },
    quizSection: {
        backgroundColor: '#e1f5fe',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#0288d1',
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    quizTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0288d1',
        textTransform: 'uppercase',
    },
    quizText: {
        fontSize: 14,
        color: '#01579b',
        fontWeight: '500',
        lineHeight: 18,
    },

    // Source Card
    sourceCard: {
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'stretch',
    },
    sourceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    sourceTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#334155',
        textTransform: 'uppercase',
    },
    sourceNameText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 12,
    },
    sourceButton: {
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sourceButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#eef2f6',
        paddingVertical: 8,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#dfe4ea',
    },
    offlineBannerText: {
        color: '#7f8c8d',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default NewsFeedScreen;
