export interface User {
    id: string;
    email: string;
    role: 'admin' | 'supervisor' | 'accountant';
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
