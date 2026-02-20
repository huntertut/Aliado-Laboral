import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../../../../theme/colors';
import { useAuth } from '../../../../context/AuthContext';

interface Props {
    laborData: any;
    profedetIsActive: boolean;
}

export const ContactLawyerButton = ({ laborData, profedetIsActive }: Props) => {
    const navigation = useNavigation();
    const [showLaborModal, setShowLaborModal] = useState(false);
    const [showProfedetWarning, setShowProfedetWarning] = useState(false);

    const { user } = useAuth();

    const handlePress = () => {
        // Validation: Ensure occupation and federalEntity are present
        if (!laborData?.occupation || !laborData?.federalEntity) {
            setShowLaborModal(true);
            return;
        }

        // Business Model: Direct to Premium Subscription if free user
        const isPremium = user?.plan === 'PRO' || user?.plan === 'PREMIUM' || (user as any).isPremiumMock;

        if (!isPremium) {
            navigation.navigate('SubscriptionManagement' as never);
            return;
        }

        // PRO users: Check PROFEDET warning, then proceed to lawyer directory
        if (profedetIsActive) {
            setShowProfedetWarning(true);
        } else {
            navigation.navigate('Lawyers' as never);
        }
    };

    return (
        <>
            <TouchableOpacity style={styles.contactMainButton} onPress={handlePress}>
                <LinearGradient
                    colors={['#e67e22', '#d35400']}
                    style={styles.contactGradient}
                >
                    <Ionicons name="briefcase" size={24} color="#fff" />
                    <Text style={styles.contactMainText}>Contactar a un Abogado Laboral</Text>
                    <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Labor Data Incomplete Modal */}
            <Modal visible={showLaborModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.warningCard}>
                        <Ionicons name="alert-circle" size={48} color="#f1c40f" />
                        <Text style={styles.warningTitle}>Datos Incompletos</Text>
                        <Text style={styles.warningText}>
                            Para contactar a un abogado, necesitamos al menos tu Ocupación y Estado. Esto ayuda a asignarte al experto correcto.
                        </Text>
                        <TouchableOpacity
                            style={styles.warningButton}
                            onPress={() => setShowLaborModal(false)}
                        >
                            <Text style={styles.warningButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PROFEDET Warning Modal */}
            <Modal visible={showProfedetWarning} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.warningCard}>
                        <Ionicons name="scale" size={48} color="#8e44ad" />
                        <Text style={styles.warningTitle}>⚖️ Trámite PROFEDET Detectado</Text>
                        <Text style={styles.warningText}>
                            Para que el abogado pueda ayudarte sin interferir en tu proceso, es crucial que comparta la información de tu caso.
                        </Text>

                        <TouchableOpacity
                            style={[styles.warningButton, { backgroundColor: '#8e44ad', marginBottom: 10 }]}
                            onPress={() => {
                                setShowProfedetWarning(false);
                                navigation.navigate('ProfedetInfo' as never);
                            }}
                        >
                            <Text style={styles.warningButtonText}>Revisar mis datos PROFEDET</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.warningButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#666' }]}
                            onPress={() => {
                                setShowProfedetWarning(false);
                                navigation.navigate('Lawyers' as never);
                            }}
                        >
                            <Text style={[styles.warningButtonText, { color: '#666' }]}>Contactar de todos modos</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    contactMainButton: {
        marginBottom: 20,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#e67e22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    contactGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 15,
    },
    contactMainText: {
        flex: 1,
        textAlign: 'center',
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        marginRight: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    warningCard: {
        backgroundColor: '#fff',
        width: '85%',
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 10,
    },
    warningTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        marginBottom: 10,
    },
    warningText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    warningButton: {
        backgroundColor: AppTheme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    warningButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

