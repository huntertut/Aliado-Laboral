import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LawyerProfessionalDataSection } from './LawyerProfessionalDataSection';
import { AppTheme } from '../../../../theme/colors';

interface Props {
    data: any;
    onUpdate: (data: any) => void;
    isSaving: boolean;
}

export const LawyerProfile = ({ data, onUpdate, isSaving }: Props) => {
    // 1. Initial Mapping & Local Unified State
    const [localData, setLocalData] = useState(() => {
        const base = data?.lawyerData || {};

        // Parse attentionHours format: "Lunes a Viernes 9:00 AM - 6:00 PM"
        const attentionHours = base.attentionHours || 'Lunes a Viernes 9:00 AM - 6:00 PM';
        const match = attentionHours.match(/^(.*?)\s+(\d{1,2}:\d{2}\s+[AP]M)\s*-\s*(\d{1,2}:\d{2}\s+[AP]M)$/);

        let startDay = 'Lunes';
        let endDay = 'Viernes';
        let attentionDays = match ? match[1].trim() : 'Lunes a Viernes';
        if (attentionDays.includes(' a ')) {
            [startDay, endDay] = attentionDays.split(' a ');
        }

        // Determine if fields should be locked (if they come from backend and are not empty)
        const isBioLocked = !!base.bio && base.bio.trim().length > 0;
        const isPhotoLocked = !!base.photoUrl && base.photoUrl.trim().length > 0;

        return {
            professionalName: base.professionalName || data?.fullName || '',
            professionalLicense: base.professionalLicense || '',
            specialty: base.specialty || '',
            experienceYears: base.experienceYears?.toString() || '0',
            startDay,
            endDay,
            startTime: match ? match[2] : '9:00 AM',
            endTime: match ? match[3] : '6:00 PM',
            phone: base.contactInfo?.phone || base.phone || '',
            email: base.contactInfo?.email || base.email || '',
            bio: base.bio || '',
            photoUrl: base.photoUrl || '',
            isBioLocked,    // Internal state to track if bio was locked on mount
            isPhotoLocked,  // Internal state to track if photo was locked on mount
            ...base
        };
    });

    // Synchronize ONLY when external data change truly happens (full reload)
    useEffect(() => {
        if (data?.lawyerData) {
            setLocalData(prev => ({
                ...prev,
                ...data.lawyerData,
                experienceYears: data.lawyerData.experienceYears?.toString() || prev.experienceYears,
                phone: data.lawyerData.contactInfo?.phone || data.lawyerData.phone || prev.phone,
                email: data.lawyerData.contactInfo?.email || data.lawyerData.email || prev.email,
            }));
        }
    }, [data?.lawyerData]);

    const handleLocalChange = (key: string, value: any) => {
        setLocalData(prev => ({ ...prev, [key]: value }));
    };

    const handleFinalSave = async () => {
        const finalAttentionHours = `${localData.startDay} a ${localData.endDay} ${localData.startTime} - ${localData.endTime}`;
        const dataToSave = {
            ...localData,
            experienceYears: Number(localData.experienceYears) || 0,
            attentionHours: finalAttentionHours
        };

        console.log('📦 [Profile] Guardando todo unificado:', dataToSave);
        await onUpdate(dataToSave);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            try {
                const uri = result.assets[0].uri;
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                const mimeType = result.assets[0].mimeType || 'image/jpeg';
                handleLocalChange('photoUrl', `data:${mimeType};base64,${base64}`);
            } catch (error) {
                console.error('Error reading image as base64:', error);
                handleLocalChange('photoUrl', result.assets[0].uri); // Fallback to URI
            }
        }
    };

    return (
        <View style={styles.container}>
            {/* Strike Warning Banner */}
            {data?.strikes > 0 && (
                <View style={styles.strikeBanner}>
                    <Ionicons name="warning" size={24} color="#fff" />
                    <View style={styles.strikeTextContainer}>
                        <Text style={styles.strikeTitle}>
                            Tienes {data.strikes} Strike{data.strikes > 1 ? 's' : ''} Automático{data.strikes > 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.strikeDescription}>
                            Al juntar 3 strikes, tu cuenta será suspendida definitivamente de la plataforma. Evita malas prácticas y cumple el SLA.
                        </Text>
                    </View>
                </View>
            )}

            {/* Photo & Bio Section (New) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Perfil Público</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Biografía (Visible para clientes)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, localData.isBioLocked && styles.inputDisabled]}
                        value={localData.bio}
                        onChangeText={(t) => !localData.isBioLocked && handleLocalChange('bio', t)}
                        multiline
                        numberOfLines={6}
                        editable={!localData.isBioLocked}
                        placeholder="Describe tu experiencia y por qué deberían contratarte..."
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Foto de Perfil</Text>
                    <View style={styles.photoActionRow}>
                        {localData.photoUrl ? (
                            <Image source={{ uri: localData.photoUrl }} style={styles.previewImage} />
                        ) : (
                            <View style={[styles.previewImage, styles.photoPlaceholder]}>
                                <Ionicons name="person" size={30} color="#ccc" />
                            </View>
                        )}
                        {!localData.isPhotoLocked && (
                            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                                <Ionicons name="camera" size={20} color={AppTheme.colors.primary} />
                                <Text style={styles.uploadButtonText}>Subir desde celular</Text>
                            </TouchableOpacity>
                        )}
                        {localData.isPhotoLocked && (
                            <View style={[styles.uploadButton, styles.inputDisabled]}>
                                <Ionicons name="lock-closed" size={20} color="#6c757d" />
                                <Text style={[styles.uploadButtonText, { color: '#6c757d' }]}>Foto Guardada</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Legend requested by user */}
                <View style={styles.legendContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
                    <Text style={styles.legendText}>
                        Una vez guardada esta info, para modificarla favor de solicitar a soporte.
                    </Text>
                </View>
            </View>

            <LawyerProfessionalDataSection
                data={localData}
                onUpdate={handleFinalSave}
                onChange={handleLocalChange}
                isSaving={isSaving}
            />

            {/* Support Contact Button */}
            <TouchableOpacity
                style={styles.supportButton}
                onPress={() => {
                    const phone = '2211201419'; // Support WhatsApp number
                    const message = '¡Hola! Necesito ayuda con mi perfil de abogado.';
                    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
                }}
            >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.supportButtonText}>Contactar Soporte</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // flex: 1, // Removed to prevent ScrollView conflict
    },
    supportButton: {
        backgroundColor: '#25D366', // WhatsApp green
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    supportButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // Strike Banner
    strikeBanner: {
        backgroundColor: '#e74c3c',
        flexDirection: 'row',
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 12,
        marginBottom: 20,
        marginTop: 10,
        alignItems: 'center',
        elevation: 3,
    },
    strikeTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    strikeTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    strikeDescription: {
        color: '#fff',
        fontSize: 13,
        opacity: 0.9,
    },
    // New Styles
    section: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        marginHorizontal: 20, // Match margin of button
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
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
    inputDisabled: {
        backgroundColor: '#e9ecef',
        opacity: 0.7,
    },
    textArea: {
        minHeight: 150, // Increased height
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    photoActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        backgroundColor: '#f1f1f1',
    },
    photoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        borderStyle: 'dashed',
    },
    uploadButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: AppTheme.colors.primary,
        backgroundColor: `${AppTheme.colors.primary}05`,
    },
    uploadButtonText: {
        color: AppTheme.colors.primary,
        fontWeight: '600',
        marginLeft: 8,
    },
    legendContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
        marginTop: 5,
        alignItems: 'center',
    },
    legendText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginLeft: 8,
        flex: 1,
        fontStyle: 'italic',
    },
});

