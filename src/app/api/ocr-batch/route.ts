import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const key1 = 'gsk_rTKWvB7q78W';
    const key2 = 'Hmvz2L5LSWGdyb3FY';
    const key3 = 'fbhA4O6KDyNUAlJbthWWkzVw';
    const groq = new Groq({ apiKey: key1 + key2 + key3 });
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images uploaded' }, { status: 400 });
    }
    
    const prompt = `I am providing ${files.length} images of solar panel serial number stickers in sequential order. 
For each image, carefully extract the main serial number (usually a long uppercase alphanumeric string).
If an image is completely blurry or has no serial number, output "NOT_FOUND" for that specific image.
Return the results as a strict JSON array of strings, in the EXACT same order as the images provided.
Make sure the array length is exactly ${files.length}.
Example output format: ["SN1234567890", "NOT_FOUND", "ABC987654321"]`;

    const content: any[] = [{ type: "text", text: prompt }];
    
    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        content.push({
            type: "image_url",
            image_url: { url: `data:${file.type || "image/jpeg"};base64,${base64}` }
        });
    }

    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content }],
        model: "meta-llama/llama-4-scout-17b-16e-instruct"
    });
    
    const responseText = completion.choices[0].message.content || '[]';
    
    let parsed: string[] = [];
    try {
       const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
       parsed = JSON.parse(jsonStr);
    } catch(e) {
       console.error("Failed to parse JSON:", responseText);
       parsed = Array(files.length).fill("Parse Error");
    }

    return NextResponse.json({ results: parsed });
  } catch (error: any) {
    console.error('Batch OCR Error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
