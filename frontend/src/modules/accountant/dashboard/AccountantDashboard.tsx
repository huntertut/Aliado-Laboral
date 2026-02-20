import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AppTheme } from '../../../theme/colors';
import { API_URL } from '../../../config/constants';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface PendingPaymentRequest {
    id: string;
    workerPaid: boolean;
    lawyerPaid: boolean;
    createdAt: string;
    worker: {
        fullName: string;
        email: string;
    };
    lawyerProfile: {
        lawyer: {
            user: {
                fullName: string;
                email: string;
            }
        }
    };
}

export const AccountantDashboard = () => {
    const { getAccessToken } = useAuth();
    const [requests, setRequests] = useState<PendingPaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingPayments = async () => {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/accountant/pending-payments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            } else {
                console.error('Failed to fetch pending payments');
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleVerify = async (requestId: string, type: 'worker' | 'lawyer') => {
        const token = await getAccessToken();
        try {
            const response = await fetch(`${API_URL}/accountant/verify-payment/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                Alert.alert('Éxito', 'Pago verificado correctamente');
                // Refresh list
                fetchPendingPayments();
            } else {
                Alert.alert('Error', 'No se pudo verificar el pago');
            }
        } catch (error) {
            Alert.alert('Error', 'Fallo de conexión');
        }
    };

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const renderItem = ({ item }: { item: PendingPaymentRequest }) => {
        const lawyerName = item.lawyerProfile?.lawyer?.user?.fullName || 'Abogado';
        const workerName = item.worker?.fullName || 'Trabajador';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="cash-outline" size={30} color={AppTheme.colors.secondary} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        <Text style={styles.id}>ID: ...{item.id.slice(-6)}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyLabel}>Trabajador</Text>
                        <Text style={styles.partyName}>{workerName}</Text>
                        <View style={styles.statusRow}>
                            <Ionicons
                                name={item.workerPaid ? "checkmark-circle" : "time"}
                                size={16}
                                color={item.workerPaid ? AppTheme.colors.success : '#f39c12'}
                            />
                            <Text style={{ marginLeft: 5, color: item.workerPaid ? AppTheme.colors.success : '#f39c12' }}>
                                {item.workerPaid ? 'Pagado' : 'Pendiente ($50)'}
                            </Text>
                        </View>
                        {!item.workerPaid && (
                            <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerify(item.id, 'worker')}>
                                <Text style={styles.verifyButtonText}>Verificar $$</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.partyColumn}>
                        <Text style={styles.partyLabel}>Abogado</Text>
                        <Text style={styles.partyName}>{lawyerName}</Text>
                        <View style={styles.statusRow}>
                            <Ionicons
                                name={item.lawyerPaid ? "checkmark-circle" : "time"}
                                size={16}
                                color={item.lawyerPaid ? AppTheme.colors.success : '#f39c12'}
                            />
                            <Text style={{ marginLeft: 5, color: item.lawyerPaid ? AppTheme.colors.success : '#f39c12' }}>
                                {item.lawyerPaid ? 'Pagado' : 'Pendiente ($150)'}
                            </Text>
                        </View>
                        {!item.lawyerPaid && (
                            <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerify(item.id, 'lawyer')}>
                                <Text style={styles.verifyButtonText}>Verificar $$</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) return <ActivityIndicator size="large" color={AppTheme.colors.primary} style={{ marginTop: 50 }} />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Panel Contable</Text>
                <Text style={styles.subtitle}>Verificación de Comisiones</Text>
            </View>

            {requests.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="checkmark-done-circle-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Todas las cuentas están al día.</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    onRefresh={() => { setRefreshing(true); fetchPendingPayments(); }}
                    refreshing={refreshing}
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
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'center',
    },
    date: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    id: {
        fontSize: 12,
        color: '#999',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    partyColumn: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: '#eee',
        marginHorizontal: 10,
    },
    partyLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    partyName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        textAlign: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    verifyButton: {
        backgroundColor: '#e3f2fd',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#bbdefb',
    },
    verifyButtonText: {
        color: AppTheme.colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        marginTop: 10,
    }
});

