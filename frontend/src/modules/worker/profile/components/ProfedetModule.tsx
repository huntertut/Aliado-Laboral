import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Props {
    isActive: boolean;
}

export const ProfedetModule = ({ isActive }: Props) => {
    const navigation = useNavigation();

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trámite en PROFEDET</Text>
            <View style={styles.card}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.question}>¿Ya iniciaste un trámite?</Text>
                    <Text style={styles.description}>
                        Si ya tienes expediente abierto, infórmalo aquí para que tu abogado lo sepa.
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ProfedetInfo' as never)}
                >
                    <Text style={styles.actionButtonText}>{isActive ? 'Actualizar' : 'Informar'}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
            {isActive && (
                <View style={styles.activeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                    <Text style={styles.activeBadgeText}>Trámite Activo Registrado</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    question: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    actionButton: {
        backgroundColor: '#34495e',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginRight: 5,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#e8f5e9',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    activeBadgeText: {
        marginLeft: 5,
        color: '#27ae60',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
