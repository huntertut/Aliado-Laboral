import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/constants';
import moment from 'moment';
import 'moment/locale/es';

const { width } = Dimensions.get('window');
moment.locale('es');

const LawyerCasesScreen = () => {
    const navigation = useNavigation<any>();
    const { getAccessToken, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'active' | 'waiting' | 'history'>('active');
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const userEmail = user?.email?.toLowerCase();
    const isProTestAccount = userEmail === 'lawyer_pro@test.com';

    useEffect(() => {
        fetchCases();
        const unsubscribe = navigation.addListener('focus', fetchCases);
        return unsubscribe;
    }, [navigation]);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/contact/lawyer`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let data = response.data.requests || [];

            // Targeted Demo Logic for PRO test account
            if (isProTestAccount && data.length === 0) {
                data = [
                    {
                        id: 'demo-case-1',
                        status: 'accepted',
                        subStatus: 'waiting_lawyer_response',
                        caseType: 'Despido Injustificado',
                        lastMessageContent: 'Hola Licenciado, ¿qué documentos necesito para la demanda?',
                        lastMessageAt: new Date().toISOString(),
                        unreadCountLawyer: 1,
                        isHot: true,
                        isExample: true,
                        worker: { fullName: 'Juan Pérez (Demo)' }
                    },
                    {
                        id: 'demo-case-2',
                        status: 'accepted',
                        subStatus: 'waiting_worker_response',
                        caseType: 'Acoso Laboral',
                        lastMessageContent: 'Ya envié la notificación a la empresa.',
                        lastMessageAt: moment().subtract(1, 'day').toISOString(),
                        unreadCountLawyer: 0,
                        isExample: true,
                        worker: { fullName: 'María García (Demo)' }
                    }
                ];
            }

            setCases(data);
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredCases = () => {
        return cases.filter(item => {
            const isAccepted = item.status === 'accepted';
            const isFinalized = item.status === 'finalized' || item.status === 'archived';

            if (activeTab === 'history') return isFinalized;
            if (!isAccepted) return false;

            if (item.subStatus === 'waiting_lawyer_response') return activeTab === 'active';
            if (item.subStatus === 'waiting_worker_response') return activeTab === 'waiting';

            return activeTab === 'active';
        });
    };

    const renderCaseCard = ({ item }: { item: any }) => {
        const isUnread = item.unreadCountLawyer > 0;

        return (
            <TouchableOpacity
                style={[styles.card, isUnread && styles.unreadCard]}
                onPress={() => {
                    if (item.isExample) {
                        Alert.alert('Modo Demo', 'Este es un caso de ejemplo para mostrar cómo funciona el sistema de chat.');
                    } else {
                        navigation.navigate('CaseChat' as never, { requestId: item.id, workerName: item.worker.fullName } as never);
                    }
                }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.workerRow}>
                        <View style={styles.avatarMini}>
                            <Text style={styles.avatarText}>{item.worker.fullName.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={styles.workerName}>{item.worker.fullName}</Text>
                            {item.isExample && <Text style={styles.exampleTag}>EJEMPLO</Text>}
                        </View>
                    </View>
                    <Text style={styles.time}>{moment(item.lastMessageAt || item.createdAt).fromNow()}</Text>
                </View>

                <View style={styles.cardBody}>
                    <Text numberOfLines={2} style={[styles.lastMessage, isUnread && styles.unreadText]}>
                        {item.lastMessageContent || "Haz clic para iniciar la conversación"}
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.badgeContainer}>
                        {item.isHot && (
                            <View style={[styles.badge, styles.hotBadge]}>
                                <Text style={styles.hotBadgeText}>🔥 Urgente</Text>
                            </View>
                        )}
                        <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={[styles.badgeText, { color: AppTheme.colors.primary }]}>{item.caseType || 'Laboral'}</Text>
                        </View>
                    </View>
                    {isUnread && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{item.unreadCountLawyer}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Casos Aceptados</Text>
                        <TouchableOpacity onPress={fetchCases} style={styles.reloadButton}>
                            <Ionicons name="reload" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                            onPress={() => setActiveTab('active')}
                        >
                            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Por Responder</Text>
                            {cases.filter(c => c.subStatus === 'waiting_lawyer_response' && c.status === 'accepted').length > 0 && (
                                <View style={styles.dot} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'waiting' && styles.activeTab]}
                            onPress={() => setActiveTab('waiting')}
                        >
                            <Text style={[styles.tabText, activeTab === 'waiting' && styles.activeTabText]}>En Espera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                            onPress={() => setActiveTab('history')}
                        >
                            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historial</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={getFilteredCases()}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCaseCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="chatbox-ellipses-outline" size={60} color="#bdc3c7" />
                            </View>
                            <Text style={styles.emptyTitle}>Sin casos aquí</Text>
                            <Text style={styles.emptyText}>Los casos que aceptes aparecerán en esta sección para que puedas chatear con tus clientes.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    header: {
        paddingTop: 40,
        paddingBottom: 10,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    backButton: {
        padding: 5,
    },
    reloadButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginTop: 10,
        marginBottom: 5,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        position: 'relative',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#fff',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dot: {
        position: 'absolute',
        top: 10,
        right: '15%',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFD200',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    unreadCard: {
        borderColor: AppTheme.colors.primary,
        backgroundColor: '#F8FAFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    workerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarMini: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E8EAF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    workerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    exampleTag: {
        fontSize: 10,
        color: '#95a5a6',
        fontWeight: 'bold',
        marginTop: 2,
    },
    time: {
        fontSize: 11,
        color: '#95a5a6',
    },
    cardBody: {
        marginBottom: 12,
    },
    lastMessage: {
        fontSize: 14,
        color: '#7f8c8d',
        lineHeight: 20,
    },
    unreadText: {
        color: '#2c3e50',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    hotBadge: {
        backgroundColor: '#FFF1F0',
    },
    hotBadgeText: {
        fontSize: 10,
        color: '#CF1322',
        fontWeight: 'bold',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    unreadBadge: {
        backgroundColor: AppTheme.colors.primary,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#95a5a6',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default LawyerCasesScreen;

