import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from './firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Use getFirestore. If (default) is provided, we can pass it or nothing.
export const db = getFirestore(app);
export const storage = getStorage(app);
console.log("Firebase App Initialized with storage bucket:", storage.app.options.storageBucket);




