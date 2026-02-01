import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { AppTheme } from '../theme/colors';

const PanicButton = () => {
    const navigation = useNavigation();
    const [isCrisisMode, setIsCrisisMode] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    useEffect(() => {
        return () => {
            if (recording) {
                stopRecording();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permission..');
                await requestPermission();
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'No se pudo iniciar la grabación.');
        }
    };

    const stopRecording = async () => {
        console.log('Stopping recording..');
        if (!recording) return;
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        console.log('Recording stopped and stored at', uri);
        Alert.alert('Grabación Guardada', 'El audio se ha guardado en tu dispositivo. Úsalo como evidencia.');
    };

    const toggleCrisisMode = () => {
        setIsCrisisMode(!isCrisisMode);
    };

    return (
        <>
            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={toggleCrisisMode}
                activeOpacity={0.8}
            >
                <View style={styles.fabInner}>
                    <MaterialCommunityIcons name="alarm-light-outline" size={28} color="#fff" />
                </View>
                <View style={styles.fabRing} />
            </TouchableOpacity>

            {/* Crisis Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isCrisisMode}
                onRequestClose={toggleCrisisMode}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>🚨 MODO CRISIS: DESPIDO</Text>
                            <TouchableOpacity onPress={toggleCrisisMode}>
                                <Ionicons name="close-circle" size={30} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.body}>
                            {/* Audio Recorder */}
                            <View style={styles.recorderContainer}>
                                <Text style={styles.recorderTitle}>
                                    {isRecording ? "🔴 GRABANDO EVIDENCIA..." : "Grabar Audio Oculto"}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.recordButton, isRecording && styles.recordingActive]}
                                    onPress={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ? (
                                        <MaterialCommunityIcons name="stop" size={40} color="#fff" />
                                    ) : (
                                        <MaterialCommunityIcons name="microphone" size={40} color="#fff" />
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.recorderHint}>
                                    {isRecording ? "Toca para detener" : "Toca para iniciar grabación discreta"}
                                </Text>
                            </View>

                            {/* Checklist */}
                            <View style={styles.checklistContainer}>
                                <Text style={styles.checklistTitle}>⚠️ REGLAS DE ORO (AHORA MISMO)</Text>

                                <View style={styles.checkItem}>
                                    <Ionicons name="close-circle" size={24} color="#e74c3c" />
                                    <Text style={styles.checkText}>NO FIRMES RENUNCIA ni hojas en blanco.</Text>
                                </View>

                                <View style={styles.checkItem}>
                                    <Ionicons name="document-text" size={24} color="#f1c40f" />
                                    <Text style={styles.checkText}>Pide tu CARTA DE DESPIDO y Finiquito.</Text>
                                </View>

                                <View style={styles.checkItem}>
                                    <Ionicons name="camera" size={24} color="#3498db" />
                                    <Text style={styles.checkText}>Toma FOTO a documentos si no te dan copia.</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => {
                                    toggleCrisisMode();
                                    navigation.navigate('SubscriptionManagement' as never);
                                }}
                            >
                                <Text style={styles.callButtonText}>S.O.S. CONTACTAR ABOGADO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    fabInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e74c3c', // Alarm Red
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        zIndex: 2,
    },
    fabRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(231, 76, 60, 0.3)',
        zIndex: 1,
        // Optional: Animation here later
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#2c3e50',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#e74c3c',
    },
    header: {
        backgroundColor: '#e74c3c',
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    body: {
        padding: 20,
        alignItems: 'center',
    },
    recorderContainer: {
        alignItems: 'center',
        marginBottom: 25,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 15,
    },
    recorderTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 16,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e74c3c',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    recordingActive: {
        backgroundColor: '#c0392b',
        borderColor: '#fff',
    },
    recorderHint: {
        color: '#bdc3c7',
        fontSize: 12,
    },
    checklistContainer: {
        width: '100%',
        marginBottom: 20,
    },
    checklistTitle: {
        color: '#f1c40f',
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 16,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 10,
    },
    checkText: {
        color: '#fff',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    callButton: {
        backgroundColor: '#27ae60',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    callButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default PanicButton;

