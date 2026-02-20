import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../theme/colors';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkerProfileModule } from '../modules/worker/profile/WorkerProfileModule';
import { LawyerProfileModule } from '../modules/lawyer/profile/LawyerProfileModule';
import { AdminPanelWrapper } from '../modules/admin/dashboard/AdminPanelWrapper';
import { SupervisorDashboard } from '../modules/supervisor/dashboard/SupervisorDashboard';
import { AccountantDashboard } from '../modules/accountant/dashboard/AccountantDashboard';
import { PymeProfileModule } from '../modules/pyme/profile/PymeProfileModule';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, logout, getAccessToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        loadProfile();
    }, [user?.role]); // Reload when role is available

    const loadProfile = async () => {
        setIsLoading(true);
        try {

            // Endpoint Selection
            let endpoint = '';
            if (user?.role === 'lawyer') {
                endpoint = 'lawyer-profile/my-profile';
            } else if (user?.role === 'worker') {
                endpoint = 'worker-profile';
            }

            if (user?.role === 'admin') {
                setIsLoading(false);
                return; // Admin doesn't need profile fetch for this view
            }

            const token = await getAccessToken();

            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();

                // Map Data to Common Structure if needed
                if (user?.role === 'lawyer') {
                    // Backend returns flattened structure from getMyProfile
                    setProfileData({
                        lawyerData: {
                            professionalName: data.professionalName,
                            professionalLicense: data.licenseNumber,
                            specialty: data.specialty,
                            experienceYears: data.experienceYears,
                            attentionHours: data.attentionHours || '9:00 AM - 6:00 PM', // Default if missing
                            contactInfo: {
                                phone: data.phone,
                                email: data.email
                            }
                        }
                    });
                } else {
                    // Worker data is usually flat-ish or matches workerData
                    setProfileData(data);
                }
            }
        } catch (e) {
            console.error('Failed to load profile', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateWorker = async (updatedData: any) => {
        setIsSaving(true);
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/worker-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                Alert.alert('Éxito', 'Perfil actualizado correctamente.');
                loadProfile(); // Refresh
            } else {
                throw new Error('Update failed');
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo actualizar la información.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateLawyer = async (updatedData: any) => {
        // Implement lawyer update logic similarly
        setIsSaving(true);
        try {
            // Assume endpoint exists
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/lawyer-profile/my-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });
            if (response.ok) {
                Alert.alert('Éxito', 'Perfil profesional actualizado.');
                loadProfile();
            } else {
                Alert.alert('Error', 'No se pudo actualizar.');
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo actualizar.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Direct logout to prevent "Alert not attached to Activity" crash
            setIsLoading(true);
            await logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            setIsLoading(false);
        }
    };

    // Strict Role-Based Rendering
    const role = user?.role;

    // Use user context data merged with fetched data for best freshness
    const displayData = { ...user, ...profileData };

    return (
        <View style={styles.container}>
            {/* Common Header */}
            <LinearGradient
                colors={[AppTheme.colors.primary, '#3742fa']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {role === 'admin' ? 'Panel de Control' : 'Mi Perfil'}
                    </Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderBtn}>
                        <Text style={styles.logoutHeaderText}>Cerrar Sesión</Text>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {role !== 'admin' && (
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <Text style={styles.emailText}>{user?.email}</Text>
                        <Text style={styles.roleText}>
                            {role === 'worker' ? 'Trabajador' : role === 'lawyer' ? 'Abogado' : role === 'pyme' ? 'Empresa / Pyme' : 'Admin'}
                        </Text>
                    </View>
                )}
            </LinearGradient>

            {role === 'admin' ? (
                <AdminPanelWrapper />
            ) : (
                <ScrollView style={styles.content}>
                    {/* Renderizado CONDICIONAL estricto por rol */}
                    {role === 'worker' && (
                        <WorkerProfileModule />
                    )}

                    {role === 'lawyer' && (
                        <LawyerProfileModule />
                    )}

                    {role === 'supervisor' && (
                        <SupervisorDashboard />
                    )}

                    {role === 'accountant' && (
                        <AccountantDashboard />
                    )}

                    {role === 'pyme' && (
                        <PymeProfileModule />
                    )}

                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            padding: 15,
                            borderRadius: 10,
                            marginTop: 10,
                            marginBottom: 20
                        }}
                        onPress={() => {
                            // Determine correct policy type based on role
                            let policyType = 'GENERAL';
                            if (role === 'worker') policyType = 'WORKER';
                            else if (role === 'lawyer') policyType = 'LAWYER';
                            else if (role === 'pyme') policyType = 'PYME';

                            navigation.navigate('PrivacyPolicy' as never, { type: policyType } as never);
                        }}
                    >
                        <Ionicons name="shield-checkmark-outline" size={20} color={AppTheme.colors.primary} />
                        <Text style={{ marginLeft: 10, fontSize: 16, color: '#333', fontWeight: '500' }}>
                            Aviso de Privacidad
                        </Text>
                        <View style={{ flex: 1 }} />
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        marginLeft: 15
    },
    logoutHeaderText: {
        color: '#fff',
        marginRight: 8,
        fontWeight: '600',
        fontSize: 14
    },
    notificationBtn: {
        padding: 5,
        marginRight: 10
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: 10,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    emailText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    roleText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ff4757',
        backgroundColor: '#fff0f1',
        marginTop: 20,
        marginBottom: 40,
    },
    logoutButtonText: {
        color: '#ff4757',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default ProfileScreen;

