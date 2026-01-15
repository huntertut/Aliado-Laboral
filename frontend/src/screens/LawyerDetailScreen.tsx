import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';

const LawyerDetailScreen = () => {
    const route = useRoute();
    const { lawyer } = route.params as any;

    const handleContact = () => {
        // In real app, call API to send request
        Alert.alert(
            'Solicitud Enviada',
            `Se ha notificado al Lic. ${lawyer.user.fullName}. Te contactará pronto.`,
            [{ text: 'OK' }]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{lawyer.user.fullName.charAt(0)}</Text>
                </View>
                <Text style={styles.name}>{lawyer.user.fullName}</Text>
                <Text style={styles.specialty}>{lawyer.specialty}</Text>
                <Text style={styles.license}>Cédula Prof: {lawyer.licenseNumber}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sobre mí</Text>
                <Text style={styles.bio}>
                    Abogado especialista en derecho laboral con más de 10 años de experiencia defendiendo a trabajadores.
                    Experto en negociaciones y conciliación.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ubicación</Text>
                <Text style={styles.text}>Ciudad de México, CDMX</Text>
            </View>

            <View style={styles.buttonContainer}>
                <Button title="Contactar Abogado" onPress={handleContact} color="#0056D2" />
                <Text style={styles.disclaimer}>
                    *Al contactar, aceptas compartir tus datos básicos del caso con el abogado.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#F5F6FA',
        flexGrow: 1,
    },
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0056D2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarTextLarge: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    specialty: {
        fontSize: 16,
        color: '#0056D2',
        fontWeight: '600',
        marginBottom: 5,
    },
    license: {
        fontSize: 14,
        color: '#999',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F3640',
        marginBottom: 10,
    },
    bio: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    text: {
        fontSize: 16,
        color: '#555',
    },
    buttonContainer: {
        marginTop: 20,
    },
    disclaimer: {
        marginTop: 10,
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
});

export default LawyerDetailScreen;
