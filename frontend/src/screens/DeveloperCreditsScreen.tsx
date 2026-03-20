import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';

const DeveloperCreditsScreen = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[AppTheme?.colors?.primary || '#1e3799', '#3742fa']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/aliado_logo_new.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>Aliado Laboral</Text>
            </LinearGradient>

            <View style={styles.content}>
                <Ionicons name="code-slash-outline" size={60} color={AppTheme?.colors?.primary || '#1e3799'} style={styles.icon} />

                <Text style={styles.developedBy}>DESARROLLADO ORIGINALMENTE POR:</Text>
                <Text style={styles.developerName}>Aliado Laboral</Text>

                <View style={styles.divider} />

                <Text style={styles.description}>
                    Esta aplicación fue diseñada y programada desde cero como propiedad intelectual privada.
                    El código fuente, arquitectura y diseño de base de datos están protegidos.
                </Text>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>v1.19.3</Text>
                        <Text style={styles.statLabel}>Versión</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>2026</Text>
                        <Text style={styles.statLabel}>Edición</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f2f6',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    logo: {
        width: 90,
        height: 90,
        borderRadius: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginBottom: 20,
    },
    developedBy: {
        fontSize: 14,
        color: '#666',
        letterSpacing: 2,
        fontWeight: '600',
        marginBottom: 10,
    },
    developerName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2f3542',
        textAlign: 'center',
        marginBottom: 30,
    },
    divider: {
        width: '50%',
        height: 2,
        backgroundColor: AppTheme?.colors?.primary || '#1e3799',
        marginBottom: 30,
    },
    description: {
        fontSize: 16,
        color: '#57606f',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        width: '100%',
    },
    statBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        width: '45%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppTheme?.colors?.primary || '#1e3799',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#747d8c',
        textTransform: 'uppercase',
    }
});

export default DeveloperCreditsScreen;
