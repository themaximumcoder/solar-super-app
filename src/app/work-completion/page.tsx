'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Upload, Camera } from 'lucide-react';

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blob = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, img_solar_layout: reader.result as string }));
      };
      reader.readAsDataURL(blob);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Generation failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Work_Completion_${formData.name || 'Report'}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Failed to generate PPTX: ' + error.message);
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
              <img src={formData.img_solar_layout} alt="Solar Layout" className="w-24 h-24 object-cover rounded-lg mr-4 border" />
            ) : (
              <div className="w-24 h-24 bg-[hsl(var(--secondary))] rounded-lg mr-4 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                <Upload size={32} />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm mb-1">Solar Layout Photo</p>
              <label className="btn-primary py-2 px-4 text-sm inline-flex cursor-pointer mt-2">
                <Camera size={16} className="mr-2" /> Select Image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 border-none shadow-xl disabled:opacity-50">
             {isGenerating ? <><Loader2 className="animate-spin mr-2" /> Generating PPTX...</> : <><FileText className="mr-2" /> Export to PPTX</>}
          </button>
        </div>

      </main>
    </div>
  );
}
