import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AnonymousForumScreen from '../screens/forum/AnonymousForumScreen';
import ForumCreatePostScreen from '../screens/forum/ForumCreatePostScreen';
import ForumDetailScreen from '../screens/forum/ForumDetailScreen';
import { AppTheme } from '../theme/colors';

const Stack = createStackNavigator();

const ForumNavigator = () => {
    return (
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
            <Stack.Screen
                name="ForumList"
                component={AnonymousForumScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreatePost"
                component={ForumCreatePostScreen}
                options={{ title: 'Nueva Publicación' }}
            />
            <Stack.Screen
                name="ForumDetail"
                component={ForumDetailScreen}
                options={{ title: 'Discusión' }}
            />
        </Stack.Navigator>
    );
};

export default ForumNavigator;
