export type SubscriptionLevel = 'basic' | 'premium';

export const AccessControlService = {
    /**
     * Verifica si una Pyme puede utilizar el chat con su abogado asignado
     */
    canUseChat: (level: SubscriptionLevel = 'basic') => {
        return level === 'premium';
    },

    /**
     * Verifica si una Pyme puede descargar PDFs validados con sello legal
     */
    canDownloadValidatedPDF: (level: SubscriptionLevel = 'basic') => {
        return level === 'premium';
    },

    /**
     * Verifica si una Pyme puede guardar sus cálculos de liquidación
     */
    canSaveCalculations: (level: SubscriptionLevel = 'basic') => {
        return level === 'premium';
    },

    /**
     * Verifica si una Pyme puede recibir alertas detalladas (vencimientos, IMSS, etc.)
     */
    canReceiveDetailedAlerts: (level: SubscriptionLevel = 'basic') => {
        return level === 'premium';
    },

    /**
     * Para el plan básico, solo se permite ver el cálculo en pantalla
     */
    canViewOnlineCalculations: (level: SubscriptionLevel = 'basic') => {
        return true; // Siempre disponible
    }
};
