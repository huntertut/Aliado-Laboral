import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../modules/admin/dashboard/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminFinanceScreen from '../screens/admin/AdminFinanceScreen';
import AdminCasesScreen from '../screens/admin/AdminCasesScreen';
import AdminSecurityScreen from '../screens/admin/AdminSecurityScreen';
import { SupervisorDashboard } from '../modules/supervisor/dashboard/SupervisorDashboard';
import { theme } from '../theme/colors';

const Tab = createBottomTabNavigator();

const AdminNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Usuarios') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Finanzas') {
                        iconName = focused ? 'cash' : 'cash-outline';
                    } else if (route.name === 'Casos') {
                        iconName = focused ? 'briefcase' : 'briefcase-outline';
                    } else if (route.name === 'Verificaciones') {
                        iconName = focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline';
                    } else if (route.name === 'Seguridad') {
                        iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
            <Tab.Screen name="Usuarios" component={AdminUsersScreen} />
            <Tab.Screen name="Finanzas" component={AdminFinanceScreen} />
            <Tab.Screen name="Casos" component={AdminCasesScreen} />
            <Tab.Screen name="Verificaciones" component={SupervisorDashboard} />
            <Tab.Screen name="Seguridad" component={AdminSecurityScreen} />
        </Tab.Navigator>
    );
};

export default AdminNavigator;
