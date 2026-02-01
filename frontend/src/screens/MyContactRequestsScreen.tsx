import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AppTheme } from '../theme/colors';
import { API_URL } from '../config/constants';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ContactRequest {
    id: string;
    status: string;
    caseSummary: string;
    caseType: string;
    urgency: string;
    createdAt: string;
    lawyerProfile: {
        lawyer: {
            user: {
                fullName: string;
            };
        };
    };
}

const MyContactRequestsScreen = () => {
    const navigation = useNavigation<any>();
    const { getAccessToken } = useAuth();
    const [requests, setRequests] = useState<ContactRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

    // ...

    const fetchRequests = async () => {
        try {
            const token = await getAccessToken();

            const response = await fetch(`${API_URL}/contact/my-requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        fetchRequests();
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pendiente',
                    icon: 'time-outline',
                    color: '#f39c12',
                    bg: '#fff3cd',
                    message: 'Esperando respuesta del abogado',
                };
            case 'accepted':
                return {
                    label: 'Aceptada',
                    icon: 'checkmark-circle',
                    color: '#27ae60',
                    bg: '#d4edda',
                    message: 'El abogado aceptó tu caso. Datos desbloqueados',
                };
            case 'rejected':
                return {
                    label: 'Rechazada',
                    icon: 'close-circle',
                    color: '#e74c3c',
                    bg: '#f8d7da',
                    message: 'El abogado no puede tomar tu caso',
                };
            case 'expired':
                return {
                    label: 'Expirada',
                    icon: 'alert-circle',
                    color: '#95a5a6',
                    bg: '#e8e8e8',
                    message: 'La solicitud expiró sin respuesta',
                };
            case 'canceled':
                return {
                    label: 'Cancelada',
                    icon: 'ban',
                    color: '#7f8c8d',
                    bg: '#d5d8dc',
                    message: 'Cancelaste esta solicitud',
                };
            default:
                return {
                    label: status,
                    icon: 'help-circle',
                    color: '#95a5a6',
                    bg: '#e8e8e8',
                    message: '',
                };
        }
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    const renderRequest = ({ item }: { item: ContactRequest }) => {
        const config = getStatusConfig(item.status);
        const lawyerName = item.lawyerProfile?.lawyer?.user?.fullName || 'Abogado';

        return (
            <TouchableOpacity
                style={styles.requestCard}
                onPress={() => {
                    // TODO: Navegar a detalles si es necesario
                    console.log('Ver detalles de solicitud:', item.id);
                }}
            >
                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon as any} size={16} color={config.color} />
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>

                {/* Lawyer info */}
                <View style={styles.lawyerInfo}>
                    <Ionicons name="person-circle-outline" size={40} color="#667eea" />
                    <View style={styles.lawyerDetails}>
                        <Text style={styles.lawyerName}>{lawyerName}</Text>
                        <Text style={styles.caseType}>
                            {item.caseType?.charAt(0).toUpperCase() + item.caseType?.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* Case summary preview */}
                <Text style={styles.summaryPreview} numberOfLines={2}>
                    {item.caseSummary}
                </Text>

                {/* Status message */}
                <Text style={[styles.statusMessage, { color: config.color }]}>
                    {config.message}
                </Text>

                {/* Date */}
                <Text style={styles.date}>
                    Enviada: {new Date(item.createdAt).toLocaleDateString('es-MX')}
                </Text>

                {/* Action buttons based on status */}
                {item.status === 'pending' && (
                    <TouchableOpacity style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancelar solicitud</Text>
                    </TouchableOpacity>
                )}

                {item.status === 'accepted' && (
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => navigation.navigate('CaseChat' as never, {
                            requestId: item.id,
                            workerName: lawyerName // Re-using this param for the Header Title
                        } as never)}
                    >
                        <LinearGradient
                            colors={['#27ae60', '#2ecc71']}
                            style={styles.contactButtonGradient}
                        >
                            <Ionicons name="chatbubbles" size={16} color="#fff" />
                            <Text style={styles.contactButtonText}>Chat con Abogado</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {item.status === 'rejected' && (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.navigate('Lawyers' as never)}
                    >
                        <Text style={styles.retryButtonText}>Contactar otro abogado</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Mis Solicitudes</Text>
                <Text style={styles.headerSubtitle}>
                    {filteredRequests.length} {filteredRequests.length === 1 ? 'solicitud' : 'solicitudes'}
                </Text>
            </LinearGradient>

            {/* Filters */}
            <View style={styles.filters}>
                {[
                    { key: 'all', label: 'Todas' },
                    { key: 'pending', label: 'Pendientes' },
                    { key: 'accepted', label: 'Aceptadas' },
                    { key: 'rejected', label: 'Rechazadas' }
                ].map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[
                            styles.filterButton,
                            filter === f.key && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter(f.key as any)}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === f.key && styles.filterTextActive
                        ]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {filteredRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={80} color="#bdc3c7" />
                    <Text style={styles.emptyTitle}>No hay solicitudes</Text>
                    <Text style={styles.emptySubtitle}>
                        {filter === 'all'
                            ? 'Aún no has enviado ninguna solicitud'
                            : `No tienes solicitudes ${filter === 'pending' ? 'pendientes' : filter === 'accepted' ? 'aceptadas' : 'rechazadas'}`
                        }
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Lawyers' as never)}
                    >
                        <Text style={styles.browseButtonText}>Buscar abogados</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredRequests}
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
        paddingBottom: 25,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    filters: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
    filterButtonActive: {
        backgroundColor: '#667eea',
    },
    filterText: {
        fontSize: 13,
        color: '#7f8c8d',
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 20,
    },
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
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    lawyerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    lawyerDetails: {
        marginLeft: 12,
        flex: 1,
    },
    lawyerName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    caseType: {
        fontSize: 13,
        color: '#7f8c8d',
        marginTop: 2,
    },
    summaryPreview: {
        fontSize: 14,
        color: '#34495e',
        lineHeight: 20,
        marginBottom: 10,
    },
    statusMessage: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        color: '#95a5a6',
    },
    cancelButton: {
        marginTop: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e74c3c',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#e74c3c',
        fontSize: 14,
        fontWeight: '600',
    },
    contactButton: {
        marginTop: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    contactButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    retryButton: {
        marginTop: 12,
        padding: 10,
        backgroundColor: '#3498db',
        borderRadius: 8,
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    browseButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default MyContactRequestsScreen;

