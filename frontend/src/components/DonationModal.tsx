import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import axios from 'axios';
import { API_URL } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DonationModalProps {
    visible: boolean;
    onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ visible, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'mercadopago'>('stripe');
    const [amount, setAmount] = useState('50');

    const presetAmounts = ['20', '50', '100', '200'];

    const handleDonate = async () => {
        const donationAmount = parseFloat(amount);

        if (!donationAmount || donationAmount < 10) {
            Alert.alert('Monto Inválido', 'El monto mínimo de donación es $10 MXN');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');
            const user = userData ? JSON.parse(userData) : null;

            // Create a donation payment (simulated for now)
            // In production, this would call a dedicated donation endpoint
            const response = await axios.post(
                `${API_URL}/worker-subscription/donate`,
                {
                    amount: donationAmount,
                    paymentProvider: selectedProvider
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert(
                '¡Gracias por tu Donación! 💝',
                `Tu donación de $${donationAmount} MXN ayuda a mantener este proyecto gratuito para todos los trabajadores mexicanos.`,
                [{ text: 'Cerrar', onPress: onClose }]
            );
        } catch (error: any) {
            console.error('Donation error:', error);

            // Even if backend fails, show appreciation
            Alert.alert(
                '¡Gracias! 💝',
                'Por ahora el sistema de donaciones está en desarrollo. Tu intención de apoyar significa mucho para nosotros.',
                [{ text: 'Cerrar', onPress: onClose }]
            );
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

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>💝</Text>
                        <Text style={styles.title}>Apoya el Proyecto</Text>
                        <Text style={styles.subtitle}>
                            Contribuye al mantenimiento de la plataforma y a nuestros programas sociales
                        </Text>
                    </View>

                    {/* Preset Amounts */}
                    <View style={styles.presetsContainer}>
                        {presetAmounts.map((preset) => (
                            <TouchableOpacity
                                key={preset}
                                style={[
                                    styles.presetButton,
                                    amount === preset && styles.presetButtonActive
                                ]}
                                onPress={() => setAmount(preset)}
                            >
                                <Text style={[
                                    styles.presetText,
                                    amount === preset && styles.presetTextActive
                                ]}>
                                    ${preset} MXN
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Amount */}
                    <View style={styles.customAmountContainer}>
                        <Text style={styles.label}>Otro Monto (MXN):</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>

                    {/* Payment Provider */}
                    <View style={styles.providerContainer}>
                        <Text style={styles.label}>Método de Pago:</Text>
                        <View style={styles.providerButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.providerButton,
                                    selectedProvider === 'stripe' && styles.providerButtonActive
                                ]}
                                onPress={() => setSelectedProvider('stripe')}
                            >
                                <Text style={[
                                    styles.providerButtonText,
                                    selectedProvider === 'stripe' && styles.providerButtonTextActive
                                ]}>
                                    💳 Stripe
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.providerButton,
                                    selectedProvider === 'mercadopago' && styles.providerButtonActive
                                ]}
                                onPress={() => setSelectedProvider('mercadopago')}
                            >
                                <Text style={[
                                    styles.providerButtonText,
                                    selectedProvider === 'mercadopago' && styles.providerButtonTextActive
                                ]}>
                                    🛒 MercadoPago
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Donate Button */}
                    <TouchableOpacity
                        style={styles.donateButton}
                        onPress={handleDonate}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#f093fb', '#f5576c']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.donateButtonText}>
                                    Donar ${amount} MXN
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.terms}>
                        Tu donación es completamente voluntaria y no es reembolsable.
                    </Text>
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
    emoji: {
        fontSize: 64,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    presetsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    presetButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 5,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    presetButtonActive: {
        borderColor: '#f5576c',
        backgroundColor: '#fff0f3',
        borderWidth: 2,
    },
    presetText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#555',
    },
    presetTextActive: {
        color: '#f5576c',
    },
    customAmountContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        paddingVertical: 12,
    },
    providerContainer: {
        marginBottom: 24,
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
        borderColor: '#f5576c',
        backgroundColor: '#f5576c10',
    },
    providerButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    providerButtonTextActive: {
        color: '#f5576c',
    },
    donateButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    donateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    terms: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default DonationModal;

