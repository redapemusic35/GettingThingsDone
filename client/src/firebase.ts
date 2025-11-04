// client/src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// REPLACE WITH YOUR CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyCYY9dRbxjCELG3Awms5xuTgSW0_WfN9aM",
  authDomain: "clear-mind-411315.firebaseapp.com",
  databaseURL: "https://clear-mind-411315-default-rtdb.firebaseio.com",
  projectId: "clear-mind-411315",
  storageBucket: "clear-mind-411315.firebasestorage.app",
  messagingSenderId: "234170931984",
  appId: "1:234170931984:web:1f41688674fed56c05e395",
  measurementId: "G-7WMNQFLGD3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('Firebase initialized in client/src');
