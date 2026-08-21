const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504');
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504");
    const data = await response.json();
    const names = data.models.map(m => m.name);
    console.log("MODELS:", names.filter(n => n.includes('flash')));
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
