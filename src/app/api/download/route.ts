import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    let filename = searchParams.get('filename') || 'Report.docx';

    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    
    if (!filename.endsWith('.docx')) {
        filename += '.docx';
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file from storage');
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
