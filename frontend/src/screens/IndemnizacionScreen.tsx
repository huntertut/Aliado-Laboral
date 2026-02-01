import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

type Section = 'main' | 'types' | 'calc' | 'examples' | 'simulator' | 'pro_form' | 'pro_confirm';

const IndemnizacionScreen = () => {
    const navigation = useNavigation();
    const [currentSection, setCurrentSection] = useState<Section>('main');
    const [salary, setSalary] = useState('600');
    const [simScenario, setSimScenario] = useState<'low' | 'mod' | 'high' | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        incapacityType: 'No estoy seguro',
        hasDictum: 'No',
        salary: '',
        contactMethod: 'WhatsApp'
    });

    const renderHeader = (title: string) => (
        <LinearGradient colors={[AppTheme.colors.primary, '#3742fa']} style={styles.header}>
            <TouchableOpacity onPress={() => currentSection === 'main' ? navigation.goBack() : setCurrentSection('main')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={{ width: 24 }} />
        </LinearGradient>
    );

    const renderMain = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={24} color="#c0392b" />
                <Text style={styles.warningText}>
                    Esta sección es solo informativa. Las indemnizaciones reales las determina el IMSS y los tribunales laborales. Para una evaluación experta, utiliza nuestro servicio Pro.
                </Text>
            </View>

            <Text style={styles.introText}>
                Si sufriste un accidente o enfermedad relacionada con tu trabajo, tienes derecho a una indemnización. Conoce los conceptos básicos aquí.
            </Text>

            {/* Pro Actions */}
            <TouchableOpacity
                style={styles.proButton}
                onPress={() => setCurrentSection('pro_form')}
            >
                <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.proGradient}>
                    <Ionicons name="shield-checkmark" size={32} color="#fff" />
                    <View style={{ marginLeft: 15, flex: 1 }}>
                        <Text style={styles.proButtonTitle}>Hablar con Asesor Experto</Text>
                        <Text style={styles.proButtonSubtitle}>Revisión profesional para maximizar tu indemnización.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.basicButton}
                onPress={() => setCurrentSection('types')}
            >
                <Text style={styles.basicButtonText}>Entender Conceptos Básicos</Text>
            </TouchableOpacity>

            {/* Navigation Cards */}
            <Text style={styles.sectionTitle}>Explora el Módulo</Text>

            <View style={styles.grid}>
                <TouchableOpacity style={styles.navCard} onPress={() => setCurrentSection('types')}>
                    <Ionicons name="medkit" size={30} color="#3498db" />
                    <Text style={styles.navCardText}>Tipos de Incapacidad</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navCard} onPress={() => setCurrentSection('calc')}>
                    <Ionicons name="calculator" size={30} color="#9b59b6" />
                    <Text style={styles.navCardText}>¿Cómo se Calcula?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navCard} onPress={() => setCurrentSection('examples')}>
                    <Ionicons name="images" size={30} color="#e67e22" />
                    <Text style={styles.navCardText}>Ejemplos de Lesiones</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navCard} onPress={() => setCurrentSection('simulator')}>
                    <Ionicons name="pulse" size={30} color="#2ecc71" />
                    <Text style={styles.navCardText}>Simulador Ilustrativo</Text>
                </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );

    const renderTypes = () => (
        <ScrollView style={styles.content}>
            <Text style={styles.pageTitle}>Tipos de Incapacidad</Text>

            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>1. Incapacidad Temporal</Text>
                <Text style={styles.cardText}>Imposibilidad para trabajar por un tiempo limitado.</Text>
                <Text style={styles.cardHighlight}>Recibes: Subsidio (100% salario registrado) mientras dure la recuperación.</Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>2. Permanente Parcial</Text>
                <Text style={styles.cardText}>Disminución definitiva de tus facultades, pero puedes seguir trabajando en otras cosas.</Text>
                <Text style={styles.cardHighlight}>Recibes: Indemnización basada en el % de afectación.</Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>3. Permanente Total</Text>
                <Text style={styles.cardText}>Imposibilidad de realizar cualquier trabajo por el resto de la vida.</Text>
                <Text style={styles.cardHighlight}>Recibes: Indemnización (1,095 días) + Pensión mensual.</Text>
            </View>

            <View style={styles.ctaBox}>
                <Text style={styles.ctaText}>¿Crees que tu caso es una incapacidad permanente?</Text>
                <TouchableOpacity style={styles.ctaButton} onPress={() => setCurrentSection('pro_form')}>
                    <Text style={styles.ctaButtonText}>Solicitar Revisión de Caso</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderCalc = () => (
        <ScrollView style={styles.content}>
            <Text style={styles.pageTitle}>Lógica del Cálculo</Text>
            <Text style={styles.introText}>El cálculo se basa en 3 factores principales:</Text>

            <View style={styles.stepCard}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Salario Base de Cotización</Text>
                    <Text style={styles.stepText}>Promedio de tus últimos salarios reportados al IMSS.</Text>
                </View>
            </View>

            <View style={styles.stepCard}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Días de Ley (1,095)</Text>
                    <Text style={styles.stepText}>Monto máximo de referencia para incapacidades permanentes.</Text>
                </View>
            </View>

            <View style={styles.stepCard}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>3</Text></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Tabla de Valuación</Text>
                    <Text style={styles.stepText}>Porcentaje de afectación asignado por el médico según la lesión.</Text>
                </View>
            </View>

            <View style={styles.ctaBox}>
                <Text style={styles.ctaText}>Un error en el cálculo puede costarte miles de pesos.</Text>
                <TouchableOpacity style={styles.ctaButton} onPress={() => setCurrentSection('pro_form')}>
                    <Text style={styles.ctaButtonText}>Deja que un Experto Calcule</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderExamples = () => (
        <ScrollView style={styles.content}>
            <Text style={styles.pageTitle}>Ejemplos de Lesiones</Text>

            <View style={styles.exampleCard}>
                <Ionicons name="eye" size={40} color="#333" style={{ marginBottom: 10 }} />
                <Text style={styles.exampleTitle}>Pérdida de vista en un ojo</Text>
                <View style={[styles.badge, { backgroundColor: '#e74c3c' }]}><Text style={styles.badgeText}>Afectación Alta</Text></View>
                <Text style={styles.exampleText}>Se calcula con un porcentaje alto sobre la incapacidad total.</Text>
            </View>

            <View style={styles.exampleCard}>
                <Ionicons name="hand-left" size={40} color="#333" style={{ marginBottom: 10 }} />
                <Text style={styles.exampleTitle}>Pérdida de falange (meñique)</Text>
                <View style={[styles.badge, { backgroundColor: '#f1c40f' }]}><Text style={styles.badgeText}>Afectación Baja</Text></View>
                <Text style={styles.exampleText}>Corresponde a un porcentaje menor según la tabla oficial.</Text>
            </View>

            <View style={styles.exampleCard}>
                <Ionicons name="body" size={40} color="#333" style={{ marginBottom: 10 }} />
                <Text style={styles.exampleTitle}>Fractura de pierna (Recuperable)</Text>
                <View style={[styles.badge, { backgroundColor: '#3498db' }]}><Text style={styles.badgeText}>Temporal</Text></View>
                <Text style={styles.exampleText}>Subsidio durante recuperación. Si hay secuelas, se reevalúa.</Text>
            </View>
        </ScrollView>
    );

    const renderSimulator = () => {
        const salaryNum = parseFloat(salary) || 0;
        const maxIndemnizacion = salaryNum * 1095;

        let percentage = 0;
        let label = '';
        if (simScenario === 'low') { percentage = 0.05; label = 'Baja (5%)'; }
        if (simScenario === 'mod') { percentage = 0.25; label = 'Moderada (25%)'; }
        if (simScenario === 'high') { percentage = 0.70; label = 'Alta (70%)'; }

        const result = maxIndemnizacion * percentage;

        return (
            <ScrollView style={styles.content}>
                <View style={styles.warningBox}>
                    <Text style={[styles.warningText, { fontWeight: 'bold' }]}>ADVERTENCIA: CÁLCULO HIPOTÉTICO</Text>
                    <Text style={styles.warningText}>No es el monto real. Solo el IMSS determina el porcentaje oficial.</Text>
                </View>

                <Text style={styles.label}>1. Salario Diario Base ($)</Text>
                <TextInput
                    style={styles.input}
                    value={salary}
                    onChangeText={setSalary}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>2. Escenario de Ejemplo</Text>
                <View style={styles.scenarioContainer}>
                    <TouchableOpacity
                        style={[styles.scenarioBtn, simScenario === 'low' && styles.scenarioBtnActive]}
                        onPress={() => setSimScenario('low')}
                    >
                        <Text style={[styles.scenarioText, simScenario === 'low' && styles.scenarioTextActive]}>Baja</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.scenarioBtn, simScenario === 'mod' && styles.scenarioBtnActive]}
                        onPress={() => setSimScenario('mod')}
                    >
                        <Text style={[styles.scenarioText, simScenario === 'mod' && styles.scenarioTextActive]}>Moderada</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.scenarioBtn, simScenario === 'high' && styles.scenarioBtnActive]}
                        onPress={() => setSimScenario('high')}
                    >
                        <Text style={[styles.scenarioText, simScenario === 'high' && styles.scenarioTextActive]}>Alta</Text>
                    </TouchableOpacity>
                </View>

                {simScenario && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultLabel}>Resultado Ilustrativo ({label}):</Text>
                        <Text style={styles.resultAmount}>${result.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
                        <Text style={styles.formulaText}>
                            ${salaryNum} x 1,095 días x {percentage * 100}%
                        </Text>
                    </View>
                )}

                <View style={styles.ctaBox}>
                    <Text style={styles.ctaText}>El monto real depende de una negociación experta.</Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={() => setCurrentSection('pro_form')}>
                        <Text style={styles.ctaButtonText}>Obtener Cotización Real</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderProForm = () => (
        <ScrollView style={styles.content}>
            <Text style={styles.pageTitle}>Solicita Asesoría Experta</Text>
            <Text style={styles.introText}>Nuestros especialistas revisarán tu caso confidencialmente.</Text>

            <Text style={styles.label}>Describe tu accidente/enfermedad:</Text>
            <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                placeholder="Breve descripción..."
                value={formData.description}
                onChangeText={(t) => setFormData({ ...formData, description: t })}
            />

            <Text style={styles.label}>Tipo de Incapacidad:</Text>
            <View style={styles.pickerContainer}>
                {['No estoy seguro', 'Temporal', 'Permanente Parcial', 'Permanente Total'].map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.pickerOption, formData.incapacityType === opt && styles.pickerOptionActive]}
                        onPress={() => setFormData({ ...formData, incapacityType: opt })}
                    >
                        <Text style={[styles.pickerText, formData.incapacityType === opt && styles.pickerTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Salario Diario Aprox:</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="$0.00"
                value={formData.salary}
                onChangeText={(t) => setFormData({ ...formData, salary: t })}
            />

            <Text style={styles.label}>Contactarme por:</Text>
            <View style={styles.pickerContainer}>
                {['WhatsApp', 'Llamada', 'Correo'].map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.pickerOption, formData.contactMethod === opt && styles.pickerOptionActive]}
                        onPress={() => setFormData({ ...formData, contactMethod: opt })}
                    >
                        <Text style={[styles.pickerText, formData.contactMethod === opt && styles.pickerTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={() => setCurrentSection('pro_confirm')}>
                <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderProConfirm = () => (
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="checkmark-circle" size={80} color="#27ae60" />
            <Text style={styles.confirmTitle}>¡Solicitud Recibida!</Text>
            <Text style={styles.confirmText}>
                Un asesor experto te contactará vía {formData.contactMethod} en menos de 24 horas hábiles.
            </Text>
            <View style={styles.tipsBox}>
                <Text style={styles.tipsTitle}>Mientras esperas:</Text>
                <Text style={styles.tipItem}>• Reúne tus recetas y dictámenes.</Text>
                <Text style={styles.tipItem}>• No firmes nada sin asesoría.</Text>
            </View>
            <TouchableOpacity style={styles.basicButton} onPress={() => {
                setFormData({ description: '', incapacityType: 'No estoy seguro', hasDictum: 'No', salary: '', contactMethod: 'WhatsApp' });
                setCurrentSection('main');
            }}>
                <Text style={styles.basicButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader('Indemnización Riesgos')}
            {currentSection === 'main' && renderMain()}
            {currentSection === 'types' && renderTypes()}
            {currentSection === 'calc' && renderCalc()}
            {currentSection === 'examples' && renderExamples()}
            {currentSection === 'simulator' && renderSimulator()}
            {currentSection === 'pro_form' && renderProForm()}
            {currentSection === 'pro_confirm' && renderProConfirm()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    header: {
        paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        flexDirection: 'row', alignItems: 'center',
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { flex: 1, padding: 20 },

    // Main
    warningBox: {
        flexDirection: 'row', backgroundColor: '#fadbd8', padding: 15,
        borderRadius: 10, marginBottom: 20, alignItems: 'center'
    },
    warningText: { flex: 1, marginLeft: 10, color: '#c0392b', fontSize: 13 },
    introText: { fontSize: 16, color: '#555', marginBottom: 20, lineHeight: 24 },

    proButton: { marginBottom: 15, borderRadius: 15, elevation: 5 },
    proGradient: { flexDirection: 'row', padding: 20, borderRadius: 15, alignItems: 'center' },
    proButtonTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    proButtonSubtitle: { fontSize: 12, color: '#fff', opacity: 0.9 },

    basicButton: { padding: 15, alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 10, marginBottom: 25 },
    basicButtonText: { color: '#333', fontWeight: '600' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    navCard: {
        width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 15,
        alignItems: 'center', marginBottom: 15, elevation: 2
    },
    navCardText: { marginTop: 10, textAlign: 'center', fontWeight: '600', color: '#555' },

    // Content Pages
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    infoCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: AppTheme.colors.primary, marginBottom: 5 },
    cardText: { fontSize: 15, color: '#555', marginBottom: 10 },
    cardHighlight: { fontSize: 14, color: '#27ae60', fontWeight: '600' },

    ctaBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#FFD700' },
    ctaText: { fontSize: 15, textAlign: 'center', marginBottom: 15, color: '#555' },
    ctaButton: { backgroundColor: '#FFD700', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
    ctaButtonText: { fontWeight: 'bold', color: '#333' },

    // Steps
    stepCard: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
    stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: AppTheme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    stepNum: { color: '#fff', fontWeight: 'bold' },
    stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    stepText: { fontSize: 14, color: '#666' },

    // Examples
    exampleCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center', elevation: 2 },
    exampleTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    exampleText: { textAlign: 'center', color: '#666' },

    // Simulator
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 10 },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    scenarioContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    scenarioBtn: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 2 },
    scenarioBtnActive: { backgroundColor: AppTheme.colors.primary, borderColor: AppTheme.colors.primary },
    scenarioText: { color: '#666' },
    scenarioTextActive: { color: '#fff', fontWeight: 'bold' },
    resultBox: { backgroundColor: '#e8f6f3', padding: 20, borderRadius: 15, marginTop: 20, alignItems: 'center' },
    resultLabel: { fontSize: 16, color: '#27ae60' },
    resultAmount: { fontSize: 32, fontWeight: 'bold', color: '#27ae60', marginVertical: 10 },
    formulaText: { fontSize: 12, color: '#7f8c8d' },

    // Form
    pickerContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    pickerOption: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, marginRight: 10, marginBottom: 10 },
    pickerOptionActive: { backgroundColor: AppTheme.colors.primary, borderColor: AppTheme.colors.primary },
    pickerText: { color: '#666' },
    pickerTextActive: { color: '#fff' },
    submitButton: { backgroundColor: '#27ae60', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // Confirm
    confirmTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
    confirmText: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 30 },
    tipsBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '100%', marginBottom: 30 },
    tipsTitle: { fontWeight: 'bold', marginBottom: 10 },
    tipItem: { marginBottom: 5, color: '#555' },
});

export default IndemnizacionScreen;

