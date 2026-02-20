import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: string) => void;
    initialDate?: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ visible, onClose, onSelect, initialDate }) => {
    const currentYear = new Date().getFullYear();
    const [selectedDay, setSelectedDay] = useState(initialDate ? parseInt(initialDate.split('/')[0]) : 1);
    const [selectedMonth, setSelectedMonth] = useState(initialDate ? parseInt(initialDate.split('/')[1]) : 1);
    const [selectedYear, setSelectedYear] = useState(initialDate ? parseInt(initialDate.split('/')[2]) : currentYear);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month, 0).getDate();
    };

    const handleConfirm = () => {
        const formattedDate = `${String(selectedDay).padStart(2, '0')}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;
        onSelect(formattedDate);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Seleccionar Fecha</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerContainer}>
                        {/* Day Picker */}
                        <View style={styles.column}>
                            <Text style={styles.columnTitle}>Día</Text>
                            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                                {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.option, selectedDay === day && styles.selectedOption]}
                                        onPress={() => setSelectedDay(day)}
                                    >
                                        <Text style={[styles.optionText, selectedDay === day && styles.selectedText]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Month Picker */}
                        <View style={styles.column}>
                            <Text style={styles.columnTitle}>Mes</Text>
                            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                                {months.map((month, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.option, selectedMonth === index + 1 && styles.selectedOption]}
                                        onPress={() => setSelectedMonth(index + 1)}
                                    >
                                        <Text style={[styles.optionText, selectedMonth === index + 1 && styles.selectedText]}>
                                            {month}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Year Picker */}
                        <View style={styles.column}>
                            <Text style={styles.columnTitle}>Año</Text>
                            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                                {Array.from({ length: 50 }, (_, i) => currentYear - i).map(year => (
                                    <TouchableOpacity
                                        key={year}
                                        style={[styles.option, selectedYear === year && styles.selectedOption]}
                                        onPress={() => setSelectedYear(year)}
                                    >
                                        <Text style={[styles.optionText, selectedYear === year && styles.selectedText]}>
                                            {year}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Text style={styles.confirmText}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    column: {
        flex: 1,
        marginHorizontal: 5,
    },
    columnTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    scrollView: {
        maxHeight: 200,
    },
    option: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 5,
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: AppTheme.colors.primary,
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DatePickerModal;

