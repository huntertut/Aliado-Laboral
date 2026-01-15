import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkerLaborDataSection } from './WorkerLaborDataSection';
import { ProfedetModule } from './ProfedetModule';
import { ContactLawyerButton } from './ContactLawyerButton';

interface Props {
    data: any; // Full user profile or just workerData
    onUpdateLaborData: (data: any) => void;
    isSaving: boolean;
}

export const WorkerProfile = ({ data, onUpdateLaborData, isSaving }: Props) => {
    // Determine where data is coming from (handles both flat and nested structures if needed)
    const laborData = data?.workerData?.laborData || {
        fullName: data?.fullName,
        occupation: data?.occupation,
        monthlySalary: data?.monthlySalary,
        federalEntity: data?.federalEntity,
        startDate: data?.startDate,
    };

    const profedetData = data?.workerData?.profedetData || {
        isActive: data?.profedetIsActive
    };

    return (
        <View style={styles.container}>
            <WorkerLaborDataSection
                data={laborData}
                onUpdate={onUpdateLaborData}
                isSaving={isSaving}
            />

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
    }
});
