import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { AppTheme } from '../../../theme/colors';
import { API_URL } from '../../../config/constants';
import PymeDataSection from './components/PymeDataSection';
import AssignedLawyerCard from './components/AssignedLawyerCard';

export const PymeProfileModule = () => {
    const { user, getAccessToken } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPymeProfile();
    }, []);

    const loadPymeProfile = async () => {
        try {
            setIsLoading(true);
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/pyme-profile`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            }
        } catch (error) {
            console.error('Error loading Pyme profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePyme = async (updatedData: any) => {
        try {
            setIsSaving(true);
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/pyme-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                Alert.alert('Éxito', 'Información actualizada.');
                loadPymeProfile();
            } else {
                Alert.alert('Error', 'No se pudo actualizar la información.');
            }
        } catch (error) {
            console.error('Error updating Pyme profile:', error);
            Alert.alert('Error', 'Hubo un problema al guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                <Text style={styles.loadingText}>Cargando perfil Pyme...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <PymeDataSection
                data={profileData || {}}
                onUpdate={handleUpdatePyme}
                isSaving={isSaving}
            />

            <AssignedLawyerCard
                lawyer={profileData?.assignedLawyer || null}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    }
});

