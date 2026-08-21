'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Upload, Camera, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function WorkCompletion() {
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '', address: '', plant_name: '', date: '', date_sign: '',
    rating: '', salesman_name: '', salesmansign_date: '', sign: '',
    panel_count: '', string_1_count: '', string_1_v: '', string_2_count: '', string_2_v: '',
    line_neutral_before: '', line_neutral_after: '',
    panel_sn: '', inverter_sn: '', dongle_sn: '',
    img_solar_layout: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.5);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      compressImage(file).then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const base64s = await Promise.all(files.map(f => compressImageToBase64(f)));
    setFormData(prev => {
       let existing = [];
       if (prev.img_solar_layout) {
          try {
             existing = JSON.parse(prev.img_solar_layout);
             if (!Array.isArray(existing)) existing = [prev.img_solar_layout];
          } catch {
             existing = [prev.img_solar_layout];
          }
       }
       return { ...prev, img_solar_layout: JSON.stringify([...existing, ...base64s]) };
    });
  };

  const stitchImages = async (base64s: string[]): Promise<string> => {
    if (!base64s || base64s.length === 0) return "";
    if (base64s.length === 1) return base64s[0];
    const images = await Promise.all(base64s.map(src => {
        return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    }));
    const maxWidth = Math.max(...images.map(img => img.width));
    const gap = 20;
    const totalHeight = images.reduce((sum, img) => sum + img.height, 0) + (images.length - 1) * gap;
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        let currentY = 0;
        for (const img of images) {
            const x = (maxWidth - img.width) / 2;
            ctx.drawImage(img, x, currentY);
            currentY += img.height + gap;
        }
    }
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const parseImageArray = (val: string | undefined): string[] => {
    if (!val) return [];
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) ? arr : [val];
    } catch {
      return [val];
    }
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // Stitch image if it's an array right before rendering
      if (formData.img_solar_layout && formData.img_solar_layout.startsWith('[')) {
          const arr = JSON.parse(formData.img_solar_layout);
          const stitched = await stitchImages(arr);
          setFormData(prev => ({ ...prev, img_solar_layout: stitched }));
          // Give React a tiny moment to update the DOM with the stitched image before html2canvas runs
          await new Promise(r => setTimeout(r, 100));
      }

      const element = document.getElementById('pdf-content');
      if (!element) throw new Error("PDF Template not found");

      // Temporarily show the element for rendering
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Work_Completion_${formData.name || 'Report'}.pdf`);

    } catch (error: any) {
      alert('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col pb-20">
      <div className="bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] p-4 flex items-center shadow-sm relative z-10 sticky top-0">
        <Link href="/dashboard" className="mr-4 hover:bg-[hsl(var(--primary))/0.1] p-2 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Work Completion Inspection</h1>
      </div>
      
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full mt-6 space-y-6">
        
        <div className="glass-panel p-6 rounded-2xl border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold mb-4">Customer & Plant Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Customer Name</label><input name="name" value={formData.name} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Plant Name</label><input name="plant_name" value={formData.plant_name} onChange={handleInputChange} className="input-field" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Address</label><input name="address" value={formData.address} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">System Rating (kWp)</label><input name="rating" value={formData.rating} onChange={handleInputChange} className="input-field" /></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold mb-4">String & Voltage Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Total Panel Count</label><input type="number" name="panel_count" value={formData.panel_count} onChange={handleInputChange} className="input-field" /></div>
            <div></div>
            <div><label className="block text-sm font-medium mb-1">String 1 Panel Count</label><input type="number" name="string_1_count" value={formData.string_1_count} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">String 1 Voltage (V)</label><input name="string_1_v" value={formData.string_1_v} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">String 2 Panel Count</label><input type="number" name="string_2_count" value={formData.string_2_count} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">String 2 Voltage (V)</label><input name="string_2_v" value={formData.string_2_v} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Line-Neutral Before (V)</label><input name="line_neutral_before" value={formData.line_neutral_before} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Line-Neutral After (V)</label><input name="line_neutral_after" value={formData.line_neutral_after} onChange={handleInputChange} className="input-field" /></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold mb-4">Serial Numbers & Signatures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Panel S/N Example</label><input name="panel_sn" value={formData.panel_sn} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Inverter S/N</label><input name="inverter_sn" value={formData.inverter_sn} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Dongle S/N</label><input name="dongle_sn" value={formData.dongle_sn} onChange={handleInputChange} className="input-field" /></div>
            <div></div>
            <div><label className="block text-sm font-medium mb-1">Customer Sign Name</label><input name="sign" value={formData.sign} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Customer Sign Date</label><input type="date" name="date_sign" value={formData.date_sign} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Salesman Name</label><input name="salesman_name" value={formData.salesman_name} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Salesman Sign Date</label><input type="date" name="salesmansign_date" value={formData.salesmansign_date} onChange={handleInputChange} className="input-field" /></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold mb-4">Layout Image</h2>
          <div className="border-2 border-dashed rounded-xl p-4 flex items-center border-[hsl(var(--border))]">
            {formData.img_solar_layout ? (
              <div className="flex gap-2 mb-4 flex-wrap">
                {parseImageArray(formData.img_solar_layout).map((src, i) => (
                  <img key={i} src={src} alt="Solar Layout" className="w-16 h-16 object-cover rounded-md border" />
                ))}
              </div>
            ) : (
              <div className="w-24 h-24 bg-[hsl(var(--secondary))] rounded-lg mr-4 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                <Upload size={32} />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm mb-1">Solar Layout Photo</p>
              <label className="text-xs text-[hsl(var(--primary))] cursor-pointer font-bold mt-1 inline-block hover:underline">
                {formData.img_solar_layout ? "Replace Photo(s)" : "Upload Photo(s)"}
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {formData.img_solar_layout && (
                <button onClick={() => setFormData(prev => ({...prev, img_solar_layout: ""}))} className="ml-3 text-xs text-red-500 hover:underline">Clear</button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button onClick={handleGeneratePDF} disabled={isGenerating} className="btn-primary w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 border-none shadow-xl disabled:opacity-50">
             {isGenerating ? <><Loader2 className="animate-spin mr-2" /> Generating PDF...</> : <><Download className="mr-2" /> Export to PDF</>}
          </button>
        </div>

      </main>

      {/* Hidden PDF Template */}
      <div style={{ display: 'none' }}>
        <div id="pdf-content" className="bg-white text-black p-10 w-[800px] mx-auto box-border font-sans">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-800 border-b-4 border-blue-800 pb-2">WORK COMPLETION INSPECTION REPORT</h1>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
            <div><strong className="text-gray-600">Customer Name:</strong> <span className="border-b border-gray-300 pb-1 block mt-1">{formData.name || 'N/A'}</span></div>
            <div><strong className="text-gray-600">Plant Name:</strong> <span className="border-b border-gray-300 pb-1 block mt-1">{formData.plant_name || 'N/A'}</span></div>
            <div className="col-span-2"><strong className="text-gray-600">Address:</strong> <span className="border-b border-gray-300 pb-1 block mt-1">{formData.address || 'N/A'}</span></div>
            <div><strong className="text-gray-600">Date:</strong> <span className="border-b border-gray-300 pb-1 block mt-1">{formData.date || 'N/A'}</span></div>
            <div><strong className="text-gray-600">System Rating (kWp):</strong> <span className="border-b border-gray-300 pb-1 block mt-1">{formData.rating || 'N/A'}</span></div>
          </div>

          <h2 className="text-xl font-bold text-blue-800 bg-blue-50 p-2 mb-4">1. String & Voltage Details</h2>
          <table className="w-full text-sm border-collapse mb-8">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/4">Total Panel Count</td>
                <td className="border border-gray-300 p-2 w-1/4">{formData.panel_count}</td>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/4"></td>
                <td className="border border-gray-300 p-2 w-1/4"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">String 1 Count</td>
                <td className="border border-gray-300 p-2">{formData.string_1_count}</td>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">String 1 Voltage</td>
                <td className="border border-gray-300 p-2">{formData.string_1_v} V</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">String 2 Count</td>
                <td className="border border-gray-300 p-2">{formData.string_2_count}</td>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">String 2 Voltage</td>
                <td className="border border-gray-300 p-2">{formData.string_2_v} V</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Line-Neutral Before</td>
                <td className="border border-gray-300 p-2">{formData.line_neutral_before} V</td>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Line-Neutral After</td>
                <td className="border border-gray-300 p-2">{formData.line_neutral_after} V</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-xl font-bold text-blue-800 bg-blue-50 p-2 mb-4">2. Equipment Serial Numbers</h2>
          <table className="w-full text-sm border-collapse mb-8">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/3">Panel S/N Example</td>
                <td className="border border-gray-300 p-2">{formData.panel_sn}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Inverter S/N</td>
                <td className="border border-gray-300 p-2">{formData.inverter_sn}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Dongle S/N</td>
                <td className="border border-gray-300 p-2">{formData.dongle_sn}</td>
              </tr>
            </tbody>
          </table>

          {formData.img_solar_layout && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-blue-800 bg-blue-50 p-2 mb-4">3. Solar Layout Photo</h2>
              <div className="border border-gray-300 p-2 bg-gray-50 flex justify-center">
                <img src={formData.img_solar_layout} alt="Solar Layout" className="max-w-full max-h-[300px] object-contain" />
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-blue-800 bg-blue-50 p-2 mb-4">4. Signatures</h2>
          <div className="grid grid-cols-2 gap-8 text-sm mt-8">
            <div className="border border-gray-300 p-4">
              <p className="font-bold mb-8">Customer Acknowledgment</p>
              <div className="border-b border-gray-400 mb-2 h-10"></div>
              <p><strong>Name:</strong> {formData.sign}</p>
              <p><strong>Date:</strong> {formData.date_sign}</p>
            </div>
            <div className="border border-gray-300 p-4">
              <p className="font-bold mb-8">Contractor / Salesman</p>
              <div className="border-b border-gray-400 mb-2 h-10"></div>
              <p><strong>Name:</strong> {formData.salesman_name}</p>
              <p><strong>Date:</strong> {formData.salesmansign_date}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
