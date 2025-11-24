
import React, { useEffect, useRef, useState } from 'react';
import { 
  Zap, ArrowRight, CheckCircle, Play, 
  Cpu, Globe, Shield, Activity, MousePointer2, 
  Layers, Search, Database, ChevronDown, Hexagon,
  Eye, Target
} from 'lucide-react';

interface Props {
  onEnterApp: () => void;
}

// --- UTILITY COMPONENTS ---

const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay" 
       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
  </div>
);

const NeonButton = ({ children, primary = false, onClick }: { children: React.ReactNode, primary?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`
      relative group px-8 py-4 rounded-xl font-bold text-sm tracking-wide overflow-hidden transition-all duration-300
      ${primary 
        ? 'bg-transparent border border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]' 
        : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'}
    `}
  >
    {primary && (
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-20 group-hover:opacity-40 transition-opacity" />
    )}
    <span className="relative z-10 flex items-center gap-2">{children}</span>
  </button>
);

// --- SECTIONS ---

const Navbar = ({ scrollY, onEnterApp }: { scrollY: number, onEnterApp: () => void }) => (
  <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 20 ? 'py-4 bg-black/80 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
    <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="relative w-10 h-10 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-xl overflow-hidden group-hover:border-purple-500/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Hexagon className="w-5 h-5 text-purple-400 relative z-10" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">LeadGen<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">.AI</span></span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <a href="#features" className="hover:text-white transition-colors">Intelligence</a>
        <a href="#engine" className="hover:text-white transition-colors">The Engine</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onEnterApp} className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">Log In</button>
        <button 
          onClick={onEnterApp}
          className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:scale-105 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          Book Demo
        </button>
      </div>
    </div>
  </nav>
);

