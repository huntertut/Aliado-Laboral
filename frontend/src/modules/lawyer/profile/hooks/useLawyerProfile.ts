import { useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { API_URL } from '../../../../config/constants';
import { Alert } from 'react-native';

export const useLawyerProfile = () => {
    const { getAccessToken, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    const loadProfile = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/lawyer-profile/my-profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Map Data to match component expectations
                setProfileData({
                    lawyerData: {
                        professionalName: data.professionalName,
                        professionalLicense: data.licenseNumber,
                        specialty: data.specialty,
                        experienceYears: data.experienceYears?.toString() || '0',
                        attentionHours: data.attentionHours || 'Lunes a Viernes 9:00 AM - 6:00 PM',
                        bio: data.bio || '',
                        photoUrl: data.photoUrl || '',
                        contactInfo: {
                            phone: data.phone,
                            email: data.email
                        }
                    }
                });
            } else {
                console.error('Failed to fetch lawyer profile');
            }
        } catch (error) {
            console.error('Error loading lawyer profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, getAccessToken]);

    const updateProfile = async (data: any) => {
        setIsSaving(true);
        console.log('🚀 [Hook] Enviando datos al backend:', JSON.stringify(data, null, 2));
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/lawyer-profile/my-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const updated = await response.json();
                await loadProfile(); // Refresh to ensure mapping is correct
                Alert.alert('Éxito', 'Perfil profesional actualizado correctamente');
                return true;
            } else {
                Alert.alert('Error', 'No se pudo actualizar la información');
                return false;
            }
        } catch (error) {
            console.error('Error updating lawyer profile:', error);
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
        updateProfile
    };
};
