import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOPICS = [
    { id: 'despido', label: 'Despido Injustificado' },
    { id: 'renuncia', label: 'Renuncia Voluntaria' },
    { id: 'vacaciones', label: 'Vacaciones y Primas' },
    { id: 'aguinaldo', label: 'Aguinaldo' },
    { id: 'utilidades', label: 'Reparto de Utilidades' },
    { id: 'acoso', label: 'Acoso Laboral' },
    { id: 'otro', label: 'Otro Tema' },
];

const ForumCreatePostScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // Params from Calculator or other screens
    const { initialTitle, initialContent, initialTopic } = route.params as any || {};

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('otro');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialTitle) setTitle(initialTitle);
        if (initialContent) setContent(initialContent);
        if (initialTopic) setSelectedTopic(initialTopic);
    }, [initialTitle, initialContent, initialTopic]);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Campos incompletos', 'Por favor añade un título y una descripción a tu pregunta.');
            return;
        }

        // Security Validation (Client Side)
        const phoneRegex = /(\d[\s.-]?){10,}/;
        if (phoneRegex.test(title) || phoneRegex.test(content)) {
            Alert.alert(
                'Seguridad',
                'Por tu seguridad y privacidad, no permitimos publicar números de teléfono en el foro.\n\nLos abogados te contactarán a través de la plataforma si es necesario.'
            );
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            await axios.post(
                `${API_URL}/forum/posts`,
                {
                    topic: selectedTopic,
                    title,
                    content
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            Alert.alert('Post Publicado', 'Tu duda ha sido publicada en el foro anónimo.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'No se pudo publicar el post. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nueva Pregunta</Text>
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.publishButton, (!title.trim() || !content.trim()) && styles.disabledButton]}
                    disabled={loading || !title.trim() || !content.trim()}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    ) : (
                        <Text style={[styles.publishButtonText, (!title.trim() || !content.trim()) && styles.disabledButtonText]}>Publicar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Tema Relacionado</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScroll}>
                            {TOPICS.map(topic => (
                                <TouchableOpacity
                                    key={topic.id}
                                    style={[
                                        styles.topicChip,
                                        selectedTopic === topic.id && styles.activeTopicChip
                                    ]}
                                    onPress={() => setSelectedTopic(topic.id)}
                                >
                                    <Text style={[
                                        styles.topicText,
                                        selectedTopic === topic.id && styles.activeTopicText
                                    ]}>{topic.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Título de tu pregunta</Text>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Ej. ¿Es correcto mi cálculo de despido?"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={80}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Detalles</Text>
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Describe tu situación laboral, años trabajados, etc. Recuerda no incluir nombres reales ni empresas para mantener el anonimato."
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.tipBox}>
                        <Ionicons name="shield-checkmark" size={20} color="#27ae60" />
                        <Text style={styles.tipText}>
                            Tu publicación es anónima. Los abogados verán tu duda pero no tu nombre real hasta que decidas contactarlos.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.primary,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    publishButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    disabledButton: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    publishButtonText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    disabledButtonText: {
        color: '#eee',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    topicScroll: {
        flexDirection: 'row',
        paddingBottom: 5,
    },
    topicChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f6fa',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    activeTopicChip: {
        backgroundColor: 'rgba(46, 134, 222, 0.1)',
        borderColor: theme.colors.primary,
    },
    topicText: {
        color: '#666',
        fontSize: 13,
    },
    activeTopicText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    titleInput: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 10,
    },
    contentInput: {
        fontSize: 16,
        color: '#555',
        minHeight: 150,
        lineHeight: 24,
    },
    tipBox: {
        flexDirection: 'row',
        backgroundColor: '#e8f5e9',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 40,
        alignItems: 'center',
    },
    tipText: {
        color: '#2e7d32',
        fontSize: 12,
        marginLeft: 10,
        flex: 1,
        lineHeight: 18,
    }
});

export default ForumCreatePostScreen;
