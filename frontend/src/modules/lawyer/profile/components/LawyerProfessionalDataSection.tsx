import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../../../theme/colors';

interface Props {
    data: any;
    onUpdate: () => void;
    onChange: (key: string, value: any) => void;
    isSaving: boolean;
}

export const LawyerProfessionalDataSection = ({ data, onUpdate, onChange, isSaving }: Props) => {
    // MODAL STATE
    const [showStartDayPicker, setShowStartDayPicker] = useState(false);
    const [showEndDayPicker, setShowEndDayPicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const dayOptions = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const timeOptions = [
        "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
        "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
    ];

    // Validate time range
    const validateTimeRange = (start: string, end: string): boolean => {
        const timeToMinutes = (time: string): number => {
            const [timeStr, period] = time.split(' ');
            let [hours, minutes] = timeStr.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };

        return timeToMinutes(start) < timeToMinutes(end);
    };

    const handleSave = () => {
        // Validate time range
        if (!validateTimeRange(data.startTime, data.endTime)) {
            Alert.alert(
                'Error de Horario',
                'La hora de inicio debe ser anterior a la hora de cierre.',
                [{ text: 'Entendido' }]
            );
            return;
        }

        onUpdate();
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Profesional</Text>
            <Text style={styles.sectionDescription}>
                Mantén tu perfil actualizado para generar confianza.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre Profesional</Text>
                <TextInput
                    style={styles.input}
                    value={data.professionalName}
                    onChangeText={(t) => onChange('professionalName', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Cédula Profesional (No editable)</Text>
                <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={data.professionalLicense}
                    editable={false}
                />
                <Text style={styles.helperText}>Para modificar tu cédula, contacta a soporte.</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Especialidad</Text>
                <TextInput
                    style={styles.input}
                    value={data.specialty}
                    onChangeText={(t) => onChange('specialty', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Días de Atención</Text>
                <View style={styles.dayRow}>
                    <TouchableOpacity
                        style={[styles.pickerButton, { flex: 1, marginRight: 5 }]}
                        onPress={() => setShowStartDayPicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>{data.startDay}</Text>
                    </TouchableOpacity>
                    <Text style={{ alignSelf: 'center', color: '#7f8c8d' }}>a</Text>
                    <TouchableOpacity
                        style={[styles.pickerButton, { flex: 1, marginLeft: 5 }]}
                        onPress={() => setShowEndDayPicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>{data.endDay}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Años Exp.</Text>
                    <TextInput
                        style={styles.input}
                        value={data.experienceYears}
                        onChangeText={(t) => onChange('experienceYears', t)}
                        keyboardType="numeric"
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={styles.label}>Horario de Atención</Text>
                    <View style={styles.timeRow}>
                        <TouchableOpacity
                            style={[styles.pickerButton, { flex: 1, marginRight: 5 }]}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text style={styles.pickerButtonText}>{data.startTime}</Text>
                        </TouchableOpacity>
                        <Text style={{ alignSelf: 'center' }}>-</Text>
                        <TouchableOpacity
                            style={[styles.pickerButton, { flex: 1, marginLeft: 5 }]}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Text style={styles.pickerButtonText}>{data.endTime}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal visible={showStartDayPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Día Inicial</Text>
                        <ScrollView>
                            {dayOptions.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={styles.modalOption}
                                    onPress={() => { onChange('startDay', opt); setShowStartDayPicker(false); }}
                                >
                                    <Text style={[styles.modalOptionText, data.startDay === opt && styles.modalOptionActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowStartDayPicker(false)}>
                            <Text style={styles.closeBtnText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showEndDayPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Día Final</Text>
                        <ScrollView>
                            {dayOptions.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={styles.modalOption}
                                    onPress={() => { onChange('endDay', opt); setShowEndDayPicker(false); }}
                                >
                                    <Text style={[styles.modalOptionText, data.endDay === opt && styles.modalOptionActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEndDayPicker(false)}>
                            <Text style={styles.closeBtnText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showStartPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Hora de Inicio</Text>
                        <ScrollView>
                            {timeOptions.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={styles.modalOption}
                                    onPress={() => { onChange('startTime', opt); setShowStartPicker(false); }}
                                >
                                    <Text style={[styles.modalOptionText, data.startTime === opt && styles.modalOptionActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowStartPicker(false)}>
                            <Text style={styles.closeBtnText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showEndPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Hora de Cierre</Text>
                        <ScrollView>
                            {timeOptions.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={styles.modalOption}
                                    onPress={() => { onChange('endTime', opt); setShowEndPicker(false); }}
                                >
                                    <Text style={[styles.modalOptionText, data.endTime === opt && styles.modalOptionActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEndPicker(false)}>
                            <Text style={styles.closeBtnText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Text style={styles.sectionTitle}>Contacto Público</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono (No editable)</Text>
                <View style={styles.phoneContainer}>
                    <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>+52</Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.phoneInput, styles.inputDisabled]}
                        value={data.phone}
                        editable={false}
                    />
                </View>
                <Text style={styles.helperText}>Para modificar tu teléfono, contacta a soporte.</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email de Contacto</Text>
                <TextInput
                    style={styles.input}
                    value={data.email}
                    onChangeText={(t) => onChange('email', t)}
                    keyboardType="email-address"
                />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Actualizar Perfil'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        marginHorizontal: 20, // Keep in sync with Profile screen
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
        marginTop: 10,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
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
    inputDisabled: {
        backgroundColor: '#e9ecef',
        color: '#6c757d',
    },
    helperText: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryCode: {
        backgroundColor: '#e8e8e8',
        paddingHorizontal: 12,
        paddingVertical: 15,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        marginRight: -1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRightWidth: 0,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    phoneInput: {
        flex: 1,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    saveButton: {
        backgroundColor: AppTheme.colors.primary,
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pickerButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#2c3e50',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#2c3e50',
    },
    modalOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#34495e',
        textAlign: 'center',
    },
    modalOptionActive: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
    },
    closeBtn: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        alignItems: 'center',
    },
    closeBtnText: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
    },
});

