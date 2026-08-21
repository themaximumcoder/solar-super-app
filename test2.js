const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504');
    // We can fetch models using REST or there's no list models in SDK?
    // Let's use fetch.
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504`);
    const data = await res.json();
    console.log(data.models.map(m => m.name));
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
test();
