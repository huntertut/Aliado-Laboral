import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

type NomView = 'home' | 'test_intro' | 'test_questions' | 'test_results';

const ImssNomScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'imss' | 'nom035'>('nom035');
    const [nomView, setNomView] = useState<NomView>('home');
    const [testAnswers, setTestAnswers] = useState<number[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [activeInfoCard, setActiveInfoCard] = useState<'ats' | 'frps' | 'eof' | null>(null);

    // Enable LayoutAnimation
    if (Platform.OS === 'android') {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }

    const animateTransition = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const changeTab = (tab: 'imss' | 'nom035') => {
        animateTransition();
        setActiveTab(tab);
        if (tab === 'nom035') setNomView('home');
    };

    const changeNomView = (view: NomView) => {
        animateTransition();
        setNomView(view);
    };

    // --- NOM-035 DATA ---
    const questions = [
        {
            id: 1,
            text: "Siento que la cantidad de trabajo o la complejidad de mis tareas excede mi capacidad.",
            type: 'negative'
        },
        {
            id: 2,
            text: "Tengo la libertad y la posibilidad de influir en las decisiones sobre cómo realizo mi trabajo.",
            type: 'positive'
        },
        {
            id: 3,
            text: "Mis jornadas de trabajo son muy largas o frecuentemente tengo que laborar fuera de mi horario, afectando mi descanso.",
            type: 'negative'
        },
        {
            id: 4,
            text: "Recibo reconocimiento, retroalimentación clara y apoyo de mis superiores y compañeros.",
            type: 'positive'
        },
        {
            id: 5,
            text: "He sido testigo o víctima de acoso, hostigamiento, malos tratos o actos de violencia en mi trabajo.",
            type: 'negative'
        },
        {
            id: 6,
            text: "Las responsabilidades de mi trabajo interfieren constantemente con mi vida personal y familiar.",
            type: 'negative'
        }
    ];

    const scaleOptions = [
        { label: 'Siempre', value: 4 },
        { label: 'Casi siempre', value: 3 },
        { label: 'A veces', value: 2 },
        { label: 'Casi nunca', value: 1 },
        { label: 'Nunca', value: 0 }
    ];

    // --- LOGIC ---
    const handleStartTest = () => {
        setTestAnswers([]);
        setCurrentQuestionIndex(0);
        setNomView('test_questions');
    };

    const handleAnswer = (value: number) => {
        const currentQ = questions[currentQuestionIndex];
        // Reverse score for positive questions (High frequency = Low risk)
        // Scale: 4,3,2,1,0. If positive: 0,1,2,3,4.
        // Formula: 4 - value
        const score = currentQ.type === 'positive' ? (4 - value) : value;

        const newAnswers = [...testAnswers, score];
        setTestAnswers(newAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            changeNomView('test_results');
        }
    };

    const calculateRisk = () => {
        const totalScore = testAnswers.reduce((a, b) => a + b, 0);
        // Max score = 24
        if (totalScore < 6) return { level: 'Nulo o Despreciable', color: '#27ae60', message: 'Tu entorno laboral parece saludable. ¡Sigue así!' };
        if (totalScore < 12) return { level: 'Bajo', color: '#f1c40f', message: 'Existen algunos factores de riesgo leves. Es buen momento para prevenir.' };
        if (totalScore < 18) return { level: 'Medio', color: '#e67e22', message: 'Hemos detectado áreas que generan estrés. Te recomendamos tomar medidas.' };
        if (totalScore < 21) return { level: 'Alto', color: '#d35400', message: 'Tu bienestar está en riesgo. Es importante buscar apoyo y cambios.' };
        return { level: 'Muy Alto', color: '#c0392b', message: 'Situación crítica. Necesitas atención inmediata para proteger tu salud.' };
    };

    const openInfoCard = (card: 'ats' | 'frps' | 'eof') => {
        setActiveInfoCard(card);
        setShowInfoModal(true);
    };

    // --- RENDERERS ---

    const renderInfoModal = () => (
        <Modal visible={showInfoModal} animationType="slide" transparent={true} onRequestClose={() => setShowInfoModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {activeInfoCard === 'ats' && 'Acontecimiento Traumático Severo'}
                            {activeInfoCard === 'frps' && 'Factores de Riesgo Psicosocial'}
                            {activeInfoCard === 'eof' && 'Entorno Organizacional Favorable'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {activeInfoCard === 'ats' && (
                            <View>
                                <Text style={styles.modalText}>
                                    Son aquellos eventos experimentados durante o con motivo del trabajo que se caracterizan por la ocurrencia de la muerte o que representan un peligro real para la integridad física de una o varias personas y que pueden generar trastorno de estrés postraumático.
                                </Text>
                                <Text style={styles.modalSubtitle}>Ejemplos:</Text>
                                <View style={styles.bulletPoint}><Ionicons name="flame" size={16} color="#c0392b" /><Text style={styles.bulletText}>Explosiones o incendios</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="alert-circle" size={16} color="#c0392b" /><Text style={styles.bulletText}>Accidentes graves o mortales</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="skull" size={16} color="#c0392b" /><Text style={styles.bulletText}>Asaltos con violencia</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="thunderstorm" size={16} color="#c0392b" /><Text style={styles.bulletText}>Secuestros</Text></View>
                            </View>
                        )}
                        {activeInfoCard === 'frps' && (
                            <View>
                                <Text style={styles.modalText}>
                                    Son aquellos que pueden provocar trastornos de ansiedad, no orgánicos del ciclo sueño-vigilia y de estrés grave y de adaptación, derivado de la naturaleza de las funciones del puesto de trabajo, el tipo de jornada de trabajo y la exposición a acontecimientos traumáticos severos o a actos de violencia laboral al trabajador.
                                </Text>
                                <Text style={styles.modalSubtitle}>Principales Factores:</Text>
                                <View style={styles.bulletPoint}><Ionicons name="time" size={16} color="#e67e22" /><Text style={styles.bulletText}>Jornadas de trabajo extensas</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="hammer" size={16} color="#e67e22" /><Text style={styles.bulletText}>Cargas de trabajo excesivas</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="lock-closed" size={16} color="#e67e22" /><Text style={styles.bulletText}>Falta de control sobre el trabajo</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="people" size={16} color="#e67e22" /><Text style={styles.bulletText}>Liderazgo negativo</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="hand-left" size={16} color="#e67e22" /><Text style={styles.bulletText}>Violencia laboral</Text></View>
                            </View>
                        )}
                        {activeInfoCard === 'eof' && (
                            <View>
                                <Text style={styles.modalText}>
                                    Aquel en el que se promueve el sentido de pertenencia de los trabajadores a la empresa; la formación para la adecuada realización de las tareas encomendadas; la definición precisa de responsabilidades para los trabajadores del centro de trabajo; la participación proactiva y comunicación entre trabajadores; la distribución adecuada de cargas de trabajo, con jornadas de trabajo regulares conforme a la Ley Federal del Trabajo, y la evaluación y el reconocimiento del desempeño.
                                </Text>
                                <Text style={styles.modalSubtitle}>Lo que se debe promover:</Text>
                                <View style={styles.bulletPoint}><Ionicons name="heart" size={16} color="#27ae60" /><Text style={styles.bulletText}>Sentido de pertenencia</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="school" size={16} color="#27ae60" /><Text style={styles.bulletText}>Formación y capacitación</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="chatbubbles" size={16} color="#27ae60" /><Text style={styles.bulletText}>Comunicación efectiva</Text></View>
                                <View style={styles.bulletPoint}><Ionicons name="ribbon" size={16} color="#27ae60" /><Text style={styles.bulletText}>Reconocimiento al desempeño</Text></View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderNomHome = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.introText}>
                La NOM-035 es una norma que busca proteger tu salud mental en el trabajo. Te ayuda a identificar riesgos como el estrés crónico, la carga excesiva de trabajo o la violencia laboral, y promueve ambientes de trabajo saludables y justos.
            </Text>

            <TouchableOpacity style={styles.mainActionButton} onPress={() => changeNomView('test_intro')}>
                <LinearGradient colors={['#6c5ce7', '#a29bfe']} style={styles.mainActionGradient}>
                    <Ionicons name="pulse" size={32} color="#fff" />
                    <Text style={styles.mainActionTitle}>Realizar Mini-Test</Text>
                    <Text style={styles.mainActionSubtitle}>Evalúa tu Bienestar Laboral</Text>
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>Explora los conceptos clave:</Text>

            <TouchableOpacity style={styles.conceptCard} onPress={() => openInfoCard('ats')}>
                <View style={[styles.iconBox, { backgroundColor: '#ffeaa7' }]}>
                    <Ionicons name="flash" size={24} color="#d35400" />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.conceptTitle}>Acontecimiento Traumático</Text>
                    <Text style={styles.conceptSubtitle}>Eventos graves que ponen en peligro tu vida.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.conceptCard} onPress={() => openInfoCard('frps')}>
                <View style={[styles.iconBox, { backgroundColor: '#fab1a0' }]}>
                    <Ionicons name="warning" size={24} color="#c0392b" />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.conceptTitle}>Factores de Riesgo</Text>
                    <Text style={styles.conceptSubtitle}>Elementos que afectan tu salud mental.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.conceptCard} onPress={() => openInfoCard('eof')}>
                <View style={[styles.iconBox, { backgroundColor: '#55efc4' }]}>
                    <Ionicons name="leaf" size={24} color="#00b894" />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.conceptTitle}>Entorno Favorable</Text>
                    <Text style={styles.conceptSubtitle}>Lo que tu empresa debe promover.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>
    );

    const renderTestIntro = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.disclaimerBox}>
                <Ionicons name="information-circle" size={32} color="#2980b9" style={{ marginBottom: 10 }} />
                <Text style={styles.disclaimerTitle}>Importante</Text>
                <Text style={styles.disclaimerText}>
                    Este test es una herramienta de autoevaluación y orientación. Sus resultados son confidenciales y buscan ayudarte a reflexionar sobre tu entorno laboral. No reemplaza un diagnóstico profesional.
                </Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartTest}>
                <Text style={styles.primaryButtonText}>Comenzar Test</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => changeNomView('home')}>
                <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>
        </View>
    );

    const renderTestQuestions = () => {
        const question = questions[currentQuestionIndex];
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.progressBar}>
                    <View style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`, height: '100%', backgroundColor: AppTheme.colors.primary, borderRadius: 5 }} />
                </View>
                <Text style={styles.progressText}>Pregunta {currentQuestionIndex + 1} de {questions.length}</Text>

                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{question.text}</Text>
                </View>

                {scaleOptions.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={styles.optionButton}
                        onPress={() => handleAnswer(option.value)}
                    >
                        <Text style={styles.optionText}>{option.label}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => changeNomView('home')}>
                    <Text style={{ color: '#999' }}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderTestResults = () => {
        const result = calculateRisk();
        return (
            <View style={styles.sectionContainer}>
                <View style={[styles.resultCard, { borderColor: result.color }]}>
                    <Text style={[styles.resultTitle, { color: result.color }]}>Riesgo {result.level}</Text>
                    <Text style={styles.resultMessage}>{result.message}</Text>
                </View>

                <Text style={styles.sectionHeader}>¿Qué puedes hacer?</Text>

                <View style={styles.adviceCard}>
                    <Ionicons name="create-outline" size={24} color="#333" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.adviceTitle}>Identifica y Documenta</Text>
                        <Text style={styles.adviceText}>Anota situaciones específicas, fechas y horas que te generen malestar.</Text>
                    </View>
                </View>
                <View style={styles.adviceCard}>
                    <Ionicons name="chatbubbles-outline" size={24} color="#333" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.adviceTitle}>Busca el Diálogo</Text>
                        <Text style={styles.adviceText}>Si es seguro, habla con tu supervisor o RH de manera asertiva.</Text>
                    </View>
                </View>

                <Text style={styles.sectionHeader}>Apoyo Externo</Text>
                <TouchableOpacity
                    style={styles.externalLinkButton}
                    onPress={() => navigation.navigate('Guides' as never)}
                >
                    <Ionicons name="shield-checkmark" size={24} color="#fff" />
                    <Text style={styles.externalLinkText}>Contactar a PROFEDET</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => changeNomView('home')}>
                    <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderImss = () => (
        <View style={styles.sectionContainer}>
            {/* Intro Card */}
            <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                    <Ionicons name="desktop-outline" size={24} color="#27ae60" />
                    <Text style={styles.cardTitle}>Tu Acceso al IMSS sin Salir de Casa</Text>
                </View>
                <Text style={styles.cardText}>
                    IMSS Digital te permite realizar trámites de forma rápida y segura. Para la mayoría necesitas:
                </Text>
                <View style={{ marginTop: 10 }}>
                    <View style={styles.bulletPoint}><Ionicons name="card-outline" size={16} color="#666" /><Text style={styles.bulletText}>CURP y NSS</Text></View>
                    <View style={styles.bulletPoint}><Ionicons name="mail-outline" size={16} color="#666" /><Text style={styles.bulletText}>Correo electrónico personal</Text></View>
                    <View style={styles.bulletPoint}><Ionicons name="key-outline" size={16} color="#666" /><Text style={styles.bulletText}>FIEL (para trámites avanzados)</Text></View>
                </View>
                <TouchableOpacity
                    style={{ marginTop: 15, padding: 10, backgroundColor: '#e8f6f3', borderRadius: 8, alignItems: 'center' }}
                    onPress={() => Linking.openURL('https://www.imss.gob.mx/imssdigital')}
                >
                    <Text style={{ color: '#27ae60', fontWeight: 'bold' }}>Ir a IMSS Digital</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionHeader}>Accesos Directos</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: '#27ae60' }]}
                    onPress={() => Linking.openURL('https://www.imss.gob.mx/derechoH/semanas-cotizadas')}
                >
                    <Ionicons name="document-text" size={24} color="#fff" />
                    <Text style={styles.quickActionText}>Semanas Cotizadas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: '#3498db' }]}
                    onPress={() => Linking.openURL('https://www.imss.gob.mx/imssdigital')}
                >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.quickActionText}>Vigencia Derechos</Text>
                </TouchableOpacity>
            </View>

            {/* Section 1: Consultas Frecuentes */}
            <Text style={styles.sectionHeader}>1. Consultas y Trámites Frecuentes</Text>

            <TouchableOpacity style={styles.procedureCard} onPress={() => Linking.openURL('http://www.imss.gob.mx/cita-medica')}>
                <View style={styles.procedureHeader}>
                    <Ionicons name="calendar" size={20} color={AppTheme.colors.primary} />
                    <Text style={styles.procedureTitle}>Agendar Cita Médica</Text>
                    <Ionicons name="open-outline" size={16} color="#999" style={{ marginLeft: 'auto' }} />
                </View>
                <Text style={styles.procedureDesc}>Programa una cita para ti o tus beneficiarios.</Text>
                <Text style={styles.procedureReqs}>Requisitos: CURP, NSS, Correo, Vigencia.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.procedureCard} onPress={() => Linking.openURL('https://www.imss.gob.mx/imssdigital')}>
                <View style={styles.procedureHeader}>
                    <Ionicons name="search" size={20} color={AppTheme.colors.primary} />
                    <Text style={styles.procedureTitle}>Asignación de NSS</Text>
                    <Ionicons name="open-outline" size={16} color="#999" style={{ marginLeft: 'auto' }} />
                </View>
                <Text style={styles.procedureDesc}>Obtén o recupera tu Número de Seguridad Social.</Text>
                <Text style={styles.procedureReqs}>Requisitos: CURP, Correo.</Text>
            </TouchableOpacity>

            {/* Section 2: Afiliación */}
            <Text style={styles.sectionHeader}>2. Administra tu Afiliación</Text>

            <TouchableOpacity style={styles.procedureCard} onPress={() => Linking.openURL('https://www.imss.gob.mx/imssdigital')}>
                <View style={styles.procedureHeader}>
                    <Ionicons name="home" size={20} color="#e67e22" />
                    <Text style={styles.procedureTitle}>Alta o Cambio de Clínica</Text>
                    <Ionicons name="open-outline" size={16} color="#999" style={{ marginLeft: 'auto' }} />
                </View>
                <Text style={styles.procedureDesc}>Regístrate en tu clínica o cámbiala por mudanza.</Text>
                <Text style={styles.procedureReqs}>Requisitos: CURP, Código Postal, Correo.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.procedureCard} onPress={() => Linking.openURL('http://www.imss.gob.mx/todos-los-tr%C3%A1mites-servicios-y-prestaciones-5')}>
                <View style={styles.procedureHeader}>
                    <Ionicons name="people" size={20} color="#e67e22" />
                    <Text style={styles.procedureTitle}>Registro de Beneficiarios</Text>
                    <Ionicons name="open-outline" size={16} color="#999" style={{ marginLeft: 'auto' }} />
                </View>
                <Text style={styles.procedureDesc}>Da de alta a tu cónyuge, hijos o padres.</Text>
                <Text style={styles.procedureReqs}>Requisitos: Escritorio Virtual, FIEL, CURPs.</Text>
            </TouchableOpacity>

            {/* Section 3: Futuro */}
            <Text style={styles.sectionHeader}>3. Futuro y Bienestar</Text>

            <TouchableOpacity style={styles.procedureCard} onPress={() => Linking.openURL('https://www.imss.gob.mx/imssdigital')}>
                <View style={styles.procedureHeader}>
                    <Ionicons name="cash" size={20} color="#8e44ad" />
                    <Text style={styles.procedureTitle}>Mi Pensión Digital</Text>
                    <Ionicons name="open-outline" size={16} color="#999" style={{ marginLeft: 'auto' }} />
                </View>
                <Text style={styles.procedureDesc}>Inicia tu trámite de retiro si tienes 60+ años.</Text>
                <Text style={styles.procedureReqs}>Requisitos: CURP, NSS, Correo, CLABE.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.procedureCard} onPress={() => Linking.openURL('https://www.imss.gob.mx/imssdigital')}>
                <View style={styles.procedureHeader}>
                    <Ionicons name="medkit" size={20} color="#8e44ad" />
                    <Text style={styles.procedureTitle}>Incapacidades</Text>
                    <Ionicons name="open-outline" size={16} color="#999" style={{ marginLeft: 'auto' }} />
                </View>
                <Text style={styles.procedureDesc}>Consulta historial y registra cuenta para pagos.</Text>
                <Text style={styles.procedureReqs}>Requisitos: FIEL, CLABE.</Text>
            </TouchableOpacity>

            {/* App Mobile */}
            <TouchableOpacity
                style={[styles.infoCard, { backgroundColor: '#34495e', flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=st.android.imsspublico&hl=es_MX')}
            >
                <Ionicons name="logo-google-playstore" size={32} color="#fff" />
                <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: '#fff', marginLeft: 0 }]}>Descarga IMSS Digital</Text>
                    <Text style={{ color: '#ccc', fontSize: 12 }}>Gestiona tus trámites desde tu celular.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Conclusion */}
            <View style={[styles.infoCard, { backgroundColor: '#e8f6f3', marginTop: 10 }]}>
                <Text style={[styles.cardTitle, { color: '#27ae60', marginLeft: 0, marginBottom: 5 }]}>Ventajas de IMSS Digital</Text>
                <View style={styles.bulletPoint}><Ionicons name="checkmark" size={16} color="#27ae60" /><Text style={styles.bulletText}>Ahorra tiempo y evita filas</Text></View>
                <View style={styles.bulletPoint}><Ionicons name="checkmark" size={16} color="#27ae60" /><Text style={styles.bulletText}>Disponible 24/7</Text></View>
                <View style={styles.bulletPoint}><Ionicons name="checkmark" size={16} color="#27ae60" /><Text style={styles.bulletText}>Documentos con validez oficial</Text></View>
            </View>

            {/* Work Risk Compensation Module Entry */}
            <TouchableOpacity
                style={[styles.infoCard, { backgroundColor: '#fff', marginTop: 15, borderWidth: 1, borderColor: '#FFD700' }]}
                onPress={() => navigation.navigate('Indemnizacion' as never)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#FFF5E6', padding: 10, borderRadius: 10 }}>
                        <Ionicons name="warning" size={28} color="#FFA500" />
                    </View>
                    <View style={{ marginLeft: 15, flex: 1 }}>
                        <Text style={[styles.cardTitle, { marginLeft: 0, color: '#333' }]}>Riesgos de Trabajo</Text>
                        <Text style={{ color: '#666', fontSize: 13 }}>¿Sufriste un accidente? Calcula tu indemnización.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[AppTheme.colors.primary, '#3742fa']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>IMSS y NOM-035</Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'nom035' && styles.activeTab]}
                    onPress={() => changeTab('nom035')}
                >
                    <Text style={[styles.tabText, activeTab === 'nom035' && styles.activeTabText]}>NOM-035</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'imss' && styles.activeTab]}
                    onPress={() => changeTab('imss')}
                >
                    <Text style={[styles.tabText, activeTab === 'imss' && styles.activeTabText]}>IMSS</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'nom035' ? (
                    <>
                        {nomView === 'home' && renderNomHome()}
                        {nomView === 'test_intro' && renderTestIntro()}
                        {nomView === 'test_questions' && renderTestQuestions()}
                        {nomView === 'test_results' && renderTestResults()}
                    </>
                ) : renderImss()}
                <View style={{ height: 30 }} />
            </ScrollView>

            {renderInfoModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: 'rgba(30, 55, 153, 0.1)',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
    },
    activeTabText: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionContainer: {
        flex: 1,
    },
    introText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        marginBottom: 20,
        textAlign: 'justify',
    },
    mainActionButton: {
        marginBottom: 25,
        borderRadius: 15,
        shadowColor: '#6c5ce7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    mainActionGradient: {
        padding: 25,
        borderRadius: 15,
        alignItems: 'center',
    },
    mainActionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
    },
    mainActionSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    conceptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    conceptTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    conceptSubtitle: {
        fontSize: 12,
        color: '#666',
    },
    disclaimerBox: {
        backgroundColor: '#e3f2fd',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 30,
    },
    disclaimerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2980b9',
        marginBottom: 10,
    },
    disclaimerText: {
        fontSize: 14,
        color: '#34495e',
        textAlign: 'center',
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: AppTheme.colors.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        padding: 15,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 10,
    },
    progressText: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginBottom: 20,
    },
    questionCard: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 15,
        marginBottom: 20,
        elevation: 2,
    },
    questionText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        lineHeight: 26,
        fontWeight: '600',
    },
    optionButton: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        color: '#555',
    },
    resultCard: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 2,
        marginBottom: 25,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    adviceCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    adviceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    adviceText: {
        fontSize: 13,
        color: '#666',
    },
    externalLinkButton: {
        flexDirection: 'row',
        backgroundColor: '#27ae60',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    externalLinkText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    modalText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 24,
        marginBottom: 15,
    },
    modalSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginBottom: 10,
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bulletText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
    },
    // IMSS Styles
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    cardText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    actionButton: {
        backgroundColor: '#27ae60',
        borderRadius: 15,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    actionButtonSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        flex: 0.48,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    procedureCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: AppTheme.colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    procedureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    procedureTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    procedureDesc: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
        lineHeight: 20,
    },
    procedureReqs: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
});

export default ImssNomScreen;

