import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBDk6mK-NsJYMtimdtu75B2WBc4xCsi504');
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images uploaded' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imageParts = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return {
            inlineData: {
                data: Buffer.from(arrayBuffer).toString("base64"),
                mimeType: file.type || "image/jpeg"
            }
        };
    }));

    const prompt = `I am providing ${files.length} images of solar panel serial number stickers in sequential order. 
For each image, carefully extract the main serial number (usually a long uppercase alphanumeric string).
If an image is completely blurry or has no serial number, output "NOT_FOUND" for that specific image.
Return the results as a strict JSON array of strings, in the EXACT same order as the images provided.
Make sure the array length is exactly ${files.length}.
Example output format: ["SN1234567890", "NOT_FOUND", "ABC987654321"]`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    let parsed: string[] = [];
    try {
       const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
       parsed = JSON.parse(jsonStr);
    } catch(e) {
       console.error("Failed to parse Gemini JSON:", responseText);
       parsed = Array(files.length).fill("Parse Error");
    }

    return NextResponse.json({ results: parsed });
  } catch (error: any) {
    console.error('Batch OCR Error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
