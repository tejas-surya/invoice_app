import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqtV5QJG1KoiaKxegeL_FJ_M42AmzMfak",
  authDomain: "invoice-application-7cadd.firebaseapp.com",
  projectId: "invoice-application-7cadd",
  storageBucket: "invoice-application-7cadd.firebasestorage.app",
  messagingSenderId: "784413136937",
  appId: "1:784413136937:web:c26963082370fbcb202438",
  measurementId: "G-G8VXHB4V51"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage(app);
export const db = getFirestore(app);
