import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLawyerProfile } from './hooks/useLawyerProfile';
import { LawyerProfile as LawyerProfileUI } from './components/LawyerProfile';
import { useAuth } from '../../../context/AuthContext';
import { AppTheme } from '../../../theme/colors';

export const LawyerProfileModule = () => {
    const { user } = useAuth();
    const {
        profileData,
        isLoading,
        isSaving,
        loadProfile,
        updateProfile
    } = useLawyerProfile();

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    if (isLoading && !profileData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                <Text style={{ marginTop: 10, color: '#666' }}>Cargando perfil...</Text>
            </View>
        );
    }

    const displayData = { ...user, ...profileData };

    return (
        <LawyerProfileUI
            data={displayData}
            onUpdate={updateProfile}
            isSaving={isSaving}
        />
    );
};

