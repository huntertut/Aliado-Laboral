import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COMMON_PROBLEMS } from '../data/problems';

const ProblemsScreen = () => {
    const navigation = useNavigation<any>();

    const renderIcon = (icon: any) => {
        if (typeof icon === 'string') {
            // Emoji
            return <Text style={styles.icon}>{icon}</Text>;
        } else if (icon.type === 'image') {
            // Image
            return <Image source={icon.value} style={styles.iconImage} />;
        }
        return null;
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2F3640" />
                </TouchableOpacity>
                <Text style={styles.header}>Problemas Comunes</Text>
            </View>
            <Text style={styles.subHeader}>Selecciona una situación para saber qué hacer</Text>

            <FlatList
                data={COMMON_PROBLEMS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('ProblemDetail', { problemId: item.id } as never)}
                    >
                        <View style={styles.iconContainer}>
                            {renderIcon(item.icon)}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description} numberOfLines={2}>
                                {item.description}
                            </Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F6FA',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F3640',
    },
    subHeader: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e1f5fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    icon: {
        fontSize: 24,
    },
    iconImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
        color: '#777',
    },
    arrow: {
        fontSize: 24,
        color: '#ccc',
        marginLeft: 10,
    },
});

export default ProblemsScreen;
