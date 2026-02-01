import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Switch, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import { useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

const RegisterScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { role } = route.params as { role: 'worker' | 'lawyer' | 'pyme' } || { role: 'worker' }; // Default to worker if undefined

    const { register, isLoading } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false); // New state

    // Lawyer specific fields
    const [licenseNumber, setLicenseNumber] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

    // Pyme specific fields
    const [companyName, setCompanyName] = useState('');
    const [rfc, setRfc] = useState('');
    const [industry, setIndustry] = useState('');
    const [employeeCount, setEmployeeCount] = useState('');
    const [assignedLawyerId, setAssignedLawyerId] = useState('');
    const [availableLawyers, setAvailableLawyers] = useState<any[]>([]);
    const [isFetchingLawyers, setIsFetchingLawyers] = useState(false);

    useEffect(() => {
        if (role === 'pyme') {
            fetchLawyers();
        }
    }, [role]);

    const fetchLawyers = async () => {
        try {
            setIsFetchingLawyers(true);
            const response = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/lawyers`);
            const data = await response.json();
            // Filter lawyers that accept Pyme clients
            const pymeLawyers = data.filter((l: any) => l.acceptsPymeClients);
            setAvailableLawyers(pymeLawyers);
            if (pymeLawyers.length > 0) {
                setAssignedLawyerId(pymeLawyers[0].id);
            }
        } catch (error) {
            console.error('Error fetching lawyers:', error);
        } finally {
            setIsFetchingLawyers(false);
        }
    };

    // Scope Configuration
    const [nationalScope, setNationalScope] = useState(false);
    const [acceptsFederalCases, setAcceptsFederalCases] = useState(false);
    const [acceptsLocalCases, setAcceptsLocalCases] = useState(true);
    const [requiresPhysicalPresence, setRequiresPhysicalPresence] = useState(true);
    const [acceptsPymeClients, setAcceptsPymeClients] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                setSelectedFile(result);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const handleRegister = async () => {
        // Validate all required fields
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
            return;
        }

        if (!privacyAccepted) {
            Alert.alert('Atención', 'Debes aceptar el Aviso de Privacidad para continuar.');
            return;
        }

        // Validate name length (max 100 characters)
        if (fullName.length > 100) {
            Alert.alert('Error', 'El nombre es demasiado largo (máximo 100 caracteres)');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
            return;
        }

        // Validate lawyer-specific fields
        if (role === 'lawyer' && !licenseNumber) {
            Alert.alert('Error', 'La Cédula Profesional es obligatoria para abogados');
            return;
        }

        // Validate Pyme specific fields
        if (role === 'pyme' && !companyName) {
            Alert.alert('Error', 'La Razón Social / Nombre de la Empresa es obligatorio');
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
            return;
        }

        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);

        if (!hasNumber || !hasLetter) {
            Alert.alert(
                'Contraseña débil',
                'La contraseña debe contener al menos una letra y un número para mayor seguridad'
            );
            return;
        }

        try {
            let extraData: any = undefined;

            if (role === 'lawyer') {
                extraData = {
                    licenseNumber,
                    specialty,
                    nationalScope,
                    acceptsFederalCases,
                    acceptsLocalCases,
                    requiresPhysicalPresence,
                    acceptsPymeClients
                };
            } else if (role === 'pyme') {
                extraData = {
                    companyName,
                    rfc,
                    industry,
                    employeeCount,
                    assignedLawyerId
                };
            }

            await register(email, password, fullName, role, extraData);

            if (role === 'lawyer') {
                setShowSuccessModal(true);
            } else {
                Alert.alert('Éxito', 'Cuenta creada correctamente', [
                    { text: 'OK', onPress: () => navigation.navigate('Login' as never) }
                ]);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo crear la cuenta.');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[role === 'lawyer' ? '#e65100' : AppTheme.colors.primary, role === 'lawyer' ? '#f57c00' : '#3742fa']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {role === 'lawyer' ? 'Cuenta Profesional' : role === 'pyme' ? 'Cuenta Empresarial' : 'Cuenta Trabajador'}
                </Text>
                <Text style={styles.subtitle}>
                    {role === 'lawyer' ? 'Únete como Abogado Experto' : role === 'pyme' ? 'Optimiza tu gestión laboral' : 'Únete a Aliado Laboral'}
                </Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre Completo"
                        value={fullName}
                        onChangeText={setFullName}
                        maxLength={100}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Correo Electrónico"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        maxLength={255}
                    />
                </View>

                {role === 'pyme' && (
                    <>
                        <View style={styles.inputContainer}>
                            <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Razón Social / Empresa"
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
                        <View style={styles.inputContainer}>
                            <Ionicons name="people-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Número de Empleados (Aprox)"
                                value={employeeCount}
                                onChangeText={setEmployeeCount}
                                keyboardType="numeric"
                            />
                        </View>

                        <Text style={styles.label}>Abogado Asignado</Text>
                        <View style={styles.lawyerSelector}>
                            {isFetchingLawyers ? (
                                <ActivityIndicator size="small" color={AppTheme.colors.primary} />
                            ) : availableLawyers.length > 0 ? (
                                availableLawyers.map((lawyer) => (
                                    <TouchableOpacity
                                        key={lawyer.id}
                                        style={[
                                            styles.lawyerCard,
                                            assignedLawyerId === lawyer.id && styles.lawyerCardSelected
                                        ]}
                                        onPress={() => setAssignedLawyerId(lawyer.id)}
                                    >
                                        <Text style={[
                                            styles.lawyerName,
                                            assignedLawyerId === lawyer.id && styles.lawyerNameSelected
                                        ]}>
                                            {lawyer.user.fullName}
                                        </Text>
                                        <Text style={styles.lawyerSpecialty}>{lawyer.specialty || 'Generalista'}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.errorText}>No hay abogados disponibles en este momento.</Text>
                            )}
                        </View>
                    </>
                )}

                {role === 'lawyer' && (
                    <>
                        <View style={styles.inputContainer}>
                            <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Número de Cédula Profesional"
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                                keyboardType="numeric"
                                maxLength={10}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="school-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Especialidad (Opcional)"
                                value={specialty}
                                onChangeText={setSpecialty}
                            />
                        </View>

                        <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                            <Ionicons name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={selectedFile ? "green" : "#666"} />
                            <Text style={[styles.uploadText, selectedFile && { color: 'green' }]}>
                                {selectedFile && selectedFile.assets ? selectedFile.assets[0].name : "Subir Cédula (PDF/Foto)"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.scopeContainer}>
                            <Text style={styles.sectionTitle}>Configura tu Alcance</Text>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Litiga a Nivel Nacional</Text>
                                <Switch
                                    value={nationalScope}
                                    onValueChange={setNationalScope}
                                    trackColor={{ false: "#767577", true: "#f57c00" }}
                                />
                            </View>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Acepta Casos Federales</Text>
                                <Switch
                                    value={acceptsFederalCases}
                                    onValueChange={setAcceptsFederalCases}
                                    trackColor={{ false: "#767577", true: "#f57c00" }}
                                />
                            </View>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Acepta Casos Locales</Text>
                                <Switch
                                    value={acceptsLocalCases}
                                    onValueChange={setAcceptsLocalCases}
                                    trackColor={{ false: "#767577", true: "#f57c00" }}
                                />
                            </View>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Requiere Presencia Física</Text>
                                <Switch
                                    value={requiresPhysicalPresence}
                                    onValueChange={setRequiresPhysicalPresence}
                                    trackColor={{ false: "#767577", true: "#f57c00" }}
                                />
                            </View>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Atender a Empresas (Pymes)</Text>
                                <Switch
                                    value={acceptsPymeClients}
                                    onValueChange={setAcceptsPymeClients}
                                    trackColor={{ false: "#767577", true: "#f57c00" }}
                                />
                            </View>
                        </View>
                    </>
                )}

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirmar Contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                    />
                </View>

                {/* Privacy Policy Checkbox */}
                <View style={styles.privacyContainer}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => setPrivacyAccepted(!privacyAccepted)}
                    >
                        <Ionicons
                            name={privacyAccepted ? "checkbox" : "square-outline"}
                            size={24}
                            color={privacyAccepted ? AppTheme.colors.primary : "#666"}
                        />
                    </TouchableOpacity>
                    <View style={styles.privacyTextContainer}>
                        <Text style={styles.privacyTextLabel}>
                            He leído y acepto el{' '}
                            <Text
                                style={styles.privacyLink}
                                onPress={() => {
                                    let policyType = 'GENERAL';
                                    if (role === 'worker') policyType = 'WORKER';
                                    else if (role === 'lawyer') policyType = 'LAWYER';
                                    else if (role === 'pyme') policyType = 'PYME';
                                    navigation.navigate('PrivacyPolicy' as never, { type: policyType } as never);
                                }}
                            >
                                Términos y Condiciones y Aviso de Privacidad
                            </Text>
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={[role === 'lawyer' ? '#e65100' : AppTheme.colors.secondary, role === 'lawyer' ? '#ff9800' : '#f9ca24']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.registerButtonText}>
                                {role === 'lawyer' ? 'Solicitar Verificación' : 'Registrarse'}
                            </Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                        <Text style={styles.loginLink}>Inicia Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>


            {/* Modal de Registro Exitoso para Abogados */}
            {
                role === 'lawyer' && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showSuccessModal}
                        onRequestClose={() => {
                            setShowSuccessModal(false);
                            navigation.navigate('Login' as never);
                        }}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Ionicons name="checkmark-circle" size={60} color="#4cd137" />
                                    <Text style={styles.modalTitle}>¡Solicitud Enviada!</Text>
                                </View>

                                <Text style={styles.modalSubtitle}>
                                    Tu cuenta ha sido creada y está pendiente de verificación.
                                </Text>

                                <Text style={styles.benefitsTitle}>Una vez verificado, podrás:</Text>

                                <View style={styles.benefitItem}>
                                    <Ionicons name="people" size={24} color="#f57c00" />
                                    <Text style={styles.benefitText}>Acceder a cientos de clientes potenciales</Text>
                                </View>

                                <View style={styles.benefitItem}>
                                    <Ionicons name="card" size={24} color="#f57c00" />
                                    <Text style={styles.benefitText}>Recibir pagos seguros vía Stripe</Text>
                                </View>

                                <View style={styles.benefitItem}>
                                    <Ionicons name="document-text" size={24} color="#f57c00" />
                                    <Text style={styles.benefitText}>Gestionar tus casos digitalmente</Text>
                                </View>

                                <View style={styles.benefitItem}>
                                    <Ionicons name="star" size={24} color="#f57c00" />
                                    <Text style={styles.benefitText}>Construir tu reputación profesional</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => {
                                        setShowSuccessModal(false);
                                        navigation.navigate('Login' as never);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Entendido, ir al Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
    },
    backButton: {
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    formContainer: {
        padding: 20,
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    registerButton: {
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 30,
        shadowColor: AppTheme.colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        color: '#666',
        fontSize: 16,
    },
    loginLink: {
        color: AppTheme.colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    uploadText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 16,
    },
    scopeContainer: {
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    switchLabel: {
        fontSize: 16,
        color: '#555',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        width: '85%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    benefitsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e65100',
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    benefitText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#444',
    },
    modalButton: {
        backgroundColor: '#e65100',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 30,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    lawyerSelector: {
        flexDirection: 'column',
    },
    lawyerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        borderWidth: 2,
        borderColor: '#eee',
        marginBottom: 10,
    },
    lawyerCardSelected: {
        borderColor: AppTheme.colors.primary,
        backgroundColor: '#f0f4ff',
    },
    lawyerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    lawyerNameSelected: {
        color: AppTheme.colors.primary,
    },
    lawyerSpecialty: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    errorText: {
        color: '#ff4757',
        fontSize: 14,
        fontStyle: 'italic',
    },
    privacyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5
    },
    checkbox: {
        marginRight: 10,
    },
    privacyTextContainer: {
        flex: 1,
    },
    privacyTextLabel: {
        fontSize: 14,
        color: '#666',
    },
    privacyLink: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});

export default RegisterScreen;

