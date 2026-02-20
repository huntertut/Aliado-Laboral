
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/constants';

const AdminPromotionsScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config State
    const [promoActive, setPromoActive] = useState(false);
    const [trialDays, setTrialDays] = useState('30');
    const [bannerText, setBannerText] = useState('¡Oferta de Bienvenida! 1 Mes GRATIS');

    const fetchConfig = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/system/public`, { // Actually we might need a private getters, but public works for initial state too if unrestricted. Better to use public for now.
                headers: { Authorization: `Bearer ${token}` }
            });

            const { promoActive, trialDays, bannerText } = response.data;
            setPromoActive(promoActive);
            setTrialDays(String(trialDays));
            setBannerText(bannerText || '');
        } catch (error) {
            console.error('Error fetching config:', error);
            // Don't alert on load, just default
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            await axios.put(`${API_URL}/system/update`, {
                promoActive,
                trialDays: parseInt(trialDays),
                bannerText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('¡Guardado!', 'La configuración de la promoción ha sido actualizada.');
        } catch (error) {
            console.error('Error saving config:', error);
            Alert.alert('Error', 'No se pudo guardar la configuración.');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppTheme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={[AppTheme.colors.primary, '#2c3e50']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Ofertas</Text>
                <Text style={styles.headerSubtitle}>Controla las promociones activas</Text>
            </LinearGradient>

            <View style={styles.content}>

                {/* Main Toggle Card */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Activar Promoción</Text>
                            <Text style={styles.subLabel}>Habilita el banner y el periodo de prueba gratuito para nuevos abogados.</Text>
                        </View>
                        <Switch
                            value={promoActive}
                            onValueChange={setPromoActive}
                            trackColor={{ false: "#767577", true: AppTheme.colors.secondary }}
                            thumbColor={promoActive ? "#fff" : "#f4f3f4"}
                        />
                    </View>
                </View>

                {/* Settings Input */}
                {promoActive && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Configuración de la Oferta</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Días de Prueba (Gratis)</Text>
                            <TextInput
                                style={styles.input}
                                value={trialDays}
                                onChangeText={setTrialDays}
                                keyboardType="numeric"
                                placeholder="Ej. 30"
                            />
                            <Text style={styles.helperText}>Los abogados recibirán estos días gratis antes del primer cobro.</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Texto del Banner</Text>
                            <TextInput
                                style={styles.input}
                                value={bannerText}
                                onChangeText={setBannerText}
                                placeholder="Ej. ¡Buen Fin! 2x1"
                                multiline
                            />
                        </View>

                        {/* Preview */}
                        <Text style={styles.inputLabel}>Vista Previa del Banner</Text>
                        <LinearGradient
                            colors={['#FF9800', '#F44336']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.previewBanner}
                        >
                            <Ionicons name="gift-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.previewText}>{bannerText}</Text>
                        </LinearGradient>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </>
                    )}
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
    },
    backButton: {
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subLabel: {
        fontSize: 12,
        color: '#666',
        marginRight: 10,
    },
    section: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
        fontStyle: 'italic',
    },
    previewBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
        justifyContent: 'center',
    },
    previewText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: AppTheme.colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: AppTheme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
    }
});

export default AdminPromotionsScreen;

