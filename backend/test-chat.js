const http = require('http');

const data = JSON.stringify({
    session_id: "test_session_123",
    message: "Hi there!",
    sender: "user",
    country: "local_test"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending test request to http://localhost:5000/api/chat...');

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('--- RESPONSE RECEIVED ---');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error('--- REQUEST FAILED ---');
    console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
