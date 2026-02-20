import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCxl4mxWFDHXKTczJuWh2Hu8N0JeIPeDe0",
  authDomain: "derecholaboralmx-1180f.firebaseapp.com",
  projectId: "derecholaboralmx-1180f",
  storageBucket: "derecholaboralmx-1180f.firebasestorage.app",
  messagingSenderId: "603795386864",
  appId: "1:603795386864:web:252170fc294e890e78ed35",
  measurementId: "G-0VFH1CCWQ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth, app, firebaseConfig };
