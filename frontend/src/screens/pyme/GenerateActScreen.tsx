import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/constants';

const GenerateActScreen = () => {
    const navigation = useNavigation();
    const { getAccessToken } = useAuth();

    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [incident, setIncident] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/pyme-profile/employees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
                if (data.length > 0) setSelectedEmployee(data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!incident.trim() || !selectedEmployee) {
            Alert.alert('Faltan datos', 'Por favor selecciona un empleado y describe el incidente.');
            return;
        }

        try {
            setGenerating(true);
            const token = await getAccessToken();

            const response = await fetch(`${API_URL}/pyme-profile/generate-acta`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employeeId: selectedEmployee.id,
                    incident,
                    date
                })
            });

            const data = await response.json();
            if (response.ok) {
                setResult(data.content);
            } else {
                Alert.alert('Error', data.error || 'No se pudo generar el acta');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Falló la conexión con la IA');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#4a148c', '#7b1fa2']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Generador de Acta (IA)</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>

                {/* FORM */}
                <View style={styles.card}>
                    <Text style={styles.label}>1. Selecciona Empleado</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeList}>
                        {employees.map(emp => (
                            <TouchableOpacity
                                key={emp.id}
                                style={[
                                    styles.employeeChip,
                                    selectedEmployee?.id === emp.id && styles.employeeChipSelected
                                ]}
                                onPress={() => setSelectedEmployee(emp)}
                            >
                                <Ionicons
                                    name="person"
                                    size={16}
                                    color={selectedEmployee?.id === emp.id ? '#fff' : '#666'}
                                />
                                <Text style={[
                                    styles.employeeName,
                                    selectedEmployee?.id === emp.id && styles.employeeNameSelected
                                ]}>
                                    {emp.fullName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {employees.length === 0 && !loading && (
                            <Text style={styles.noEmployees}>No hay empleados registrados</Text>
                        )}
                    </ScrollView>

                    <Text style={[styles.label, { marginTop: 20 }]}>2. Fecha del Incidente</Text>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                    />

                    <Text style={[styles.label, { marginTop: 20 }]}>3. Describe los Hechos</Text>
                    <Text style={styles.helper}>Sé detallado: hora, lugar, testigos y qué sucedió.</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={incident}
                        onChangeText={setIncident}
                        placeholder="Ej: El empleado llegó 2 horas tarde con aliento alcohólico e insultó al supervisor..."
                        multiline
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={handleGenerate}
                        disabled={generating || employees.length === 0}
                    >
                        {generating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.generateButtonText}>Redactar Defensa Legal</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* RESULT */}
                {result ? (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultTitle}>Documento Generado:</Text>
                        <View style={styles.documentPaper}>
                            <Text style={styles.documentText}>{result}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyButton} onPress={() => Alert.alert('Copiado', 'Texto copiado al portapapeles')}>
                            <Text style={styles.copyButtonText}>Copiar Texto</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
    helper: { fontSize: 12, color: '#95a5a6', marginBottom: 10 },
    employeeList: { flexDirection: 'row', marginBottom: 10 },
    employeeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f2f6',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    employeeChipSelected: { backgroundColor: '#7b1fa2', borderColor: '#7b1fa2' },
    employeeName: { marginLeft: 6, fontSize: 13, color: '#2c3e50' },
    employeeNameSelected: { color: '#fff', fontWeight: 'bold' },
    noEmployees: { color: '#999', fontSize: 13, fontStyle: 'italic' },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e1e1e1',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#2c3e50'
    },
    textArea: { height: 120 },
    generateButton: {
        backgroundColor: '#4a148c',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 25,
        elevation: 3
    },
    generateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultContainer: { marginTop: 30 },
    resultTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
    documentPaper: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 4,
        elevation: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    documentText: { fontSize: 14, lineHeight: 22, color: '#333', fontFamily: 'monospace' }, // Monospace for legal feel
    copyButton: {
        backgroundColor: '#2ecc71',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    copyButtonText: { color: '#fff', fontWeight: 'bold' }
});

export default GenerateActScreen;
