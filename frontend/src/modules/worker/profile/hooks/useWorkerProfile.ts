import { useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { API_URL } from '../../../../config/constants';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useWorkerProfile = () => {
    const { getAccessToken, user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    const loadProfile = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // 1. Try Cache First
            const cached = await AsyncStorage.getItem(`workerProfile_${user.uid}`);
            if (cached) {
                setProfileData(JSON.parse(cached));
                setIsLoading(false); // Show cached data immediately
            }

            // 2. Network Request
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/worker-profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();

                // Compare with cache to avoid unnecessary re-renders or updates
                if (JSON.stringify(data) !== cached) {
                    setProfileData(data);
                    await AsyncStorage.setItem(`workerProfile_${user.uid}`, JSON.stringify(data));
                }
            } else {
                console.error('Failed to fetch worker profile');
            }
        } catch (error) {
            console.error('Error loading worker profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, getAccessToken]);

    const updateLaborData = async (data: any) => {
        setIsSaving(true);
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/worker-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const updated = await response.json();
                setProfileData(updated); // Update local state immediately

                // Refresh user data in AuthContext to sync fullName
                if (data.fullName) {
                    await updateUser({ fullName: data.fullName });
                    console.log('✅ AuthContext user updated with new fullName');
                }

                // IMPORTANT: Reload profile to sync the internal state of children
                await loadProfile();

                Alert.alert('Éxito', 'Información laboral actualizada correctamente.');
                return true;
            } else {
                Alert.alert('Error', 'No se pudo actualizar la información');
                return false;
            }
        } catch (error) {
            console.error('Error updating worker profile:', error);
            Alert.alert('Error', 'Error de conexión al guardar');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        profileData,
        isLoading,
        isSaving,
        loadProfile,
        updateLaborData
    };
};
