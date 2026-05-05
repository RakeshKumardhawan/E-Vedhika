import https from 'https';

https.get('https://e-vedhika.onrender.com/?postId=qkQ9PDCxO0myy5l2seda', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.error("Error:", err.message);
});
