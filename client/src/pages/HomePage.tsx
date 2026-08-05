import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Users,
  Search,
  X,
  Play,
  Cpu,
  Lock,
  Layers,
  Database,
  Sparkles,
  Check,
  Mail,
  Activity,
  FileCheck,
} from 'lucide-react';
import { ShinyText } from '../components/ui/ShinyText';
import { DecryptedText } from '../components/ui/DecryptedText';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { BorderBeam } from '../components/ui/BorderBeam';
import { Magnet } from '../components/ui/Magnet';

export const HomePage: React.FC = () => {
  // Navigation & Interactive States
  const [activePreviewTab, setActivePreviewTab] = useState<'student' | 'guide' | 'expert' | 'admin'>('student');
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<number>(0);
  const [activeJourneyStep, setActiveJourneyStep] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Hero Sandbox Simulator State
  const [selectedDemoType, setSelectedDemoType] = useState<'grid' | 'sensor' | 'cipher'>('grid');
  const [simulatorStatus, setSimulatorStatus] = useState<'READY' | 'SCANNING' | 'COMPILING' | 'COMPLETE'>('READY');
  const [simulatorProgress, setSimulatorProgress] = useState(0);

  // AI Showcase Chat State
  const [selectedShowcasePrompt, setSelectedShowcasePrompt] = useState<'abstract' | 'claims' | 'novelty'>('abstract');
  const [showcaseResponse, setShowcaseResponse] = useState('');
  const [showcaseTyping, setShowcaseTyping] = useState(false);

  // Statistics counters
  const [statsCounters, setStatsCounters] = useState({
    ideas: 0,
    accuracy: 0,
    institutions: 0,
    documents: 0,
    aiScore: 0,
    experts: 0,
  });

  // Dynamic counter incrementer on page load
  useEffect(() => {
    const duration = 1500;
    const intervalTime = 30;
    const steps = duration / intervalTime;

    const targets = {
      ideas: 15000,
      accuracy: 98,
      institutions: 300,
      documents: 25000,
      aiScore: 95,
      experts: 40,
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setStatsCounters({
        ideas: Math.min(targets.ideas, Math.round((targets.ideas / steps) * step)),
        accuracy: Math.min(targets.accuracy, Math.round((targets.accuracy / steps) * step)),
        institutions: Math.min(targets.institutions, Math.round((targets.institutions / steps) * step)),
        documents: Math.min(targets.documents, Math.round((targets.documents / steps) * step)),
        aiScore: Math.min(targets.aiScore, Math.round((targets.aiScore / steps) * step)),
        experts: Math.min(targets.experts, Math.round((targets.experts / steps) * step)),
      });

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Run simulator progress on change of demo type
  useEffect(() => {
    setSimulatorStatus('SCANNING');
    setSimulatorProgress(0);
    const interval = setInterval(() => {
      setSimulatorProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSimulatorStatus('COMPILING');
          setTimeout(() => {
            setSimulatorStatus('COMPLETE');
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [selectedDemoType]);

  // AI Showcase Text typing effect
  useEffect(() => {
    setShowcaseTyping(true);
    setShowcaseResponse('');
    let targetText = '';

    if (selectedShowcasePrompt === 'abstract') {
      targetText = "An autonomous energy distribution mesh operating via secure ledger route hashes. The module monitors current variables dynamically to optimize line transfers, reducing line propagation latency by up to 28%...";
    } else if (selectedShowcasePrompt === 'claims') {
      targetText = "Claim 1 (Independent): A decentralized control mesh comprising a node router, a load sensor, and an authorization log module. Claim 2 (Dependent): The mesh of claim 1 wherein nodes coordinate hashes...";
    } else {
      targetText = "Overlap Diagnostics Assessment: Scanned USPTO and WIPO registries. Match probability: 12% (Low risk). Highlighted overlap with WIPO-2025-A regarding dynamic routing loops. Recommended bypass: emphasize ledger routing nodes.";
    }

    let i = 0;
    const typingInterval = setInterval(() => {
      setShowcaseResponse((prev) => prev + targetText.charAt(i));
      i++;
      if (i >= targetText.length) {
        clearInterval(typingInterval);
        setShowcaseTyping(false);
      }
    }, 15);

    return () => clearInterval(typingInterval);
  }, [selectedShowcasePrompt]);

  // Journey steps
  const journeyStages = [
    { id: 'idea', title: 'Idea Disclosure', desc: 'Inventor submits raw concepts, abstracts, and keywords.' },
    { id: 'research', title: 'Prior Literature Research', desc: 'Scan research publications and academic resources.' },
    { id: 'prior-art', title: 'Prior Art Search', desc: 'Automated deep search scans across global patent registries.' },
    { id: 'ai-draft', title: 'AI Claim Drafting', desc: 'Auto-compile independent and dependent claims schemas.' },
    { id: 'review', title: 'Guide Annotations', desc: 'Faculty guides audit specifications and write review logs.' },
    { id: 'expert', title: 'Patent Expert Audit', desc: 'Legal experts perform overlap checks and novelty audits.' },
    { id: 'docs', title: 'IPO Forms Compilation', desc: 'Dynamic builder compiles forms 1, 2, 3, 5, and 26 packages.' },
    { id: 'filing', title: 'Patent Filing Preparation', desc: 'Verified application packets generated and ready to submit.' },
  ];

  // Features list
  const features = [
    {
      title: 'AI Patent Assistant',
      desc: 'Draft descriptions, generate claims trees, formulate precise titles, and write legal summaries with domain-optimized models.',
      icon: Sparkles,
      tag: 'Generative AI'
    },
    {
      title: 'Multi-Role Collaboration',
      desc: 'Connected workspaces routing inventors, co-inventors, faculty guides, and legal experts dynamically based on roles.',
      icon: Users,
      tag: 'Workflow Orchestration'
    },
    {
      title: 'Smart Drafting Editor',
      desc: 'Autosaving spec sheets with compliance check meters, revision history logging, and pre-formatted IPO template compilers.',
      icon: FileText,
      tag: 'Compliance Editor'
    },
    {
      title: 'AI Novelty Diagnostics',
      desc: 'Run similarity assessments, identify citation overlaps, evaluate infringement risks, and suggest improvements.',
      icon: Search,
      tag: 'Infringement Risk'
    },
    {
      title: 'Structured Workspaces',
      desc: 'Central dashboard keeping stage indicators, document directories, milestones checklist, and timeline logs organized.',
      icon: Layers,
      tag: 'Project Board'
    },
    {
      title: 'Admin Control Hub',
      desc: 'Global university and incubator consoles to invite guides, query user directories, and track intellectual property assets.',
      icon: Cpu,
      tag: 'Institutional Panel'
    }
  ];

  // AI Modules list
  const aiModules = [
    { name: 'AI Abstract Generator', icon: Sparkles, desc: 'Compiles technical disclosures into professional abstracts.' },
    { name: 'Prior Art Search', icon: Search, desc: 'Scans USPTO, WIPO, and IPO database records semantic matches.' },
    { name: 'Novelty Analyzer', icon: Activity, desc: 'Generates detailed overlap diagnostics reports.' },
    { name: 'Claim Generator', icon: Layers, desc: 'Constructs legally-defensible patent claim trees.' },
    { name: 'Patent Insights', icon: Database, desc: 'Aggregates sector trends and overlapping classification tags.' },
    { name: 'Document Intelligence', icon: FileCheck, desc: 'Extracts claims structure from research drafts.' },
    { name: 'Drawing Generator', icon: Cpu, desc: 'Transforms sketches into compliant technical line drawings.' },
    { name: 'Patent Chat Assistant', icon: Users, desc: 'Interactive chat interface to optimize drafting compliance.' },
  ];

  // FAQ list
  const faqs = [
    { q: 'What is PatentHub AI?', a: 'PatentHub AI is an enterprise-grade collaborative workspace designed to streamline patent preparation from concept drafting to filing-ready IPO package compilation.' },
    { q: 'Who can use the platform?', a: 'Engineering universities, research laboratories, individual inventors, co-inventors, and faculty guides.' },
    { q: 'Does it file patents automatically?', a: 'It compiles pre-populated, official IPO Forms 1, 2, 3, 5, and 26 specification PDFs. Users download these for agent signature and submission.' },
    { q: 'How does AI similarity checking work?', a: 'It runs semantic models comparing your disclosure texts with USPTO/WIPO data records to calculate overlap indicators.' },
    { q: 'Can multiple inventors collaborate?', a: 'Yes. Inventors can invite co-inventors and faculty supervisors to review drafts, complete tasks, and sign off on timeline stages.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-650 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Mesh Grid & Floating Blur Spheres */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40 -z-10" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />

      {/* 1. GLASS STICKY NAVBAR */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 transition-all duration-300 pointer-events-none">
        <nav className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs rounded-full px-6 py-2.5 flex items-center justify-between pointer-events-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group font-heading">
            <span className="font-extrabold text-lg tracking-tight text-slate-955 lowercase">
              patenthub<span className="text-cyan-500 font-extrabold">.</span>
            </span>
          </Link>

          {/* Links */}
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <a href="#hero" className="hover:text-indigo-650 transition-colors">Home</a>
            <a href="#timeline" className="hover:text-indigo-650 transition-colors">Workflow</a>
            <a href="#features" className="hover:text-indigo-650 transition-colors">Features</a>
            <a href="#showcase" className="hover:text-indigo-650 transition-colors">AI Showcase</a>
            <a href="#faq" className="hover:text-indigo-650 transition-colors">FAQ</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors">
              Log In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-xs font-extrabold bg-slate-950 hover:bg-slate-900 text-white rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section id="hero" className="pt-16 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Side Info */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 shadow-3xs tracking-wider uppercase">
            ✦ <DecryptedText text="Institutional Patent Collaboration Sandbox" speed={30} sequential={true} />
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-955 tracking-tight leading-[1.08] font-heading">
            Transform Ideas into <br />
            <ShinyText text="Patents with AI" speed={4} className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-indigo-600 to-cyan-500" />
          </h1>

          <p className="text-sm sm:text-base text-slate-655 leading-relaxed font-semibold max-w-xl">
            PatentHub-AI helps innovators, students, researchers, and patent experts collaborate, draft, analyze, and prepare patent applications from idea to filing using intelligent AI assistance.
          </p>

          <div className="flex flex-wrap gap-3.5 pt-2">
            <Magnet magnetStrength={0.25}>
              <Link
                to="/register"
                className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-full transition-all shadow-md cursor-pointer hover:-translate-y-0.5 inline-block animate-bounce-slow"
              >
                Get Started
              </Link>
            </Magnet>
            <Magnet magnetStrength={0.2}>
              <button
                onClick={() => setShowVideoModal(true)}
                className="px-7 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-extrabold rounded-full transition-all shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-indigo-650 animate-pulse" />
                <span>Explore Demo</span>
              </button>
            </Magnet>
          </div>

          {/* Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 max-w-md">
            {[
              { text: 'AI Powered Drafting', label: '✓ AI Powered' },
              { text: 'Secured Concept Sandboxes', label: '✓ Secure' },
              { text: 'Indian IPO Forms Output', label: '✓ Patent Ready' },
              { text: 'Academic Role-routing', label: '✓ Multi-Role Sandbox' }
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Visual Component (Interactive Live Mockup Workspace) */}
        <div className="lg:col-span-6 relative">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-1 shadow-2xl relative overflow-hidden transition-all duration-350 hover:border-slate-700/60 max-w-xl mx-auto">
            {/* Top Editor bar controls */}
            <div className="flex justify-between items-center bg-slate-950 px-5 py-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-slate-500 font-bold ml-2 font-mono">live_claims_compiler.ai</span>
              </div>
              <div className="flex gap-1.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {(['grid', 'sensor', 'cipher'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedDemoType(type)}
                    className={`px-2 py-1 text-[8px] font-bold rounded uppercase transition-all ${
                      selectedDemoType === type
                        ? 'bg-teal-650 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type === 'grid' ? 'Grid Mesh' : type === 'sensor' ? 'Bio-Sensor' : 'Cipher'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sandbox details showing simulation progress */}
            <div className="p-5 space-y-4 bg-slate-950/30 text-left text-xs min-h-[350px] flex flex-col justify-between">
              {/* Dynamic status indicators */}
              <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Status Code</span>
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    simulatorStatus === 'COMPLETE' ? 'text-emerald-400' : 'text-teal-400 animate-pulse'
                  }`}>{simulatorStatus}</span>
                </div>
                <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-150" style={{ width: `${simulatorProgress}%` }} />
                </div>
              </div>

              {/* Generated Spec Preview Sheet */}
              <div className="bg-slate-950 border border-slate-900/80 p-4 rounded-2xl min-h-[160px] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] text-slate-500 uppercase tracking-widest font-mono">
                    <span>Draft Preview: {selectedDemoType.toUpperCase()}</span>
                    <span>12% OVERLAP RISK</span>
                  </div>
                  {simulatorStatus === 'SCANNING' ? (
                    <p className="text-[10px] font-mono text-slate-450 italic">🤖 Scanning global databases indexes...</p>
                  ) : (
                    <div className="space-y-1.5 font-mono text-[10px]">
                      {selectedDemoType === 'grid' && (
                        <>
                          <p className="text-teal-400 font-bold">Claim 1 (Independent):</p>
                          <p className="text-slate-300 leading-normal">An autonomous solar mesh controller comprising a node router, load sensor, and authorization ledger...</p>
                        </>
                      )}
                      {selectedDemoType === 'sensor' && (
                        <>
                          <p className="text-teal-400 font-bold">Claim 1 (Independent):</p>
                          <p className="text-slate-300 leading-normal">A bio-sensor diagnostic array comprising an antibody mesh, a spectrum analyzer, and output log...</p>
                        </>
                      )}
                      {selectedDemoType === 'cipher' && (
                        <>
                          <p className="text-teal-400 font-bold">Claim 1 (Independent):</p>
                          <p className="text-slate-300 leading-normal">A quantum encryption node comprising a key compiler, a mesh verifier, and state validator...</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[8px] text-slate-500 font-bold">
                  <span>COMPLIANCE RATING: 94%</span>
                  <span className="text-emerald-400 font-bold">READY TO EXPORT</span>
                </div>
              </div>

              {/* Footer status */}
              <div className="pt-3 border-t border-slate-850 flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-teal-650 text-white flex items-center justify-center text-[9px] font-extrabold">CET</div>
                  <span className="text-slate-400 font-bold">Institution: CET (Trivandrum)</span>
                </div>
                <span className="text-slate-500 font-bold font-mono">COMPLIANT_DRAFT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUSTED BY LOGOS */}
      <section className="py-12 border-y border-slate-200 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">
            Trusted by leading academic and innovation institutions
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 items-center justify-center opacity-65 grayscale hover:grayscale-0 transition-all duration-350">
            {['Universities', 'Research Labs', 'Incubation Centres', 'Innovation Hubs', 'Patent Experts', 'Tech Startups'].map((logo, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-655 shadow-3xs">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PLATFORM STATISTICS */}
      <section className="py-20 bg-white border-b border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
          {[
            { value: `${statsCounters.ideas.toLocaleString()}+`, label: 'Patent Ideas Managed' },
            { value: `${statsCounters.accuracy}%`, label: 'Patent Draft Accuracy' },
            { value: `${statsCounters.institutions}+`, label: 'Research Institutions' },
            { value: `${statsCounters.documents.toLocaleString()}+`, label: 'Documents Managed' },
            { value: `${statsCounters.aiScore}%`, label: 'AI Recommendation Match' },
            { value: `${statsCounters.experts}+`, label: 'Patent Experts Boarded' },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <h3 className="text-3xl font-extrabold text-indigo-650 tracking-tight font-mono">{stat.value}</h3>
              <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider leading-relaxed">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PATENT JOURNEY TIMELINE (WITH INTERACTIVE ILLUSTRATIONS) */}
      <section id="timeline" className="py-24 max-w-5xl mx-auto px-6 space-y-16 relative z-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
            Patent Journey Timeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight max-w-xl mx-auto leading-tight">
            Follow the stage-by-stage patent drafting process
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Timeline Nodes */}
          <div className="md:col-span-5 space-y-3">
            {journeyStages.map((stage, index) => (
              <div
                key={stage.id}
                onMouseEnter={() => setActiveJourneyStep(index)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeJourneyStep === index
                    ? 'bg-white border-indigo-400 shadow-md translate-x-2'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                    activeJourneyStep === index ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-655'
                  }`}>
                    0{index + 1}
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900">{stage.title}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Stage Illustration Column */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-left flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-650 to-cyan-500 animate-pulse-glow"></div>
            
            <div className="space-y-4">
              <span className="inline-block px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-755">
                Phase Focus Detail
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {journeyStages[activeJourneyStep].title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold">
                {journeyStages[activeJourneyStep].desc}
              </p>

              {/* Dynamic SVG Illustration representing the active step */}
              <div className="h-40 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden mt-6">
                {activeJourneyStep === 0 && (
                  <svg className="w-16 h-16 text-teal-650 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {activeJourneyStep === 1 && (
                  <svg className="w-16 h-16 text-indigo-650 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {activeJourneyStep === 2 && (
                  <svg className="w-16 h-16 text-cyan-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                {activeJourneyStep === 3 && (
                  <svg className="w-16 h-16 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 0L14.828 11.5m0 0l-3.536 3.536m0 0L7.757 18.571M12 3v1m8.364 1.636l-.707.707M21 12h-1M3 12H2m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {activeJourneyStep === 4 && (
                  <svg className="w-16 h-16 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                {activeJourneyStep === 5 && (
                  <svg className="w-16 h-16 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                {activeJourneyStep === 6 && (
                  <svg className="w-16 h-16 text-teal-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {activeJourneyStep === 7 && (
                  <svg className="w-16 h-16 text-emerald-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Stage Completion Index: {Math.round(((activeJourneyStep + 1) / journeyStages.length) * 100)}%</span>
              <span className="text-teal-600">PatentHub AI Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CORE FEATURES SECTION */}
      <section id="features" className="py-24 border-t border-slate-200 bg-slate-50/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
              Core Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              A comprehensive sandbox environment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <SpotlightCard key={i} className="p-8 flex flex-col justify-between group">
                  {i === 0 && <BorderBeam duration={7} delay={0} />}
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">{f.tag}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{f.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed font-semibold">{f.desc}</p>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. AI SHOWCASE CHAT INTERFACE SIMULATOR */}
      <section id="showcase" className="py-24 max-w-6xl mx-auto px-6 space-y-16 relative z-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
            AI Assistant Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-955 tracking-tight leading-tight">
            See the patent companion in action
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-semibold max-w-md mx-auto">
            Click a prompt tab below to trigger a live typing simulation of claims drafting and registries scans:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left panel: Prompt & Typewriter Console */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left min-h-[380px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-3">
                <span className="font-mono">PROMPT_CONSOLE_V2</span>
                <span className="text-teal-400 font-bold uppercase tracking-wider bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/30">Gemini AI Engine</span>
              </div>

              {/* Sample Prompts Toggles */}
              <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
                {(['abstract', 'claims', 'novelty'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedShowcasePrompt(mode)}
                    className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-lg transition-all cursor-pointer ${
                      selectedShowcasePrompt === mode
                        ? 'bg-slate-800 text-white font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'abstract' ? 'Generate Abstract' : mode === 'claims' ? 'Draft Claims' : 'Novelty Audit'}
                  </button>
                ))}
              </div>

              {/* User prompt box */}
              <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-900 mt-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-650 text-white flex items-center justify-center shrink-0 font-extrabold text-xs">U</div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Inventor Prompter</span>
                  <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                    {selectedShowcasePrompt === 'abstract' && '"Compile a patent-ready abstract disclosure for a decentered IoT mesh grid."'}
                    {selectedShowcasePrompt === 'claims' && '"Draft the independent and dependent claim tree nodes for claim 1."'}
                    {selectedShowcasePrompt === 'novelty' && '"Perform an overlap registry scan and novelty diagnostics audit."'}
                  </p>
                </div>
              </div>

              {/* AI Response Output typewriter bubble */}
              <div className="flex items-start gap-3 bg-indigo-950/20 p-4 rounded-2xl border border-indigo-900/40">
                <div className="w-7 h-7 rounded-lg bg-teal-650 text-white flex items-center justify-center shrink-0 font-extrabold text-xs">🤖</div>
                <div className="space-y-1.5">
                  <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider block">PatentHub AI Companion</span>
                  <p className="text-xs text-slate-350 font-mono leading-relaxed min-h-[60px]">
                    {showcaseResponse}
                    {showcaseTyping && <span className="inline-block w-1.5 h-3 bg-teal-400 ml-0.5 animate-pulse" />}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 font-mono pt-4 border-t border-slate-900 flex justify-between">
              <span>LATENCY: 340ms</span>
              <span>COMPLIANCE INDEX: 94%</span>
            </div>
          </div>

          {/* Right panel: Overlap & Match Score Metrics */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl text-left shadow-xs">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Diagnostic Analysis</span>
              <h4 className="font-extrabold text-slate-800 text-xs mt-1">Novelty Index Score</h4>
              <div className="mt-4 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Similarity Overlap Score</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-150">
                  12% Overlap (Low Match)
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl text-left shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Registry database scan results</span>
                <h4 className="font-extrabold text-slate-800 text-xs mt-1">Similar Patent Citations</h4>
                <div className="space-y-2.5 mt-3 text-[11px] font-semibold text-slate-655 font-mono">
                  <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">✓ US-899124-B: Dual solar controller switch</p>
                  <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">✓ WIPO-2024-0012: Dynamic mesh routing grid</p>
                </div>
              </div>
              <span className="text-[10px] text-indigo-700 font-bold block pt-4 border-t border-slate-100">
                → All citations bypass options generated.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE WORKFLOW ANIMATION */}
      <section className="py-24 border-y border-slate-200 bg-slate-50/50 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
              Filing Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Interactive Horizontal Flowchart
            </h2>
            <p className="text-slate-605 text-xs font-semibold max-w-sm mx-auto">
              Select steps to follow the document flow inside the platform:
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-5xl mx-auto pt-6">
            {[
              { id: 0, label: 'Concept Idea' },
              { id: 1, label: 'Create Project' },
              { id: 2, label: 'Upload Papers' },
              { id: 3, label: 'Invite Mentors' },
              { id: 4, label: 'AI Assist Search' },
              { id: 5, label: 'Guides Review' },
              { id: 6, label: 'IPO Filing Prep' }
            ].map((node) => (
              <React.Fragment key={node.id}>
                <button
                  onClick={() => setActiveWorkflowStage(node.id)}
                  className={`px-5 py-3 rounded-2xl border transition-all cursor-pointer font-bold text-xs shrink-0 ${
                    activeWorkflowStage === node.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-655 hover:border-slate-400'
                  }`}
                >
                  {node.label}
                </button>
                {node.id < 6 && (
                  <div className="hidden md:block h-0.5 bg-slate-200 flex-1 min-w-[20px]" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Workflow description */}
          <div className="max-w-xl mx-auto p-6 bg-white border border-slate-200 rounded-3xl shadow-3xs text-center mt-6">
            {activeWorkflowStage === 0 && <p className="text-xs text-slate-600 font-semibold">Inventor initiates workflow by describing concept abstracts and tags.</p>}
            {activeWorkflowStage === 1 && <p className="text-xs text-slate-600 font-semibold">Initiate a dedicated workspace sandbox to isolate all drafts securely.</p>}
            {activeWorkflowStage === 2 && <p className="text-xs text-slate-600 font-semibold">Upload literature resources, drawings sketches, and reference PDFs.</p>}
            {activeWorkflowStage === 3 && <p className="text-xs text-slate-600 font-semibold">Invite faculty mentors or guides to supervise and review timeline nodes.</p>}
            {activeWorkflowStage === 4 && <p className="text-xs text-slate-600 font-semibold">Verify compliance constraints using AI similarity index scoring.</p>}
            {activeWorkflowStage === 5 && <p className="text-xs text-slate-600 font-semibold">Mentor edits, reviews, and leaves comments on timelines logs.</p>}
            {activeWorkflowStage === 6 && <p className="text-xs text-slate-600 font-semibold">Compile official Indian IPO Forms 1, 2, 3, 5, and 26 specification bundles.</p>}
          </div>
        </div>
      </section>

      {/* 9. DASHBOARD PREVIEW TABS */}
      <section className="py-24 max-w-5xl mx-auto px-6 space-y-12 relative z-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
            Dashboard Previews
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Role-tailored console panels
          </h2>
        </div>

        {/* Switcher */}
        <div className="bg-white border border-slate-250 rounded-3xl overflow-hidden shadow-md">
          <div className="flex border-b border-slate-150 p-2.5 gap-2 bg-slate-50">
            {(['student', 'guide', 'expert', 'admin'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePreviewTab(tab)}
                className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activePreviewTab === tab
                    ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-550 hover:bg-slate-100/80'
                }`}
              >
                {tab} Dashboard
              </button>
            ))}
          </div>

          <div className="p-8 text-left min-h-[260px] flex flex-col justify-between">
            {activePreviewTab === 'student' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Inventor Console</span>
                  <span className="px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[9px] uppercase tracking-wider">
                    Drafting Phase Active
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Workspace: Decentered IoT Grid Controller</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400">PENDING MILESTONES</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">✓ Complete Claims 1-5 outlines drafts</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">☐ Upload compliance drawing vector file</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">READINESS RATING</p>
                      <p className="text-base font-extrabold text-indigo-600 mt-1">45% (Literature Review)</p>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'guide' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Review Console</span>
                  <span className="px-2.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[9px] uppercase tracking-wider">
                    Group Backlog Active
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Mentorship Group: Wireless Mesh Nodes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Supervised Backlog Submissions</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Decentered IoT grid (Athira)</span>
                      <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">Open Audit</button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Annotations History Log</p>
                    <p className="text-xs text-slate-655 italic font-semibold mt-1">"Improve technical claims specificity to bypass prior references..."</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'expert' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patent Consultant Deck</span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] uppercase tracking-wider">
                    Infringement Checker Active
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Registry Auditing Database</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">SIMILARITY MATCH SCORE</p>
                    <p className="text-xs font-extrabold text-emerald-700 mt-1">12% Match Index - Safe to Proceed</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">MATCHING CITATIONS FOUND</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">WIPO-2024-0012: Mesh grid loop</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'admin' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Admin Panel</span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider">
                    Central Control Console
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Institution: College of Engineering, Trivandrum</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400">TOTAL ACTIVE DESKS</p>
                    <p className="text-lg font-extrabold text-indigo-650 mt-0.5 font-mono">148</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400">SUPERVISING GUIDES</p>
                    <p className="text-lg font-extrabold text-indigo-650 mt-0.5 font-mono">24</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400">APPROVED DRAFTS</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-0.5 font-mono">36</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 10. AI MODULES GRID */}
      <section className="py-24 border-t border-slate-200 bg-slate-50/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
              AI Modules Catalog
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Powerful patent optimization engines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiModules.map((m, i) => {
              const Icon = m.icon;
              return (
                <SpotlightCard key={i} className="p-6 text-left flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 text-teal-650 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">Active Script</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">{m.name}</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed font-semibold mt-1">{m.desc}</p>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. COMPARISON SECTION (WHY PATENTHUB AI) */}
      <section className="py-24 max-w-4xl mx-auto px-6 space-y-12 relative z-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
            Comparison Matrix
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-955 tracking-tight leading-tight">
            How PatentHub AI outperforms traditional pipelines
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                <th className="p-4 sm:p-5">Process / Task</th>
                <th className="p-4 sm:p-5">Traditional Approach</th>
                <th className="p-4 sm:p-5 bg-indigo-50/50 text-indigo-755 font-black">PatentHub AI Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-655">
              {[
                { label: 'Specification Drafting', old: 'Manual reference sheets templates', new: 'AI Generated Compliance Sheets' },
                { label: 'Prior Art Searches', old: 'Scattered keyword searches registries', new: 'Semantic Index Overlap Diagnostic Checks' },
                { label: 'Filing Paperwork Compilation', old: 'Manual Forms 1, 2, 3, 5, 26 forms filling', new: 'Auto Generated IPO Compliance PDF Package' },
                { label: 'Academic Mentorship Reviews', old: 'Comment annotations lost inside emails', new: 'Structured Timeline Audits and Log Comments' },
                { label: 'Security & Integrity Controls', old: 'Draft documents floating on laptops', new: 'Secure isolated institutional cloud sandboxes' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 sm:p-5 font-bold text-slate-900">{row.label}</td>
                  <td className="p-4 sm:p-5 text-slate-500">{row.old}</td>
                  <td className="p-4 sm:p-5 bg-indigo-50/20 text-indigo-700 font-bold">{row.new}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 12. TESTIMONIALS */}
      <section className="py-24 border-t border-slate-200 bg-slate-50/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
              User Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-955 tracking-tight leading-tight">
              Endorsed by academic and legal leads
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "PatentHub AI took our lab sketch blueprints and turned them into ready-to-file Form 2 sheets in days. The prior art scanner is exceptionally detailed.", author: "Dr. Athira Biju", role: "Student Innovator, CET" },
              { quote: "Being able to review my research team's drafts, leave inline comments, and track their timeline in one workspace has saved us hours of meetings.", author: "Prof. Rajesh Nair", role: "Faculty Research Guide" },
              { quote: "The claims bypass recommendations highlight overlaps that keyword searches miss entirely. It gives our inventors a massive head start.", author: "Adv. Meera Sen", role: "Patent Expert Coordinator" },
            ].map((t, i) => (
              <div key={i} className="p-8 bg-white border border-slate-200 rounded-3xl shadow-3xs flex flex-col justify-between space-y-6 hover:border-indigo-350 transition-colors">
                <p className="text-slate-655 text-xs leading-relaxed italic font-medium">
                  "{t.quote}"
                </p>
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">{t.author}</h4>
                  <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. SECURITY SECTION */}
      <section className="py-24 border-t border-slate-200 max-w-5xl mx-auto px-6 space-y-16 relative z-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
            Security Safeguards
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Protecting unpublished intellectual assets
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'End-to-End Encryption', desc: 'Secure encryption layers covering spec documents both in transit and at rest.', icon: Lock },
            { title: 'JWT Token Security', desc: 'Temporary access credentials mapping state authorization strictly.', icon: ShieldCheck },
            { title: 'OTP Activation Check', desc: 'Verification OTP checks prior to onboarding user profiles.', icon: Mail },
            { title: 'Role-Based Routing', desc: 'Strict routing parameters isolate expert audits views from inventor edit desks.', icon: Users },
            { title: 'Data Isolation Sandbox', desc: 'Separate database clusters isolation ensures zero overlap leakages.', icon: Database }
          ].map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl text-left space-y-3 shadow-3xs hover:border-indigo-300 transition-all">
                <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl w-fit">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-[11px] text-slate-900 tracking-tight leading-tight">{sec.title}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">{sec.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 14. FAQ ACCORDION */}
      <section id="faq" className="py-24 border-t border-slate-200 max-w-4xl mx-auto px-6 space-y-16 relative z-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
            FAQ Desk
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-955 tracking-tight leading-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 text-left">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-3xs">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-5 text-left font-bold text-xs flex justify-between items-center text-slate-900 cursor-pointer hover:bg-slate-50/50"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 font-semibold text-sm">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 border-t border-slate-100 text-[11px] text-slate-655 leading-relaxed font-semibold">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 15. CALL TO ACTION (CTA) */}
      <section className="py-24 bg-gradient-to-r from-slate-950 to-indigo-950 text-white relative z-10 text-center px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8 relative z-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to Protect Your Innovation?
          </h2>
          <p className="text-slate-350 text-xs sm:text-sm max-w-xl mx-auto font-medium">
            Start your patent journey with AI-powered drafting, collaboration, and intelligent patent management.
          </p>
          <div className="flex justify-center gap-3.5 pt-2">
            <Magnet magnetStrength={0.3}>
              <Link
                to="/register"
                className="px-8 py-3.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-extrabold rounded-full transition-all shadow-lg shadow-indigo-600/30 cursor-pointer hover:-translate-y-0.5 inline-block"
              >
                Get Started
              </Link>
            </Magnet>
          </div>
        </div>
      </section>

      {/* 16. DETAILED SITEMAP FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-16 text-xs text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-left">
          <div className="col-span-2 space-y-4">
            <span className="font-extrabold text-base tracking-tight text-slate-955 lowercase">
              patenthub<span className="text-cyan-500 font-extrabold">.</span>
            </span>
            <p className="text-[11px] leading-relaxed max-w-xs font-semibold text-slate-455">
              Indian Patent Office e-filing compliant sandbox workspace. Bridging labs sketches to verified specifications papers.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Features</h5>
            <ul className="space-y-2 text-[11px] font-semibold text-slate-500">
              <li><a href="#features" className="hover:text-slate-900">AI Prior Art Search</a></li>
              <li><a href="#features" className="hover:text-slate-900">Document Management</a></li>
              <li><a href="#features" className="hover:text-slate-900">Lifecycle Timelines</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">AI Modules</h5>
            <ul className="space-y-2 text-[11px] font-semibold text-slate-500">
              <li><a href="#features" className="hover:text-slate-900">AI Assistant</a></li>
              <li><a href="#features" className="hover:text-slate-900">Drawing Generator</a></li>
              <li><a href="#features" className="hover:text-slate-900">Similarity Scanner</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-905 text-[11px] uppercase tracking-wider">Company</h5>
            <ul className="space-y-2 text-[11px] font-semibold text-slate-500">
              <li><Link to="/about" className="hover:text-slate-900">About Page</Link></li>
              <li><a href="#" className="hover:text-slate-900">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-900">Terms & Conditions</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-100 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} PatentHub AI Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900">GitHub</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-900">LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* WATCH EXPLORE VIDEO DEMO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-fade-in text-left">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-xs font-bold text-slate-900 uppercase">PatentHub Workspace Walkthrough</span>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Play className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Demo Video Stream Simulator</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                This simulated video tour walks inventors through configuring institutional domains, drafting claims trees, requesting supervisor audits annotations, and compiling filing-ready PDF specification packets.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
