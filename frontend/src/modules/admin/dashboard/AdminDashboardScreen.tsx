import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../../../context/AuthContext';

const AdminDashboardScreen = ({ navigation }: any) => {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [dashboardRes, analyticsRes] = await Promise.all([
                axios.get(`${API_URL}/admin/dashboard`, { headers }).catch(e => ({ data: null })),
                axios.get(`${API_URL}/analytics/metrics`, { headers }).catch(e => ({ data: null }))
            ]);

            if (dashboardRes?.data) setStats(dashboardRes.data);
            if (analyticsRes?.data) setAnalytics(analyticsRes.data);

        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const handleLogout = async () => {
        await logout();
        // Navigation should be handled by AppNavigator automatically when user becomes null
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppTheme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <LinearGradient
                colors={[AppTheme.colors.primary, '#2c3e50']}
                style={styles.header}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={styles.headerTitle}>Panel Ejecutivo</Text>
                        <Text style={styles.headerSubtitle}>Resumen General</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={{ padding: 10 }}>
                        <Ionicons name="log-out-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* KPI Cards */}
                <View style={styles.kpiContainer}>
                    <View style={styles.kpiCard}>
                        <View style={[styles.iconBg, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="cash-outline" size={24} color="#2e7d32" />
                        </View>
                        <Text style={styles.kpiLabel}>Ingresos (Mes)</Text>
                        <Text style={styles.kpiValue}>${stats?.kpis?.totalIncome || 0}</Text>
                        <Text style={styles.kpiSubtext}>
                            Subs: ${stats?.kpis?.incomeBreakdown?.subscriptions || 0} | Contactos: ${stats?.kpis?.incomeBreakdown?.contacts || 0}
                        </Text>
                    </View>

                    <View style={styles.kpiCard}>
                        <View style={[styles.iconBg, { backgroundColor: '#e3f2fd' }]}>
                            <Ionicons name="people-outline" size={24} color="#1565c0" />
                        </View>
                        <Text style={styles.kpiLabel}>Usuarios Activos</Text>
                        <Text style={styles.kpiValue}>
                            {(stats?.kpis?.activeUsers?.lawyers || 0) + (stats?.kpis?.activeUsers?.workers || 0)}
                        </Text>
                        <Text style={styles.kpiSubtext}>
                            Abogados: {stats?.kpis?.activeUsers?.lawyers || 0} | Trab: {stats?.kpis?.activeUsers?.workers || 0}
                        </Text>
                    </View>
                </View>

                <View style={styles.kpiContainer}>
                    <View style={styles.kpiCard}>
                        <View style={[styles.iconBg, { backgroundColor: '#fff3e0' }]}>
                            <Ionicons name="briefcase-outline" size={24} color="#ef6c00" />
                        </View>
                        <Text style={styles.kpiLabel}>Contactos Vendidos</Text>
                        <Text style={styles.kpiValue}>{stats?.kpis?.contactsSold || 0}</Text>
                    </View>

                    <View style={styles.kpiCard}>
                        <View style={[styles.iconBg, { backgroundColor: '#f3e5f5' }]}>
                            <Ionicons name="trending-up-outline" size={24} color="#7b1fa2" />
                        </View>
                        <Text style={styles.kpiLabel}>Tasa Conversión</Text>
                        <Text style={styles.kpiValue}>{stats?.kpis?.conversionRate || 0}%</Text>
                    </View>
                </View>

                {/* LIVE ANALYTICS (THE EYES) */}
                {analytics && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Monitor de Negocio (En Vivo)</Text>
                        <View style={styles.analyticsGrid}>
                            {/* Conversion Card */}
                            <View style={[styles.analyticsCard, { borderLeftColor: '#7b1fa2' }]}>
                                <Text style={styles.analyticsLabel}>Tasa de Conversión</Text>
                                <Text style={styles.analyticsValue}>{analytics.monetization?.conversionRate || '0%'}</Text>
                                <Text style={styles.analyticsSub}>
                                    {analytics.monetization?.unlockAttempts} pagos / {analytics.monetization?.lockedViews} vistas
                                </Text>
                            </View>

                            {/* Viral Card */}
                            <View style={[styles.analyticsCard, { borderLeftColor: '#e91e63' }]}>
                                <Text style={styles.analyticsLabel}>Alcance Viral</Text>
                                <Text style={styles.analyticsValue}>{analytics.growth?.salaryThermometerUses || 0}</Text>
                                <Text style={styles.analyticsSub}>Usos del Termómetro</Text>
                            </View>

                            {/* Vault Card */}
                            <View style={[styles.analyticsCard, { borderLeftColor: '#2e7d32' }]}>
                                <Text style={styles.analyticsLabel}>Retención (Bóveda)</Text>
                                <Text style={styles.analyticsValue}>{analytics.growth?.vaultUploads || 0}</Text>
                                <Text style={styles.analyticsSub}>Archivos subidos</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Action Items */}
                <TouchableOpacity
                    style={styles.promoButton}
                    onPress={() => navigation.navigate('Promociones')}
                >
                    <LinearGradient
                        colors={[AppTheme.colors.secondary, '#e91e63']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.promoGradient}
                    >
                        <Ionicons name="pricetags" size={24} color="#fff" />
                        <Text style={styles.promoText}>Gestionar Promociones & Ofertas</Text>
                        <Ionicons name="arrow-forward" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Atención Requerida</Text>

                {stats?.actionItems?.pendingLawyers > 0 && (
                    <TouchableOpacity
                        style={[styles.alertCard, { borderLeftColor: '#ff9800' }]}
                        onPress={() => navigation.navigate('Usuarios')}
                    >
                        <Ionicons name="alert-circle" size={24} color="#ff9800" />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>{stats.actionItems.pendingLawyers} Abogados por Verificar</Text>
                            <Text style={styles.alertDesc}>Revisar licencias y aprobar cuentas.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}

                {stats?.actionItems?.suspiciousActivity > 0 && (
                    <TouchableOpacity
                        style={[styles.alertCard, { borderLeftColor: '#f44336' }]}
                        onPress={() => navigation.navigate('Seguridad')}
                    >
                        <Ionicons name="warning" size={24} color="#f44336" />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>{stats.actionItems.suspiciousActivity} Alertas de Seguridad</Text>
                            <Text style={styles.alertDesc}>Actividad sospechosa detectada.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}

                {stats?.actionItems?.recentPayments > 0 && (
                    <TouchableOpacity
                        style={[styles.alertCard, { borderLeftColor: '#4caf50' }]}
                        onPress={() => navigation.navigate('Finanzas')}
                    >
                        <Ionicons name="cash" size={24} color="#4caf50" />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>¡{stats.actionItems.recentPayments} Nuevos Pagos!</Text>
                            <Text style={styles.alertDesc}>Recibidos en las últimas 24 horas.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}

                {stats?.actionItems?.pendingLawyers === 0 && stats?.actionItems?.suspiciousActivity === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#4caf50" />
                        <Text style={styles.emptyStateText}>¡Todo en orden! No hay tareas pendientes.</Text>
                    </View>
                )}

                {/* Trends Section - Empty State Handling */}
                <Text style={styles.sectionTitle}>Tendencias de Actividad (6 Meses)</Text>

                {stats?.trends ? (
                    <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Crecimiento de Ingresos</Text>
                        <View style={styles.chartRow}>
                            {stats.trends.income.map((val: number, index: number) => {
                                // Find max for scaling
                                const max = Math.max(...stats.trends.income, 1);
                                const heightPercentage = (val / max) * 100;
                                return (
                                    <View key={`inc-${index}`} style={styles.barWrapper}>
                                        <View style={[styles.bar, { height: `${heightPercentage}%`, backgroundColor: '#4caf50' }]} />
                                        <Text style={styles.barLabel}>{index + 1}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        <Text style={[styles.chartTitle, { marginTop: 20 }]}>Nuevos Usuarios</Text>
                        <View style={styles.chartRow}>
                            {stats.trends.users.map((val: number, index: number) => {
                                const max = Math.max(...stats.trends.users, 1);
                                const heightPercentage = (val / max) * 100;
                                return (
                                    <View key={`usr-${index}`} style={styles.barWrapper}>
                                        <View style={[styles.bar, { height: `${heightPercentage}%`, backgroundColor: '#2196f3' }]} />
                                        <Text style={styles.barLabel}>{index + 1}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : (
                    <View style={styles.chartContainer}>
                        <View style={styles.chartContent}>
                            <Ionicons name="bar-chart-outline" size={60} color="#e0e0e0" />
                            <Text style={styles.chartTitle}>Cargando tendencias...</Text>
                        </View>
                    </View>
                )}

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    content: {
        padding: 20,
    },
    kpiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    kpiCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    kpiLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    kpiSubtext: {
        fontSize: 10,
        color: '#999',
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 15,
    },
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    alertContent: {
        flex: 1,
        marginLeft: 15,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    alertDesc: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginTop: 10,
    },
    emptyStateText: {
        marginTop: 10,
        color: '#666',
        textAlign: 'center',
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    chartContent: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    mockChartLines: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 60,
        gap: 10,
        opacity: 0.3,
    },
    mockBar: {
        width: 8,
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 4,
    },
    promoButton: {
        marginBottom: 20,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#e91e63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    promoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    promoText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginLeft: 15,
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 100,
        width: '100%',
        marginTop: 10,
        paddingHorizontal: 10
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end'
    },
    bar: {
        width: 12,
        borderRadius: 6,
        marginBottom: 5
    },
    barLabel: {
        fontSize: 10,
        color: '#999'
    },
    // ANALYTICS STYLES
    sectionContainer: {
        marginBottom: 20,
    },
    analyticsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    analyticsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        width: '31%', // 3 cards in row
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    analyticsLabel: {
        fontSize: 11,
        color: '#7f8c8d',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    analyticsValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    analyticsSub: {
        fontSize: 9,
        color: '#95a5a6',
        marginTop: 4,
    }
});

export default AdminDashboardScreen;

