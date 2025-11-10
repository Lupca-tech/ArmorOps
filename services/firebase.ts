import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDH3vO8nYqF8vK6xH9ZnJ8L5tY3wP4xR2Q",
  authDomain: "armorops-demo.firebaseapp.com",
  projectId: "armorops-demo",
  storageBucket: "armorops-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
