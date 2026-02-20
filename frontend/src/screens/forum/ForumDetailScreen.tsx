import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, FlatList, LayoutAnimation, UIManager } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config/constants';

interface Answer {
    id: string;
    content: string;
    upvotes: number;
    createdAt: string;
    parentId: string | null;
    lawyer?: {
        professionalName?: string;
        user: { fullName: string };
    };
    user?: {
        fullName: string;
        role: string;
    };
}

interface PostDetails {
    id: string;
    title: string;
    content: string;
    topic: string;
    createdAt: string;
    answers: Answer[];
}

const ForumDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { postId } = route.params as { postId: string };
    const { user, getAccessToken } = useAuth();

    const [post, setPost] = useState<PostDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // answerId or null (for main post? No, main post reply is new answer)
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);

    // Enable LayoutAnimation
    if (Platform.OS === 'android') {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }

    useEffect(() => {
        fetchDetails();
    }, [postId]);

    const fetchDetails = async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_URL}/forum/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setPost(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cargar el debate.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (answerId: string, value: number) => {
        // Optimistic Update
        setPost(prev => {
            if (!prev) return null;
            const updatedAnswers = prev.answers.map(a => {
                if (a.id === answerId) {
                    return { ...a, upvotes: a.upvotes + value }; // Visual hack, ideally track MyVote
                }
                return a;
            });
            return { ...prev, answers: updatedAnswers };
        });

        try {
            const token = await getAccessToken();
            await axios.post(`${API_URL}/forum/answers/${answerId}/vote`,
                { value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            // Revert? For now just silent fail or log
            console.error('Vote failed', error);
        }
    };

    const handleSendReply = async () => {
        if (!replyContent.trim()) return;

        setSending(true);
        try {
            const token = await getAccessToken();
            // If replyingTo is set, it's a child answer. If null, it's a root answer to the post.
            // But wait, my UI design: "Reply" button on answer sets replyingTo.
            // Input field is generic?

            await axios.post(`${API_URL}/forum/posts/${postId}/answers`,
                {
                    content: replyContent,
                    parentId: replyingTo
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setReplyContent('');
            setReplyingTo(null);
            fetchDetails(); // Refresh to show new comment
        } catch (error: any) {
            Alert.alert('Error', 'No se pudo enviar la respuesta. ' + (error.response?.data?.error || ''));
        } finally {
            setSending(false);
        }
    };

    const renderAnswerItem = (item: Answer, depth: number = 0) => {
        const isLawyer = !!item.lawyer;
        const authorName = isLawyer
            ? (item.lawyer?.professionalName || item.lawyer?.user.fullName || 'Abogado')
            : (item.user?.fullName || 'Usuario');

        return (
            <View key={item.id} style={[styles.answerCard, { marginLeft: depth * 20 }]}>
                <View style={styles.answerHeader}>
                    <View style={styles.authorBadge}>
                        <Ionicons
                            name={isLawyer ? "briefcase" : "person"}
                            size={14}
                            color={isLawyer ? AppTheme.colors.primary : "#666"}
                        />
                        <Text style={[styles.authorName, isLawyer && styles.lawyerName]}>
                            {authorName}
                        </Text>
                        {isLawyer && <Ionicons name="checkmark-circle" size={14} color="#2ecc71" style={{ marginLeft: 4 }} />}
                    </View>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.answerContent}>{item.content}</Text>

                <View style={styles.answerFooter}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleVote(item.id, 1)}>
                            <Ionicons name="thumbs-up-outline" size={16} color="#666" />
                            <Text style={styles.actionText}>{item.upvotes || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => {
                            setReplyingTo(item.id);
                            // Focus input logic could go here
                        }}>
                            <Text style={styles.replyLink}>Responder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    // Recursive rendering or Flat list with pre-processing?
    // Let's do a simple pre-process to order flat list with depth
    // Or just render root answers and have them render children?
    // Current backend returns flat list.
    // I will build a tree.

    const buildTree = (answers: Answer[]) => {
        const map: Record<string, any> = {};
        const roots: any[] = [];
        // Init map
        answers.forEach(a => {
            map[a.id] = { ...a, children: [] };
        });
        // Connect
        answers.forEach(a => {
            if (a.parentId && map[a.parentId]) {
                map[a.parentId].children.push(map[a.id]);
            } else {
                roots.push(map[a.id]);
            }
        });
        return roots;
    };

    const renderTree = (nodes: any[], depth = 0): React.ReactNode => {
        return nodes.map(node => (
            <React.Fragment key={node.id}>
                {renderAnswerItem(node, depth)}
                {node.children && node.children.length > 0 && renderTree(node.children, depth + 1)}
            </React.Fragment>
        ));
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={AppTheme.colors.primary} /></View>;
    }

    if (!post) return <View style={styles.center}><Text>No encontrado</Text></View>;

    const answerTree = buildTree(post.answers);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Debate</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.postContainer}>
                    <View style={styles.topicBadge}>
                        <Text style={styles.topicText}>{post.topic}</Text>
                    </View>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postBody}>{post.content}</Text>
                    <Text style={styles.dateText}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                </View>

                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Respuestas ({post.answers.length})</Text>

                {post.answers.length === 0 ? (
                    <Text style={styles.emptyText}>Sé el primero en responder.</Text>
                ) : (
                    renderTree(answerTree)
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Reply Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={styles.inputContainer}
            >
                {replyingTo && (
                    <View style={styles.replyingBar}>
                        <Text style={styles.replyingText}>Respondiendo a comentario...</Text>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={replyingTo ? "Escribe tu réplica..." : "Escribe una respuesta..."}
                        value={replyContent}
                        onChangeText={setReplyContent}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !replyContent.trim() && styles.disabledSend]}
                        onPress={handleSendReply}
                        disabled={sending || !replyContent.trim()}
                    >
                        {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: AppTheme.colors.primary,
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { marginRight: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 15 },
    postContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    topicBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 10,
    },
    topicText: { color: '#2196f3', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    postTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
    postBody: { fontSize: 16, color: '#34495e', lineHeight: 24, marginBottom: 15 },
    dateText: { fontSize: 12, color: '#999' },
    divider: { height: 1, backgroundColor: '#e0e0e0', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },

    answerCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#e0e0e0', // Default border for nesting visualisation
    },
    answerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    authorBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    authorName: { fontSize: 13, fontWeight: '600', color: '#555' },
    lawyerName: { color: AppTheme.colors.primary },
    answerContent: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 8 },
    answerFooter: { flexDirection: 'row', justifyContent: 'flex-start' },
    actionRow: { flexDirection: 'row', gap: 15 },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { fontSize: 12, color: '#666' },
    replyLink: { fontSize: 12, color: AppTheme.colors.primary, fontWeight: '600' },

    inputContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        padding: 10,
        // paddingBottom: Platform.OS === 'ios' ? 25 : 10, 
    },
    replyingBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 8, backgroundColor: '#f0f2f5', padding: 5, borderRadius: 5 },
    replyingText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    input: {
        flex: 1,
        backgroundColor: '#f5f6fa',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        maxHeight: 100,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: AppTheme.colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSend: { backgroundColor: '#ccc' },
});

export default ForumDetailScreen;

