import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CONTRACT_TYPES } from '../data/contractTypes';
import { AppTheme } from '../theme/colors';

const ContractTypesScreen = () => {
    const navigation = useNavigation<any>();
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tipos de Contrato</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.intro}>
                    Conoce los diferentes tipos de contratos laborales para saber cuál te corresponde y cuáles son tus derechos.
                </Text>

                {CONTRACT_TYPES.map((contract) => (
                    <TouchableOpacity
                        key={contract.id}
                        style={styles.card}
                        onPress={() => navigation.navigate('ContractDetail' as never, { contractId: contract.id } as never)}
                    >
                        <View style={styles.typeHeader}>
                            <View style={styles.bullet} />
                            <Text style={styles.title}>{contract.title}</Text>
                        </View>
                        <Text style={styles.description} numberOfLines={3}>{contract.shortDescription}</Text>
                        <View style={styles.footer}>
                            <Text style={styles.moreInfo}>Ver detalles y cláusulas ›</Text>
                        </View>
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
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    intro: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 20,
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        ...AppTheme.shadows.default
    },
    typeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    bullet: {
        width: 8,
        height: 24,
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 4,
        marginRight: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    description: {
        fontSize: 15,
        color: '#34495e',
        lineHeight: 22,
        marginBottom: 15,
    },
    detailsContainer: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    footer: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    moreInfo: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default ContractTypesScreen;

