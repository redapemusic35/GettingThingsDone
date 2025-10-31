// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
