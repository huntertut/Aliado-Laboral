import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COMMON_PROBLEMS } from '../data/problems';

const ProblemDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { problemId } = route.params as { problemId: string };

    // Find the problem by ID
    const problem = COMMON_PROBLEMS.find(p => p.id === problemId);

    if (!problem) {
        return (
            <View style={styles.container}>
                <Text>Problema no encontrado</Text>
            </View>
        );
    }

    const renderIcon = (icon: any) => {
        if (typeof icon === 'string') {
            return <Text style={styles.headerIcon}>{icon}</Text>;
        } else if (icon.type === 'image') {
            return <Image source={icon.value} style={styles.headerIconImage} />;
        }
        return null;
    };

    const navigateToModule = (targetModule: string) => {
        navigation.navigate(targetModule as never);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonAbsolute}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                {renderIcon(problem.icon)}
                <Text style={styles.headerTitle}>{problem.title}</Text>
            </LinearGradient>

            {/* Description Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={24} color="#667eea" />
                    <Text style={styles.sectionTitle}>¿Qué es?</Text>
                </View>
                <Text style={styles.descriptionText}>{problem.description}</Text>
            </View>

            {/* How To Know Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                    <Text style={styles.sectionTitle}>{problem.howToKnowTitle}</Text>
                </View>
                <View style={styles.pointsContainer}>
                    {problem.howToKnowPoints.map((point, index) => (
                        <View key={index} style={styles.pointRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.pointText}>{point}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* What To Do Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={24} color="#e74c3c" />
                    <Text style={styles.sectionTitle}>{problem.whatToDoTitle}</Text>
                </View>
                <View style={styles.actionPointsContainer}>
                    {problem.whatToDoPoints.map((point, index) => (
                        <View key={index} style={styles.actionPointRow}>
                            <View style={styles.actionNumberContainer}>
                                <Text style={styles.actionNumber}>{index + 1}</Text>
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>{point.action}</Text>
                                <Text style={styles.actionDetail}>{point.detail}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Next Steps Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="arrow-forward-circle" size={24} color="#f39c12" />
                    <Text style={styles.sectionTitle}>{problem.nextStepsTitle}</Text>
                </View>
                <View style={styles.nextStepsContainer}>
                    {problem.nextSteps.map((step, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.nextStepCard}
                            onPress={() => navigateToModule(step.targetModule)}
                        >
                            <View style={styles.nextStepContent}>
                                <Text style={styles.nextStepAction}>{step.action}</Text>
                                <Text style={styles.nextStepDetail}>{step.detail}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#667eea" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Bottom Padding */}
            <View style={{ height: 30 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        padding: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 50, // Added padding for status bar
    },
    backButtonAbsolute: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        padding: 5,
    },
    headerIcon: {
        fontSize: 60,
        marginBottom: 15,
    },
    headerIconImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    section: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F3640',
        marginLeft: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    pointsContainer: {
        marginTop: 5,
    },
    pointRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    bullet: {
        fontSize: 16,
        color: '#27ae60',
        marginRight: 10,
        fontWeight: 'bold',
    },
    pointText: {
        flex: 1,
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    actionPointsContainer: {
        marginTop: 5,
    },
    actionPointRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    actionNumberContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2F3640',
        marginBottom: 3,
    },
    actionDetail: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    nextStepsContainer: {
        marginTop: 5,
    },
    nextStepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
    },
    nextStepContent: {
        flex: 1,
    },
    nextStepAction: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2F3640',
        marginBottom: 4,
    },
    nextStepDetail: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
});

export default ProblemDetailScreen;
