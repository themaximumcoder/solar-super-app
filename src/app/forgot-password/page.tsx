"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [icNumber, setIcNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icNumber, phone, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--primary))/0.1] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 rounded-2xl relative z-10 border border-[hsl(var(--border))]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[hsl(var(--primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--primary))] mb-4 shadow-inner">
              <KeyRound size={32} />
            </div>
            <h1 className="text-2xl font-bold text-center">Reset Password</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm text-center mt-2">Verify your identity to create a new password</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg text-center">
                {success}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">IC Number</label>
              <input 
                type="text"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value.replace(/-/g, ''))}
                className="input-field"
                placeholder="Enter IC Number (e.g. 900101145555)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Registered Phone Number</label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="Enter Phone Number (e.g. 0123456789)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !!success}
              className="btn-primary w-full mt-6"
            >
              {isLoading ? "Verifying..." : "Reset Password"}
            </button>
            
            <div className="text-center mt-6">
              <Link href="/login" className="inline-flex items-center text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
