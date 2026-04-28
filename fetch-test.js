import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

async function fetchSuggestions() {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const app = initializeApp(firebaseConfig);

  const db = getFirestore(app);
  try {
    const querySnapshot = await getDocs(collection(db, 'suggestions'));
    const suggestions = [];
    querySnapshot.forEach((doc) => {
      suggestions.push({ id: doc.id, ...doc.data() });
    });
    fs.writeFileSync('suggestions_dump.json', JSON.stringify(suggestions, null, 2));
    console.log(`Fetched ${suggestions.length} suggestions.`);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
  }
}

fetchSuggestions();
