import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Alert, View } from 'react-native';

export const ViralShareService = {
    /**
     * Captures a React Native View reference as an image and opens the system share sheet.
     * @param viewRef - ref of the View to capture (use useRef)
     * @param fileName - Optional filename (default: resultado-aliado.png)
     */
    shareView: async (viewRef: any, fileName: string = 'resultado-aliado-laboral.png') => {
        try {
            const uri = await captureRef(viewRef, {
                format: 'png',
                quality: 0.8,
                result: 'tmpfile',
            });

            console.log('📸 Image captured at:', uri);

            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert("Error", "Compartir no está disponible en este dispositivo");
                return;
            }

            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Compartir Resultado - Aliado Laboral',
                UTI: 'public.png'
            });

        } catch (error) {
            console.error('❌ Error sharing view:', error);
            Alert.alert("Error", "No se pudo generar la imagen para compartir.");
        }
    }
};
