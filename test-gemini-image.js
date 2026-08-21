const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Create a dummy image buffer (1x1 pixel JPEG)
    const base64Data = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAGBAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8A0s8g/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgBPwB//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AH//2Q==";
    
    const imageParts = [{
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    }];
    
    const result = await model.generateContent(["Describe this image", ...imageParts]);
    console.log("SUCCESS:", result.response.text());
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
test();
