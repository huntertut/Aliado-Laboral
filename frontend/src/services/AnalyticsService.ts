// import analytics from '@react-native-firebase/analytics';
import axios from 'axios';
import { API_URL } from '../config/constants';

// MOCK ANALYTICS FOR EXPO GO
const analytics = () => ({
    logEvent: async (name: string, params: any) => console.log('[Mock Analytics] logEvent:', name, params),
    logScreenView: async (params: any) => console.log('[Mock Analytics] logScreenView:', params),
    setUserId: async (id: any) => console.log('[Mock Analytics] setUserId:', id),
    app: true // Mock property
});

// Define allowed event names to enforce data consistency
type EventName =
    | 'lead_locked_view'        // Abogado ve lead censurado
    | 'lead_unlock_tap'         // Abogado toca para desbloquear
    | 'vault_file_uploaded'     // Trabajador sube archivo
    | 'salary_comparison_view'; // Trabajador ve termómetro

/**
 * Service to handle all Analytics logging.
 * Centralizes logic to easily switch providers or debug.
 */
export const AnalyticsService = {

    /**
     * Log a specific business event.
     * @param name - The name of the event (strictly typed)
     * @param params - Optional extra data (e.g. { screen: 'Lawyers', lawyerId: '123' })
     */
    logEvent: async (name: EventName, params?: Record<string, any>) => {
        try {
            console.log(`📊 [Analytics] Logging: ${name}`, params || '');

            // 1. Firebase (Standard)
            // Check if initialized to avoid crash
            try {
                // Accessing .app might throw if no default app exists
                if (analytics().app) {
                    await analytics().logEvent(name, params);
                }
            } catch (ignore) {
                // Firebase not initialized native-side (missing google-services.json). 
                // Suppress noise.
            }

            // 2. Internal Backend (Private Dashboard)
            // Fire and forget to avoid blocking UI
            // We use a simplified endpoint
            axios.post(`${API_URL}/analytics/events`, {
                event: name,
                metadata: params, // Pass metadata as object, backend should handle JSON
                timestamp: new Date().toISOString()
            }).catch(err => {
                // Silently fail in dev/prod if backend not ready, to not disrupt user flow
                if (__DEV__) console.warn('[Analytics] Backend Log Failed:', err.message);
            });

        } catch (error) {
            console.error(`❌ [Analytics] Failed to log ${name}:`, error);
        }
    },

    /**
     * Log a screen view (standard analytics).
     */
    logScreenView: async (screenName: string, screenClass?: string) => {
        try {
            await analytics().logScreenView({
                screen_name: screenName,
                screen_class: screenClass || screenName,
            });
        } catch (error) {
            console.warn('[Analytics] Failed to set screen:', error);
        }
    },

    /**
     * Identify the user (e.g. after login).
     */
    setUserId: async (userId: string | null) => {
        try {
            await analytics().setUserId(userId);
        } catch (error) {
            console.warn('[Analytics] Failed to set userId:', error);
        }
    }
};
