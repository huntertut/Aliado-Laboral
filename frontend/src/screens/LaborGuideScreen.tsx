import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

const LaborGuideScreen = () => {
    const navigation = useNavigation();

    const sections = [
        {
            id: 'problems',
            title: 'Problemas Comunes',
            description: '¿Qué hacer si no me pagan? Despido injustificado, acoso y más.',
            icon: 'alert-circle-outline',
            gradient: ['#ff9966', '#ff5e62'],
            route: 'Problems' // Reusing existing ProblemsScreen
        },
        {
            id: 'contracts',
            title: 'Tipos de Contrato',
            description: 'Aprende las diferencias entre contrato fijo, indeterminado y por obra.',
            icon: 'document-text-outline',
            gradient: ['#56CCF2', '#2F80ED'],
            route: 'ContractTypes' // Need to create or simple modal? Let's make subcomponent locally or simple screen
        },
        {
            id: 'rights',
            title: 'Mi Panel de Derechos',
            description: 'Un resumen claro de lo que la ley establece para ambas partes.',
            icon: 'bookmark-outline',
            gradient: ['#11998e', '#38ef7d'],
            route: 'WorkerRights'
        }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📘 Guía Laboral</Text>
                <Text style={styles.headerSubtitle}>Tu manual para entender el mundo laboral</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {sections.map((section) => (
                    <TouchableOpacity
                        key={section.id}
                        style={styles.card}
                        onPress={() => {
                            // Using existing Problems route for the first one
                            navigation.navigate(section.route as never);
                        }}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={section.gradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cardGradient}
                        >
                            <View style={styles.iconCircle}>
                                <Ionicons name={section.icon as any} size={32} color={section.gradient[1]} />
                            </View>
                            <View style={styles.cardText}>
                                <Text style={styles.cardTitle}>{section.title}</Text>
                                <Text style={styles.cardDescription}>{section.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    content: {
        padding: 20,
    },
    card: {
        marginBottom: 20,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 15,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    cardDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
    },
});

export default LaborGuideScreen;
