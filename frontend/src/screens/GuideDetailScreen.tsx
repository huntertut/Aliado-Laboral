import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const GuideDetailScreen = () => {
    const route = useRoute();
    const { guide } = route.params as any;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.content}>{guide.content}</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
});

export default GuideDetailScreen;
