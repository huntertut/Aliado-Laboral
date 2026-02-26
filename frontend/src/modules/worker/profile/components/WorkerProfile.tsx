import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../../../theme/colors';

import { WorkerLaborDataSection } from './WorkerLaborDataSection';
import { ProfedetModule } from './ProfedetModule';
import { ContactLawyerButton } from './ContactLawyerButton';
import { JurisdictionFinderModule } from './JurisdictionFinderModule';

interface Props {
    data: any;
    onUpdateLaborData: (data: any) => Promise<boolean>;
    isSaving: boolean;
}

export const WorkerProfile = ({ data, onUpdateLaborData, isSaving }: Props) => {
    const navigation = useNavigation();

    // Safely derive props
    const laborData = data || {};
    const profedetData = data?.profedet || {};

    return (
        <View style={styles.container}>
            <WorkerLaborDataSection
                data={laborData}
                onUpdate={onUpdateLaborData}
                isSaving={isSaving}
            />

            {/* VIRAL THERMOMETER BUTTON */}
            <TouchableOpacity
                style={styles.thermometerButton}
                onPress={() => navigation.navigate('SalaryThermometer' as never)}
            >
                <View style={styles.thermometerContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="flame" size={24} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.thermoTitle}>Termómetro Salarial</Text>
                        <Text style={styles.thermoSubtitle}>¿Ganas menos que el promedio?</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>

            <JurisdictionFinderModule laborData={laborData} />

            <ProfedetModule isActive={!!profedetData.isActive} />

            <ContactLawyerButton
                laborData={laborData}
                profedetIsActive={!!profedetData.isActive}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    thermometerButton: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    thermometerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        backgroundColor: '#FF4B2B', // Viral Red
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    thermoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    thermoSubtitle: {
        fontSize: 12,
        color: '#e74c3c',
        fontWeight: '600'
    }
});

