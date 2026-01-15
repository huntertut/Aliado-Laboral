import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import PaywallModal from '../../components/PaywallModal';

interface PymeDocument {
    id: string;
    name: string;
    type: string;
    url: string;
    createdAt: string;
}

const LaborDocumentsScreen = () => {
    const navigation = useNavigation();
    const { user, getAccessToken } = useAuth();
    const [documents, setDocuments] = useState<PymeDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [paywallVisible, setPaywallVisible] = useState(false);

    const isBasic = !user?.subscriptionLevel || user.subscriptionLevel === 'basic';
    const MAX_DOCS_BASIC = 3;

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/pyme-profile/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async () => {
        if (isBasic && documents.length >= MAX_DOCS_BASIC) {
            setPaywallVisible(true);
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setIsUploading(true);

                // Convert file to base64 for mockup upload
                const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });

                const token = await getAccessToken();
                const response = await fetch(`${API_URL}/pyme-profile/documents/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: file.name,
                        type: 'contract', // Simple default for now
                        base64
                    })
                });

                if (response.ok) {
                    Alert.alert('Éxito', 'Documento guardado correctamente.');
                    fetchDocuments();
                } else {
                    Alert.alert('Error', 'No se pudo subir el documento.');
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Hubo un problema al seleccionar el archivo.');
        } finally {
            setIsUploading(false);
        }
    };

    const renderDocItem = ({ item }: { item: PymeDocument }) => (
        <View style={styles.docCard}>
            <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.docDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Aviso', 'La visualización de documentos está restringida en esta versión.')}>
                <Ionicons name="eye-outline" size={20} color="#666" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Documentos Laborales</Text>
            </View>

            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    Almacenamiento: <Text style={{ fontWeight: 'bold' }}>{documents.length} / {isBasic ? MAX_DOCS_BASIC : '∞'}</Text> archivos
                </Text>
                {isBasic && (
                    <View style={styles.basicBadge}>
                        <Text style={styles.basicBadgeText}>BASIC</Text>
                    </View>
                )}
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={documents}
                    renderItem={renderDocItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No has subido documentos.</Text>
                            <Text style={styles.emptySubText}>Organiza tus contratos y recibos aquí.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={handleUpload} disabled={isUploading}>
                {isUploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Ionicons name="add" size={30} color="#fff" />
                )}
            </TouchableOpacity>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                featureName="Almacenamiento Ilimitado"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        elevation: 2,
    },
    backButton: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#e3f2fd',
    },
    statsText: { fontSize: 14, color: '#1565c0' },
    basicBadge: {
        backgroundColor: '#bbdefb',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    basicBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#0d47a1' },
    listContent: { padding: 20 },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    docInfo: { flex: 1 },
    docName: { fontSize: 16, fontWeight: '500', color: '#333' },
    docDate: { fontSize: 12, color: '#666', marginTop: 2 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: '#666', marginTop: 10 },
    emptySubText: { fontSize: 14, color: '#999', marginTop: 5 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
});

export default LaborDocumentsScreen;
