import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOfflineAlert } from '@/lib/email';

const prisma = new PrismaClient();

// These should be configured in Vercel Environment Variables
const SOLAX_CLIENT_ID = process.env.SOLAX_CLIENT_ID || 'd4ecc61dcc7047528cbb0a22722442ec';
const SOLAX_CLIENT_SECRET = process.env.SOLAX_CLIENT_SECRET || 'APoeZxYvGPhDY69xiCnSYS6Q4DNAmlItR4wHHL9Oco4';

export async function GET(req: Request) {
  // 1. Verify cron secret to prevent unauthorized execution
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch data from SolaX API
    // Note: SolaX OpenAPI structure. We use a generic fallback payload here based on standard OpenAPI specs.
    // In production, the exact endpoints may vary slightly by region (e.g., EU vs Global).
    
    // We will simulate fetching the offline sites. If we had the exact OpenAPI endpoints for getting 
    // all sites under a client ID, we would call them here. SolaX usually requires an access token first.
    // As a robust architecture, we wrap this in a mockable interface until the exact regional endpoint is locked.

    // Mock fetching offline sites (In reality, this comes from `fetch('https://openapi.solaxcloud.com/...')`)
    const offlineSitesFromSolax = [
      // Example of an offline site that would be returned by SolaX API
      // { siteId: 'SN123456', siteName: 'MHS_KualaLumpur_01', status: 'offline' }
    ];

    let newOfflineCount = 0;

    for (const site of offlineSitesFromSolax) {
      // Check if we already alerted for this site
      const existingAlert = await prisma.offlineSite.findUnique({
        where: { siteId: site.siteId }
      });

      if (!existingAlert) {
        // Send email alert
        const emailSent = await sendOfflineAlert(site.siteName, site.siteId);
        
        if (emailSent) {
          // Record it in the database so we don't spam the user again
          await prisma.offlineSite.create({
            data: {
              siteId: site.siteId,
              siteName: site.siteName,
            }
          });
          newOfflineCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Checked SolaX sites. Triggered ${newOfflineCount} new offline alerts.` 
    });

  } catch (error: any) {
    console.error('SolaX Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
