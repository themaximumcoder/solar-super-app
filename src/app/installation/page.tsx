"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, Upload, FileText, Loader2, Camera, Zap, MapPin, Layers } from "lucide-react";

export default function InstallationReport() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [phase, setPhase] = useState("3-Phase");
  const [ocrLoading, setOcrLoading] = useState<string>("");
  
  // Bulk OCR State
  const [isBulkOcrRunning, setIsBulkOcrRunning] = useState(false);
  const [bulkOcrProgress, setBulkOcrProgress] = useState(0);

  const [formData, setFormData] = useState<Record<string, string>>({
    siteName: "", customerName: "", address: "", systemSize: "", startDate: "", endDate: "", picName: "",
    panelQty: "", inverterSize: "", inverterSn: "", dongleSn: "", serialNumbers: "",
    v_ry_after: "", v_rb_after: "", v_yb_after: "", v_rn_after: "", v_bn_after: "", v_yn_after: "", v_re_after: "", v_ye_after: "", v_be_after: "", v_ne_after: "",
    v_ln_after: "", v_le_after: "", v_dc_string1: "", v_dc_string2: "",
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

  const handleOcrScan = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(field);
    const uploadData = new FormData();
    uploadData.append('file', file);
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: uploadData });
      if (res.ok) {
        const result = await res.json();
        if (result.voltage) {
          setFormData(prev => ({ ...prev, [field]: result.voltage }));
        } else {
          alert('Could not detect a clear number from the multimeter screen.');
        }
      }
    } catch (err) {
      alert('Error scanning multimeter.');
    } finally {
      setOcrLoading("");
    }
  };

  const handleBulkSerialOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsBulkOcrRunning(true);
    setBulkOcrProgress(0);
    const extractedSerials: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadData = new FormData();
      uploadData.append('file', file);
      try {
        const res = await fetch('/api/ocr', { method: 'POST', body: uploadData });
        if (res.ok) {
          const result = await res.json();
          if (result.text) {
             // Find sequences of 10+ uppercase letters/numbers (typical serials)
             const matches = result.text.match(/[A-Z0-9]{10,}/g);
             if (matches) extractedSerials.push(...matches);
          }
        }
      } catch (err) {
        console.error("OCR failed for file", file.name);
      }
      setBulkOcrProgress(Math.round(((i + 1) / files.length) * 100));
    }
    
    const uniqueSerials = Array.from(new Set(extractedSerials));
    const serialsString = uniqueSerials.join(', ');
    
    // Append to existing serials or overwrite
    const newSerials = formData.serialNumbers ? formData.serialNumbers + ', ' + serialsString : serialsString;
    setFormData(prev => ({ ...prev, serialNumbers: newSerials }));
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
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Site_Acceptance_Report.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Failed to generate document: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderVoltageInput = (name: string, label: string) => (
    <div key={name} className="relative">
      <label className="block text-xs font-medium mb-1">{label}</label>
      <div className="flex rounded-md shadow-sm">
        <input name={name} value={formData[name]} onChange={handleInputChange} className="input-field rounded-r-none flex-1" placeholder="Val" />
        <label className="inline-flex items-center justify-center px-3 border border-l-0 border-[hsl(var(--border))] rounded-r-md bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/0.2] cursor-pointer transition-colors text-[hsl(var(--primary))]">
          {ocrLoading === name ? <Loader2 className="animate-spin h-4 w-4" /> : <Camera className="h-4 w-4" />}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleOcrScan(name, e)} />
        </label>
      </div>
    </div>
  );

  const isNextDisabled = step === 1 && (isParsing || isLocating);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Installation Report</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Capture site data, OCR multimeter readings, and inject images.</p>
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
              <div><label className="block text-sm font-medium mb-1">PIC Onsite</label><input name="picName" value={formData.picName} onChange={handleInputChange} className="input-field" /></div>
              
              <div className="md:col-span-2 mt-4"><h3 className="text-lg font-semibold">Equipment</h3></div>
              <div><label className="block text-sm font-medium mb-1">Panel Quantity</label><input type="number" name="panelQty" value={formData.panelQty} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Inverter Size</label><input name="inverterSize" value={formData.inverterSize} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Inverter S/N</label><input name="inverterSn" value={formData.inverterSn} onChange={handleInputChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Dongle S/N</label><input name="dongleSn" value={formData.dongleSn} onChange={handleInputChange} className="input-field" /></div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl mt-8">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Layers className="mr-2 h-5 w-5 text-blue-500" /> Bulk Solar Panel OCR</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Upload 12-20 photos of solar panels to automatically extract all serial numbers at once.</p>
              
              <label className="btn-primary cursor-pointer w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700">
                {isBulkOcrRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                {isBulkOcrRunning ? `Extracting... ${bulkOcrProgress}%` : "Upload 12-20 Panel Photos"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleBulkSerialOcr} disabled={isBulkOcrRunning} />
              </label>

              {formData.serialNumbers && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Extracted Serial Numbers</label>
                  <textarea name="serialNumbers" value={formData.serialNumbers} onChange={(e) => setFormData(prev => ({ ...prev, serialNumbers: e.target.value }))} rows={3} className="input-field font-mono text-xs" />
                </div>
              )}
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
                  {renderVoltageInput('v_ln_after', 'Line-Neutral')}
                  {renderVoltageInput('v_le_after', 'Line-Earth')}
                </>
              ) : (
                ['R-Y', 'R-B', 'Y-B', 'R-N', 'B-N', 'Y-N', 'R-E', 'Y-E', 'B-E', 'N-E'].map(v => renderVoltageInput(`v_${v.toLowerCase().replace('-', '')}_after`, v))
              )}
              {renderVoltageInput('v_dc_string1', 'DC String 1')}
              {renderVoltageInput('v_dc_string2', 'DC String 2')}
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
