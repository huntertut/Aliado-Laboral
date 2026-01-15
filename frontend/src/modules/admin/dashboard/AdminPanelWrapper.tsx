import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AdminDashboardScreen from './AdminDashboardScreen';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const AdminPanelWrapper = () => {
    // The spec says: "AdminPanel: Servir como punto de inicio... Funcionalidad Futura: Puede contener un acceso a un Dashboard."
    // Since we ALREADY have a dashboard, we will render it here directly to solve the user's issue 
    // "la vista para el admin ya la teniamos pero no la toma".

    // However, AdminDashboardScreen might have its own header/layout.
    // Given ProfileScreen has its own header, we might want to wrap this carefully.
    // For now, let's embed it directly as it seems to be what the user wants: seeing the dashboard in the profile tab.

    return (
        <View style={styles.container}>
            <AdminDashboardScreen />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    }
});
