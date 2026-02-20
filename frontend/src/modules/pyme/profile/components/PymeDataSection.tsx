import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../../../theme/colors';

interface Props {
    data: {
        razonSocial?: string;
        rfc?: string;
        industry?: string;
        employeeCount?: string;
    };
    onUpdate: (data: any) => void;
    isSaving: boolean;
}

const PymeDataSection = ({ data, onUpdate, isSaving }: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [razonSocial, setRazonSocial] = useState(data.razonSocial || '');
    const [rfc, setRfc] = useState(data.rfc || '');
    const [industry, setIndustry] = useState(data.industry || '');

    const handleSave = () => {
        onUpdate({ razonSocial, rfc, industry });
        setIsEditing(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Datos Corporativos</Text>
                {!isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={styles.editLink}>Editar</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator size="small" color={AppTheme.colors.primary} /> : <Text style={styles.saveLink}>Guardar</Text>}
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Razón Social</Text>
                    {isEditing ? (
                        <TextInput style={styles.input} value={razonSocial} onChangeText={setRazonSocial} />
                    ) : (
                        <Text style={styles.value}>{razonSocial || 'No especificado'}</Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>RFC</Text>
                    {isEditing ? (
                        <TextInput style={styles.input} value={rfc} onChangeText={setRfc} autoCapitalize="characters" />
                    ) : (
                        <Text style={styles.value}>{rfc || 'No especificado'}</Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Industria</Text>
                    {isEditing ? (
                        <TextInput style={styles.input} value={industry} onChangeText={setIndustry} />
                    ) : (
                        <Text style={styles.value}>{industry || 'No especificado'}</Text>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    editLink: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
    },
    saveLink: {
        color: '#4caf50',
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    }
});

export default PymeDataSection;

