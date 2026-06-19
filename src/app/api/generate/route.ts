import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import sizeOf from 'image-size';

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

    const templateFileName = data.phase === '1-Phase' ? 'template2.docx' : 'template.docx';
    const templatePath = path.join(process.cwd(), 'src', 'templates', templateFileName);
    if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: `Template file ${templateFileName} not found on server.` }, { status: 404 });
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
                
                const maxWidth = 300;
                const maxHeight = 225;
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

    // Pre-fetch all images so Docxtemplater can render synchronously
    const imageKeys = [
        'img_sld', 'img_pvlayout', 'img_array', 'img_ac_route', 'img_dc_route', 
        'img_inverter', 'img_combiner', 'img_interconnection', 
        'img_housekeeping', 'img_toolbox', 'img_safety', 
        'img_inspection', 'img_skylift',
        'image_1p_ltn', 'image_1p_lte', 'image_1p_nte',
        'img_string1', 'img_string2',
        'img_v_ry_after', 'img_v_rb_after', 'img_v_yb_after', 'img_v_rn_after', 'img_v_bn_after', 'img_v_yn_after', 'img_v_re_after', 'img_v_ye_after', 'img_v_be_after', 'img_v_ne_after'
    ];
    for (const key of imageKeys) {
        if (data[key]) {
            imageMap.set(key, await resolveImage(data[key]));
            data[key] = key;
        } else {
            imageMap.set(key, emptyPixel);
            data[key] = key;
        }
    }

    if (data.postInstallPhaseImages && data.postInstallPhaseImages.length > 0) {
        imageMap.set('post1', await resolveImage(data.postInstallPhaseImages[0] || '')); data.postInstallPhase1 = 'post1';
        imageMap.set('post2', await resolveImage(data.postInstallPhaseImages[1] || '')); data.postInstallPhase2 = 'post2';
        imageMap.set('post3', await resolveImage(data.postInstallPhaseImages[2] || '')); data.postInstallPhase3 = 'post3';
    } else {
        imageMap.set('post1', emptyPixel); data.postInstallPhase1 = 'post1';
        imageMap.set('post2', emptyPixel); data.postInstallPhase2 = 'post2';
        imageMap.set('post3', emptyPixel); data.postInstallPhase3 = 'post3';
    }

    if (data.bulkSerialImages && data.bulkSerialImages.length > 0) {
        for (let i = 0; i < 20; i++) {
            imageMap.set(`panel${i+1}`, await resolveImage(data.bulkSerialImages[i] || ''));
            data[`panel${i+1}`] = `panel${i+1}`;
        }
    } else {
        for (let i = 0; i < 20; i++) {
            imageMap.set(`panel${i+1}`, emptyPixel);
            data[`panel${i+1}`] = `panel${i+1}`;
        }
    }

    // Render SYNCHRONOUSLY
    (doc as any).setData(data);
    (doc as any).render();

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    
    // Save to Vercel Blob
    const safeMhs = (data.siteName || 'Report').replace(/[^a-zA-Z0-9_-]/g, '') || 'Report';
    const fileName = `${safeMhs}.docx`;
    const blob = await put(`reports/${fileName}`, buf, { access: 'public' });

    let engineerId = null;
    if (data.engineer_ic) {
        const eng = await prisma.engineer.findUnique({ where: { icNumber: data.engineer_ic } });
        if (eng) engineerId = eng.id;
    }

    // Save history to Prisma
    await prisma.report.create({
        data: {
            mhsNumber: data.siteName || 'Unknown',
            customerName: data.customerName || 'Unknown',
            address: data.address || '',
            systemSize: data.systemSize || '',
            picOnsite: data.picName || '',
            documentUrl: blob.url,
            engineerId: engineerId
        }
    });

    try {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard?view=me');
        revalidatePath('/dashboard?view=all');
    } catch(e) {}

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
