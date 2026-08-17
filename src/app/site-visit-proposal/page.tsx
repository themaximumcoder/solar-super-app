'use client';
import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import Link from 'next/link';
import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import { ArrowLeft } from 'lucide-react';

export default function SiteVisitProposal() {
  const [mhsNumber, setMhsNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFF00'); // Default Yellow (AC)
  const [toolMode, setToolMode] = useState<'freehand' | 'straightLine' | 'stampInverter' | 'stampPvMsb'>('freehand');
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [savedImageData, setSavedImageData] = useState<ImageData | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setOriginalImage(img);
          setImageLoaded(true);
          drawBackgroundImage(img);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawBackgroundImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale canvas to fit within reasonable bounds while maintaining aspect ratio
    const maxWidth = window.innerWidth > 800 ? 800 : window.innerWidth - 40;
    const scale = maxWidth / img.width;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  const clearDrawing = () => {
    if (originalImage) {
      drawBackgroundImage(originalImage);
    }
  };

  // Drawing Handlers
  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(canvas, e);
    
    if (toolMode === 'stampInverter') {
        ctx.fillStyle = '#f97316'; // orange-500
        ctx.fillRect(pos.x - 25, pos.y - 25, 50, 50);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('INV', pos.x, pos.y);
        return;
    }
    
    if (toolMode === 'stampPvMsb') {
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.fillRect(pos.x - 25, pos.y - 25, 50, 50);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MSB', pos.x, pos.y);
        return;
    }

    setIsDrawing(true);
    setStartPos(pos);
    setSavedImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    if (toolMode === 'freehand') {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(canvas, e);

    if (toolMode === 'freehand') {
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
    } else if (toolMode === 'straightLine') {
        if (savedImageData) {
            ctx.putImageData(savedImageData, 0, 0);
        }
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setStartPos(null);
    setSavedImageData(null);
  };

  const getPos = (canvas: HTMLCanvasElement, evt: any) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (evt.touches) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const exportPPTX = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    const pres = new pptxgen();
    
    // Add title slide
    let slide = pres.addSlide();
    slide.addText(`Site Visit Technical Proposal\n${mhsNumber ? mhsNumber : 'Unknown'} - ${customerName ? customerName : 'Unknown'}`, { 
      x: 1, y: 1, w: '80%', h: 1, fontSize: 24, bold: true, align: 'center', color: '363636' 
    });

    // Add drawing slide
    slide = pres.addSlide();
    slide.addImage({ data: dataUrl, x: 0.5, y: 0.5, w: '90%', h: '80%', sizing: { type: 'contain', w: '90%', h: '80%' } });
    
    const safeName = (mhsNumber || 'MHS').replace(/[^a-zA-Z0-9_-]/g, '');
    pres.writeFile({ fileName: `${safeName}_${customerName || 'Customer'}_Home_Solar_Technical_Proposal_Template_R1.pptx` });
  };

  const exportPDF = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF({ orientation: 'landscape' });
    
    // Add title
    pdf.setFontSize(22);
    pdf.text(`Site Visit Technical Proposal`, 14, 20);
    pdf.setFontSize(16);
    pdf.text(`MHS No: ${mhsNumber || 'Unknown'}   |   Customer: ${customerName || 'Unknown'}`, 14, 30);
    
    // Calculate aspect ratio for fitting image inside PDF
    const pdfWidth = pdf.internal.pageSize.getWidth() - 28;
    const pdfHeight = pdf.internal.pageSize.getHeight() - 40;
    
    const canvas = canvasRef.current;
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    pdf.addImage(dataUrl, 'JPEG', 14, 35, imgWidth, imgHeight);
    
    const safeName = (mhsNumber || 'MHS').replace(/[^a-zA-Z0-9_-]/g, '');
    pdf.save(`${safeName}_${customerName || 'Customer'}_Maxis_Site_Pack_R1.pdf`);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col pb-20">
      <div className="bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] p-4 flex items-center shadow-sm relative z-10 sticky top-0">
        <Link href="/dashboard" className="mr-4 hover:bg-[hsl(var(--primary))/0.1] p-2 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Maxis Site Pack</h1>
      </div>
      
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full mt-6">
        <div className="space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl border border-[hsl(var(--border))]">
            <h2 className="text-xl font-semibold mb-4">Proposal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">MHS Number</label>
                <input 
                  type="text"
                  placeholder="e.g. MHS12345" 
                  value={mhsNumber} 
                  onChange={e => setMhsNumber(e.target.value)} 
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input 
                  type="text"
                  placeholder="e.g. John Doe" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[hsl(var(--border))]">
            <h2 className="text-xl font-semibold mb-4">Site Drawing Canvas</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="input-field max-w-xs" />
                
                {imageLoaded && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2 flex-wrap items-center bg-[hsl(var(--secondary))/0.5] p-2 rounded-xl">
                      <span className="text-sm font-semibold mr-2 text-[hsl(var(--muted-foreground))]">Tools:</span>
                      <button 
                        onClick={() => setToolMode('freehand')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${toolMode === 'freehand' ? 'bg-[hsl(var(--primary))] text-white shadow-md' : 'bg-transparent border border-[hsl(var(--border))] hover:bg-[hsl(var(--primary))/0.1]'}`}
                      >
                        Freehand
                      </button>
                      <button 
                        onClick={() => setToolMode('straightLine')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${toolMode === 'straightLine' ? 'bg-[hsl(var(--primary))] text-white shadow-md' : 'bg-transparent border border-[hsl(var(--border))] hover:bg-[hsl(var(--primary))/0.1]'}`}
                      >
                        Straight Line
                      </button>
                      <button 
                        onClick={() => setToolMode('stampInverter')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${toolMode === 'stampInverter' ? 'bg-orange-500 text-white shadow-md' : 'bg-transparent border border-orange-500 text-orange-600 hover:bg-orange-50'}`}
                      >
                        Insert Inverter
                      </button>
                      <button 
                        onClick={() => setToolMode('stampPvMsb')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${toolMode === 'stampPvMsb' ? 'bg-red-500 text-white shadow-md' : 'bg-transparent border border-red-500 text-red-600 hover:bg-red-50'}`}
                      >
                        Insert PV MSB
                      </button>
                    </div>

                    {(toolMode === 'freehand' || toolMode === 'straightLine') && (
                      <div className="flex gap-2 flex-wrap items-center bg-[hsl(var(--secondary))/0.5] p-2 rounded-xl">
                        <span className="text-sm font-semibold mr-2 text-[hsl(var(--muted-foreground))]">Color:</span>
                        <button 
                          onClick={() => setColor('#FFFF00')}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${color === '#FFFF00' ? 'bg-yellow-400 text-black shadow-md ring-2 ring-yellow-500 ring-offset-2' : 'bg-transparent border border-yellow-500 text-yellow-600 hover:bg-yellow-50'}`}
                        >
                          AC (Yellow)
                        </button>
                        <button 
                          onClick={() => setColor('#0000FF')}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${color === '#0000FF' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500 ring-offset-2' : 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                        >
                          DC (Blue)
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={clearDrawing}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        Clear Everything
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl overflow-hidden bg-[hsl(var(--secondary))] flex justify-center mt-4">
                <canvas 
                  ref={canvasRef}
                  className="max-w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  onTouchCancel={stopDrawing}
                />
                {!imageLoaded && (
                  <div className="h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))] p-8 text-center">
                    Please upload a site photo to start drawing the inverter and wiring layout.
                  </div>
                )}
              </div>

              {imageLoaded && (
                 <div className="flex flex-col sm:flex-row gap-4 mt-6">
                   <button onClick={exportPDF} className="btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white border-none">
                     Export as PDF
                   </button>
                   <button onClick={exportPPTX} className="btn-primary flex-1 bg-orange-600 hover:bg-orange-700 text-white border-none">
                     Export as PPTX
                   </button>
                 </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
