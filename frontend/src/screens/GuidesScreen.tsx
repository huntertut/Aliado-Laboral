import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROFEDET_LOCATIONS, ProfedetLocation } from '../data/profedet';
import { useWorkerProfile } from '../modules/worker/profile/hooks/useWorkerProfile';
import AppHeader from '../components/common/AppHeader';

const GuidesScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [userState, setUserState] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<ProfedetLocation | null>(null);
    const [showStateSelector, setShowStateSelector] = useState(false);
    const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

    // Use the hook to get up-to-date profile data
    const { profileData, loadProfile } = useWorkerProfile();

    useEffect(() => {
        // Load profile on mount
        loadProfile();
    }, []);

    useEffect(() => {
        // Watch for profileData changes to auto-select state
        if (profileData && profileData.federalEntity) {
            const userState = profileData.federalEntity;
            setUserState(userState);
            const location = PROFEDET_LOCATIONS.find(loc => loc.state === userState);
            // If found, select it; otherwise default to CDMX or keep current
            if (location) {
                setSelectedLocation(location);
            }
        } else {
            // Fallback if no profile data yet or no state set
            // Only set default if nothing selected yet to avoid overwriting user manual choice effectively?
            // Actually, if profile loads, we should probably prefer it.
            // But if specific requirement "seguimos con la opcion de cambiarlo" exists,
            // users might want their manual change to persist. 
            // However, simplest "auto-select" logic is: if profile has state, use it.
            if (!selectedLocation && !userState) {
                setUserState('Ciudad de México');
                setSelectedLocation(PROFEDET_LOCATIONS.find(l => l.state === 'Ciudad de México') || PROFEDET_LOCATIONS[0]);
            }
        }
    }, [profileData]);

    const handleStateChange = (location: ProfedetLocation) => {
        setSelectedLocation(location);
        setUserState(location.state);
        setShowStateSelector(false);
    };

    const formatPhoneNumber = (phone: string) => {
        // Format: (XXX) XXX XX XX
        if (phone.length === 10) {
            return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)} ${phone.substring(6, 8)} ${phone.substring(8)}`;
        }
        return phone;
    };

    const toggleAccordion = (section: string) => {
        setExpandedAccordion(expandedAccordion === section ? null : section);
    };

    const Accordion = ({ title, children, section }: { title: string; children: React.ReactNode; section: string }) => {
        const isExpanded = expandedAccordion === section;

        return (
            <View style={styles.accordionContainer}>
                <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => toggleAccordion(section)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.accordionTitle}>{title}</Text>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={AppTheme.colors.primary}
                    />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.accordionContent}>
                        {children}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <AppHeader
                title="PROFEDET"
                subtitle="Tu Defensor Laboral Gratuito"
                gradient={[AppTheme.colors.primary, '#3742fa']}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Ionicons name="shield-checkmark" size={24} color={AppTheme.colors.primary} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.summaryLabel}>¿Qué es?</Text>
                            <Text style={styles.summaryText}>
                                El organismo del Gobierno de México que te defiende gratuitamente en conflictos laborales.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <Ionicons name="help-buoy" size={24} color={AppTheme.colors.primary} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.summaryLabel}>¿Para qué?</Text>
                            <Text style={styles.summaryText}>
                                Despidos injustificados, falta de pago de prestaciones, problemas con el IMSS o tu AFORE.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <Ionicons name="cash" size={24} color="#27ae60" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.summaryLabel}>Tu Beneficio</Text>
                            <Text style={[styles.summaryText, { fontWeight: 'bold', color: '#27ae60' }]}>
                                Asesoría y representación legal de expertos sin costo. ¡Recibes el 100% de tu dinero!
                            </Text>
                        </View>
                    </View>
                </View>

                {/* User's State Delegation */}
                <TouchableOpacity
                    style={styles.wizardButton}
                    onPress={() => navigation.navigate('ProfedetInfo' as never)}
                >
                    <LinearGradient
                        colors={['#e74c3c', '#c0392b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.wizardGradient}
                    >
                        <Ionicons name="document-text" size={24} color="#fff" />
                        <View style={{ marginLeft: 15, flex: 1 }}>
                            <Text style={styles.wizardTitle}>Iniciar Trámite / Expediente</Text>
                            <Text style={styles.wizardSubtitle}>Organiza tus documentos para tu abogado</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                </TouchableOpacity>

                {selectedLocation && (
                    <View style={styles.delegationCard}>
                        <Text style={styles.delegationTitle}>
                            📍 Tu Delegación PROFEDET en {userState}
                        </Text>

                        <View style={styles.delegationInfo}>
                            <View style={styles.infoRow}>
                                <Ionicons name="location" size={20} color={AppTheme.colors.primary} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Dirección:</Text>
                                    <Text style={styles.infoText}>{selectedLocation.address}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="call" size={20} color={AppTheme.colors.primary} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Teléfono:</Text>
                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${selectedLocation.phone}`)}>
                                        <Text style={styles.phoneLink}>
                                            {formatPhoneNumber(selectedLocation.phone)} 📞
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="time" size={20} color={AppTheme.colors.primary} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Horario:</Text>
                                    <Text style={styles.infoText}>Lunes a Viernes, de 9:00 a.m. a 6:00 p.m.</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.changeStateButton}
                            onPress={() => setShowStateSelector(true)}
                        >
                            <Ionicons name="location-outline" size={18} color={AppTheme.colors.primary} />
                            <Text style={styles.changeStateText}>¿No es tu estado? Cambiar ubicación</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Accordions */}
                <Accordion title="¿Cómo te ayudamos? (Proceso en 3 Pasos)" section="process">
                    <View style={styles.stepContainer}>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Asesoría Gratuita</Text>
                                <Text style={styles.stepText}>
                                    Un abogado experto escucha tu caso y te orienta sobre tus derechos.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Conciliación</Text>
                                <Text style={styles.stepText}>
                                    Te acompañamos a negociar un acuerdo amistoso con tu patrón.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Representación Legal</Text>
                                <Text style={styles.stepText}>
                                    Si no hay acuerdo, te representamos gratuitamente en juicio.
                                </Text>
                            </View>
                        </View>
                    </View>
                </Accordion>

                <Accordion title="Guía Práctica: ¿Qué necesitas?" section="requirements">
                    <View style={styles.requirementsContainer}>
                        <View style={styles.warningBox}>
                            <Ionicons name="alert-circle" size={20} color="#e74c3c" />
                            <Text style={styles.warningText}>
                                Importante: El trámite es estrictamente personal.
                            </Text>
                        </View>

                        <Text style={styles.requirementTitle}>Documentación Recomendada (Lleva lo que tengas):</Text>

                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                            <Text style={styles.checklistText}>Identificación oficial vigente</Text>
                        </View>

                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                            <Text style={styles.checklistText}>Nombre y domicilio de la empresa</Text>
                        </View>

                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                            <Text style={styles.checklistText}>Recibos de nómina (si los tienes)</Text>
                        </View>

                        <View style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                            <Text style={styles.checklistText}>
                                (Para pensiones) Acta de nacimiento, estado de cuenta AFORE
                            </Text>
                        </View>

                        <View style={styles.contactSection}>
                            <Text style={styles.contactTitle}>Otros Canales de Contacto:</Text>

                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => Linking.openURL('tel:8007172942')}
                            >
                                <Ionicons name="call" size={20} color="#fff" />
                                <Text style={styles.contactButtonText}>800 717 2942 (Gratuito)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => Linking.openURL('tel:8009117877')}
                            >
                                <Ionicons name="call" size={20} color="#fff" />
                                <Text style={styles.contactButtonText}>800 911 7877 (Gratuito)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: '#3498db' }]}
                                onPress={() => Linking.openURL('mailto:orientacionprofedet@stps.gob.mx')}
                            >
                                <Ionicons name="mail" size={20} color="#fff" />
                                <Text style={styles.contactButtonText}>orientacionprofedet@stps.gob.mx</Text>
                            </TouchableOpacity>

                            <Text style={styles.socialText}>
                                Redes Sociales: <Text style={{ fontWeight: 'bold' }}>@ProfeDETOficial</Text>
                            </Text>
                        </View>
                    </View>
                </Accordion>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* State Selector Modal */}
            <Modal
                visible={showStateSelector}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowStateSelector(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecciona tu Estado</Text>
                            <TouchableOpacity onPress={() => setShowStateSelector(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={PROFEDET_LOCATIONS}
                            keyExtractor={(item) => item.state}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.stateItem,
                                        item.state === userState && styles.selectedStateItem
                                    ]}
                                    onPress={() => handleStateChange(item)}
                                >
                                    <Text style={[
                                        styles.stateItemText,
                                        item.state === userState && styles.selectedStateItemText
                                    ]}>
                                        {item.state}
                                    </Text>
                                    {item.state === userState && (
                                        <Ionicons name="checkmark" size={20} color={AppTheme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 3,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginBottom: 4,
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    delegationCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: AppTheme.colors.primary,
        shadowColor: AppTheme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    delegationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginBottom: 15,
    },
    delegationInfo: {
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#999',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    phoneLink: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        textDecorationLine: 'underline',
    },
    changeStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginTop: 10,
    },
    changeStateText: {
        fontSize: 14,
        color: AppTheme.colors.primary,
        marginLeft: 8,
        fontWeight: '600',
    },
    accordionContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#fff',
    },
    accordionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    accordionContent: {
        padding: 18,
        paddingTop: 0,
        backgroundColor: '#f8f9fa',
    },
    stepContainer: {
        marginTop: 10,
    },
    step: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stepNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumberText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    stepText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    tableContainer: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: AppTheme.colors.primary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 2,
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tableCell: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    requirementsContainer: {
        marginTop: 10,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#fee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#e74c3c',
    },
    warningText: {
        fontSize: 13,
        color: '#c0392b',
        marginLeft: 10,
        flex: 1,
        fontWeight: '600',
    },
    requirementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checklistText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 10,
        flex: 1,
    },
    contactSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    contactTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    contactButton: {
        flexDirection: 'row',
        backgroundColor: '#27ae60',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    socialText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    stateItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedStateItem: {
        backgroundColor: 'rgba(30, 55, 153, 0.05)',
    },
    stateItemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedStateItemText: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
    },
    // WIZARD BUTTON
    wizardButton: {
        marginBottom: 20,
        borderRadius: 15,
        elevation: 4,
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    wizardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 15,
    },
    wizardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    wizardSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
    },
});

export default GuidesScreen;

