import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminFinanceScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, logsRes] = await Promise.all([
                axios.get(`${API_URL}/admin/financials/stats`, { headers }),
                axios.get(`${API_URL}/admin/financials/logs`, { headers })
            ]);

            setStats(statsRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            console.error('Error fetching financials:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderLogItem = ({ item }: { item: any }) => (
        <View style={styles.logRow}>
            <View style={styles.logIcon}>
                <Ionicons
                    name={item.type === 'Subscription' ? 'card-outline' : 'people-outline'}
                    size={20}
                    color="#666"
                />
            </View>
            <View style={styles.logDetails}>
                <Text style={styles.logType}>{item.type}</Text>
                <Text style={styles.logUser} numberOfLines={1}>{item.user}</Text>
                <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}</Text>
            </View>
            <View style={styles.logAmountContainer}>
                <Text style={styles.logAmount}>${item.amount}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'success' ? '#e8f5e9' : '#ffebee' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'success' ? '#2e7d32' : '#c62828' }]}>
                        {item.status === 'success' ? 'Exitoso' : 'Fallido'}
                    </Text>
                </View>
            </View>
        </View>
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
            <View style={styles.header}>
                <Text style={styles.title}>Finanzas</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Revenue Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Ingresos Totales (Est.)</Text>
                        <Text style={styles.totalValue}>${stats?.totalRevenue || 0} MXN</Text>
                    </View>

                    <View style={styles.breakdownContainer}>
                        <View style={styles.breakdownItem}>
                            <Text style={styles.breakdownLabel}>Suscripciones</Text>
                            <Text style={styles.breakdownValue}>${stats?.breakdown?.subscriptions || 0}</Text>
                        </View>
                        <View style={styles.breakdownItem}>
                            <Text style={styles.breakdownLabel}>Contactos</Text>
                            <Text style={styles.breakdownValue}>${stats?.breakdown?.contacts || 0}</Text>
                        </View>
                    </View>
                </View>

                {/* Transaction Log */}
                <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
                <View style={styles.logsContainer}>
                    {logs.map(item => (
                        <View key={item.id} style={styles.logWrapper}>
                            {renderLogItem({ item })}
                        </View>
                    ))}
                    {logs.length === 0 && (
                        <Text style={styles.emptyText}>No hay transacciones registradas.</Text>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    summaryContainer: {
        marginBottom: 25,
    },
    totalCard: {
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: AppTheme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    totalLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 5,
    },
    totalValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    breakdownContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    breakdownLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    breakdownValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    logsContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    logIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logDetails: {
        flex: 1,
    },
    logType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    logUser: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    logDate: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    logAmountContainer: {
        alignItems: 'flex-end',
    },
    logAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyText: {
        padding: 20,
        textAlign: 'center',
        color: '#999',
    },
});

export default AdminFinanceScreen;

