import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const fbConfigString = readFileSync('./firebase-applet-config.json', 'utf-8');
const fbConfig = JSON.parse(fbConfigString);

const app = initializeApp(fbConfig);
const db = getFirestore(app);

async function check() {
  const d = await getDoc(doc(db, 'settings', 'site_stats'));
  console.log("Stats data:", d.data());
  process.exit(0);
}
check();
