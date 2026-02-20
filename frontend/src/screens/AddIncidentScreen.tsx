import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AddIncidentScreen = () => {
    const navigation = useNavigation();
    const [eventType, setEventType] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = () => {
        if (!eventType || !description) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        // In real app: POST /cases/:id/history
        Alert.alert('Guardado', 'El incidente ha sido registrado en tu bitácora.', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Tipo de Incidente</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej. Acoso, Falta de Pago, Reunión"
                value={eventType}
                onChangeText={setEventType}
            />

            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
            />

            <Text style={styles.label}>Descripción Detallada</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe qué pasó, quiénes estaban presentes, etc."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <Button title="Guardar Incidente" onPress={handleSave} color="#0056D2" />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
});

export default AddIncidentScreen;
