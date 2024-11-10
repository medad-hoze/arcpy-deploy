import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDdzBZXdCvnGbzatGfc47co58RNc7h6GSQ",
    authDomain: "geomai21.firebaseapp.com",
    databaseURL: "https://geomai21-default-rtdb.firebaseio.com",
    projectId: "geomai21",
    storageBucket: "geomai21.firebasestorage.app",
    messagingSenderId: "897053614981",
    appId: "1:897053614981:web:5c99107fc80fbcab881aec",
    measurementId: "G-FBRB6WPJF9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);