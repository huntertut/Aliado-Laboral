import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { AppTheme } from '../theme/colors';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/common/AppHeader';

const PREMIUM_SILVER = '#BDC3C7'; // Premium "Plateado" look

const SubscriptionManagementScreen = () => {
    const navigation = useNavigation();
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { getAccessToken, user } = useAuth();

    const isWorker = user?.role === 'worker';
    const isPyme = user?.role === 'pyme';
    const isLawyer = user?.role === 'lawyer';

    // Config based on Role
    const [selectedTier, setSelectedTier] = useState(0);

    let CONFIG: any;

    if (isWorker) {
        CONFIG = {
            title: 'Aliado Premium',
            price: 29,
            period: 'mensual',
            gradient: ['#fa709a', '#fee140'] as const,
            benefits: [
                'Cálculos de finiquito ilimitados',
                'Descarga de reportes en PDF',
                'Acceso a Guías Laborales Avanzadas',
                'Prioridad en el Chat con Abogados',
                'Sin anuncios'
            ],
            billingName: 'Trabajador',
            planType: 'worker_premium'
        };
    } else if (isPyme) {
        // Pyme Plans
        const pymePlans = [
            {
                id: 'basic',
                title: 'PYME Basic',
                price: 0,
                period: 'siempre',
                gradient: ['#11998e', '#38ef7d'] as const,
                benefits: [
                    'Diagnóstico laboral básico',
                    'Revisión de contratos (informativa)',
                    'Simulador de finiquito (visual)',
                    'Guía PYME (Errores comunes)'
                ],
                planType: 'pyme_basic'
            },
            {
                id: 'pro',
                title: 'Blindaje Laboral Pro',
                price: 999,
                period: 'mensual',
                gradient: ['#00b09b', '#96c93d'] as const,
                benefits: [
                    'Chat ilimitado con abogados',
                    'Revisión legal de documentos / PDFs',
                    'Alertas automáticas (IMSS, Riesgos)',
                    'Guardado de simulaciones',
                    'Acceso a módulo documental'
                ],
                planType: 'pyme_pro'
            }
        ];
        CONFIG = pymePlans[selectedTier];
    } else {
        // Lawyer Plans (Default if other role, but mainly Lawyer)
        const lawyerPlans = [
            {
                id: 'basic',
                title: 'Suscripción Abogado',
                price: 99,
                period: 'mensual',
                gradient: ['#667eea', '#764ba2'] as const,
                image: require('../../assets/images/ali-abo-bac.jpg'),
                benefits: [
                    'Recibir solicitudes de contacto',
                    'Acceso a datos de contacto',
                    'Perfil en el directorio',
                    'Estadísticas básicas',
                ],
                planType: 'lawyer_basic'
            },
            {
                id: 'pro',
                title: 'Suscripción Abogado PRO',
                price: 299,
                period: 'mensual',
                gradient: ['#FFD200', '#F7971E'] as const,
                image: require('../../assets/images/ali-abo-pro.jpg'),
                benefits: [
                    'Todo lo de la suscripción Básica',
                    'Posición prioritaria en el directorio',
                    'Insignia de Verificado PRO',
                    'Acceso a "Hot Leads" (Casos Urgentes)',
                    'Soporte 24/7 y Asesoría'
                ],
                planType: 'lawyer_pro'
            }
        ];
        CONFIG = lawyerPlans[selectedTier];
    }

    // Reference tiers for switcher
    const TIERS_REF = isPyme ? [
        { id: 'basic', name: 'Básico', gradient: ['#11998e', '#38ef7d'] as const },
        { id: 'pro', name: 'PRO', gradient: ['#00b09b', '#96c93d'] as const }
    ] : isLawyer ? [
        { id: 'basic', name: 'Básico', gradient: ['#667eea', '#764ba2'] as const },
        { id: 'pro', name: 'PRO', gradient: ['#FFD200', '#F7971E'] as const }
    ] : [];

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const token = await getAccessToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/subscription/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setSubscription(data);

            // Sync selected tier with current plan
            const plan = data.plan?.toLowerCase() || '';
            if (plan.includes('pro') || plan.includes('premium')) {
                setSelectedTier(1);
            } else {
                setSelectedTier(0);
            }

        } catch (error) {
            console.error('Error al cargar suscripción:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (planConfig = CONFIG) => {
        const isFree = planConfig.price === 0;
        Alert.alert(
            isFree ? 'Activar Plan Gratuito' : 'Activar Suscripción',
            isFree
                ? `Estás a punto de activar ${planConfig.title}.`
                : `Se cobrará $${planConfig.price} MXN por acceso ${planConfig.period}.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: isFree ? 'Activar Ahora' : 'Pagar ahora', onPress: () => confirmActivation(planConfig) }
            ]
        );
    };

    const confirmActivation = async (planConfigToUse: any) => {
        setActionLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) {
                Alert.alert('Error', 'No se ha encontrado sesión');
                setActionLoading(false);
                return;
            }

            // HANDLE FREE PLAN DIRECTLY
            if (planConfigToUse.price === 0) {
                // Simulate activation or call backend to set "free" plan status
                // For now we assume calling activate with 'stripe' but 0 price might trigger backend logic
                // OR we just assume backend handles "pyme_basic" as free if configured.
                // Let's try calling activate. If backend requires paymentIntent, this might fail, 
                // but typically free plans just update the user record.
                // TODO: Backend should handle price 0 bypass.
                const response = await fetch(`${API_URL}/subscription/activate-free`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ planType: planConfigToUse.planType })
                });

                if (response.ok) {
                    Alert.alert('¡Plan Activado!', 'Has activado tu plan gratuito.');
                    fetchSubscription();
                } else {
                    // Fallback check if it was just a regular update
                    Alert.alert('Aviso', 'No se pudo activar el plan gratuito automáticamente.');
                }
                setActionLoading(false);
                return;
            }

            // 1. Fetch Payment Intent Params from Backend
            const response = await fetch(`${API_URL}/subscription/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentMethod: 'stripe',
                    planType: planConfigToUse.planType
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Backend Error:", errText);
                Alert.alert('Error del Servidor', `No se pudo iniciar el proceso. Código: ${response.status}`);
                setActionLoading(false);
                return;
            }

            const { paymentIntent, ephemeralKey, customer, paymentIntentId } = await response.json();

            // 2. Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Aliado Laboral',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                defaultBillingDetails: {
                    name: isWorker ? 'Trabajador' : (isPyme ? 'Empresa' : 'Abogado'), // Fallback or distinct
                },
                returnURL: 'derechoslaboralesmx://stripe-redirect',
            });

            if (initError) {
                Alert.alert('Error', initError.message);
                setActionLoading(false);
                return;
            }

            // 3. Present Payment Sheet
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                Alert.alert('Pago cancelado', paymentError.message);
            } else {
                // 4. Confirm on backend to update DB
                const confirmResponse = await fetch(`${API_URL}/subscription/confirm-payment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ paymentIntentId: paymentIntentId || paymentIntent })
                });

                if (confirmResponse.ok) {
                    Alert.alert('¡Suscripción activada!', 'Disfruta de tus beneficios Premium.');
                    fetchSubscription();
                } else {
                    Alert.alert('Aviso', 'El pago fue exitoso pero hubo un error actualizando tu perfil. Contacta soporte.');
                }
            }
        } catch (error: any) {
            console.error('Error:', error);
            Alert.alert(
                'Error de conexión',
                'No se pudo conectar con el servidor de pagos. Verifica tu internet o intenta más tarde.\n\nDetalle: ' + (error.message || 'Unknown')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const toggleAutoRenew = async (value: boolean) => {
        if (!value) {
            Alert.alert(
                'Cancelar auto-renovación',
                'Tu suscripción expirará al final del período actual.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', onPress: () => updateAutoRenew(value) }
                ]
            );
        } else {
            updateAutoRenew(value);
        }
    };

    const updateAutoRenew = async (value: boolean) => {
        try {
            const token = await getAccessToken();
            if (!token) return;

            if (!value) {
                await fetch(`${API_URL}/subscription/cancel-auto-renew`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            fetchSubscription();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleUpgrade = () => {
        Alert.alert(
            'Mejorar a Plan PRO',
            'Obtendrás acceso a funciones premium como posición prioritaria y Hot Leads.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Mejorar ahora', onPress: () => {
                        // Directly access the PRO config (Index 1 is PRO in our inline array logic above)
                        // Ideally we should extract the array to a constant, but for now we reconstruct/access it
                        let upgradePlan: any;

                        if (isPyme) {
                            const pymePlans = [
                                {
                                    id: 'basic',
                                    title: 'PYME Basic',
                                    price: 0,
                                    period: 'siempre',
                                    planType: 'pyme_basic'
                                },
                                {
                                    id: 'pro',
                                    title: 'Blindaje Laboral Pro',
                                    price: 999,
                                    period: 'mensual',
                                    planType: 'pyme_pro'
                                }
                            ];
                            upgradePlan = pymePlans[1];
                        } else {
                            // Lawyer
                            const lawyerPlans = [
                                {
                                    id: 'basic',
                                    title: 'Suscripción Básica',
                                    price: 99,
                                    period: 'mensual',
                                    planType: 'lawyer_basic'
                                },
                                {
                                    id: 'pro',
                                    title: 'Suscripción PRO',
                                    price: 299,
                                    period: 'mensual',
                                    planType: 'lawyer_pro'
                                }
                            ];
                            upgradePlan = lawyerPlans[1];
                        }

                        setSelectedTier(1);
                        setTimeout(() => handleActivate(upgradePlan), 300);
                    }
                }
            ]
        );
    };

    const handleDowngrade = () => {
        Alert.alert(
            'Cambiar a Plan Básico',
            'Perderás acceso a funciones PRO pero mantendrás las funcionalidades básicas.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar cambio', onPress: async () => {
                        // TODO: Implement downgrade endpoint
                        Alert.alert('Información', 'El cambio de plan se procesará al final del período actual.');
                    }
                }
            ]
        );
    };

    const handleCancelSubscription = () => {
        Alert.alert(
            'Cancelar Suscripción',
            'Tu suscripción permanecerá activa hasta el final del período actual.',
            [
                { text: 'No cancelar', style: 'cancel' },
                { text: 'Sí, cancelar', style: 'destructive', onPress: () => updateAutoRenew(false) }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppTheme.colors.primary} />
            </View>
        );
    }

    const getStatusConfig = () => {
        // FALLBACK: If hasSubscription is false but nested subscription says 'active' and not expired
        const isSubActive = subscription?.hasSubscription || (
            subscription?.subscription?.status?.toLowerCase() === 'active' &&
            !subscription?.subscription?.isExpired
        );

        if (!isSubActive) {
            return {
                color: '#e74c3c',
                icon: 'close-circle',
                label: 'Inactiva',
                message: isWorker ? 'Desbloquea todo el potencial de tu Aliado' : 'Activa tu suscripción para recibir solicitudes',
                showProLogo: true // Flag to show logo
            };
        }

        if (subscription.subscription.isExpired) {
            return {
                color: '#e74c3c',
                icon: 'alert-circle',
                label: 'Expirada',
                message: 'Tu suscripción ha vencido'
            };
        }

        if (subscription.subscription.daysRemaining <= 7) {
            return {
                color: '#f39c12',
                icon: 'warning',
                label: 'Próxima a vencer',
                message: `Expira en ${subscription.subscription.daysRemaining} días`,
                gradient: ['#F7971E', '#FFD200'] as const, // Gold/Orange Gradient
            };
        }

        // ACTIVE PREMIUM
        return {
            color: '#27ae60',
            icon: 'checkmark-circle',
            label: 'Suscripción Activa',
            message: `${subscription.subscription.daysRemaining} días restantes`,
            gradient: ['#bdc3c7', '#2c3e50'] as const, // Silver to Dark Blue (Professional/Premium)
        };
    };

    const status = getStatusConfig();
    const isSubscriptionActive = subscription?.hasSubscription || (
        subscription?.subscription?.status?.toLowerCase() === 'active' &&
        !subscription?.subscription?.isExpired
    );
    const isUserPremium = user?.plan === 'worker_premium' || user?.plan === 'premium' || user?.role === 'admin' || user?.plan === 'pro';
    const hasActiveSubscription = isSubscriptionActive || isUserPremium;

    // Helper to determine current plan tier
    const getCurrentPlan = (): 'none' | 'basic' | 'pro' => {
        if (!hasActiveSubscription) return 'none';
        const planLower = subscription?.plan?.toLowerCase();
        if (planLower === 'pro' || planLower === 'lawyer_pro') return 'pro';
        if (planLower === 'basic' || planLower === 'lawyer_basic') return 'basic';
        return 'none';
    };

    const currentPlan = getCurrentPlan();

    return (
        <View style={styles.container}>
            <AppHeader
                title={CONFIG.title}
                gradient={CONFIG.gradient}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status card */}
                {/* If INACTIVE or EXPIRED: Show simple card with Icon */}
                {status.showProLogo || status.label === 'Expirada' ? (
                    <View style={[styles.statusCard, { borderLeftColor: status.color }]}>
                        {/* NEW: Dynamic Plan Logo based on Selection or current sub */}
                        {(status as any).showProLogo ? (
                            <View style={[styles.statusIcon, { backgroundColor: `${status.color}20` }]}>
                                <Ionicons name="briefcase-outline" size={48} color={status.color} />
                            </View>
                        ) : (
                            <View style={[styles.statusIcon, { backgroundColor: `${status.color}20` }]}>
                                <Ionicons name={status.icon as any} size={48} color={status.color} />
                            </View>
                        )}

                        <Text style={styles.statusLabel}>Estado de la suscripción</Text>
                        <Text style={[styles.statusValue, { color: status.color }]}>{status.label}</Text>

                        {/* Plan Badge for state */}
                        {user?.role === 'lawyer' && (
                            <View style={[styles.planBadge, { backgroundColor: CONFIG.id === 'pro' ? '#FFD200' : '#667eea' }]}>
                                <Text style={styles.planBadgeText}>
                                    Plan {CONFIG.id === 'pro' ? 'PRO' : 'Básico'}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.statusMessage}>{status.message}</Text>
                    </View>
                ) : (
                    // IF ACTIVE: Premium Card with Gradient Background for Icon
                    <View style={[styles.statusCard, { borderLeftWidth: 0, padding: 0, overflow: 'hidden' }]}>
                        <LinearGradient
                            colors={['#ffffff', '#f8f9fa']}
                            style={{ padding: 30, alignItems: 'center', width: '100%' }}
                        >
                            {/* Show Image instead of icon if Lawyer */}
                            {user?.role === 'lawyer' && (CONFIG as any).image ? (
                                <View style={styles.premiumImageContainer}>
                                    <Image
                                        source={(CONFIG as any).image}
                                        style={styles.premiumImage}
                                        resizeMode="contain"
                                    />
                                </View>

                            ) : (
                                <LinearGradient
                                    colors={status.gradient || ['#ccc', '#999']}
                                    style={styles.premiumIconContainer}
                                >
                                    <Ionicons name={isWorker ? "shield-checkmark" : "briefcase"} size={40} color="#fff" />
                                </LinearGradient>
                            )}
                            <Text style={styles.statusLabel}>
                                Membresía {isWorker ? 'Premium' : (CONFIG.id === 'pro' ? 'PRO' : 'Básica')}
                            </Text>
                            {/* Gradient Text Simulation via standard text for now */}
                            <Text style={[styles.statusValue, { color: '#2c3e50' }]}>{status.label}</Text>

                            {/* Plan Badge for Active state */}
                            {user?.role === 'lawyer' && (
                                <View style={[styles.planBadge, { backgroundColor: CONFIG.id === 'pro' ? '#FFD200' : '#667eea' }]}>
                                    <Text style={styles.planBadgeText}>
                                        Plan {CONFIG.id === 'pro' ? 'PRO' : 'Básico'}
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.statusMessage}>{status.message}</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Directorio de Abogados Button (Only if Active) */}
                {hasActiveSubscription && (
                    <TouchableOpacity
                        style={styles.directoryButton}
                        onPress={() => navigation.navigate('Lawyers' as never)}
                    >
                        <LinearGradient
                            colors={['#27ae60', '#2ecc71']}
                            style={styles.directoryGradient}
                        >
                            <Ionicons name="search" size={20} color="#fff" />
                            <Text style={styles.directoryButtonText}>Ir al Directorio de Abogados</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Plan Switcher (Only if NO active subscription) for non-workers */}
                {!isWorker && currentPlan === 'none' && (
                    <View style={styles.tierSwitcher}>
                        <Text style={styles.tierTitle}>Selecciona un Plan para Activar o Mejorar</Text>
                        <View style={styles.tierButtons}>
                            {TIERS_REF.map((tier, index) => (
                                <TouchableOpacity
                                    key={tier.id}
                                    style={[
                                        styles.tierButton,
                                        selectedTier === index && { backgroundColor: tier.gradient[0] }
                                    ]}
                                    onPress={() => setSelectedTier(index)}
                                >
                                    <Text style={[
                                        styles.tierButtonText,
                                        selectedTier === index && { color: '#fff' }
                                    ]}>
                                        {tier.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Subscription details */}
                {hasActiveSubscription && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Detalles del Plan</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Costo</Text>
                            <Text style={styles.detailValue}>${CONFIG.price} MXN / {CONFIG.period}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Fecha de inicio</Text>
                            <Text style={styles.detailValue}>
                                {new Date(subscription.subscription.startDate).toLocaleDateString('es-MX')}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Próximo cobro</Text>
                            <Text style={styles.detailValue}>
                                {new Date(subscription.subscription.endDate).toLocaleDateString('es-MX')}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Auto-renovación</Text>
                            <Switch
                                value={subscription.subscription.autoRenew}
                                onValueChange={toggleAutoRenew}
                                trackColor={{ false: '#e0e0e0', true: AppTheme.colors.primary }}
                                thumbColor={subscription.subscription.autoRenew ? '#fff' : '#f4f3f4'}
                            />
                        </View>

                        {/* Progress bar */}
                        <View style={styles.progressSection}>
                            <Text style={styles.progressLabel}>Tiempo restante</Text>
                            <View style={styles.progressBar}>
                                <LinearGradient
                                    colors={status.gradient || ['#ccc', '#999']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${Math.min((subscription.subscription.daysRemaining / (isWorker ? 30 : 60)) * 100, 100)}%`
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {subscription.subscription.daysRemaining} días restantes
                            </Text>
                        </View>
                    </View>
                )}

                {/* Benefits */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Beneficios Premium</Text>
                    {CONFIG.benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitRow}>
                            <Ionicons name="star" size={24} color={PREMIUM_SILVER} />
                            <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                    ))}
                </View>

                {/* Payment history */}
                {subscription?.recentPayments?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
                        {subscription.recentPayments.map((payment: any) => (
                            <View key={payment.id} style={styles.paymentCard}>
                                <View style={styles.paymentIcon}>
                                    <Ionicons
                                        name={payment.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                                        size={24}
                                        color={payment.status === 'completed' ? '#27ae60' : '#e74c3c'}
                                    />
                                </View>
                                <View style={styles.paymentDetails}>
                                    <Text style={styles.paymentAmount}>${payment.amount} MXN</Text>
                                    <Text style={styles.paymentDate}>
                                        {new Date(payment.paymentDate).toLocaleDateString('es-MX')}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.paymentStatus,
                                    { backgroundColor: payment.status === 'completed' ? '#d4edda' : '#f8d7da' }
                                ]}>
                                    <Text style={[
                                        styles.paymentStatusText,
                                        { color: payment.status === 'completed' ? '#27ae60' : '#e74c3c' }
                                    ]}>
                                        {payment.status === 'completed' ? 'Pagado' : 'Fallido'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action button */}
            <View style={styles.footer}>
                {!hasActiveSubscription ? (
                    <TouchableOpacity
                        style={[styles.actionButton, actionLoading && { opacity: 0.5 }]}
                        onPress={() => handleActivate()}
                        disabled={actionLoading}
                    >
                        <LinearGradient
                            colors={['#27ae60', '#2ecc71']}
                            style={styles.actionGradient}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="card" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Activar por ${CONFIG.price} MXN</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                ) : currentPlan === 'basic' ? (
                    // BASIC PLAN: Show Upgrade to PRO + Cancel
                    <View style={styles.buttonStack}>
                        <TouchableOpacity
                            style={[styles.actionButton, actionLoading && { opacity: 0.5 }]}
                            onPress={handleUpgrade}
                            disabled={actionLoading}
                        >
                            <LinearGradient
                                colors={['#FFD200', '#F7971E']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Mejorar a PRO por $299 MXN</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelSubscription}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar Suscripción</Text>
                        </TouchableOpacity>
                    </View>
                ) : currentPlan === 'pro' ? (
                    // PRO PLAN: Show Extend + Downgrade + Cancel
                    <View style={styles.buttonStack}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleActivate()}>
                            <LinearGradient
                                colors={['#FFD200', '#F7971E']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="time" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Extender Suscripción PRO</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <View style={styles.secondaryButtonRow}>
                            <TouchableOpacity
                                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                                onPress={handleDowngrade}
                            >
                                <Ionicons name="arrow-down-circle" size={16} color="#3498db" />
                                <Text style={styles.secondaryButtonText}>Cambiar a Básico</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.secondaryButton, { flex: 1 }]}
                                onPress={handleCancelSubscription}
                            >
                                <Ionicons name="close-circle" size={16} color="#e74c3c" />
                                <Text style={[styles.secondaryButtonText, { color: '#e74c3c' }]}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.renewButton} onPress={() => handleActivate()}>
                        <Text style={styles.renewButtonText}>Extender Suscripción</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row', // [>] Align items horizontally
        alignItems: 'center', // [>] Vertically center
    },
    backButton: {
        marginRight: 15, // [>] Space between arrow and title
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1 }, // [>] Allow title to take remaining space
    content: {
        // flex: 1 // Removed to prevent scroll jumping
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 20, // Increased margin
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        padding: 24,
        alignItems: 'center',
        borderLeftWidth: 6,
    },
    directoryButton: {
        marginBottom: 30,
        borderRadius: 15,
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    directoryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 15,
    },
    directoryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },

    statusIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    premiumIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    premiumImageContainer: {
        width: 150,
        height: 150,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumImage: {
        width: '100%',
        height: '100%',
    },
    statusLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
    statusValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    statusMessage: { fontSize: 14, color: '#95a5a6', textAlign: 'center' },
    section: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 20, borderRadius: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailLabel: { fontSize: 14, color: '#7f8c8d' },
    detailValue: { fontSize: 14, color: '#2c3e50', fontWeight: '600' },
    progressSection: { marginTop: 20 },
    progressLabel: { fontSize: 13, color: '#7f8c8d', marginBottom: 8 },
    progressBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 4 },
    progressText: { fontSize: 12, color: '#95a5a6', marginTop: 5, textAlign: 'right' },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    paymentIcon: { marginRight: 12 },
    paymentDetails: { flex: 1 },
    paymentAmount: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
    paymentDate: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
    paymentStatus: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    paymentStatusText: { fontSize: 12, fontWeight: 'bold' },
    benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    benefitText: { fontSize: 14, color: '#34495e', marginLeft: 10, flex: 1 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    actionButton: { borderRadius: 12, overflow: 'hidden' },
    actionGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    renewButton: {
        backgroundColor: '#3498db',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    renewButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    planBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 10,
        alignSelf: 'center',
    },
    planBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tierSwitcher: {
        paddingHorizontal: 20,
        marginTop: 25,
        marginBottom: 10,
    },
    tierTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7f8c8d',
        marginBottom: 12,
        textAlign: 'center',
    },
    tierButtons: {
        flexDirection: 'row',
        backgroundColor: '#eee',
        borderRadius: 12,
        padding: 4,
    },
    tierButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tierButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7f8c8d',
    },
    buttonStack: {
        gap: 10,
    },
    cancelButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e74c3c',
    },
    cancelButtonText: {
        color: '#e74c3c',
        fontSize: 14,
        fontWeight: 'bold',
    },
    secondaryButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    secondaryButton: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 6,
    },
    secondaryButtonText: {
        color: '#3498db',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default SubscriptionManagementScreen;

