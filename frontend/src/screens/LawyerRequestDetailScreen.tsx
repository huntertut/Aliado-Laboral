import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';

const LawyerRequestDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { requestId } = route.params as { requestId: string };
    const { user, getAccessToken } = useAuth(); // Obtener usuario real

    const [request, setRequest] = useState<any>(null);
    const [contactInfo, setContactInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRequestDetail();
        }
    }, [user]);

    const fetchRequestDetail = async () => {
        try {
            if (!user) return;
            const token = await getAccessToken();

            const response = await fetch(endpoints.contact.lawyerRequests, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            const foundRequest = data.requests?.find((r: any) => r.id === requestId);
            setRequest(foundRequest);

            // Si está aceptada, obtener datos de contacto
            if (foundRequest?.status === 'accepted') {
                const contactRes = await fetch(endpoints.contact.getContact(requestId), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const contactData = await contactRes.json();
                setContactInfo(contactData.contactInfo);
            }
        } catch (error) {
            console.error('Error al cargar detalle:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = () => {
        const isHot = request.isHot || request.classification === 'hot';
        const fee = isHot ? 300 : 150;

        Alert.alert(
            `¿Aceptar esta solicitud?`,
            `Este es un caso ${isHot ? 'HOT LEAD (Alta Prioridad)' : 'ESTÁNDAR'}.\n\nSe cobrarán:\n• $${fee} MXN a tu cuenta\n• $50 MXN al trabajador\n\nAl aceptar se desbloqueará el contacto completo.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: `Aceptar y pagar $${fee}`, onPress: confirmAccept, style: 'default' }
            ]
        );
    };

    const confirmAccept = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            const token = await getAccessToken();

            const response = await fetch(endpoints.contact.acceptRequest(requestId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                Alert.alert('¡Solicitud aceptada!', 'Los datos de contacto han sido desbloqueados.');
                fetchRequestDetail(); // Recargar para mostrar contacto
            } else {
                Alert.alert('Error', 'No se pudo aceptar la solicitud');
            }
        } catch (error) {
            console.error('Error al aceptar:', error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = () => {
        Alert.alert(
            'Rechazar solicitud',
            'El trabajador será notificado. No se cobrará nada.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Rechazar', onPress: confirmReject, style: 'destructive' }
            ]
        );
    };

    const confirmReject = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            const token = await getAccessToken();

            const response = await fetch(endpoints.contact.rejectRequest(requestId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'No puedo tomar este caso en este momento' })
            });

            if (response.ok) {
                Alert.alert('Solicitud rechazada', '', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Error al rechazar:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (!request) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Solicitud no encontrada</Text>
            </View>
        );
    }

    const urgencyConfig = {
        low: { color: '#95a5a6', label: 'Baja' },
        normal: { color: '#3498db', label: 'Normal' },
        high: { color: '#e74c3c', label: 'Alta' }
    };

    const urgency = urgencyConfig[request.urgency as keyof typeof urgencyConfig];

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Solicitud</Text>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Worker info */}
                <View style={styles.workerCard}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color="#667eea" />
                    </View>
                    <Text style={styles.workerName}>{request.worker?.fullName}</Text>
                    {request.status === 'accepted' && (
                        <View style={styles.unlockedBadge}>
                            <Ionicons name="lock-open" size={16} color="#27ae60" />
                            <Text style={styles.unlockedText}>Datos desbloqueados</Text>
                        </View>
                    )}
                </View>

                {/* Case type and urgency */}
                <View style={styles.section}>
                    <View style={styles.infoRow}>
                        <Ionicons name="folder-outline" size={20} color="#7f8c8d" />
                        <Text style={styles.infoLabel}>Tipo de caso:</Text>
                        <Text style={styles.infoValue}>
                            {request.caseType?.charAt(0).toUpperCase() + request.caseType?.slice(1)}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="flash-outline" size={20} color={urgency.color} />
                        <Text style={styles.infoLabel}>Urgencia:</Text>
                        <Text style={[styles.infoValue, { color: urgency.color }]}>{urgency.label}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color="#7f8c8d" />
                        <Text style={styles.infoLabel}>Fecha:</Text>
                        <Text style={styles.infoValue}>
                            {new Date(request.createdAt).toLocaleDateString('es-MX')}
                        </Text>
                    </View>
                </View>

                {/* Case summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descripción del Caso</Text>
                    <Text style={styles.caseSummary}>{request.caseSummary}</Text>
                </View>

                {/* Documents */}
                {request.documents?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Documentos Adjuntos</Text>
                        {request.documents.map((doc: any) => (
                            <View key={doc.id} style={styles.documentCard}>
                                <Ionicons name="document-text" size={24} color="#667eea" />
                                <Text style={styles.documentName}>{doc.fileName}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Contact info (only if accepted) */}
                {request.status === 'accepted' && contactInfo && (
                    <View style={styles.contactSection}>
                        <Text style={styles.sectionTitle}>Datos de Contacto</Text>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => Linking.openURL(`tel:${contactInfo.worker.phone || contactInfo.phone}`)}
                        >
                            <Ionicons name="call" size={20} color="#fff" />
                            <Text style={styles.contactButtonText}>
                                Llamar: {contactInfo.worker.phone || contactInfo.phone || 'No disponible'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => Linking.openURL(`mailto:${contactInfo.worker.email}`)}
                        >
                            <Ionicons name="mail" size={20} color="#fff" />
                            <Text style={styles.contactButtonText}>
                                Email: {contactInfo.worker.email}
                            </Text>
                        </TouchableOpacity>

                        {contactInfo.whatsapp && (
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: '#25D366' }]}
                                onPress={() => Linking.openURL(`https://wa.me/${contactInfo.whatsapp}`)}
                            >
                                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                                <Text style={styles.contactButtonText}>WhatsApp</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={{ height: 150 }} />
            </ScrollView>

            {/* Action buttons (only if pending) */}
            {request.status === 'pending' && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.rejectButton, actionLoading && { opacity: 0.5 }]}
                        onPress={handleReject}
                        disabled={actionLoading}
                    >
                        <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.acceptButton, actionLoading && { opacity: 0.5 }]}
                        onPress={handleAccept}
                        disabled={actionLoading}
                    >
                        <LinearGradient
                            colors={['#27ae60', '#2ecc71']}
                            style={styles.acceptGradient}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.acceptButtonText}>Aceptar ($150)</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#e74c3c' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backButton: { marginBottom: 15 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    content: { flex: 1 },
    workerCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e8eaf6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    workerName: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
    unlockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d4edda',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    unlockedText: { color: '#27ae60', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
    section: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 20, borderRadius: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    infoLabel: { fontSize: 14, color: '#7f8c8d', marginLeft: 10, marginRight: 10 },
    infoValue: { fontSize: 14, color: '#2c3e50', fontWeight: '600' },
    caseSummary: { fontSize: 15, color: '#34495e', lineHeight: 24 },
    documentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    documentName: { fontSize: 14, color: '#34495e', marginLeft: 12 },
    contactSection: {
        backgroundColor: '#d4edda',
        marginHorizontal: 20,
        marginTop: 15,
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#27ae60',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3498db',
        padding: 14,
        borderRadius: 8,
        marginBottom: 10,
    },
    contactButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 10 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    rejectButton: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#e74c3c',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginRight: 10,
    },
    rejectButtonText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' },
    acceptButton: { flex: 2, borderRadius: 10, overflow: 'hidden' },
    acceptGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
    },
    acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default LawyerRequestDetailScreen;
