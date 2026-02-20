import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RIGHTS_CALCULATORS, RIGHTS_CHECKLIST, RIGHTS_GUIDES, DerechoPanelGuide } from '../data/rightsPanelData';
import { AppTheme } from '../theme/colors';
import Markdown from 'react-native-markdown-display';

const WorkerRightsScreen = () => {
    const navigation = useNavigation() as any;
    const [selectedGuide, setSelectedGuide] = useState<DerechoPanelGuide | null>(null);

    const handleCalculatorPress = (calculatorId: string) => {
        if (calculatorId === 'calculadora-finiquito-link') {
            navigation.navigate('Calculator');
        } else {
            navigation.navigate('RightsCalculator', { calculatorId });
        }
    };

    const handleProblemPress = (problemId?: string) => {
        if (problemId) {
            navigation.navigate('ProblemDetail' as never, { problemId } as never);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#2c3e50" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Mi Panel de Derechos</Text>
                        <Text style={styles.headerSubtitle}>Herramientas, guías y autoevaluación</Text>
                    </View>
                </View>

                {/* SECTION 1: CALCULATORS */}
                <Text style={styles.sectionTitle}>Calculadoras Laborales</Text>

                {/* Existing Finiquito Link */}
                <TouchableOpacity
                    style={[styles.card, styles.calculatorCard]}
                    onPress={() => handleCalculatorPress('calculadora-finiquito-link')}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#e1f5fe' }]}>
                        <Ionicons name="calculator" size={24} color="#0288d1" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Calculadora de Finiquito</Text>
                        <Text style={styles.cardDesc}>Calcula cuánto te deben si renuncias o te despiden.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* New Calculators */}
                {RIGHTS_CALCULATORS.map((calc) => (
                    <TouchableOpacity
                        key={calc.id}
                        style={[styles.card, styles.calculatorCard]}
                        onPress={() => handleCalculatorPress(calc.id)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name={calc.icon as any} size={24} color="#2e7d32" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{calc.title}</Text>
                            <Text style={styles.cardDesc}>{calc.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ))}

                {/* SECTION 2: GUIDES */}
                <Text style={styles.sectionTitle}>Guías Rápidas</Text>
                <View style={styles.guidesContainer}>
                    {/* Manual Link to IMSS Module */}
                    <TouchableOpacity
                        style={styles.guideCard}
                        onPress={() => navigation.navigate('ImssNom' as never)}
                    >
                        <LinearGradient
                            colors={['#4facfe', '#00f2fe']}
                            style={styles.guideGradient}
                        >
                            <Ionicons name="medkit" size={30} color="#fff" />
                            <Text style={styles.guideTitle}>Módulo IMSS</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {RIGHTS_GUIDES.map((guide) => (
                        <TouchableOpacity
                            key={guide.id}
                            style={styles.guideCard}
                            onPress={() => setSelectedGuide(guide)}
                        >
                            <LinearGradient
                                colors={['#a18cd1', '#fbc2eb']}
                                style={styles.guideGradient}
                            >
                                <Ionicons name={guide.icon as any} size={30} color="#fff" />
                                <Text style={styles.guideTitle}>{guide.title}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* SECTION 3: CHECKLIST */}
                <Text style={styles.sectionTitle}>Checklist de Derechos Fundamentales</Text>
                <View style={styles.checklistContainer}>
                    {RIGHTS_CHECKLIST.map((item) => (
                        <View key={item.id} style={styles.checklistItem}>
                            <View style={styles.checklistIcon}>
                                <Ionicons name={item.icon as any} size={20} color="#555" />
                            </View>
                            <View style={styles.checklistContent}>
                                <Text style={styles.checklistTitle}>{item.title}</Text>
                                <Text style={styles.checklistQuestion}>{item.userQuestion}</Text>
                            </View>
                            <View style={styles.checklistActions}>
                                <TouchableOpacity style={styles.checkBtn}>
                                    <Ionicons name="checkmark" size={20} color="#27ae60" />
                                </TouchableOpacity>
                                {item.relatedProblemId && (
                                    <TouchableOpacity
                                        style={styles.problemBtn}
                                        onPress={() => handleProblemPress(item.relatedProblemId)}
                                    >
                                        <Ionicons name="alert-circle" size={20} color="#e74c3c" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* GUIDE MODAL - MOVED OUTSIDE SCROLLVIEW */}
            <Modal
                visible={!!selectedGuide}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedGuide(null)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{selectedGuide?.title}</Text>
                        <TouchableOpacity onPress={() => setSelectedGuide(null)}>
                            <Ionicons name="close-circle" size={30} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        {selectedGuide && (
                            <Markdown style={markdownStyles}>
                                {selectedGuide.content}
                            </Markdown>
                        )}

                        {/* Special Actions for Guides */}
                        {(selectedGuide?.id === 'guia-rapida-infonavit' || selectedGuide?.id === 'guia-rapida-fonacot') && (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: AppTheme.colors.primary,
                                    borderRadius: 12,
                                    padding: 18,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 20,
                                    ...AppTheme.shadows.default
                                }}
                                onPress={() => {
                                    const calcId = selectedGuide.id === 'guia-rapida-infonavit'
                                        ? 'herramienta-consulta-infonavit'
                                        : 'herramienta-consulta-fonacot';
                                    setSelectedGuide(null);
                                    navigation.navigate('RightsCalculator', { calculatorId: calcId });
                                }}
                            >
                                <Ionicons name="search-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                                    {selectedGuide.id === 'guia-rapida-infonavit' ? 'Abrir Consultor INFONAVIT' : 'Verificar mi elegibilidad FONACOT'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ height: 50 }} />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    content: {
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginTop: 10,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        ...AppTheme.shadows.default,
    },
    calculatorCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#2e7d32',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cardDesc: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    guidesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    guideCard: {
        width: '48%', // Two columns
        height: 100,
        marginBottom: 15,
        borderRadius: 12,
        overflow: 'hidden',
        ...AppTheme.shadows.default,
    },
    guideGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    guideTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    checklistContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        ...AppTheme.shadows.default,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    checklistIcon: {
        width: 30,
        alignItems: 'center',
    },
    checklistContent: {
        flex: 1,
        paddingHorizontal: 10,
    },
    checklistTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    checklistQuestion: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    checklistActions: {
        flexDirection: 'row',
    },
    checkBtn: {
        padding: 5,
        marginRight: 5,
    },
    problemBtn: {
        padding: 5,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        width: '85%',
    },
    modalContent: {
        padding: 20,
    }
});

const markdownStyles = StyleSheet.create({
    heading1: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10, marginTop: 10 },
    heading2: { fontSize: 20, fontWeight: 'bold', color: '#34495e', marginBottom: 8, marginTop: 15 },
    body: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 10 },
    list_item: { marginBottom: 5 },
});

export default WorkerRightsScreen;

