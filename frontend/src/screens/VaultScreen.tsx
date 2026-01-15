import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/colors';
import moment from 'moment';

const VaultScreen = ({ navigation }: any) => {
    const { getAccessToken } = useAuth();
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/vault/files`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching vault files:', error);
            Alert.alert('Error', 'No se pudieron cargar tus archivos.');
        } finally {
            setLoading(false);
        }
    };

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                uploadFile(asset);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const uploadFile = async (asset: any) => {
        setUploading(true);
        try {
            const token = await getAccessToken();

            // 1. Get Signed URL
            const urlResponse = await axios.post(`${API_URL}/vault/upload-url`, {
                fileName: asset.name,
                fileType: asset.mimeType || 'application/octet-stream'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { uploadUrl, filePath } = urlResponse.data;

            // 2. Upload to Storage
            const fileResponse = await fetch(asset.uri);
            const blob = await fileResponse.blob();

            await fetch(uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: {
                    'Content-Type': asset.mimeType || 'application/octet-stream',
                },
            });

            // 3. Save Metadata
            await axios.post(`${API_URL}/vault/metadata`, {
                fileName: asset.name,
                filePath,
                fileType: asset.mimeType,
                size: asset.size
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Éxito', 'Archivo guardado en tu baúl.');
            fetchFiles();
        } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert('Error', 'No se pudo subir el archivo.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (fileId: string) => {
        Alert.alert(
            'Eliminar archivo',
            '¿Estás seguro de que quieres eliminar este archivo de tu baúl?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await getAccessToken();
                            await axios.delete(`${API_URL}/vault/files/${fileId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            fetchFiles();
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar el archivo.');
                        }
                    }
                }
            ]
        );
    };

    const renderFileItem = ({ item }: { item: any }) => {
        const getIcon = (type: string) => {
            if (type?.includes('image')) return 'image';
            if (type?.includes('pdf')) return 'document-text';
            return 'document';
        };

        return (
            <View style={styles.fileItem}>
                <View style={styles.fileIconContainer}>
                    <Ionicons name={getIcon(item.fileType)} size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                    <Text style={styles.fileMeta}>
                        {moment(item.uploadedAt).format('DD MMM YYYY')} • {(item.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Baúl Personal</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.premiumBanner}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
                <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerTitle}>Almacenamiento Seguro</Text>
                    <Text style={styles.bannerSubtitle}>Tus documentos están encriptados y solo tú puedes verlos.</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={files}
                    keyExtractor={item => item.id}
                    renderItem={renderFileItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cloud-upload-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Aún no tienes archivos en tu baúl.</Text>
                            <Text style={styles.emptySubtext}>Sube tus recibos de nómina, contratos o cualquier evidencia relevante.</Text>
                        </View>
                    }
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.uploadButton, uploading && styles.disabledButton]}
                    onPress={handlePickFile}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="add" size={24} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.uploadButtonText}>Subir Documento</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
    premiumBanner: {
        flexDirection: 'row',
        backgroundColor: '#F0F7FF',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    bannerTextContainer: { marginLeft: 12, flex: 1 },
    bannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
    bannerSubtitle: { fontSize: 12, color: '#7f8c8d' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 100 },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    fileIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: { flex: 1, marginLeft: 12 },
    fileName: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
    fileMeta: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
    deleteButton: { padding: 8 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    uploadButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        padding: 16,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    disabledButton: { backgroundColor: '#bdc3c7' },
    uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#7f8c8d', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#95a5a6', textAlign: 'center', marginTop: 8 },
});

export default VaultScreen;
