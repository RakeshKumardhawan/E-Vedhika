import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const fbConfigString = readFileSync('./firebase-applet-config.json', 'utf-8');
const fbConfig = JSON.parse(fbConfigString);

const app = initializeApp(fbConfig);
const db = getFirestore(app);

async function check() {
  const users = await getDocs(collection(db, 'users'));
  console.log("Total users:", users.size);
  
  await updateDoc(doc(db, 'settings', 'site_stats'), {
    visitCount: 15420
  });
  console.log("Updated visit count to 15420");
  process.exit(0);
}
check();
