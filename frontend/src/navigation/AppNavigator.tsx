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
import LaborGuideScreen from '../screens/LaborGuideScreen';
import ContractTypesScreen from '../screens/ContractTypesScreen';
import ContractDetailScreen from '../screens/ContractDetailScreen';
import MyChestScreen from '../screens/MyChestScreen';
import LawyerDashboardScreen from '../modules/lawyer/dashboard/LawyerDashboardScreen';
import HomePymeScreen from '../screens/pyme/HomePymeScreen';
import LawyerRequestsScreen from '../screens/LawyerRequestsScreen';
import LawyerCasesScreen from '../screens/LawyerCasesScreen';
import LawyerRequestDetailScreen from '../screens/LawyerRequestDetailScreen';

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
                        <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="RightsCalculator" component={RightsCalculatorScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Guides" component={GuidesScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="GuideDetail" component={GuideDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Lawyers" component={LawyersScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="LawyerDetail" component={LawyerDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="AddIncident" component={AddIncidentScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Problems" component={ProblemsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ProblemDetail" component={ProblemDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ImssNom" component={ImssNomScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Indemnizacion" component={IndemnizacionScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="NewsFeed" component={NewsFeedScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Forum" component={ForumNavigator} options={{ headerShown: false }} />
                        <Stack.Screen name="ForumDetail" component={ForumDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="SalaryThermometer" component={SalaryThermometerScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Vault" component={VaultScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="WorkerRights" component={WorkerRightsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ProfedetInfo" component={ProfedetInfoWizardScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Benefits" component={BenefitsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="CreateContactRequest" component={CreateContactRequestScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="LaborDocuments" component={LaborDocumentsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="LaborGuide" component={LaborGuideScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ContractTypes" component={ContractTypesScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ContractDetail" component={ContractDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="MyChest" component={MyChestScreen} options={{ headerShown: false }} />

                        {/* Missing Dashboard Routes */}
                        <Stack.Screen name="LawyerDashboard" component={LawyerDashboardScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="HomePyme" component={HomePymeScreen} options={{ headerShown: false }} />

                        {/* Lawyer Specific Routes */}
                        <Stack.Screen name="LawyerRequests" component={LawyerRequestsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="LawyerCases" component={LawyerCasesScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="LawyerRequestDetail" component={LawyerRequestDetailScreen} options={{ headerShown: false }} />
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
