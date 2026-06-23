"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, CheckCircle2, User, Phone } from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [formData, setFormData] = useState({ icNumber: "", phone: "", newPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[hsl(var(--primary)/0.2)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[hsl(var(--primary)/0.15)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[hsl(var(--primary)/0.1)] rounded-full flex items-center justify-center mb-4 border border-[hsl(var(--primary)/0.2)]">
              <KeyRound className="w-8 h-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-orange-400 bg-clip-text text-transparent">Reset Password</h1>
            <p className="text-[hsl(var(--muted-foreground))] mt-2 text-center text-sm">Verify your identity to create a new password</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">{error}</div>}
          
          {success ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Password Reset Successful!</h2>
              <p className="text-[hsl(var(--muted-foreground))]">Redirecting you to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">IC Number (Without dashes)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.icNumber}
                    onChange={(e) => setFormData({...formData, icNumber: e.target.value})}
                    className="input-field pl-10 bg-[hsl(var(--background)/0.5)]" 
                    placeholder="e.g. 950101145332"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Registered Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input-field pl-10 bg-[hsl(var(--background)/0.5)]" 
                    placeholder="e.g. 0123456789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    className="input-field pl-10 bg-[hsl(var(--background)/0.5)]" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="btn-primary w-full mt-6"
              >
                {isLoading ? "Verifying..." : "Reset Password"}
              </button>
              <div className="text-center mt-4">
                <a href="/login" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">Back to Sign In</a>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
