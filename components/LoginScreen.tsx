
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../lib/db';
import { Zap, Mail, ArrowRight, ShieldCheck, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    // Check if Google script is loaded
    const initializeGoogleBtn = () => {
      // @ts-ignore
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: '750825291986-7hvotl4hiutemn60ae35u4qfit682ohv.apps.googleusercontent.com',
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const btn = document.getElementById("google-btn-container");
        if (btn) {
           google.accounts.id.renderButton(btn, { theme: "outline", size: "large", width: "100%", text: "continue_with" });
        }
      }
    };

    // Retry if script isn't loaded immediately
    const timer = setTimeout(initializeGoogleBtn, 100);
    return () => clearTimeout(timer);
  }, [isSignUp]); // Re-render button if toggling, though usually it stays in DOM

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      // Decode JWT Token (Simple decode for client-side usage)
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);

      // Check if user exists to merge or create
      const existing = await db.getUserByEmail(payload.email);
      
      let googleUser: User;
      
      if (existing) {
         // Merge google provider info if needed, but keep existing ID
         googleUser = { ...existing, avatar: payload.picture, lastLogin: new Date().toISOString() };
      } else {
         googleUser = {
           id: `user-google-${payload.sub}`,
           name: payload.name,
           email: payload.email,
           role: 'Admin', // Default role for new signups
           status: 'Active',
           lastLogin: new Date().toISOString(),
           avatar: payload.picture,
           provider: 'google',
           usage: { scans: 0, leads: 0 }
         };
      }

      await db.saveUser(googleUser);
      await db.saveSession(googleUser);
      onLogin(googleUser);
    } catch (error) {
      console.error("Google Auth Error", error);
      setError("Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && (!name || password !== confirmPassword)) {
       setError("Please check your input.");
       return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
       let user: User;
       
       if (isSignUp) {
          if (password.length < 8) throw new Error("Password must be at least 8 characters.");
          user = await db.registerUser(name, email, password);
       } else {
          user = await db.loginUser(email, password);
       }

       await db.saveSession(user);
       onLogin(user);
    } catch (e: any) {
       console.error(e);
       setError(e.message || "Authentication failed.");
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black text-white relative overflow-hidden">
       
       {/* Left Panel - Visuals */}
       <div className="hidden lg:flex flex-1 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
          <div className="relative z-10 max-w-lg space-y-8 animate-in fade-in slide-in-from-left duration-700">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/20">
                <Zap className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-5xl font-bold tracking-tight leading-tight">
                Turn Internet Data into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Revenue.</span>
             </h1>
             <p className="text-xl text-zinc-400 leading-relaxed">
                Join 10,000+ sales teams using the world's most advanced AI lead generation and enrichment engine.
             </p>
             
             <div className="grid grid-cols-2 gap-4 pt-8">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                   <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                   <h3 className="font-semibold text-zinc-200">Verified Data</h3>
                   <p className="text-sm text-zinc-500">99.9% accuracy guarantee</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                   <Zap className="w-6 h-6 text-amber-400 mb-2" />
                   <h3 className="font-semibold text-zinc-200">Instant Outreach</h3>
                   <p className="text-sm text-zinc-500">Connect in one click</p>
                </div>
             </div>
          </div>
       </div>

       {/* Right Panel - Auth Form */}
       <div className="flex-1 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
             <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="text-zinc-400">Enter your credentials to access the command center.</p>
             </div>

             <div className="space-y-4">
                
                {/* Real Google Button Container */}
                <div className="w-full h-[44px]" id="google-btn-container"></div>
                
                {/* Fallback loading indicator if script hasn't loaded */}
                <div id="google-loader" className="hidden text-center text-xs text-zinc-500">Loading Secure Auth...</div>

                <div className="relative">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                   <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-zinc-500">Or continue with email</span></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                   {isSignUp && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                            <input 
                              type="text" 
                              required={isSignUp}
                              value={name}
                              onChange={e => setName(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              placeholder="John Doe"
                            />
                        </div>
                      </div>
                   )}

                   <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                         <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="you@company.com"
                         />
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                      <div className="relative">
                         <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                         <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                         />
                      </div>
                   </div>

                   {isSignUp && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                         <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm Password</label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                            <input 
                               type="password" 
                               required={isSignUp}
                               value={confirmPassword}
                               onChange={e => setConfirmPassword(e.target.value)}
                               className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                               placeholder="••••••••"
                            />
                         </div>
                      </div>
                   )}
                   
                   {error && (
                      <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                         <AlertCircle className="w-4 h-4" />
                         {error}
                      </div>
                   )}

                   <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
                   >
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                         <>
                            {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                         </>
                      )}
                   </button>
                </form>
             </div>

             <div className="text-center text-sm text-zinc-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                   onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
                   className="text-blue-400 hover:text-blue-300 font-medium ml-1"
                >
                   {isSignUp ? 'Log in' : 'Sign up for free'}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default LoginScreen;
