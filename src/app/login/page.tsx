"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [icNumber, setIcNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icNumber, password }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Invalid IC Number or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
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
              <Sun size={32} />
            </div>
            <h1 className="text-2xl font-bold text-center">SolarOS Portal</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm text-center mt-2">Sign in to access the engineering tools</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">IC Number</label>
              <input 
                type="text"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value)}
                className="input-field"
                placeholder="Enter IC Number (e.g. 900101-14-5555)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full mt-6"
            >
              {isLoading ? "Authenticating..." : (
                <>
                  <Lock className="w-4 h-4 mr-2" /> Sign In
                </>
              )}
            </button>
            <div className="text-center mt-4">
              <a href="/signup" className="text-sm text-[hsl(var(--primary))] hover:underline">Don't have an account? Sign Up</a>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
