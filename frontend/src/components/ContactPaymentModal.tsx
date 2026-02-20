import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import axios from 'axios';
import { API_URL } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ContactPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    lawyerName: string;
    lawyerId: string;
    lawyerProfileId: string;
    caseSummary: string;
    onSuccess: () => void;
}

const ContactPaymentModal: React.FC<ContactPaymentModalProps> = ({
    visible,
    onClose,
    lawyerName,
    lawyerId,
    lawyerProfileId,
    caseSummary,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
    const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'mercadopago'>('stripe');

    const handleConfirmPayment = async () => {
        setLoading(true);
        setStep('processing');

        try {
            const token = await AsyncStorage.getItem('authToken');

            // Create contact request with payment
            const response = await axios.post(
                `${API_URL}/contact/create-with-payment`,
                {
                    lawyerProfileId,
                    caseSummary: caseSummary || 'Solicitud de contacto desde la app',
                    caseType: 'general',
                    urgency: 'normal',
                    paymentGateway: selectedGateway,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { contactRequest, payment } = response.data;

            if (selectedGateway === 'stripe') {
                // STRIPE FLOW: Payment already processed
                if (payment.success) {
                    setStep('success');
                    setTimeout(() => {
                        Alert.alert(
                            '¡Solicitud Enviada!',
                            `Tu solicitud ha sido enviada a ${lawyerName}. Recibirás una notificación cuando el abogado responda.\n\nSi no acepta tu caso en 48 horas, se te reembolsará el 100% del monto.`,
                            [
                                {
                                    text: 'Entendido',
                                    onPress: () => {
                                        onSuccess();
                                        onClose();
                                    }
                                }
                            ]
                        );
                    }, 500);
                }
            } else {
                // MERCADOPAGO FLOW: Redirect to checkout
                if (payment.initPoint) {
                    Alert.alert(
                        'Redirigiendo a MercadoPago',
                        'Serás redirigido a MercadoPago para completar tu pago. Puedes pagar con tarjeta o en OXXO.',
                        [
                            {
                                text: 'Ir a pagar',
                                onPress: async () => {
                                    const supported = await Linking.canOpenURL(payment.initPoint);
                                    if (supported) {
                                        await Linking.openURL(payment.initPoint);
                                        onClose();
                                    } else {
                                        Alert.alert('Error', 'No se pudo abrir el link de pago');
                                    }
                                }
                            },
                            {
                                text: 'Cancelar',
                                style: 'cancel',
                                onPress: onClose
                            }
                        ]
                    );
                }
            }

        } catch (error: any) {
            console.error('Contact payment error:', error);
            const message = error.response?.data?.error || 'Error al procesar el pago';
            Alert.alert('Error', message);
            setStep('select');
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setStep('select');
        setSelectedGateway('stripe');
        setLoading(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    if (step === 'processing') {
        return (
            <Modal visible={visible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                        <Text style={styles.processingText}>Procesando pago...</Text>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Ionicons name="close" size={28} color="#666" />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="mail-outline" size={40} color={AppTheme.colors.primary} />
                            </View>
                            <Text style={styles.title}>Confirmar Contacto</Text>
                        </View>

                        {/* Lawyer Info */}
                        <View style={styles.lawyerCard}>
                            <Ionicons name="person" size={20} color={AppTheme.colors.primary} />
                            <Text style={styles.lawyerName}>{lawyerName}</Text>
                        </View>

                        {/* Payment Info */}
                        <View style={styles.paymentSection}>
                            <Text style={styles.sectionTitle}>Detalles del Pago</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Cargo único:</Text>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.currency}>$</Text>
                                    <Text style={styles.price}>50</Text>
                                    <Text style={styles.period}>MXN</Text>
                                </View>
                            </View>
                        </View>

                        {/* Refund Policy */}
                        <View style={styles.policyCard}>
                            <View style={styles.policyHeader}>
                                <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                                <Text style={styles.policyTitle}>Política de Reembolso</Text>
                            </View>
                            <Text style={styles.policyText}>
                                Si el abogado no acepta tu caso en un plazo de{' '}
                                <Text style={styles.highlight}>48 horas</Text>, se te reembolsará el{' '}
                                <Text style={styles.highlight}>100% del monto</Text> automáticamente.
                            </Text>
                        </View>

                        {/* Payment Gateway Selection */}
                        <View style={styles.gatewaySection}>
                            <Text style={styles.sectionTitle}>Método de Pago:</Text>

                            {/* Stripe Option */}
                            <TouchableOpacity
                                style={[
                                    styles.gatewayCard,
                                    selectedGateway === 'stripe' && styles.gatewayCardActive
                                ]}
                                onPress={() => setSelectedGateway('stripe')}
                            >
                                <View style={styles.gatewayHeader}>
                                    <View style={styles.gatewayIconContainer}>
                                        <Text style={styles.gatewayIcon}>💳</Text>
                                    </View>
                                    <View style={styles.gatewayInfo}>
                                        <Text style={[
                                            styles.gatewayTitle,
                                            selectedGateway === 'stripe' && styles.gatewayTitleActive
                                        ]}>
                                            Tarjeta de Crédito/Débito
                                        </Text>
                                        <Text style={styles.gatewaySubtitle}>Pago inmediato con Stripe</Text>
                                    </View>
                                    {selectedGateway === 'stripe' && (
                                        <Ionicons name="checkmark-circle" size={24} color={AppTheme.colors.primary} />
                                    )}
                                </View>
                                {selectedGateway === 'stripe' && (
                                    <View style={styles.recommendedBadge}>
                                        <Text style={styles.recommendedText}>✓ Recomendado</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* MercadoPago Option */}
                            <TouchableOpacity
                                style={[
                                    styles.gatewayCard,
                                    selectedGateway === 'mercadopago' && styles.gatewayCardActive
                                ]}
                                onPress={() => setSelectedGateway('mercadopago')}
                            >
                                <View style={styles.gatewayHeader}>
                                    <View style={styles.gatewayIconContainer}>
                                        <Text style={styles.gatewayIcon}>🛒</Text>
                                    </View>
                                    <View style={styles.gatewayInfo}>
                                        <Text style={[
                                            styles.gatewayTitle,
                                            selectedGateway === 'mercadopago' && styles.gatewayTitleActive
                                        ]}>
                                            MercadoPago
                                        </Text>
                                        <Text style={styles.gatewaySubtitle}>OXXO, Tarjeta, Efectivo</Text>
                                    </View>
                                    {selectedGateway === 'mercadopago' && (
                                        <Ionicons name="checkmark-circle" size={24} color={AppTheme.colors.primary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* What Happens Next */}
                        <View style={styles.stepsSection}>
                            <Text style={styles.sectionTitle}>¿Qué sucede después?</Text>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>1</Text>
                                </View>
                                <Text style={styles.stepText}>Se envía tu información al abogado</Text>
                            </View>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>2</Text>
                                </View>
                                <Text style={styles.stepText}>El abogado revisa tu caso (máx. 48 hrs)</Text>
                            </View>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>3</Text>
                                </View>
                                <Text style={styles.stepText}>Recibes notificación de aceptación o rechazo</Text>
                            </View>
                        </View>

                        {/* Confirm Button */}
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirmPayment}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[AppTheme.colors.secondary, '#f9ca24']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="card-outline" size={24} color="#fff" />
                                        <Text style={styles.confirmButtonText}>
                                            Pagar $50 y Enviar Solicitud
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '92%',
        maxHeight: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    processingContainer: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
    },
    processingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
        padding: 4,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${AppTheme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    lawyerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${AppTheme.colors.primary}10`,
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
    },
    lawyerName: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.colors.primary,
        marginLeft: 10,
    },
    paymentSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 10,
    },
    priceLabel: {
        fontSize: 16,
        color: '#666',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    currency: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 4,
    },
    price: {
        fontSize: 32,
        fontWeight: 'bold',
        color: AppTheme.colors.secondary,
    },
    period: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
        marginLeft: 4,
    },
    policyCard: {
        backgroundColor: '#ecfdf5',
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
    },
    policyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    policyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#059669',
        marginLeft: 8,
    },
    policyText: {
        fontSize: 14,
        color: '#047857',
        lineHeight: 20,
    },
    highlight: {
        fontWeight: 'bold',
        color: '#059669',
    },
    gatewaySection: {
        marginBottom: 20,
    },
    gatewayCard: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    gatewayCardActive: {
        borderColor: AppTheme.colors.primary,
        backgroundColor: `${AppTheme.colors.primary}05`,
    },
    gatewayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gatewayIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    gatewayIcon: {
        fontSize: 24,
    },
    gatewayInfo: {
        flex: 1,
    },
    gatewayTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    gatewayTitleActive: {
        color: AppTheme.colors.primary,
    },
    gatewaySubtitle: {
        fontSize: 13,
        color: '#666',
    },
    recommendedBadge: {
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 12,
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    recommendedText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    stepsSection: {
        marginBottom: 20,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: '#555',
    },
    confirmButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    gradientButton: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },
});

export default ContactPaymentModal;

