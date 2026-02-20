import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Share, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/common/AppHeader';
import ViewShot from "react-native-view-shot";
import { AnalyticsService } from '../services/AnalyticsService';

import { ViralShareService } from '../services/ViralShareService';

const SalaryThermometerScreen = () => {
    const { getAccessToken, user } = useAuth();
    const navigation = useNavigation();
    const viewShotRef = useRef(null);

    // Auto-fill logic with fallbacks for different user structure shapes
    const initialFederalEntity =
        user?.workerData?.laborData?.federalEntity ||
        user?.workerProfile?.federalEntity ||
        user?.federalEntity ||
        '';

    const initialOccupation =
        user?.workerData?.laborData?.occupation ||
        user?.workerProfile?.occupation ||
        user?.occupation ||
        '';

    const [occupation, setOccupation] = useState(initialOccupation);
    const [federalEntity, setFederalEntity] = useState(initialFederalEntity);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleCalculate = async () => {
        if (!occupation || !federalEntity) {
            Alert.alert('Faltan datos', 'Ingresa tu puesto y estado para comparar.');
            return;
        }

        setIsLoading(true);
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/worker-profile/benchmark?occupation=${occupation}&federalEntity=${federalEntity}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);

                // TRACK VIRAL VIEW
                AnalyticsService.logEvent('salary_comparison_view', {
                    occupation: occupation,
                    federal_entity: federalEntity,
                    percentile: data.percentile,
                    difference: data.differencePercentage,
                    worker_id: user?.id
                });
            } else {
                Alert.alert('Error', 'No pudimos obtener datos del mercado.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await ViralShareService.shareView(viewShotRef);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo generar la imagen para compartir.');
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader
                title="Termómetro Salarial"
                subtitle="¿Ganas lo justo?"
                gradient={['#FF416C', '#FF4B2B']} // Aggressive Red
            />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Inputs */}
                <View style={styles.card}>
                    <Text style={styles.label}>Tu Puesto / Oficio</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Diseñador Gráfico"
                        value={occupation}
                        onChangeText={setOccupation}
                    />

                    <Text style={styles.label}>Estado / Ciudad</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. CDMX"
                        value={federalEntity}
                        onChangeText={setFederalEntity}
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleCalculate}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}> Comparar mi Sueldo </Text>
                        )}
                        <Ionicons name="flame" size={24} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                {/* Results Section */}
                {result && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>La Realidad del Mercado</Text>

                        <View style={styles.thermometerContainer}>
                            <View style={styles.barContainer}>
                                <Text style={styles.barLabel}>Promedio</Text>
                                <View style={[styles.bar, { height: 100, backgroundColor: '#95a5a6' }]}>
                                    <Text style={styles.barValue}>${result.averageSalary}</Text>
                                </View>
                            </View>

                            <View style={styles.barContainer}>
                                <Text style={styles.barLabel}>Tú</Text>
                                <View style={[
                                    styles.bar,
                                    {
                                        height: (result.mySalary / result.averageSalary) * 100,
                                        backgroundColor: result.percentile === 'low' ? '#e74c3c' : '#2ecc71'
                                    }
                                ]}>
                                    <Text style={styles.barValue}>${result.mySalary}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.verdictContainer}>
                            {result.percentile === 'low' ? (
                                <>
                                    <Ionicons name="warning" size={40} color="#e74c3c" />
                                    <Text style={styles.verdictText}>
                                        Estás {Math.abs(result.differencePercentage)}% ABAJO del mercado.
                                    </Text>
                                    <Text style={styles.verdictSub}>Te están pagando menos de lo justo.</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={40} color="#2ecc71" />
                                    <Text style={[styles.verdictText, { color: '#2ecc71' }]}>
                                        Estás {result.differencePercentage}% ARRIBA del mercado.
                                    </Text>
                                    <Text style={styles.verdictSub}>Tu sueldo es competitivo.</Text>
                                </>
                            )}
                        </View>

                        {/* VIRAL BUTTON */}
                        {result.percentile === 'low' && (
                            <TouchableOpacity style={styles.viralButton} onPress={handleShare}>
                                <LinearGradient
                                    colors={['#e74c3c', '#c0392b']}
                                    style={styles.viralGradient}
                                >
                                    <Ionicons name="share-social" size={24} color="#fff" />
                                    <Text style={styles.viralButtonText}>COMPARTIR MI INDIGNACIÓN</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                    </View>
                )}
            </ScrollView>

            {/* HIDDEN INFOGRAPHIC TEMPLATE */}
            {result && (
                <View
                    collapsable={false}
                    ref={viewShotRef}
                    style={{
                        position: 'absolute',
                        left: -9999, // Hide off-screen
                        width: 375,
                        height: 667,
                        backgroundColor: '#1a1a2e',
                    }}
                >
                    <LinearGradient
                        colors={['#e74c3c', '#c0392b', '#1a1a2e']}
                        style={{ flex: 1, padding: 30, justifyContent: 'space-between' }}
                    >
                        <View style={{ alignItems: 'center', marginTop: 20 }}>
                            <Image
                                source={require('../../assets/images/app_logo.png')}
                                style={{ width: 80, height: 80, resizeMode: 'contain', marginBottom: 10 }}
                            />
                            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 10 }}>
                                ¡INDIGNANTE!
                            </Text>
                            <Text style={{ fontSize: 18, color: '#ecf0f1', textAlign: 'center', marginTop: 5, opacity: 0.8 }}>
                                REALIDAD SALARIAL EN MÉXICO
                            </Text>
                        </View>

                        <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 20 }}>
                            <Text style={{ color: '#bdc3c7', fontSize: 14, textTransform: 'uppercase', marginBottom: 5 }}>
                                PUESTO: {occupation}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 15 }}>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Promedio:</Text>
                                    <Text style={{ color: '#2ecc71', fontSize: 36, fontWeight: 'bold' }}>${result.averageSalary}</Text>
                                </View>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Yo gano:</Text>
                                    <Text style={{ color: '#e74c3c', fontSize: 36, fontWeight: 'bold' }}>${result.mySalary}</Text>
                                </View>
                            </View>
                            <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 }} />
                            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 10 }}>
                                {Math.abs(result.differencePercentage)}% MENOS
                            </Text>
                            <Text style={{ color: '#bdc3c7', fontSize: 16, textAlign: 'center' }}>
                                que el promedio en {federalEntity}
                            </Text>
                        </View>

                        <View style={{ alignItems: 'center', marginBottom: 40 }}>
                            <Text style={{ color: '#fff', fontSize: 14, opacity: 0.6 }}>¿Te pagan lo justo?</Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 5 }}>
                                Revísalo en Aliado Laboral
                            </Text>
                        </View>
                    </LinearGradient>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f1f2f6',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#FF4B2B',
        flexDirection: 'row',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        elevation: 5,
        alignItems: 'center',
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 30,
    },
    thermometerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        height: 200,
        gap: 40,
        marginBottom: 30,
    },
    barContainer: {
        alignItems: 'center',
    },
    bar: {
        width: 60,
        borderRadius: 10,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 10,
    },
    barLabel: {
        marginTop: 10,
        fontWeight: 'bold',
        color: '#7f8c8d',
    },
    barValue: {
        color: '#fff',
        fontWeight: 'bold',
    },
    verdictContainer: {
        alignItems: 'center',
        marginVertical: 20,
        padding: 20,
        backgroundColor: '#fdf0ed',
        borderRadius: 15,
        width: '100%',
    },
    verdictText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e74c3c',
        marginTop: 10,
        textAlign: 'center',
    },
    verdictSub: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 5,
    },
    viralButton: {
        marginTop: 20,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    viralGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    viralButtonText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    }
});

export default SalaryThermometerScreen;

