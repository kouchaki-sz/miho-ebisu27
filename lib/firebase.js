import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDq8Gv2yEPmmmkMTzYDNZmGH9U8_NHFvzo",
  authDomain: "miho-ebisu27.firebaseapp.com",
  projectId: "miho-ebisu27",
  storageBucket: "miho-ebisu27.firebasestorage.app",
  messagingSenderId: "539872813468",
  appId: "1:539872813468:web:9c74f4e495c0fa9ce96859"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);