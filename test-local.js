import http from 'http';

http.get('http://localhost:3000/?postId=qkQ9PDCxO0myy5l2seda', (res) => {
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
