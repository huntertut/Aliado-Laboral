import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
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
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchRequestDetail();
        }
    }, [user]);

    const fetchRequestDetail = async () => {
        try {
            // --- DEMO DATA HANDLER ---
            if (requestId.startsWith('req-')) {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));

                let mockData;
                if (requestId === 'req-1') {
                    mockData = {
                        id: 'req-1',
                        worker: { fullName: 'Juan Pérez', id: 'worker-1' },
                        caseType: 'despido',
                        urgency: 'high',
                        caseSummary: 'Me despidieron injustificadamente después de 5 años. No me dieron finiquito. Intenté hablar con RH pero me negaron el acceso a la planta.',
                        createdAt: new Date(Date.now() - 3600000).toISOString(),
                        status: 'pending',
                        details: 'El trabajador indica que tiene grabaciones de la conversación con su jefe directo.',
                        documents: [
                            { id: 'd1', fileName: 'Carta_Despido.pdf' },
                            { id: 'd2', fileName: 'Recibos_Nomina.pdf' }
                        ],
                        isHot: true
                    };
                } else if (requestId === 'req-2') {
                    mockData = {
                        id: 'req-2',
                        worker: { fullName: 'María González', id: 'worker-2' },
                        caseType: 'acoso',
                        urgency: 'normal',
                        caseSummary: 'Sufro acoso laboral por parte de mi supervisor directo. Me hace comentarios inapropiados y me carga la mano con trabajo fuera de horario.',
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        status: 'pending',
                        documents: []
                    };
                } else if (requestId === 'req-3') {
                    mockData = {
                        id: 'req-3',
                        worker: { fullName: 'Pedro López', id: 'worker-3' },
                        caseType: 'otro',
                        urgency: 'low',
                        caseSummary: 'Duda sobre mis vacaciones. Cumplo un año la próxima semana y quiero saber cuántos días me tocan.',
                        createdAt: new Date(Date.now() - 172800000).toISOString(),
                        status: 'accepted'
                    };
                    // Mock Contact Info for Accepted Case
                    setContactInfo({
                        worker: { phone: '55 1234 5678', email: 'pedro.demo@email.com' },
                        phone: '55 1234 5678',
                        whatsapp: '5512345678'
                    });
                } else {
                    // Rejected Case (req-4)
                    mockData = {
                        id: 'req-4',
                        worker: { fullName: 'Ana Martínez', id: 'worker-4' },
                        caseType: 'accidente',
                        urgency: 'high',
                        caseSummary: 'Tuve un accidente en la oficina y no me quieren pagar incapacidad.',
                        createdAt: new Date(Date.now() - 259200000).toISOString(),
                        status: 'rejected'
                    };
                }

                setRequest(mockData);
                setLoading(false);
                return;
            }
            // -------------------------

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
        setActionError(null);
        setShowAcceptModal(true);
    };

    const confirmAccept = async () => {
        if (!user) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const token = await getAccessToken();

            const response = await fetch(endpoints.contact.acceptRequest(requestId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setShowAcceptModal(false);
                Alert.alert('¡Solicitud aceptada!', 'Los datos de contacto han sido desbloqueados.');
                fetchRequestDetail(); // Recargar para mostrar contacto
            } else {
                setActionError(data.error || data.message || 'No se pudo aceptar la solicitud');
            }
        } catch (error) {
            console.error('Error al aceptar:', error);
            setActionError('Error de conexión');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = () => {
        setActionError(null);
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!user) return;
        setActionLoading(true);
        setActionError(null);
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

            const data = await response.json();

            if (response.ok) {
                setShowRejectModal(false);
                Alert.alert('Solicitud rechazada', '', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                setActionError(data.error || data.message || 'No se pudo rechazar la solicitud');
            }
        } catch (error) {
            console.error('Error al rechazar:', error);
            setActionError('Error de conexión');
        } finally {
            setActionLoading(false);
        }
    };

    const updateCRMStatus = async (status: string) => {
        try {
            if (!user) return;
            const token = await getAccessToken();

            const response = await fetch(`${endpoints.contact.lawyerRequests}/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                // Update local state optimistic or refresh
                setRequest({ ...request, crmStatus: status });

                if (status === 'CLOSED_WON') {
                    Alert.alert('🎉 ¡Felicidades!', 'Has ganado este caso. ¡Sigue así!');
                }
            } else {
                Alert.alert('Error', 'No se pudo actualizar el estado');
            }
        } catch (e) {
            console.error(e);
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

                {/* CRM MANAGEMENT SECTION */}
                {request.status === 'accepted' && (
                    <View style={[styles.section, { borderLeftWidth: 4, borderLeftColor: '#f1c40f' }]}>
                        <Text style={styles.sectionTitle}>Gestión del Lead (CRM)</Text>
                        <Text style={styles.crmSubtitle}>Estado actual del prospecto:</Text>

                        <View style={styles.crmGrid}>
                            {[
                                { id: 'NEW', label: 'Nuevo', color: '#3498db' },
                                { id: 'CONTACTED', label: 'Contactado', color: '#9b59b6' },
                                { id: 'NEGOTIATING', label: 'Negociando', color: '#e67e22' },
                                { id: 'CLOSED_WON', label: 'Ganado 🎉', color: '#2ecc71' },
                                { id: 'CLOSED_LOST', label: 'Perdido', color: '#95a5a6' },
                            ].map((status) => (
                                <TouchableOpacity
                                    key={status.id}
                                    style={[
                                        styles.crmChip,
                                        (request.crmStatus === status.id || (!request.crmStatus && status.id === 'NEW')) && { backgroundColor: status.color },
                                        (request.crmStatus !== status.id && (request.crmStatus || status.id !== 'NEW')) && { borderColor: status.color, borderWidth: 1 }
                                    ]}
                                    onPress={() => updateCRMStatus(status.id)}
                                >
                                    <Text style={[
                                        styles.crmChipText,
                                        (request.crmStatus === status.id || (!request.crmStatus && status.id === 'NEW')) ? { color: '#fff' } : { color: status.color }
                                    ]}>
                                        {status.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
                                    <Text style={styles.acceptButtonText}>Aceptar (${(request.isHot || request.classification === 'hot') ? 300 : 150})</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Accept Modal */}
            <Modal
                visible={showAcceptModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => !actionLoading && setShowAcceptModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIconContainer}>
                            <Ionicons name="checkmark-circle" size={50} color="#27ae60" />
                        </View>
                        <Text style={styles.modalTitle}>¿Aceptar esta solicitud?</Text>
                        
                        <Text style={styles.modalText}>
                            Este es un caso {(request.isHot || request.classification === 'hot') ? 'HOT LEAD (Alta Prioridad)' : 'ESTÁNDAR'}.
                        </Text>
                        <Text style={styles.modalText}>
                            Se cobrarán:
                        </Text>
                        <Text style={styles.modalBullet}>• ${(request.isHot || request.classification === 'hot') ? 300 : 150} MXN a tu cuenta</Text>
                        <Text style={styles.modalBullet}>• $50 MXN al trabajador</Text>

                        <Text style={[styles.modalText, { marginTop: 10, fontWeight: 'bold' }]}>
                            Al aceptar se desbloqueará el contacto completo.
                        </Text>

                        {actionError && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorBoxText}>{actionError}</Text>
                            </View>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => { setActionError(null); setShowAcceptModal(false); }}
                                disabled={actionLoading}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonAccept]}
                                onPress={confirmAccept}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalButtonAcceptText}>Aceptar y Pagar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal
                visible={showRejectModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => !actionLoading && setShowRejectModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalIconContainer, { backgroundColor: '#ffeaa7' }]}>
                            <Ionicons name="close-circle" size={50} color="#e17055" />
                        </View>
                        <Text style={styles.modalTitle}>Rechazar solicitud</Text>
                        <Text style={styles.modalText}>
                            El trabajador será notificado de que no puedes tomar su caso.
                            No se te cobrará nada.
                        </Text>

                        {actionError && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorBoxText}>{actionError}</Text>
                            </View>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => { setActionError(null); setShowRejectModal(false); }}
                                disabled={actionLoading}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonReject]}
                                onPress={confirmReject}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalButtonRejectText}>Rechazar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    rejectButtonText: {
        color: '#e74c3c',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e8f8f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2d3436',
        marginBottom: 12,
        textAlign: 'center'
    },
    modalText: {
        fontSize: 16,
        color: '#636e72',
        textAlign: 'center',
        lineHeight: 22
    },
    modalBullet: {
        fontSize: 16,
        color: '#636e72',
        textAlign: 'left',
        alignSelf: 'flex-start',
        marginLeft: 20,
        marginTop: 4
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 24
    },
    modalButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8
    },
    modalButtonCancel: {
        backgroundColor: '#f1f2f6'
    },
    modalButtonCancelText: {
        color: '#2d3436',
        fontWeight: 'bold',
        fontSize: 16
    },
    modalButtonAccept: {
        backgroundColor: '#27ae60'
    },
    modalButtonAcceptText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    modalButtonReject: {
        backgroundColor: '#e74c3c'
    },
    modalButtonRejectText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    errorBox: {
        backgroundColor: '#ffeaa7',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        width: '100%',
        borderLeftWidth: 4,
        borderLeftColor: '#e17055'
    },
    errorBoxText: {
        color: '#d63031',
        fontSize: 14,
        fontWeight: '500'
    },
    acceptButton: { flex: 2, borderRadius: 10, overflow: 'hidden' },
    acceptGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
    },
    acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

    // CRM Styles
    crmSubtitle: { fontSize: 13, color: '#95a5a6', marginBottom: 12 },
    crmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    crmChip: {
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
        marginRight: 8,
    },
    crmChipText: { fontSize: 12, fontWeight: 'bold' }
});

export default LawyerRequestDetailScreen;
