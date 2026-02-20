import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config/constants';

interface ForumPost {
    id: string;
    topic: string;
    title: string;
    content: string;
    createdAt: string;
    _count: {
        answers: number;
    };
    answers: {
        lawyer: {
            professionalName: string;
        }
    }[];
}

const AnonymousForumScreen = () => {
    const navigation = useNavigation();
    const { user, getAccessToken } = useAuth();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, unanswered

    const fetchPosts = async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/forum/posts`, {
                params: { filter: filter === 'unanswered' ? 'unanswered' : undefined },
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(response.data);
        } catch (error: any) {
            console.error('Error fetching forum posts:', error);
            Alert.alert('Error de Foro', 'No se pudieron cargar posts. ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [filter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    const renderPostItem = ({ item }: { item: ForumPost }) => {
        const hasAnswer = item._count.answers > 0;
        const topAnswerLawyer = hasAnswer ? item.answers[0].lawyer.professionalName : null;

        return (
            <TouchableOpacity
                style={styles.postCard}
                onPress={() => navigation.navigate('ForumDetail', { postId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.postHeader}>
                    <View style={styles.topicBadge}>
                        <Text style={styles.topicText}>{item.topic}</Text>
                    </View>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.postSnippet} numberOfLines={3}>{item.content}</Text>

                <View style={styles.postFooter}>
                    <View style={styles.statsRow}>
                        <Ionicons name="chatbox-outline" size={16} color="#666" />
                        <Text style={styles.statsText}>{item._count.answers} Respuestas</Text>
                    </View>

                    {hasAnswer && (
                        <View style={styles.lawyerBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#2ecc71" />
                            <Text style={styles.lawyerText}>Resp. por {topAnswerLawyer}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Foro Anónimo Laboral</Text>
                    <Text style={styles.headerSubtitle}>Preguntas reales, respuestas de expertos.</Text>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.filterChip, filter === 'all' && styles.activeChip]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>Recientes (7 Días)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filter === 'unanswered' && styles.activeChip]}
                        onPress={() => setFilter('unanswered')}
                    >
                        <Text style={[styles.filterText, filter === 'unanswered' && styles.activeFilterText]}>Sin Respuesta</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Alert Banner */}
            <View style={styles.alertBanner}>
                <Ionicons name="eye-off-outline" size={16} color="#fff" />
                <Text style={styles.alertText}>
                    Las publicaciones desaparecen en 7 días para tu privacidad.
                </Text>
            </View>

            <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Aún no hay preguntas recientes.</Text>
                            <Text style={styles.emptySubText}>Sé el primero en preguntar.</Text>
                        </View>
                    ) : null
                }
            />

            {/* FAB for New Post */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreatePost' as never)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f6f8',
    },
    header: {
        backgroundColor: AppTheme.colors.primary,
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f2f5',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeChip: {
        backgroundColor: 'rgba(46, 134, 222, 0.1)',
        borderColor: AppTheme.colors.primary,
    },
    filterText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '600',
    },
    activeFilterText: {
        color: AppTheme.colors.primary,
    },
    alertBanner: {
        backgroundColor: '#34495e',
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    alertText: {
        color: '#fff',
        fontSize: 11,
    },
    listContent: {
        padding: 15,
    },
    postCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    topicBadge: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    topicText: {
        color: '#2196f3',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    dateText: {
        color: '#999',
        fontSize: 11,
    },
    postTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 6,
        lineHeight: 22,
    },
    postSnippet: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 12,
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsText: {
        fontSize: 12,
        color: '#666',
    },
    lawyerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    lawyerText: {
        fontSize: 11,
        color: '#2ecc71',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
        marginTop: 10,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: AppTheme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});

export default AnonymousForumScreen;

