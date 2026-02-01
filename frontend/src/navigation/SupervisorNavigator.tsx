import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from '../screens/ProfileScreen';
import { SupervisorDashboard } from '../modules/supervisor/dashboard/SupervisorDashboard';
import { AppTheme } from '../theme/colors';

const Tab = createBottomTabNavigator();

const SupervisorNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: AppTheme.colors.primary,
                tabBarInactiveTintColor: '#999',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#eee',
                    height: 60,
                    paddingBottom: 8,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={SupervisorDashboard}
                options={{
                    tabBarLabel: 'Panel',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default SupervisorNavigator;
