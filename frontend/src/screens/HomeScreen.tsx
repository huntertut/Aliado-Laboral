import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import DonationModal from '../components/DonationModal';
import PanicButton from '../components/common/PanicButton';

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
        console.log('🏠 [HomeScreen] Current User:', JSON.stringify(user, null, 2));
        if (isLawyer) {
            console.log('🏠 [HomeScreen] isLawyerBasic:', isLawyerBasic);
            console.log('🏠 [HomeScreen] isLawyerPro:', isLawyerPro);
        } else {
            console.log('🏠 [HomeScreen] isPro:', isPro);
        }

        if (user?.role === 'lawyer') {
            (navigation as any).replace('LawyerDashboard');
        } else if (user?.role === 'admin') {
            (navigation as any).replace('AdminPanel');
        } else if (user?.role === 'pyme') {
            (navigation as any).replace('HomePyme');
        }
    }, [user, isPro, isLawyerBasic, isLawyerPro]);

    const menuItems = [
        {
            title: 'Asesor Virtual',
            route: 'Chat',
            icon: 'chatbubbles-outline',
            gradient: ['#43e97b', '#38f9d7'],
            premiumGradient: ['#1dd1a1', '#10ac84']
        },
        {
            title: 'Directorio de Abogados',
            route: 'Lawyers',
            icon: 'search-circle-outline',
            gradient: ['#4facfe', '#00f2fe'],
            premiumGradient: ['#4facfe', '#00f2fe']
        },
        {
            title: 'Guía Laboral',
            route: 'LaborGuide',
            icon: 'book-outline', // Keeping icon
            gradient: ['#FF9A9E', '#FECFEF'],
            premiumGradient: ['#FF6B6B', '#EE5253']
        },
        {
            title: 'Mi Kit Laboral',
            route: 'MyChest',
            icon: 'briefcase-outline',
            gradient: ['#667eea', '#764ba2'],
            premiumGradient: ['#341f97', '#5f27cd']
        },
        {
            title: 'Prestaciones de Ley',
            route: 'Benefits',
            icon: 'gift-outline',
            gradient: ['#30CFD0', '#330867'],
            premiumGradient: ['#01a3a4', '#2e86de']
        },
        {
            title: 'Calculadora de Finiquito',
            route: 'Calculator',
            icon: 'calculator-outline',
            gradient: ['#4facfe', '#00f2fe'],
            premiumGradient: ['#00d2d3', '#54a0ff']
        },
        {
            title: 'Aliado Premium',
            route: 'SubscriptionManagement',
            icon: 'business-outline',
            gradient: ['#fa709a', '#fee140'],
            premiumGradient: ['#ff9f43', '#ee5253']
        },
        {
            title: 'IMSS y NOM-035',
            route: 'ImssNom',
            icon: 'medkit-outline',
            gradient: ['#89f7fe', '#66a6ff'],
            premiumGradient: ['#48dbfb', '#222f3e']
        },
        {
            title: 'Noticias Legales',
            route: 'NewsFeed',
            icon: 'newspaper-outline',
            gradient: ['#667eea', '#764ba2'],
            premiumGradient: ['#341f97', '#5f27cd']
        },
        {
            title: 'PROFEDET',
            route: 'Guides',
            icon: 'shield-checkmark-outline',
            gradient: ['#cd9cf2', '#f6f3ff'],
            premiumGradient: ['#9c88ff', '#4834d4']
        },
        {
            title: 'Foro Anónimo',
            route: 'Forum',
            icon: 'people-outline',
            gradient: ['#fab1a0', '#e17055'],
            premiumGradient: ['#d35400', '#e74c3c']
        }
    ];


    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor={AppTheme.colors.primary} />

            {/* Hero Section with Gradient */}
            <LinearGradient
                colors={[AppTheme.colors.primary, '#3742fa']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <View style={[styles.greetingContainer, { maxWidth: '75%' }]}>
                        {/* Show Logo PRO if premium, otherwise regular logo */}
                        <Image
                            source={isPro
                                ? require('../../assets/images/logo_m_pro.jpg')
                                : require('../../assets/images/aliado_logo_new.png')
                            }
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.greeting} numberOfLines={1}>
                                    Hola, {user?.fullName
                                        ? user.fullName.split(' ')[0]
                                        : 'Bienvenido'}
                                </Text>
                                {(isWorkerPremium || isLawyerBasic || isLawyerPro || isPro) && (
                                    <View style={styles.activePlanBadge}>
                                        <Ionicons name="shield-checkmark" size={12} color="#fff" />
                                        <Text style={styles.activePlanText}>ACTIVO</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.subGreeting}>¿En qué te podemos ayudar?</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('NewsFeed' as never)}
                            style={{ padding: 8, marginRight: 8 }}
                        >
                            <Ionicons name="notifications-outline" size={28} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => navigation.navigate('Profile' as never)}
                        >
                            <Ionicons name="person-circle-outline" size={42} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.cardContainer}
                            onPress={() => navigation.navigate(item.route as never)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={(isPro && item.premiumGradient ? item.premiumGradient : item.gradient) as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.card}
                            >
                                <View style={styles.iconContainer}>
                                    <Ionicons name={item.icon as any} size={32} color="#fff" />
                                </View>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Donate Button */}
                <TouchableOpacity
                    style={styles.donateButton}
                    onPress={() => setShowDonationModal(true)}
                >
                    <Text style={styles.donateIcon}>💝</Text>
                    <Text style={styles.donateText}>Donar al Proyecto</Text>
                </TouchableOpacity>

                <DonationModal
                    visible={showDonationModal}
                    onClose={() => setShowDonationModal(false)}
                />

                {/* Copyright Footer */}
                <View style={styles.footer}>
                    <Text style={styles.copyright}>© 2024 Aliado Laboral</Text>
                    <TouchableOpacity
                        style={styles.creditsRow}
                        onPress={() => Linking.openURL('https://cibertmx.org/')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.credits}>Diseñado por </Text>
                        <Image
                            source={require('../../assets/images/ciber-logo.jpg')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.creditsName}>CIBERT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.creditsRow}
                        onPress={() => Linking.openURL('https://savestudiomx.com')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.credits}>Colaboración de </Text>
                        <Image
                            source={require('../../assets/images/save-logo.jpg')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.creditsName}>SAVE</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <PanicButton />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: AppTheme.colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileButton: {
        padding: 5,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subGreeting: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // Gap removed for compatibility, using margins in children if needed
    },
    headerLogo: {
        width: 45,
        height: 45,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginRight: 12, // Added margin to replace gap
    },
    scrollContent: {
        padding: AppTheme.spacing.l,
        paddingTop: AppTheme.spacing.xl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: '48%',
        marginBottom: AppTheme.spacing.m,
        borderRadius: AppTheme.borderRadius.l,
        ...AppTheme.shadows.default,
    },
    card: {
        borderRadius: AppTheme.borderRadius.l,
        padding: AppTheme.spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: AppTheme.spacing.s,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    donateButton: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 18,
        marginTop: 30,
        marginHorizontal: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: AppTheme.colors.primary,
    },
    donateIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    donateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    copyright: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    creditsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    credits: {
        fontSize: 11,
        color: '#666',
    },
    creditsName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
    },
    logoImage: {
        width: 20,
        height: 20,
        marginHorizontal: 5,
    },
    proLogo: {
        width: 35,
        height: 35,
        marginLeft: 8,
    },
    activePlanBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2ecc71',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 10,
        gap: 4,
        borderWidth: 1,
        borderColor: '#fff',
    },
    activePlanText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
