import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AppTheme } from '../theme/colors';
import { API_URL } from '../config/constants';
import WorkerSubscriptionModal from '../components/WorkerSubscriptionModal';

// Mock data for MVP if backend is not reachable
const MOCK_LAWYERS = [
    {
        id: '1',
        user: { fullName: 'Lic. Ana García Martínez', email: 'ana.garcia@legal.mx' },
        specialty: 'Despidos Injustificados',
        licenseNumber: '12345678',
        city: 'Ciudad de México',
        rating: 4.9,
        reviews: 120
    },
    {
        id: '2',
        user: { fullName: 'Lic. Carlos Méndez López', email: 'carlos.mendez@legal.mx' },
        specialty: 'Acoso Laboral',
        licenseNumber: '87654321',
        city: 'Guadalajara',
        rating: 4.8,
        reviews: 95
    },
    {
        id: '3',
        user: { fullName: 'Lic. Sofía Torres Ramírez', email: 'sofia.torres@legal.mx' },
        specialty: 'Seguridad Social',
        licenseNumber: '11223344',
        city: 'Monterrey',
        rating: 5.0,
        reviews: 210
    },
    {
        id: '4',
        user: { fullName: 'Lic. Roberto Vega', email: 'roberto.vega@lex.mx' },
        specialty: 'Contratos Colectivos',
        licenseNumber: '55667788',
        city: 'Querétaro',
        rating: 4.7,
        reviews: 80
    },
    {
        id: '5',
        user: { fullName: 'Dra. Patricia Almansa', email: 'patricia.almansa@legal.mx' },
        specialty: 'Derecho Corporativo',
        licenseNumber: '99887766',
        city: 'Puebla',
        rating: 4.9,
        reviews: 150
    }
];

