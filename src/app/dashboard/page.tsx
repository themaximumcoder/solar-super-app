import { PrismaClient } from '@prisma/client';
import { FileText, Download, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function Dashboard() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">History & Records</h1>
        <p className="text-[hsl(var(--muted-foreground))]">View all previously generated Site Acceptance Reports.</p>
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
                    <a href={report.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center btn-primary px-3 py-1 text-xs">
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
