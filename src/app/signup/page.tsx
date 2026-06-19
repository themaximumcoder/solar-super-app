"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    icNumber: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Automatically sign in after sign up
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ icNumber: formData.icNumber, password: formData.password }),
        });
        window.location.href = "/";
      } else {
        setError(data.message || "Failed to sign up");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4 relative overflow-hidden">
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
              <Sun size={32} />
            </div>
            <h1 className="text-2xl font-bold text-center">Engineer Sign Up</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm text-center mt-2">Register to generate installation reports</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="input-field" placeholder="e.g. HILMI" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="input-field" placeholder="012-3456789" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">IC Number</label>
              <input type="text" name="icNumber" value={formData.icNumber} onChange={handleInputChange} className="input-field" placeholder="e.g. 900101-14-5555" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="input-field" placeholder="••••••••" required />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-6">
              {isLoading ? "Registering..." : <><UserPlus className="w-4 h-4 mr-2" /> Sign Up</>}
            </button>
            <div className="text-center mt-4">
              <a href="/login" className="text-sm text-[hsl(var(--primary))] hover:underline">Already have an account? Sign In</a>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
