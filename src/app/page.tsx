"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PenTool, ClipboardCheck, ArrowRight, Zap, Battery, Activity, FileText } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [reportCount, setReportCount] = useState<number | string>("...");

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(data => setReportCount(data.count)).catch(() => setReportCount(0));
  }, []);
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
        >
          Welcome back to <span className="text-[hsl(var(--primary))]">AI Solar OS</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[hsl(var(--muted-foreground))] text-lg max-w-2xl"
        >
          Your central hub for solar design, proposals, and post-installation compliance reporting.
        </motion.p>
      </header>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 rounded-2xl relative overflow-hidden group border-[hsl(var(--primary))/0.3] flex flex-col"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <ClipboardCheck size={120} />
          </div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center mb-6 text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))/0.2]">
              <ClipboardCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Install Report</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-8 flex-1">
              Complete the compliance checklist, log voltage measurements, upload site photos, and automatically generate the Site Acceptance Word Doc.
            </p>
            <Link href="/installation" className="btn-primary bg-white text-black hover:bg-white/90 shadow-none self-start">
              Start Installation Check <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-8 rounded-2xl relative overflow-hidden group border-orange-500/30 flex flex-col"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-orange-500">
            <PenTool size={120} />
          </div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-6 text-white shadow-lg shadow-orange-500/20">
              <PenTool size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Maxis Site Pack</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-8 flex-1">
              Upload site photos and immediately draw the inverter and AC/DC wiring layout to generate a technical proposal presentation.
            </p>
            <Link href="/site-visit-proposal" className="btn-primary bg-orange-600 text-white hover:bg-orange-700 shadow-none self-start">
              Open Maxis Site Pack <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-8 rounded-2xl relative overflow-hidden group border-blue-500/30 flex flex-col md:col-span-2 lg:col-span-1"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-blue-500">
            <FileText size={120} />
          </div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-500/20">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Work Completion Form</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-8 flex-1">
              Fill out the inspection details, string voltages, and upload the layout photo to generate the Work Completion Inspection PPTX.
            </p>
            <Link href="/work-completion" className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-none self-start">
              Open Work Completion <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Placeholder */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
      >
        {[ 
          { icon: ClipboardCheck, label: "Total Generated Reports", value: reportCount },
          { icon: Activity, label: "System Health", value: "100%" },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-6 flex items-center">
            <div className="p-3 rounded-lg bg-[hsl(var(--secondary))] mr-4 text-[hsl(var(--muted-foreground))]">
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
