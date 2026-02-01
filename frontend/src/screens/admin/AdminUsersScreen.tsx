import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminUsersScreen = () => {
    const [activeTab, setActiveTab] = useState<'lawyers' | 'workers' | 'pymes'>('lawyers');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [lawyers, setLawyers] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [pymes, setPymes] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'lawyers') {
                const response = await axios.get(`${API_URL}/admin/lawyers`, { headers });
                setLawyers(response.data);
            } else if (activeTab === 'workers') {
                const response = await axios.get(`${API_URL}/admin/workers`, { headers });
                setWorkers(response.data);
            } else {
                try {
                    const response = await axios.get(`${API_URL}/admin/pymes`, { headers });
                    if (Array.isArray(response.data)) {
                        setPymes(response.data);
                    } else {
                        setPymes([]); // Fallback to empty array
                    }
                } catch (pymeErr) {
                    console.log('Error fetching pymes (minor):', pymeErr);
                    setPymes([]); // Don't alert, just show empty
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            if (activeTab !== 'pymes') {
                Alert.alert('Error', 'No se pudieron cargar los usuarios');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
        setSearchQuery(''); // Reset search on tab change
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleVerifyLawyer = async (lawyerId: string, currentStatus: boolean, name: string) => {
        Alert.alert(
            currentStatus ? 'Suspender Verificación' : 'Verificar Abogado',
            `¿Estás seguro de ${currentStatus ? 'revocar' : 'aprobar'} la verificación de ${name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            await axios.put(
                                `${API_URL}/admin/lawyers/${lawyerId}/verify`,
                                { isVerified: !currentStatus },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            setLawyers(prev => prev.map(l =>
                                l.id === lawyerId ? { ...l, isVerified: !currentStatus } : l
                            ));
                            Alert.alert('Éxito', `Abogado ${!currentStatus ? 'verificado' : 'suspendido'} correctamente.`);
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo actualizar el estado.');
                        }
                    }
                }
            ]
        );
    };

    const getFilteredData = () => {
        const query = searchQuery.toLowerCase();
        let data: any[] = [];
        if (activeTab === 'lawyers') data = lawyers;
        else if (activeTab === 'workers') data = workers;
        else data = pymes;

        if (!query) return data;

        return data.filter(item =>
            (item.fullName && item.fullName.toLowerCase().includes(query)) ||
            (item.email && item.email.toLowerCase().includes(query)) ||
            (item.companyName && item.companyName.toLowerCase().includes(query))
        );
    };

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#ccc" />
                </TouchableOpacity>
            )}
        </View>
    );

    const handleUpdatePlan = async (userId: string, role: string, currentPlan: string, name: string) => {
        const isPro = currentPlan === 'premium' || currentPlan === 'pro';
        const targetPlan = isPro ? (role === 'worker' ? 'free' : 'basic') : (role === 'worker' ? 'premium' : 'pro');

        Alert.alert(
            'Cambiar Plan de Usuario',
            `¿Deseas cambiar el plan de ${name} a ${targetPlan.toUpperCase()}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            await axios.put(
                                `${API_URL}/admin/users/${userId}/subscription`,
                                { plan: targetPlan, role },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            Alert.alert('Éxito', `Plan actualizado correctamente.`);
                            fetchData(); // Reload list
                        } catch (error) {
                            console.error('Update plan error:', error);
                            Alert.alert('Error', 'No se pudo actualizar el plan.');
                        }
                    }
                }
            ]
        );
    };

    const renderLawyerItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.license}>Cédula: {item.licenseNumber}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.isVerified ? '#e8f5e9' : '#fff3e0' }]}>
                    <Text style={[styles.badgeText, { color: item.isVerified ? '#2e7d32' : '#ef6c00' }]}>
                        {item.isVerified ? 'Verificado' : 'Pendiente'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.date}>Reg: {new Date(item.createdAt).toLocaleDateString()}</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#e3f2fd', marginRight: 10 }]}
                        onPress={() => handleUpdatePlan(item.userId, 'lawyer', item.subscriptionStatus === 'active' && item.plan === 'pro' ? 'pro' : 'basic', item.fullName)}
                    >
                        <Text style={[styles.actionText, { color: '#1565c0' }]}>Plan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: item.isVerified ? '#ffebee' : '#e8f5e9' }]}
                        onPress={() => handleVerifyLawyer(item.id, item.isVerified, item.fullName)}
                    >
                        <Text style={[styles.actionText, { color: item.isVerified ? '#c62828' : '#2e7d32' }]}>
                            {item.isVerified ? 'Suspender' : 'Aprobar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderWorkerItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.subscriptionStatus === 'active' ? '#e8f5e9' : '#f5f5f5' }]}>
                    <Text style={[styles.badgeText, { color: item.subscriptionStatus === 'active' ? '#2e7d32' : '#666' }]}>
                        {item.subscriptionStatus === 'active' ? 'Premium' : 'Gratis'}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <View style={{ backgroundColor: '#f3e5f5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                    <Text style={{ fontSize: 11, color: '#8e24aa' }}>🤖 IA: {item.dailyTokenCount || 0} tokens</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.date}>Sol: {item.contactRequests || 0}</Text>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#e3f2fd' }]}
                    onPress={() => handleUpdatePlan(item.id, 'worker', item.subscriptionStatus === 'active' ? 'premium' : 'free', item.fullName)}
                >
                    <Text style={[styles.actionText, { color: '#1565c0' }]}>Cambiar Plan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPymeItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.name}>{item.companyName}</Text>
                    <Text style={styles.email}>{item.fullName} (Contacto)</Text>
                    <Text style={styles.license}>{item.email}</Text>
                    <Text style={styles.industry}>Giro: {item.industry}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.subscriptionLevel === 'premium' ? AppTheme.colors.secondary + '20' : '#f5f5f5' }]}>
                    <Text style={[styles.badgeText, { color: item.subscriptionLevel === 'premium' ? AppTheme.colors.secondary : '#666' }]}>
                        {item.subscriptionLevel === 'premium' ? 'Premium' : 'Básico'}
                    </Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.date}>Reg: {new Date(item.createdAt).toLocaleDateString()}</Text>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#e3f2fd' }]}
                    onPress={() => handleUpdatePlan(item.id, 'pyme', item.subscriptionLevel, item.companyName)}
                >
                    <Text style={[styles.actionText, { color: '#1565c0' }]}>Cambiar Plan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gestión de Usuarios</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'lawyers' && styles.activeTab]}
                    onPress={() => setActiveTab('lawyers')}
                >
                    <Text style={[styles.tabText, activeTab === 'lawyers' && styles.activeTabText]}>Abogados</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'workers' && styles.activeTab]}
                    onPress={() => setActiveTab('workers')}
                >
                    <Text style={[styles.tabText, activeTab === 'workers' && styles.activeTabText]}>Trabajadores</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pymes' && styles.activeTab]}
                    onPress={() => setActiveTab('pymes')}
                >
                    <Text style={[styles.tabText, activeTab === 'pymes' && styles.activeTabText]}>PYMEs</Text>
                </TouchableOpacity>
            </View>

            {renderSearchBar()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={getFilteredData()}
                    renderItem={activeTab === 'lawyers' ? renderLawyerItem : activeTab === 'workers' ? renderWorkerItem : renderPymeItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        height: 45,
        borderWidth: 1,
        borderColor: '#eee'
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#333'
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingTop: 10,
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
        fontSize: 14,
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
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    license: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    industry: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
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
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: 'bold',
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

export default AdminUsersScreen;

