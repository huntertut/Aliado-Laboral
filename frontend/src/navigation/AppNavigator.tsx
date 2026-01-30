import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
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
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminNavigator from './AdminNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import ProfileWizardScreen from '../screens/ProfileWizardScreen';
import WelcomeScreen from '../screens/WelcomeScreen'; // Added import for WelcomeScreen
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import { useAuth } from '../context/AuthContext';
import { AppTheme } from '../theme/colors';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={AppTheme?.colors?.primary || '#0000ff'} />
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
                        backgroundColor: AppTheme?.colors?.primary || '#1e3799',
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    headerTintColor: AppTheme?.colors?.white || '#ffffff',
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                    headerBackTitleVisible: false,
                }}
            >
                {user ? (
                    <>
                        {/* Supervisor/Accountant Navigator */}
                        {(user.role === 'supervisor' || user.role === 'accountant') ? (
                            <Stack.Screen
                                name="SupervisorPanel"
                                component={SupervisorNavigator}
                                options={{ headerShown: false }}
                            />
                        ) : user.role === 'admin' ? (
                            /* Admin Navigator */
                            <Stack.Screen
                                name="AdminPanel"
                                component={AdminNavigator}
                                options={{ headerShown: false }}
                            />
                        ) : user.role === 'pyme' ? (
                            <>
                                <Stack.Screen
                                    name="HomePyme"
                                    component={require('../screens/pyme/HomePymeScreen').default}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="LiquidationCalculator"
                                    component={require('../screens/pyme/LiquidationCalculatorView').default}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen name="LaborGuide" component={require('../screens/LaborGuideScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="Lawyers" component={require('../screens/LawyersScreen').default} options={{ title: 'Directorio de Abogados' }} />
                                <Stack.Screen name="LawyerDetail" component={require('../screens/LawyerDetailScreen').default} options={{ title: 'Perfil del Abogado' }} />
                                <Stack.Screen name="NewsFeed" component={NewsFeedScreen} options={{ headerShown: false }} />
                                <Stack.Screen name="GenerateAct" component={require('../screens/pyme/GenerateActScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="ContractReview" component={require('../screens/pyme/ContractReviewScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="LaborDocuments" component={require('../screens/pyme/LaborDocumentsScreen').default} options={{ headerShown: false }} />
                            </>
                        ) : (
                            /* Worker and Lawyer Screens */
                            <>
                                <Stack.Screen
                                    name="Home"
                                    component={HomeScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="Calculator"
                                    component={CalculatorScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="Guides"
                                    component={GuidesScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="GuideDetail"
                                    component={GuideDetailScreen}
                                    options={{ title: 'Detalle de Guía' }}
                                />
                                <Stack.Screen
                                    name="Lawyers"
                                    component={LawyersScreen}
                                    options={{ title: 'Directorio de Abogados' }}
                                />
                                <Stack.Screen
                                    name="LawyerDetail"
                                    component={LawyerDetailScreen}
                                    options={{ title: 'Perfil del Abogado' }}
                                />
                                <Stack.Screen
                                    name="History"
                                    component={HistoryScreen}
                                    options={{ title: 'Mi Bitácora' }}
                                />
                                <Stack.Screen
                                    name="ImssNom"
                                    component={ImssNomScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="Indemnizacion"
                                    component={IndemnizacionScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="AddIncident"
                                    component={AddIncidentScreen}
                                    options={{ title: 'Registrar Incidente' }}
                                />
                                <Stack.Screen
                                    name="Chat"
                                    component={ChatScreen}
                                    options={{ title: 'Asesor Virtual' }}
                                />
                                <Stack.Screen
                                    name="Problems"
                                    component={ProblemsScreen}
                                    options={{ title: 'Problemas Comunes' }}
                                />
                                <Stack.Screen
                                    name="ProblemDetail"
                                    component={ProblemDetailScreen}
                                    options={{ title: 'Detalle del Problema' }}
                                />
                                <Stack.Screen
                                    name="Profile"
                                    component={ProfileScreen}
                                    options={{ headerShown: false }}
                                />
                                {/* New Contact System Screens */}
                                <Stack.Screen name="LawyerPublicProfile" component={require('../screens/LawyerPublicProfileScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="CreateContactRequest" component={require('../screens/CreateContactRequestScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="MyContactRequests" component={require('../screens/MyContactRequestsScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="LawyerDashboard" component={require('../modules/lawyer/dashboard/LawyerDashboardScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="LawyerRequests" component={require('../screens/LawyerRequestsScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="LawyerRequestDetail" component={require('../screens/LawyerRequestDetailScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="SubscriptionManagement" component={require('../screens/SubscriptionManagementScreen').default} options={{ headerShown: false }} />

                                {/* New Content Modules */}
                                <Stack.Screen name="LaborGuide" component={require('../screens/LaborGuideScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="MyChest" component={require('../screens/MyChestScreen').default} options={{ title: 'Mi Kit Laboral' }} />
                                <Stack.Screen name="Benefits" component={require('../screens/BenefitsScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="ContractTypes" component={require('../screens/ContractTypesScreen').default} options={{ title: 'Tipos de Contrato' }} />
                                <Stack.Screen name="ContractDetail" component={require('../screens/ContractDetailScreen').default} options={{ title: 'Detalles del Contrato' }} />
                                <Stack.Screen name="WorkerRights" component={require('../screens/WorkerRightsScreen').default} options={{ title: 'Derechos del Trabajador' }} />
                                <Stack.Screen name="RightsCalculator" component={require('../screens/RightsCalculatorScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="ProfedetInfoWizard" component={require('../screens/ProfedetInfoWizardScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="SalaryThermometer" component={require('../screens/SalaryThermometerScreen').default} options={{ headerShown: false }} />

                                {/* Live Chat System */}
                                <Stack.Screen name="LawyerCases" component={require('../screens/LawyerCasesScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="CaseChat" component={require('../screens/CaseChatScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="Vault" component={require('../screens/VaultScreen').default} options={{ headerShown: false }} />
                                <Stack.Screen name="NewsFeed" component={NewsFeedScreen} options={{ headerShown: false }} />
                                <Stack.Screen name="AnonymousForum" component={require('../screens/forum/AnonymousForumScreen').default} options={{ headerShown: false }} />
                            </>
                        )}
                    </>
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen
                            name="Welcome"
                            component={require('../screens/WelcomeScreen').default}
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
                    </>
                )}

                {/* Global Screens (Accessible by some flows or modals) */}
                <Stack.Screen
                    name="PrivacyPolicy"
                    component={PrivacyPolicyScreen}
                    options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                    name="ForumCreatePost"
                    component={require('../screens/forum/ForumCreatePostScreen').default}
                    options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                    name="ForumDetail"
                    component={require('../screens/forum/ForumDetailScreen').default}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};


export default AppNavigator;
