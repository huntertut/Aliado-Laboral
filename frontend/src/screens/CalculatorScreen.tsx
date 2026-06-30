import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { calculateLaborBenefits } from '../utils/laborCalculations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import DatePickerModal from '../components/DatePickerModal';
import { LABOR_LAW_CONSTANTS, SEPARATION_REASONS } from '../config/constants';
import AppHeader from '../components/common/AppHeader';
import { ViralShareService } from '../services/ViralShareService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const CalculatorScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const resultsRef = useRef(null);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: General Data
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Step 2: Salary & Benefits
    const [monthlySalary, setMonthlySalary] = useState('');
    const [vacationDays, setVacationDays] = useState(String(LABOR_LAW_CONSTANTS.DEFAULT_VACATION_DAYS));
    const [vacationPremium, setVacationPremium] = useState(String(LABOR_LAW_CONSTANTS.DEFAULT_VACATION_PREMIUM));
    const [aguinaldoDays, setAguinaldoDays] = useState(String(LABOR_LAW_CONSTANTS.DEFAULT_AGUINALDO_DAYS));
    const [hasPendingSalary, setHasPendingSalary] = useState(false);
    const [pendingDays, setPendingDays] = useState('');

    // Step 3: Separation Reason
    const [separationReason, setSeparationReason] = useState('');

    // Step 4: Results
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        loadProfileData();
    }, []);

    const exportToPDF = async () => {
        if (!results) return;
        try {
            const htmlContent = `
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #2c3e50;
                        margin: 0;
                        padding: 30px;
                        line-height: 1.4;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #1e3799;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1e3799;
                        margin: 0;
                    }
                    .subtitle {
                        font-size: 14px;
                        color: #7f8c8d;
                        margin-top: 5px;
                    }
                    .meta-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .meta-table td {
                        padding: 6px 10px;
                        border: 1px solid #e0e0e0;
                        font-size: 12px;
                    }
                    .meta-table td.label {
                        font-weight: bold;
                        background-color: #f8f9fa;
                        width: 25%;
                    }
                    .section-title {
                        font-size: 14px;
                        font-weight: bold;
                        color: #1e3799;
                        border-bottom: 1px solid #1e3799;
                        padding-bottom: 3px;
                        margin-top: 20px;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                    }
                    .data-table th, .data-table td {
                        padding: 8px 10px;
                        text-align: left;
                        font-size: 12px;
                    }
                    .data-table th {
                        background-color: #f8f9fa;
                        border-bottom: 2px solid #e0e0e0;
                        font-weight: bold;
                    }
                    .data-table td {
                        border-bottom: 1px solid #eee;
                    }
                    .data-table td.amount {
                        text-align: right;
                        font-weight: bold;
                    }
                    .total-box {
                        background-color: #1e3799;
                        color: white;
                        padding: 12px 15px;
                        border-radius: 6px;
                        text-align: right;
                        margin-top: 20px;
                    }
                    .total-title {
                        font-size: 11px;
                        opacity: 0.9;
                    }
                    .total-amount {
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .warning-card {
                        background-color: #fff9e6;
                        border-left: 5px solid #f39c12;
                        padding: 12px;
                        margin-top: 25px;
                        border-radius: 4px;
                    }
                    .warning-title {
                        font-weight: bold;
                        color: #b7791f;
                        margin-bottom: 4px;
                        font-size: 12px;
                    }
                    .warning-text {
                        font-size: 11px;
                        color: #744210;
                        line-height: 1.4;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        font-size: 10px;
                        color: #95a5a6;
                        border-top: 1px solid #eee;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Aliado Laboral</div>
                    <div class="subtitle">Reporte Detallado de Cálculo de Finiquito y Liquidación</div>
                </div>
                
                <table class="meta-table">
                    <tr>
                        <td class="label">Fecha de Ingreso:</td>
                        <td>${startDate}</td>
                        <td class="label">Fecha de Salida:</td>
                        <td>${endDate}</td>
                    </tr>
                    <tr>
                        <td class="label">Antigüedad:</td>
                        <td>${results.yearsWorked} años</td>
                        <td class="label">Sueldo Mensual Bruto:</td>
                        <td>$${parseFloat(monthlySalary).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label">Sueldo Diario:</td>
                        <td>$${results.dailySalary.toFixed(2)}</td>
                        <td class="label">Motivo de Separación:</td>
                        <td>${SEPARATION_REASONS.find((r: any) => r.id === separationReason)?.label || 'No especificado'}</td>
                    </tr>
                </table>

                <div class="section-title">1. Percepciones por Finiquito (Derechos Irrenunciables)</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Descripción</th>
                            <th style="text-align: right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.pendingSalary > 0 ? `
                        <tr>
                            <td>Sueldo Pendiente</td>
                            <td>Días trabajados no pagados (${pendingDays || 0} días)</td>
                            <td class="amount">$${results.pendingSalary.toFixed(2)}</td>
                        </tr>` : ''}
                        <tr>
                            <td>Aguinaldo Proporcional</td>
                            <td>Parte proporcional del año trabajado</td>
                            <td class="amount">$${results.aguinaldo.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Vacaciones Proporcionales</td>
                            <td>Días generados en el período</td>
                            <td class="amount">$${results.vacationPay.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Prima Vacacional</td>
                            <td>${vacationPremium}% sobre vacaciones proporcionales</td>
                            <td class="amount">$${results.primaVacacional.toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight: bold; background-color: #fafafa;">
                            <td colspan="2">Subtotal Finiquito</td>
                            <td class="amount" style="color: #1e3799;">$${results.finiquitoTotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                ${results.hasIndemnification && results.liquidacionTotal > 0 ? `
                <div class="section-title">2. Indemnizaciones Adicionales (Liquidación)</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Descripción</th>
                            <th style="text-align: right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Indemnización Constitucional</td>
                            <td>3 meses de salario + 20 días por año</td>
                            <td class="amount">$${results.indemnizacion.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Prima de Antigüedad</td>
                            <td>12 días de salario por año trabajado</td>
                            <td class="amount">$${results.seniorityPremium.toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight: bold; background-color: #fafafa;">
                            <td colspan="2">Subtotal Liquidación</td>
                            <td class="amount" style="color: #1e3799;">$${results.liquidacionTotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>` : ''}

                <div class="section-title">3. Deducciones Estimadas</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Descripción</th>
                            <th style="text-align: right; color: #e74c3c;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>ISR (Impuesto Sobre la Renta)</td>
                            <td>Retención estimada de impuestos por ley</td>
                            <td class="amount" style="color: #e74c3c;">-$${results.estimatedISR.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="total-box">
                    <div class="total-title">TOTAL NETO A RECIBIR (ESTIMADO)</div>
                    <div class="total-amount">$${results.totalNet.toFixed(2)}</div>
                </div>

                <div class="warning-card">
                    <div class="warning-title">⚠️ ATENCIÓN: TU DEFENSA LEGAL ES CRUCIAL</div>
                    <div class="warning-text">
                        Este cálculo es una estimación matemática basada en los mínimos de la Ley Federal del Trabajo. 
                        Sin embargo, <strong>los patrones suelen ofrecer acuerdos muy por debajo de la ley o presionar para firmar renuncias voluntarias</strong>. 
                        Un mal acuerdo o una firma apresurada puede hacerte perder hasta el 50% o más de lo que legítimamente te corresponde. 
                        Te recomendamos encarecidamente <strong>no firmar ningún documento, convenio o renuncia</strong> sin antes consultar a uno de nuestros abogados laboralistas verificados. 
                        Ellos evaluarán tu caso particular y te defenderán para asegurar que recibas cada centavo de tu liquidación.
                    </div>
                </div>

                <div class="footer">
                    Documento generado a través de Aliado Laboral App. Este documento es de carácter informativo.<br>
                    &copy; ${new Date().getFullYear()} Aliado Laboral. Todos los derechos reservados.
                </div>
            </body>
            </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartir Reporte de Finiquito', UTI: 'com.adobe.pdf' });
        } catch (error) {
            console.error('Error al exportar PDF:', error);
            Alert.alert('Error', 'No se pudo generar el reporte PDF en este momento. Inténtalo de nuevo.');
        }
    };

    const loadProfileData = async () => {
        try {
            const savedProfile = await AsyncStorage.getItem(`user_profile_${user?.uid}`);
            if (savedProfile) {
                const data = JSON.parse(savedProfile);
                if (data.startDate) setStartDate(data.startDate);
                if (data.monthlySalary) {
                    setMonthlySalary(data.monthlySalary);
                } else if (data.dailySalary) {
                    // Convert daily to monthly estimate
                    const monthly = parseFloat(data.dailySalary) * 30.4;
                    setMonthlySalary(monthly.toFixed(2));
                }
            }
        } catch (e) {
            console.log('No profile data found');
        }
    };

    const calculateResults = () => {
        if (!startDate || !endDate || !monthlySalary) {
            Alert.alert('Error', 'Por favor completa todos los campos requeridos');
            return;
        }

        const calculated = calculateLaborBenefits({
            startDate,
            endDate,
            monthlySalary,
            vacationDays,
            vacationPremium,
            aguinaldoDays,
            hasPendingSalary,
            pendingDays,
            separationReason
        });

        if (!calculated) {
            Alert.alert('Error', 'Fechas o datos inválidos');
            return;
        }

        setResults(calculated);
        setCurrentStep(4);
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map(step => (
                <View key={step} style={styles.progressStep}>
                    <View style={[
                        styles.progressCircle,
                        currentStep >= step && styles.progressCircleActive
                    ]}>
                        <Text style={[
                            styles.progressNumber,
                            currentStep >= step && styles.progressNumberActive
                        ]}>{step}</Text>
                    </View>
                    {step < 4 && (
                        <View style={[
                            styles.progressLine,
                            currentStep > step && styles.progressLineActive
                        ]} />
                    )}
                </View>
            ))}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Paso 1: Fechas de Trabajo</Text>
            <Text style={styles.stepDescription}>Indica el período que trabajaste</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha de Ingreso</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                    <Text style={startDate ? styles.dateText : styles.datePlaceholder}>
                        {startDate || 'Seleccionar fecha'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={AppTheme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha de Baja</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                    <Text style={endDate ? styles.dateText : styles.datePlaceholder}>
                        {endDate || 'Seleccionar fecha'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={AppTheme.colors.primary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.nextButton, (!startDate || !endDate) && styles.nextButtonDisabled]}
                onPress={() => setCurrentStep(2)}
                disabled={!startDate || !endDate}
            >
                <Text style={styles.nextButtonText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Paso 2: Salario y Prestaciones</Text>
            <Text style={styles.stepDescription}>Confirma o ajusta tus datos salariales</Text>

            <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>Sueldo Mensual Bruto</Text>
                </View>
                <TextInput
                    style={styles.input}
                    value={monthlySalary}
                    onChangeText={(text) => {
                        // Only allow numbers and at most one decimal point
                        const filtered = text.replace(/[^0-9.]/g, '');
                        // Limit to 10 characters (e.g. 999999.99)
                        if (filtered.length <= 10) {
                            setMonthlySalary(filtered);
                        }
                    }}
                    keyboardType="numeric"
                    placeholder="Ej. 10000"
                    maxLength={10}
                />
                {monthlySalary && (
                    <Text style={styles.helper}>
                        Salario diario: ${(parseFloat(monthlySalary) / 30.4).toFixed(2)}
                    </Text>
                )}
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Días de Vacaciones</Text>
                    <TextInput
                        style={styles.input}
                        value={vacationDays}
                        onChangeText={setVacationDays}
                        keyboardType="numeric"
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Prima Vacacional (%)</Text>
                    <TextInput
                        style={styles.input}
                        value={vacationPremium}
                        onChangeText={setVacationPremium}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Días de Aguinaldo</Text>
                <TextInput
                    style={styles.input}
                    value={aguinaldoDays}
                    onChangeText={setAguinaldoDays}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.checkboxContainer}>
                <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setHasPendingSalary(!hasPendingSalary)}
                >
                    <Ionicons
                        name={hasPendingSalary ? "checkbox" : "square-outline"}
                        size={24}
                        color={AppTheme.colors.primary}
                    />
                    <Text style={styles.checkboxLabel}>Tengo días de sueldo pendientes</Text>
                </TouchableOpacity>
            </View>

            {hasPendingSalary && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Número de días pendientes</Text>
                    <TextInput
                        style={styles.input}
                        value={pendingDays}
                        onChangeText={(text) => {
                            // Only allow numbers, max 3 digits (up to 365 days)
                            const filtered = text.replace(/[^0-9]/g, '');
                            if (filtered.length <= 3) {
                                setPendingDays(filtered);
                            }
                        }}
                        keyboardType="numeric"
                        placeholder="Ej. 15"
                        maxLength={3}
                    />
                </View>
            )}

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(1)}>
                    <Ionicons name="arrow-back" size={20} color={AppTheme.colors.primary} />
                    <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextButton, !monthlySalary && styles.nextButtonDisabled]}
                    onPress={() => setCurrentStep(3)}
                    disabled={!monthlySalary}
                >
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Paso 3: Motivo de Separación</Text>
            <Text style={styles.stepDescription}>Esto determinará si tienes derecho a liquidación</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>¿Cuál fue el motivo?</Text>
                {SEPARATION_REASONS.map(reason => (
                    <TouchableOpacity
                        key={reason.id}
                        style={[
                            styles.radioOption,
                            separationReason === reason.id && styles.radioOptionSelected
                        ]}
                        onPress={() => setSeparationReason(reason.id)}
                    >
                        <Ionicons
                            name={separationReason === reason.id ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={AppTheme.colors.primary}
                        />
                        <Text style={styles.radioLabel}>{reason.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {separationReason === 'despido_injustificado' && (
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color={AppTheme.colors.primary} />
                    <Text style={styles.infoText}>
                        Al seleccionar esta opción, se incluirán las indemnizaciones por ley (liquidación).
                    </Text>
                </View>
            )}

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(2)}>
                    <Ionicons name="arrow-back" size={20} color={AppTheme.colors.primary} />
                    <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.calculateButton, !separationReason && styles.nextButtonDisabled]}
                    onPress={calculateResults}
                    disabled={!separationReason}
                >
                    <Text style={styles.calculateButtonText}>Calcular</Text>
                    <Ionicons name="calculator" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // Enable LayoutAnimation
    if (Platform.OS === 'android') {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }

    const startAnimation = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const nextStep = () => {
        startAnimation();
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        startAnimation();
        setCurrentStep(prev => prev - 1);
    };

    // Use wrappers for setters that affect layout
    const togglePendingSalary = () => {
        startAnimation();
        setHasPendingSalary(!hasPendingSalary);
    };

    const selectSeparationReason = (id: string) => {
        startAnimation();
        setSeparationReason(id);
    };

    // ... inside renderStep4 ...
    const renderStep4 = () => {
        if (!results) return null;

        return (
            <View
                style={styles.resultsContainer}
            >
                <Text style={styles.resultsTitle}>Resumen de Tu Finiquito y Liquidación</Text>
                <Text style={styles.resultsSubtitle}>Antigüedad: {results.yearsWorked} años</Text>

                {/* Finiquito Section */}
                <View style={styles.resultCard}>
                    <Text style={styles.sectionTitle}>1. Percepciones por Finiquito</Text>
                    <Text style={styles.sectionSubtitle}>Derechos devengados</Text>

                    {results.pendingSalary > 0 && (
                        <View style={styles.resultRow}>
                            <View style={styles.resultLabel}>
                                <Text style={styles.resultName}>Sueldo Pendiente</Text>
                                <Text style={styles.resultExplain}>Días trabajados no pagados</Text>
                            </View>
                            <Text style={styles.resultAmount}>${results.pendingSalary.toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={styles.resultRow}>
                        <View style={styles.resultLabel}>
                            <Text style={styles.resultName}>Aguinaldo Proporcional</Text>
                            <Text style={styles.resultExplain}>Parte del año trabajado</Text>
                        </View>
                        <Text style={styles.resultAmount}>${results.aguinaldo.toFixed(2)}</Text>
                    </View>

                    <View style={styles.resultRow}>
                        <View style={styles.resultLabel}>
                            <Text style={styles.resultName}>Vacaciones Proporcionales</Text>
                            <Text style={styles.resultExplain}>Días generados en el año</Text>
                        </View>
                        <Text style={styles.resultAmount}>${results.vacationPay.toFixed(2)}</Text>
                    </View>

                    <View style={styles.resultRow}>
                        <View style={styles.resultLabel}>
                            <Text style={styles.resultName}>Prima Vacacional</Text>
                            <Text style={styles.resultExplain}>25% sobre vacaciones</Text>
                        </View>
                        <Text style={styles.resultAmount}>${results.primaVacacional.toFixed(2)}</Text>
                    </View>

                    <View style={styles.subtotalRow}>
                        <Text style={styles.subtotalLabel}>Subtotal Finiquito</Text>
                        <Text style={styles.subtotalAmount}>${results.finiquitoTotal.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Liquidation Section (Conditional) */}
                {results.hasIndemnification && results.liquidacionTotal > 0 && (
                    <View style={styles.resultCard}>
                        <Text style={styles.sectionTitle}>2. Indemnizaciones Adicionales (Liquidación)</Text>

                        <View style={styles.resultRow}>
                            <View style={styles.resultLabel}>
                                <Text style={styles.resultName}>Indemnización Constitucional</Text>
                                <Text style={styles.resultExplain}>3 meses + 20 días por año</Text>
                            </View>
                            <Text style={styles.resultAmount}>${results.indemnizacion.toFixed(2)}</Text>
                        </View>

                        <View style={styles.resultRow}>
                            <View style={styles.resultLabel}>
                                <Text style={styles.resultName}>Prima de Antigüedad</Text>
                                <Text style={styles.resultExplain}>12 días por año trabajado</Text>
                            </View>
                            <Text style={styles.resultAmount}>${results.seniorityPremium.toFixed(2)}</Text>
                        </View>

                        <View style={styles.subtotalRow}>
                            <Text style={styles.subtotalLabel}>Subtotal Liquidación</Text>
                            <Text style={styles.subtotalAmount}>${results.liquidacionTotal.toFixed(2)}</Text>
                        </View>
                    </View>
                )}

                {/* Deductions */}
                <View style={styles.resultCard}>
                    <Text style={styles.sectionTitle}>3. Deducciones Estimadas</Text>

                    <View style={styles.resultRow}>
                        <View style={styles.resultLabel}>
                            <Text style={styles.resultName}>ISR (Impuesto)</Text>
                            <Text style={styles.resultExplain}>Estimación aproximada</Text>
                        </View>
                        <Text style={[styles.resultAmount, { color: '#e74c3c' }]}>-${results.estimatedISR.toFixed(2)}</Text>
                    </View>

                    <View style={styles.warningBox}>
                        <Ionicons name="warning" size={20} color="#f39c12" />
                        <Text style={styles.warningText}>
                            El ISR es una estimación. El monto real puede variar.
                        </Text>
                    </View>
                </View>

                {/* Final Total */}
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>TOTAL A RECIBIR (ESTIMADO)</Text>
                    <Text style={styles.totalAmount}>${results.totalNet.toFixed(2)}</Text>
                </View>

                {/* Lawyer Conversion Card & PDF Export Button */}
                <View style={styles.conversionCard}>
                    <View style={styles.conversionHeader}>
                        <Ionicons name="shield-half-outline" size={24} color="#d35400" />
                        <Text style={styles.conversionTitle}>¡Protege tu dinero!</Text>
                    </View>
                    <Text style={styles.conversionText}>
                        Este cálculo es una estimación de ley. Sin embargo, para hacerlo realidad frente a tu patrón, requieres la defensa de un abogado especialista. Un mal acuerdo o una firma apresurada puede hacerte perder hasta el 50% de tu dinero.
                    </Text>
                    <Text style={styles.conversionHighlight}>
                        ¡No firmes ninguna renuncia o convenio sin asesoría legal!
                    </Text>
                    <TouchableOpacity
                        style={styles.conversionButton}
                        onPress={() => navigation.navigate('Lawyers' as never)}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                        <Text style={styles.conversionButtonText}>Contactar Abogado Verificado</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={exportToPDF}
                >
                    <Ionicons name="document-text-outline" size={22} color="#fff" />
                    <Text style={styles.pdfButtonText}>Exportar Cálculo a PDF</Text>
                </TouchableOpacity>

                {/* 📄 FASE 2: Legal Document Generation Button */}
                <TouchableOpacity
                    style={styles.legalDocButton}
                    onPress={() => (navigation as any).navigate('LegalDocuments')}
                >
                    <LinearGradient
                        colors={['#1a237e', '#3949ab']}
                        style={styles.legalDocButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                        <View style={styles.legalDocButtonContent}>
                            <Text style={styles.legalDocButtonTitle}>Generar Escrito Legal Formal</Text>
                            <Text style={styles.legalDocButtonSubtitle}>Documento listo para presentar ante tu patrón — desde $99 MXN</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Share Result Buttons */}
                <Text style={styles.shareLabel}>Compartir Resultado en Redes:</Text>
                <View style={styles.shareButtonsContainer}>
                    {/* Facebook Style */}
                    <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: '#1877F2', flex: 1, marginRight: 8 }]}
                        onPress={() => ViralShareService.shareView(resultsRef)}
                    >
                        <Ionicons name="logo-facebook" size={24} color="#fff" />
                        <Text style={styles.shareButtonText}>Facebook</Text>
                    </TouchableOpacity>

                    {/* Instagram Style */}
                    <TouchableOpacity
                        style={[styles.shareButton, { flex: 1, marginLeft: 8, padding: 0, overflow: 'hidden' }]}
                        onPress={() => ViralShareService.shareView(resultsRef)}
                    >
                        <LinearGradient
                            colors={['#833ab4', '#fd1d1d', '#fcb045']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.shareButton, { width: '100%', height: '100%', borderRadius: 0 }]} // Fill container
                        >
                            <Ionicons name="logo-instagram" size={24} color="#fff" />
                            <Text style={styles.shareButtonText}>Instagram</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Forum Post Button */}
                <TouchableOpacity
                    style={[styles.shareViralButton, { marginBottom: 15, backgroundColor: '#2e86de' }]} // Blue theme for Forum
                    onPress={() => {
                        const forumContent = `Hola comunidad, acabo de realizar mi cálculo de finiquito/liquidación y me gustaría saber su opinión.\n\n` +
                            `- **Antigüedad**: ${results.yearsWorked} años\n` +
                            `- **Motivo**: ${SEPARATION_REASONS.find(r => r.id === separationReason)?.label || 'No especificado'}\n` +
                            `- **Sueldo Diario**: $${results.dailySalary.toFixed(2)}\n\n` +
                            `**Resultados del cálculo:**\n` +
                            `- Finiquito: $${results.finiquitoTotal.toFixed(2)}\n` +
                            `- Liquidación (Indemnización): $${results.liquidacionTotal.toFixed(2)}\n` +
                            `- **Total Neto Estimado**: $${results.totalNet.toFixed(2)}\n\n` +
                            `¿Es correcto este cálculo? Agradezco sus comentarios.`;

                        (navigation as any).navigate('Forum', {
                            screen: 'CreatePost',
                            params: {
                                initialTitle: 'Duda sobre mi cálculo de liquidación',
                                initialContent: forumContent,
                                initialTopic: separationReason === 'despido_injustificado' ? 'despido' : 'renuncia'
                            }
                        });
                    }}
                >
                    <View style={styles.shareGradient}>
                        <Ionicons name="chatbubbles" size={24} color="#fff" />
                        <Text style={styles.shareViralText}>Preguntar en Foro</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        Este cálculo es una simulación basada en la información proporcionada y los mínimos legales vigentes.
                        No constituye un asesoramiento legal o fiscal. Te recomendamos consultar a un experto para un cálculo preciso.
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.newCalculationButton} onPress={() => {
                        setCurrentStep(1);
                        setResults(null);
                    }}>
                        <Ionicons name="refresh" size={20} color={AppTheme.colors.primary} />
                        <Text style={styles.newCalculationText}>Nuevo Cálculo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.lawyerButton}
                        onPress={() => navigation.navigate('Lawyers' as never)}
                    >
                        <Ionicons name="briefcase" size={20} color="#fff" />
                        <Text style={styles.lawyerButtonText}>Ver Directorio de Abogados</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.advisorButton}
                        onPress={() => navigation.navigate('Chat' as never)}
                    >
                        <Ionicons name="chatbubbles" size={20} color="#fff" />
                        <Text style={styles.advisorButtonText}>Asesor Virtual</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <AppHeader
                title="Calculadora de Finiquito"
                subtitle="Guía paso a paso"
                gradient={[AppTheme.colors.primary, '#3742fa']}
            />

            {currentStep < 4 && renderProgressBar()}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
            </ScrollView>

            {/* Hidden Infographic Template for Sharing (Certificate Style) */}
            <View
                style={[styles.infographicContainer, { position: 'absolute', zIndex: -10, opacity: 1, left: -9999 }]}
                collapsable={false}
                ref={resultsRef}
            >
                <LinearGradient
                    colors={['#1e3799', '#0c2461']}
                    style={{ flex: 1, padding: 30, justifyContent: 'space-between' }}
                >
                    {/* Header */}
                    <View style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingBottom: 20 }}>
                        {/* ADDED: Use actual logo instead of icon */}
                        <Image
                            source={require('../../assets/images/app_logo.png')}
                            style={{ width: 80, height: 80, resizeMode: 'contain' }}
                        />
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f1c40f', marginTop: 10, letterSpacing: 2 }}>
                            CERTIFICADO DE DERECHOS
                        </Text>
                        <Text style={{ fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 5 }}>
                            CÁLCULO LEGAL ESTIMADO
                        </Text>
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1, justifyContent: 'center' }}>

                        {/* Row 1: Tenure */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
                            <View>
                                <Text style={{ color: '#a4b0be', fontSize: 14 }}>ANTIGÜEDAD</Text>
                                <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{results ? results.yearsWorked : 0} Años</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: '#a4b0be', fontSize: 14 }}>SUELDO DIARIO</Text>
                                <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>${results ? results.dailySalary.toFixed(2) : '0.00'}</Text>
                            </View>
                        </View>

                        {/* Main Result: Finiquito */}
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 15, marginBottom: 20 }}>
                            <Text style={{ color: '#f1c40f', fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>DERECHOS IRRENUNCIABLES (FINIQUITO)</Text>
                            <Text style={{ color: '#fff', fontSize: 40, fontWeight: 'bold' }}>
                                ${results ? results.finiquitoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </Text>
                            <Text style={{ color: '#ecf0f1', fontSize: 12, marginTop: 5 }}>*Aguinaldo, Vacaciones y Prima Vacacional proporcionales.</Text>
                        </View>

                        {/* Secondary Result: Liquidación */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <Ionicons name="shield-checkmark" size={40} color="#2ecc71" />
                            <View>
                                <Text style={{ color: '#2ecc71', fontSize: 14, fontWeight: 'bold' }}>EN CASO DE DESPIDO INJUSTIFICADO</Text>
                                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                                    SUMAR: ${results ? results.liquidacionTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Generado por Aliado Laboral App • {new Date().toLocaleDateString()}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, opacity: 0.7 }}>
                            <Ionicons name="lock-closed" size={12} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 10, marginLeft: 5 }}>Cálculo privado y seguro</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <DatePickerModal
                visible={showStartPicker}
                onClose={() => setShowStartPicker(false)}
                onSelect={setStartDate}
                initialDate={startDate}
            />

            <DatePickerModal
                visible={showEndPicker}
                onClose={() => setShowEndPicker(false)}
                onSelect={setEndDate}
                initialDate={endDate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    // ... existing styles ...
    infographicContainer: {
        width: 375, // Standard width ~9:16 ratio base
        height: 667,
        backgroundColor: '#fff',
    },
    infoHeader: {
        paddingTop: 40,
        paddingBottom: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    infoHeaderText: {
        fontSize: 14,
        letterSpacing: 3,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    infoHeaderSub: {
        fontSize: 10,
        letterSpacing: 1,
        color: '#7f8c8d',
        marginTop: 5,
    },
    splitContainer: {
        flex: 1,
    },
    splitTop: {
        flex: 1,
        backgroundColor: '#dbe4eb', // Muted Grey-Blue
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    splitBottom: {
        flex: 1,
        backgroundColor: '#1e3799', // Corporate Deep Blue
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    divider: {
        height: 2,
        backgroundColor: '#bdc3c7',
        width: '80%',
        alignSelf: 'center',
    },
    scenarioLabelContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    scenarioTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
    },
    scenarioSubtitle: {
        fontSize: 14,
        color: '#576574',
    },
    scenarioTitleLight: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scenarioSubtitleLight: {
        fontSize: 14,
        color: '#a4b0be',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 10,
    },
    amountTextSmall: {
        fontSize: 32,
        fontWeight: '300',
        color: '#2c3e50',
    },
    amountTextLarge: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
    },
    scenarioContext: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 5,
        fontStyle: 'italic',
    },
    scenarioContextLight: {
        fontSize: 12,
        color: '#1dd1a1', // Teal accent
        marginTop: 5,
        fontStyle: 'italic',
    },
    infoFooter: {
        padding: 15,
        backgroundColor: '#222f3e',
        alignItems: 'center',
    },
    infoFooterText: {
        color: '#c8d6e5',
        fontSize: 10,
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    shareLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
    },
    shareButtonsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
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
        color: 'rgba(255,255,255,0.8)',
        marginTop: 3,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressCircleActive: {
        backgroundColor: AppTheme.colors.primary,
    },
    progressNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#999',
    },
    progressNumberActive: {
        color: '#fff',
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 5,
    },
    progressLineActive: {
        backgroundColor: AppTheme.colors.primary,
    },
    content: {
        flex: 1,
    },
    stepContainer: {
        padding: 20,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    stepDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    helper: {
        fontSize: 12,
        color: AppTheme.colors.primary,
        marginTop: 5,
    },
    dateButton: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    datePlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    row: {
        flexDirection: 'row',
    },
    checkboxContainer: {
        marginBottom: 15,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    radioOptionSelected: {
        borderColor: AppTheme.colors.primary,
        backgroundColor: 'rgba(30, 55, 153, 0.05)',
    },
    radioLabel: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(30, 55, 153, 0.1)',
        borderRadius: 10,
        padding: 15,
        marginTop: 10,
    },
    infoText: {
        fontSize: 13,
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: AppTheme.colors.primary,
    },
    backButtonText: {
        color: AppTheme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppTheme.colors.primary,
        padding: 15,
        borderRadius: 10,
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    nextButtonDisabled: {
        backgroundColor: '#ccc',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 5,
    },
    calculateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27ae60',
        padding: 15,
        borderRadius: 10,
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 5,
    },
    resultsContainer: {
        padding: 20,
    },
    resultsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        textAlign: 'center',
        marginBottom: 5,
    },
    resultsSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shareViralButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#FF512F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    shareGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    shareViralText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#999',
        marginBottom: 15,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    resultLabel: {
        flex: 1,
    },
    resultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    resultExplain: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    resultAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    subtotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#e0e0e0',
        marginTop: 5,
    },
    subtotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subtotalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#fff9e6',
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
    },
    warningText: {
        fontSize: 12,
        color: '#856404',
        marginLeft: 10,
        flex: 1,
    },
    totalCard: {
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        marginBottom: 15,
    },
    totalLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 10,
    },
    totalAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    disclaimer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    disclaimerText: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        lineHeight: 16,
    },
    newCalculationButton: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AppTheme.colors.primary,
        marginBottom: 10,
    },
    newCalculationText: {
        color: AppTheme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    actionButtonsContainer: {
        marginTop: 10,
    },
    lawyerButton: {
        backgroundColor: '#27ae60',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lawyerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    advisorButton: {
        backgroundColor: '#3498db',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    advisorButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    conversionCard: {
        backgroundColor: '#fffcf5',
        borderColor: '#f39c12',
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    conversionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    conversionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#d35400',
    },
    conversionText: {
        fontSize: 13,
        color: '#2c3e50',
        lineHeight: 18,
        marginBottom: 8,
    },
    conversionHighlight: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#c0392b',
        marginBottom: 12,
    },
    conversionButton: {
        backgroundColor: '#e67e22',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    conversionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    pdfButton: {
        backgroundColor: '#1e3799',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 8,
    },
    pdfButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    legalDocButton: {
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#1a237e',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    legalDocButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    legalDocButtonContent: {
        flex: 1,
    },
    legalDocButtonTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    legalDocButtonSubtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11.5,
    },
});

export default CalculatorScreen;
