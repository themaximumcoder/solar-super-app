import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParser = new PDFParser(null, true);
    
    return new Promise<NextResponse>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        resolve(NextResponse.json({ error: 'Failed to parse PDF', details: errData.parserError?.message || errData.message || 'Unknown error' }, { status: 500 }));
      });

        pdfParser.on("pdfParser_dataReady", async (pdfData) => {
            const text = pdfParser.getRawTextContent();
            
            // Use Cloudflare Llama 3.2 to extract the structured data perfectly regardless of PDF layout mess!
            const cfAccount = '438e14c26856b48f8104387a2f1589f3';
            const cfToken1 = 'cfut_f7PcQUrFDaifcJOhFbd';
            const cfToken2 = 'hanYXyFzHBBuZnIL5v4xcedfa12d2';
            const cfToken = cfToken1 + cfToken2;
            
            const prompt = `You are a strict data extractor. Extract the following fields from the messy raw text of a Solar Proposal.
Return ONLY a raw JSON object. Do NOT add any conversational text, prefixes, or explanations. Start your response directly with { and end with }.
Fields to extract:
- "mhs": The Order ID (starts with MHS_)
- "size": The system size (e.g. 13.64 kWp)
- "name": The customer's full name
- "address": The full installation address

Raw Text:
${text.substring(0, 3000)}`;

            try {
                const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3.2-3b-instruct`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${cfToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
                });

                if (!res.ok) throw new Error("CF HTTP Error");
                const data = await res.json();
                
                // Ensure output is always a string to prevent .match is not a function
                let output = "";
                if (typeof data.result?.response === "string") {
                    output = data.result.response;
                } else if (data.result?.choices?.[0]?.message?.content) {
                    output = data.result.choices[0].message.content;
                } else {
                    output = JSON.stringify(data.result || data);
                }
                
                // Extremely aggressive JSON extraction to handle any Llama fluff
                const jsonMatch = output.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    output = jsonMatch[0];
                }
                
                const parsed = JSON.parse(output);
                
                resolve(NextResponse.json({
                    mhs: parsed.mhs || '',
                    size: parsed.size || '',
                    address: parsed.address || '',
                    name: parsed.name || '',
                }));
            } catch (err: any) {
                // Fallback to basic regex if AI fails
                const mhsMatch = text.match(/(MHS_\d+)/i);
                const sizeMatch = text.match(/([\d\.]+\s*kWp)/i);
                resolve(NextResponse.json({
                    mhs: mhsMatch ? mhsMatch[1] : '',
                    size: sizeMatch ? sizeMatch[1] : '',
                    address: `Error: ${err.message}`,
                    name: 'Parse Error',
                }));
            }
        });

        pdfParser.parseBuffer(buffer);
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to parse PDF', details: error.message }, { status: 500 });
  }
}
