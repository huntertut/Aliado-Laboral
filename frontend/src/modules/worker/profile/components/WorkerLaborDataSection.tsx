import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../../../theme/colors';

const STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

interface Props {
    data: any;
    onUpdate: (data: any) => void;
    isSaving: boolean;
}

export const WorkerLaborDataSection = ({ data, onUpdate, isSaving }: Props) => {
    const [fullName, setFullName] = useState(data?.fullName || '');
    const [occupation, setOccupation] = useState(data?.occupation || '');
    const [monthlySalary, setMonthlySalary] = useState(data?.monthlySalary?.toString() || '');
    const [selectedState, setSelectedState] = useState(data?.federalEntity || '');
    const [startDate, setStartDate] = useState(data?.startDate || ''); // Format kept simple for now
    const [showStateModal, setShowStateModal] = useState(false);

    // Sync from props
    useEffect(() => {
        if (data) {
            setFullName(data.fullName || '');
            setOccupation(data.occupation || '');
            setMonthlySalary(data.monthlySalary?.toString() || '');
            setSelectedState(data.federalEntity || '');
            setStartDate(data.startDate ? new Date(data.startDate).toLocaleDateString('es-MX') : '');
        }
    }, [data]);

    const handleSalaryChange = (text: string) => {
        // Remove non-numeric characters except decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');
        setMonthlySalary(cleaned);

        // Notify parent immediately or on blur? 
        // For this component design, we'll update parent on 'Save' click in parent, 
        // or trigger updates here if we want real-time. 
        // The spec implies the section handles editing.
    };

    const propagateChanges = () => {
        onUpdate({
            fullName,
            occupation,
            federalEntity: selectedState,
            monthlySalary: monthlySalary ? parseFloat(monthlySalary) : null,
            startDate: startDate // Parent should handle conversion to ISO if needed
        });
    };

    const renderStateItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.stateItem}
            onPress={() => {
                setSelectedState(item);
                setShowStateModal(false);
            }}
        >
            <Text style={[styles.stateText, item === selectedState && styles.selectedStateText]}>
                {item}
            </Text>
            {item === selectedState && (
                <Ionicons name="checkmark" size={20} color={AppTheme.colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos Laborales (Opcional)</Text>
            <Text style={styles.sectionDescription}>
                Ayudan a recibir cálculos precisos.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre Completo</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Juan Pérez García"
                    value={fullName}
                    onChangeText={setFullName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Ocupación / Puesto</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Mesero, Contador"
                    value={occupation}
                    onChangeText={setOccupation}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Entidad Federativa</Text>
                <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowStateModal(true)}
                >
                    <Text style={selectedState ? styles.selectorText : styles.placeholderText}>
                        {selectedState || 'Selecciona tu estado'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.label}>Salario Mensual Bruto ($)</Text>
                    <TouchableOpacity onPress={() => alert('El Salario Bruto es la cantidad total antes de impuestos y deducciones. El Neto es lo que realmente recibes en tu cuenta.')}>
                        <Ionicons name="information-circle-outline" size={18} color={AppTheme.colors.primary} style={{ marginBottom: 8 }} />
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. 10,000"
                    value={monthlySalary}
                    onChangeText={handleSalaryChange}
                    keyboardType="numeric"
                />
                {monthlySalary !== '' && !isNaN(parseFloat(monthlySalary)) && (
                    <Text style={styles.helperText}>
                        {parseFloat(monthlySalary).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </Text>
                )}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={propagateChanges} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar Datos'}</Text>
            </TouchableOpacity>

            <Modal
                visible={showStateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowStateModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowStateModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <FlatList
                                data={STATES}
                                renderItem={renderStateItem}
                                keyExtractor={(item) => item}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
        marginBottom: 5,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#34495e',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#2c3e50',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selector: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectorText: { fontSize: 16, color: '#2c3e50' },
    placeholderText: { fontSize: 16, color: '#95a5a6' },
    saveButton: {
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    helperText: {
        fontSize: 12,
        color: '#27ae60',
        marginTop: 5,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        padding: 20,
    },
    stateItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stateText: { fontSize: 16, color: '#333' },
    selectedStateText: { color: AppTheme.colors.primary, fontWeight: 'bold' },
});

