const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello world");
    console.log("SUCCESS:", result.response.text());
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
test();
