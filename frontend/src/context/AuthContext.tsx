import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/constants';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

interface User {
    id: string; // Keep legacy id for compatibility
    uid: string;
    email: string;
    occupation?: string;
    federalEntity?: string;
    workerProfile?: {
        occupation?: string;
        federalEntity?: string;
    };
    fullName?: string;
    role: 'worker' | 'lawyer' | 'admin' | 'supervisor' | 'accountant' | 'pyme';
    plan?: string; // Business Model Plan
    subscriptionLevel?: 'basic' | 'premium'; // Pyme specific
    profileStatus?: 'incomplete' | 'active' | 'pending'; // For onboarding flow
    assignedLawyerId?: string;
    companyData?: {
        companyName: string;
        rfc?: string;
        industry?: string;
        employeeCount?: string;
        address?: string;
        website?: string;
    };
    workerData?: {
        laborData?: {
            occupation: string | null;
            monthlySalary: number | null;
            startDate: string | null;
            workSchedule: string | null;
            federalEntity: string | null;
        };
        profedetData?: {
            isActive: boolean;
            caseStage: 'initial_advice' | 'conciliation' | 'file_open' | null;
            caseFile: string | null;
            deliveredDocuments: string[];
            notifications: string[];
            visitDates: string[];
        };
    };
    lawyerData?: {
        professionalName: string;
        professionalLicense: string;
        specialty: string;
        experienceYears: number;
        attentionHours: string;
        workStates: string[];
        acceptsPymeClients?: boolean;
        contactInfo: {
            phone: string;
            email: string;
            website?: string;
        };
    };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, role?: string, extraData?: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
    updateProfile: (data: any) => Promise<void>; // New function
    getAccessToken: () => Promise<string | null>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to get the token (refreshing if needed)
    const getAccessToken = async (): Promise<string | null> => {
        try {
            // 1. Try Firebase user first (handles refresh automatically)
            if (auth.currentUser) {
                return await auth.currentUser.getIdToken();
            }
            // 2. Fallback to stored token
            return await AsyncStorage.getItem('authToken');
        } catch (e) {
            console.error('Error getting access token:', e);
            return null;
        }
    };

