import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../config/constants';
import { useAuth } from '../../../context/AuthContext';

const LawyerDashboardScreen = () => {
    const navigation = useNavigation();
    const { getAccessToken, logout, user } = useAuth(); // Get auth token helper
    const [metrics, setMetrics] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [promoConfig, setPromoConfig] = useState<any>(null); // NEW

    // Track mounting to prevent state updates/alerts on unmounted component
    const [isMounted, setIsMounted] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        fetchDashboardData();
        fetchSystemConfig(); // NEW
        return () => { setIsMounted(false); };
    }, []);

    const fetchSystemConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/system/public`);
            if (res.ok) {
                const data = await res.json();
                if (isMounted) setPromoConfig(data);
            }
        } catch (e) {
            console.warn('Failed to fetch system config', e);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const token = await getAccessToken();

            // --- DEMO MODE CHECK ---
            // Si estamos en modo demo (usuario local), usamos datos falsos
            const userDataStr = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('userData'));
            const userData = userDataStr ? JSON.parse(userDataStr) : null;

            if (userData?.id?.startsWith('demo-')) {
                // Simular retardo de red
                await new Promise(resolve => setTimeout(resolve, 1000));

                setMetrics({
                    pendingRequests: 2,
                    acceptedRequests: 5,
                    profileViews: 128,
                    successRate: 95
                });

                setSubscription({
                    hasSubscription: true,
                    subscription: {
                        status: 'active',
                        daysRemaining: 45,
                        isExpired: false
                    }
                });
                setLoading(false);
                return;
            }
            // -----------------------

            // Obtener métricas
            const metricsRes = await fetch(`${API_URL}/lawyer-profile/my-metrics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!metricsRes.ok) {
                if (metricsRes.status === 401 || metricsRes.status === 403) {
                    // Token expired. Let AuthContext interceptor or useEffect handle it.
                    // Avoiding Alert here prevents "Alert not attached to Activity" crash during logout.
                    console.log('LawyerDashboard: 401/403 detected. Silent return.');
                    return;
                }
                throw new Error(`Error ${metricsRes.status}: ${metricsRes.statusText}`);
            }

            const metricsData = await metricsRes.json();

            const rawMetrics = metricsData.metrics;
            const userEmail = user?.email?.toLowerCase();
            const isProTestAccount = userEmail === 'lawyer_pro@test.com';

            if (isProTestAccount && rawMetrics.pendingRequests === 0 && rawMetrics.acceptedRequests === 0) {
                // Rich illustrative data ONLY for the PRO test account to showcase potential
                setMetrics({
                    ...rawMetrics,
                    isExample: true,
                    pendingRequests: 3,
                    acceptedRequests: 8,
                    profileViews: 142,
                    successRate: 98
                });
            } else {
                // Natural behavior for everyone else (including lawyer_basic@test.com and new users)
                setMetrics(rawMetrics);
            }

            // Obtener estado de suscripción
            const subRes = await fetch(`${API_URL}/subscription/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!subRes.ok) {
                console.warn(`[LawyerDashboard] Subscription check failed: ${subRes.status}`);
                // Don't crash, just set default empty subscription
                setSubscription({ hasSubscription: false, subscription: { status: 'inactive' } });
                return;
            }

            const subData = await subRes.json();
            console.log('📊 [LawyerDashboard] Subscription Data Received:', JSON.stringify(subData, null, 2));
            setSubscription(subData);
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            // Only show alert if we are still logged in and it's not a cancellation
            const token = await getAccessToken();
            if (token) {
                // Suppress alert to prevent "Not attached to Activity" crash during logout races
                console.warn('Suppressing dashboard error alert to avoid crash');
            }
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    const getSubscriptionStatus = () => {
        // FALLBACK: If hasSubscription is false but nested subscription says 'active' and not expired
        const isSubActive = subscription?.hasSubscription || (
            subscription?.subscription?.status?.toLowerCase() === 'active' &&
            !subscription?.subscription?.isExpired
        );

        if (!isSubActive) {
            return {
                label: 'Inactiva',
                color: '#e74c3c',
                icon: 'close-circle',
                message: 'Necesitas una suscripción para recibir solicitudes',
            };
        }

        if (subscription.subscription.isExpired) {
            return {
                label: 'Expirada',
                color: '#e74c3c',
                icon: 'alert-circle',
                message: 'Tu suscripción ha expirado. Renuévala para continuar.',
            };
        }

        if (subscription.subscription.daysRemaining <= 7) {
            return {
                label: 'Próxima a vencer',
                color: '#f39c12',
                icon: 'warning',
                message: `Vence en ${subscription.subscription.daysRemaining} días`,
            };
        }

        return {
            label: 'Activa',
            color: '#27ae60',
            icon: 'checkmark-circle',
            message: `Vence en ${subscription.subscription.daysRemaining} días`,
        };
    };

    const subStatus = getSubscriptionStatus();

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            >
                {/* Header */}
                <LinearGradient
                    colors={subscription?.plan === 'pro' ? ['#FFD200', '#F7971E'] : ['#667eea', '#764ba2']}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.headerTitleRow}>
                                <Text style={styles.greeting} numberOfLines={1}>Panel de Abogado</Text>
                                <View style={styles.badgeRow}>
                                    {subscription?.hasSubscription && (
                                        <View style={[styles.activePlanBadge, { backgroundColor: subscription.plan === 'pro' ? '#F7971E' : '#2ecc71' }]}>
                                            <Text style={styles.activePlanText}>ACTIVO</Text>
                                        </View>
                                    )}
                                    {subscription?.plan === 'pro' && (
                                        <View style={styles.proBadge}>
                                            <Text style={styles.proText}>PRO</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <Text style={styles.subGreeting}>Gestiona tus solicitudes y casos activos</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[styles.profileButton, { marginRight: 15 }]}
                                onPress={() => navigation.navigate('NewsFeed' as never)}
                            >
                                <Ionicons name="newspaper-outline" size={32} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.profileButton}
                                onPress={() => {
                                    // Direct logout to prevent "Alert not attached to Activity" crash
                                    logout();
                                }}
                            >
                                <Ionicons name="log-out-outline" size={32} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Subscription status card */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.subCard, { borderLeftColor: subStatus.color, borderLeftWidth: 4 }]}
                        onPress={() => navigation.navigate('SubscriptionManagement' as never)}
                    >
                        <View style={styles.subCardContent}>
                            <View style={[styles.subIconContainer, { backgroundColor: `${subStatus.color}20` }]}>
                                <Ionicons name={subStatus.icon as any} size={28} color={subStatus.color} />
                            </View>
                            <View style={styles.subInfo}>
                                <Text style={styles.subLabel}>Suscripción</Text>
                                <Text style={[styles.subStatus, { color: subStatus.color }]}>
                                    {subStatus.label}
                                </Text>
                                <Text style={styles.subMessage}>{subStatus.message}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* PROMO BANNER (Dynamic) */}
                {promoConfig?.promoActive && !subscription?.hasSubscription && (
                    <View style={styles.section}>
                        <LinearGradient
                            colors={['#FF9800', '#F44336']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.promoBanner}
                        >
                            <Ionicons name="gift-outline" size={32} color="#fff" />
                            <View style={styles.promoContent}>
                                <Text style={styles.promoTitle}>¡OFERTA ESPECIAL!</Text>
                                <Text style={styles.promoText}>{promoConfig.bannerText}</Text>
                                <Text style={styles.promoSubText}>{promoConfig.trialDays} días GRATIS si te suscribes hoy.</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.promoButton}
                                onPress={() => navigation.navigate('SubscriptionManagement' as never)}
                            >
                                <Text style={styles.promoButtonText}>Reclamar</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}

                {/* Metrics grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Estadísticas</Text>
                    <View style={styles.metricsGrid}>
                        <View style={[styles.metricCard, { backgroundColor: '#fff3cd' }]}>
                            <Ionicons name="hourglass-outline" size={32} color="#f39c12" />
                            <Text style={styles.metricNumber}>{metrics?.pendingRequests || 0}</Text>
                            <Text style={styles.metricLabel}>Pendientes</Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: '#d4edda' }]}>
                            <Ionicons name="checkmark-done" size={32} color="#27ae60" />
                            <Text style={styles.metricNumber}>{metrics?.acceptedRequests || 0}</Text>
                            <Text style={styles.metricLabel}>Aceptadas</Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: '#d1ecf1' }]}>
                            <Ionicons name="eye-outline" size={32} color="#17a2b8" />
                            <Text style={styles.metricNumber}>{metrics?.profileViews || 0}</Text>
                            <Text style={styles.metricLabel}>Vistas</Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: '#e2e3e5' }]}>
                            <Ionicons name="trending-up" size={32} color="#6c757d" />
                            <Text style={styles.metricNumber}>
                                {metrics?.successRate ? `${metrics.successRate.toFixed(0)}%` : '0%'}
                            </Text>
                            <Text style={styles.metricLabel}>Éxito</Text>
                        </View>
                    </View>
                    {metrics?.isExample && (
                        <View style={styles.exampleInfoRow}>
                            <Ionicons name="information-circle-outline" size={14} color="#95a5a6" />
                            <Text style={styles.exampleInfoText}>Mostrando datos ilustrativos (cuenta nueva)</Text>
                        </View>
                    )}
                </View>

                {/* Quick actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Accesos Rápidos</Text>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('LawyerRequests' as never)}
                    >
                        <LinearGradient
                            colors={['#f39c12', '#e67e22']}
                            style={styles.actionGradient}
                        >
                            <View style={styles.actionContent}>
                                <Ionicons name="mail-outline" size={24} color="#fff" />
                                <View style={styles.actionText}>
                                    <Text style={styles.actionTitle}>Solicitudes Pendientes</Text>
                                    <Text style={styles.actionSubtitle}>
                                        {metrics?.pendingRequests || 0} nuevas solicitudes de clientes
                                    </Text>
                                </View>
                                {metrics?.pendingRequests > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{metrics.pendingRequests}</Text>
                                    </View>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('LawyerCases' as never)}
                    >
                        <View style={styles.actionPlain}>
                            <View style={styles.actionContent}>
                                <Ionicons name="briefcase-outline" size={24} color="#667eea" />
                                <View style={styles.actionText}>
                                    <Text style={[styles.actionTitle, { color: '#2c3e50' }]}>
                                        Casos Aceptados
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: '#7f8c8d' }]}>
                                        Ver mis casos y chats activos
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
                        </View>
                    </TouchableOpacity>



                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('NewsFeed' as never)}
                    >
                        <View style={styles.actionPlain}>
                            <View style={styles.actionContent}>
                                <Ionicons name="newspaper-outline" size={24} color="#667eea" />
                                <View style={styles.actionText}>
                                    <Text style={[styles.actionTitle, { color: '#2c3e50' }]}>
                                        Noticias Legales (IA)
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: '#7f8c8d' }]}>
                                        Actualidad laboral para abogados
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Profile' as never)}
                    >
                        <View style={styles.actionPlain}>
                            <View style={styles.actionContent}>
                                <Ionicons name="person-outline" size={24} color="#667eea" />
                                <View style={styles.actionText}>
                                    <Text style={[styles.actionTitle, { color: '#2c3e50' }]}>
                                        Mi Perfil y Cuenta
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: '#7f8c8d' }]}>
                                        Gestionar mis datos y perfil profesional
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10, // Add some top margin for status bar spacing
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subGreeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
    },
    profileButton: {},
    section: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    subCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    subCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subInfo: {
        flex: 1,
        marginLeft: 15,
    },
    subLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '600',
    },
    subStatus: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
    subMessage: {
        fontSize: 13,
        color: '#95a5a6',
        marginTop: 2,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    metricCard: {
        width: '48%',
        margin: '1%',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    metricNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 10,
    },
    metricLabel: {
        fontSize: 13,
        color: '#7f8c8d',
        marginTop: 5,
        fontWeight: '600',
    },
    actionCard: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    actionPlain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
    },
    actionContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 15,
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    actionSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    proBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 10,
    },
    proText: {
        color: '#F7971E',
        fontSize: 12,
        fontWeight: 'bold',
    },
    activePlanBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: '#fff',
    },
    activePlanText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    exampleInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    exampleInfoText: {
        fontSize: 11,
        color: '#95a5a6',
        fontStyle: 'italic',
        marginLeft: 5,
    },
    promoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        elevation: 4,
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    promoContent: {
        flex: 1,
        marginLeft: 15,
    },
    promoTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    promoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    promoSubText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontStyle: 'italic',
    },
    promoButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    promoButtonText: {
        color: '#F44336',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default LawyerDashboardScreen;
