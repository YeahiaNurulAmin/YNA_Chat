import * as Clerk from "@clerk/react";
import { useState } from "react";
import { motion } from "motion/react";
import { YNALogo } from "./ui/YNALogo";

const { SignIn, SignUp, useAuth } = Clerk;

interface AuthPageProps {
  onLogin?: () => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  
  // Mock handler for preview mode
  const handleMockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.();
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Cyber Neon Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <YNALogo className="w-20 h-20 mb-4" />
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-1 italic"
          >
            YNA CHAT
          </motion.h1>
          <p className="text-slate-400 font-medium tracking-widest text-[10px] uppercase">Neural Protocol v4.2</p>
        </div>

        <div className="relative group">
          {/* Animated Border Gradient */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x" />
          
          <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="p-6 md:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {isSignIn ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {isSignIn ? "Enter your credentials to access the grid" : "Join the secure YNA network"}
                  </p>
                </div>

                {/* Social Logins */}
                <div className="grid grid-cols-3 gap-3">
                  {['google', 'facebook', 'twitter'].map((platform) => (
                    <button 
                      key={platform}
                      onClick={onLogin}
                      className="flex items-center justify-center p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-700/50 transition-all group"
                    >
                      <div className="w-5 h-5 bg-slate-400 group-hover:bg-cyan-400 transition-colors rounded-sm" />
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-800"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <form onSubmit={handleMockLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="neon@yna.io"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all active:scale-[0.98]"
                  >
                    {isSignIn ? "SIGN IN" : "SIGN UP"}
                  </button>
                </form>
              </div>

              {/* Custom Toggle Footer */}
              <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <button 
                  onClick={() => setIsSignIn(!isSignIn)}
                  className="text-slate-400 text-sm hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  {isSignIn ? (
                    <>Don't have an account? <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs">Sign In</span></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <p className="mt-8 text-center text-slate-500 text-[10px] uppercase tracking-[0.2em]">
          Encrypted by YNA Protocol v2.4.0
        </p>
      </motion.div>
    </div>
  );
}
