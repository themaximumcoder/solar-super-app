'use client';
import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import Link from 'next/link';
import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import { Navbar } from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SiteVisitProposal() {
  const [mhsNumber, setMhsNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFF00'); // Default Yellow (AC)
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

    setIsDrawing(true);
    const pos = getPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
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
    pdf.save(`${safeName}_${customerName || 'Customer'}_Home_Solar_Technical_Proposal_Template_R1.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar title="Site Visit Proposal" showBack href="/dashboard" />
      
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <div className="space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">MHS Number</label>
                <Input placeholder="e.g. MHS12345" value={mhsNumber} onChange={e => setMhsNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Customer Name</label>
                <Input placeholder="e.g. John Doe" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site Drawing Canvas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="max-w-xs" />
                
                {imageLoaded && (
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={color === '#FFFF00' ? 'default' : 'outline'} 
                      onClick={() => setColor('#FFFF00')}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                    >
                      AC Wiring (Yellow)
                    </Button>
                    <Button 
                      variant={color === '#0000FF' ? 'default' : 'outline'} 
                      onClick={() => setColor('#0000FF')}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                    >
                      DC Wiring (Blue)
                    </Button>
                    <Button variant="outline" onClick={clearDrawing}>Clear Drawing</Button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex justify-center mt-4">
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
                  <div className="h-64 flex items-center justify-center text-gray-400 p-8 text-center">
                    Please upload a site photo to start drawing the inverter and wiring layout.
                  </div>
                )}
              </div>

              {imageLoaded && (
                 <div className="flex flex-col sm:flex-row gap-4 mt-6">
                   <Button onClick={exportPDF} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                     Export as PDF
                   </Button>
                   <Button onClick={exportPPTX} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                     Export as PPTX
                   </Button>
                 </div>
              )}
            </CardContent>
          </Card>
          
        </div>
      </main>
    </div>
  );
}
