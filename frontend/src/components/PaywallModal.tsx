import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';

interface Props {
    visible: boolean;
    onClose: () => void;
    featureName: string;
}

const PaywallModal = ({ visible, onClose, featureName }: Props) => {
    const handleUpgrade = () => {
        // Enlazar a soporte o directamente a pasarela de pago
        Linking.openURL('https://wa.me/2211201419?text=Hola, quiero mejorar mi cuenta Pyme a Premium');
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <LinearGradient
                        colors={['#4a148c', '#7b1fa2']}
                        style={styles.header}
                    >
                        <Ionicons name="sparkles" size={50} color="#FFD700" />
                        <Text style={styles.title}>¡Desbloquea el Poder Premium!</Text>
                        <Text style={styles.subtitle}>Función restringida: {featureName}</Text>
                    </LinearGradient>

                    <View style={styles.body}>
                        <Text style={styles.description}>
                            Para acceder a esta función y blindar completamente tu empresa, actualiza al plan Premium.
                        </Text>

                        <View style={styles.benefits}>
                            <View style={styles.benefitItem}>
                                <Ionicons name="chatbubbles-outline" size={20} color="#4a148c" />
                                <Text style={styles.benefitText}>Chat directo con tu abogado asignado</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="document-lock-outline" size={20} color="#4a148c" />
                                <Text style={styles.benefitText}>Documentos validados con sello legal</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="notifications-outline" size={20} color="#4a148c" />
                                <Text style={styles.benefitText}>Alertas detalladas de vencimientos</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="cloud-download-outline" size={20} color="#4a148c" />
                                <Text style={styles.benefitText}>Guardado ilimitado de reportes</Text>
                            </View>
                        </View>

                        <Text style={styles.price}>{"Solo $999 MXN / mes"}</Text>

                        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA000']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.upgradeGradient}
                            >
                                <Text style={styles.upgradeText}>Actualizar a Premium</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>Quizás más tarde</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: '100%',
        overflow: 'hidden',
        elevation: 10,
    },
    header: {
        padding: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginTop: 15,
    },
    subtitle: {
        fontSize: 14,
        color: '#e1bee7',
        marginTop: 5,
        fontWeight: '600',
    },
    body: {
        padding: 25,
        alignItems: 'center',
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    benefits: {
        width: '100%',
        marginBottom: 25,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a148c',
        marginBottom: 20,
    },
    upgradeButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 15,
    },
    upgradeGradient: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    upgradeText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 10,
    },
    closeText: {
        color: '#999',
        fontSize: 14,
    },
});

export default PaywallModal;
