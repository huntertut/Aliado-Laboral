import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Linking, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { AppTheme } from '../../theme/colors';
import { API_URL } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import DatePickerModal from '../../components/DatePickerModal';
import { ActivityIndicator } from 'react-native';
import PaywallModal from '../../components/PaywallModal'; // Added import

const UMA_VALUE = 108.57;
const AGUINALDO_DAYS = 15;
const VACATION_PRIME_RATE = 0.25;

const LiquidationCalculatorView = () => {
    const navigation = useNavigation();
    const { getAccessToken } = useAuth();

    // Form States
    const [dailySalary, setDailySalary] = useState('');
    const [startDate, setStartDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [separationType, setSeparationType] = useState<'resignation' | 'layoff'>('resignation');
    const [vacationsTaken, setVacationsTaken] = useState('0');

    // Modal States
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Result State
    const [results, setResults] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [paywallVisible, setPaywallVisible] = useState(false);

    const { user } = useAuth();
    // Correctly identify premium users by checking both subscriptionLevel and plan
    const isPremium = user?.subscriptionLevel === 'premium' || user?.plan === 'premium' || user?.plan === 'pro';
    const isBasic = !isPremium;
    console.log('[LiquidationCalculator] MOUNTED. user.subscriptionLevel:', user?.subscriptionLevel, 'user.plan:', user?.plan, 'isPremium:', isPremium, 'isBasic:', isBasic, 'paywallVisible:', paywallVisible);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);
    };

    const calculate = async () => {
        const salary = parseFloat(dailySalary);
        if (isNaN(salary) || salary <= 0) {
            Alert.alert('Error', 'Ingresa un salario diario válido');
            return;
        }

        try {
            setIsCalculating(true);
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/pyme-profile/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    dailySalary: salary,
                    startDate,
                    endDate,
                    separationType,
                    vacationsTaken: parseInt(vacationsTaken) || 0
                })
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data);
            } else {
                Alert.alert('Error', 'No se pudo realizar el cálculo');
            }
        } catch (error) {
            console.error('Calculation error:', error);
            Alert.alert('Error', 'Hubo un problema al conectar con el servidor');
        } finally {
            setIsCalculating(false);
        }
    };

    const shareResults = () => {
        if (isBasic) {
            setPaywallVisible(true);
            return;
        }

        if (!results) return;
        const message = `*Resumen de Liquidación LFT*\n\n` +
            `• Tipo: ${separationType === 'resignation' ? 'Finiquito' : 'Liquidación'}\n` +
            `• Antigüedad: ${results.seniority.years} años\n` +
            `• Aguinaldo: ${formatCurrency(results.breakdown.aguinaldo)}\n` +
            `• Vacaciones: ${formatCurrency(results.breakdown.vacations)}\n` +
            `• Prima Vacacional: ${formatCurrency(results.breakdown.vacationPrime)}\n` +
            `• Prima Antigüedad: ${formatCurrency(results.breakdown.seniorityPrime)}\n` +
            (results.breakdown.indemnity > 0 ? `• Indemnización: ${formatCurrency(results.breakdown.indemnity)}\n` : '') +
            `\n*TOTAL: ${formatCurrency(results.total)}*`;

        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#00897b" />

            <LinearGradient colors={['#00897b', '#26a69a']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calculadora Laboral</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>

                {isBasic && (
                    <View style={styles.warningBanner}>
                        <Ionicons name="information-circle" size={20} color="#e65100" />
                        <Text style={styles.warningText}>
                            Modo Informativo. Los resultados son estimados y no constituyen asesoría legal.
                        </Text>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Datos del Trabajador</Text>

                    <Text style={styles.label}>Salario Diario Integrado (SDI)</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencyIcon}>$</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="0.00"
                            value={dailySalary}
                            onChangeText={setDailySalary}
                        />
                    </View>

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.dateField} onPress={() => setShowStartPicker(true)}>
                            <Text style={styles.label}>Fecha Inicio</Text>
                            <View style={styles.dateInput}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <Text style={styles.dateText}>{moment(startDate).format('DD/MM/YYYY')}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dateField} onPress={() => setShowEndPicker(true)}>
                            <Text style={styles.label}>Fecha Fin</Text>
                            <View style={styles.dateInput}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <Text style={styles.dateText}>{moment(endDate).format('DD/MM/YYYY')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Tipo de Separación</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={[styles.radioButton, separationType === 'resignation' && styles.radioActive]}
                            onPress={() => setSeparationType('resignation')}
                        >
                            <Text style={[styles.radioText, separationType === 'resignation' && styles.radioTextActive]}>Renuncia</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.radioButton, separationType === 'layoff' && styles.radioActive]}
                            onPress={() => setSeparationType('layoff')}
                        >
                            <Text style={[styles.radioText, separationType === 'layoff' && styles.radioTextActive]}>Despido</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Días de Vacaciones Tomadas (Periodo actual)</Text>
                    <TextInput
                        style={styles.singleInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={vacationsTaken}
                        onChangeText={setVacationsTaken}
                    />

                    <TouchableOpacity
                        style={[styles.calcButton, isCalculating && { opacity: 0.7 }]}
                        onPress={calculate}
                        disabled={isCalculating}
                    >
                        {isCalculating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.calcButtonText}>Calcular Liquidación</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {results && (
                    <View style={[styles.card, styles.resultCard]}>
                        <Text style={styles.sectionTitle}>Resultado del Cálculo</Text>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Aguinaldo Proporcional</Text>
                            <Text style={styles.resultValue}>{formatCurrency(results.breakdown.aguinaldo)}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Vacaciones Proporcionales</Text>
                            <Text style={styles.resultValue}>{formatCurrency(results.breakdown.vacations)}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Prima Vacacional (25%)</Text>
                            <Text style={styles.resultValue}>{formatCurrency(results.breakdown.vacationPrime)}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Prima de Antigüedad</Text>
                            <Text style={styles.resultValue}>{formatCurrency(results.breakdown.seniorityPrime)}</Text>
                        </View>
                        {results.breakdown.indemnity > 0 && (
                            <View style={styles.resultRow}>
                                <Text style={[styles.resultLabel, { color: '#d32f2f' }]}>Indemnización (3 meses)</Text>
                                <Text style={[styles.resultValue, { color: '#d32f2f' }]}>{formatCurrency(results.breakdown.indemnity)}</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL ESTIMADO</Text>
                            <Text style={styles.totalValue}>{formatCurrency(results.total)}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.shareButton, isBasic && { backgroundColor: '#757575' }]}
                            onPress={shareResults}
                        >
                            <Ionicons name={isBasic ? "lock-closed" : "logo-whatsapp"} size={20} color="#fff" />
                            <Text style={styles.shareText}>
                                {isBasic ? "Guardar y Respaldar (Pro)" : "Compartir Desglose"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} featureName="Respaldo Legal de Cálculos" />

            <DatePickerModal
                visible={showStartPicker}
                initialDate={moment(startDate).format('DD/MM/YYYY')}
                onClose={() => setShowStartPicker(false)}
                onSelect={(d) => {
                    setStartDate(moment(d, 'DD/MM/YYYY').toDate());
                    setShowStartPicker(false);
                }}
            />
            <DatePickerModal
                visible={showEndPicker}
                initialDate={moment(endDate).format('DD/MM/YYYY')}
                onClose={() => setShowEndPicker(false)}
                onSelect={(d) => {
                    setEndDate(moment(d, 'DD/MM/YYYY').toDate());
                    setShowEndPicker(false);
                }}
            />
        </SafeAreaView>
    );

};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { padding: 20 },
    warningBanner: {
        flexDirection: 'row', backgroundColor: '#fff3e0', padding: 10, borderRadius: 8,
        marginBottom: 15, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#ef6c00'
    },
    warningText: { fontSize: 12, color: '#e65100', marginLeft: 10, flex: 1 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 3 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    label: { fontSize: 13, color: '#666', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    currencyIcon: { fontSize: 18, color: '#666', marginRight: 5 },
    input: { flex: 1, height: 50, fontSize: 18, fontWeight: 'bold', color: '#333' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    dateField: { width: '48%' },
    dateInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eee' },
    dateText: { marginLeft: 10, fontSize: 14, color: '#333' },
    radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    radioButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9' },
    radioActive: { backgroundColor: '#00897b', borderColor: '#00897b' },
    radioText: { color: '#666', fontWeight: 'bold' },
    radioTextActive: { color: '#fff' },
    singleInput: { backgroundColor: '#f9f9f9', borderRadius: 10, height: 50, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
    calcButton: { backgroundColor: '#00897b', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    calcButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultCard: { borderTopWidth: 5, borderTopColor: '#00897b' },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    resultLabel: { color: '#666', fontSize: 14 },
    resultValue: { fontWeight: '600', color: '#333' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#00897b' },
    totalValue: { fontSize: 24, fontWeight: 'bold', color: '#00897b' },
    shareButton: { flexDirection: 'row', backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 10 },
    shareText: { color: '#fff', fontWeight: 'bold' }
});

export default LiquidationCalculatorView;


