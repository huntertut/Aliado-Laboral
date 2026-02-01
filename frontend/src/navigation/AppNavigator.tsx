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
                {/* DEBUG MODE: ISOLATION TESTING */}
                <Stack.Screen
                    name="Welcome"
                    component={WelcomeScreen}
                    options={{ headerShown: false }}
                />

                {/* 
                {user ? (
                   // ... (Commented out complex logic)
                 (
                    // Auth Stack
                    <>
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
                */}
            </Stack.Navigator>
        </NavigationContainer>
    );
};


export default AppNavigator;
