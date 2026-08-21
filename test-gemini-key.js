const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
  try {
    const prompt = "What is 1+1?";
    const result = await model.generateContent(prompt);
    console.log("Success:", result.response.text());
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

run();
