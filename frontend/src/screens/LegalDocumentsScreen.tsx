import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, RefreshControl, Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

import { endpoints, API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface DocumentProduct {
    type: string;
    name: string;
    description: string;
    price: number;
    priceDisplay: string;
    icon: string;
}

interface MyDocument {
    id: string;
    documentType: string;
    status: 'pending_payment' | 'paid' | 'generated';
    amount: number;
    workerName: string | null;
    employerName: string | null;
    createdAt: string;
}

// ─────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────

const LegalDocumentsScreen = () => {
    const navigation = useNavigation<any>();
    const { getAccessToken } = useAuth();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [catalog, setCatalog] = useState<DocumentProduct[]>([]);
    const [myDocuments, setMyDocuments] = useState<MyDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [purchasingType, setPurchasingType] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const token = await getAccessToken();

            const [catalogRes, myDocsRes] = await Promise.all([
                fetch(endpoints.legalDocuments.catalog),
                fetch(endpoints.legalDocuments.myDocuments, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (catalogRes.ok) {
                const data = await catalogRes.json();
                setCatalog(data.documents || []);
            }
            if (myDocsRes.ok) {
                const data = await myDocsRes.json();
                setMyDocuments(data.documents || []);
            }
        } catch (err) {
            console.error('Error fetching legal documents:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getAccessToken]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // ── PURCHASE FLOW ──────────────────────────────

    const handlePurchase = async (product: DocumentProduct) => {
        Alert.alert(
            `${product.icon} ${product.name}`,
            `${product.description}\n\nPrecio: ${product.priceDisplay} MXN\n\nEste documento se generará con tus datos de la calculadora y podrás descargarlo como PDF.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: `Comprar ${product.priceDisplay}`, onPress: () => startPurchase(product) },
            ]
        );
    };

    const startPurchase = async (product: DocumentProduct) => {
        try {
            setPurchasingType(product.type);
            const token = await getAccessToken();

            const res = await fetch(endpoints.legalDocuments.purchase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ documentType: product.type }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al iniciar el pago');
            }

            const { paymentIntent, ephemeralKey, customer } = await res.json();

            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Aliado Laboral',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                allowsDelayedPaymentMethods: false,
            });

            if (initError) throw new Error(initError.message);

            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code !== 'Canceled') {
                    Alert.alert('Error en el pago', presentError.message);
                }
                return;
            }

            // Payment succeeded — webhook will activate document
            Alert.alert(
                '✅ ¡Pago exitoso!',
                'Tu escrito legal está siendo preparado. En unos segundos recibirás una notificación para descargarlo.',
                [{ text: 'Entendido', onPress: () => fetchData() }]
            );

        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo completar el pago');
        } finally {
            setPurchasingType(null);
        }
    };

    // ── DOWNLOAD FLOW ──────────────────────────────

    const handleDownload = async (doc: MyDocument) => {
        try {
            setDownloadingId(doc.id);
            const token = await getAccessToken();

            // Open the PDF URL in the browser (Expo handles PDF opening)
            const pdfUrl = `${API_URL}/legal-documents/generate/${doc.id}`;

            // We pass the token as a query param (simplest approach for downloads)
            const urlWithToken = `${pdfUrl}?token=${token}`;
            await Linking.openURL(urlWithToken);

        } catch (err) {
            Alert.alert('Error', 'No se pudo descargar el documento');
        } finally {
            setDownloadingId(null);
        }
    };

    // ─────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────

    const docStatusConfig: Record<string, { label: string; color: string; icon: string }> = {
        pending_payment: { label: 'Pago pendiente', color: '#f39c12', icon: 'time-outline' },
        paid: { label: 'Listo para descargar', color: '#27ae60', icon: 'cloud-download-outline' },
        generated: { label: 'Descargado', color: '#2980b9', icon: 'checkmark-circle-outline' },
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>Cargando documentos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#1a237e', '#283593']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>📄 Escritos Legales</Text>
                    <Text style={styles.headerSubtitle}>Documentos formales generados con tus datos</Text>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Ionicons name="information-circle-outline" size={18} color="#5d4037" />
                    <Text style={styles.disclaimerText}>
                        Estos documentos son borradores orientativos. Se recomienda revisarlos con un abogado antes de presentarlos.
                    </Text>
                </View>

                {/* CATALOG */}
                <Text style={styles.sectionTitle}>Documentos Disponibles</Text>
                {catalog.map((product) => {
                    const isPurchasing = purchasingType === product.type;
                    return (
                        <View key={product.type} style={styles.productCard}>
                            <View style={styles.productHeader}>
                                <Text style={styles.productIcon}>{product.icon}</Text>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    <Text style={styles.productDesc}>{product.description}</Text>
                                </View>
                            </View>
                            <View style={styles.productFooter}>
                                <Text style={styles.productPrice}>{product.priceDisplay} MXN</Text>
                                <TouchableOpacity
                                    style={[styles.buyButton, isPurchasing && styles.buyButtonDisabled]}
                                    onPress={() => handlePurchase(product)}
                                    disabled={isPurchasing}
                                >
                                    {isPurchasing
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={styles.buyButtonText}>Comprar</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                {/* MY DOCUMENTS */}
                {myDocuments.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Mis Documentos</Text>
                        {myDocuments.map((doc) => {
                            const statusCfg = docStatusConfig[doc.status] || docStatusConfig.paid;
                            const isDownloading = downloadingId === doc.id;
                            const canDownload = doc.status === 'paid' || doc.status === 'generated';
                            const productInfo = catalog.find(c => c.type === doc.documentType);

                            return (
                                <View key={doc.id} style={styles.myDocCard}>
                                    <View style={styles.myDocHeader}>
                                        <Text style={styles.myDocIcon}>{productInfo?.icon || '📄'}</Text>
                                        <View style={styles.myDocInfo}>
                                            <Text style={styles.myDocName}>{productInfo?.name || doc.documentType}</Text>
                                            <Text style={styles.myDocDate}>
                                                {new Date(doc.createdAt).toLocaleDateString('es-MX', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22' }]}>
                                            <Ionicons name={statusCfg.icon as any} size={14} color={statusCfg.color} />
                                            <Text style={[styles.statusText, { color: statusCfg.color }]}>
                                                {statusCfg.label}
                                            </Text>
                                        </View>
                                    </View>

                                    {canDownload && (
                                        <TouchableOpacity
                                            style={[styles.downloadButton, isDownloading && styles.buyButtonDisabled]}
                                            onPress={() => handleDownload(doc)}
                                            disabled={isDownloading}
                                        >
                                            {isDownloading
                                                ? <ActivityIndicator size="small" color="#1a237e" />
                                                : <>
                                                    <Ionicons name="download-outline" size={16} color="#1a237e" />
                                                    <Text style={styles.downloadButtonText}>Descargar PDF</Text>
                                                </>
                                            }
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

// ─────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#555', fontSize: 14 },

    header: { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 14, padding: 4 },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

    scrollContent: { padding: 18 },

    disclaimer: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#fff8e1', borderRadius: 10, padding: 14,
        borderLeftWidth: 4, borderLeftColor: '#f9a825', marginBottom: 22,
    },
    disclaimerText: { flex: 1, fontSize: 12, color: '#5d4037', lineHeight: 18 },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a237e', marginBottom: 12, letterSpacing: 0.3 },

    productCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    },
    productHeader: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    productIcon: { fontSize: 30 },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '700', color: '#1a237e', marginBottom: 4 },
    productDesc: { fontSize: 12.5, color: '#555', lineHeight: 18 },
    productFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
    productPrice: { fontSize: 18, fontWeight: '800', color: '#1a237e' },
    buyButton: {
        backgroundColor: '#1a237e', paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 8, flexDirection: 'row', alignItems: 'center', minWidth: 100, justifyContent: 'center',
    },
    buyButtonDisabled: { opacity: 0.6 },
    buyButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    myDocCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    myDocHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    myDocIcon: { fontSize: 24 },
    myDocInfo: { flex: 1 },
    myDocName: { fontSize: 14, fontWeight: '700', color: '#1a237e' },
    myDocDate: { fontSize: 11.5, color: '#888', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: '600' },
    downloadButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1.5, borderColor: '#1a237e', borderRadius: 8, paddingVertical: 9,
    },
    downloadButtonText: { color: '#1a237e', fontWeight: '700', fontSize: 13 },
});

export default LegalDocumentsScreen;
