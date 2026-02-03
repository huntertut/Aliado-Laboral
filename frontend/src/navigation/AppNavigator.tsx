import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import GuidesScreen from '../screens/GuidesScreen';
import GuideDetailScreen from '../screens/GuideDetailScreen';
import LawyersScreen from '../screens/LawyersScreen';
import LawyerDetailScreen from '../screens/LawyerDetailScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AddIncidentScreen from '../screens/AddIncidentScreen';
import ChatScreen from '../screens/ChatScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import ProblemDetailScreen from '../screens/ProblemDetailScreen';
import ImssNomScreen from '../screens/ImssNomScreen';
import IndemnizacionScreen from '../screens/IndemnizacionScreen';
import NewsFeedScreen from '../screens/NewsFeedScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminNavigator from './AdminNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import ProfileWizardScreen from '../screens/ProfileWizardScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import { useAuth } from '../context/AuthContext';
import { AppTheme } from '../theme/colors';
import ForumNavigator from './ForumNavigator';
import ForumDetailScreen from '../screens/forum/ForumDetailScreen';
import SubscriptionManagementScreen from '../screens/SubscriptionManagementScreen';
import RightsCalculatorScreen from '../screens/RightsCalculatorScreen';
import SalaryThermometerScreen from '../screens/SalaryThermometerScreen';
import VaultScreen from '../screens/VaultScreen';
import WorkerRightsScreen from '../screens/WorkerRightsScreen';
import ProfedetInfoWizardScreen from '../screens/ProfedetInfoWizardScreen';
import BenefitsScreen from '../screens/BenefitsScreen';
import CreateContactRequestScreen from '../screens/CreateContactRequestScreen';
import LaborDocumentsScreen from '../screens/pyme/LaborDocumentsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={'#0000ff'} />
            </View>
        );
    }

    // ROUTER GUARD: Check for Incomplete Profile
    if (user && user.profileStatus === 'incomplete') {
        return (
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="ProfileWizard" component={ProfileWizardScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#1e3799',
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                    headerBackTitleVisible: false,
                }}
            >
                {user ? (
                    /* Main App Stack */
                    <>
                        {/* Role Based Navigation */}
                        {user.role === 'admin' ? (
                            <Stack.Screen
                                name="AdminDashboard"
                                component={AdminNavigator}
                                options={{ headerShown: false }}
                            />
                        ) : user.role === 'supervisor' ? (
                            <Stack.Screen
                                name="SupervisorDashboard"
                                component={SupervisorNavigator}
                                options={{ headerShown: false }}
                            />
                        ) : (
                            // Standard User Stack (Worker, Lawyer, Pyme)
                            <Stack.Screen
                                name="Home"
                                component={HomeScreen}
                                options={{
                                    headerTitle: 'Aliado Laboral',
                                    headerLeft: () => null
                                }}
                            />
                        )}

                        {/* Common Screens */}
                        <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ title: 'Calculadora' }} />
                        <Stack.Screen name="RightsCalculator" component={RightsCalculatorScreen} options={{ title: 'Calculadora de Derechos' }} />
                        <Stack.Screen name="Guides" component={GuidesScreen} options={{ title: 'Guías Laborales' }} />
                        <Stack.Screen name="GuideDetail" component={GuideDetailScreen} options={{ title: 'Detalle de Guía' }} />
                        <Stack.Screen name="Lawyers" component={LawyersScreen} options={{ title: 'Directorio de Abogados' }} />
                        <Stack.Screen name="LawyerDetail" component={LawyerDetailScreen} options={{ title: 'Perfil del Abogado' }} />
                        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
                        <Stack.Screen name="AddIncident" component={AddIncidentScreen} options={{ title: 'Reportar Incidente' }} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Asistente Legal IA' }} />
                        <Stack.Screen name="Problems" component={ProblemsScreen} options={{ title: 'Problemas Comunes' }} />
                        <Stack.Screen name="ProblemDetail" component={ProblemDetailScreen} options={{ title: 'Detalle del Problema' }} />
                        <Stack.Screen name="ImssNom" component={ImssNomScreen} options={{ title: 'IMSS y Nómina' }} />
                        <Stack.Screen name="Indemnizacion" component={IndemnizacionScreen} options={{ title: 'Indemnización' }} />
                        <Stack.Screen name="NewsFeed" component={NewsFeedScreen} options={{ title: 'Noticias Laborales' }} />
                        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Política de Privacidad', headerShown: true }} />
                        <Stack.Screen name="Forum" component={ForumNavigator} options={{ headerShown: false, title: 'Foro Comunitario' }} />
                        <Stack.Screen name="ForumDetail" component={ForumDetailScreen} options={{ title: 'Discusi\u00f3n', headerShown: true }} />
                        <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} options={{ title: 'Suscripciones', headerShown: true }} />
                        <Stack.Screen name="SalaryThermometer" component={SalaryThermometerScreen} options={{ title: 'Termómetro Salarial', headerShown: true }} />
                        <Stack.Screen name="Vault" component={VaultScreen} options={{ title: 'Bóveda de Documentos', headerShown: true }} />
                        <Stack.Screen name="WorkerRights" component={WorkerRightsScreen} options={{ title: 'Mis Derechos', headerShown: true }} />
                        <Stack.Screen name="ProfedetInfo" component={ProfedetInfoWizardScreen} options={{ title: 'Asesoría PROFEDET', headerShown: true }} />
                        <Stack.Screen name="Benefits" component={BenefitsScreen} options={{ title: 'Mis Prestaciones', headerShown: true }} />
                        <Stack.Screen name="CreateContactRequest" component={CreateContactRequestScreen} options={{ title: 'Contactar Abogado', headerShown: true }} />
                        <Stack.Screen name="LaborDocuments" component={LaborDocumentsScreen} options={{ title: 'Generador de Documentos', headerShown: true }} />
                    </>
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen
                            name="Welcome"
                            component={WelcomeScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PrivacyPolicy"
                            component={PrivacyPolicyScreen}
                            options={{ title: 'Política de Privacidad', headerShown: true }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};


export default AppNavigator;
