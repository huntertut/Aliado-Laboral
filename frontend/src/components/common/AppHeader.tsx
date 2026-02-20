/* Propiedad Intelectual de Misael Morales Urbano - Mente Maestra de CIBERT. Prohibida su reproducción o reclamo de autoría por terceros. (c) 2026 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, TouchableWithoutFeedback } from 'react-native';


import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../../theme/colors';

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onBack?: () => void;
    gradient?: string[];
    backgroundColor?: string;
    rightElement?: React.ReactNode;
    titleAlign?: 'left' | 'center' | 'right';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    subtitle,
    showBackButton = true,
    onBack,
    gradient,
    backgroundColor,
    rightElement,
    titleAlign = 'left'
}) => {
    const navigation = useNavigation();
    const [eggCount, setEggCount] = useState(0);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigation.goBack();
        }
    };

    const handleEggTap = () => {
        const newCount = eggCount + 1;
        setEggCount(newCount);
        console.log(`🥚 Egg Count: ${newCount}`);

        if (newCount === 7) {
            Alert.alert(
                "Certificado de Autoría",
                "Sistema diseñado y desarrollado íntegramente por Misael Morales Urbano",
                [{ text: "OK", onPress: () => setEggCount(0) }]
            );
        }
    };

    const headerContent = (
        <View style={styles.container}>
            <StatusBar
                barStyle={gradient || backgroundColor ? "light-content" : "dark-content"}
                backgroundColor="transparent"
                translucent
            />

            {/* Main Row: Back Button + Title + Right Element */}
            <View style={styles.mainRow}>
                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                        accessibilityLabel="Regresar"
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                )}

                <TouchableWithoutFeedback onPress={handleEggTap}>
                    <View style={[
                        styles.titleContainer,
                        !showBackButton && styles.titleContainerNoBack,
                        titleAlign === 'center' && styles.titleContainerCenter
                    ]}>
                        <Text
                            style={styles.title}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {title}
                        </Text>

                        {subtitle && (
                            <Text
                                style={styles.subtitle}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {subtitle}
                            </Text>
                        )}
                    </View>
                </TouchableWithoutFeedback>

                {rightElement && (
                    <View style={styles.rightElement}>
                        {rightElement}
                    </View>
                )}
            </View>
        </View>
    );

    // Render with gradient or solid background
    if (gradient && gradient.length >= 2) {
        return (
            <LinearGradient colors={gradient as any} style={styles.gradientWrapper}>
                {headerContent}
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.solidWrapper, backgroundColor && { backgroundColor }]}>
            {headerContent}
        </View>
    );
};

const styles = StyleSheet.create({
    gradientWrapper: {
        paddingTop: StatusBar.currentHeight || 40,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    solidWrapper: {
        paddingTop: StatusBar.currentHeight || 40,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: AppTheme.colors.primary,
    },
    container: {
        // Container is just for content, padding comes from wrapper
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40, // Ensure sufficient touch target
    },
    backButton: {
        marginRight: 16,
        padding: 4, // Extra touch area
        marginLeft: -4, // Compensate padding for visual alignment
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    titleContainerNoBack: {
        marginLeft: 0,
    },
    titleContainerCenter: {
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 28,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
        lineHeight: 18,
    },
    rightElement: {
        marginLeft: 12,
        padding: 4,
    },
});

export default AppHeader;

