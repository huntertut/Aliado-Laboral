import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Mock data for MVP
const MOCK_CASES = [
    {
        id: '1',
        title: 'Conflicto con Supervisor',
        employerName: 'Empresa ABC',
        status: 'active',
        history: [
            { id: '101', eventType: 'meeting', description: 'Reunión con RH', occurredAt: '2023-10-25' },
            { id: '102', eventType: 'harassment', description: 'Gritos en frente de clientes', occurredAt: '2023-10-28' }
        ]
    }
];

const HistoryScreen = () => {
    const navigation = useNavigation();
    const [cases, setCases] = useState(MOCK_CASES);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>Mi Bitácora</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddIncident' as never)}
                >
                    <Text style={styles.addButtonText}>+ Nuevo</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={cases}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.caseCard}>
                        <View style={styles.caseHeader}>
                            <Text style={styles.caseTitle}>{item.title}</Text>
                            <Text style={styles.statusBadge}>{item.status}</Text>
                        </View>
                        <Text style={styles.employer}>{item.employerName}</Text>

                        <View style={styles.timeline}>
                            {item.history.map((event, index) => (
                                <View key={event.id} style={styles.eventRow}>
                                    <View style={styles.dot} />
                                    <View style={styles.eventContent}>
                                        <Text style={styles.date}>{event.occurredAt}</Text>
                                        <Text style={styles.eventType}>{event.eventType}</Text>
                                        <Text style={styles.description}>{event.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F6FA',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F3640',
    },
    addButton: {
        backgroundColor: '#0056D2',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    caseCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    caseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    caseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        backgroundColor: '#e1f5fe',
        color: '#0288d1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        fontSize: 12,
        overflow: 'hidden',
    },
    employer: {
        color: '#666',
        marginBottom: 15,
    },
    timeline: {
        borderLeftWidth: 2,
        borderLeftColor: '#eee',
        paddingLeft: 15,
        marginLeft: 5,
    },
    eventRow: {
        marginBottom: 15,
        position: 'relative',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0056D2',
        position: 'absolute',
        left: -21,
        top: 5,
    },
    eventContent: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 5,
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    eventType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        textTransform: 'capitalize',
    },
    description: {
        fontSize: 14,
        color: '#555',
    },
});

export default HistoryScreen;
