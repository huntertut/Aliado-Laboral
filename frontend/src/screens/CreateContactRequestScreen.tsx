import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { PRIVACY_NOTICES } from '../data/legal/privacyNotices';

const CreateContactRequestScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { lawyerProfileId, lawyerName } = route.params as { lawyerProfileId: string; lawyerName: string };
    const { user, getAccessToken } = useAuth(); // Obtener usuario real

    const [caseSummary, setCaseSummary] = useState('');
    const [caseType, setCaseType] = useState('despido');
    const [urgency, setUrgency] = useState('normal');
    const [loading, setLoading] = useState(false);
    const [hasConsent, setHasConsent] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: true
            });

            if (!result.canceled && result.assets) {
                setDocuments(prev => [...prev, ...result.assets]);
            }
        } catch (err) {
            console.log('Error picking document', err);
            Alert.alert('Error', 'No se pudo adjuntar el archivo');
        }
    };

    const removeDocument = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!caseSummary.trim()) {
            Alert.alert('Error', 'Por favor describe tu caso');
            return;
        }

        if (caseSummary.length < 50) {
            Alert.alert(
                'Descripción corta',
                '¿Estás seguro de enviar una descripción tan breve? Te recomendamos explicar mejor tu situación para que el abogado pueda evaluarla correctamente.',
                [
                    { text: 'Editar', style: 'cancel' },
                    { text: 'Enviar así', onPress: () => submitRequest() }
                ]
            );
            return;
        }

        if (!hasConsent) {
            Alert.alert('Consentimiento Requerido', 'Debes aceptar compartir tus datos con el abogado para continuar.');
            return;
        }

        submitRequest();
    };

    const submitRequest = async () => {
        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para enviar una solicitud');
            return;
        }

        setLoading(true);
        try {
            const token = await getAccessToken();

            // Convert documents to base64
            const processedDocs = await Promise.all(documents.map(async (doc) => {
                const base64 = await FileSystem.readAsStringAsync(doc.uri, { encoding: 'base64' });
                return {
                    name: doc.name,
                    type: doc.mimeType || 'application/octet-stream',
                    size: doc.size,
                    base64: base64
                };
            }));

            const response = await fetch(endpoints.contact.createRequest, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lawyerProfileId,
                    caseSummary,
                    caseType,
                    urgency,
                    documents: processedDocs,
                    hasAcceptedDataSharing: true // Enforced by UI validation
                })
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    '¡Solicitud enviada!',
                    'El abogado recibirá tu solicitud. Te notificaremos cuando responda.',
                    [
                        {
                            text: 'Ver mis solicitudes',
                            onPress: () => navigation.navigate('MyContactRequests' as never)
                        }
                    ]
                );
            } else {
                Alert.alert('Error', data.error || 'No se pudo enviar la solicitud');
            }
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            Alert.alert('Error', 'Hubo un problema al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Solicitar Contacto</Text>
                <Text style={styles.headerSubtitle}>Con {lawyerName}</Text>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Tipo de caso */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Tipo de caso</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={caseType}
                            onValueChange={(value) => setCaseType(value)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Despido" value="despido" />
                            <Picker.Item label="Acoso Laboral" value="acoso" />
                            <Picker.Item label="Discriminación" value="discriminacion" />
                            <Picker.Item label="Salarios no pagados" value="salarios" />
                            <Picker.Item label="Accidente de trabajo" value="accidente" />
                            <Picker.Item label="Otro" value="otro" />
                        </Picker>
                    </View>
                </View>

                {/* Urgencia */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Urgencia del caso</Text>
                    <View style={styles.urgencyOptions}>
                        {[
                            { value: 'low', label: 'Baja', icon: 'time-outline', color: '#95a5a6' },
                            { value: 'normal', label: 'Normal', icon: 'alert-circle-outline', color: '#3498db' },
                            { value: 'high', label: 'Alta', icon: 'flash-outline', color: '#e74c3c' }
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.urgencyButton,
                                    urgency === option.value && {
                                        borderColor: option.color,
                                        backgroundColor: `${option.color}15`
                                    }
                                ]}
                                onPress={() => setUrgency(option.value)}
                            >
                                <Ionicons
                                    name={option.icon as any}
                                    size={24}
                                    color={urgency === option.value ? option.color : '#95a5a6'}
                                />
                                <Text style={[
                                    styles.urgencyLabel,
                                    urgency === option.value && { color: option.color, fontWeight: 'bold' }
                                ]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Resumen del caso */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Describe tu caso</Text>
                    <Text style={styles.hint}>
                        Explica qué pasó, cuándo, y qué buscas lograr. Sé lo más específico posible.
                    </Text>
                    <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={8}
                        value={caseSummary}
                        onChangeText={setCaseSummary}
                        placeholder="Ejemplo: Trabajé 3 años en la empresa X. El día 15 de noviembre me despidieron sin justificación y sin pagarme mi liquidación completa. Solo me dieron..."
                        placeholderTextColor="#999"
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{caseSummary.length} caracteres</Text>
                </View>

                {/* Advertencia de costo */}
                <View style={styles.costWarning}>
                    <Ionicons name="card-outline" size={24} color="#f39c12" />
                    <View style={styles.costWarningText}>
                        <Text style={styles.costTitle}>Costo de la solicitud: $50 MXN</Text>
                        <Text style={styles.costDetails}>
                            • Se reservará el pago, pero NO se cobrará aún{'\n'}
                            • Solo se cobrará si el abogado acepta tu caso{'\n'}
                            • Si rechaza, no se cobra nada
                        </Text>
                    </View>
                </View>

                {/* Documentos */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Documentos de evidencia (Opcional)</Text>
                    <Text style={styles.hint}>Sube fotos, contratos o recibos (PDF, JPG, PNG)</Text>

                    {documents.map((doc, index) => (
                        <View key={index} style={styles.docItem}>
                            <Ionicons name="document-text-outline" size={20} color="#34495e" />
                            <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                            <TouchableOpacity onPress={() => removeDocument(index)}>
                                <Ionicons name="close-circle" size={20} color="#e74c3c" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
                        <Ionicons name="attach" size={20} color="#3498db" />
                        <Text style={styles.attachText}>Adjuntar archivo desde celular</Text>
                    </TouchableOpacity>
                </View>

                {/* Consentimiento Legal */}
                <View style={styles.consentContainer}>
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setHasConsent(!hasConsent)}
                    >
                        <Ionicons
                            name={hasConsent ? "checkbox" : "square-outline"}
                            size={24}
                            color={hasConsent ? "#2ecc71" : "#7f8c8d"}
                        />
                        <Text style={styles.consentText}>
                            Acepto compartir mis datos de contacto y el resumen de mi caso con el abogado seleccionado para fines de asesoría legal.
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('Aviso de Privacidad', PRIVACY_NOTICES.WORKER.sections.map(s => `${s.heading}\n${s.content}`).join('\n\n'))}>
                        <Text style={styles.privacyLink}>Ver Aviso de Privacidad Simplificado</Text>
                    </TouchableOpacity>
                </View>

                {/* Botón de envío */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#27ae60', '#2ecc71']}
                        style={styles.submitGradient}
                    >
                        {loading ? (
                            <Text style={styles.submitText}>Enviando...</Text>
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={styles.submitText}>Enviar Solicitud</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    backButton: {
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    hint: {
        fontSize: 13,
        color: '#7f8c8d',
        marginBottom: 10,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    picker: {
        height: 50,
    },
    urgencyOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    urgencyButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    urgencyLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 5,
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 15,
        fontSize: 15,
        color: '#2c3e50',
        minHeight: 150,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#95a5a6',
        marginTop: 5,
    },
    costWarning: {
        flexDirection: 'row',
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    costWarningText: {
        flex: 1,
        marginLeft: 15,
    },
    costTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 8,
    },
    costDetails: {
        fontSize: 13,
        color: '#856404',
        lineHeight: 20,
    },
    comingSoon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecf0f1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 25,
    },
    comingSoonText: {
        fontSize: 13,
        color: '#7f8c8d',
        marginLeft: 8,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    docName: {
        flex: 1,
        marginLeft: 10,
        marginRight: 10,
        color: '#34495e',
        fontSize: 14,
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3498db',
        borderStyle: 'dashed',
        backgroundColor: '#f0f8ff',
        marginTop: 5,
    },
    attachText: {
        color: '#3498db',
        marginLeft: 8,
        fontWeight: '600',
    },
    consentContainer: {
        marginVertical: 15,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    consentText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#2c3e50',
    },
    privacyLink: {
        marginTop: 10,
        color: '#3498db',
        fontSize: 14,
        textDecorationLine: 'underline',
        marginLeft: 34,
    },
});

export default CreateContactRequestScreen;
