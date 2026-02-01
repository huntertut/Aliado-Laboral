import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CONTRACT_TYPES } from '../data/contractTypes';
import { AppTheme } from '../theme/colors';

const ContractDetailScreen = () => {
    const route = useRoute();
    const { contractId } = route.params as { contractId: string };
    const contract = CONTRACT_TYPES.find(c => c.id === contractId);

    if (!contract) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{contract.icon}</Text>
                </View>
                <Text style={styles.title}>{contract.title}</Text>
                <Text style={styles.description}>{contract.shortDescription}</Text>
            </View>

            {/* Key Characteristics */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="key" size={24} color="#f1c40f" />
                    <Text style={styles.sectionTitle}>Características Clave</Text>
                </View>
                {contract.caracteristicasClave.map((item, index) => (
                    <View key={index} style={styles.pointRow}>
                        <Ionicons name="ellipse" size={8} color="#f1c40f" style={{ marginTop: 6, marginRight: 8 }} />
                        <Text style={styles.pointText}>{item}</Text>
                    </View>
                ))}
            </View>

            {/* Elements to Review - Critical Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="search-circle" size={24} color="#e74c3c" />
                    <Text style={styles.sectionTitle}>Elementos a Revisar (¡Ojo!)</Text>
                </View>
                {contract.elementosRevisar.map((item, index) => (
                    <View key={index} style={styles.warningBox}>
                        <Text style={styles.clauseTitle}>{item.clause}</Text>

                        <View style={styles.warningRow}>
                            <Ionicons name="warning" size={16} color="#e74c3c" style={{ marginRight: 5 }} />
                            <Text style={styles.warningText}>{item.warning}</Text>
                        </View>

                        <View style={styles.idealRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#27ae60" style={{ marginRight: 5 }} />
                            <Text style={styles.idealText}><Text style={{ fontWeight: 'bold' }}>Lo ideal:</Text> {item.ideal}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Rights & Obligations */}
            <View style={styles.rowContainer}>
                <View style={[styles.halfSection, { marginRight: 10 }]}>
                    <Text style={[styles.subTitle, { color: '#27ae60' }]}>Tus Derechos</Text>
                    {contract.derechosTrabajador.map((item, index) => (
                        <View key={index} style={styles.miniPoint}>
                            <Ionicons name="checkmark" size={14} color="#27ae60" style={{ top: 2 }} />
                            <Text style={styles.miniPointText}>{item}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.halfSection}>
                    <Text style={[styles.subTitle, { color: '#2980b9' }]}>Tus Obligaciones</Text>
                    {contract.obligacionesTrabajador.map((item, index) => (
                        <View key={index} style={styles.miniPoint}>
                            <Ionicons name="person" size={14} color="#2980b9" style={{ top: 2 }} />
                            <Text style={styles.miniPointText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Termination */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="exit" size={24} color="#34495e" />
                    <Text style={styles.sectionTitle}>{contract.queSucedeAlTerminar.title}</Text>
                </View>
                <Text style={styles.pointText}>{contract.queSucedeAlTerminar.description}</Text>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
    },
    icon: {
        fontSize: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        ...AppTheme.shadows.default,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginLeft: 10,
    },
    pointRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    pointText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        flex: 1,
    },
    warningBox: {
        backgroundColor: '#fff5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#e74c3c',
    },
    clauseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#c0392b',
        marginBottom: 8,
    },
    warningRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    warningText: {
        fontSize: 14,
        color: '#c0392b',
        flex: 1,
    },
    idealRow: {
        flexDirection: 'row',
    },
    idealText: {
        fontSize: 14,
        color: '#27ae60',
        flex: 1,
    },
    rowContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    halfSection: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        ...AppTheme.shadows.default,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    miniPoint: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    miniPointText: {
        fontSize: 13,
        color: '#555',
        marginLeft: 5,
        flex: 1,
    }
});

export default ContractDetailScreen;

