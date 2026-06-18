import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sun, LayoutDashboard, ClipboardCheck, PenTool, Settings } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solar Super App",
  description: "Comprehensive Solar Proposal & Design Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex text-[hsl(var(--foreground))]`}>
        {/* Sidebar */}
        <aside className="w-64 border-r border-[hsl(var(--border))] glass-panel hidden md:flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-[hsl(var(--border))]">
            <Sun className="h-6 w-6 text-[hsl(var(--primary))] mr-3" />
            <span className="font-bold text-lg tracking-tight">SolarOS</span>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link href="/" className="flex items-center px-4 py-3 rounded-lg bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))] font-medium transition-colors">
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            <Link href="/proposal" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] font-medium transition-colors">
              <PenTool className="h-5 w-5 mr-3" />
              Design Studio
            </Link>
            <Link href="/installation" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] font-medium transition-colors">
              <ClipboardCheck className="h-5 w-5 mr-3" />
              Install Report
            </Link>
          </nav>

          <div className="p-4 border-t border-[hsl(var(--border))]">
            <Link href="/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] font-medium transition-colors">
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Mobile Header */}
          <header className="h-16 border-b border-[hsl(var(--border))] glass-panel flex items-center px-4 md:hidden z-10 relative">
            <Sun className="h-6 w-6 text-[hsl(var(--primary))] mr-3" />
            <span className="font-bold text-lg">SolarOS</span>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 relative">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
