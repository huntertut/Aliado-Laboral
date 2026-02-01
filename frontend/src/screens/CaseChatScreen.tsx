
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar, Modal, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/constants';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const CaseChatScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { requestId, workerName } = route.params as any; // Passed from navigation
    const { user, getAccessToken } = useAuth();

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [vaultModalVisible, setVaultModalVisible] = useState(false);
    const [vaultFiles, setVaultFiles] = useState<any[]>([]);
    const [fetchingVault, setFetchingVault] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 10 seconds (Simple MVP real-time)
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/chat/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Backend returns chronological orders. FlatList inverted needs reverse order?
            // Actually, usually we fetch desc or asc. 
            // My backend currently: orderBy: { createdAt: 'asc' } (Oldest first)
            // For inverted FlatList, we want Newest first (index 0).
            // So we reverse the array.
            const sortedMessages = response.data.reverse();
            setMessages(sortedMessages);
        } catch (error) {
            console.error('Error fetching chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const openVaultPicker = async () => {
        if (user?.role !== 'worker') {
            Alert.alert('Acceso Denegado', 'Solo el cliente puede compartir archivos de su baúl personal.');
            return;
        }

        try {
            setFetchingVault(true);
            setVaultModalVisible(true);
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/vault/files`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVaultFiles(response.data);
        } catch (error) {
            console.error('Error fetching vault:', error);
            Alert.alert('Error', 'No se pudieron cargar los archivos de tu baúl.');
        } finally {
            setFetchingVault(false);
        }
    };

    const shareVaultFile = async (file: any) => {
        setVaultModalVisible(false);
        setSending(true);
        try {
            const token = await getAccessToken();
            const payload = {
                requestId,
                // We send a JSON-stringified object for document type
                content: JSON.stringify({
                    fileId: file.id,
                    fileName: file.fileName,
                    fileType: file.fileType
                }),
                type: 'document'
            };

            const response = await axios.post(`${API_URL}/chat`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [response.data, ...prev]);
        } catch (error) {
            console.error('Error sharing vault file:', error);
            Alert.alert('Error', 'No se pudo compartir el archivo.');
        } finally {
            setSending(false);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        setSending(true);
        try {
            const token = await getAccessToken();
            const payload = {
                requestId,
                content: inputText.trim(),
                type: 'text'
            };

            const response = await axios.post(`${API_URL}/chat`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistic update
            const newMessage = response.data;
            // Add to start of list (since it's inverted)
            setMessages(prev => [newMessage, ...prev]);
            setInputText('');

        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    const handleViewDocument = async (message: any) => {
        try {
            const fileInfo = JSON.parse(message.content);
            const token = await getAccessToken();
            // Pass requestId so backend can verify lawyer access
            const response = await axios.get(`${API_URL}/vault/files/${fileInfo.fileId}/download?requestId=${requestId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { downloadUrl } = response.data;
            Linking.openURL(downloadUrl);
        } catch (error) {
            console.error('Error opening document:', error);
            Alert.alert('Error', 'No se pudo abrir el documento.');
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMyMessage = item.senderId === user?.id;

        if (item.type === 'document') {
            let docInfo;
            try {
                docInfo = JSON.parse(item.content);
            } catch (e) {
                docInfo = { fileName: 'Archivo adjunto' };
            }

            return (
                <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer]}>
                    <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble, styles.documentBubble]}>
                        <View style={styles.documentHeader}>
                            <Ionicons name="document-text" size={32} color={isMyMessage ? '#fff' : AppTheme.colors.primary} />
                            <View style={styles.documentInfo}>
                                <Text style={[styles.documentName, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                                    {docInfo.fileName}
                                </Text>
                                <Text style={[styles.documentType, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
                                    Documento compartido
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.viewButton, { backgroundColor: isMyMessage ? 'rgba(255,255,255,0.2)' : '#f0f0f0' }]}
                            onPress={() => handleViewDocument(item)}
                        >
                            <Text style={[styles.viewButtonText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                                Ver Documento
                            </Text>
                            <Ionicons name="eye-outline" size={16} color={isMyMessage ? '#fff' : '#333'} />
                        </TouchableOpacity>
                        <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
                            {moment(item.createdAt).format('HH:mm')}
                        </Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer]}>
                <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
                        {moment(item.createdAt).format('HH:mm')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={AppTheme.colors.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{workerName || 'Chat del Caso'}</Text>
                    <Text style={styles.headerSubtitle}>En línea</Text>
                </View>
                <TouchableOpacity style={styles.optionButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id || Math.random().toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    inverted
                    showsVerticalScrollIndicator={false}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton} onPress={openVaultPicker}>
                        <Ionicons name="add" size={28} color={AppTheme.colors.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor="#999"
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Vault Picker Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={vaultModalVisible}
                onRequestClose={() => setVaultModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Compartir desde mi Baúl</Text>
                            <TouchableOpacity onPress={() => setVaultModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {fetchingVault ? (
                            <ActivityIndicator size="large" color={AppTheme.colors.primary} style={{ margin: 40 }} />
                        ) : (
                            <ScrollView contentContainerStyle={styles.vaultList}>
                                {vaultFiles.length === 0 ? (
                                    <View style={styles.emptyVault}>
                                        <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
                                        <Text style={styles.emptyVaultText}>No tienes archivos en tu baúl.</Text>
                                    </View>
                                ) : (
                                    vaultFiles.map(file => (
                                        <TouchableOpacity
                                            key={file.id}
                                            style={styles.vaultItem}
                                            onPress={() => shareVaultFile(file)}
                                        >
                                            <Ionicons
                                                name={file.fileType?.includes('pdf') ? "document-text" : "image"}
                                                size={24}
                                                color={AppTheme.colors.primary}
                                            />
                                            <Text style={styles.vaultFileName} numberOfLines={1}>{file.fileName}</Text>
                                            <Ionicons name="share-outline" size={20} color="#999" />
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppTheme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? 10 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    optionButton: {
        padding: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    messageContainer: {
        marginBottom: 12,
        flexDirection: 'row',
    },
    myMessageContainer: {
        justifyContent: 'flex-end',
    },
    theirMessageContainer: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: AppTheme.colors.primary,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimestamp: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    attachButton: {
        padding: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        marginHorizontal: 8,
        fontSize: 16,
        color: '#333',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    // Document Styles
    documentBubble: {
        width: '80%',
    },
    documentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    documentInfo: {
        marginLeft: 12,
        flex: 1,
    },
    documentName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    documentType: {
        fontSize: 11,
        marginTop: 2,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
    },
    viewButtonText: {
        fontSize: 13,
        fontWeight: '600',
        marginRight: 6,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: '40%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    vaultList: {
        paddingBottom: 20,
    },
    vaultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 10,
    },
    vaultFileName: {
        flex: 1,
        marginLeft: 15,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    emptyVault: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyVaultText: {
        marginTop: 10,
        color: '#999',
    },
});

export default CaseChatScreen;

