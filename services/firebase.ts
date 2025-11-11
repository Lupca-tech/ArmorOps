// Fix: Use firebase v9 compat library to resolve module export errors for initializeApp, getAuth, etc.
import firebase from "firebase/compat/app";
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9gZIKroNlQCySWPnuQOybrdaHv2iZy5E",
  authDomain: "armorops.tech",
  projectId: "armorops-aicheck",
  storageBucket: "armorops-aicheck.firebasestorage.app",
  messagingSenderId: "68675922203",
  appId: "1:68675922203:web:4f6d32b9286a23bad00bbe",
  measurementId: "G-T0TC7KHS22"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export the instances to be used in other parts of the app
export const auth = firebase.auth();
export const db = firebase.firestore();