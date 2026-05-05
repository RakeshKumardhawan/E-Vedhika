import https from 'https';

https.get('https://ais-pre-axnrr2esbqikqoq4pq7cqh-585783354343.asia-southeast1.run.app/?postId=qkQ9PDCxO0myy5l2seda', (res) => {
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
