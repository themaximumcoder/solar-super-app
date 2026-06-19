import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emptyPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

async function resolveImage(tagValue: string) {
    if (!tagValue || tagValue === '') return emptyPixel;
    try {
        if (tagValue.startsWith('data:image/')) {
            const base64Data = tagValue.split(',')[1];
            return Buffer.from(base64Data, 'base64');
        }
        const response = await fetch(tagValue);
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

    const templatePath = path.join(process.cwd(), 'src', 'templates', 'template.docx');
    if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: 'Template file not found on server.' }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const imageOptions = {
        centered: false,
        getImage: function(tagValue: any) {
            // The tagValue is ALREADY a Buffer because we pre-fetched it below!
            return tagValue || emptyPixel;
        },
        getSize: function() {
            return [300, 225];
        }
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule]
    });

    // Pre-fetch all images so Docxtemplater can render synchronously
    const imageKeys = [
        'img_sld', 'img_pvlayout', 'img_array', 'img_route', 
        'img_inverter', 'img_combiner', 'img_interconnection', 
        'img_housekeeping', 'img_toolbox', 'img_safety', 
        'img_inspection', 'img_skylift'
    ];
    for (const key of imageKeys) {
        if (data[key]) {
            data[key] = await resolveImage(data[key]);
        } else {
            data[key] = emptyPixel;
        }
    }

    if (data.postInstallPhaseImages && data.postInstallPhaseImages.length > 0) {
        data.postInstallPhase1 = await resolveImage(data.postInstallPhaseImages[0] || '');
        data.postInstallPhase2 = await resolveImage(data.postInstallPhaseImages[1] || '');
        data.postInstallPhase3 = await resolveImage(data.postInstallPhaseImages[2] || '');
    } else {
        data.postInstallPhase1 = emptyPixel; data.postInstallPhase2 = emptyPixel; data.postInstallPhase3 = emptyPixel;
    }

    if (data.bulkSerialImages && data.bulkSerialImages.length > 0) {
        for (let i = 0; i < 20; i++) {
            data[`panel${i+1}`] = await resolveImage(data.bulkSerialImages[i] || '');
        }
    } else {
        for (let i = 0; i < 20; i++) data[`panel${i+1}`] = emptyPixel;
    }

    // Render SYNCHRONOUSLY
    (doc as any).setData(data);
    (doc as any).render();

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    
    // Save to Vercel Blob
    const fileName = `Report-${data.siteName || 'Unknown'}-${Date.now()}.docx`;
    const blob = await put(`reports/${fileName}`, buf, { access: 'public' });

    // Save history to Prisma
    await prisma.report.create({
        data: {
            mhsNumber: data.siteName || 'Unknown',
            customerName: data.customerName || 'Unknown',
            address: data.address || '',
            systemSize: data.systemSize || '',
            picOnsite: data.picName || '',
            documentUrl: blob.url
        }
    });

    return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate document', details: error.message }, { status: 500 });
  }
}
