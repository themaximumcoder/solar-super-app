const https = require('https');

const key = 'INVALID_KEY';

// Test Gemini
const geminiReq = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Gemini:', data));
});
geminiReq.write(JSON.stringify({
  contents: [{ parts: [{ text: "Hello" }] }]
}));
geminiReq.end();
