import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../../../theme/colors';
import { API_URL } from '../../../config/constants';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface PendingLawyer {
    id: string; // The Lawyer ID
    licenseNumber: string;
    specialty: string;
    professionalName: string | null;
    isVerified: boolean;
    nationalScope: boolean;
    acceptsFederalCases: boolean;
    acceptsLocalCases: boolean;
    requiresPhysicalPresence: boolean;
    user: {
        fullName: string;
        email: string;
    };
}

export const SupervisorDashboard = () => {
    const { getAccessToken } = useAuth();
    const [lawyers, setLawyers] = useState<PendingLawyer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState<any>({});

    const fetchData = async () => {
        try {
            const token = await getAccessToken();

            // Fetch Lawyers
            const lawyersPromise = fetch(`${API_URL}/supervisor/pending-lawyers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Fetch Stats (Alerts)
            const statsPromise = fetch(`${API_URL}/supervisor/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const [lawyersRes, statsRes] = await Promise.all([lawyersPromise, statsPromise]);

            if (lawyersRes.ok) {
                const lawyersData = await lawyersRes.json();
                setLawyers(lawyersData);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleVerify = async (lawyerId: string) => {
        const token = await getAccessToken();
        try {
            const response = await fetch(`${API_URL}/supervisor/verify-lawyer/${lawyerId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                Alert.alert('Éxito', 'Abogado verificado correctamente');
                setLawyers(prev => prev.filter(l => l.id !== lawyerId));
                fetchData();
            } else {
                Alert.alert('Error', 'No se pudo verificar');
            }
        } catch (error) {
            Alert.alert('Error', 'Fallo de conexión');
        }
    };

    const handleReject = async (lawyerId: string) => {
        const token = await getAccessToken();
        try {
            const response = await fetch(`${API_URL}/supervisor/reject-lawyer/${lawyerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                Alert.alert('Rechazado', 'La solicitud ha sido rechazada y eliminada.');
                setLawyers(prev => prev.filter(l => l.id !== lawyerId));
                fetchData();
            } else {
                Alert.alert('Error', 'No se pudo rechazar la solicitud');
            }
        } catch (error) {
            Alert.alert('Error', 'Fallo de conexión');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const renderItem = ({ item }: { item: PendingLawyer }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={40} color={AppTheme.colors.primary} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.name}>{item.professionalName || item.user.fullName || 'Sin nombre'}</Text>
                    <Text style={styles.email}>{item.user.email}</Text>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color="#666" />
                    <Text style={styles.label}>  Cédula: <Text style={styles.value}>{item.licenseNumber}</Text></Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="school-outline" size={16} color="#666" />
                    <Text style={styles.label}>  Especialidad: <Text style={styles.value}>{item.specialty || 'N/A'}</Text></Text>
                </View>

                {/* Scope Badges */}
                <Text style={styles.scopeTitle}>Alcance de Servicio:</Text>
                <View style={styles.scopeBadges}>
                    {item.nationalScope && (
                        <View style={[styles.badge, styles.badgeNational]}>
                            <Ionicons name="flag" size={12} color="#fff" />
                            <Text style={styles.badgeText}>Nacional</Text>
                        </View>
                    )}
                    {item.acceptsFederalCases && (
                        <View style={[styles.badge, styles.badgeFederal]}>
                            <Ionicons name="business" size={12} color="#fff" />
                            <Text style={styles.badgeText}>Federal</Text>
                        </View>
                    )}
                    {item.acceptsLocalCases && (
                        <View style={[styles.badge, styles.badgeLocal]}>
                            <Ionicons name="location" size={12} color="#fff" />
                            <Text style={styles.badgeText}>Local</Text>
                        </View>
                    )}
                    {item.requiresPhysicalPresence && (
                        <View style={[styles.badge, styles.badgePresence]}>
                            <Ionicons name="walk" size={12} color="#333" />
                            <Text style={[styles.badgeText, { color: '#333' }]}>Presencial</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => Alert.alert(
                        'Rechazar Solicitud',
                        `¿Estás seguro de rechazar a ${item.professionalName || item.user.fullName}? Esta acción no se puede deshacer.`,
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Sí, Rechazar', style: 'destructive', onPress: () => handleReject(item.id) }
                        ]
                    )}
                >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Rechazar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.verifyButton]}
                    onPress={() => Alert.alert(
                        'Confirmar Verificación',
                        `¿Aprobar licencia de ${item.professionalName || item.user.fullName}?`,
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Aprobar', onPress: () => handleVerify(item.id) }
                        ]
                    )}
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Aprobar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) return <ActivityIndicator size="large" color={AppTheme.colors.primary} style={{ marginTop: 50 }} />;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[AppTheme.colors.primary, '#3742fa']}
                style={styles.gradientHeader}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.title}>Panel de Supervisor</Text>
                        <Text style={styles.subtitle}>Verificación de Abogados</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={() => { setRefreshing(true); fetchData(); }}
                    >
                        <Ionicons name="refresh" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Alerts Section */}
            <View style={{ paddingHorizontal: 20, marginTop: -20, marginBottom: 10 }}>
                {stats?.recentPaymentsCount > 0 && (
                    <View style={styles.alertCard}>
                        <View style={[styles.alertIcon, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="cash" size={24} color="#2e7d32" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.alertTitle}>¡{stats.recentPaymentsCount} Nuevos Pagos!</Text>
                            <Text style={styles.alertDesc}>Recibidos en las últimas 24 horas.</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Abogados Pendientes ({lawyers.length})</Text>
            </View>

            {lawyers.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="checkmark-circle-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No hay abogados pendientes de verificación.</Text>
                </View>
            ) : (
                <FlatList
                    data={lawyers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    onRefresh={() => { setRefreshing(true); fetchData(); }}
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
    gradientHeader: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    alertDesc: {
        fontSize: 12,
        color: '#666',
    },
    list: {
        padding: 15,
        paddingTop: 0, // Adjusted since we have alerts above
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    email: {
        fontSize: 12,
        color: '#666',
    },
    details: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    value: {
        fontWeight: 'bold',
        color: '#333',
    },
    scopeTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
        marginTop: 10,
        marginBottom: 5,
    },
    scopeBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
    },
    badgeNational: {
        backgroundColor: '#e74c3c',
    },
    badgeFederal: {
        backgroundColor: '#3498db',
    },
    badgeLocal: {
        backgroundColor: '#2ecc71',
    },
    badgePresence: {
        backgroundColor: '#f1c40f',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 3,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    verifyButton: {
        backgroundColor: AppTheme.colors.success,
    },
    rejectButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
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

