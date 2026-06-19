import { PrismaClient } from '@prisma/client';
import { FileText, Download, Calendar, User } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;
  let engineer = null;
  if (sessionId && sessionId !== 'true') {
      engineer = await prisma.engineer.findUnique({ where: { id: sessionId } });
  }

  const { view = 'me' } = await searchParams;

  const whereClause = view === 'me' && engineer ? {
      OR: [
          { engineerId: engineer.id },
          { picOnsite: engineer.firstName }
      ]
  } : {};

  const reports = await prisma.report.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">History & Records</h1>
          <p className="text-[hsl(var(--muted-foreground))]">View previously generated Site Acceptance Reports.</p>
        </div>
        
        {engineer && (
            <div className="flex bg-[hsl(var(--secondary))] p-1 rounded-xl">
                <Link href="/dashboard?view=me" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'me' ? 'bg-[hsl(var(--background))] shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
                    My Reports
                </Link>
                <Link href="/dashboard?view=all" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'all' ? 'bg-[hsl(var(--background))] shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
                    All Reports
                </Link>
            </div>
        )}
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">MHS Number</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">System Size</th>
                <th className="p-4 font-semibold">PIC Onsite</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                    No reports generated yet.
                  </td>
                </tr>
              )}
              {reports.map(report => (
                <tr key={report.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))/0.5] transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-[hsl(var(--primary))]" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{report.mhsNumber}</td>
                  <td className="p-4">{report.customerName}</td>
                  <td className="p-4">{report.systemSize}</td>
                  <td className="p-4">{report.picOnsite}</td>
                  <td className="p-4">
                    <a href={`/api/download?url=${encodeURIComponent(report.documentUrl)}&filename=${encodeURIComponent((report.mhsNumber || 'Report').replace(/[^a-zA-Z0-9_-]/g, ''))}.docx`} className="inline-flex items-center btn-primary px-3 py-1 text-xs">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
