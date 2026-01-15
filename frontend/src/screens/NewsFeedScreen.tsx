import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
import { theme } from '../theme/colors';

const NewsFeedScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [news, setNews] = useState<any[]>([]);

    const fetchNews = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/news`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNews(response.data);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNews();
    };

    const renderNewsItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
            )}
            <View style={styles.cardContent}>
                <View style={styles.tagContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.roleContext === 'lawyer' ? 'TÉCNICO' : 'ACTUALIDAD'}</Text>
                    </View>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.summary}>{item.summary}</Text>

                {item.quiz && (
                    <View style={styles.quizSection}>
                        <View style={styles.quizHeader}>
                            <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
                            <Text style={styles.quizTitle}>¿Lo sabías?</Text>
                        </View>
                        <Text style={styles.quizText}>{item.quiz}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, '#34495e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Noticias Legales</Text>
                <Text style={styles.headerSubtitle}>Procesadas con Inteligencia Artificial</Text>
            </LinearGradient>

            <FlatList
                data={news}
                renderItem={renderNewsItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="newspaper-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No hay noticias por ahora</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20, // More rounded
        marginBottom: 24,
        marginHorizontal: 4, // Side spacing
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 }, // Deeper shadow
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)'
    },
    image: {
        width: '100%',
        height: 180,
    },
    cardContent: {
        padding: 15,
    },
    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tag: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
        color: '#95a5a6',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
        lineHeight: 24,
    },
    summary: {
        fontSize: 14,
        color: '#7f8c8d',
        lineHeight: 22,
        marginBottom: 15,
    },
    quizSection: {
        backgroundColor: '#f1f2f6',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    quizTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginLeft: 5,
    },
    quizText: {
        fontSize: 13,
        color: '#2c3e50',
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: '#95a5a6',
        fontSize: 16,
    },
});

export default NewsFeedScreen;
