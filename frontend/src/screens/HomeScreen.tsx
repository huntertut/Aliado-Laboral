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
            <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10}}>ERROR FATAL DE RENDERIZADO:</Text>
            <Text style={{color: '#fff', fontSize: 13}}>{this.state.error && this.state.error.toString()}</Text>
            <Text style={{color: '#fff', fontSize: 13, marginTop: 20}}>¡Tómale captura a esta pantalla y mándasela al ingeniero web!</Text>
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

    // Helper statuses for logging and UI
    const isWorkerPremium = user?.role === 'worker' && (userPlan === 'premium' || userPlan === 'worker_premium');
    const isLawyerBasic = isLawyer && userPlan === 'basic';
    const isLawyerPro = isLawyer && userPlan === 'pro';

    // Generic high-tier check for legacy UI styling
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

            {/* HEADER ZONA 1 */}
            <LinearGradient colors={[AppTheme.colors.primary, '#3742fa']} style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.greetingContainer}>
                        <Image
                            source={isPro ? require('../../assets/images/logo_m_pro.jpg') : require('../../assets/images/aliado_logo_new.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.greeting} numberOfLines={1}>
                                    Aliado Laboral
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerActionRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('NewsFeed' as never)} style={styles.iconBtn}>
                            <Ionicons name="notifications-outline" size={26} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)} style={styles.iconBtn}>
                            <Ionicons name="person-circle-outline" size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ZONA 1: Gancho Texto */}
                <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>
                        {'Hola, '}{user?.fullName ? user.fullName.split(' ')[0] : 'Bienvenido'}
                        {(isWorkerPremium || isLawyerBasic || isLawyerPro || isPro) ? (
                            <Text style={{color: '#2ecc71', fontSize: 16}}>{'  [PRO]'}</Text>
                        ) : null}
                    </Text>
                    <Text style={styles.heroPreTitle}>{'¿Tienes dudas sobre tu empleo?'}</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* ZONA 1 CTA: Calculadora */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Calculator' as never)} style={styles.ctaWrapper}>
                    <LinearGradient colors={['#FF8C00', '#FFD700']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.ctaGradient}>
                        <View style={styles.ctaIconBg}>
                            <Ionicons name="calculator" size={42} color="#fff" />
                        </View>
                        <View style={styles.ctaTextContainer}>
                            <Text style={styles.ctaTitle}>Calcular mi Finiquito{'\n'}/ Liquidación</Text>
                            <Text style={styles.ctaSubtitle}>Saber cuánto te deben es el primer paso.</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* ZONA 2: Acciones Rápidas (Grid 2x2) */}
                <Text style={styles.sectionHeader}>Acciones Rápidas</Text>
                <View style={styles.grid}>
                    {/* Tarjeta 1 */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Chat' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={isPro ? ['#1dd1a1', '#10ac84'] : ['#43e97b', '#38f9d7']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="chatbubbles" size={30} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>Asesor IA</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Tarjeta 2 */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Lawyers' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={['#4facfe', '#00f2fe']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="scale" size={30} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>Abogados Aliados</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Tarjeta 3 */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('LaborGuide' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={['#FF9A9E', '#FECFEF']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="book" size={30} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>Guía Laboral</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Tarjeta 4 */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('MyChest' as never)} style={styles.cardContainer}>
                        <LinearGradient colors={['#a18cd1', '#fbc2eb']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.card}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="briefcase" size={30} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>Mi Kit Legal</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ZONA 3: Información y Apoyo (Horizontal) */}
                <Text style={styles.sectionHeader}>Información y Apoyo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    
                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('NewsFeed' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="newspaper-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>Noticias</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('Forum' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="people-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>Foro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('ImssNom' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="medkit-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>IMSS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('Guides' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="shield-checkmark-outline" size={24} color={AppTheme.colors.primary} /></View>
                        <Text style={styles.smallCardText}>PROFEDET</Text>
                    </TouchableOpacity>

                    {/* Suscripciones Aliado PRO */}
                    <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('SubscriptionManagement' as never)}>
                        <View style={styles.smallIconCircle}><Ionicons name="business-outline" size={24} color="#f1c40f" /></View>
                        <Text style={styles.smallCardText}>Aliado PRO</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallCard} onPress={() => setShowDonationModal(true)}>
                        <View style={styles.smallIconCircle}><Ionicons name="gift-outline" size={24} color="#e84393" /></View>
                        <Text style={styles.smallCardText}>Donar</Text>
                    </TouchableOpacity>

                </ScrollView>

                <DonationModal visible={showDonationModal} onClose={() => setShowDonationModal(false)} />

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.copyright}>© 2024 Aliado Laboral</Text>
                    <View style={styles.footerLogosContainer}>
                        <TouchableOpacity style={styles.creditsRow} onPress={() => Linking.openURL('https://cibertmx.org/')} activeOpacity={0.7}>
                            <Text style={styles.credits}>Diseñado por </Text>
                            <Image source={require('../../assets/images/ciber-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                            <Text style={styles.creditsName}>CIBERT</Text>
                        </TouchableOpacity>
                        <Text style={styles.separator}>  |  </Text>
                        <TouchableOpacity style={styles.creditsRow} onPress={() => Linking.openURL('https://savestudiomx.com')} activeOpacity={0.7}>
                            <Text style={styles.credits}>Colab de </Text>
                            <Image source={require('../../assets/images/save-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                            <Text style={styles.creditsName}>SAVE</Text>
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
        backgroundColor: '#f5f7fa',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...AppTheme.shadows.default,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerLogo: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginRight: 10,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    headerActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 5,
        marginLeft: 5,
    },
    heroTextContainer: {
        marginTop: 20,
    },
    heroPreTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 5,
    },
    heroTitle: {
        fontSize: 16,
        color: '#d1d8e0',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    ctaWrapper: {
        marginTop: -30, // Pulls the CTA slightly over the header
        borderRadius: 20,
        marginBottom: 25,
        ...AppTheme.shadows.default,
        elevation: 6,
    },
    ctaGradient: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ctaIconBg: {
        width: 65,
        height: 65,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    ctaTextContainer: {
        flex: 1,
    },
    ctaTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 5,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2,
    },
    ctaSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardContainer: {
        width: '48%',
        marginBottom: 15,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    card: {
        borderRadius: 18,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        height: 125, // Slightly shorter than before to fit in screen
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    horizontalScroll: {
        paddingRight: 20,
        paddingBottom: 20,
    },
    smallCard: {
        alignItems: 'center',
        marginRight: 20,
        width: 60,
    },
    smallIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    smallCardText: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 10,
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
        marginHorizontal: 10,
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
        marginHorizontal: 4,
    },
});

export default HomeScreen;
