
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
    StatusBar, Modal, ScrollView, Alert, Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/constants';
import moment from 'moment';
import 'moment/locale/es';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

moment.locale('es');

const CaseChatScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { requestId, workerName } = route.params as any;
    const { user, getAccessToken } = useAuth();

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [vaultModalVisible, setVaultModalVisible] = useState(false);
    const [vaultFiles, setVaultFiles] = useState<any[]>([]);
    const [fetchingVault, setFetchingVault] = useState(false);
    const [attachMenuVisible, setAttachMenuVisible] = useState(false);
    const [caseInfo, setCaseInfo] = useState<any>(null);
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const isLawyer = user?.role === 'lawyer';
    const isWorker = !isLawyer; // worker or pyme

    useEffect(() => {
        fetchMessages();
        fetchCaseInfo();
        const interval = setInterval(() => {
            fetchMessages();
            fetchCaseInfo();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchCaseInfo = async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/contact/request/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCaseInfo((response.data as any).request);
        } catch (error) {
            console.error('Error fetching case info:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = await getAccessToken();
            // FIX: correct route is /chat/messages/:contactRequestId
            const response = await axios.get(`${API_URL}/chat/messages/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Backend returns asc order, FlatList is inverted so we reverse
            const sortedMessages = [...(response.data as any[])].reverse();
            setMessages(sortedMessages);
        } catch (error) {
            console.error('Error fetching chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReassignLawyer = async () => {
        setOptionsModalVisible(false);
        Alert.alert(
            'Solicitar Cambio de Abogado',
            '¿Estás seguro de que deseas solicitar el cambio de tu abogado? Tu caso regresará a la bolsa pública para que otro abogado lo acepte.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const token = await getAccessToken();
                            await axios.post(`${API_URL}/contact/request/${requestId}/reassign-lawyer`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Solicitud enviada', 'Tu caso ha regresado a la bolsa pública de abogados. Recibirás una notificación cuando un nuevo abogado lo acepte.', [
                                { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                        } catch (err: any) {
                            console.error('Error reassigning lawyer:', err);
                            Alert.alert('Error', err.response?.data?.error || 'No se pudo reasignar el caso.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleArchiveCase = async () => {
        setOptionsModalVisible(false);
        const title = isLawyer ? 'Archivar por Inactividad' : 'Cerrar y Archivar Caso';
        const msg = isLawyer 
            ? '¿Estás seguro de que deseas archivar este caso debido a la inactividad prolongada del trabajador?'
            : '¿Estás seguro de que deseas cerrar y archivar este caso?';

        Alert.alert(
            title,
            msg,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const token = await getAccessToken();
                            await axios.post(`${API_URL}/contact/request/${requestId}/archive-case`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Caso Archivado', 'El caso ha sido cerrado y archivado exitosamente.', [
                                { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                        } catch (err: any) {
                            console.error('Error archiving case:', err);
                            Alert.alert('Error', err.response?.data?.error || 'No se pudo archivar el caso.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReassignPress = () => {
        if (caseInfo?.canReassignLawyer) {
            handleReassignLawyer();
        } else {
            const daysLeft = 5 - (caseInfo?.businessDaysSinceWorkerActivity || 0);
            Alert.alert(
                'Opción no disponible',
                `Para cambiar de abogado, este debe estar inactivo por al menos 5 días hábiles.\n\nActualmente lleva: ${caseInfo?.businessDaysSinceWorkerActivity || 0} días hábiles sin actividad.\nFaltan aproximadamente: ${daysLeft > 0 ? daysLeft : 0} días hábiles.`
            );
        }
    };

    const handleArchivePress = () => {
        if (caseInfo?.canArchiveCase) {
            handleArchiveCase();
        } else {
            const daysLeft = 7 - (caseInfo?.workerDaysSinceLawyerActivity || 0);
            Alert.alert(
                'Opción no disponible',
                `Para archivar por inactividad del cliente, este debe estar inactivo por al menos 7 días laborables.\n\nActualmente lleva: ${caseInfo?.workerDaysSinceLawyerActivity || 0} días sin responder.\nFaltan aproximadamente: ${daysLeft > 0 ? daysLeft : 0} días.`
            );
        }
    };

    // ─── Worker: open vault to share a file ──────────────────────────────────
    const openVaultPicker = async () => {
        setAttachMenuVisible(false);
        try {
            setFetchingVault(true);
            setVaultModalVisible(true);
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/vault/files`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVaultFiles(response.data as any[]);
        } catch (error) {
            console.error('Error fetching vault:', error);
            setVaultModalVisible(false);
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
                content: JSON.stringify({
                    fileId: file.id,
                    fileName: file.fileName,
                    fileType: file.fileType
                }),
                type: 'document'
            };
            // FIX: correct route is /chat/messages
            const response = await axios.post(`${API_URL}/chat/messages`, payload, {
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

    // ─── Lawyer: pick image from device ──────────────────────────────────────
    const openLawyerImagePicker = async () => {
        setAttachMenuVisible(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para adjuntar imágenes.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: false,
        });

        if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            await uploadLawyerFile(asset.uri, asset.fileName || 'imagen.jpg', 'image/jpeg');
        }
    };

    // ─── Lawyer: pick document from device ───────────────────────────────────
    const openLawyerDocumentPicker = async () => {
        setAttachMenuVisible(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*', 'application/msword',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                await uploadLawyerFile(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'No se pudo seleccionar el documento.');
        }
    };

    // ─── Upload file to backend and send as chat message ─────────────────────
    const uploadLawyerFile = async (uri: string, fileName: string, mimeType: string) => {
        setSending(true);
        try {
            const token = await getAccessToken();

            // Build multipart form data
            const formData = new FormData();
            formData.append('file', {
                uri,
                name: fileName,
                type: mimeType,
            } as any);
            formData.append('requestId', requestId);

            // Upload to chat upload endpoint
            const uploadResponse = await axios.post(`${API_URL}/chat/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            const { fileUrl, storedFileName } = uploadResponse.data as any;

            // Now send the message referencing the uploaded file
            const payload = {
                requestId,
                content: JSON.stringify({
                    fileUrl,
                    fileName: storedFileName || fileName,
                    fileType: mimeType,
                }),
                type: 'document'
            };

            const msgResponse = await axios.post(`${API_URL}/chat/messages`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [msgResponse.data, ...prev]);
        } catch (error: any) {
            console.error('Error uploading file:', error?.response?.data || error);
            Alert.alert('Error', 'No se pudo enviar el archivo. Intenta de nuevo.');
        } finally {
            setSending(false);
        }
    };

    // ─── Send text message ────────────────────────────────────────────────────
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
            // FIX: correct route is /chat/messages
            const response = await axios.post(`${API_URL}/chat/messages`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [response.data, ...prev]);
            setInputText('');
        } catch (error: any) {
            console.error('Error sending message:', error?.response?.data || error);
            Alert.alert('Error', 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    // ─── View shared document ─────────────────────────────────────────────────
    const handleViewDocument = async (message: any) => {
        try {
            const fileInfo = JSON.parse(message.content);

            // Lawyer-uploaded files have a direct fileUrl
            if (fileInfo.fileUrl) {
                Linking.openURL(fileInfo.fileUrl);
                return;
            }

            // Worker vault files need a signed URL from backend
            const token = await getAccessToken();
            const response = await axios.get(
                `${API_URL}/vault/files/${fileInfo.fileId}/download?requestId=${requestId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { downloadUrl } = response.data as any;
            Linking.openURL(downloadUrl);
        } catch (error) {
            console.error('Error opening document:', error);
            Alert.alert('Error', 'No se pudo abrir el documento.');
        }
    };

    // ─── Attachment menu: different options by role ───────────────────────────
    const handleAttachPress = () => {
        setAttachMenuVisible(true);
    };

    // ─── Render message ───────────────────────────────────────────────────────
    const renderMessage = ({ item }: { item: any }) => {
        const isMyMessage = item.senderId === user?.id;

        if (item.type === 'document') {
            let docInfo: any = {};
            try {
                docInfo = JSON.parse(item.content);
            } catch (e) {
                docInfo = { fileName: 'Archivo adjunto' };
            }

            return (
                <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer]}>
                    <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble, styles.documentBubble]}>
                        <View style={styles.documentHeader}>
                            <Ionicons
                                name={docInfo.fileType?.includes('image') ? 'image' : 'document-text'}
                                size={32}
                                color={isMyMessage ? '#fff' : AppTheme.colors.primary}
                            />
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
                    {item.status === 'queued' && (
                        <View style={styles.queuedBadge}>
                            <Ionicons name="time-outline" size={12} color="#f39c12" />
                            <Text style={styles.queuedText}>Programado</Text>
                        </View>
                    )}
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
                        {moment(item.createdAt).format('HH:mm')}
                        {item.status === 'queued' ? ' · ⏰' : ''}
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
                    <Text style={styles.headerSubtitle}>
                        {isLawyer ? 'Vista del Abogado' : 'Chat con tu Abogado'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.optionButton} onPress={() => setOptionsModalVisible(true)}>
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
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#ddd" />
                            <Text style={styles.emptyChatText}>Aún no hay mensajes.</Text>
                            <Text style={styles.emptyChatSub}>Envía el primero para comenzar.</Text>
                        </View>
                    }
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton} onPress={handleAttachPress}>
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

            {/* ── Attachment Menu Modal ─────────────────────────────────── */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={attachMenuVisible}
                onRequestClose={() => setAttachMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setAttachMenuVisible(false)}
                >
                    <View style={styles.attachMenu}>
                        <Text style={styles.attachMenuTitle}>Adjuntar archivo</Text>

                        {isWorker ? (
                            // Worker/Pyme: share from vault
                            <TouchableOpacity style={styles.attachOption} onPress={openVaultPicker}>
                                <View style={[styles.attachIcon, { backgroundColor: '#e8f4fd' }]}>
                                    <Ionicons name="folder-open" size={28} color="#2980b9" />
                                </View>
                                <View style={styles.attachOptionText}>
                                    <Text style={styles.attachOptionTitle}>Mi Baúl Personal</Text>
                                    <Text style={styles.attachOptionSub}>Comparte documentos de tu baúl</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            // Lawyer: upload from device
                            <>
                                <TouchableOpacity style={styles.attachOption} onPress={openLawyerImagePicker}>
                                    <View style={[styles.attachIcon, { backgroundColor: '#e8f5e9' }]}>
                                        <Ionicons name="image" size={28} color="#27ae60" />
                                    </View>
                                    <View style={styles.attachOptionText}>
                                        <Text style={styles.attachOptionTitle}>Imagen / Foto</Text>
                                        <Text style={styles.attachOptionSub}>Adjunta una imagen de tu galería</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.attachOption} onPress={openLawyerDocumentPicker}>
                                    <View style={[styles.attachIcon, { backgroundColor: '#fef9e7' }]}>
                                        <Ionicons name="document-text" size={28} color="#e67e22" />
                                    </View>
                                    <View style={styles.attachOptionText}>
                                        <Text style={styles.attachOptionTitle}>Documento (PDF / Word)</Text>
                                        <Text style={styles.attachOptionSub}>Sube un escrito, contrato o informe</Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Vault Picker Modal (Worker) ───────────────────────────── */}
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
                                                name={file.fileType?.includes('pdf') ? 'document-text' : 'image'}
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

            {/* ── Options Menu Modal (Worker & Lawyer) ──────────────────── */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={optionsModalVisible}
                onRequestClose={() => setOptionsModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOptionsModalVisible(false)}
                >
                    <View style={styles.optionsMenuContent}>
                        <Text style={styles.optionsMenuTitle}>Opciones del Caso</Text>
                        
                        {isWorker ? (
                            <>
                                <TouchableOpacity 
                                    style={styles.optionsMenuItem} 
                                    onPress={handleReassignPress}
                                >
                                    <Ionicons 
                                        name="refresh-circle-outline" 
                                        size={24} 
                                        color={caseInfo?.canReassignLawyer ? '#e74c3c' : '#7f8c8d'} 
                                    />
                                    <View style={styles.optionsMenuTextContainer}>
                                        <Text style={[styles.optionsMenuItemTitle, !caseInfo?.canReassignLawyer && styles.disabledText]}>
                                            Cambiar de Abogado
                                        </Text>
                                        <Text style={styles.optionsMenuItemSub}>
                                            {caseInfo?.canReassignLawyer 
                                                ? 'Reasignar caso por inactividad' 
                                                : 'Requiere 5 días hábiles sin respuesta'
                                            }
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.optionsMenuItem} 
                                    onPress={handleArchiveCase}
                                >
                                    <Ionicons name="close-circle-outline" size={24} color="#e74c3c" />
                                    <View style={styles.optionsMenuTextContainer}>
                                        <Text style={styles.optionsMenuItemTitle}>Cerrar y Archivar Caso</Text>
                                        <Text style={styles.optionsMenuItemSub}>Finalizar seguimiento voluntariamente</Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity 
                                    style={styles.optionsMenuItem} 
                                    onPress={handleArchivePress}
                                >
                                    <Ionicons 
                                        name="archive-outline" 
                                        size={24} 
                                        color={caseInfo?.canArchiveCase ? '#e74c3c' : '#7f8c8d'} 
                                    />
                                    <View style={styles.optionsMenuTextContainer}>
                                        <Text style={[styles.optionsMenuItemTitle, !caseInfo?.canArchiveCase && styles.disabledText]}>
                                            Archivar por Inactividad
                                        </Text>
                                        <Text style={styles.optionsMenuItemSub}>
                                            {caseInfo?.canArchiveCase 
                                                ? 'Archivar caso por inactividad del cliente' 
                                                : 'Requiere 7 días laborables sin respuesta'
                                            }
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.optionsMenuItem} 
                                    onPress={handleArchiveCase}
                                >
                                    <Ionicons name="close-circle-outline" size={24} color="#e74c3c" />
                                    <View style={styles.optionsMenuTextContainer}>
                                        <Text style={styles.optionsMenuItemTitle}>Cerrar y Archivar Caso</Text>
                                        <Text style={styles.optionsMenuItemSub}>Finalizar seguimiento de mutuo acuerdo</Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity 
                            style={[styles.optionsMenuItem, { borderBottomWidth: 0, marginTop: 8 }]} 
                            onPress={() => setOptionsModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#333" />
                            <Text style={[styles.optionsMenuItemTitle, { color: '#333', fontWeight: 'bold', marginLeft: 16 }]}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
    backButton: { padding: 8, marginRight: 8 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    optionButton: { padding: 8 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 24 },
    // Empty state
    emptyChat: { alignItems: 'center', marginTop: 80 },
    emptyChatText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#999' },
    emptyChatSub: { marginTop: 4, fontSize: 14, color: '#bbb' },
    // Messages
    messageContainer: { marginBottom: 12, flexDirection: 'row' },
    myMessageContainer: { justifyContent: 'flex-end' },
    theirMessageContainer: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    myBubble: { backgroundColor: AppTheme.colors.primary, borderBottomRightRadius: 4 },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: { fontSize: 16, lineHeight: 22 },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: '#333' },
    timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    myTimestamp: { color: 'rgba(255,255,255,0.7)' },
    theirTimestamp: { color: '#999' },
    // Queued badge
    queuedBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    queuedText: { fontSize: 11, color: '#f39c12', marginLeft: 4, fontStyle: 'italic' },
    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    attachButton: { padding: 10 },
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
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    sendButtonDisabled: { backgroundColor: '#ccc' },
    // Document bubble
    documentBubble: { width: '80%' },
    documentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    documentInfo: { marginLeft: 12, flex: 1 },
    documentName: { fontSize: 15, fontWeight: 'bold' },
    documentType: { fontSize: 11, marginTop: 2 },
    viewButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 8, borderRadius: 8, marginTop: 4,
    },
    viewButtonText: { fontSize: 13, fontWeight: '600', marginRight: 6 },
    // Attach menu
    attachMenu: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    attachMenuTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 20 },
    attachOption: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 14,
        backgroundColor: '#FAFAFA',
        marginBottom: 12,
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    attachIcon: {
        width: 52, height: 52, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    attachOptionText: { flex: 1 },
    attachOptionTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
    attachOptionSub: { fontSize: 12, color: '#999', marginTop: 2 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        minHeight: '40%', maxHeight: '80%', padding: 20,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    vaultList: { paddingBottom: 20 },
    vaultItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: 15, backgroundColor: '#F8F9FA',
        borderRadius: 12, marginBottom: 10,
    },
    vaultFileName: { flex: 1, marginLeft: 15, fontSize: 14, color: '#333', fontWeight: '500' },
    emptyVault: { alignItems: 'center', marginTop: 40 },
    emptyVaultText: { marginTop: 10, color: '#999' },
    // Options Menu Modal Styles
    optionsMenuContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    optionsMenuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionsMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    optionsMenuTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    optionsMenuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e74c3c',
    },
    optionsMenuItemSub: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    disabledText: {
        color: '#7f8c8d',
    },
});

export default CaseChatScreen;
