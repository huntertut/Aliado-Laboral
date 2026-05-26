import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, Image, Linking, TextInput, Animated, LayoutAnimation,
    Platform, UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import DonationModal from '../components/DonationModal';
import PanicButton from '../components/common/PanicButton';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── ErrorBoundary ─────────────────────────────────────────────
class ErrorBoundary extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
    componentDidCatch(error: any, errorInfo: any) { console.error('ErrorBoundary caught:', error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, padding: 40, backgroundColor: '#b33939', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>ERROR FATAL DE RENDERIZADO:</Text>
                    <Text style={{ color: '#fff', fontSize: 13 }}>{this.state.error?.toString() ?? 'Unknown error'}</Text>
                    <Text style={{ color: '#fff', fontSize: 13, marginTop: 20 }}>¡Tómale captura y mándasela al ingeniero web!</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

// ─── Quick Calc Helper ──────────────────────────────────────────
const calcFiniquito = (salaryRaw: string, startDate: string, endDate: string): string | null => {
    // Remove commas from formatted salary before parsing
    const s = parseFloat(salaryRaw.replace(/,/g, ''));
    if (!s || !startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const daily = s / 30;
    const aguinaldo = daily * 15 * (years % 1 || 1);
    const vacaciones = daily * Math.max(6, Math.floor(years) * 6) * 0.25;
    const indemnizacion = years >= 1 ? daily * 90 + daily * 20 * years : 0;
    const total = aguinaldo + vacaciones + indemnizacion;
    return total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
};

// ─── Salary formatter (adds thousands separators) ───────────────
const formatSalaryDisplay = (raw: string): string => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('es-MX');
};

// ─── Date auto-formatter (inserts hyphens: YYYY-MM-DD) ──────────
const autoFormatDate = (text: string): string => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

// ─── HomeScreen ────────────────────────────────────────────────
const HomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [showDonationModal, setShowDonationModal] = useState(false);

    // Calculator accordion
    const [calcOpen, setCalcOpen] = useState(false);
    const [salary, setSalary] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [quickResult, setQuickResult] = useState<string | null>(null);
    const chevronAnim = useRef(new Animated.Value(0)).current;

    const userPlan = user?.plan?.toLowerCase();
    const isLawyer = user?.role === 'lawyer';
    const isWorkerPremium = user?.role === 'worker' && (userPlan === 'premium' || userPlan === 'worker_premium');
    const isLawyerPro = isLawyer && userPlan === 'pro';
    const isPro = isLawyerPro || isWorkerPremium || user?.plan === 'PRO' || user?.plan === 'PREMIUM';

    const firstName = user?.fullName && !user.fullName.includes('Aliado') ? user.fullName.split(' ')[0] : null;
    const greeting = firstName ? `Hola, ${firstName} 👋` : '¡Bienvenido! 👋';

    useEffect(() => {
        if (user?.role === 'lawyer') (navigation as any).replace('LawyerDashboard');
        else if (user?.role === 'admin') (navigation as any).replace('AdminPanel');
        else if (user?.role === 'pyme') (navigation as any).replace('HomePyme');
    }, [user]);

    const toggleCalc = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const toValue = calcOpen ? 0 : 1;
        Animated.spring(chevronAnim, { toValue, useNativeDriver: true, friction: 6 }).start();
        setCalcOpen(prev => !prev);
        setQuickResult(null);
    };

    const handleQuickCalc = () => {
        const result = calcFiniquito(salary, startDate, endDate);
        setQuickResult(result ?? '⚠️ Revisa los datos ingresados');
    };

    const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

    // ─── Quick Action Cards data ────────────────────────────────
    const quickActions = [
        { label: 'Asesor IA', icon: 'chatbubble-ellipses-outline', colors: ['#43e97b', '#38f9d7'] as [string,string], route: 'Chat' },
        { label: 'Abogados', icon: 'scale-outline', colors: ['#4facfe', '#00f2fe'] as [string,string], route: 'Lawyers' },
        { label: 'Guía Legal', icon: 'book-outline', colors: ['#f093fb', '#f5576c'] as [string,string], route: 'LaborGuide' },
        { label: 'Mi Kit', icon: 'folder-open-outline', colors: ['#a18cd1', '#fbc2eb'] as [string,string], route: 'MyChest' },
    ];

    const infoActions = [
        { label: 'Noticias\nLegales', icon: 'newspaper-outline', color: AppTheme.colors.primary, route: 'NewsFeed' },
        { label: 'Foro\nAnónimo', icon: 'people-outline', color: AppTheme.colors.primary, route: 'Forum' },
        { label: 'IMSS', icon: 'medkit-outline', color: AppTheme.colors.primary, route: 'ImssNom' },
        { label: 'PROFEDET', icon: 'shield-checkmark-outline', color: AppTheme.colors.primary, route: 'Guides' },
        { label: 'Aliado\nPRO', icon: 'star-outline', color: '#f1c40f', route: 'SubscriptionManagement' },
        { label: 'Donar al\nProyecto', icon: 'gift-outline', color: '#e84393', route: null, bgColor: '#fff0f6' },
    ];

    return (
        <ErrorBoundary>
            <View style={styles.mainContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#1e3799" />

                {/* ─── HEADER ──────────────────────────────────── */}
                <LinearGradient colors={['#1e3799', '#3742fa']} style={styles.header}>
                    <View style={styles.headerRow}>
                        {/* Logo + greeting */}
                        <View style={styles.headerLeft}>
                            <Image
                                source={isPro
                                    ? require('../../assets/images/logo_m_pro.jpg')
                                    : require('../../assets/images/aliado_logo_new.png')}
                                style={styles.headerLogo}
                                resizeMode="contain"
                            />
                            <View>
                                <Text style={styles.brandText}>Aliado Laboral v1.22.4</Text>
                                <Text style={styles.greetingText} numberOfLines={1}>{greeting}</Text>
                            </View>
                        </View>
                        {/* Icons */}
                        <View style={styles.headerRight}>
                            {isPro && (
                                <View style={styles.proBadge}>
                                    <Text style={styles.proBadgeText}>⭐ PRO</Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={() => navigation.navigate('NewsFeed' as never)} style={styles.iconBtn}>
                                <Ionicons name="notifications-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)} style={styles.avatarBtn}>
                                <Ionicons name="person-circle" size={34} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Hero */}
                    <View style={styles.heroSection}>
                        <Text style={styles.heroTitle}>{'¿Tienes dudas sobre\ntu empleo?'}</Text>
                    </View>

                    {/* ─── CTA: Calculadora Collapsible ────────── */}
                    <View style={[styles.ctaWrapper, calcOpen && styles.ctaWrapperOpen]}>
                        {/* Header Row */}
                        <TouchableOpacity activeOpacity={0.88} onPress={toggleCalc} style={styles.ctaHeader}>
                            <View style={styles.ctaIconBg}>
                                <Ionicons name="calculator" size={30} color="#fff" />
                            </View>
                            <View style={styles.ctaTextContainer}>
                                <Text style={styles.ctaTitle}>{'Calcular mi Finiquito / Liquidación'}</Text>
                                <Text style={styles.ctaSubtitle}>{'Saber cuánto te deben es el primer paso.'}</Text>
                            </View>
                            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                                <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.9)" />
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Expanded Form */}
                        {calcOpen && (
                            <View style={styles.calcForm}>
                                {/* ── Sueldo con prefijo $ y separadores ── */}
                                <View style={styles.calcInputRow}>
                                    <View style={styles.calcInputWrap}>
                                        <Text style={styles.calcLabel}>💰 Sueldo Mensual</Text>
                                        <View style={styles.calcInputPrefix}>
                                            <Text style={styles.calcPrefixText}>$</Text>
                                            <TextInput
                                                style={styles.calcInputInner}
                                                placeholder="12,000"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                keyboardType="numeric"
                                                value={formatSalaryDisplay(salary)}
                                                onChangeText={(t) => setSalary(t.replace(/[^0-9]/g, ''))}
                                            />
                                            <Text style={styles.calcSuffixText}>MXN</Text>
                                        </View>
                                    </View>
                                </View>
                                {/* ── Fechas con auto-formato YYYY-MM-DD ── */}
                                <View style={styles.calcInputRow}>
                                    <View style={[styles.calcInputWrap, { marginRight: 8 }]}>
                                        <Text style={styles.calcLabel}>📅 Fecha Ingreso</Text>
                                        <View style={styles.calcInputPrefix}>
                                            <TextInput
                                                style={[styles.calcInputInner, { flex: 1 }]}
                                                placeholder="2018-03-15"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                keyboardType="numeric"
                                                maxLength={10}
                                                value={startDate}
                                                onChangeText={(t) => setStartDate(autoFormatDate(t))}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.calcInputWrap}>
                                        <Text style={styles.calcLabel}>📅 Fecha Salida</Text>
                                        <View style={styles.calcInputPrefix}>
                                            <TextInput
                                                style={[styles.calcInputInner, { flex: 1 }]}
                                                placeholder={new Date().toISOString().slice(0, 10)}
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                keyboardType="numeric"
                                                maxLength={10}
                                                value={endDate}
                                                onChangeText={(t) => setEndDate(autoFormatDate(t))}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {quickResult && (
                                    <View style={styles.calcResultBox}>
                                        <Text style={styles.calcResultLabel}>Estimado aproximado:</Text>
                                        <Text style={styles.calcResultValue}>{quickResult}</Text>
                                        <Text style={styles.calcResultNote}>*Estimación orientativa. Usa la calculadora completa para un desglose exacto.</Text>
                                    </View>
                                )}

                                <View style={styles.calcActions}>
                                    <TouchableOpacity style={styles.calcQuickBtn} onPress={handleQuickCalc}>
                                        <Ionicons name="flash" size={16} color="#fff" />
                                        <Text style={styles.calcQuickBtnText}>Cálculo Rápido</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.calcFullBtn} onPress={() => navigation.navigate('Calculator' as never)}>
                                        <Text style={styles.calcFullBtnText}>Ver desglose completo →</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ─── Acciones Rápidas (compact grid) ──────── */}
                    <Text style={styles.sectionHeader}>Acciones Rápidas</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickScrollRow}
                    >
                        {quickActions.map((item) => (
                            <TouchableOpacity
                                key={item.route}
                                activeOpacity={0.82}
                                onPress={() => navigation.navigate(item.route as never)}
                                style={styles.quickCard}
                            >
                                <LinearGradient
                                    colors={item.colors}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.quickCardGradient}
                                >
                                    <View style={styles.quickCardIconCircle}>
                                        <Ionicons name={item.icon as any} size={26} color="#fff" />
                                    </View>
                                    <Text style={styles.quickCardTitle}>{item.label}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* ─── Información y Apoyo ──────────────────── */}
                    <Text style={styles.sectionHeader}>Información y Apoyo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {infoActions.map((item) => (
                            <TouchableOpacity
                                key={item.label}
                                style={styles.smallCard}
                                onPress={() => item.route ? navigation.navigate(item.route as never) : setShowDonationModal(true)}
                            >
                                <View style={[styles.smallIconCircle, item.bgColor ? { backgroundColor: item.bgColor } : undefined]}>
                                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                                </View>
                                <Text style={styles.smallCardText}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <DonationModal visible={showDonationModal} onClose={() => setShowDonationModal(false)} />

                    {/* ─── Footer ───────────────────────────────── */}
                    <View style={styles.footer}>
                        <Text style={styles.copyright}>© 2026 Aliado Laboral</Text>
                        <View style={styles.footerLogosContainer}>
                            <TouchableOpacity style={styles.creditsRow} onPress={() => Linking.openURL('https://cibertmx.org/')} activeOpacity={0.7}>
                                <Text style={styles.credits}>Diseñado por </Text>
                                <Image source={require('../../assets/images/ciber-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                                <Text style={styles.creditsName}>CIBERT</Text>
                            </TouchableOpacity>
                            <Text style={styles.separator}>  |  </Text>
                            <TouchableOpacity style={styles.creditsRow} onPress={() => Linking.openURL('https://savestudiomx.com')} activeOpacity={0.7}>
                                <Text style={styles.credits}>Colaboración de </Text>
                                <Image source={require('../../assets/images/save-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                                <Text style={styles.creditsName}>SAVE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ height: 90 }} />
                </ScrollView>

                <PanicButton />
            </View>
        </ErrorBoundary>
    );
};

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },

    // Header
    header: {
        paddingTop: 48,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    headerLogo: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    brandText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    greetingText: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconBtn: {
        padding: 6,
    },
    avatarBtn: {
        padding: 2,
    },
    proBadge: {
        backgroundColor: 'rgba(46, 204, 113, 0.25)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.5)',
        marginRight: 6,
    },
    proBadgeText: {
        color: '#2ecc71',
        fontWeight: '700',
        fontSize: 11,
    },

    // Hero
    heroSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 34,
    },

    // CTA Collapsible Calculator
    ctaWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(118, 75, 162, 0.85)',
        elevation: 8,
        shadowColor: '#764ba2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        // Glassmorphism feel via semi-transparent bg + border
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    ctaWrapperOpen: {
        borderColor: 'rgba(255,255,255,0.28)',
    },
    ctaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 18,
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
    },
    ctaIconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    ctaTextContainer: {
        flex: 1,
    },
    ctaTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 2,
    },
    ctaSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.82)',
        fontWeight: '500',
    },

    // Calculator form
    calcForm: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 12,
    },
    calcInputRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    calcInputWrap: {
        flex: 1,
    },
    calcLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 6,
        letterSpacing: 0.4,
    },
    // ── New prefix-style input row ──
    calcInputPrefix: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 0,
        minHeight: 44,
    },
    calcPrefixText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 6,
    },
    calcSuffixText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    calcInputInner: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        paddingVertical: 8,
    },
    // Legacy (kept for compat)
    calcInput: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 14,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    calcResultBox: {
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.4)',
        alignItems: 'center',
    },
    calcResultLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    calcResultValue: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    calcResultNote: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        marginTop: 6,
        textAlign: 'center',
    },
    calcActions: {
        flexDirection: 'row',
        gap: 10,
    },
    calcQuickBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderRadius: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    calcQuickBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    calcFullBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingVertical: 12,
    },
    calcFullBtnText: {
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '600',
        fontSize: 12,
    },

    // Scroll
    scrollContent: {
        padding: 18,
        paddingTop: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#444',
        marginBottom: 12,
        marginTop: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Quick Actions Horizontal Scroll
    quickScrollRow: {
        paddingRight: 18,
        paddingBottom: 4,
        marginBottom: 8,
    },
    quickCard: {
        width: 110,
        marginRight: 12,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    quickCardGradient: {
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        // Glassmorphism border
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    quickCardIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickCardTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },

    // Info horizontal
    horizontalScroll: {
        paddingRight: 18,
        paddingBottom: 18,
    },
    smallCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 62,
    },
    smallIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    smallCardText: {
        fontSize: 10,
        color: '#555',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 13,
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 6,
    },
    copyright: {
        fontSize: 12,
        color: '#aaa',
        marginBottom: 8,
    },
    footerLogosContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        color: '#ccc',
        marginHorizontal: 4,
    },
    creditsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    credits: {
        fontSize: 11,
        color: '#888',
    },
    creditsName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
    },
    logoImage: {
        width: 16,
        height: 16,
        marginHorizontal: 3,
    },
});

export default HomeScreen;