const LawyersScreen = () => {
    const navigation = useNavigation<any>();
    const { user, getAccessToken } = useAuth();
    const [lawyers, setLawyers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'nearest' | 'popular'>('all');

    // Check if user is Premium plan or Admin
    const hasActiveSubscription = user?.plan === 'premium' || user?.plan === 'worker_premium' || user?.role === 'admin';

    useEffect(() => {
        fetchLawyers();
    }, [user]);

    const fetchLawyers = async () => {
        console.log('🚀 [LawyersScreen] Starting fetchLawyers...');
        try {
            const token = await getAccessToken();
            const endpoint = user?.role === 'pyme'
                ? `${API_URL}/lawyer-profile/public?type=pyme`
                : `${API_URL}/lawyer-profile/public`;

            console.log(`📡 [LawyersScreen] Requesting: ${endpoint}`);

            // Force timeout after 5 seconds to prevent hanging
            const response = await axios.get(
                endpoint,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000 // 5 seconds timeout
                }
            );

            console.log('✅ [LawyersScreen] Data received:', response.status);
            setLawyers((response.data as any).lawyers || MOCK_LAWYERS);
        } catch (error) {
            console.log('⚠️ [LawyersScreen] Failed to fetch. Using mock data.', error);
            setLawyers(MOCK_LAWYERS);
        } finally {
            console.log('🏁 [LawyersScreen] Loading finished');
            setLoading(false);
        }
    };

    const handleLawyerPress = (lawyer: any) => {
        if (hasActiveSubscription) {
            navigation.navigate('LawyerDetail' as never, { lawyer } as never);
        } else {
            setShowSubscriptionModal(true);
        }
    };

    const handleSubscribed = async () => {
        Alert.alert('¡Plan Premium Activo!', 'Ahora puedes contactar a todos los abogados.');
    };

    const getInitials = (fullName: string) => {
        if (!fullName || typeof fullName !== 'string') return 'AB';
        try {
            const parts = fullName.split(' ');
            return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
        } catch (e) {
            return 'AB';
        }
    };

    const getAbbreviatedName = (fullName: string) => {
        if (!fullName || typeof fullName !== 'string') {
            console.log('⚠️ [LawyersScreen] Invalid fullName:', fullName);
            return 'Abogado Aliado';
        }
        try {
            const parts = fullName.split(' ');
            if (parts.length >= 3) {
                return `${parts[0]} ${parts[1][0]}.`;
            }
            return fullName;
        } catch (e) {
            console.error('❌ [LawyersScreen] Error splitting name:', fullName, e);
            return 'Abogado Aliado';
        }
    };

    const renderLawyerCard = ({ item }: { item: any }) => {
        const isGated = !hasActiveSubscription;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleLawyerPress(item)}
                activeOpacity={0.7}
            >
                {/* Avatar */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.name || item.user?.fullName || 'AB')}</Text>
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <Text style={styles.name}>
                        {isGated ? getAbbreviatedName(item.name || item.user?.fullName) : (item.name || item.user?.fullName)}
                    </Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.location}>{item.city || 'México'}</Text>
                    </View>

                    {isGated ? (
                        <View style={styles.gatedInfo}>
                            <Text style={styles.blurred}>⭐⭐⭐⭐⭐</Text>
                            <Text style={styles.gatedText}>• XX casos ganados</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.specialty}>{item.specialty}</Text>
                            <Text style={styles.license}>Cédula: {item.licenseNumber}</Text>
                        </>
                    )}
                </View>

                {/* Action Button */}
                <View style={styles.actionButton}>
                    {isGated ? (
                        <View style={styles.lockIcon}>
                            <Ionicons name="lock-closed" size={24} color={AppTheme.colors.primary} />
                        </View>
                    ) : (
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                <Text style={styles.loadingText}>Cargando abogados...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[AppTheme.colors.primary, '#3742fa']}
                style={styles.headerGradient}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.header}>Aliado Premium</Text>
                </View>
                <Text style={styles.headerSubtitle}>Profesionales verificados en todo México</Text>

                {/* Filters */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
                            onPress={() => setActiveFilter('all')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>Todos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === 'nearest' && styles.filterChipActive]}
                            onPress={() => setActiveFilter('nearest')}
                        >
                            <Ionicons name="location" size={16} color={activeFilter === 'nearest' ? '#fff' : '#666'} style={{ marginRight: 4 }} />
                            <Text style={[styles.filterText, activeFilter === 'nearest' && styles.filterTextActive]}>Más Cercanos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === 'popular' && styles.filterChipActive]}
                            onPress={() => setActiveFilter('popular')}
                        >
                            <Ionicons name="star" size={16} color={activeFilter === 'popular' ? '#fff' : '#666'} style={{ marginRight: 4 }} />
                            <Text style={[styles.filterText, activeFilter === 'popular' && styles.filterTextActive]}>Más Solicitados</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </LinearGradient>

            {/* Info Banner (only for non-subscribers) */}
            {!hasActiveSubscription && (
                <TouchableOpacity
                    style={styles.infoBanner}
                    onPress={() => setShowSubscriptionModal(true)}
                >
                    <Ionicons name="information-circle" size={24} color={AppTheme.colors.primary} />
                    <View style={styles.bannerTextContainer}>
                        <Text style={styles.bannerTitle}>Acceso Completo por $29/mes</Text>
                        <Text style={styles.bannerText}>
                            Conectamos con los mejores abogados de todo México
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={AppTheme.colors.primary} />
                </TouchableOpacity>
            )}

            <FlatList
                data={lawyers}
                keyExtractor={(item) => item.id}
                renderItem={renderLawyerCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <WorkerSubscriptionModal
                visible={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                onSubscribed={handleSubscribed}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: AppTheme.colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bannerTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    bannerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginBottom: 2,
    },
    bannerText: {
        fontSize: 13,
        color: '#666',
    },
    listContent: {
        padding: 16,
        paddingTop: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    location: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    specialty: {
        fontSize: 14,
        color: AppTheme.colors.primary,
        marginTop: 2,
        fontWeight: '500',
    },
    license: {
        fontSize: 12,
        color: '#999',
        marginTop: 3,
    },
    gatedInfo: {
        marginTop: 4,
    },
    blurred: {
        fontSize: 14,
        color: '#ddd',
        marginBottom: 2,
    },
    gatedText: {
        fontSize: 13,
        color: '#999',
        fontStyle: 'italic',
    },
    actionButton: {
        marginLeft: 8,
    },
    lockIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${AppTheme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        marginTop: 20,
    },
    filterScroll: {
        paddingRight: 20,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    filterChipActive: {
        backgroundColor: '#fff',
    },
    filterText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    filterTextActive: {
        color: AppTheme.colors.primary,
    },
});

export default LawyersScreen;
