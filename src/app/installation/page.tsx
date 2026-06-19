"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle, ChevronRight, Upload, FileText, Loader2, Camera, Zap, MapPin, Layers, User, Info } from "lucide-react";
import pvSpecs from "@/data/pvSpecs.json";

export default function InstallationReport() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [phase, setPhase] = useState("3-Phase");
  const [ocrLoading, setOcrLoading] = useState<string>("");
  const [bulkOcrProgress, setBulkOcrProgress] = useState(0);
  const [scannedSerials, setScannedSerials] = useState<{url: string, serial: string, status: string}[]>([]);
  const [engineer, setEngineer] = useState<{name: string, ic: string, phone: string} | null>(null);
  
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.name) {
          setEngineer({ name: data.name, ic: data.icNumber, phone: data.phone });
          setFormData(prev => ({ ...prev, picName: data.name }));
        }
      })
      .catch(() => {});
  }, []);
  
  // Bulk OCR State
  const [isBulkOcrRunning, setIsBulkOcrRunning] = useState(false);

  const [formData, setFormData] = useState<Record<string, string>>({
    siteName: "", customerName: "", address: "", systemSize: "", startDate: "", endDate: "", picName: "",
    panelQty: "", panelBrand: "", inverterBrand: "", inverterSize: "", inverterSn: "", dongleSn: "", serialNumbers: "",
    v_ry_after: "", v_rb_after: "", v_yb_after: "", v_rn_after: "", v_bn_after: "", v_yn_after: "", v_re_after: "", v_ye_after: "", v_be_after: "", v_ne_after: "",
    '1p_ltn': "", '1p_lte': "", '1p_nte': "", v_dc_string1: "", v_dc_string2: "",
    image_1p_ltn: "", image_1p_lte: "", image_1p_nte: "", img_string1: "", img_string2: "",
    img_sld: "", img_pvlayout: "", img_array: "", img_ac_route: "", img_dc_route: "", img_inverter: "", img_combiner: "", img_interconnection: "", img_housekeeping: "",
    img_toolbox: "", img_safety: "", img_inspection: "", img_skylift: "",
    clinicName: "", clinicPhone: "", hospitalName: "", hospitalPhone: "", policeName: "", policePhone: "", fireName: "", firePhone: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [name]: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
          const maxDim = 1200;
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
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOcrScan = async (field: string, imgKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(field);
    
    // Save original for UI preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [imgKey]: reader.result as string }));
    };
    reader.readAsDataURL(file);

    try {
      const compressedBlob = await compressImage(file);
      const uploadData = new FormData();
      uploadData.append('file', compressedBlob, file.name);

      const res = await fetch('/api/ocr', { method: 'POST', body: uploadData });
      
      if (res.ok) {
        const result = await res.json();
        if (result.voltage) {
          setFormData(prev => ({ ...prev, [field]: result.voltage }));
        } else {
          alert('Could not detect a clear number from the multimeter screen.');
        }
      } else {
        const text = await res.text();
        try {
          const err = JSON.parse(text);
          alert('Server Error: ' + (err.details || err.error));
        } catch {
          if (res.status === 413) alert('Error: Image is too large for Vercel. Compression failed.');
          else if (res.status === 504) alert('Error: Server timed out processing the image.');
          else alert('Server Error: ' + res.status + ' ' + res.statusText);
        }
      }
    } catch (err: any) {
      alert('Error scanning multimeter: ' + err.message);
    } finally {
      setOcrLoading("");
    }
  };

  const handleBulkSerialOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setIsBulkOcrRunning(true);
    const newScans = Array.from(files).map(file => ({
      url: URL.createObjectURL(file),
      serial: '',
      status: 'loading'
    }));
    
    setScannedSerials(prev => [...prev, ...newScans]);
    const startIndex = scannedSerials.length;

    setBulkOcrProgress(1);
    let completedCount = 0;
    let currentIndex = 0;
    const concurrency = 3; // Limit to 3 parallel requests to prevent Vercel/Browser crashing

    const worker = async () => {
      while (currentIndex < files.length) {
        const i = currentIndex++;
        const file = files[i];
        
        try {
          const compressedBlob = await compressImage(file);
          const uploadData = new FormData();
          uploadData.append('file', compressedBlob, file.name);
          uploadData.append('type', 'serial');
          
          const res = await fetch('/api/ocr', { method: 'POST', body: uploadData });
          if (res.ok) {
            const result = await res.json();
            if (result.text) {
               const cleanedText = result.text.replace(/[\s_]+/g, '');
               const rawMatches = cleanedText.match(/[a-zA-Z0-9-]{10,}/g);
               if (rawMatches) {
                   const matches = rawMatches.map((m: string) => m.toUpperCase());
                   
                   setFormData(prev => {
                       const existing = prev.serialNumbers ? prev.serialNumbers.split(', ').filter(s=>s) : [];
                       const newMatches = matches.filter((m: string) => !existing.includes(m));
                       return { ...prev, serialNumbers: [...existing, ...newMatches].join(', ') };
                   });

                   setScannedSerials(prev => {
                       const clone = [...prev];
                       clone[startIndex + i] = { ...clone[startIndex + i], status: 'success', serial: matches.join(', ') };
                       return clone;
                   });
               } else {
                   setScannedSerials(prev => {
                       const clone = [...prev];
                       clone[startIndex + i] = { ...clone[startIndex + i], status: 'error', serial: 'Not found' };
                       return clone;
                   });
               }
            }
          } else {
              setScannedSerials(prev => {
                  const clone = [...prev];
                  clone[startIndex + i] = { ...clone[startIndex + i], status: 'error', serial: `HTTP ${res.status}` };
                  return clone;
              });
          }
        } catch (err) {
          console.error("OCR failed for file", file.name, err);
          setScannedSerials(prev => {
              const clone = [...prev];
              clone[startIndex + i] = { ...clone[startIndex + i], status: 'error', serial: 'Error' };
              return clone;
          });
        } finally {
          completedCount++;
          setBulkOcrProgress(Math.round((completedCount / files.length) * 100));
        }
      }
    };

    const workers = [];
    for (let j = 0; j < Math.min(concurrency, files.length); j++) {
      workers.push(worker());
    }

    await Promise.all(workers);
    setIsBulkOcrRunning(false);
  };

  const locateEmergencyServices = async (address: string) => {
    setIsLocating(true);
    try {
      const res = await fetch('/api/emergency', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) });
      if (res.ok) {
         const data = await res.json();
         setFormData(prev => ({
           ...prev,
           clinicName: data.clinic.name, clinicPhone: data.clinic.phone,
           hospitalName: data.hospital.name, hospitalPhone: data.hospital.phone,
           policeName: data.police.name, policePhone: data.police.phone,
           fireName: data.fire.name, firePhone: data.fire.phone,
         }));
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsLocating(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    try {
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: uploadData });
      if (res.ok) {
        const result = await res.json();
        const extractedAddress = result.address || formData.address;
        setFormData(prev => ({ ...prev, siteName: result.mhs || prev.siteName, customerName: result.name || prev.customerName, address: extractedAddress, systemSize: result.size || prev.systemSize }));
        
        if (extractedAddress) {
           locateEmergencyServices(extractedAddress);
        }
      }
    } finally {
      setIsParsing(false);
    }
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          phase, 
          customer_name: formData.customerName,
          engineer_name: engineer?.name || '',
          engineer_ic: engineer?.ic || '',
          engineer_phone: engineer?.phone || ''
        }),
      });
      if (!response.ok) throw new Error('Generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `${formData.siteName || 'MHS_Unknown'}_${formData.customerName || 'Customer'}_Site Acceptance Report V1.docx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Failed to generate document: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderVoltageInput = (name: string, label: string, imgKey: string) => (
    <div key={name} className="relative flex flex-col">
      <label className="block text-xs font-medium mb-1">{label}</label>
      <div className="flex rounded-md shadow-sm">
        <input name={name} value={formData[name] || ''} onChange={handleInputChange} className="input-field rounded-r-none flex-1" placeholder="Val" />
        <label className="inline-flex items-center justify-center px-3 border border-l-0 border-[hsl(var(--border))] rounded-r-md bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/0.2] cursor-pointer transition-colors text-[hsl(var(--primary))]">
          {ocrLoading === name ? <Loader2 className="animate-spin h-4 w-4" /> : <Camera className="h-4 w-4" />}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleOcrScan(name, imgKey, e)} />
        </label>
      </div>
      {formData[imgKey] && (
        <div className="mt-2 text-center">
          <img src={formData[imgKey]} alt="Multimeter capture" className="h-16 w-16 object-cover rounded-md border border-[hsl(var(--border))] mx-auto inline-block" />
        </div>
      )}
    </div>
  );

  const isNextDisabled = step === 1 && (isParsing || isLocating);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Installation Report</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Capture site data, OCR multimeter readings, and inject images.</p>
        </div>
        {engineer && (
          <div className="flex items-center text-sm font-medium bg-[hsl(var(--secondary))] px-3 py-1.5 rounded-full">
            <User className="w-4 h-4 mr-2 text-[hsl(var(--primary))]" /> {engineer.name}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-1 bg-[hsl(var(--border))] -z-10 -translate-y-1/2"></div>
        {[
          { num: 1, label: "Info" }, 
          { num: 2, label: "Pre-Install" }, 
          { num: 3, label: "Voltages" }, 
          { num: 4, label: "Photos" }, 
          { num: 5, label: "Generate" }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.num ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"}`}>
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span className="text-xs mt-2 font-medium hidden md:block">{s.label}</span>
          </div>
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 md:p-8 rounded-2xl">
        
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-[hsl(var(--secondary))] p-6 rounded-xl border border-[hsl(var(--primary))/0.3]">
              <h2 className="text-lg font-semibold mb-2">Upload Proposal PDF (Autofill)</h2>
              <label className="btn-primary cursor-pointer w-full sm:w-auto justify-center">
                {isParsing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                {isParsing ? "Scanning PDF..." : "Select Proposal PDF"}
                <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isParsing} />
              </label>
              {isLocating && (
                <p className="text-xs text-[hsl(var(--primary))] mt-4 flex items-center">
                  <MapPin className="h-3 w-3 mr-1 animate-bounce" /> Locating nearest emergency services via Google Maps...
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">MHS No</label><input name="siteName" value={formData.siteName} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Customer Name</label><input name="customerName" value={formData.customerName} onChange={handleInputChange} className="input-field" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Address</label><input name="address" value={formData.address} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">System Size (kWp)</label><input name="systemSize" value={formData.systemSize} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">PIC Onsite</label><input name="picName" value={formData.picName} onChange={handleInputChange} className="input-field bg-[hsl(var(--secondary))]" readOnly /></div>
              
              <div className="md:col-span-2 mt-4"><h3 className="text-lg font-semibold">Equipment</h3></div>
              <div><label className="block text-sm font-medium mb-1">Panel Quantity</label><input type="number" name="panelQty" value={formData.panelQty} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Panel Brand</label><input name="panelBrand" value={formData.panelBrand} onChange={handleInputChange} className="input-field" /></div>
              
              {formData.panelQty && (pvSpecs as any)[formData.panelQty] && (
                <div className="md:col-span-2 mt-2 bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.3)] rounded-lg p-4">
                  <h4 className="flex items-center text-sm font-bold text-[hsl(var(--primary))] mb-2"><Info className="w-4 h-4 mr-2"/> Required Equipment Specs (Auto-Detected for {formData.panelQty} PVs)</h4>
                  <ul className="text-sm space-y-1 text-[hsl(var(--foreground))]">
                    <li><strong>Inverter Size:</strong> {(pvSpecs as any)[formData.panelQty][0]} kW</li>
                    <li><strong>DC/AC Ratio:</strong> {(pvSpecs as any)[formData.panelQty][1]}</li>
                    <li><strong>AC Cable:</strong> {(pvSpecs as any)[formData.panelQty][2]}m</li>
                    <li><strong>DC Cable:</strong> {(pvSpecs as any)[formData.panelQty][3]}m</li>
                    <li><strong>Earth Cable:</strong> {(pvSpecs as any)[formData.panelQty][4]}m</li>
                    <li><strong>Data Cable:</strong> {(pvSpecs as any)[formData.panelQty][5]}m</li>
                    <li className="whitespace-pre-wrap mt-2 pt-2 border-t border-[hsl(var(--primary)/0.2)]"><strong>Components:</strong><br/>{(pvSpecs as any)[formData.panelQty][6]}</li>
                  </ul>
                </div>
              )}

              <div><label className="block text-sm font-medium mb-1">Inverter Brand</label><input name="inverterBrand" value={formData.inverterBrand} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Dongle S/N</label><input name="dongleSn" value={formData.dongleSn} onChange={handleInputChange} className="input-field" /></div>
            </div>

            <div className="md:col-span-2 mt-4 bg-[hsl(var(--secondary))] p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2"><Camera className="inline w-4 h-4 mr-2" /> Bulk Scan PV Serial Numbers (1-28 photos)</label>
                <input type="file" multiple accept="image/*" capture="environment" onChange={handleBulkSerialOcr} className="mb-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[hsl(var(--primary))] file:text-primary-foreground hover:file:bg-[hsl(var(--primary)/0.9)]" />
                
                {scannedSerials.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4 mt-4">
                    {scannedSerials.map((scan, idx) => (
                      <div key={idx} className="relative rounded bg-white dark:bg-black p-1 border overflow-hidden shadow-sm">
                        <img src={scan.url} alt="Serial" className="w-full h-20 object-cover rounded opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          {scan.status === 'loading' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
                          {scan.status === 'success' && <div className="text-center px-1"><CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1"/><span className="text-[10px] text-white font-mono break-all">{scan.serial}</span></div>}
                          {scan.status === 'error' && <div className="text-center"><span className="text-[10px] text-red-400 font-bold">{scan.serial}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {bulkOcrProgress > 0 && bulkOcrProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${bulkOcrProgress}%` }}></div>
                  </div>
                )}
                <label className="block text-sm font-medium mb-1 mt-2">Detected Serial Numbers</label>
                <textarea name="serialNumbers" value={formData.serialNumbers} onChange={handleInputChange} className="input-field min-h-[100px]" placeholder="Scanned numbers will appear here..." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Pre-Installation Safety & Prep</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { id: "img_toolbox", label: "Site Toolbox" },
                { id: "img_safety", label: "Safety Briefing & PPE" },
                { id: "img_inspection", label: "Equipment Inspection" },
                { id: "img_skylift", label: "Sky Lift Photos" }
              ].map((img) => (
                <div key={img.id} className={`border-2 border-dashed rounded-xl p-4 flex items-center ${formData[img.id] ? 'border-green-500 bg-green-500/5' : 'border-[hsl(var(--border))]'}`}>
                  {formData[img.id] ? (
                    <img src={formData[img.id]} alt={img.label} className="w-16 h-16 object-cover rounded-lg mr-4 border" />
                  ) : (
                    <div className="w-16 h-16 bg-[hsl(var(--secondary))] rounded-lg mr-4 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                      <Camera size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium block">{img.label}</span>
                    <label className="text-xs text-[hsl(var(--primary))] cursor-pointer font-bold mt-1 inline-block hover:underline">
                      {formData[img.id] ? "Change Photo" : "Upload Photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload(img.id)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold border-b border-[hsl(var(--border))] pb-2">Emergency Contacts</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Auto-located using Google Maps based on installation address.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium">Nearest Clinic</label><input name="clinicName" value={formData.clinicName} onChange={handleInputChange} className="input-field mb-1" placeholder="Name" /><input name="clinicPhone" value={formData.clinicPhone} onChange={handleInputChange} className="input-field" placeholder="Phone" /></div>
              <div><label className="block text-xs font-medium">Nearest Hospital</label><input name="hospitalName" value={formData.hospitalName} onChange={handleInputChange} className="input-field mb-1" placeholder="Name" /><input name="hospitalPhone" value={formData.hospitalPhone} onChange={handleInputChange} className="input-field" placeholder="Phone" /></div>
              <div><label className="block text-xs font-medium">Nearest Police</label><input name="policeName" value={formData.policeName} onChange={handleInputChange} className="input-field mb-1" placeholder="Name" /><input name="policePhone" value={formData.policePhone} onChange={handleInputChange} className="input-field" placeholder="Phone" /></div>
              <div><label className="block text-xs font-medium">Nearest Fire Station</label><input name="fireName" value={formData.fireName} onChange={handleInputChange} className="input-field mb-1" placeholder="Name" /><input name="firePhone" value={formData.firePhone} onChange={handleInputChange} className="input-field" placeholder="Phone" /></div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <label className="text-sm font-semibold">System Phase:</label>
              <select value={phase} onChange={(e) => setPhase(e.target.value)} className="input-field w-auto">
                <option value="1-Phase">1-Phase</option>
                <option value="3-Phase">3-Phase</option>
              </select>
            </div>

            <div className="bg-[hsl(var(--secondary))/0.5] p-4 rounded-xl mb-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center">
                <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                Tap the camera icon to snap a photo of the multimeter.
              </p>
            </div>

            <h3 className="font-semibold text-lg border-b border-[hsl(var(--border))] pb-2 mt-8">Voltage Readings (Post-Installation)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {phase === "1-Phase" ? (
                <>
                  {renderVoltageInput('1p_ltn', 'Line-Neutral', 'image_1p_ltn')}
                  {renderVoltageInput('1p_lte', 'Line-Earth', 'image_1p_lte')}
                  {renderVoltageInput('1p_nte', 'Neutral-Earth', 'image_1p_nte')}
                </>
              ) : (
                ['R-Y', 'R-B', 'Y-B', 'R-N', 'B-N', 'Y-N', 'R-E', 'Y-E', 'B-E', 'N-E'].map(v => renderVoltageInput(`v_${v.toLowerCase().replace('-', '')}_after`, v, `img_v_${v.toLowerCase().replace('-', '')}_after`))
              )}
              {renderVoltageInput('v_dc_string1', 'DC String 1', 'img_string1')}
              {renderVoltageInput('v_dc_string2', 'DC String 2', 'img_string2')}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Required 9 Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "img_sld", label: "1. Single Line Diagram" },
                { id: "img_pvlayout", label: "2. PV Layout" },
                { id: "img_array", label: "3. Solar Panel Array Layout" },
                { id: "img_ac_route", label: "4. AC Cable Route" },
                { id: "img_dc_route", label: "5. DC Cable Route" },
                { id: "img_inverter", label: "6. Inverter or Microinverter" },
                { id: "img_combiner", label: "7. Combiner Box" },
                { id: "img_interconnection", label: "8. Interconnection Point at DB" },
                { id: "img_housekeeping", label: "9. Housekeeping" }
              ].map((img) => (
                <div key={img.id} className={`border-2 border-dashed rounded-xl p-4 flex items-center ${formData[img.id] ? 'border-green-500 bg-green-500/5' : 'border-[hsl(var(--border))]'}`}>
                  {formData[img.id] ? (
                    <img src={formData[img.id]} alt={img.label} className="w-16 h-16 object-cover rounded-lg mr-4 border" />
                  ) : (
                    <div className="w-16 h-16 bg-[hsl(var(--secondary))] rounded-lg mr-4 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                      <Camera size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium block">{img.label}</span>
                    <label className="text-xs text-[hsl(var(--primary))] cursor-pointer font-bold mt-1 inline-block hover:underline">
                      {formData[img.id] ? "Change Photo" : "Upload Photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload(img.id)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-bold">Ready to Generate</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
              Images will be injected, voltages populated, and emergency contacts inserted.
            </p>
            <div className="flex justify-center mt-8">
              <button onClick={() => generateDocument()} disabled={isGenerating} className="btn-primary px-8">
                <FileText className="mr-2 h-5 w-5" />
                {isGenerating ? "Injecting & Generating..." : "Generate Site Acceptance Report"}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-4 border-t border-[hsl(var(--border))]">
          <button onClick={() => setStep(step - 1)} disabled={step === 1} className="px-4 py-2 text-sm font-medium disabled:opacity-50 transition-opacity">Back</button>
          {step < 5 && <button onClick={() => setStep(step + 1)} disabled={isNextDisabled} className="btn-primary">Continue <ChevronRight className="ml-1 h-4 w-4" /></button>}
        </div>
      </motion.div>
    </div>
  );
}