    // Check for existing token on mount and listen for auth state changes
    // Check for existing token on mount and listen for verify/auth state
    useEffect(() => {
        // Setup Axios Interceptor for 401s
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.warn('[AuthContext] 401/403 Detected - Logging out');
                    await logout();
                }
                return Promise.reject(error);
            }
        );

        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                const userDataStr = await AsyncStorage.getItem('userData');

                if (token && userDataStr) {
                    const localUser = JSON.parse(userDataStr);
                    setUser(localUser);

                    // VERIFY TOKEN WITH BACKEND
                    try {
                        console.log('🔄 [AuthContext] Refreshing user status from backend...');
                        const response = await axios.post(`${API_URL}/auth/verify-token`, { idToken: token }, { timeout: 5000 });
                        const freshUser = response.data.user;

                        // 3.5. DEMO MODE OVERRIDES (PERSIST ON REFRESH)
                        const demoEmail = freshUser.email?.toLowerCase();
                        if (demoEmail === 'worker_free@test.com') {
                            freshUser.role = 'worker';
                            freshUser.plan = undefined;
                        } else if (demoEmail === 'worker_premium@test.com') {
                            freshUser.role = 'worker';
                            freshUser.plan = 'premium';
                        } else if (demoEmail === 'lawyer_basic@test.com') {
                            freshUser.role = 'lawyer';
                            freshUser.plan = 'basic';
                        } else if (demoEmail === 'lawyer_pro@test.com') {
                            freshUser.role = 'lawyer';
                            freshUser.plan = 'pro';
                        } else if (demoEmail === 'pyme_basic@test.com') {
                            freshUser.role = 'pyme';
                            freshUser.subscriptionLevel = 'basic';
                        } else if (demoEmail === 'pyme_premium@test.com') {
                            freshUser.role = 'pyme';
                            freshUser.subscriptionLevel = 'premium';
                        }

                        if (freshUser) {
                            console.log('✅ [AuthContext] User status refreshed:', freshUser.plan);
                            setUser(freshUser);
                            await AsyncStorage.setItem('userData', JSON.stringify(freshUser));
                        }
                    } catch (refreshErr: any) {
                        console.warn('[AuthContext] Token verification failed:', refreshErr.response?.status);

                        // FIX: If backend explicitly rejects token (Invalid Signature/Expired), force logout.
                        // This prevents "Zombie Sessions" where the app thinks it's logged in but backend rejects everything.
                        if (refreshErr.response?.status === 401 || refreshErr.response?.status === 403) {
                            console.warn('[AuthContext] Backend rejected token/session. Forcing local logout.');
                            await logout();
                            return;
                        }

                        // If it's a Network Error or Server Error (500), we keep the session 
                        // and let Firebase try to silent-refresh later.
                    }
                }
            } catch (e) {
                console.error('Error loading user', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();

        // Sync Push Token on Mount/Resume (Ensures token exists even if DB was wiped)
        const syncToken = async () => {
            const tokenStr = await AsyncStorage.getItem('authToken');
            if (tokenStr) {
                import('../services/PushNotificationService').then(async ({ registerForPushNotificationsAsync }) => {
                    const token = await registerForPushNotificationsAsync();
                    if (token) {
                        try {
                            console.log('[AuthContext] 🔄 Auto-Syncing Push Token:', token);
                            await axios.post(`${API_URL}/auth/update-push-token`, { pushToken: token }, {
                                headers: { Authorization: `Bearer ${tokenStr}` }
                            });
                        } catch (tokenErr) {
                            console.error('[AuthContext] Failed to auto-sync push token:', tokenErr);
                        }
                    }
                });
            }
        };
        syncToken();

        // Listen for Firebase Auth state changes
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            // ... (rest of logic same as before, simplified for this snippet context if needed, but keeping existing is fine)
            if (firebaseUser) {
                // ... handled above or via standard firebase flow
            } else {
                // only logout if explicitly needed, but loadUser handles init.
            }
        });

        return () => {
            unsubscribe();
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = async (email: string, password: string) => {
        // isLoading stays false. LoginScreen handles its own loading UI.
        setError(null);
        console.log('[AuthContext] Starting login flow for:', email);
        try {
            // 1. Authenticate with Firebase (using static import)
            console.log('[AuthContext] 1. Calling Firebase signInWithEmailAndPassword...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            console.log('[AuthContext] 1. Firebase login success. User:', firebaseUser.uid);

            // 2. Get Firebase ID token
            console.log('[AuthContext] 2. Getting ID Token...');
            const idToken = await firebaseUser.getIdToken();
            console.log('[AuthContext] 2. Got ID Token.');

            // 3. Send token to backend to get user role and data
            console.log('[AuthContext] 3. Verifying token with backend:', `${API_URL}/auth/verify-token`);
            const response = await axios.post(`${API_URL}/auth/verify-token`, { idToken }, { timeout: 15000 });
            console.log('[AuthContext] 3. Backend response received:', response.status);
            const userData = response.data.user;

            // 3.5. DEMO MODE OVERRIDES (For Testing/Demos)
            const demoEmail = email.toLowerCase();
            if (demoEmail === 'worker_free@test.com') {
                console.log('🚧 [AuthContext] DEMO MODE: Forcing Free Worker');
                userData.role = 'worker';
                userData.plan = undefined; // No plan
            } else if (demoEmail === 'worker_premium@test.com') {
                console.log('🚧 [AuthContext] DEMO MODE: Forcing Premium Worker');
                userData.role = 'worker';
                userData.plan = 'premium';
            } else if (demoEmail === 'lawyer_basic@test.com') {
                console.log('🚧 [AuthContext] DEMO MODE: Forcing Basic Lawyer');
                userData.role = 'lawyer';
                userData.plan = 'basic'; // lawyer_basic
            } else if (demoEmail === 'lawyer_pro@test.com') {
                console.log('🚧 [AuthContext] DEMO MODE: Forcing PRO Lawyer');
                userData.role = 'lawyer';
                userData.plan = 'pro'; // lawyer_pro
            } else if (demoEmail === 'pyme_basic@test.com') {
                console.log('🚧 [AuthContext] DEMO MODE: Forcing Basic Pyme');
                userData.role = 'pyme';
                userData.subscriptionLevel = 'basic';
            } else if (demoEmail === 'pyme_premium@test.com') {
                console.log('🚧 [AuthContext] DEMO MODE: Forcing Premium Pyme');
                userData.role = 'pyme';
                userData.subscriptionLevel = 'premium';
            }

            // 4. Store token and user data
            console.log('[AuthContext] 4. Storing data in Async Storage...');
            await AsyncStorage.setItem('authToken', idToken);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            console.log('[AuthContext] 5. Setting User State inside Context...');
            setUser(userData);

            // 6. Register for Push Notifications
            import('../services/PushNotificationService').then(async ({ registerForPushNotificationsAsync }) => {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    try {
                        console.log('[AuthContext] 6. Syncing Push Token:', token);
                        await axios.post(`${API_URL}/auth/update-push-token`, { pushToken: token }, {
                            headers: { Authorization: `Bearer ${idToken}` }
                        });
                    } catch (tokenErr) {
                        console.error('[AuthContext] Failed to sync push token:', tokenErr);
                    }
                }
            });

            console.log('[AuthContext] Login complete.');
        } catch (e: any) {
            console.error('[AuthContext] Login error:', e);

            let msg = 'Error al iniciar sesión';

            if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
                msg = 'Correo o contraseña incorrectos';
            } else if (e.code === 'auth/invalid-credential') {
                msg = 'Credenciales inválidas';
            } else if (e.code === 'auth/too-many-requests') {
                msg = 'Demasiados intentos. Intenta más tarde';
            } else if (e.response?.data?.error) {
                msg = e.response.data.error;
            } else if (e.message) {
                msg = e.message;
            }

            setError(msg);
            throw new Error(msg);
        }
    };

    interface LawyerData {
        licenseNumber: string;
        specialty?: string;
        nationalScope?: boolean;
        acceptsFederalCases?: boolean;
        acceptsLocalCases?: boolean;
        requiresPhysicalPresence?: boolean;
        acceptsPymeClients?: boolean;
    }

    interface CompanyData {
        companyName: string;
        rfc?: string;
        industry?: string;
    }

    const register = async (email: string, password: string, fullName: string, role?: string, extraData?: LawyerData | CompanyData) => {
        // isLoading stays false
        setError(null);
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email,
                password,
                fullName,
                role,
                ...extraData
            });
            // We do NOT log in automatically. User must verify email or just login manually.
        } catch (e: any) {
            console.error('Register error:', e);

            let msg = e.response?.data?.error || 'Error al registrarse';

            if (e.message === 'Network Error') {
                msg = 'No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté corriendo.';
            } else if (!e.response?.data?.error) {
                msg = `Error: ${e.message} - ${JSON.stringify(e.response?.data || {})}`;
            }

            setError(msg);
            throw new Error(msg);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth); // Clear Firebase Session
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
            setUser(null);
        } catch (e) {
            console.error('Logout failed', e);
        }
    };

    const updateUser = async (data: Partial<User>) => {
        if (!user) return;
        try {
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        } catch (e) {
            console.error('Update user state failed', e);
        }
    };

    const updateProfile = async (data: any) => {
        try {
            const token = await getAccessToken();
            // Assuming authMiddleware is applied on backend route
            const response = await axios.put(`${API_URL}/auth/update-profile`, data, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Sync local state
            await updateUser({ ...data, ...response.data.user });
        } catch (e: any) {
            console.error('Update profile failed:', e);
            throw new Error(e.response?.data?.error || 'Failed to update profile');
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, updateProfile, error, getAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
