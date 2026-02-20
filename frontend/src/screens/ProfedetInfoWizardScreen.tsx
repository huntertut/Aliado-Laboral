
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../theme/colors';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/common/AppHeader';

const STEPS = ['Estado', 'Folio', 'Contacto', 'Documentos'];

const DOCUMENTS_LIST = [
    'Recibos de Nómina',
    'Contrato Laboral',
    'Identificación Oficial (INE/Pasaporte)',
    'Constancia de Situación Fiscal',
    'Baja del IMSS',
    'Carta de Despido',
    'Estado de Cuenta Afore',
    'Capturas de Mensajes/WhatsApp'
];

const ProfedetInfoWizardScreen = () => {
    const navigation = useNavigation();
    const { getAccessToken } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [profedetStage, setProfedetStage] = useState('');
    const [profedetCaseFile, setProfedetCaseFile] = useState('');
    const [initialContact, setInitialContact] = useState({ fullName: '', nss: '', employerName: '', visitDates: '' });
    const [documents, setDocuments] = useState<string[]>([]);
    const [otherDoc, setOtherDoc] = useState('');

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const toggleDocument = (doc: string) => {
        if (documents.includes(doc)) {
            setDocuments(documents.filter(d => d !== doc));
        } else {
            setDocuments([...documents, doc]);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const finalDocs = [...documents];
            if (otherDoc.trim()) finalDocs.push(otherDoc.trim());

            const payload = {
                profedetIsActive: true,
                profedetStage,
                profedetCaseFile,
                profedetInitialContact: initialContact,
                profedetDocuments: finalDocs
            };

            const response = await fetch(`${API_URL}/worker-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getAccessToken()}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                Alert.alert(
                    '¡Información Guardada!',
                    'Ahora puedes contactar a un abogado con tu expediente de PROFEDET listo.',
                    [
                        { text: 'Ir a Contactar Abogado', onPress: () => navigation.navigate('Lawyers' as never) }
                    ]
                );
            } else {
                throw new Error('Error saving');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo guardar la información. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <View>
                        <Text style={styles.stepTitle}>¿En qué fase estás?</Text>
                        <Text style={styles.stepDesc}>Selecciona la etapa actual de tu trámite en PROFEDET.</Text>

                        {['Asesoría Inicial', 'Solicitud de Conciliación', 'Audiencia Programada', 'Convenio', 'Demanda presentada'].map((stage) => (
                            <TouchableOpacity
                                key={stage}
                                style={[styles.optionCard, profedetStage === stage && styles.optionSelected]}
                                onPress={() => setProfedetStage(stage)}
                            >
                                <Ionicons
                                    name={profedetStage === stage ? "radio-button-on" : "radio-button-off"}
                                    size={24}
                                    color={profedetStage === stage ? AppTheme.colors.primary : '#666'}
                                />
                                <Text style={[styles.optionText, profedetStage === stage && styles.optionTextSelected]}>{stage}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            case 1:
                return (
                    <View>
                        <Text style={styles.stepTitle}>Número de Caso</Text>
                        <Text style={styles.stepDesc}>Proporciona el folio o número de expediente que te asignaron.</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Folio / Expediente</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. A-2023-1234"
                                value={profedetCaseFile}
                                onChangeText={setProfedetCaseFile}
                            />
                        </View>
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={24} color="#007bff" />
                            <Text style={styles.infoText}>Puedes encontrarlo en el documento que te dieron en tu primera cita o en el portal SINACOL.</Text>
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View>
                        <Text style={styles.stepTitle}>Datos de Registro</Text>
                        <Text style={styles.stepDesc}>Información proporcionada en tu visita.</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre Completo (como aparece en INE)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu nombre completo"
                                value={initialContact.fullName}
                                onChangeText={(t) => setInitialContact({ ...initialContact, fullName: t })}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>NSS (Número de Seguro Social)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="11 dígitos"
                                value={initialContact.nss}
                                onChangeText={(t) => setInitialContact({ ...initialContact, nss: t })}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre del Empleador Demandado</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Razón social o nombre comercial"
                                value={initialContact.employerName}
                                onChangeText={(t) => setInitialContact({ ...initialContact, employerName: t })}
                            />
                        </View>
                    </View>
                );
            case 3:
                return (
                    <View>
                        <Text style={styles.stepTitle}>Documentos Entregados</Text>
                        <Text style={styles.stepDesc}>¿Qué documentos ya entregaste a PROFEDET?</Text>

                        {DOCUMENTS_LIST.map((doc) => (
                            <TouchableOpacity
                                key={doc}
                                style={styles.checkboxItem}
                                onPress={() => toggleDocument(doc)}
                            >
                                <Ionicons
                                    name={documents.includes(doc) ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={documents.includes(doc) ? AppTheme.colors.primary : '#ccc'}
                                />
                                <Text style={styles.checkboxText}>{doc}</Text>
                            </TouchableOpacity>
                        ))}

                        <TextInput
                            style={[styles.input, { marginTop: 15 }]}
                            placeholder="Otro documento (especificar)"
                            value={otherDoc}
                            onChangeText={setOtherDoc}
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader
                title="Asistente PROFEDET"
                gradient={[AppTheme.colors.primary, '#3742fa']}
                onBack={handleBack}
            />
            {/* Native Header is used. Sub-content: */}
            <View style={{ paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <View style={styles.progressBar}>
                    {STEPS.map((step, index) => (
                        <View key={step} style={styles.progressStep}>
                            <View style={[styles.dot, index <= currentStep && { backgroundColor: AppTheme.colors.primary }] as any} />
                            {index < STEPS.length - 1 && <View style={[styles.line, index < currentStep && { backgroundColor: AppTheme.colors.primary }] as any} />}
                        </View>
                    ))}
                </View>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 }}>Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep]}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {renderStepContent()}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{currentStep === 0 ? 'Cancelar' : 'Atrás'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.nextButtonText}>{currentStep === 3 ? 'Finalizar' : 'Siguiente'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 20, paddingTop: 50, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    progressBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    progressStep: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e0e0e0' },
    activeDot: { backgroundColor: AppTheme.colors.primary },
    line: { width: 30, height: 2, backgroundColor: '#e0e0e0', marginHorizontal: 2 },
    activeLine: { backgroundColor: AppTheme.colors.primary },
    content: { padding: 20 },
    stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    stepDesc: { fontSize: 16, color: '#666', marginBottom: 20 },
    optionCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    optionSelected: { borderColor: AppTheme.colors.primary, backgroundColor: '#f0f9ff' },
    optionText: { marginLeft: 10, fontSize: 16, color: '#333' },
    optionTextSelected: { fontWeight: 'bold', color: AppTheme.colors.primary },
    inputContainer: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#444' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    infoBox: { flexDirection: 'row', backgroundColor: '#e7f1ff', padding: 15, borderRadius: 10, alignItems: 'center' },
    infoText: { marginLeft: 10, flex: 1, color: '#0056b3' },
    checkboxItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    checkboxText: { marginLeft: 10, fontSize: 16, color: '#333' },
    footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    backButton: { flex: 1, padding: 15, alignItems: 'center' },
    backButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
    nextButton: { flex: 1, backgroundColor: AppTheme.colors.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ProfedetInfoWizardScreen;

