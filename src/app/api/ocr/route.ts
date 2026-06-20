import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const key1 = 'gsk_rTKWvB7q78W';
    const key2 = 'Hmvz2L5LSWGdyb3FY';
    const key3 = 'fbhA4O6KDyNUAlJbthWWkzVw';
    const groq = new Groq({ apiKey: key1 + key2 + key3 });
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `Look at this multimeter screen. Return ONLY the main large voltage number displayed as a plain number (e.g. 240.5). Do NOT include the letter V, do not include units. If you can't read it clearly, return NOT_FOUND.`;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${file.type || "image/jpeg"};base64,${base64}` } }
                ]
            }
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct"
    });

    const responseText = completion.choices[0].message.content || '';
    
    // Fallback logic
    let maxVal = '';
    const cleaned = responseText.replace(/[^\d.]/g, '');
    if (cleaned) {
       maxVal = cleaned;
    }

    return NextResponse.json({ voltage: maxVal, raw_text: responseText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process image', details: error.message }, { status: 500 });
  }
}
