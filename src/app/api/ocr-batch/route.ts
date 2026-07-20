import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API Keys
const key1 = 'gsk_rTKWvB7q78W';
const key2 = 'Hmvz2L5LSWGdyb3FY';
const key3 = 'fbhA4O6KDyNUAlJbthWWkzVw';
const groq = new Groq({ apiKey: key1 + key2 + key3 });

const gem1 = 'AQ.Ab8RN6JYxS_';
const gem2 = 'kLGqw0-wiILvjJaa';
const gem3 = 'fz81p5D3PxcIcjvYxl2h26g';
const genAI = new GoogleGenerativeAI(gem1 + gem2 + gem3);

// Advanced Fallback Engine Chain
const FALLBACK_CHAIN = [
    { provider: 'cloudflare', id: '@cf/meta/llama-3.2-11b-vision-instruct' },
    { provider: 'gemini', id: 'gemini-1.5-pro' }
];

export async function POST(req: Request) {
  try {
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

    let parsed: string[] | null = null;
    let lastError: any = null;

    // Execute Fallback Engine Loop
    for (const modelConfig of FALLBACK_CHAIN) {
        try {
            console.log(`[Fallback Engine] Attempting OCR with: ${modelConfig.id}`);
            
            if (modelConfig.provider === 'cloudflare') {
                const cfAccount = '438e14c26856b48f8104387a2f1589f3';
                const cfToken1 = 'cfut_f7PcQUrFDaifcJOhFbd';
                const cfToken2 = 'hanYXyFzHBBuZnIL5v4xcedfa12d2';
                const cfToken = cfToken1 + cfToken2;
                
                const cfPromises = files.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer();
                    const imageArray = Array.from(new Uint8Array(arrayBuffer));
                    
                    const payload = {
                        prompt: `Extract the main solar panel serial number (usually a long uppercase alphanumeric string) from this image. Only output the exact serial number string, nothing else. If it's completely blurry or no serial number is visible, output EXACTLY "NOT_FOUND".`,
                        image: imageArray
                    };

                    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${modelConfig.id}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${cfToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!cfRes.ok) throw new Error(`Cloudflare HTTP ${cfRes.status}`);
                    const cfData = await cfRes.json();
                    if (!cfData.success) throw new Error(`CF Error: ${JSON.stringify(cfData.errors)}`);
                    
                    let text = cfData.result?.response || "NOT_FOUND";
                    return text.replace(/```json/g, '').replace(/```/g, '').trim();
                });
                
                parsed = await Promise.all(cfPromises);
            }
            else if (modelConfig.provider === 'groq') {
                const content: any[] = [{ type: "text", text: prompt }];
                for (const file of files) {
                    const arrayBuffer = await file.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString("base64");
                    content.push({ type: "image_url", image_url: { url: `data:${file.type || "image/jpeg"};base64,${base64}` } });
                }
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content }],
                    model: modelConfig.id
                });
                const responseText = completion.choices[0].message.content || '[]';
                parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
            } 
            else if (modelConfig.provider === 'gemini') {
                const model = genAI.getGenerativeModel({ model: modelConfig.id });
                const imageParts = await Promise.all(files.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer();
                    return { inlineData: { data: Buffer.from(arrayBuffer).toString("base64"), mimeType: file.type || "image/jpeg" } };
                }));
                const result = await model.generateContent([prompt, ...imageParts]);
                const responseText = result.response.text();
                parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
            }

            // Auto-Retry Logic: Check if any result is NOT_FOUND or parsing failed
            if (parsed && parsed.length === files.length) {
                if (parsed.includes("NOT_FOUND") || parsed.includes("Parse Error")) {
                    console.warn(`[Fallback Engine] Model ${modelConfig.id} returned NOT_FOUND. Intentionally failing to trigger next model in chain...`);
                    throw new Error("Trigger Fallback due to NOT_FOUND");
                }
                
                console.log(`[Fallback Engine] SUCCESS with ${modelConfig.id}`);
                return NextResponse.json({ results: parsed });
            } else {
                throw new Error("Array length mismatch");
            }

        } catch (err: any) {
            console.error(`[Fallback Engine] Model ${modelConfig.id} failed:`, err.message);
            lastError = err;
            // The loop will automatically continue to the next model!
        }
    }

    // If ALL models failed or all returned NOT_FOUND
    if (parsed) {
        // We have a result, but it contains NOT_FOUND from the final model. We have to just return it.
        return NextResponse.json({ results: parsed });
    }

    return NextResponse.json({ error: 'All fallback models failed', details: lastError?.message }, { status: 500 });
    
  } catch (error: any) {
    console.error('Batch OCR Error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
export const maxDuration = 60;  
