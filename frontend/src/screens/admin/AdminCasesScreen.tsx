import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminCasesScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cases, setCases] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCases = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/admin/cases`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCases(response.data);
        } catch (error) {
            console.error('Error fetching cases:', error);
            Alert.alert('Error', 'No se pudieron cargar los casos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCases();
    };

    const handlePurgeData = (requestId: string) => {
        Alert.alert(
            'Purgar Datos',
            'Esto eliminará permanentemente la información sensible de este caso (nombres, documentos) cumpliendo con políticas de privacidad. ¿Continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            await axios.post(
                                `${API_URL}/admin/cases/${requestId}/purge`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            Alert.alert('Éxito', 'Datos purgados correctamente');
                            fetchCases();
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.error || 'No se pudo purgar la información');
                        }
                    }
                }
            ]
        );
    };

    const getFilteredCases = () => {
        if (!searchQuery) return cases;
        const query = searchQuery.toLowerCase();
        return cases.filter(c =>
            (c.workerName && c.workerName.toLowerCase().includes(query)) ||
            (c.lawyerName && c.lawyerName.toLowerCase().includes(query)) ||
            (c.caseType && c.caseType.toLowerCase().includes(query))
        );
    };

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar por abogado, trabajador o tipo..."
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#fff3e0';
            case 'accepted': return '#e8f5e9';
            case 'completed': return '#e3f2fd';
            case 'rejected': return '#ffebee';
            default: return '#f5f5f5';
        }
    };

    const renderCaseItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.id}>ID: {item.id.slice(0, 8)}...</Text>
                    <Text style={styles.type}>{item.caseType}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.participants}>
                <View style={styles.participantRow}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={styles.participantText}>Trabajador: {item.workerName}</Text>
                </View>
                <View style={styles.participantRow}>
                    <Ionicons name="briefcase" size={16} color="#666" />
                    <Text style={styles.participantText}>Abogado: {item.lawyerName}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                {item.status === 'accepted' && item.bothPaymentsSucceeded && (
                    <TouchableOpacity
                        style={styles.purgeButton}
                        onPress={() => handlePurgeData(item.id)}
                    >
                        <Ionicons name="trash-outline" size={16} color="#c62828" />
                        <Text style={styles.purgeText}>Purgar Datos</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gestión de Casos</Text>
            </View>

            {renderSearchBar()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={getFilteredCases()}
                    renderItem={renderCaseItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No hay casos registrados</Text>
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
        alignItems: 'center',
        marginBottom: 10,
    },
    id: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'monospace',
    },
    type: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
    },
    participants: {
        marginVertical: 10,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    participantText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#555',
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
    purgeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
    },
    purgeText: {
        fontSize: 12,
        color: '#c62828',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
        fontSize: 16,
    },
});

export default AdminCasesScreen;

