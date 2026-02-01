import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../config/constants';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // No longer needed directly
import { useAuth } from '../../context/AuthContext';

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
    const { getAccessToken } = useAuth();

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
            const token = await getAccessToken();
            if (!token) throw new Error('No se encontró sesión activa. Por favor inicia sesión nuevamente.');

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
        } catch (error: any) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'No se pudo publicar el post. ' + (error.message || 'Inténtalo de nuevo.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nueva Pregunta</Text>
                <TouchableOpacity
                    style={[styles.postButton, (loading || !title.trim() || !content.trim()) && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading || !title.trim() || !content.trim()}
                >
                    {loading ? (
                        <ActivityIndicator color={AppTheme.colors.primary} size="small" />
                    ) : (
                        <Text style={[styles.postButtonText, (loading || !title.trim() || !content.trim()) && styles.disabledText]}>
                            Publicar
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.topicSection}>
                        <Text style={styles.label}>Tema de tu consulta:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicList}>
                            {TOPICS.map((topic) => (
                                <TouchableOpacity
                                    key={topic.id}
                                    style={[
                                        styles.topicChip,
                                        selectedTopic === topic.id && styles.selectedTopicChip
                                    ]}
                                    onPress={() => setSelectedTopic(topic.id)}
                                >
                                    <Text
                                        style={[
                                            styles.topicText,
                                            selectedTopic === topic.id && styles.selectedTopicText
                                        ]}
                                    >
                                        {topic.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Título Corto:</Text>
                        <TextInput
                            style={styles.inputTitle}
                            placeholder="Ej: Despido sin liquidación..."
                            value={title}
                            onChangeText={setTitle}
                            maxLength={80}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Detalle de tu situación:</Text>
                        <TextInput
                            style={[styles.inputContent]}
                            placeholder="Describe tu caso sin incluir nombres reales o datos sensibles..."
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                        />
                        <View style={styles.privacyHint}>
                            <Ionicons name="shield-checkmark-outline" size={16} color="#27ae60" />
                            <Text style={styles.privacyText}>
                                Formato anónimo. No compartas teléfonos ni nombres reales.
                            </Text>
                        </View>
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
        backgroundColor: AppTheme.colors.primary,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    postButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    disabledButton: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    postButtonText: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    disabledText: {
        color: '#666',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    topicSection: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 10,
    },
    topicList: {
        flexDirection: 'row',
    },
    topicChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f2f5',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e1e4e8',
    },
    selectedTopicChip: {
        backgroundColor: AppTheme.colors.primary,
        borderColor: AppTheme.colors.primary,
    },
    topicText: {
        color: '#666',
        fontSize: 13,
    },
    selectedTopicText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 10,
    },
    inputContent: {
        fontSize: 16,
        color: '#34495e',
        minHeight: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginTop: 5,
    },
    privacyHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#eafaf1',
        padding: 10,
        borderRadius: 8,
    },
    privacyText: {
        fontSize: 12,
        color: '#27ae60',
        marginLeft: 8,
        flex: 1,
    },
});

export default ForumCreatePostScreen;

