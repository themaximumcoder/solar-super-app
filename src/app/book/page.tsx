"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, CheckCircle } from "lucide-react";

export default function BookConsultation() {
  const [formData, setFormData] = useState({
    customerName: "",
    contactInfo: "",
    address: "",
    issueDescription: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to submit request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4 relative overflow-hidden">
        {/* Background Ornaments */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--primary))/0.1] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center glass-panel p-8 rounded-2xl border border-green-500/20">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Request Submitted!</h1>
            <p className="text-[hsl(var(--muted-foreground))]">
              Thank you for reaching out to AI Solar. Our engineers have been notified and will contact you shortly to confirm your site visit/consultation.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary mt-8">Submit Another Request</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--primary))/0.1] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="glass-panel p-8 rounded-2xl relative z-10 border border-[hsl(var(--border))]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[hsl(var(--primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--primary))] mb-4 shadow-inner">
              <Sun size={32} />
            </div>
            <h1 className="text-2xl font-bold text-center">Book a Consultation</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm text-center mt-2">Request a site visit or consultation from our expert solar engineers.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input 
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Info (Phone or Email)</label>
              <input 
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 012-3456789 or john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Site Address</label>
              <input 
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
                placeholder="Where do you need the installation/visit?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">How can we help?</label>
              <textarea 
                name="issueDescription"
                value={formData.issueDescription}
                onChange={handleChange}
                className="input-field min-h-[100px] resize-y"
                placeholder="Describe your solar needs, current issues, or what you'd like to consult about..."
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full mt-6"
            >
              {isSubmitting ? "Submitting..." : "Send Request"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
