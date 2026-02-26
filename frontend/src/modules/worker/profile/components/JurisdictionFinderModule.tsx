import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../../../theme/colors';
import { API_URL } from '../../../../config/constants';
import { useAuth } from '../../../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export const JurisdictionFinderModule = ({ laborData }: { laborData?: any }) => {
    const { getAccessToken } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [sector, setSector] = useState(laborData?.occupation || '');
    const [estado, setEstado] = useState(laborData?.federalEntity || '');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Auto-fill form if data arrives late
    React.useEffect(() => {
        if (laborData?.occupation && !sector) setSector(laborData.occupation);
        if (laborData?.federalEntity && !estado) setEstado(laborData.federalEntity);
    }, [laborData]);

    const handleSearch = async () => {
        if (!sector.trim() || !estado.trim()) {
            Alert.alert('Datos incompletos', 'Por favor ingresa tu sector de trabajo y el estado donde vives.');
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/jurisdiction/find`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sector_usuario: sector,
                    estado_usuario: estado
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
            } else {
                Alert.alert('Aviso', data.error || data.details || 'No se pudo encontrar información.');
            }
        } catch (error) {
            Alert.alert('Error', 'Problema de conexión al buscar jurisdicción.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <TouchableOpacity
                style={styles.mainButton}
                onPress={() => setModalVisible(true)}
            >
                <View style={styles.buttonContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="map" size={24} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Buscador de Instancias</Text>
                        <Text style={styles.subtitle}>¿No sabes a dónde acudir? Averígualo aquí.</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>¿A dónde debo ir?</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDescription}>
                            Ingresa a qué te dedicas y en qué estado trabajas, y te diremos si tu asunto es Local o Federal.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej. mesero, textil, chofer, maestro..."
                            value={sector}
                            onChangeText={setSector}
                            placeholderTextColor="#95a5a6"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Tu Estado (Ej. Ciudad de México, Jalisco)"
                            value={estado}
                            onChangeText={setEstado}
                            placeholderTextColor="#95a5a6"
                        />

                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={[AppTheme.colors.primary, '#2980b9']}
                                style={styles.gradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.searchButtonText}>Buscar mi Institución</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {result && (
                            <View style={styles.resultContainer}>
                                <Text style={styles.resultLabel}>Análisis de IA:</Text>
                                <Text style={styles.resultText}>
                                    <Text style={{ fontWeight: 'bold' }}>Sector Detectado:</Text> {result.analisis.sectorIdentificado}
                                </Text>
                                <Text style={styles.resultText}>
                                    <Text style={{ fontWeight: 'bold' }}>Competencia:</Text> {result.analisis.competencia}
                                </Text>

                                <View style={styles.recommendationBox}>
                                    <Text style={styles.recTitle}>Deberías acudir a:</Text>
                                    <Text style={styles.recInstance}>{result.recomendacion.instancia}</Text>
                                    <Text style={styles.recAddress} selectable>{result.recomendacion.direccionOficial}</Text>
                                    <Text style={styles.recMeta}>{result.recomendacion.indicaciones}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    mainButton: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        backgroundColor: '#8e44ad', // Purple for law/bureaucracy finder
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        minHeight: '60%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    modalDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        color: '#2c3e50',
    },
    searchButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 5,
        marginBottom: 20,
    },
    gradient: {
        padding: 15,
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        backgroundColor: '#f5f6fa',
        padding: 15,
        borderRadius: 15,
        marginTop: 10,
    },
    resultLabel: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 10,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    resultText: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 5,
    },
    recommendationBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        borderLeftWidth: 4,
        borderLeftColor: AppTheme.colors.primary,
    },
    recTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginBottom: 5,
    },
    recInstance: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,
    },
    recAddress: {
        fontSize: 14,
        color: '#34495e',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    recMeta: {
        fontSize: 13,
        color: '#7f8c8d',
        lineHeight: 18,
    }
});
