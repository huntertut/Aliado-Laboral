import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppTheme } from '../../theme/colors';
import { PRIVACY_NOTICES } from '../../data/legal/privacyNotices';

type PrivacyType = 'WORKER' | 'LAWYER' | 'PYME' | 'GENERAL';

const PrivacyPolicyScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [noticeType, setNoticeType] = useState<PrivacyType>('GENERAL');

    useEffect(() => {
        // Allow passing type via route params
        if ((route.params as any)?.type) {
            setNoticeType((route.params as any).type);
        }
    }, [route.params]);

    const notice = PRIVACY_NOTICES[noticeType];

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Aviso de Privacidad</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    const renderTabs = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
        >
            <TouchableOpacity
                style={[styles.tab, noticeType === 'GENERAL' && styles.activeTab]}
                onPress={() => setNoticeType('GENERAL')}
            >
                <Text style={[styles.tabText, noticeType === 'GENERAL' && styles.activeTabText]}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, noticeType === 'WORKER' && styles.activeTab]}
                onPress={() => setNoticeType('WORKER')}
            >
                <Text style={[styles.tabText, noticeType === 'WORKER' && styles.activeTabText]}>Trabajadores</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, noticeType === 'LAWYER' && styles.activeTab]}
                onPress={() => setNoticeType('LAWYER')}
            >
                <Text style={[styles.tabText, noticeType === 'LAWYER' && styles.activeTabText]}>Abogados</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, noticeType === 'PYME' && styles.activeTab]}
                onPress={() => setNoticeType('PYME')}
            >
                <Text style={[styles.tabText, noticeType === 'PYME' && styles.activeTabText]}>PYMEs</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {renderHeader()}

            {/* Show tabs unless type was strictly enforced? For now, always show to allow exploration */}
            {renderTabs()}

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{notice.title}</Text>
                <Text style={styles.lastUpdate}>Última actualización: {notice.lastUpdate}</Text>

                <View style={styles.divider} />

                {notice.sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionHeading}>{section.heading}</Text>
                        <Text style={styles.sectionText}>{section.content}</Text>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        ¿Tienes dudas? Contáctanos en{'\n'}
                        <Text style={styles.link}>vinculacion@savestudiomx.com</Text>
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    tabsContainer: {
        maxHeight: 50,
        backgroundColor: '#f9f9f9',
    },
    tabsContent: {
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginRight: 10,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#e3f2fd',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: AppTheme.colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    lastUpdate: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginBottom: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    sectionText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 24,
        textAlign: 'justify',
    },
    footer: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#f5f7fa',
        borderRadius: 10,
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        color: '#666',
        lineHeight: 20,
    },
    link: {
        color: AppTheme.colors.primary,
        fontWeight: 'bold',
    },
});

export default PrivacyPolicyScreen;

