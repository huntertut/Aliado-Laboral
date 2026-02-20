import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import axios from 'axios';
import { API_URL } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubscribed: () => void;
}

import { useStripe } from '@stripe/stripe-react-native';

const WorkerSubscriptionModal: React.FC<SubscriptionModalProps> = ({ visible, onClose, onSubscribed }) => {
    const [loading, setLoading] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const benefits = [
        { icon: 'eye-outline', text: 'Perfiles completos de todos los abogados' },
        { icon: 'chatbubbles-outline', text: 'Acceso ilimitado a los asesores virtuales' },
        { icon: 'filter-outline', text: 'Filtros avanzados para encontrar al abogado ideal' },
        { icon: 'shield-checkmark-outline', text: 'Prioridad en respuestas' },
    ];

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken'); // FIX: Consistent token key
            if (!token) return;

            // 1. Fetch Payment Intent
            const response = await axios.post(
                `${API_URL}/subscription/activate`,
                {
                    paymentMethod: 'stripe',
                    planType: 'worker_premium'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { paymentIntent, ephemeralKey, customer, paymentIntentId } = response.data;

            // 2. Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Aliado Laboral',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                defaultBillingDetails: { name: 'Trabajador' },
                returnURL: 'derechoslaboralesmx://stripe-redirect',
            });

            if (initError) {
                Alert.alert('Error', initError.message);
                setLoading(false);
                return;
            }

            // 3. Present Payment Sheet
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code !== 'Canceled') {
                    Alert.alert('Pago cancelado', paymentError.message);
                }
            } else {
                // 4. Confirm on backend
                await axios.post(
                    `${API_URL}/subscription/confirm-payment`,
                    { paymentIntentId: paymentIntentId || paymentIntent },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                Alert.alert(
                    '¡Suscripción Activada!',
                    'Ahora tienes acceso completo a todos los perfiles de abogados.',
                    [{ text: 'OK', onPress: () => { onSubscribed(); onClose(); } }]
                );
            }
        } catch (error: any) {
            console.error('Subscription error:', error);
            const message = error.response?.data?.error || 'Error de conexión';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={28} color="#666" />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Ionicons name="star" size={60} color={AppTheme.colors.primary} />
                            <Text style={styles.title}>Desbloquea el Acceso Completo</Text>
                            <Text style={styles.subtitle}>
                                Accede a los mejores abogados de México
                            </Text>
                        </View>

                        {/* Price */}
                        <View style={styles.priceContainer}>
                            <Text style={styles.currency}>$</Text>
                            <Text style={styles.price}>29</Text>
                            <Text style={styles.period}>MXN/mes</Text>
                        </View>

                        {/* Benefits */}
                        <View style={styles.benefitsContainer}>
                            {benefits.map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <View style={styles.benefitIcon}>
                                        <Ionicons name={benefit.icon as any} size={24} color={AppTheme.colors.primary} />
                                    </View>
                                    <Text style={styles.benefitText}>{benefit.text}</Text>
                                </View>
                            ))}
                        </View>



                        {/* Subscribe Button */}
                        <TouchableOpacity
                            style={styles.subscribeButton}
                            onPress={handleSubscribe}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[AppTheme.colors.primary, '#3742fa']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.subscribeButtonText}>
                                        Suscribirme Ahora
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Terms */}
                        <Text style={styles.terms}>
                            Cancela en cualquier momento. Se renovará automáticamente cada mes.
                        </Text>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
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
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 28,
    },
    currency: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginTop: 8,
    },
    price: {
        fontSize: 56,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
    },
    period: {
        fontSize: 18,
        color: '#666',
        marginTop: 24,
        marginLeft: 4,
    },
    benefitsContainer: {
        marginBottom: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    benefitIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${AppTheme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    benefitText: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    providerContainer: {
        marginBottom: 24,
    },
    providerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    providerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    providerButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    providerButtonActive: {
        borderColor: AppTheme.colors.primary,
        backgroundColor: `${AppTheme.colors.primary}10`,
    },
    providerButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    providerButtonTextActive: {
        color: AppTheme.colors.primary,
    },
    subscribeButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    subscribeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    terms: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default WorkerSubscriptionModal;

