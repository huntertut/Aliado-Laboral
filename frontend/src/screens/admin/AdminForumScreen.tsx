import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminForumScreen = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'reported'>('all'); // Preparado para futuro filtro 'reported'

    const fetchPosts = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            // Admin should see ALL posts, possibly reuse getPosts but the backend 7-day filter logic
            // for admins allows them to see everything.
            const response = await axios.get(`${API_URL}/forum/posts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching forum posts:', error);
            Alert.alert('Error', 'No se pudieron cargar los posts del foro.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchPosts();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    const handleDelete = (postId: string) => {
        Alert.alert(
            'Eliminar Post',
            '¿Estás seguro de que quieres eliminar este post permanentemente? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            await axios.delete(`${API_URL}/forum/posts/${postId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Éxito', 'Post eliminado.');
                            setPosts(prev => prev.filter(p => p.id !== postId));
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar el post.');
                        }
                    }
                }
            ]
        );
    };

    const handleHide = (postId: string, currentStatus: string) => {
        if (currentStatus === 'hidden') return; // Ya está oculto

        Alert.alert(
            'Ocultar Post',
            'El post dejará de ser visible para los usuarios, pero permanecerá en la base de datos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ocultar',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            await axios.put(`${API_URL}/forum/posts/${postId}/hide`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Éxito', 'Post ocultado.');
                            // Actualizar estado local
                            setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'hidden' } : p));
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo ocultar el post.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, item.status === 'hidden' && styles.hiddenCard]}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: AppTheme.colors.primary + '20' }]}>
                    <Text style={[styles.badgeText, { color: AppTheme.colors.primary }]}>{item.topic}</Text>
                </View>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.content} numberOfLines={3}>{item.content}</Text>

            <View style={styles.footer}>
                <View style={styles.stats}>
                    <Ionicons name="eye-outline" size={16} color="#999" />
                    <Text style={styles.statText}>{item.views}</Text>
                    <Ionicons name="chatbubbles-outline" size={16} color="#999" style={{ marginLeft: 10 }} />
                    <Text style={styles.statText}>{item._count?.answers || 0}</Text>
                </View>

                <View style={styles.actions}>
                    {item.status !== 'hidden' && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#fff3e0' }]}
                            onPress={() => handleHide(item.id, item.status)}
                        >
                            <Ionicons name="eye-off-outline" size={18} color="#ef6c00" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#ffebee' }]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#c62828" />
                    </TouchableOpacity>
                </View>
            </View>
            {item.status === 'hidden' && (
                <View style={styles.hiddenBanner}>
                    <Text style={styles.hiddenText}>OCULTO</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Moderación del Foro</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={AppTheme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No hay posts para mostrar.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    hiddenCard: {
        opacity: 0.7,
        backgroundColor: '#f5f5f5',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    content: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 5,
        color: '#999',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hiddenBanner: {
        position: 'absolute',
        top: 10,
        right: 10,
        transform: [{ rotate: '15deg' }],
        borderWidth: 2,
        borderColor: '#c62828',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    hiddenText: {
        color: '#c62828',
        fontWeight: 'bold',
        fontSize: 10
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    }
});

export default AdminForumScreen;

