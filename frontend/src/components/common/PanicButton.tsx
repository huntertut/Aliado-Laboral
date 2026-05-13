import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, Animated } from 'react-native';
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

    // Pulse animation — latido cada 5 segundos
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
        const runPulse = () => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseAnim, { toValue: 1.55, duration: 400, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
                ]),
            ]).start();
        };

        // Primera vez después de 1.5s
        const initial = setTimeout(runPulse, 1500);
        // Luego cada 5 segundos
        const interval = setInterval(runPulse, 5000);

        return () => {
            clearTimeout(initial);
            clearInterval(interval);
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
            {/* Floating Action Button — SOS */}
            <TouchableOpacity
                style={styles.fab}
                onPress={toggleCrisisMode}
                activeOpacity={0.8}
            >
                {/* Pulse ring */}
                <Animated.View style={[
                    styles.fabRing,
                    { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }
                ]} />
                <View style={styles.fabInner}>
                    <MaterialCommunityIcons name="alarm-light-outline" size={28} color="#fff" />
                </View>
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
        bottom: 22,
        right: 20,
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    fabInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        // Alto contraste: naranja vivo en lugar de rojo oscuro
        backgroundColor: '#ff5e00',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        zIndex: 2,
        shadowColor: '#ff5e00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
        borderWidth: 2.5,
        borderColor: '#fff',
    },
    fabRing: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 94, 0, 0.45)',
        zIndex: 1,
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

