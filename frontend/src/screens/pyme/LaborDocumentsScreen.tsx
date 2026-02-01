import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
    const [isGenerating, setIsGenerating] = useState(false);
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

    const generateAgreement = async () => {
        if (isBasic) {
            setPaywallVisible(true);
            return;
        }

        setIsGenerating(true);
        try {
            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 40px; line-height: 1.6; }
                        h1 { text-align: center; font-size: 18px; margin-bottom: 20px; text-transform: uppercase; }
                        .header { text-align: right; margin-bottom: 30px; font-size: 12px; }
                        .clause { margin-bottom: 15px; text-align: justify; }
                        .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
                        .sig-block { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 10px; }
                        .bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        Asunto: Convenio de Terminación de Relación Laboral<br/>
                        Lugar: Ciudad de México<br/>
                        Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    <h1>CONVENIO DE TERMINACIÓN DE RELACIÓN DE TRABAJO FUERA DE JUICIO</h1>

                    <p class="clause">
                        EN LA CIUDAD DE MÉXICO, SIENDO LAS 12:00 HORAS DEL DÍA DE HOY, COMPARECEN POR UNA PARTE LA EMPRESA <span class="bold">"LA EMPRESA S.A. DE C.V."</span> (EL PATRÓN), Y POR LA OTRA PARTE EL C. <span class="bold">TRABAJADOR EJEMPLO</span> (EL TRABAJADOR), QUIENES VIENEN A CELEBRAR EL PRESENTE CONVENIO AL TENOR DE LAS SIGUIENTES:
                    </p>

                    <h1>CLÁUSULAS</h1>

                    <p class="clause">
                        <span class="bold">PRIMERA.-</span> AMBAS PARTES SE RECONOCEN MUTUAMENTE LA PERSONALIDAD CON LA QUE COMPARECEN Y MANIFIESTAN QUE DAN POR TERMINADA LA RELACIÓN LABORAL QUE LOS UNÍA, CON FECHA DE HOY, DE MANERA VOLUNTARIA Y POR ASÍ CONVENIR A SUS INTERESES, CON FUNDAMENTO EN LA FRACCIÓN I DEL ARTÍCULO 53 DE LA LEY FEDERAL DEL TRABAJO.
                    </p>

                    <p class="clause">
                        <span class="bold">SEGUNDA.-</span> EL PATRÓN PAGA EN ESTE ACTO AL TRABAJADOR LA CANTIDAD DE <span class="bold">$15,000.00 M.N.</span> (QUINCE MIL PESOS 00/100 M.N.) MEDIANTE TRANSFERENCIA BANCARIA, CUBRIENDO CON ELLO TODAS Y CADA UNA DE LAS PRESTACIONES A LAS QUE TUVO DERECHO (VACACIONES, PRIMA VACACIONAL, AGUINALDO PROPORCIONAL Y PRIMA DE ANTIGÜEDAD).
                    </p>

                    <p class="clause">
                        <span class="bold">TERCERA.-</span> EL TRABAJADOR MANIFIESTA QUE NO SE LE ADEUDA CANTIDAD ALGUNA POR NINGÚN CONCEPTO Y OTORGA AL PATRÓN EL FINIQUITO MÁS AMPLIO QUE EN DERECHO PROCEDA, NO RESERVÁNDOSE ACCIÓN NI DERECHO ALGUNO QUE EJERCITAR EN SU CONTRA.
                    </p>

                    <p class="clause">
                        LEÍDO QUE FUE EL PRESENTE CONVENIO Y ENTERADAS LAS PARTES DE SU CONTENIDO Y ALCANCE LEGAL, LO FIRMAN AL MARGEN Y AL CALCE PARA CONSTANCIA CONFORME A DERECHO.
                    </p>

                    <div class="signatures">
                        <div class="sig-block">
                            EL PATRÓN<br/>
                            REP. LEGAL
                        </div>
                        <div class="sig-block">
                            EL TRABAJADOR<br/>
                            C. TRABAJADOR EJEMPLO
                        </div>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error('PDF Generation Error:', error);
            Alert.alert('Error', 'No se pudo generar el convenio.');
        } finally {
            setIsGenerating(false);
        }
    };

    const renderDocItem = ({ item }: { item: PymeDocument }) => (
        <View style={styles.docCard}>
            <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={24} color={AppTheme.colors.primary} />
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

            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.generateButton]}
                    onPress={generateAgreement}
                    disabled={isGenerating}
                >
                    {isGenerating ? <ActivityIndicator color="#fff" /> : <Ionicons name="print-outline" size={20} color="#fff" />}
                    <Text style={styles.actionButtonText}>Generar Convenio (STPS)</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={AppTheme.colors.primary} style={{ marginTop: 20 }} />
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
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    actionButtonsContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    generateButton: {
        backgroundColor: '#673ab7', // Deep Purple
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
});

export default LaborDocumentsScreen;

