import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, LayoutAnimation, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BENEFITS_DATA, PrestacionDeLey } from '../data/benefits';
import { AppTheme } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/common/AppHeader';

const BenefitsScreen = () => {
    const navigation = useNavigation<any>();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Enable LayoutAnimation on Android
    React.useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleAction = (benefit: PrestacionDeLey) => {
        if (benefit.calculatorId) {
            navigation.navigate('RightsCalculator' as never, { calculatorId: benefit.calculatorId } as never);
        } else if (benefit.id === 'imss') {
            navigation.navigate('ImssNom' as never);
        } else if (benefit.relatedGuideId) {
            navigation.navigate('WorkerRights' as never);
        } else if (benefit.whatIfIDontGetIt.relatedProblemId) {
            navigation.navigate('ProblemDetail' as never, { problemId: benefit.whatIfIDontGetIt.relatedProblemId } as never);
        }
    };

    const renderBenefitItem = ({ item }: { item: PrestacionDeLey }) => (
        <BenefitCard
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => toggleExpand(item.id)}
            onAction={handleAction}
        />
    );

    return (
        <View style={styles.container}>
            <AppHeader
                title="Prestaciones de Ley"
                subtitle="Tus 10 derechos laborales básicos"
                gradient={[AppTheme.colors.primary, '#3742fa']}
            />

            <FlatList
                data={BENEFITS_DATA}
                keyExtractor={(item) => item.id}
                renderItem={renderBenefitItem}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 40 }} />}
            />
        </View>
    );
};

// Extracted Component for Stability
const BenefitCard = ({ item, isExpanded, onToggle, onAction }: {
    item: PrestacionDeLey,
    isExpanded: boolean,
    onToggle: () => void,
    onAction: (item: PrestacionDeLey) => void
}) => {
    return (
        <View style={styles.card}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onToggle}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer]}>
                        <Ionicons name={item.icon as any} size={28} color={AppTheme.colors.primary} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#bdc3c7"
                    />
                </View>
            </TouchableOpacity>

            <Text style={styles.cardDescription} numberOfLines={isExpanded ? undefined : 2}>
                {item.description}
            </Text>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Puntos Clave:</Text>
                    {item.keyInfo.map((point, index) => (
                        <View key={index} style={styles.bulletPoint}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#27ae60" style={{ marginTop: 2 }} />
                            <Text style={styles.bulletText}>{point}</Text>
                        </View>
                    ))}

                    <View style={styles.alertBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <Ionicons name="warning-outline" size={18} color="#e74c3c" />
                            <Text style={styles.alertTitle}> {item.whatIfIDontGetIt.title}</Text>
                        </View>
                        <Text style={styles.alertDesc}>{item.whatIfIDontGetIt.description}</Text>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onAction(item)}
                        >
                            <Text style={styles.actionButtonText}>
                                {item.calculatorId ? (item.id === 'infonavit' ? "Consultar mi situación" : "Calcular cuánto me toca") :
                                    item.id === 'imss' ? "Ver módulo IMSS" :
                                        item.relatedGuideId ? "Ver Guía / Checklist" :
                                            "Ver qué hacer"}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    backButton: { marginRight: 15 },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        ...AppTheme.shadows.default
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#F0F3FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    cardDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        lineHeight: 22,
        marginBottom: 5
    },
    expandedContent: {
        marginTop: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f2f6',
        marginVertical: 15
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 10
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingRight: 10
    },
    bulletText: {
        fontSize: 14,
        color: '#57606f',
        marginLeft: 8,
        lineHeight: 20,
        flex: 1
    },
    alertBox: {
        backgroundColor: '#FFF5F5',
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#e74c3c'
    },
    alertTitle: {
        fontWeight: 'bold',
        color: '#c0392b',
        fontSize: 14
    },
    alertDesc: {
        fontSize: 13,
        color: '#c0392b',
        marginBottom: 15,
        lineHeight: 18
    },
    actionButton: {
        backgroundColor: AppTheme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start'
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 8
    }
});

export default BenefitsScreen;
