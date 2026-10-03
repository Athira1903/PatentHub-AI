import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Sparkles,
  Search,
  FileCode,
  Layers,
  AlertTriangle,
  Users,
  FileText,
  Lightbulb,
  Lock,
  Award,
  Zap,
  Check,
  CheckCircle2,
  GraduationCap,
  Sliders,
  HelpCircle,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { billingService } from '../services/billingService';

export const HomePage: React.FC = () => {
  // Theme state: defaults to Light/White mode like e-Yantra, supports dark mode toggle
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return false; // Default to White mode (e-Yantra look)
    }
    return false;
  });

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll tracking (progress & isScrolled like eyic.e-yantra.org)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Pro Plan Pricing State
  const [proPlanPrice, setProPlanPrice] = useState<string>('₹299');
  const [proBillingInterval, setProBillingInterval] = useState<string>('month');

  // Interactive Hero Demo State
  const [heroPrompt, setHeroPrompt] = useState('Autonomous Solar-Powered Hydration Tracking Bottle with Liquid Level Dielectric Sensor');
  const [activeTabRole, setActiveTabRole] = useState<'inventor' | 'guide' | 'expert' | 'admin'>('inventor');

  // Contextual auth state for seamless CTA routing
  const token = typeof window !== 'undefined' ? localStorage.getItem('patenthub_token') : null;
  const proCtaRoute = token ? '/org-admin/billing' : '/register';
  const trialCtaRoute = token ? '/org-admin/billing' : '/register';

  // Synchronize theme with documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Track window scroll for top reading indicator and navbar backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      const root = document.documentElement;
      const scrollTop = root.scrollTop || document.body.scrollTop;
      const scrollHeight = root.scrollHeight - root.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
      setIsScrolled(scrollTop > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Pro Plan price from backend public plans
  useEffect(() => {
    billingService.getPlans()
      .then((plans) => {
        const pro = plans?.find((p) => p.code === 'PRO');
        if (pro && pro.amount) {
          setProPlanPrice(`₹${pro.amount / 100}`);
          if (pro.billingInterval) {
            setProBillingInterval(pro.billingInterval.toLowerCase() === 'monthly' ? 'month' : pro.billingInterval.toLowerCase());
          }
        }
      })
      .catch(() => {
        // Fallback to default configured price if backend starting
      });
  }, []);

  // Interactive Readiness Checklist Simulator State
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    problem: true,
    priorArt: true,
    claims: true,
    drawings: false,
    forms: false,
    guideReview: false,
  });

  const toggleChecklist = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateReadiness = () => {
    const total = Object.keys(checkedItems).length;
    const completed = Object.values(checkedItems).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const processStages = [
    {
      step: '01',
      name: 'IDEA CAPTURE',
      title: 'Structured Invention Logging',
      desc: 'Formulate core novelty, problem statement, and technical architecture with guided domain taxonomies.',
      icon: Lightbulb,
      chipColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    {
      step: '02',
      name: 'PRIOR ART SEARCH',
      title: 'Global Patent Search Engine',
      desc: 'Query real published patents across USPTO, EPO, and WIPO databases with keyword & semantic matching.',
      icon: Search,
      chipColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
    },
    {
      step: '03',
      name: 'PATENTABILITY & FTO',
      title: 'Overlap Heuristics & Scoping',
      desc: 'Run Freedom-to-Operate matrices and automated novelty scoring before drafting formal specifications.',
      icon: Layers,
      chipColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
    },
    {
      step: '04',
      name: 'CLAIMS DRAFTING',
      title: 'Independent & Dependent Claims',
      desc: 'Draft structured patent claim trees with statutory preamble validation and reference numeral linking.',
      icon: FileCode,
      chipColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      step: '05',
      name: 'FIGURES & DRAWINGS',
      title: 'Annotated Technical Drawings',
      desc: 'Tag mechanical components, schematics, and system flowcharts with cross-referenced numeral indices.',
      icon: Sliders,
      chipColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    },
    {
      step: '06',
      name: 'STATUTORY FORMS',
      title: 'IPO Form 1, 2, 3 & 5 Generation',
      desc: 'Auto-compile official Indian Patent Office specification packages with complete applicant metadata.',
      icon: FileText,
      chipColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      step: '07',
      name: 'MULTI-ROLE REVIEW',
      title: 'Guide & Expert Approvals',
      desc: 'Collaborative evaluation by faculty guides and certified patent experts with change request tracking.',
      icon: Users,
      chipColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    },
    {
      step: '08',
      name: 'FILING DISPATCH',
      title: 'Filing Readiness & Receipts',
      desc: 'Verify submission readiness, track official application numbers, CBR receipts, and statutory deadlines.',
      icon: Award,
      chipColor: 'bg-green-500/10 text-green-600 dark:text-green-400'
    }
  ];

  const faqs = [
    {
      q: 'How does PatentHub AI verify prior art?',
      a: 'PatentHub AI queries authoritative international patent databases (including USPTO, EPO, and WIPO) using structured semantic tokenization, classification cross-referencing (IPC/CPC), and automated similarity heuristics to calculate overlap with your proposed invention.'
    },
    {
      q: 'Is my research and IP confidential on this platform?',
      a: 'Yes. PatentHub AI employs end-to-end encryption for all uploaded drafts, research papers, and technical blueprints. Access is strictly managed through role-based access control (RBAC), and your data is never used to train public third-party AI models.'
    },
    {
      q: 'Does it support statutory Indian Patent Office (IPO) forms?',
      a: 'Yes! PatentHub AI automatically generates formatted, ready-to-sign Indian Patent Forms including Form 1 (Application for Grant), Form 2 (Provisional/Complete Specification), Form 3 (Statement & Undertaking), Form 5 (Declaration as to Inventorship), and Form 26 (Power of Attorney).'
    },
    {
      q: 'How do Guides and Patent Experts participate in the workflow?',
      a: 'Faculty guides and registered patent experts receive dedicated review dashboards. They can review claim hierarchies, inspect technical drawings, add inline annotations, and submit formal approvals or change requests before filing.'
    },
    {
      q: 'Can I switch between Free/Trial and Pro versions at any time?',
      a: 'Yes. You can test the platform during the free trial period. When your team is ready for advanced claim assistance, full Form 2 compilation, and multi-user faculty review workflows, upgrade to PatentHub AI Pro directly in your workspace.'
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#09120c] text-emerald-50' : 'bg-[#ffffff] text-[#123900]'} transition-colors duration-300 font-sans antialiased selection:bg-[#348148]/20 selection:text-[#123900]`}>
      
      {/* Top Navbar with Scroll Progress Bar (Exact e-Yantra Pattern) */}
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300">
        {/* Scroll Progress Indicator Bar */}
        <div
          className="h-[3px] bg-gradient-to-r from-[#348148] via-[#d4df47] to-[#22c55e] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />

        <nav
          className={`transition-all duration-300 ${
            isScrolled || mobileMenuOpen
              ? isDark
                ? 'border-b border-[#22c55e]/20 bg-[#09120c]/90 shadow-md backdrop-blur-md'
                : 'border-b border-[#348148]/15 bg-white/90 shadow-md shadow-[#123900]/5 backdrop-blur-md'
              : 'border-b border-transparent bg-transparent'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            {/* Brand Logo & Institutional Tagline */}
            <Link to="/" className="flex shrink-0 items-center gap-3 group">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#348148] text-white shadow-md shadow-[#348148]/20 transition-transform group-hover:scale-105">
                <Shield className="size-5 fill-current" />
              </div>
              <div>
                <span className="font-heading text-xl font-extrabold tracking-tight flex items-center gap-1">
                  PatentHub<span className="text-[#348148] dark:text-[#22c55e]">AI</span>
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-75 block">
                  Institutional IP Platform
                </span>
              </div>
              <span className="hidden sm:block h-6 w-px bg-current opacity-20 mx-1" aria-hidden="true" />
              <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] border border-[#348148]/20">
                eYIC Design Suite
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              <a href="#about" className="eyic-link-draw px-3 py-2 text-sm font-semibold hover:text-[#348148] dark:hover:text-[#22c55e] transition-colors">
                About
              </a>
              <a href="#workflow" className="eyic-link-draw px-3 py-2 text-sm font-semibold hover:text-[#348148] dark:hover:text-[#22c55e] transition-colors">
                Workflow
              </a>
              <a href="#pro" className="eyic-link-draw px-3 py-2 text-sm font-semibold hover:text-[#348148] dark:hover:text-[#22c55e] transition-colors flex items-center gap-1.5">
                <span>Pro Version</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#d4df47] text-[#123900] shadow-xs">
                  {proPlanPrice}
                </span>
              </a>
              <a href="#capabilities" className="eyic-link-draw px-3 py-2 text-sm font-semibold hover:text-[#348148] dark:hover:text-[#22c55e] transition-colors">
                Capabilities
              </a>
              <a href="#roles" className="eyic-link-draw px-3 py-2 text-sm font-semibold hover:text-[#348148] dark:hover:text-[#22c55e] transition-colors">
                Role Portals
              </a>
              <a href="#simulator" className="eyic-link-draw px-3 py-2 text-sm font-semibold hover:text-[#348148] dark:hover:text-[#22c55e] transition-colors">
                Readiness Tool
              </a>
              <a href="#faq" className="eyic-link-draw px-3 py-2 text-sm font-semibold hover:text-[#348148] dark:hover:text-[#22c55e] transition-colors">
                FAQs
              </a>
            </div>

            {/* Right Header Actions: Theme Toggle & Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Dark / White Mode Switcher */}
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20'
                    : 'border-[#348148]/25 bg-[#348148]/5 text-[#123900] hover:bg-[#348148]/10'
                }`}
                title={isDark ? "Switch to White / Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <>
                    <Sun className="size-4 text-amber-400" />
                    <span>White Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="size-4 text-[#123900]" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {token ? (
                <Link
                  to="/dashboard"
                  className="eyic-btn-leaf inline-flex items-center gap-1.5 rounded-md px-5 py-2 text-sm font-semibold shadow-xs"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#348148]/30 dark:border-[#22c55e]/30 px-4 py-2 text-sm font-semibold transition-colors hover:border-[#348148] hover:bg-[#348148]/5 dark:hover:bg-[#22c55e]/10"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="eyic-btn-leaf inline-flex items-center gap-1.5 rounded-md px-5 py-2 text-sm font-semibold shadow-xs"
                  >
                    <span>Register</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger & Quick Theme Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-md border border-[#348148]/30 dark:border-[#22c55e]/30 text-current"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-[#123900]" />}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex size-10 items-center justify-center rounded-md border border-[#348148]/20 text-current hover:bg-[#348148]/10"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-[#348148]/15 dark:border-[#22c55e]/15 px-6 pb-6 lg:hidden bg-inherit">
              <div className="flex flex-col gap-1 pt-4">
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#348148]/10"
                >
                  About
                </a>
                <a
                  href="#workflow"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#348148]/10"
                >
                  Workflow
                </a>
                <a
                  href="#pro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#348148]/10 flex items-center justify-between"
                >
                  <span>Pro Version</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#d4df47] text-[#123900]">
                    {proPlanPrice}
                  </span>
                </a>
                <a
                  href="#capabilities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#348148]/10"
                >
                  Capabilities
                </a>
                <a
                  href="#roles"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#348148]/10"
                >
                  Role Portals
                </a>
                <a
                  href="#simulator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#348148]/10"
                >
                  Readiness Tool
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#348148]/10"
                >
                  FAQs
                </a>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 border-t border-[#348148]/15 dark:border-[#22c55e]/15 pt-4">
                {token ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="eyic-btn-leaf flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-center text-sm font-semibold"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center rounded-md border border-[#348148]/30 px-4 py-2.5 text-center text-sm font-semibold hover:bg-[#348148]/5"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="eyic-btn-leaf flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-center text-sm font-semibold shadow-xs"
                    >
                      <span>Register</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Page Content */}
      <main className="pt-24 space-y-24 sm:space-y-32 pb-24 overflow-hidden">
        
        {/* HERO SECTION (e-Yantra Typography, Palettes & Micro-interactions) */}
        <section id="about" className={`relative px-6 py-16 sm:py-24 lg:px-8 ${isDark ? 'eyic-grid-dark' : 'eyic-grid-light'}`}>
          {/* Subtle Ambient Glows */}
          <div className="pointer-events-none absolute -top-10 left-1/3 size-96 rounded-full bg-[#348148]/10 blur-3xl -z-10" />
          <div className="pointer-events-none absolute bottom-0 right-10 size-80 rounded-full bg-[#d4df47]/15 blur-3xl -z-10" />

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Heading & Mission */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#348148]/30 dark:border-[#22c55e]/30 bg-[#348148]/10 dark:bg-[#22c55e]/10 px-4 py-1.5">
                  <span className="size-2 rounded-full bg-[#348148] dark:bg-[#22c55e] animate-ping" />
                  <span className="eyic-eyebrow text-xs">Innovation & Patent Intelligence</span>
                </div>

                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                  From Invention Idea to{' '}
                  <span className="text-[#348148] dark:text-[#22c55e] underline decoration-[#d4df47] decoration-wavy decoration-3 underline-offset-8">
                    Certified Patent Filing
                  </span>.
                </h1>

                <p className="text-base sm:text-lg leading-relaxed opacity-85 font-medium max-w-xl">
                  Empowering Indian universities, researchers, student innovators, and patent attorneys with unified prior-art search, automated claim drafting, FTO analysis, and statutory Indian Patent Office filing packages.
                </p>

                {/* Primary CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to={token ? "/dashboard" : "/register"}
                    className="eyic-btn-leaf inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold shadow-md cursor-pointer"
                  >
                    <span>Start New Patent Draft</span>
                    <ArrowRight className="size-4" />
                  </Link>

                  <a
                    href="#workflow"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#348148]/30 dark:border-[#22c55e]/30 px-6 py-3.5 text-sm font-semibold hover:border-[#348148] hover:bg-[#348148]/5 dark:hover:bg-[#22c55e]/10 transition"
                  >
                    <span>Explore 8-Stage Workflow</span>
                    <ChevronDown className="size-4" />
                  </a>
                </div>

                {/* Subtle Pro Pill link */}
                <div className="pt-1">
                  <a
                    href="#pro"
                    className="eyic-link-draw inline-flex items-center gap-1.5 text-xs font-bold text-[#348148] dark:text-[#22c55e]"
                  >
                    <span>Explore PatentHub AI Pro ({proPlanPrice} / {proBillingInterval})</span>
                    <ArrowRight className="size-3.5" />
                  </a>
                </div>

                {/* Trust Metrics Ribbon */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-current/10">
                  <div className="p-3 rounded-xl border border-current/10 bg-current/5">
                    <div className="font-heading text-2xl font-black text-[#348148] dark:text-[#22c55e]">100%</div>
                    <div className="text-[11px] font-medium opacity-75">IPO & PCT Form Compliant</div>
                  </div>
                  <div className="p-3 rounded-xl border border-current/10 bg-current/5">
                    <div className="font-heading text-2xl font-black text-[#348148] dark:text-[#22c55e]">8-Stage</div>
                    <div className="text-[11px] font-medium opacity-75">Lifecycle Architecture</div>
                  </div>
                  <div className="p-3 rounded-xl border border-current/10 bg-current/5">
                    <div className="font-heading text-2xl font-black text-[#348148] dark:text-[#22c55e]">RBAC</div>
                    <div className="text-[11px] font-medium opacity-75">Multi-Role Review Portals</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Patent Intelligence Simulator */}
              <div className="lg:col-span-6 relative">
                <div className="eyic-panel eyic-panel-hover p-6 sm:p-8 space-y-5 relative">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-current/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-[#348148]/15 text-[#348148] dark:text-[#22c55e] flex items-center justify-center font-bold text-xs border border-[#348148]/30">
                        AI
                      </div>
                      <div>
                        <h2 className="text-sm font-bold">Patent Intelligence Simulator</h2>
                        <p className="text-[11px] opacity-70">Live novelty evaluation preview</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] text-[10px] font-bold border border-[#348148]/20">
                      STAGE 03: PRIOR ART
                    </span>
                  </div>

                  {/* Sample Invention Concept */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-2">
                      Invention Concept Under Evaluation:
                    </label>
                    <div className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${isDark ? 'bg-[#060e08] border-[#22c55e]/25 text-emerald-100' : 'bg-[#f8faf7] border-[#348148]/20 text-[#123900]'}`}>
                      {heroPrompt}
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <button
                        type="button"
                        onClick={() => setHeroPrompt('Autonomous Solar-Powered Hydration Tracking Bottle with Liquid Level Dielectric Sensor')}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-current/15 hover:border-[#348148] hover:text-[#348148] transition cursor-pointer"
                      >
                        💡 Smart Hydration
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroPrompt('AI-Powered Adaptive Traffic Signal Optimization Using Real-Time Trajectory Prediction')}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-current/15 hover:border-[#348148] hover:text-[#348148] transition cursor-pointer"
                      >
                        🚦 Smart Traffic AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroPrompt('Non-Invasive Optical Blood Glucose Monitoring Ring with Multi-Wavelength PPG')}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-current/15 hover:border-[#348148] hover:text-[#348148] transition cursor-pointer"
                      >
                        🩺 Biomedical Wearable
                      </button>
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Novelty Score</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">84% High</span>
                      </div>
                      <div className="w-full bg-current/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-[#348148] dark:bg-[#22c55e] h-full w-[84%]"></div>
                      </div>
                      <p className="text-[10px] opacity-80 mt-1">Novel dielectric capacitance configuration confirmed.</p>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-teal-950/30 border-teal-500/30' : 'bg-teal-50 border-teal-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">IPC Category</span>
                        <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300">G01F / A47G</span>
                      </div>
                      <p className="text-[10px] opacity-80 mt-1">Classified for Indian IPO & USPTO filing classification.</p>
                    </div>
                  </div>

                  {/* Formulated Claim Snippet */}
                  <div className={`p-3.5 rounded-xl border font-mono text-xs space-y-2 ${isDark ? 'bg-[#060e08] border-[#22c55e]/25 text-emerald-200' : 'bg-[#fcfdfd] border-[#348148]/20 text-[#123900]'}`}>
                    <div className="flex items-center justify-between text-[10px] font-sans border-b border-current/10 pb-1.5">
                      <span className="font-bold uppercase tracking-wider text-[#348148] dark:text-[#22c55e]">Generated Independent Claim #1</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="size-3" /> Certified Compliant
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      <strong>1. An automated system comprising:</strong> a container body defining a fluid reservoir; an ambient solar energy harvester; and a multi-segmented capacitive sensor configured to measure liquid volume via dielectric permittivity...
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* VIBRANT IMPACT STAT STRIP (e-Yantra Theme Ribbon) */}
        <section className={`border-y border-[#348148]/20 py-8 ${isDark ? 'bg-[#0d1a11]' : 'bg-[#f7faf7]'}`}>
          <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#348148] dark:text-[#22c55e]">10,000+</div>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-75">Prior Art Queries</div>
            </div>
            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#348148] dark:text-[#22c55e]">Forms 1 to 26</div>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-75">Statutory IPO Formats</div>
            </div>
            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#348148] dark:text-[#22c55e]">8 Milestones</div>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-75">Pre-Filing Governance</div>
            </div>
            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#348148] dark:text-[#22c55e]">256-Bit SSL</div>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-75">Institutional Security</div>
            </div>
          </div>
        </section>

        {/* 8-STAGE INVENTION WORKFLOW JOURNEY */}
        <section id="workflow" className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] text-xs font-bold border border-[#348148]/20">
              <Zap className="size-3.5" />
              <span>Full Lifecycle Patent Architecture</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight">
              The 8-Stage Invention Journey
            </h2>
            <p className="text-sm opacity-80 leading-relaxed font-medium">
              Every invention advances through rigorous statutory milestones with automated semantic validation and role-based faculty approvals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {processStages.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="eyic-panel eyic-panel-hover p-6 flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-xl bg-[#348148]/10 dark:bg-[#22c55e]/15 text-[#348148] dark:text-[#22c55e] flex items-center justify-center transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                      <span className="font-mono text-xs font-black text-[#348148] dark:text-[#22c55e] px-2 py-0.5 rounded-md bg-[#348148]/10">
                        {st.step}
                      </span>
                    </div>

                    <div>
                      <span className="eyic-eyebrow text-[10px] block">
                        {st.name}
                      </span>
                      <h3 className="font-heading text-base font-bold mt-1">{st.title}</h3>
                      <p className="text-xs opacity-75 font-normal leading-relaxed mt-2">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PATENTHUB AI PRO SECTION (Exact User Specs & e-Yantra Design) */}
        <section id="pro" className="max-w-7xl mx-auto px-6 sm:px-12 space-y-14 scroll-mt-28">
          
          {/* Main 2-Column Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Pro Value Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#348148]/30 dark:border-[#22c55e]/30 bg-[#348148]/10 dark:bg-[#22c55e]/10 px-3.5 py-1.5 text-xs font-bold text-[#348148] dark:text-[#22c55e]">
                <Sparkles className="size-3.5" />
                <span>PATENTHUB AI PRO SUBSCRIPTION</span>
              </div>

              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12]">
                Accelerate With{' '}
                <span className="text-[#348148] dark:text-[#22c55e] underline decoration-[#d4df47] decoration-wavy decoration-2">
                  PatentHub AI Pro
                </span>.
              </h2>

              <p className="text-base sm:text-lg leading-relaxed opacity-85 font-medium">
                Move from basic invention note-taking to an institutional AI-assisted workspace built for serious patent research, claim hierarchy drafting, faculty review, and official IPO filing packages.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={proCtaRoute}
                  className="eyic-btn-leaf inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold shadow-md cursor-pointer"
                >
                  <span>Explore Pro ({proPlanPrice} / {proBillingInterval})</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  to={trialCtaRoute}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#348148]/30 dark:border-[#22c55e]/30 px-6 py-3.5 text-sm font-semibold hover:border-[#348148] hover:bg-[#348148]/5 dark:hover:bg-[#22c55e]/10 transition"
                >
                  <span>Start Free Trial</span>
                </Link>
              </div>

              {/* Trust & Guarantee Notes */}
              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs opacity-75 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-[#348148] dark:text-[#22c55e]" />
                  <span>14-Day Free Evaluation Window</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-[#348148] dark:text-[#22c55e]" />
                  <span>No Obligation or Legal Lock-in</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-[#348148] dark:text-[#22c55e]" />
                  <span>Instant Multi-User Activation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Premium PRO Capability Panel */}
            <div className="lg:col-span-6 relative">
              <div className="eyic-panel eyic-panel-hover border-2 border-[#348148] dark:border-[#22c55e] p-6 sm:p-8 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-current/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#348148] text-white flex items-center justify-center font-black text-sm shadow-md">
                      <Shield className="size-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-extrabold">PatentHub AI Pro</h3>
                      <p className="text-[11px] opacity-70">Complete institutional intelligence & drafting suite</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#d4df47] text-[#123900] text-[10px] font-black tracking-wider uppercase">
                    PRO SUITE
                  </span>
                </div>

                {/* Price Display */}
                <div className={`p-4 rounded-xl border flex items-baseline justify-between ${isDark ? 'bg-[#060e08] border-[#22c55e]/25' : 'bg-[#f8faf7] border-[#348148]/20'}`}>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-heading text-3xl font-black">{proPlanPrice}</span>
                      <span className="text-xs opacity-75 font-semibold">/ {proBillingInterval}</span>
                    </div>
                    <p className="text-xs opacity-70 font-medium mt-0.5">
                      Includes full prior-art search & Form 2 compiler
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#348148] dark:text-[#22c55e] bg-[#348148]/10 px-2.5 py-1 rounded-lg">
                    High Volume Access
                  </span>
                </div>

                {/* Capability Checklist */}
                <div className="space-y-2 pt-1">
                  <span className="eyic-eyebrow text-[10px] block">
                    Unlocks Advanced Capabilities
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                    {[
                      'AI Innovation Analysis',
                      'Advanced Prior-Art Research',
                      'Intelligent Claim Assistance',
                      'Patent Drawing Generation',
                      'Filing Package Preparation',
                      'Specification & Form 2 Workspace',
                      'Guide & Patent Expert Review Workflow',
                      'Project Readiness Intelligence',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[#348148] dark:text-[#22c55e] shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* FREE VS PRO COMPARISON TILES */}
          <div className="space-y-8 pt-4">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h3 className="font-heading text-2xl sm:text-3xl font-black tracking-tight">
                Choose the workspace that fits your institution.
              </h3>
              <p className="text-sm opacity-80 leading-relaxed font-medium">
                Whether you are exploring invention ideas in class or compiling certified institutional filings, PatentHub AI scales with your research lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Card 1: FREE / TRIAL */}
              <div className="eyic-panel p-7 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-current/10 text-current text-[10px] font-bold tracking-wider">
                      FREE / TRIAL
                    </span>
                    <span className="text-xs font-semibold opacity-75">14-Day Free Access</span>
                  </div>
                  <div>
                    <h4 className="font-heading text-xl font-bold">For Exploring PatentHub AI</h4>
                    <p className="text-xs opacity-75 mt-1">
                      Ideal for student innovators and research teams exploring patentability before formal preparation.
                    </p>
                  </div>
                  <div className="font-heading text-2xl font-black pt-2">
                    ₹0 <span className="text-xs opacity-60 font-normal">/ trial window</span>
                  </div>
                  <ul className="space-y-2.5 text-xs font-medium pt-2 border-t border-current/10">
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span>Create patent projects</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span>Guided invention workflow</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span>Basic research queries</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span>Team collaboration</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span>Standard document export</span>
                    </li>
                  </ul>
                </div>

                <Link
                  to={trialCtaRoute}
                  className="w-full text-center py-3 px-4 rounded-lg text-xs font-bold border border-[#348148]/30 hover:border-[#348148] hover:bg-[#348148]/10 transition"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Card 2: PRO */}
              <div className="eyic-panel eyic-panel-hover border-2 border-[#348148] dark:border-[#22c55e] p-7 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-lg">
                <div className="absolute -top-3 right-6">
                  <span className="px-3 py-1 bg-[#d4df47] text-[#123900] text-[10px] font-black rounded-full shadow-xs tracking-wider uppercase">
                    Institutional Choice
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] text-[10px] font-black tracking-wider border border-[#348148]/20">
                      PRO
                    </span>
                    <span className="text-xs font-bold text-[#348148] dark:text-[#22c55e]">Enterprise Ready</span>
                  </div>
                  <div>
                    <h4 className="font-heading text-xl font-bold">For Advanced Patent Engineering</h4>
                    <p className="text-xs opacity-75 mt-1">
                      Full-featured intelligence suite for comprehensive claim drafting, technical figures, and certified IPO filings.
                    </p>
                  </div>
                  <div className="font-heading text-2xl font-black pt-2">
                    {proPlanPrice} <span className="text-xs opacity-60 font-semibold">/ {proBillingInterval}</span>
                  </div>
                  <ul className="space-y-2.5 text-xs font-medium pt-2 border-t border-current/10">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span className="font-bold">AI Innovation Analysis</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span className="font-bold">Advanced global prior-art research</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span className="font-bold">AI-assisted claim development</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span className="font-bold">Patent drawing generation</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span className="font-bold">Complete IPO Form 1 & 2 packaging</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-[#348148] dark:text-[#22c55e] shrink-0" />
                      <span className="font-bold">Faculty Guide & Attorney review workflow</span>
                    </li>
                  </ul>
                </div>

                <Link
                  to={proCtaRoute}
                  className="eyic-btn-leaf w-full text-center py-3 px-4 rounded-lg text-xs font-black shadow-md cursor-pointer"
                >
                  Explore Pro
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* CORE PLATFORM CAPABILITIES */}
        <section id="capabilities" className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] text-xs font-bold border border-[#348148]/20">
              <Shield className="size-3.5" />
              <span>Built for High-Stakes Intellectual Property</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight">
              Complete Innovation Toolset
            </h2>
            <p className="text-sm opacity-80 leading-relaxed font-medium">
              Purpose-built to streamline patent drafting, claim rigor, and institutional verification across departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="eyic-panel eyic-panel-hover p-7 space-y-4">
              <div className="size-12 rounded-xl bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] flex items-center justify-center">
                <Search className="size-6" />
              </div>
              <h3 className="font-heading text-base font-bold">Prior-Art Research Engine</h3>
              <p className="text-xs opacity-75 leading-relaxed font-medium">
                Direct querying across international registries (USPTO, WIPO, EPO). Compute semantic relevance scores and link citations straight into your patent drafting file.
              </p>
            </div>

            <div className="eyic-panel eyic-panel-hover p-7 space-y-4">
              <div className="size-12 rounded-xl bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] flex items-center justify-center">
                <FileCode className="size-6" />
              </div>
              <h3 className="font-heading text-base font-bold">Claim Engineering Suite</h3>
              <p className="text-xs opacity-75 leading-relaxed font-medium">
                Draft independent and dependent claims with clause hierarchy, statutory preamble validations, and automatic reference number synchronization with figures.
              </p>
            </div>

            <div className="eyic-panel eyic-panel-hover p-7 space-y-4">
              <div className="size-12 rounded-xl bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] flex items-center justify-center">
                <FileText className="size-6" />
              </div>
              <h3 className="font-heading text-base font-bold">Indian Patent Office Forms</h3>
              <p className="text-xs opacity-75 leading-relaxed font-medium">
                Auto-generate Form 1, Form 2 (Complete Specification), Form 3, Form 5, and Form 26 with instant document export compliant with Indian patent guidelines.
              </p>
            </div>

            <div className="eyic-panel eyic-panel-hover p-7 space-y-4">
              <div className="size-12 rounded-xl bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] flex items-center justify-center">
                <Layers className="size-6" />
              </div>
              <h3 className="font-heading text-base font-bold">Technical Drawing Annotation</h3>
              <p className="text-xs opacity-75 leading-relaxed font-medium">
                Upload technical drawings (FIG. 1, FIG. 2), tag individual components (100, 102), and maintain bidirectional references between drawings and claims.
              </p>
            </div>

            <div className="eyic-panel eyic-panel-hover p-7 space-y-4">
              <div className="size-12 rounded-xl bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] flex items-center justify-center">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="font-heading text-base font-bold">FTO & Claim Overlap Matrices</h3>
              <p className="text-xs opacity-75 leading-relaxed font-medium">
                Map claim elements against prior art features in structured claim charts to identify patent infringement risks and pinpoint novel distinguishing features.
              </p>
            </div>

            <div className="eyic-panel eyic-panel-hover p-7 space-y-4">
              <div className="size-12 rounded-xl bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] flex items-center justify-center">
                <Users className="size-6" />
              </div>
              <h3 className="font-heading text-base font-bold">Multi-Role Review Portals</h3>
              <p className="text-xs opacity-75 leading-relaxed font-medium">
                Specialized workspaces for Inventors, Co-Inventors, Faculty Guides, Registered Patent Experts, and Institutional IP Administrators.
              </p>
            </div>
          </div>
        </section>

        {/* ROLE-SPECIFIC WORKSPACES */}
        <section id="roles" className="max-w-7xl mx-auto px-6 sm:px-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] text-xs font-bold border border-[#348148]/20">
              <GraduationCap className="size-3.5" />
              <span>Tailored Role Experiences</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight">
              Designed for Every Stakeholder
            </h2>
          </div>

          {/* Role Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl border border-current/15 gap-1.5 bg-current/5">
              <button
                type="button"
                onClick={() => setActiveTabRole('inventor')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTabRole === 'inventor'
                    ? 'eyic-btn-leaf shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                🎓 Student Inventor
              </button>
              <button
                type="button"
                onClick={() => setActiveTabRole('guide')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTabRole === 'guide'
                    ? 'eyic-btn-leaf shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                🧑‍🏫 Faculty Guide
              </button>
              <button
                type="button"
                onClick={() => setActiveTabRole('expert')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTabRole === 'expert'
                    ? 'eyic-btn-leaf shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                ⚖️ Patent Attorney
              </button>
              <button
                type="button"
                onClick={() => setActiveTabRole('admin')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTabRole === 'admin'
                    ? 'eyic-btn-leaf shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                🏛️ Institutional Admin
              </button>
            </div>
          </div>

          {/* Role Details Panel */}
          <div className="eyic-panel p-8 sm:p-10 max-w-4xl mx-auto">
            {activeTabRole === 'inventor' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="eyic-eyebrow text-xs">FOR INVENTORS & RESEARCHERS</span>
                  <h3 className="font-heading text-2xl font-bold">Turn Academic Projects into Defensible IP</h3>
                  <p className="text-xs opacity-75 leading-relaxed font-medium">
                    Guided patent drafting designed to help academic researchers and student innovators translate lab prototypes into properly formatted patent specifications without getting lost in legal jargon.
                  </p>
                  <ul className="space-y-2 text-xs font-semibold opacity-90">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Step-by-step 8-stage progress tracker</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>AI assistance for drafting technical descriptions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>1-Click Form 1, Form 2, and Form 3 generation</span>
                    </li>
                  </ul>
                </div>
                <div className={`p-6 rounded-2xl border space-y-3 ${isDark ? 'bg-[#060e08] border-[#22c55e]/25' : 'bg-[#f8faf7] border-[#348148]/20'}`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Project: Smart Traffic AI</span>
                    <span className="text-[#348148] dark:text-[#22c55e]">Stage 4: Claims</span>
                  </div>
                  <div className="w-full bg-current/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#348148] dark:bg-[#22c55e] h-full w-[65%]"></div>
                  </div>
                  <div className="p-3 rounded-xl border border-current/10 text-xs space-y-1">
                    <span className="font-bold text-[#348148] dark:text-[#22c55e] block">Next Action:</span>
                    <p className="opacity-75 text-[11px]">Submit Form 2 specification draft to Faculty Guide for formal approval.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'guide' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="eyic-eyebrow text-xs">FOR FACULTY GUIDES & MENTORS</span>
                  <h3 className="font-heading text-2xl font-bold">Supervise Student Innovations Efficiently</h3>
                  <p className="text-xs opacity-75 leading-relaxed font-medium">
                    Dedicated supervisor dashboard to oversee student research projects, review claim completeness, evaluate novelty, and provide structured inline feedback.
                  </p>
                  <ul className="space-y-2 text-xs font-semibold opacity-90">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Live review queue for claims and specifications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Structured evaluation checklists and decision logs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Batch tracking across supervised student cohorts</span>
                    </li>
                  </ul>
                </div>
                <div className={`p-6 rounded-2xl border space-y-3 ${isDark ? 'bg-[#060e08] border-[#22c55e]/25' : 'bg-[#f8faf7] border-[#348148]/20'}`}>
                  <div className="text-xs font-bold">Guide Review Queue (2 Pending)</div>
                  <div className="p-3 rounded-xl border border-current/10 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold">Dielectric Hydration Bottle</p>
                      <p className="text-[10px] opacity-70">Athira Biju • Claims Review</p>
                    </div>
                    <span className="px-2.5 py-1 bg-[#348148] text-white font-bold rounded-lg text-[10px]">Review</span>
                  </div>
                  <div className="p-3 rounded-xl border border-current/10 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold">Non-Invasive Glucose Ring</p>
                      <p className="text-[10px] opacity-70">Research Team • Form 2 Draft</p>
                    </div>
                    <span className="px-2.5 py-1 bg-[#348148] text-white font-bold rounded-lg text-[10px]">Review</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'expert' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="eyic-eyebrow text-xs">FOR REGISTERED PATENT EXPERTS</span>
                  <h3 className="font-heading text-2xl font-bold">Statutory FTO & Filing Validation</h3>
                  <p className="text-xs opacity-75 leading-relaxed font-medium">
                    Perform professional claim scoping, review prior art overlap matrices, certify inventorship declarations, and ensure filings meet strict Indian Patent Office standards.
                  </p>
                  <ul className="space-y-2 text-xs font-semibold opacity-90">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Claim-by-claim prior-art overlap charts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Form 18 examination timeline tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Formal certification and filing readiness clearance</span>
                    </li>
                  </ul>
                </div>
                <div className={`p-6 rounded-2xl border space-y-3 ${isDark ? 'bg-[#060e08] border-[#22c55e]/25' : 'bg-[#f8faf7] border-[#348148]/20'}`}>
                  <div className="text-xs font-bold">Expert FTO Evaluation</div>
                  <div className="p-3 rounded-xl border border-current/10 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[#348148] dark:text-[#22c55e]">
                      <span>Prior Art Overlap: US10925432B2</span>
                      <span>Low Risk (32%)</span>
                    </div>
                    <p className="text-[11px] opacity-75">Distinguished by non-contact dielectric sensing element in Claim 1.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="eyic-eyebrow text-xs">FOR INSTITUTIONAL DIRECTORS & ADMINS</span>
                  <h3 className="font-heading text-2xl font-bold">Institutional IP Portfolio Management</h3>
                  <p className="text-xs opacity-75 leading-relaxed font-medium">
                    Complete administrative oversight over user verification, role assignments, institutional patent metrics, and department innovation audit trails.
                  </p>
                  <ul className="space-y-2 text-xs font-semibold opacity-90">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>User verification and role authorization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Institution-wide filing and readiness analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-[#348148] dark:text-[#22c55e]" />
                      <span>Audit logging and billing seat configuration</span>
                    </li>
                  </ul>
                </div>
                <div className={`p-6 rounded-2xl border space-y-3 ${isDark ? 'bg-[#060e08] border-[#22c55e]/25' : 'bg-[#f8faf7] border-[#348148]/20'}`}>
                  <div className="text-xs font-bold">Institution Analytics Overview</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-current/10">
                      <span className="text-[10px] opacity-70 font-bold block">ACTIVE PROJECTS</span>
                      <span className="font-heading text-lg font-black text-[#348148] dark:text-[#22c55e]">24</span>
                    </div>
                    <div className="p-3 rounded-xl border border-current/10">
                      <span className="text-[10px] opacity-70 font-bold block">FILINGS READY</span>
                      <span className="font-heading text-lg font-black text-[#348148] dark:text-[#22c55e]">8</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INTERACTIVE PATENT READINESS SIMULATOR */}
        <section id="simulator" className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="eyic-panel p-8 sm:p-12 relative overflow-hidden">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] text-xs font-bold border border-[#348148]/20">
                <Sliders className="size-3.5" />
                <span>Interactive Readiness Tool</span>
              </div>

              <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight">
                Calculate Your Patent Filing Readiness
              </h2>
              <p className="text-sm opacity-80 leading-relaxed font-medium">
                Check off your completed project deliverables to evaluate your calculated filing readiness percentage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'problem', label: 'Problem & Novel Solution Documented' },
                  { id: 'priorArt', label: 'Prior Art Cross-Referenced' },
                  { id: 'claims', label: 'Independent & Dependent Claims Drafted' },
                  { id: 'drawings', label: 'Technical Figures & Numbers Tagged' },
                  { id: 'forms', label: 'Statutory Form 1 & Form 2 Generated' },
                  { id: 'guideReview', label: 'Guide & Expert Review Completed' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                      checkedItems[item.id]
                        ? 'border-[#348148] bg-[#348148]/10 text-current'
                        : 'border-current/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <div className={`size-5 rounded-md flex items-center justify-center border shrink-0 ${checkedItems[item.id] ? 'bg-[#348148] border-[#348148] text-white font-black' : 'border-current/30'}`}>
                      {checkedItems[item.id] && <Check className="size-3.5" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#060e08] border-[#22c55e]/25' : 'bg-[#f8faf7] border-[#348148]/20'}`}>
                <div className="space-y-1">
                  <span className="text-xs opacity-70 font-bold block uppercase tracking-wider">Calculated Readiness</span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading text-3xl font-black">{calculateReadiness()}% Ready</span>
                    <span className="text-xs font-semibold text-[#348148] dark:text-[#22c55e]">
                      {calculateReadiness() === 100 ? '🎉 Ready for Statutory Filing!' : 'In Progress'}
                    </span>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="eyic-btn-leaf px-6 py-3 rounded-lg text-xs font-bold text-center shadow-md"
                >
                  Start Guided Project →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section id="faq" className="max-w-4xl mx-auto px-6 sm:px-12 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#348148]/10 text-[#348148] dark:text-[#22c55e] text-xs font-bold border border-[#348148]/20">
              <HelpCircle className="size-3.5" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="font-heading text-3xl font-black tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="eyic-panel overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm hover:text-[#348148] dark:hover:text-[#22c55e] transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`size-4 opacity-60 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#348148] dark:text-[#22c55e]' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs opacity-80 font-normal leading-relaxed border-t border-current/10 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL CALL TO ACTION BANNER */}
        <section className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-xl relative overflow-hidden bg-gradient-to-br from-[#123900] via-[#1a4a12] to-[#255e1b] text-white">
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <h2 className="font-heading text-3xl sm:text-5xl font-black tracking-tight text-white">
                Ready to Protect Your Next Invention?
              </h2>
              <p className="text-sm opacity-90 leading-relaxed max-w-lg mx-auto text-emerald-100">
                Join universities, academic research labs, and innovators on PatentHub AI. Begin your first guided patent draft today.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  to="/register"
                  className="eyic-btn-leaf px-8 py-3.5 rounded-lg text-sm font-black shadow-lg cursor-pointer"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="px-7 py-3.5 rounded-lg text-sm font-bold border border-white/30 text-white hover:bg-white/10 transition"
                >
                  Institutional Login
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER (Exact e-Yantra / IIT Bombay Inspired Aesthetic) */}
      <footer className={`border-t border-current/10 py-12 px-6 sm:px-12 text-xs ${isDark ? 'bg-[#060d08]' : 'bg-[#f7faf7]'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-current/10">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#348148] flex items-center justify-center text-white font-bold">
                <Shield className="size-4 fill-current" />
              </div>
              <span className="font-heading font-black text-base">PatentHub AI</span>
            </div>
            <p className="text-xs opacity-75 leading-relaxed font-medium">
              Institutional Patent Intelligence & Statutory IPO Filing Platform for universities and research labs.
            </p>
          </div>

          <div>
            <p className="eyic-eyebrow mb-3">Platform</p>
            <ul className="space-y-2 opacity-80 font-medium">
              <li><a href="#about" className="eyic-link-draw">About Platform</a></li>
              <li><a href="#workflow" className="eyic-link-draw">8-Stage Workflow</a></li>
              <li><a href="#pro" className="eyic-link-draw text-[#348148] dark:text-[#22c55e] font-bold">Pro Version</a></li>
              <li><a href="#capabilities" className="eyic-link-draw">Prior-Art Engine</a></li>
              <li><a href="#simulator" className="eyic-link-draw">Readiness Calculator</a></li>
            </ul>
          </div>

          <div>
            <p className="eyic-eyebrow mb-3">Role Portals</p>
            <ul className="space-y-2 opacity-80 font-medium">
              <li><Link to="/login" className="eyic-link-draw">Student Inventor Portal</Link></li>
              <li><Link to="/login" className="eyic-link-draw">Faculty Guide Workspace</Link></li>
              <li><Link to="/login" className="eyic-link-draw">Patent Attorney Review</Link></li>
              <li><Link to="/login" className="eyic-link-draw">Institutional Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyic-eyebrow mb-3">Compliance & Security</p>
            <ul className="space-y-2 opacity-80 font-medium">
              <li className="flex items-center gap-1.5"><Lock className="size-3.5 text-[#348148] dark:text-[#22c55e]" /> <span>End-to-End Encrypted</span></li>
              <li className="flex items-center gap-1.5"><Shield className="size-3.5 text-[#348148] dark:text-[#22c55e]" /> <span>Zero Data Model Training</span></li>
              <li className="flex items-center gap-1.5"><Award className="size-3.5 text-[#348148] dark:text-[#22c55e]" /> <span>Statutory IPO Forms 1–26</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 opacity-75">
          <p>© 2026 PatentHub AI. All rights reserved.</p>
          <p className="text-xs">Made with care for India's next generation of innovators.</p>
          <div className="flex items-center gap-6 font-semibold">
            <Link to="/login" className="hover:text-[#348148] dark:hover:text-[#22c55e]">Sign In</Link>
            <Link to="/register" className="hover:text-[#348148] dark:hover:text-[#22c55e]">Create Account</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
