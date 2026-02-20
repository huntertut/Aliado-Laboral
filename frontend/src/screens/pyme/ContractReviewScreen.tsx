import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/constants';
import * as DocumentPicker from 'expo-document-picker';
import PaywallModal from '../../components/PaywallModal';

const ContractReviewScreen = () => {
    const navigation = useNavigation();
    const { getAccessToken } = useAuth();

    // States: 'initial', 'uploading', 'analyzing', 'results'
    const [step, setStep] = useState('initial');
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [paywallVisible, setPaywallVisible] = useState(false);

    const handleSelectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
            });

            if (result.assets && result.assets.length > 0) {
                setStep('uploading');
                // Simulate Mock Analysis Call
                analyzeContractMock();
            }
        } catch (error) {
            console.error('File pick error', error);
        }
    };

    const analyzeContractMock = async () => {
        try {
            setStep('analyzing');
            const token = await getAccessToken();
            // Call our mock endpoint
            const response = await fetch(`${API_URL}/pyme-profile/documents/analyze-contract`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            // Artificial delay for effect handled by backend, but ensuring frontend waits
            setAnalysisResult(data);
            setStep('results');
        } catch (error) {
            console.error('Analysis error', error);
            Alert.alert('Error', 'No se pudo analizar el documento.');
            setStep('initial');
        }
    };

    const renderInitial = () => (
        <View style={styles.centerContent}>
            <View style={styles.iconCircle}>
                <Ionicons name="scan-outline" size={60} color={AppTheme.colors.primary} />
            </View>
            <Text style={styles.mainTitle}>Revisión Básica de Contratos</Text>
            <Text style={styles.subtitle}>
                Detecta errores comunes como falta de jornada o salario.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>Nota:</Text> Esta herramienta es educativa y no legal.
            </Text>

            <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectFile}>
                <Text style={styles.uploadBtnText}>Seleccionar Contrato (PDF/Img)</Text>
            </TouchableOpacity>

            <View style={styles.disclaimerBox}>
                <Ionicons name="warning" size={20} color="#f57f17" />
                <Text style={styles.disclaimerText}>
                    No subas documentos confidenciales reales si tienes dudas.
                    El sistema buscará patrones básicos.
                </Text>
            </View>
        </View>
    );

    const renderAnalyzing = () => (
        <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={AppTheme.colors.primary} />
            <Text style={[styles.mainTitle, { marginTop: 20 }]}>Analizando documento...</Text>
            <Text style={styles.subtitle}>Buscando cláusulas esenciales...</Text>
        </View>
    );

    const renderResults = () => {
        if (!analysisResult) return <View />;

        const getRiskColor = (level: string) => {
            if (level === 'high') return '#f44336';
            if (level === 'medium') return '#ff9800';
            return '#4caf50';
        };

        return (
            <ScrollView contentContainerStyle={styles.resultsContent}>
                <View style={[styles.riskHeader, { backgroundColor: getRiskColor(analysisResult.riskLevel) }]}>
                    <Text style={styles.riskTitle}>Riesgo Detectado: {analysisResult.riskLevel.toUpperCase()}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hallazgos Educativos:</Text>
                    {analysisResult.issues.map((issue: any) => (
                        <View key={issue.id} style={styles.issueCard}>
                            <Ionicons
                                name={issue.severity === 'high' ? 'close-circle' : 'alert-circle'}
                                size={24}
                                color={issue.severity === 'high' ? '#d32f2f' : '#f57c00'}
                            />
                            <Text style={styles.issueText}>{issue.text}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.recommendationBox}>
                    <Text style={styles.recTitle}>Recomendación:</Text>
                    <Text style={styles.recText}>{analysisResult.recommendation}</Text>
                    <TouchableOpacity
                        style={styles.proBtn}
                        onPress={() => setPaywallVisible(true)}
                    >
                        <Text style={styles.proBtnText}>👉 Obtener formatos legales PRO</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => { setStep('initial'); setAnalysisResult(null); }}
                >
                    <Text style={styles.retryBtnText}>Revisar otro documento</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Diagnóstico de Contrato</Text>
            </View>

            {step === 'initial' && renderInitial()}
            {(step === 'uploading' || step === 'analyzing') && renderAnalyzing()}
            {step === 'results' && renderResults()}

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                featureName="Formatos Legales Validados"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },

    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    iconCircle: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#e3f2fd',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20
    },
    mainTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#333' },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 20 },

    uploadBtn: {
        backgroundColor: AppTheme.colors.primary,
        paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25,
        marginTop: 30,
        elevation: 3
    },
    uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: ' bold' },

    disclaimerBox: {
        flexDirection: 'row', backgroundColor: '#fff3e0', padding: 15, borderRadius: 8,
        marginTop: 40, alignItems: 'center'
    },
    disclaimerText: { flex: 1, marginLeft: 10, fontSize: 12, color: '#e65100' },

    resultsContent: { padding: 20 },
    riskHeader: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    riskTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    issueCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa',
        padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#ccc'
    },
    issueText: { marginLeft: 10, flex: 1, color: '#333' },

    recommendationBox: {
        backgroundColor: '#e8eaf6', padding: 15, borderRadius: 8, marginBottom: 20
    },
    recTitle: { fontWeight: 'bold', color: '#1a237e', marginBottom: 5 },
    recText: { color: '#283593', marginBottom: 15 },
    proBtn: { backgroundColor: '#ffd700', padding: 10, borderRadius: 6, alignItems: 'center' },
    proBtnText: { fontWeight: 'bold', color: '#333' },

    retryBtn: { padding: 15, alignItems: 'center' },
    retryBtnText: { color: AppTheme.colors.primary, fontWeight: 'bold' }
});

export default ContractReviewScreen;

