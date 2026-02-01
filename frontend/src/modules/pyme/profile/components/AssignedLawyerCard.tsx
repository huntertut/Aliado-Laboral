import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../../../theme/colors';

interface Props {
    lawyer: {
        id: string;
        user: {
            fullName: string;
            email: string;
        };
        specialty?: string;
    } | null;
}

const AssignedLawyerCard = ({ lawyer }: Props) => {
    const handleEditAttempt = () => {
        Alert.alert(
            'Atención',
            'Para cambiar de abogado, contacta a soporte técnico.',
            [{ text: 'Entendido' }]
        );
    };

    if (!lawyer) {
        return (
            <View style={styles.card}>
                <Text style={styles.emptyText}>No tienes un abogado asignado.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Abogado Asignado</Text>
            <View style={styles.card}>
                <View style={styles.info}>
                    <Ionicons name="person-circle" size={40} color={AppTheme.colors.primary} />
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>{lawyer.user.fullName}</Text>
                        <Text style={styles.specialty}>{lawyer.specialty || 'Generalista'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleEditAttempt} style={styles.editButton}>
                    <Ionicons name="lock-closed" size={20} color="#999" />
                    <Text style={styles.lockText}>Solo Lectura</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.infoText}>
                Tu abogado asignado es responsable de validar tus contratos y brindarte asesoría ilimitada.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textContainer: {
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
    },
    specialty: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    editButton: {
        alignItems: 'center',
        padding: 8,
    },
    lockText: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        marginTop: 10,
        paddingHorizontal: 5,
        lineHeight: 18,
    }
});

export default AssignedLawyerCard;

