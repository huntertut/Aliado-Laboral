import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import DonationModal from '../components/DonationModal';
import PanicButton from '../components/common/PanicButton';

class ErrorBoundary extends React.Component<any, any> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false, error: null };
    }
  
    static getDerivedStateFromError(error: any) {
      return { hasError: true, error };
    }
  
    componentDidCatch(error: any, errorInfo: any) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  
    render() {
      if (this.state.hasError) {
        return (
          <View style={{flex: 1, padding: 40, backgroundColor: '#b33939', justifyContent: 'center'}}>
            <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10}}>{'ERROR FATAL DE RENDERIZADO:'}</Text>
            <Text style={{color: '#fff', fontSize: 13}}>{this.state.error ? this.state.error.toString() : 'Unknown error'}</Text>
            <Text style={{color: '#fff', fontSize: 13, marginTop: 20}}>{'¡Tómale captura a esta pantalla y mándasela al ingeniero web!'}</Text>
          </View>
        );
      }
      return this.props.children; 
    }
}

const HomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [showDonationModal, setShowDonationModal] = useState(false);
    const userPlan = user?.plan?.toLowerCase();
    const isLawyer = user?.role === 'lawyer';

    const isWorkerPremium = user?.role === 'worker' && (userPlan === 'premium' || userPlan === 'worker_premium');
    const isLawyerBasic = isLawyer && userPlan === 'basic';
    const isLawyerPro = isLawyer && userPlan === 'pro';
    const isPro = isLawyerPro || isWorkerPremium || user?.plan === 'PRO' || user?.plan === 'PREMIUM';

    useEffect(() => {
        if (user?.role === 'lawyer') {
            (navigation as any).replace('LawyerDashboard');
        } else if (user?.role === 'admin') {
            (navigation as any).replace('AdminPanel');
        } else if (user?.role === 'pyme') {
            (navigation as any).replace('HomePyme');
        }
    }, [user, isPro, isLawyerBasic, isLawyerPro]);

    return (
        <ErrorBoundary>
            <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor={AppTheme.colors.primary} />

            {/* ─── HEADER ─── */}
            <LinearGradient colors={['#1e3799', '#3742fa']} style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <Image
                            source={isPro ? require('../../assets/images/logo_m_pro.jpg') : require('../../assets/images/aliado_logo_new.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                        <Text style={styles.headerTitle}>{'Aliado Laboral'}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={() => navigation.navigate('NewsFeed' as never)} style={styles.iconBtn}>
                            <Ionicons name="notifications-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)} style={styles.avatarBtn}>
                            <Ionicons name="person-circle" size={36} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── ZONA 1: El Gancho ─── */}
                <View style={styles.heroSection}>
                    <Text style={styles.zoneLabel}>{'ZONA 1: El "Gancho"'}</Text>
                    <Text style={styles.heroTitle}>{'¿Tienes dudas sobre\ntu empleo?'}</Text>
                    {isPro ? (
                        <View style={styles.proBadge}>
                            <Text style={styles.proBadgeText}>{'⭐ PRO'}</Text>
                        </View>
                    ) : null}
                </View>

                {/* ─── CTA: Calculadora ─── */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Calculator' as never)} style={styles.ctaWrapper}>
                    <LinearGradient colors={['#667eea', '#764ba2']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.ctaGradient}>
                        <View style={styles.ctaIconBg}>
                            <Ionicons name="calculator" size={36} color="#fff" />
                        </View>
                        <View style={styles.ctaTextContainer}>
                            <Text style={styles.ctaTitle}>{'Calcular mi Finiquito\n/ Liquidación'}</Text>
                            <Text style={styles.ctaSubtitle}>{'Saber cuánto te deben es el primer paso.'}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* ─── ZONA 2: Acciones Rápidas ─── */}
                <Text style={styles.sectionHeader}>
                    <Text style={styles.zoneBold}>{'ZONA 2: '}</Text>
                    {'Acciones Rápidas'}
                </Text>
                <View style={styles.grid}>
                    {/* Card 1: Asesor IA */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Chat' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={['#43e97b', '#38f9d7']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.cardIconCircle}>
                                <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>{'Asesor IA'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Card 2: Abogados Aliados */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Lawyers' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={['#4facfe', '#00f2fe']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.cardIconCircle}>
                                <Ionicons name="scale" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>{'Abogados Aliados'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Card 3: Guía Laboral */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('LaborGuide' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={['#FF9A9E', '#FECFEF']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.cardIconCircle}>
                                <Ionicons name="book" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>{'Guía Laboral'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Card 4: Mi Kit Legal */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('MyChest' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={['#a18cd1', '#fbc2eb']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.cardIconCircle}>
                                <Ionicons name="folder-open" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>{'Mi Kit Legal'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ─── ZONA 3: Información y Apoyo ─── */}
                <Text style={styles.sectionHeader}>
                    <Text style={styles.zoneBold}>{'ZONA 3: '}</Text>
                    {'Información y Apoyo'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    
                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('NewsFeed' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="newspaper-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>{'Noticias\nLegales'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('Forum' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="people-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>{'Foro\nAnónimo'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('ImssNom' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="medkit-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>{'IMSS'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('Guides' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="shield-checkmark-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>{'PROFEDET'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('SubscriptionManagement' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="star-outline" size={24} color="#f1c40f" /></View>
                        <Text style={styles.smallCardText}>{'Aliado\nPRO'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => setShowDonationModal(true)}>
                        <View style={[styles.smallIconCircle, {backgroundColor: '#fff0f6'}]}><Ionicons name="gift-outline" size={24} color="#e84393" /></View>
                        <Text style={styles.smallCardText}>{'Donar al\nProyecto'}</Text>
                    </TouchableOpacity>

                </ScrollView>

                <DonationModal visible={showDonationModal} onClose={() => setShowDonationModal(false)} />

                {/* ─── Footer ─── */}
                <View style={styles.footer}>
                    <Text style={styles.copyright}>{'© 2024 Aliado Laboral'}</Text>
                    <View style={styles.footerLogosContainer}>
                        <TouchableOpacity style={styles.creditsRow} onPress={() => Linking.openURL('https://cibertmx.org/')} activeOpacity={0.7}>
                            <Text style={styles.credits}>{'Diseñado por '}</Text>
                            <Image source={require('../../assets/images/ciber-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                            <Text style={styles.creditsName}>{'CIBERT'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.separator}>{'  |  '}</Text>
                        <TouchableOpacity style={styles.creditsRow} onPress={() => Linking.openURL('https://savestudiomx.com')} activeOpacity={0.7}>
                            <Text style={styles.credits}>{'Colaboración de '}</Text>
                            <Image source={require('../../assets/images/save-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                            <Text style={styles.creditsName}>{'SAVE'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{height: 80}} />
            </ScrollView>

            <PanicButton />
        </View>
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    // ─── Header ───
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
    },
    headerLogo: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 6,
        marginRight: 4,
    },
    avatarBtn: {
        padding: 2,
    },
    // ─── Hero / Zona 1 ───
    heroSection: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    zoneLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.65)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 36,
    },
    proBadge: {
        marginTop: 8,
        backgroundColor: 'rgba(46, 204, 113, 0.25)',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.5)',
    },
    proBadgeText: {
        color: '#2ecc71',
        fontWeight: '700',
        fontSize: 13,
    },
    // ─── CTA: Calculator ───
    ctaWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#764ba2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    ctaGradient: {
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ctaIconBg: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    ctaTextContainer: {
        flex: 1,
    },
    ctaTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    ctaSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },
    // ─── Scroll Content ───
    scrollContent: {
        padding: 20,
        paddingTop: 18,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: '600',
        color: '#444',
        marginBottom: 14,
        marginTop: 4,
    },
    zoneBold: {
        fontWeight: '800',
        color: AppTheme.colors.primary,
    },
    // ─── Grid ───
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardContainer: {
        width: '48%',
        marginBottom: 14,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    card: {
        borderRadius: 18,
        paddingVertical: 20,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 130,
    },
    cardIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    // ─── Horizontal Icons (Zona 3) ───
    horizontalScroll: {
        paddingRight: 20,
        paddingBottom: 20,
    },
    smallCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 68,
    },
    smallIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
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
    // ─── Footer ───
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
        marginHorizontal: 6,
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
        width: 18,
        height: 18,
        marginHorizontal: 3,
    },
});

export default HomeScreen;
