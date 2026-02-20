
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { AnalyticsService } from '../services/AnalyticsService';

const LawyerRequestsScreen = () => {
    const navigation = useNavigation<any>();
    const { user, getAccessToken } = useAuth(); // Obtener usuario real y función de token
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');

    // TRACK LOCKED VIEWS
    useEffect(() => {
        if (!loading && requests.length > 0 && user) {
            const lockedCount = requests.filter(r => {
                const isHot = r.isHot || r.classification === 'hot';
                const isPro = user.plan === 'pro' || user.role === 'admin';
                return isHot && !isPro;
            }).length;

            if (lockedCount > 0) {
                AnalyticsService.logEvent('lead_locked_view', {
                    locked_count: lockedCount,
                    lawyer_id: user.id
                });
            }
        }
    }, [loading, requests, user]);

    useEffect(() => {
        if (user) {
            fetchRequests(activeTab);
        }
    }, [activeTab, user]);

    const fetchRequests = async (status: string) => {
        try {
            if (!user) return;

            // --- DEMO MODE CHECK ---
            const isDemoUser = user.id.startsWith('demo-') || user.email === 'lawyer_pro@test.com';
            if (isDemoUser) {
                // Simular retardo
                await new Promise(resolve => setTimeout(resolve, 800));

                // Mock data
                const mockRequests = [
                    {
                        id: 'req-1',
                        worker: { fullName: 'Juan Pérez', id: 'worker-1' },
                        caseType: 'despido',
                        urgency: 'high',
                        caseSummary: 'Me despidieron injustificadamente después de 5 años. No me dieron finiquito.',
                        createdAt: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
                        status: 'pending'
                    },
                    {
                        id: 'req-2',
                        worker: { fullName: 'María González', id: 'worker-2' },
                        caseType: 'acoso',
                        urgency: 'normal',
                        caseSummary: 'Sufro acoso laboral por parte de mi supervisor directo.',
                        createdAt: new Date(Date.now() - 86400000).toISOString(), // Hace 1 día
                        status: 'pending'
                    },
                    {
                        id: 'req-3',
                        worker: { fullName: 'Pedro López', id: 'worker-3' },
                        caseType: 'otro',
                        urgency: 'low',
                        caseSummary: 'Duda sobre mis vacaciones. Cumplo un año la próxima semana y quiero saber cuántos días me tocan.',
                        createdAt: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
                        status: 'accepted'
                    },
                    {
                        id: 'req-4',
                        worker: { fullName: 'Ana Martínez', id: 'worker-4' },
                        caseType: 'accidente',
                        urgency: 'high',
                        caseSummary: 'Tuve un accidente en la oficina y no me quieren pagar incapacidad.',
                        createdAt: new Date(Date.now() - 259200000).toISOString(), // Hace 3 días
                        status: 'rejected'
                    }
                ];

                setRequests(mockRequests.filter(r => r.status === status));
                setLoading(false);
                setRefreshing(false);
                return;
            }
            // -----------------------

            const token = await getAccessToken();

            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch(`${endpoints.contact.lawyerRequests}?status = ${status} `, {
                headers: { 'Authorization': `Bearer ${token} ` }
            });

            const data = await response.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests(activeTab);
    };

    useEffect(() => {
        if (!loading && requests.length > 0 && user) {
            // Track impressions of locked content
            const lockedCount = requests.filter(r => {
                const isHot = r.isHot || r.classification === 'hot';
                const isPro = user.plan === 'pro' || user.role === 'admin';
                return isHot && !isPro;
            }).length;

            if (lockedCount > 0) {
                AnalyticsService.logEvent('lead_locked_view', {
                    locked_count: lockedCount,
                    lawyer_id: user.id
                });
            }
        }
    }, [loading, requests, user]);

    const renderRequest = ({ item }: { item: any }) => {
        // ... (existing helper configs) ...
        const urgencyConfig = {
            low: { color: '#95a5a6', label: 'Baja' },
            normal: { color: '#3498db', label: 'Normal' },
            high: { color: '#e74c3c', label: 'Alta' }
        };

        const urgency = urgencyConfig[item.urgency as keyof typeof urgencyConfig] || urgencyConfig.normal;

        // --- BUINESS LOGIC: HOT CASE RESTRICTION ---
        const isHotCase = item.isHot || item.classification === 'hot';
        const canAccess = !isHotCase || (user?.plan === 'pro' || user?.role === 'admin');

        const handlePress = () => {
            if (canAccess) {
                navigation.navigate('LawyerRequestDetail' as never, { requestId: item.id } as never);
            } else {
                // TRACK UNLOCK ATTEMPT
                AnalyticsService.logEvent('lead_unlock_tap', {
                    request_id: item.id,
                    lawyer_id: user?.id,
                    case_type: item.caseType
                });

                Alert.alert(
                    'Caso PRO (Hot Lead)',
                    'Este caso es de alta prioridad y alto valor. Actualiza a Plan PRO para aceptarlo.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Ver Planes',
                            onPress: () => {
                                // Maybe add another event here: 'upgrade_flow_start'
                                Alert.alert('Coming Soon', 'Upgrade flow');
                            }
                        }
                    ]
                );
            }
        };

        return (
            <TouchableOpacity
                style={[styles.requestCard, !canAccess && styles.gatedCard]}
                onPress={handlePress}
            >
                {/* Worker name */}
                <View style={styles.workerInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color="#667eea" />
                    </View>
                    <View style={styles.workerDetails}>
                        <Text style={styles.workerName}>{item.worker?.fullName || 'Trabajador'}</Text>
                        <Text style={styles.caseType}>
                            {item.caseType?.charAt(0).toUpperCase() + item.caseType?.slice(1)}
                        </Text>
                    </View>
                    {item.status === 'accepted' && (
                        <View style={styles.acceptedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                        </View>
                    )}
                </View>

                {/* Hot Case Badge or Urgency */}
                <View style={{ flexDirection: 'row' }}>
                    <View style={[styles.urgencyBadge, { backgroundColor: `${urgency.color} 20`, marginRight: 8 }]}>
                        <Ionicons name="flash" size={14} color={urgency.color} />
                        <Text style={[styles.urgencyText, { color: urgency.color }]}>
                            Urgencia {urgency.label}
                        </Text>
                    </View>
                    {isHotCase && (
                        <View style={[styles.urgencyBadge, { backgroundColor: `#f39c1220` }]}>
                            <Ionicons name="flame" size={14} color="#f39c12" />
                            <Text style={[styles.urgencyText, { color: "#f39c12" }]}>
                                HOT LEAD
                            </Text>
                        </View>
                    )}
                </View>

                {/* Case summary preview */}
                {(() => {
                    let summaryText = item.caseSummary;
                    let isAI = false;
                    let aiData = null;

                    if (canAccess && item.aiSummary) {
                        try {
                            aiData = JSON.parse(item.aiSummary);
                            if (aiData && aiData.resumen_breve) {
                                summaryText = aiData.resumen_breve;
                                isAI = true;
                            }
                        } catch (e) {
                            // Fallback to raw text if not JSON
                            summaryText = item.aiSummary;
                            isAI = true;
                        }
                    } else if (!canAccess) {
                        summaryText = 'Este resumen está oculto porque es un caso HOT. Actualiza a PRO para ver detalles.';
                    }

                    return (
                        <View>
                            {/* AI BADGE */}
                            {isAI && (
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                    <View style={{ backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="sparkles" size={12} color="#2196f3" />
                                        <Text style={{ fontSize: 10, color: '#2196f3', fontWeight: 'bold', marginLeft: 4 }}>ANÁLISIS IA</Text>
                                    </View>
                                    {aiData?.urgencia && (
                                        <Text style={{ fontSize: 10, color: '#7f8c8d', marginLeft: 8, marginTop: 2 }}>
                                            • Urgencia: {aiData.urgencia}
                                        </Text>
                                    )}
                                </View>
                            )}
                            <Text style={styles.summary} numberOfLines={2}>
                                {summaryText}
                            </Text>
                        </View>
                    );
                })()}

                {!canAccess && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={30} color="#f39c12" />
                        <Text style={{ color: '#f39c12', fontWeight: 'bold', marginTop: 4 }}>SOLO PRO</Text>
                    </View>
                )}

                {/* Time */}
                <Text style={styles.time}>
                    {getTimeAgo(new Date(item.createdAt))}
                </Text>

                {/* Action buttons */}
                {canAccess && item.status === 'pending' && (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.viewButton} onPress={handlePress}>
                            <Text style={styles.viewButtonText}>Ver detalles</Text>
                            <Ionicons name="arrow-forward" size={16} color="#667eea" />
                        </TouchableOpacity>
                    </View>
                )}

                {canAccess && item.status === 'accepted' && (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.contactButton}>
                            <Ionicons name="call" size={16} color="#fff" />
                            <Text style={styles.contactButtonText}>Ver contacto</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `Hace ${diffMins} minutos`;
        if (diffHours < 24) return `Hace ${diffHours} horas`;
        return `Hace ${diffDays} días`;
    };

    const getPendingCount = () => {
        return requests.filter(r => r.status === 'pending').length;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Solicitudes Recibidas</Text>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                        Pendientes
                    </Text>
                    {activeTab === 'pending' && requests.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{requests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'accepted' && styles.tabActive]}
                    onPress={() => setActiveTab('accepted')}
                >
                    <Text style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}>
                        Aceptadas
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'rejected' && styles.tabActive]}
                    onPress={() => setActiveTab('rejected')}
                >
                    <Text style={[styles.tabText, activeTab === 'rejected' && styles.tabTextActive]}>
                        Rechazadas
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="mail-open-outline" size={80} color="#bdc3c7" />
                    <Text style={styles.emptyTitle}>No hay solicitudes</Text>
                    <Text style={styles.emptySubtitle}>
                        {activeTab === 'pending'
                            ? 'No tienes solicitudes pendientes'
                            : activeTab === 'accepted'
                                ? 'Aún no has aceptado ninguna solicitud'
                                : 'No has rechazado ninguna solicitud'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequest}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backButton: { marginBottom: 15 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    tabActive: { borderBottomColor: '#667eea' },
    tabText: { fontSize: 14, color: '#7f8c8d', fontWeight: '600' },
    tabTextActive: { color: '#667eea' },
    tabBadge: {
        backgroundColor: '#e74c3c',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    tabBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginTop: 20 },
    emptySubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
        marginTop: 10,
    },
    listContent: { padding: 20 },
    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    workerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8eaf6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    workerDetails: { marginLeft: 12, flex: 1 },
    workerName: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
    caseType: { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
    acceptedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#d4edda',
        justifyContent: 'center',
        alignItems: 'center',
    },
    urgencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 10,
    },
    urgencyText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
    summary: { fontSize: 14, color: '#34495e', lineHeight: 20, marginBottom: 10 },
    time: { fontSize: 12, color: '#95a5a6' },
    actions: { marginTop: 12 },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#667eea',
        borderRadius: 8,
    },
    viewButtonText: { color: '#667eea', fontSize: 14, fontWeight: '600', marginRight: 6 },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#27ae60',
        borderRadius: 8,
    },
    contactButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
    gatedCard: {
        opacity: 0.9,
        backgroundColor: '#f9f9f9',
        borderColor: '#f39c12',
        borderWidth: 1,
    },
    lockOverlay: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#fffcf5',
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 10,
    }
});

export default LawyerRequestsScreen;
