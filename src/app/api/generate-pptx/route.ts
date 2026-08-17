import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';

export const maxDuration = 60;

const emptyPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

async function resolveImage(tagValue: string) {
    if (!tagValue || tagValue === '') return emptyPixel;
    try {
        let val = tagValue;
        if (tagValue.startsWith('[')) {
           try {
             const parsed = JSON.parse(tagValue);
             if (Array.isArray(parsed) && parsed.length > 0) val = parsed[0];
           } catch(e) {}
        }
        
        if (val.startsWith('data:image/')) {
            const base64Data = val.split(',')[1];
            return Buffer.from(base64Data, 'base64');
        }
        const response = await fetch(val);
        if (!response.ok) return emptyPixel;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        return emptyPixel;
    }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const templatePath = path.join(process.cwd(), 'public', 'work_completion_template.pptx');
    if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: `Template file not found on server.` }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const imageMap = new Map<string, Buffer>();

    const imageOptions = {
        centered: false,
        getImage: function(tagValue: any) {
            return imageMap.get(tagValue) || emptyPixel;
        },
        getSize: function(img: Buffer, tagValue: string, tagName: string) {
            if (img === emptyPixel) return [300, 225];
            try {
                const dimensions = sizeOf(img);
                if (!dimensions.width || !dimensions.height) return [300, 225];
                
                const maxWidth = 500;
                const maxHeight = 400;
                let w = dimensions.width;
                let h = dimensions.height;
                
                if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                }
                if (h > maxHeight) {
                    w = Math.round((w * maxHeight) / h);
                    h = maxHeight;
                }
                return [w, h];
            } catch (e) {
                return [300, 225];
            }
        }
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule]
    });

    if (data.img_solar_layout) {
        imageMap.set('img_solar_layout', await resolveImage(data.img_solar_layout));
        data.img_solar_layout = 'img_solar_layout';
    }

    (doc as any).setData(data);
    (doc as any).render();

    const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    });

    return new NextResponse(buf, {
        status: 200,
        headers: {
            'Content-Disposition': `attachment; filename="Work_Completion_${data.name || 'Report'}.pptx"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
    });

  } catch (error: any) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: 'Failed to generate document', details: error.message }, { status: 500 });
  }
}
