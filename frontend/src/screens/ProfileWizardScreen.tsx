import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AppTheme } from '../theme/colors';

// This screen is shown when user.profileStatus === 'incomplete'
const ProfileWizardScreen = () => {
    const { user, updateProfile, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Lawyer Fields
    const [licenseNumber, setLicenseNumber] = useState('');
    const [specialty, setSpecialty] = useState('');

    // Pyme Fields
    const [companyName, setCompanyName] = useState('');
    const [rfc, setRfc] = useState('');
    const [industry, setIndustry] = useState('');

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // Validate based on role
            if (user?.role === 'lawyer') {
                if (!licenseNumber) throw new Error('Cédula Profesional es obligatoria');
                // Call API to complete profile
                await updateProfile({
                    licenseNumber,
                    specialty,
                    profileStatus: 'pending' // Move to pending verification
                });
            } else if (user?.role === 'pyme') {
                if (!companyName) throw new Error('Nombre de la Empresa es obligatorio');
                // Call API
                await updateProfile({
                    companyName,
                    rfc,
                    industry,
                    profileStatus: 'active' // Pymes activate immediately for MVP
                });
            } else {
                // Workers usually active by default, but if here, force active
                await updateProfile({ profileStatus: 'active' });
            }
            // Navigation will automatically update via Router Guard reacting to user state change
        } catch (e: any) {
            Alert.alert('Error', e.message);
            setIsLoading(false);
        }
    };

    const renderLawyerForm = () => (
        <View>
            <Text style={styles.sectionTitle}>Datos Profesionales</Text>
            <Text style={styles.description}>Para activar tu cuenta de Abogado, necesitamos validar tu cédula.</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Número de Cédula"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.inputContainer}>
                <Ionicons name="school-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Especialidad (Ej. Laboral, Corporativo)"
                    value={specialty}
                    onChangeText={setSpecialty}
                />
            </View>
        </View>
    );

    const renderPymeForm = () => (
        <View>
            <Text style={styles.sectionTitle}>Datos de la Empresa</Text>
            <Text style={styles.description}>Completa tu perfil empresarial para generar documentos.</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Razón Social / Nombre"
                    value={companyName}
                    onChangeText={setCompanyName}
                />
            </View>
            <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="RFC (Opcional)"
                    value={rfc}
                    onChangeText={setRfc}
                    autoCapitalize="characters"
                />
            </View>
            <View style={styles.inputContainer}>
                <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Industria / Sector"
                    value={industry}
                    onChangeText={setIndustry}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[AppTheme.colors.primary, '#3742fa']}
                style={styles.header}
            >
                <Text style={styles.title}>Completar Perfil</Text>
                <Text style={styles.subtitle}>
                    Hola {user?.role === 'lawyer' ? 'Licenciado' : user?.role === 'pyme' ? 'Empresario' : ''},
                    fantan unos pasos.
                </Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {user?.role === 'lawyer' && renderLawyerForm()}
                {user?.role === 'pyme' && renderPymeForm()}
                {user?.role === 'worker' && <Text>Todo listo. Confirma para continuar.</Text>}

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Guardar y Continuar</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Cancelar / Cerrar Sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { padding: 30, paddingTop: 60, borderBottomRightRadius: 30, borderBottomLeftRadius: 30 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subtitle: { color: '#e0e0e0', marginTop: 5 },
    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    description: { color: '#666', marginBottom: 20 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16 },
    submitBtn: { backgroundColor: AppTheme.colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    logoutBtn: { marginTop: 20, alignItems: 'center' },
    logoutText: { color: '#888' }
});

export default ProfileWizardScreen;

