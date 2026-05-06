import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from './firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
export const storage = getStorage(app);




