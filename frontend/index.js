console.log('🚀 [INDEX.JS] 1. STARTING ROOT EXECUTION');

try {
    const { AppRegistry } = require('react-native');
    console.log('🚀 [INDEX.JS] 2. React Native Loaded');

    const App = require('./App').default;
    console.log('🚀 [INDEX.JS] 3. App Module Loaded');

    AppRegistry.registerComponent('main', () => App);
    console.log('🚀 [INDEX.JS] 4. App Registered as "main"');
} catch (e) {
    console.error('🔥 [INDEX.JS] CRASH DURING INIT:', e);
}
