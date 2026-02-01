import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../theme/colors';
import { API_URL } from '../config/constants';
import { Ionicons } from '@expo/vector-icons';

const LawyerPublicProfileScreen = () => {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const params = route.params as { lawyerId: string } || {};
    const { lawyerId } = params;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/lawyer-profile/public/${lawyerId}`);
            const data = await response.json();
            setProfile(data.profile);
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
                <Text style={styles.errorText}>Perfil no encontrado</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header con foto y nombre */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backIcon}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    {profile.photoUrl ? (
                        <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="person" size={60} color="#fff" />
                        </View>
                    )}

                    <Text style={styles.name}>{profile.name}</Text>
                    <Text style={styles.specialty}>{profile.specialty || 'Abogado Laboralista'}</Text>

                    {profile.isVerified && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                            <Text style={styles.verifiedText}>Verificado</Text>
                        </View>
                    )}
                </LinearGradient>

                {/* Estadísticas */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Ionicons name="star" size={24} color="#f39c12" />
                        <Text style={styles.statNumber}>{profile.successRate?.toFixed(0) || '0'}%</Text>
                        <Text style={styles.statLabel}>Tasa de éxito estimada</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="briefcase" size={24} color="#3498db" />
                        <Text style={styles.statNumber}>{profile.yearsOfExperience}</Text>
                        <Text style={styles.statLabel}>Años de experiencia</Text>
                    </View>
                </View>

                {/* Biografía */}
                {profile.bio && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sobre el abogado</Text>
                        <Text style={styles.bioText}>{profile.bio}</Text>
                    </View>
                )}

                {/* Casos ganados */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Casos Exitosos</Text>
                    {profile.wonCases.map((caseDescription: string, index: number) => (
                        <View key={index} style={styles.caseCard}>
                            <Ionicons name="trophy" size={20} color="#f39c12" />
                            <Text style={styles.caseText}>{caseDescription}</Text>
                        </View>
                    ))}
                </View>

                {/* Información adicional */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información Profesional</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="card-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>Cédula: {profile.licenseNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="eye-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{profile.profileViews} visualizaciones de perfil</Text>
                    </View>
                </View>

                {/* Advertencia de privacidad */}
                <View style={styles.privacyNotice}>
                    <Ionicons name="lock-closed" size={20} color="#7f8c8d" />
                    <Text style={styles.privacyText}>
                        Los datos de contacto se revelarán solo cuando el abogado acepte tu solicitud.
                    </Text>
                </View>

                {/* Espacio para botón fijo */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Botón fijo para contactar */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => navigation.navigate('CreateContactRequest' as never, {
                        lawyerProfileId: profile.id,
                        lawyerName: profile.name
                    } as never)}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.contactButtonGradient}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                        <Text style={styles.contactButtonText}>Solicitar Contacto</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.footerNote}>
                    Costo: $50 MXN (solo se cobra si el abogado acepta)
                </Text>
            </View>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#e74c3c',
        marginTop: 20,
        marginBottom: 30,
    },
    backButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        padding: 30,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backIcon: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 15,
    },
    specialty: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
    },
    verifiedText: {
        color: '#27ae60',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: -30,
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        textAlign: 'center',
        marginTop: 4,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    bioText: {
        fontSize: 15,
        color: '#34495e',
        lineHeight: 24,
    },
    caseCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    caseText: {
        fontSize: 14,
        color: '#34495e',
        marginLeft: 10,
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
    },
    privacyNotice: {
        flexDirection: 'row',
        backgroundColor: '#ecf0f1',
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    privacyText: {
        fontSize: 13,
        color: '#7f8c8d',
        marginLeft: 10,
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 15,
        paddingBottom: 25,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    contactButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    contactButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 8,
    },
});

export default LawyerPublicProfileScreen;

