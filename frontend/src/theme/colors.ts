export const colors = {
    primary: '#1e3799', // Deep Royal Blue - Trust & Professionalism
    secondary: '#f6b93b', // Muted Gold - Accent, serious but striking
    background: '#f1f2f6', // Light Gray - Clean background
    cardBackground: '#ffffff',
    text: '#2f3542', // Dark Gray - Readable text
    subText: '#57606f',
    success: '#2ed573',
    error: '#ff4757',
    white: '#ffffff',
    border: '#dfe4ea',
};

const _themeInternal = {
    colors,
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
    borderRadius: {
        s: 8,
        m: 12,
        l: 20,
    },
    shadows: {
        default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },
        hover: {
            shadowColor: '#1e3799',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
        }
    }
};

// 1. Export standard AppTheme
export const AppTheme = _themeInternal;

// 2. Export legacy 'theme' for older files (Aliased to AppTheme)
export const theme = _themeInternal;

// 3. Export default for files using: import theme from '...'
export default _themeInternal;

console.log('🎨 Theme/Colors module loaded');
