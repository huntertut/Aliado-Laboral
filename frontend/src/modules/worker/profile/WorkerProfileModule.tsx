import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert, Text } from 'react-native';
import { useWorkerProfile } from './hooks/useWorkerProfile';
import { WorkerProfile as WorkerProfileUI } from './components/WorkerProfile';
import { useAuth } from '../../../context/AuthContext';
import { AppTheme } from '../../../theme/colors';

export const WorkerProfileModule = () => {
    const { user } = useAuth();
    const {
        profileData,
        isLoading,
        isSaving,
        loadProfile,
        updateLaborData
    } = useWorkerProfile();

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

    // Merge auth user data with fetched profile data for display
    const displayData = { ...user, ...profileData };

    return (
        <WorkerProfileUI
            data={displayData}
            onUpdateLaborData={updateLaborData}
            isSaving={isSaving}
        />
    );
};

