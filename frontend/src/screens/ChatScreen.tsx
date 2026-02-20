import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { API_URL } from '../config/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    requiresLawyer?: boolean;
}

type Persona = 'elias' | 'veronica' | null;

const ChatScreen = () => {
    const navigation = useNavigation();
    const [persona, setPersona] = useState<Persona>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (persona) {
            const initialMsg = persona === 'elias'
                ? "Hola. Soy Elías, experto en cálculos laborales. ¿Qué necesitas calcular hoy?"
                : "¡Hola! Soy Verónica. Estoy aquí para explicarte tus derechos y guiarte. ¿Cómo te sientes hoy en tu trabajo?";

            setMessages([{
                id: '1',
                text: initialMsg,
                sender: 'ai',
                timestamp: new Date()
            }]);
        }
    }, [persona]);

    const sendMessage = async () => {
        if (!inputText.trim() || !persona) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = inputText;
        setInputText('');
        setLoading(true);

        try {
            // LLAMADA AL BACKEND CON OPENAI
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentInput,
                    persona: persona
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'ai',
                timestamp: new Date(),
                requiresLawyer: data.requiresLawyer
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error('Error al comunicarse con el backend:', error);

            // Detailed Error Message construction
            let errorMessage = 'Lo siento, hubo un error técnico. Intenta más tarde.';

            if (error.message.includes('JSON')) {
                errorMessage = 'Error de formato de respuesta (Backend posiblemente caído o devolviendo HTML).';
            } else if (error.message.includes('Network request failed')) {
                errorMessage = 'Error de Red: No se puede conectar al servidor. Verifica tu internet.';
            } else {
                errorMessage = `Error del Servidor: ${error.message}`;
            }

            Alert.alert('Diagnóstico de Error', errorMessage);

            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "⚠️ " + errorMessage,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const renderPersonaSelection = () => (
        <View style={styles.selectionContainer}>
            {/* Added: Navigation Header for Selection Screen */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8 }}>
                <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>

            <Text style={styles.selectionTitle}>Elige a tu Asesor</Text>
            <Text style={styles.selectionSubtitle}>Selecciona al experto que mejor se adapte a tu necesidad actual.</Text>

            <TouchableOpacity style={styles.personaCard} onPress={() => setPersona('elias')}>
                <LinearGradient colors={['#2c3e50', '#34495e']} style={styles.personaGradient}>
                    <View style={styles.avatarContainer}>
                        <Image source={require('../../assets/images/veronica.jpg')} style={styles.avatarImage} />
                    </View>
                    <View style={styles.personaInfo}>
                        <Text style={styles.personaName}>Elías</Text>
                        <Text style={styles.personaRole}>Experto en Cálculos</Text>
                        <Text style={styles.personaDesc}>Preciso, directo y enfocado en números. Ideal para finiquitos y liquidaciones.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.personaCard} onPress={() => setPersona('veronica')}>
                <LinearGradient colors={['#8e44ad', '#9b59b6']} style={styles.personaGradient}>
                    <View style={styles.avatarContainer}>
                        <Image source={require('../../assets/images/elias.jpg')} style={styles.avatarImage} />
                    </View>
                    <View style={styles.personaInfo}>
                        <Text style={styles.personaName}>Verónica</Text>
                        <Text style={styles.personaRole}>Experta en Derechos</Text>
                        <Text style={styles.personaDesc}>Empática y explicativa. Ideal para entender procesos, despidos y contratos.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#d2b4de" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    if (!persona) {
        return (
            <View style={styles.container}>
                {renderPersonaSelection()}
            </View>
        );
    }

    const renderTrafficLight = () => {
        // Calculate status based on last message
        const lastMsg = messages[messages.length - 1];
        const lastDate = lastMsg ? new Date(lastMsg.timestamp) : new Date();
        const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        let statusColor = '#2ecc71'; // Green
        let statusText = 'Tu abogado está trabajando en tu caso.';

        if (diffDays >= 5) {
            statusColor = '#e74c3c'; // Red
            statusText = 'Tu caso requiere atención. Estamos contactando al despacho.';
        } else if (diffDays >= 3) {
            statusColor = '#f1c40f'; // Yellow
            statusText = 'Esperando actualización. Recordatorio enviado.';
        }

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, marginHorizontal: 15, marginTop: 10, borderRadius: 8, elevation: 2 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: statusColor, marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: '#555', flex: 1 }}>{statusText}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
        >
            <View style={[styles.header, { backgroundColor: persona === 'elias' ? '#2c3e50' : '#8e44ad' }]}>
                <TouchableOpacity onPress={() => setPersona(null)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{persona === 'elias' ? 'Elías' : 'Verónica'}</Text>
                    <Text style={styles.headerRole}>{persona === 'elias' ? 'Experto en Cálculos' : 'Experta en Derechos'}</Text>
                </View>
                <Ionicons name={persona === 'elias' ? "calculator" : "chatbubbles"} size={24} color="rgba(255,255,255,0.8)" />
            </View>

            {/* TRAFFIC LIGHT INDICATOR */}
            {renderTrafficLight()}

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View>
                        <View style={[
                            styles.messageBubble,
                            item.sender === 'user' ? styles.userBubble : (persona === 'elias' ? styles.eliasBubble : styles.veronicaBubble)
                        ]}>
                            <Text style={[
                                styles.messageText,
                                item.sender === 'user' ? styles.userText : styles.aiText
                            ]}>{item.text}</Text>
                        </View>
                        {item.requiresLawyer && (
                            <TouchableOpacity
                                style={styles.lawyerButton}
                                onPress={() => navigation.navigate('SubscriptionManagement' as never)}
                            >
                                <Ionicons name="star" size={20} color="#fff" />
                                <Text style={styles.lawyerButtonText}>Hablar con Abogado (Versión Pro)</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={persona === 'elias' ? '#2c3e50' : '#8e44ad'} />
                    <Text style={styles.loadingText}>{persona === 'elias' ? 'Elías calculando...' : 'Verónica escribiendo...'}</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={persona === 'elias' ? "Pide un cálculo..." : "Pregunta sobre tus derechos..."}
                    placeholderTextColor="#999"
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: persona === 'elias' ? '#2c3e50' : '#8e44ad' }]}
                    onPress={sendMessage}
                >
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    // Selection Screen
    selectionContainer: { flex: 1, padding: 20, justifyContent: 'center' },
    selectionTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
    selectionSubtitle: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
    personaCard: { marginBottom: 20, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    personaGradient: { flexDirection: 'row', padding: 20, borderRadius: 15, alignItems: 'center' },
    avatarContainer: { width: 60, height: 60, borderRadius: 30, marginRight: 15, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    avatarImage: { width: '100%', height: '100%' },
    personaInfo: { flex: 1 },
    personaName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    personaRole: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 5, fontWeight: '600' },
    personaDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

    // Chat Screen
    header: { padding: 15, paddingTop: 50, flexDirection: 'row', alignItems: 'center', elevation: 4 },
    backButton: { marginRight: 15 },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    headerRole: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

    listContent: { padding: 20, paddingBottom: 20 },
    messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 15, marginBottom: 10 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#3498db', borderBottomRightRadius: 2 },
    eliasBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2, borderLeftWidth: 3, borderLeftColor: '#2c3e50' },
    veronicaBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2, borderLeftWidth: 3, borderLeftColor: '#8e44ad' },

    messageText: { fontSize: 16, lineHeight: 22 },
    userText: { color: '#fff' },
    aiText: { color: '#333' },

    // Lawyer Referral Button
    lawyerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e74c3c',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        marginLeft: 15,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    lawyerButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        marginRight: 8,
        flex: 1,
    },

    loadingContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginBottom: 10 },
    loadingText: { marginLeft: 8, color: '#666', fontSize: 12 },

    inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, marginRight: 10, color: '#333' },
    sendButton: { borderRadius: 20, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen;

