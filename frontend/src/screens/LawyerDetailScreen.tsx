import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../theme/colors';

const { width } = Dimensions.get('window');

const LawyerDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { lawyer } = route.params as any;

    const handleContact = () => {
        // In real app, call API to send request
        const lawyerName = lawyer?.name || lawyer?.user?.fullName || 'Abogado';
        Alert.alert(
            'Solicitud Enviada',
            `Se ha notificado al ${lawyerName}. Te contactará pronto.`,
            [{ text: 'OK' }]
        );
    };

    const displayName = lawyer?.name || lawyer?.user?.fullName || 'Abogado';
    const displayBio = lawyer?.bio || 'Abogado especialista en derecho laboral con experiencia defendiendo a trabajadores. Experto en negociaciones y conciliación.';

    return (
        <View style={styles.mainContainer}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header Gradient & Back Button */}
                <LinearGradient
                    colors={[AppTheme.colors.primary, '#3742fa']}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Profile Card Overlay */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
                        </View>
                    </View>

                    <Text style={styles.name}>{displayName}</Text>

                    <View style={styles.badgeContainer}>
                        <View style={styles.specialtyBadge}>
                            <Ionicons name="briefcase" size={14} color={AppTheme.colors.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.specialtyText}>{lawyer?.specialty || 'Derecho Laboral'}</Text>
                        </View>
                        {lawyer?.licenseNumber && (
                            <View style={styles.licenseBadge}>
                                <Ionicons name="card" size={14} color="#666" style={{ marginRight: 4 }} />
                                <Text style={styles.licenseText}>Cédula: {lawyer.licenseNumber}</Text>
                            </View>
                        )}
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Ionicons name="star" size={20} color="#f1c40f" />
                            <Text style={styles.statValue}>4.9/5</Text>
                            <Text style={styles.statLabel}>Calificación</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                            <Text style={styles.statValue}>{lawyer?.wonCases?.length || '15+'}</Text>
                            <Text style={styles.statLabel}>Casos Éxito</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Ionicons name="time" size={20} color="#e67e22" />
                            <Text style={styles.statValue}>{lawyer?.yearsOfExperience || '10'} Años</Text>
                            <Text style={styles.statLabel}>Experiencia</Text>
                        </View>
                    </View>
                </View>

                {/* Content Sections */}
                <View style={styles.contentSection}>
                    <Text style={styles.sectionTitle}>Sobre el Abogado</Text>
                    <Text style={styles.bioText}>{displayBio}</Text>
                </View>

                <View style={styles.contentSection}>
                    <Text style={styles.sectionTitle}>Información de Contacto</Text>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="location" size={20} color={AppTheme.colors.primary} />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Ubicación Principal</Text>
                            <Text style={styles.infoValue}>{lawyer?.city || 'Ciudad de México, CDMX'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="flash" size={20} color={AppTheme.colors.primary} />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Tiempo de Respuesta</Text>
                            <Text style={styles.infoValue}>Usualmente en menos de 1 hora</Text>
                        </View>
                    </View>
                </View>

                {/* Action Area */}
                <View style={styles.actionContainer}>
                    <Text style={styles.disclaimerText}>
                        *Al hacer clic en el botón, el abogado recibirá tus datos de contacto y el resumen de tu problema generado por nuestro asistente.
                    </Text>

                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleContact}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#27ae60', '#2ecc71']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.contactButtonText}>Enviar Solicitud de Contacto</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.costText}>Costo de conexión: $50.00 MXN</Text>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerGradient: {
        height: 180,
        width: '100%',
        paddingTop: 50,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginHorizontal: 20,
        marginTop: -60, // Overlay on gradient
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        padding: 5,
        marginTop: -50, // Half outside the card
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 15,
    },
    avatar: {
        flex: 1,
        borderRadius: 45,
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 10,
    },
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
    },
    specialtyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${AppTheme.colors.primary}15`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginHorizontal: 5,
        marginBottom: 5,
    },
    specialtyText: {
        color: AppTheme.colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    licenseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f2f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginHorizontal: 5,
        marginBottom: 5,
    },
    licenseText: {
        color: '#666',
        fontWeight: '500',
        fontSize: 13,
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-evenly',
        borderTopWidth: 1,
        borderTopColor: '#f1f2f6',
        paddingTop: 15,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#f1f2f6',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#7f8c8d',
        marginTop: 2,
    },
    contentSection: {
        marginHorizontal: 20,
        marginTop: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    bioText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 24,
        textAlign: 'justify',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: `${AppTheme.colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
    },
    actionContainer: {
        marginHorizontal: 20,
        marginTop: 35,
        alignItems: 'center',
    },
    contactButton: {
        width: '100%',
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 15,
    },
    buttonGradient: {
        flexDirection: 'row',
        paddingVertical: 18,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disclaimerText: {
        fontSize: 12,
        color: '#7f8c8d',
        textAlign: 'center',
        paddingHorizontal: 10,
        lineHeight: 18,
    },
    costText: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#27ae60',
    }
});

export default LawyerDetailScreen;
