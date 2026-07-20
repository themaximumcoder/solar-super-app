import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const cfAccount = '438e14c26856b48f8104387a2f1589f3';
    const cfToken1 = 'cfut_f7PcQUrFDaifcJOhFbd';
    const cfToken2 = 'hanYXyFzHBBuZnIL5v4xcedfa12d2';
    const cfToken = cfToken1 + cfToken2;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string || 'voltage';

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageArray = Array.from(new Uint8Array(arrayBuffer));
    
    const prompt = (mode === 'dongle' || mode === 'inverterSn')
      ? 'Look at this label. Find the line that starts with S/N:. Return ONLY the exact serial number text that comes after S/N: . Do not include any other text.' 
      : 'Look at this multimeter screen. Return ONLY the main large voltage number displayed as a plain number (e.g. 240.5). Do NOT include the letter V, do not include units. If you cannot read it clearly, return NOT_FOUND.';

    const payload = {
        prompt: prompt,
        image: imageArray
    };

    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`, {
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
    
    const responseText = cfData.result?.response || '';
    
    let resultVal = '';
    if (mode === 'dongle' || mode === 'inverterSn') {
      const snMatch = responseText.match(/(?:S\/N:\s*)?([A-Z0-9]+)/i);
      resultVal = snMatch ? snMatch[1] : responseText.trim();
    } else {
      const cleaned = responseText.replace(/[^\d.]/g, '');
      if (cleaned) {
        resultVal = cleaned;
      }
    }

    return NextResponse.json({ value: resultVal, raw_text: responseText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image', details: error.message },
      { status: 500 }
    );
  }
}
export const maxDuration = 60;  
