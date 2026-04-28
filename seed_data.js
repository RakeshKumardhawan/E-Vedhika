
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function seed() {
  try {
    const data = JSON.parse(fs.readFileSync('./suggestions_dump.json', 'utf8'));
    console.log(`Found ${data.length} records to seed.`);
    
    for (const item of data) {
      const id = item.id;
      delete item.id;
      
      // Ensure specific fields exist for rendering
      // App looks for s.text || s.suggestion || s.msg
      // Our dump has item.content
      const seededItem = {
        ...item,
        text: item.content || item.text || item.suggestion || '',
        name: item.userType === 'admin' ? 'E-Vedhika Admin' : 'Portal User',
        time: item.time ? Number(item.time) : Date.now(),
        status: 'Approved' // Force approved so they show up for users
      };
      
      await setDoc(doc(db, 'suggestions', id), seededItem);
      console.log(`Seeded to suggestions: ${id}`);
    }
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

seed();
