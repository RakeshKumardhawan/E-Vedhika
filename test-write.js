import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const fbConfigString = readFileSync('./firebase-applet-config.json', 'utf-8');
const fbConfig = JSON.parse(fbConfigString);

const app = initializeApp(fbConfig);
const db = getFirestore(app);

async function check() {
  const statsRef = doc(db, 'settings', 'site_stats');
  
  try {
    await updateDoc(statsRef, { visitCount: 15420 });
    console.log("Updated via updateDoc");
  } catch(e) {
    console.error("updateDoc failed:", e.message);
  }
  process.exit(0);
}
check();
