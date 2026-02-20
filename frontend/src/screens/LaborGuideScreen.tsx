import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';

const LaborGuideScreen = () => {
    const navigation = useNavigation();

    const sections = [
        {
            id: 'problems',
            title: 'Problemas Comunes',
            description: '¿Qué hacer si no me pagan? Despido injustificado, acoso y más.',
            icon: 'alert-circle',
            color: '#FF6B6B',
            bg: '#FFF0F0',
            route: 'Problems'
        },
        {
            id: 'contracts',
            title: 'Tipos de Contrato',
            description: 'Diferencias entre contrato fijo, indeterminado y por obra.',
            icon: 'document-text',
            color: '#4ECDC4',
            bg: '#E0F9F8',
            route: 'ContractTypes'
        },
        {
            id: 'rights',
            title: 'Mi Panel de Derechos',
            description: 'Vacaciones, Aguinaldo, Prima Vacacional y tus obligaciones.',
            icon: 'shield-checkmark',
            color: '#1A535C',
            bg: '#E8F6F8',
            route: 'WorkerRights'
        }
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Premium Header */}
            <LinearGradient
                colors={['#2c3e50', '#3498db']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text style={styles.headerTitle}>Guía Laboral</Text>
                            <Text style={styles.headerSubtitle}>Conoce tus derechos y obligaciones</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.introSection}>
                    <Text style={styles.introText}>
                        Bienvenido a tu manual de supervivencia laboral. Selecciona una categoría para aprender más.
                    </Text>
                </View>

                {sections.map((section, index) => (
                    <TouchableOpacity
                        key={section.id}
                        style={styles.card}
                        onPress={() => {
                            if (section.route) navigation.navigate(section.route as never);
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: section.bg }]}>
                            <Ionicons name={section.icon as any} size={32} color={section.color} />
                        </View>

                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>{section.title}</Text>
                            <Text style={styles.cardDescription}>{section.description}</Text>
                        </View>

                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-forward" size={24} color="#ccc" />
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Additional Info / Footer */}
                <View style={styles.footer}>
                    <Ionicons name="book-outline" size={20} color="#95a5a6" />
                    <Text style={styles.footerText}>Información basada en la LFT vigente</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
    },
    safeArea: {
        width: '100%',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        marginRight: 15,
    },
    titleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
        fontWeight: '500',
    },
    content: {
        padding: 20,
        paddingTop: 25,
    },
    introSection: {
        marginBottom: 25,
        paddingHorizontal: 5,
    },
    introText: {
        fontSize: 16,
        color: '#636e72',
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        lineHeight: 20,
    },
    chevronContainer: {
        marginLeft: 10,
    },
    footer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        opacity: 0.7,
        marginBottom: 20,
    },
    footerText: {
        color: '#95a5a6',
        fontSize: 13,
        fontWeight: '500',
    }
});

export default LaborGuideScreen;