const Hero = ({ onEnterApp }: { onEnterApp: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 20; // Max rotation deg
      const y = (e.clientY / innerHeight - 0.5) * 20;
      
      containerRef.current.style.setProperty('--rot-x', `${-y}deg`);
      containerRef.current.style.setProperty('--rot-y', `${x}deg`);
    };
    
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Text Content */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 backdrop-blur-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Gen 3.0 Intelligence is Live
           </div>
           
           <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[0.9]">
              Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient-x">
                 Lead Gen
              </span>
           </h1>
           
           <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
              Stop searching. Start closing. The world's first God-Eye AI engine that scans, verifies, and enriches leads in real-time.
           </p>

           <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <NeonButton primary onClick={onEnterApp}>
                 Start Free Scan <ArrowRight className="w-4 h-4" />
              </NeonButton>
              <NeonButton onClick={onEnterApp}>
                 <Play className="w-4 h-4 fill-current" /> Watch Demo
              </NeonButton>
           </div>

           <div className="flex items-center gap-4 text-sm text-zinc-500 pt-8">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] text-white">
                       AI
                    </div>
                 ))}
              </div>
              <p>Trusted by 4,000+ Agencies</p>
           </div>
        </div>

        {/* 3D Holographic Element */}
        <div 
           ref={containerRef}
           className="relative h-[600px] w-full hidden lg:flex items-center justify-center perspective-1000"
        >
           <div 
             className="relative w-[500px] h-[600px] preserve-3d transition-transform duration-100 ease-out"
             style={{ transform: 'rotateX(var(--rot-x)) rotateY(var(--rot-y))' }}
           >
              {/* Floating Cards simulating AI Analysis */}
              <GlassCard 
                className="absolute top-[20%] left-0 w-64 z-20 animate-float"
                icon={Search}
                title="Deep Discovery"
                value="24.5k Leads"
                color="text-blue-400"
                delay={0}
              />
              <GlassCard 
                className="absolute top-[40%] right-[-10%] w-64 z-30 animate-float"
                icon={Shield}
                title="Verification"
                value="99.9% Valid"
                color="text-emerald-400"
                delay={2}
                style={{ animationDelay: '2s' }}
              />
              <GlassCard 
                className="absolute bottom-[20%] left-[10%] w-64 z-20 animate-float"
                icon={Zap}
                title="Auto Outreach"
                value="45% Reply Rate"
                color="text-purple-400"
                delay={1}
                style={{ animationDelay: '1s' }}
              />

              {/* Central Abstract Orb (CSS Generated) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 z-10">
                 <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-[spin_10s_linear_infinite]"></div>
                 <div className="absolute inset-4 rounded-full border border-blue-500/30 animate-[spin_15s_linear_infinite_reverse]"></div>
                 <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-full blur-xl animate-pulse"></div>
                 {/* Core */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 backdrop-blur-md rounded-full border border-white/20 shadow-[0_0_50px_rgba(168,85,247,0.4)] flex items-center justify-center">
                    <Globe className="w-16 h-16 text-white opacity-80 animate-pulse" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

const GlassCard = ({ className, icon: Icon, title, value, color, delay, style }: any) => (
  <div 
    className={`bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl flex items-center gap-4 hover:bg-zinc-800/40 transition-colors ${className}`}
    style={{ transform: `translateZ(${delay * 30 + 50}px)`, ...style }}
  >
     <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
        <Icon className="w-6 h-6" />
     </div>
     <div>
        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
     </div>
  </div>
);

const FeatureScroll = () => {
  const features = [
    {
      title: "God Eye Scanning",
      desc: "Our AI doesn't just search. It reads. It analyzes website content, news, and filings to build a 360° profile.",
      icon: Eye,
      color: "from-purple-500 to-indigo-500"
    },
    {
      title: "Predictive Scoring",
      desc: "Stop guessing. We score every lead 0-100 based on fit, intent signals, and recent growth activity.",
      icon: Target,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Autonomous Outreach",
      desc: "The AI writes, personalizes, and sends emails that actually get read. It learns from every reply.",
      icon: Layers,
      color: "from-emerald-500 to-teal-500"
    }
  ];

  return (
    <section id="features" className="py-32 bg-zinc-950 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Intelligence <br/> Beyond Data.</h2>
          <div className="h-1 w-20 bg-purple-500 rounded-full"></div>
        </div>

        <div className="space-y-32">
           {features.map((feat, i) => (
              <div key={i} className={`flex flex-col md:flex-row items-center gap-16 group ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                 {/* Text Side */}
                 <div className="flex-1 space-y-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} p-0.5`}>
                       <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                          <feat.icon className="w-6 h-6 text-white" />
                       </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{feat.title}</h3>
                    <p className="text-lg text-zinc-400 leading-relaxed">{feat.desc}</p>
                    <button className="text-sm font-bold text-white flex items-center gap-2 hover:gap-4 transition-all">
                       Learn more <ArrowRight className="w-4 h-4 text-purple-500" />
                    </button>
                 </div>

                 {/* Visual Side */}
                 <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden aspect-[4/3] group-hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
                       <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:30px_30px]"></div>
                       {/* Abstract Representation */}
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-32 h-32 rounded-full bg-gradient-to-tr ${feat.color} opacity-20 blur-xl animate-pulse`}></div>
                          <div className="glass-panel p-8 rounded-2xl border border-white/20 backdrop-blur-md">
                             <feat.icon className="w-16 h-16 text-white opacity-80" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </section>
  );
};

const VisualDemo = () => (
  <section id="engine" className="py-32 relative overflow-hidden bg-black">
     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black"></div>
     
     <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">The Engine</h2>
        
        {/* Holographic Radar Simulation */}
        <div className="w-full max-w-4xl mx-auto aspect-video bg-zinc-900/50 rounded-3xl border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] group">
           {/* Grid Background */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
           
           {/* Scanning Line */}
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500/0 via-purple-500/10 to-purple-500/0 animate-[scan_3s_linear_infinite]"></div>

           {/* Central Node */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-24 h-24 bg-purple-500 rounded-full blur-[50px] opacity-40 animate-pulse"></div>
              <div className="relative w-16 h-16 bg-black border border-purple-500 rounded-full flex items-center justify-center z-10">
                 <Cpu className="w-8 h-8 text-white" />
              </div>
           </div>

           {/* Floating Nodes */}
           {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-3 h-3 bg-white rounded-full animate-ping"
                style={{
                   top: `${20 + Math.random() * 60}%`,
                   left: `${20 + Math.random() * 60}%`,
                   animationDuration: `${2 + Math.random() * 3}s`,
                   animationDelay: `${Math.random()}s`
                }}
              />
           ))}

           {/* Data Cards appearing */}
           <div className="absolute top-10 right-10 bg-black/80 backdrop-blur border border-green-500/30 text-green-400 text-xs font-mono px-3 py-1 rounded animate-pulse">
              SIGNAL DETECTED: HIGH INTENT
           </div>
           <div className="absolute bottom-10 left-10 bg-black/80 backdrop-blur border border-blue-500/30 text-blue-400 text-xs font-mono px-3 py-1 rounded">
              ENRICHING PROFILE...
           </div>
        </div>
     </div>
  </section>
);

const BenefitCard = ({ icon: Icon, title, desc }: any) => (
  <div className="p-8 rounded-2xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-900/60 hover:border-purple-500/30 transition-all duration-300 group">
     <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
        <Icon className="w-6 h-6 text-zinc-400 group-hover:text-purple-400 transition-colors" />
     </div>
     <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
     <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
  </div>
);

const Benefits = () => (
  <section className="py-32 px-6 bg-zinc-950">
     <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <BenefitCard icon={Database} title="Infinite Data" desc="Access 500M+ verified contacts across the globe instantly." />
           <BenefitCard icon={Shield} title="Zero Bounces" desc="Real-time SMTP verification ensures you never hit a dead inbox." />
           <BenefitCard icon={Activity} title="Live Intent" desc="Identify companies currently hiring, funding, or researching." />
           <BenefitCard icon={Globe} title="Global Scale" desc="Works in 180+ countries with local language support." />
           <BenefitCard icon={Cpu} title="API Access" desc="Connect directly to your CRM with our high-throughput API." />
           <BenefitCard icon={CheckCircle} title="GDPR Ready" desc="Fully compliant data sourcing and processing." />
        </div>
     </div>
  </section>
);

const CTA = ({ onEnterApp }: { onEnterApp: () => void }) => (
  <section className="py-32 px-6 relative overflow-hidden">
     <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black"></div>
     
     <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
           Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Dominate?</span>
        </h2>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
           Join the elite agencies and sales teams using God Eye technology.
        </p>
        <div className="pt-8">
           <NeonButton primary onClick={onEnterApp}>
              Get Started Now
           </NeonButton>
        </div>
     </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 px-6 bg-black border-t border-white/5 text-center">
     <div className="flex items-center justify-center gap-2 mb-8 opacity-50">
        <Hexagon className="w-6 h-6 text-white" />
        <span className="font-bold text-xl text-white">LeadGen.AI</span>
     </div>
     <div className="flex justify-center gap-8 text-sm text-zinc-500 mb-8">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
        <a href="#" className="hover:text-white transition-colors">Twitter</a>
        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
     </div>
     <p className="text-xs text-zinc-700">© 2024 LeadGen AI Inc. All rights reserved.</p>
  </footer>
);

// --- MAIN PAGE ---

const LandingPage: React.FC<Props> = ({ onEnterApp }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-x-hidden">
      <NoiseOverlay />
      <Navbar scrollY={scrollY} onEnterApp={onEnterApp} />
      <Hero onEnterApp={onEnterApp} />
      <FeatureScroll />
      <VisualDemo />
      <Benefits />
      <CTA onEnterApp={onEnterApp} />
      <Footer />
      
      {/* Global Animation Styles */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 8s ease infinite; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
    