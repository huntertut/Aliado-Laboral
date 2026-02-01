import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminSecurityScreen = () => {
    const [activeTab, setActiveTab] = useState<'alerts' | 'logs'>('alerts');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'alerts') {
                const response = await axios.get(`${API_URL}/admin/security/alerts`, { headers });
                setAlerts(response.data);
            } else {
                const response = await axios.get(`${API_URL}/admin/security/logs`, { headers });
                setLogs(response.data);
            }
        } catch (error) {
            console.error('Error fetching security data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            await axios.put(
                `${API_URL}/admin/security/alerts/${alertId}/resolve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isResolved: true } : a));
            Alert.alert('Éxito', 'Alerta marcada como resuelta');
        } catch (error) {
            Alert.alert('Error', 'No se pudo resolver la alerta');
        }
    };

    const renderAlertItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { borderLeftColor: item.severity === 'high' ? '#f44336' : '#ff9800', borderLeftWidth: 4 }]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.alertType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.alertMessage}>{item.message}</Text>
                </View>
                {item.isResolved ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                ) : (
                    <TouchableOpacity onPress={() => handleResolveAlert(item.id)}>
                        <Ionicons name="radio-button-off" size={24} color="#999" />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={[styles.statusText, { color: item.isResolved ? '#4caf50' : '#f44336' }]}>
                    {item.isResolved ? 'RESUELTO' : 'PENDIENTE'}
                </Text>
            </View>
        </View>
    );

    const renderLogItem = ({ item }: { item: any }) => (
        <View style={styles.logRow}>
            <Text style={styles.logAction}>{item.action}</Text>
            <Text style={styles.logUser}>{item.user?.email || 'Sistema'}</Text>
            <Text style={styles.logDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Centro de Seguridad</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
                    onPress={() => setActiveTab('alerts')}
                >
                    <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>Alertas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
                    onPress={() => setActiveTab('logs')}
                >
                    <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>Bitácora (Logs)</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'alerts' ? alerts : logs}
                    renderItem={activeTab === 'alerts' ? renderAlertItem : renderLogItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No hay registros</Text>
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
    tabs: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: AppTheme.colors.primary,
    },
    tabText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '600',
    },
    activeTabText: {
        color: AppTheme.colors.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    alertType: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    alertMessage: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    logRow: {
        backgroundColor: '#fff',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    logAction: {
        fontSize: 14,
        fontWeight: 'bold',
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
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
});

export default AdminSecurityScreen;

