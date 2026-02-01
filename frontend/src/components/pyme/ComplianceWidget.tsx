import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';

interface Props {
    score: number;
    status: 'green' | 'yellow' | 'red';
    label: string;
    pending: string[];
}

const ComplianceWidget = ({ score, status, label, pending = [] }: Props) => {
    const getStatusColor = () => {
        switch (status) {
            case 'green': return '#4caf50';
            case 'yellow': return '#ffc107';
            case 'red': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.scoreContainer}>
                    <View style={[styles.circle, { borderColor: getStatusColor() }]}>
                        <Text style={[styles.scoreText, { color: getStatusColor() }]}>{score}%</Text>
                    </View>
                </View>
                <View style={styles.labelContainer}>
                    <Text style={[styles.statusLabel, { color: getStatusColor() }]}>{label}</Text>
                    <Text style={styles.subtitle}>Semáforo de Cumplimiento Legal</Text>
                </View>
            </View>

            {pending.length > 0 && (
                <View style={styles.todoList}>
                    <Text style={styles.todoTitle}>Tareas Pendientes (To-Do):</Text>
                    {pending.map((item, index) => (
                        <View key={index} style={styles.todoItem}>
                            <Ionicons name="alert-circle-outline" size={16} color="#d32f2f" />
                            <Text style={styles.todoText}>{item}</Text>
                        </View>
                    ))}
                </View>
            )}

            {status === 'green' && (
                <View style={styles.successMessage}>
                    <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                    <Text style={styles.successText}>¡Tu empresa está legalmente protegida!</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    scoreContainer: {
        marginRight: 15,
    },
    circle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    labelContainer: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    todoList: {
        marginTop: 10,
        backgroundColor: '#fff8f8',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ffebee',
    },
    todoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#b71c1c',
        marginBottom: 10,
    },
    todoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    todoText: {
        marginLeft: 10,
        fontSize: 13,
        color: '#333',
    },
    successMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#f1f8e9',
        padding: 12,
        borderRadius: 12,
    },
    successText: {
        marginLeft: 10,
        fontSize: 13,
        color: '#2e7d32',
        fontWeight: '500',
    }
});

export default ComplianceWidget;

