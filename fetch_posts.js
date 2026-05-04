import fs from 'fs';
fetch('https://firestore.googleapis.com/v1/projects/e-vedhika-258f2/databases/(default)/documents/posts')
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('posts_data.json', JSON.stringify(data, null, 2));
    console.log('done');
  })
  .catch(err => console.error(err));
