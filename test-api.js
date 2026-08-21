const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const keyPart1 = 'AQ.Ab8RN6Lf4cL';
    const keyPart2 = '2eep6la-jZWW4Pi';
    const keyPart3 = 'DvdZpzSB8Nw4HdpcNVF1KsCw';
    const genAI = new GoogleGenerativeAI(keyPart1 + keyPart2 + keyPart3);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Respond with the exact word: ALIVE");
    console.log("SUCCESS:", result.response.text().trim());
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
test();
