import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { AppTheme } from '../../theme/colors';
import { API_URL } from '../../config/constants';
import PaywallModal from '../../components/PaywallModal';
import { AccessControlService } from '../../services/AccessControlService';

const HomePymeScreen = () => {
    const navigation = useNavigation<any>();
    const { user, logout, getAccessToken } = useAuth();
    const [paywallVisible, setPaywallVisible] = useState(false);
    const [lockedFeature, setLockedFeature] = useState('');
    const [compliance, setCompliance] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isPremium = user?.subscriptionLevel === 'premium' || user?.plan === 'premium';

    const [liability, setLiability] = useState<any>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const token = await getAccessToken();
                const headers = { 'Authorization': `Bearer ${token}` };

                const [complianceRes, liabilityRes] = await Promise.all([
                    fetch(`${API_URL}/pyme-profile/compliance`, { headers }).catch(e => ({ ok: false })),
                    fetch(`${API_URL}/pyme-profile/liability`, { headers }).catch(e => ({ ok: false }))
                ]);

                if (complianceRes?.ok) {
                    setCompliance(await (complianceRes as Response).json());
                }

                if (liabilityRes?.ok) {
                    setLiability(await (liabilityRes as Response).json());
                }

            } catch (error) {
                console.error('Error fetching pyme dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFeatureAccess = (feature: string, action: () => void) => {
        let canAccess = true;

        switch (feature) {
            case 'Chat con Abogado':
                canAccess = AccessControlService.canUseChat(user?.subscriptionLevel as any);
                break;
            case 'Exportar Reportes':
                canAccess = AccessControlService.canDownloadValidatedPDF(user?.subscriptionLevel as any);
                break;
            default:
                canAccess = true;
        }

        if (canAccess) {
            action();
        } else {
            setLockedFeature(feature);
            setPaywallVisible(true);
        }
    };

    // Helper para formatear nombre
    const formatName = (name: string) => {
        if (!name) return 'Mi Empresa';
        return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // --- BLOQUES DE CONTENIDO ---

    const renderHero = () => (
        <View style={styles.blockContainer}>
            <Text style={styles.blockTitle}>Estado Laboral de tu Empresa</Text>
            {/* Financial Risk "RED" Card */}
            {liability && liability.totalLiability > 0 ? (
                <View style={[styles.heroCard, { borderLeftColor: '#f44336', backgroundColor: '#fff5f5' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#d32f2f', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                🚨 Riesgo Financiero Actual
                            </Text>
                            <Text style={{ fontSize: 32, fontWeight: '800', color: '#c0392b', marginVertical: 5 }}>
                                ${liability.totalLiability.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#c0392b', marginBottom: 10 }}>
                                Pasivo laboral total (Liquidación al 100%)
                            </Text>
                        </View>
                        <Ionicons name="alert-circle" size={32} color="#f44336" />
                    </View>

                    <View style={{ height: 1, backgroundColor: '#ffcdd2', marginVertical: 10 }} />

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                        onPress={() => navigation.navigate('LiquidationCalculator')} // Or detailed breakdown screen
                    >
                        <Text style={{ color: '#d32f2f', fontWeight: '600' }}>
                            Ver desglose por {liability.employeeBreakdown?.length || 0} empleados
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#d32f2f" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.heroCard}>
                    {isLoading ? (
                        <View style={styles.heroLoading}>
                            <ActivityIndicator color={AppTheme.colors.secondary} />
                            <Text style={styles.heroLoadingText}>Calculando riesgos...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.riskHeader}>
                                <View style={styles.riskIndicator}>
                                    <Text style={styles.riskLabel}>Nivel de Riesgo:</Text>
                                    <View style={styles.riskBadge}>
                                        <Text style={styles.riskBadgeText}>🟡 Medio</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.heroSupportText}>Calcula tu pasivo laboral registrando empleados.</Text>
                            <TouchableOpacity
                                style={styles.heroActionBtn}
                                onPress={() => navigation.navigate('ContractReview')}
                            >
                                <Text style={styles.heroActionBtnText}>👉 Registrar Empleados</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </View>
    );

    const renderPriorityActions = () => (
        <View style={styles.blockContainer}>
            <Text style={styles.blockTitle}>¿Qué puedes hacer ahora?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20 }}>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ContractReview')}>
                    <View style={[styles.iconBox, { backgroundColor: '#e3f2fd' }]}>
                        <Ionicons name="document-text-outline" size={22} color="#1565c0" />
                    </View>
                    <Text style={styles.actionCardTitle}>Revisar contratos</Text>
                    <Text style={styles.actionCardSubtitle} numberOfLines={3}>Detecta errores comunes en contratos laborales.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('LiquidationCalculator')}>
                    <View style={[styles.iconBox, { backgroundColor: '#e0f2f1' }]}>
                        <Ionicons name="calculator-outline" size={22} color="#00695c" />
                    </View>
                    <Text style={styles.actionCardTitle}>Simular finiquito</Text>
                    <Text style={styles.actionCardSubtitle} numberOfLines={3}>Conoce montos aproximados antes de un conflicto.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('LaborDocuments')}>
                    <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
                        <Ionicons name="folder-open-outline" size={22} color="#ef6c00" />
                    </View>
                    <Text style={styles.actionCardTitle}>Documentos</Text>
                    <Text style={styles.actionCardSubtitle} numberOfLines={3}>Organiza contratos y formatos básicos.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('GenerateAct')}>
                    <View style={[styles.iconBox, { backgroundColor: '#f3e5f5' }]}>
                        <Ionicons name="flash-outline" size={22} color="#8e24aa" />
                    </View>
                    <Text style={styles.actionCardTitle}>Generar Acta (IA)</Text>
                    <Text style={styles.actionCardSubtitle} numberOfLines={3}>Redacta defensas legales en segundos.</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderToolsAndProgress = () => (
        <View style={styles.rowContainer}>
            {/* Tools (Left) */}
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.blockTitle}>Herramientas</Text>
                <View style={styles.toolsList}>
                    <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('LaborDocuments')}>
                        <Ionicons name="document-attach-outline" size={18} color="#555" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toolText} numberOfLines={1}>Documentos laborales</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('LiquidationCalculator')}>
                        <Ionicons name="calculator-outline" size={18} color="#555" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toolText} numberOfLines={1}>Simulador finiquito</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('LaborGuide')}>
                        <Ionicons name="book-outline" size={18} color="#555" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toolText} numberOfLines={1}>Guía PYME</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('NewsFeed')}>
                        <Ionicons name="newspaper-outline" size={18} color="#555" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toolText} numberOfLines={1}>Noticias Legales</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Lawyer Item - Premium Feature */}
                    <TouchableOpacity
                        style={[styles.toolItem, !isPremium && styles.toolItemLocked]}
                        onPress={() => handleFeatureAccess('Chat con Abogado', () => navigation.navigate('Lawyers'))}
                    >
                        <Ionicons name="people-outline" size={18} color={isPremium ? AppTheme.colors.primary : "#999"} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.toolText, !isPremium && { color: '#999' }]} numberOfLines={1}>Mis Abogados</Text>
                        </View>
                        {!isPremium && <Ionicons name="lock-closed" size={14} color="#999" />}
                        {isPremium && <Ionicons name="chevron-forward" size={14} color="#ccc" />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Progress (Right) */}
            <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.blockTitle}>Tu Progreso</Text>
                <View style={styles.progressCard}>
                    <View style={styles.progressItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                        <Text style={styles.progressText}>Info: 40%</Text>
                    </View>
                    <View style={styles.progressItem}>
                        <Ionicons name="folder-open-outline" size={16} color="#ff9800" />
                        <Text style={styles.progressText}>Docs: 0</Text>
                    </View>
                    <View style={styles.progressItem}>
                        <Ionicons name="warning-outline" size={16} color="#f44336" />
                        <Text style={styles.progressText}>Riesgos: 2</Text>
                    </View>
                    <Text style={styles.progressFooter}>Completa tu información para reducir riesgos.</Text>
                </View>
            </View>
        </View>
    );

    const renderPremiumCTA = () => {
        if (isPremium) return null;

        return (
            <TouchableOpacity style={styles.premiumCTA} onPress={() => setPaywallVisible(true)}>
                <LinearGradient
                    colors={['#1a237e', '#311b92']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumGradient}
                >
                    <View style={styles.premiumHeader}>
                        <Ionicons name="shield" size={24} color="#ffd700" />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={styles.premiumTitle}>🛡️ Blindaje Pro</Text>
                            <Text style={styles.premiumSubtitle}>Evita demandas y multas</Text>
                        </View>
                    </View>
                    <View style={styles.premiumBtn}>
                        <Text style={styles.premiumBtnText}>👉 Desbloquear protección</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4a148c" />

            {/* Header Reducido */}
            <LinearGradient
                colors={['#4a148c', '#7b1fa2']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.welcomeText}>Panel Empresarial</Text>
                        <Text style={styles.companyName}>
                            {formatName(user?.companyData?.companyName || user?.fullName)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {renderHero()}
                {renderPriorityActions()}
                {renderToolsAndProgress()}
                {renderPremiumCTA()}
                <View style={{ height: 40 }} />
            </ScrollView>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                featureName={lockedFeature || 'Funciones Pro'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f2f6' },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeText: { fontSize: 13, color: '#e1bee7', fontWeight: '500' },
    companyName: { fontSize: 20, fontWeight: 'bold', color: '#fff', textTransform: 'capitalize' },
    logoutButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },

    content: { padding: 16 },
    blockContainer: { marginBottom: 20 },
    blockTitle: { fontSize: 16, fontWeight: '700', color: '#2f3542', marginBottom: 10 },

    // Hero
    heroCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 6,
        borderLeftColor: '#fbc02d', // Yellow
        elevation: 2,
    },
    heroLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 },
    heroLoadingText: { marginLeft: 10, color: '#666', fontSize: 14 },
    riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    riskIndicator: { flexDirection: 'row', alignItems: 'center' },
    riskLabel: { fontSize: 13, color: '#57606f', marginRight: 8 },
    riskBadge: { backgroundColor: '#fff9c4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    riskBadgeText: { color: '#f57f17', fontWeight: 'bold', fontSize: 12 },
    heroSupportText: { fontSize: 12, color: '#7f8fa6', marginBottom: 12 },
    heroActionBtn: {
        backgroundColor: '#4a148c',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    heroActionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

    // Actions
    horizontalScroll: { paddingBottom: 5 },
    actionCard: {
        backgroundColor: '#fff',
        width: 140, // Reduced width
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        elevation: 2,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#2f3542', marginBottom: 4 },
    actionCardSubtitle: { fontSize: 11, color: '#747d8c', lineHeight: 14 },

    // Tools & Progress
    rowContainer: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' }, // Changed to flex-start
    toolsList: { backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 2 },
    toolItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    toolItemLocked: { backgroundColor: '#f8f9fa', borderBottomWidth: 0 },
    toolText: { marginLeft: 8, fontSize: 12, color: '#2f3542', fontWeight: '500', flexShrink: 1 },

    progressCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2, minHeight: 120 },
    progressItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    progressText: { marginLeft: 8, fontSize: 12, color: '#57606f', fontWeight: '500' },
    progressFooter: { marginTop: 10, fontSize: 11, color: '#7f8fa6', fontStyle: 'italic' },

    // Premium CTA
    premiumCTA: { borderRadius: 16, overflow: 'hidden', elevation: 3 },
    premiumGradient: { padding: 16 },
    premiumHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    premiumTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    premiumSubtitle: { color: '#e0e0e0', fontSize: 12, marginTop: 2 },
    premiumBtn: { backgroundColor: '#ffd700', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
    premiumBtnText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
});

export default HomePymeScreen;

