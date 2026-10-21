import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Sparkles,
  Search,
  FileCode,
  Layers,
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
  X,
  Cpu,
  Calculator,
  Scale,
  Landmark,
  ShieldCheck,
  Binary
} from 'lucide-react';
import { billingService } from '../services/billingService';
import { useTheme } from '../context/ThemeContext';

interface CaseStudy {
  id: string;
  chipLabel: string;
  title: string;
  domain: string;
  ipcClass: string;
  cpcClass: string;
  noveltyScore: number;
  inventiveStepScore: number;
  section3Status: 'PASSED' | 'QUALIFIED' | 'SCRUTINIZED';
  section3Note: string;
  nearestPriorArt: {
    patentNumber: string;
    similarity: number;
    title: string;
    distinguishingLimitation: string;
  };
  claim1Preview: string;
  abstractSnippet: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'dielectric',
    chipLabel: '💡 Dielectric Water Sensor',
    title: 'Autonomous Solar-Powered IoT Water Contamination Monitor with Planar Interdigitated Capacitive Dielectric Permittivity Sensor',
    domain: 'Biochemical & Environmental Sensing',
    ipcClass: 'G01N 33/18, G01N 27/22',
    cpcClass: 'Y02W 10/37, G01R 27/26',
    noveltyScore: 88,
    inventiveStepScore: 84,
    section3Status: 'PASSED',
    section3Note: 'Physical capacitive electrode coupling avoids pure algorithm exclusion under Section 3(k).',
    nearestPriorArt: {
      patentNumber: 'IN202141045612A',
      similarity: 32,
      title: 'Optical Turbidity and Conductance Sensor Array for Potable Reservoirs',
      distinguishingLimitation: 'Prior art relies on optical transmission; novel claim introduces planar interdigitated electrode geometry measuring dynamic permittivity transients without reagent consumption.'
    },
    claim1Preview: '1. An automated fluid analysis system, comprising: a housing defining a continuous flow chamber; an ambient solar energy harvester; characterized in that said system further comprises a multi-segmented planar interdigitated capacitive electrode array disposed along the flow chamber, configured to measure dynamic dielectric permittivity transients of fluid flowing therethrough; and an edge microcontroller coupled to the array to detect chemical contamination in real-time without requiring reagent consumption.',
    abstractSnippet: 'An autonomous, solar-powered fluid contamination monitoring apparatus is disclosed. The system incorporates a planar interdigitated capacitive electrode array disposed within a continuous flow conduit to measure real-time dielectric permittivity transients in fluid samples, bypassing chemical reagents while maintaining continuous cloud telemetry.'
  },
  {
    id: 'traffic',
    chipLabel: '🚦 Transformer Traffic AI',
    title: 'Real-Time Edge Transformer Adaptive Traffic Signal Control System Using Physical In-Pavement Inductive Loops and Queue Trajectory Modulators',
    domain: 'Intelligent Transportation Systems (ITS)',
    ipcClass: 'G08G 1/01, G06N 3/04',
    cpcClass: 'G08G 1/081, G06F 18/24',
    noveltyScore: 82,
    inventiveStepScore: 79,
    section3Status: 'QUALIFIED',
    section3Note: 'Hardware-in-the-loop edge TPU coupled directly to physical traffic switching relays satisfies CRI Technical Effect test under Section 3(k).',
    nearestPriorArt: {
      patentNumber: 'EP3891024A1',
      similarity: 41,
      title: 'Decentralized Traffic Controller with Vehicle Counting Camera Feed',
      distinguishingLimitation: 'Cited art executes static threshold timers; novel invention employs continuous spatial-temporal attention heads on edge TPU directly modulating physical relay pulse widths.'
    },
    claim1Preview: '1. A physical traffic signal control apparatus, comprising: a multi-phase relay switching interface; an array of physical in-pavement inductive loop sensors; characterized in that said apparatus comprises an edge tensor processor coupled to the sensor array and relay interface, the processor executing a spatial-temporal attention neural network to dynamically calculate vehicle queue dispersion vectors and modulate phase green-time switching intervals in microsecond cycles.',
    abstractSnippet: 'A real-time physical traffic management apparatus utilizing an edge tensor processing unit coupled to inductive loop sensor arrays. The system dynamically predicts queue dispersion vectors using localized attention mechanisms to physically switch multi-phase traffic signal relays, minimizing intersection congestion without centralized network dependence.'
  },
  {
    id: 'glucose',
    chipLabel: '🩺 Non-Invasive PPG Ring',
    title: 'Non-Invasive Wearable Optical Blood Pulse Waveform Analyzer with Differential Photodiode Motion-Artifact Cancellation Circuit',
    domain: 'Biomedical Wearable Electronics',
    ipcClass: 'A61B 5/024, A61B 5/00',
    cpcClass: 'A61B 5/7207, A61B 5/6826',
    noveltyScore: 86,
    inventiveStepScore: 83,
    section3Status: 'PASSED',
    section3Note: 'Measures raw physiological signal waveform metrics on edge device; does not render final therapeutic diagnosis, avoiding Section 3(i) method of treatment exclusion.',
    nearestPriorArt: {
      patentNumber: 'US20220318912A1',
      similarity: 29,
      title: 'Wrist-Worn Photoplethysmography Device with Accelerometer Reference',
      distinguishingLimitation: 'Prior art monitors wrist artery with high motion noise; novel invention discloses annular substrate finger ring with differential multi-wavelength photodiodes performing optical cancellation.'
    },
    claim1Preview: '1. A wearable biometric monitoring device, comprising: an annular substrate configured for finger mounting; a dual-emitter optical diode circuit operating at 660nm and 940nm; characterized in that said device comprises a differential photodiode array and an analog front-end configured to perform optical motion-artifact cancellation across reflected microvascular signals to compute pulse transit time intervals.',
    abstractSnippet: 'A wearable finger-mounted optical sensor ring for continuous biometric monitoring. The device utilizes multi-wavelength dual-emitter diodes paired with a differential photodiode array to cancel motion artifacts, capturing high-fidelity microvascular pulse waveforms suitable for continuous cardiovascular tracking.'
  },
  {
    id: 'drone',
    chipLabel: '🚁 Drone Electrostatic Pollination',
    title: 'Unmanned Aerial Downwash-Coupled Electrostatic Pollen Dispersion Apparatus with Coaxial Ionization Nozzle Array',
    domain: 'Agricultural Robotics & Automation',
    ipcClass: 'B64U 10/10, A01H 1/02',
    cpcClass: 'A01D 46/00, B64U 2101/00',
    noveltyScore: 91,
    inventiveStepScore: 88,
    section3Status: 'PASSED',
    section3Note: 'Mechanical electrostatic dispersion apparatus avoids essential biological process exclusion under Section 3(j).',
    nearestPriorArt: {
      patentNumber: 'US10842085B2',
      similarity: 24,
      title: 'Tractor-Mounted Mechanical Pollen Spray Boom for Orchard Rows',
      distinguishingLimitation: 'Prior art relies on ground vehicle drift; novel invention utilizes coaxial UAV rotor downwash airflow combined with electrostatic ionization nozzles to drive charged pollen directly onto target stigmas.'
    },
    claim1Preview: '1. An unmanned aerial pollination apparatus, comprising: a multi-rotor unmanned aerial vehicle airframe; a downwash airflow duct; characterized in that the apparatus comprises an electrostatic powder ionization nozzle positioned coaxially within the downwash airflow duct to induce a positive electrostatic charge on dispensed pollen particles matching the negative charge of target plant stigmas.',
    abstractSnippet: 'An autonomous aerial pollination delivery system comprising a multi-rotor UAV with a coaxial electrostatic dispersion nozzle. The apparatus harnesses rotor downwash aerodynamic flow to accelerate ionized pollen particles directly toward plant reproductive organs, drastically improving targeted adhesion while minimizing agricultural waste.'
  }
];

export const HomePage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  // Navigation & Scroll Tracking
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Pro Plan Pricing State
  const [proPlanPrice, setProPlanPrice] = useState<string>('₹299');
  const [proBillingInterval, setProBillingInterval] = useState<string>('month');

  // Interactive Hero Patent Terminal State
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy>(CASE_STUDIES[0]);
  const [searchQuery, setSearchQuery] = useState<string>(CASE_STUDIES[0].title);

  // Interactive IPO Statutory Fee Calculator State
  const [calcApplicantType, setCalcApplicantType] = useState<'individual' | 'large'>('individual');
  const [calcPages, setCalcPages] = useState<number>(32);
  const [calcClaims, setCalcClaims] = useState<number>(12);
  const [calcExamType, setCalcExamType] = useState<'none' | 'form18' | 'form18a'>('form18');
  const [calcEarlyPub, setCalcEarlyPub] = useState<boolean>(false);

  // Interactive Forms Inspector State
  const [activeFormTab, setActiveFormTab] = useState<'form1' | 'form2' | 'form3' | 'form5' | 'form26'>('form2');

  // Interactive Role Selector State
  const [activeTabRole, setActiveTabRole] = useState<'inventor' | 'guide' | 'expert' | 'admin'>('inventor');

  // Interactive Readiness Checklist State
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    problem: true,
    priorArt: true,
    claims: true,
    drawings: false,
    forms: false,
    guideReview: false,
  });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contextual auth state for seamless CTA routing
  const token = typeof window !== 'undefined' ? localStorage.getItem('patenthub_token') : null;
  const proCtaRoute = token ? '/org-admin/billing' : '/register';
  const trialCtaRoute = token ? '/org-admin/billing' : '/register';

  let dashboardRoute = '/dashboard';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = String(payload?.role || '').toLowerCase();
      if (role === 'admin' || role === 'administrator') {
        dashboardRoute = '/admin';
      }
    } catch {
      dashboardRoute = '/dashboard';
    }
  }

  // Scroll tracking for reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = totalScroll / (windowHeight || 1);
      setScrollProgress(Math.min(100, Math.max(0, Number(scroll))));
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
        // Fallback default
      });
  }, []);

  // Handle case study selection
  const handleSelectCaseStudy = (cs: CaseStudy) => {
    setSelectedCaseStudy(cs);
    setSearchQuery(cs.title);
  };

  // Indian Patent Office (IPO) Fee Calculation (First Schedule, Patent Rules amended 2024)
  const isEduOrInd = calcApplicantType === 'individual';
  const baseFilingFee = isEduOrInd ? 1600 : 8000;
  const excessPages = Math.max(0, calcPages - 30);
  const excessClaims = Math.max(0, calcClaims - 10);
  const excessPageFee = excessPages * (isEduOrInd ? 160 : 800);
  const excessClaimFee = excessClaims * (isEduOrInd ? 320 : 1600);
  
  let examFee = 0;
  if (calcExamType === 'form18') {
    examFee = isEduOrInd ? 4000 : 20000;
  } else if (calcExamType === 'form18a') {
    examFee = isEduOrInd ? 8000 : 60000;
  }

  const earlyPubFee = calcEarlyPub ? (isEduOrInd ? 2500 : 12500) : 0;
  const totalStatutoryFee = baseFilingFee + excessPageFee + excessClaimFee + examFee + earlyPubFee;

  const toggleChecklist = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateReadiness = () => {
    const total = Object.keys(checkedItems).length;
    const completed = Object.values(checkedItems).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const processStages = [
    {
      step: '01',
      name: 'INVENTION CAPTURE',
      title: 'Technical Disclosure & Scope',
      statute: 'Section 10(4)',
      desc: 'Formulate technological field, specific deficiency in prior solutions, and novel operational mechanisms with guided taxonomy classification.',
      icon: Lightbulb,
      color: '#1A73E8',
      badgeBg: 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#1A73E8]/20 dark:text-[#8AB4F8]',
    },
    {
      step: '02',
      name: 'PRIOR ART CLEARANCE',
      title: 'InPASS & Global Novelty Search',
      statute: 'Section 2(1)(j)',
      desc: 'Execute dual semantic vector search across Indian Patent Database (InPASS), WIPO PATENTSCOPE, EPO Espacenet, and USPTO datasets.',
      icon: Search,
      color: '#00897B',
      badgeBg: 'bg-[#E0F2F1] text-[#00897B] dark:bg-[#00897B]/20 dark:text-[#80CBC4]',
    },
    {
      step: '03',
      name: 'SECTION 3 RISK AUDIT',
      title: 'Statutory Exclusion Screening',
      statute: 'Sections 3(d), 3(k), 3(i)',
      desc: 'Pre-screen claims against Indian non-patentability barriers (software per se, therapeutic diagnostic methods, mere discoveries).',
      icon: Scale,
      color: '#F9AB00',
      badgeBg: 'bg-[#FFF3E0] text-[#E65100] dark:bg-[#F9AB00]/20 dark:text-[#FFB74D]',
    },
    {
      step: '04',
      name: 'CLAIMS DRAFTING',
      title: 'Two-Part Statutory Claims',
      statute: 'Section 10(4)(c)',
      desc: 'Synthesize hierarchical independent and dependent claims adhering strictly to Indian preamble format, characterizing clauses, and antecedent basis.',
      icon: FileCode,
      color: '#34A853',
      badgeBg: 'bg-[#E6F4EA] text-[#1E8E3E] dark:bg-[#34A853]/20 dark:text-[#81C995]',
    },
    {
      step: '05',
      name: 'FIGURES & NUMERALS',
      title: 'Technical Drawing Compliance',
      statute: 'Rule 15(6)',
      desc: 'Annotate mechanical and schematic drawings (FIG. 1, FIG. 2), maintaining bidirectional reference numeral linkage across specification clauses.',
      icon: Layers,
      color: '#7C3AED',
      badgeBg: 'bg-[#F3E8FD] text-[#8430CE] dark:bg-[#9334E8]/20 dark:text-[#C58AF9]',
    },
    {
      step: '06',
      name: 'STATUTORY FORMS',
      title: 'IPO Package Compilation',
      statute: 'Forms 1, 2, 3, 5, 26',
      desc: 'Auto-generate official Indian Patent Office filing bundles with complete inventor declarations, foreign filing undertakings, and power of attorney.',
      icon: FileText,
      color: '#EA4335',
      badgeBg: 'bg-[#FCE8E6] text-[#D93025] dark:bg-[#EA4335]/20 dark:text-[#F28B82]',
    },
    {
      step: '07',
      name: 'MULTI-ROLE AUDIT',
      title: 'Faculty & Patent Agent Sign-Off',
      statute: 'Rule 13 & TTO Governance',
      desc: 'Collaborative audit queue allowing academic guides and registered patent attorneys to inspect claims, annotate diffs, and approve filings.',
      icon: Users,
      color: '#0284C7',
      badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    },
    {
      step: '08',
      name: 'E-FILING LODGMENT',
      title: 'CBR Receipt & Priority Filing',
      statute: 'Rule 24B & Form 18',
      desc: 'Prepare finalized XML/PDF e-filing packages ready for official IP India gateway upload, tracking Application Number, CBR receipt, and FER deadlines.',
      icon: Award,
      color: '#1A73E8',
      badgeBg: 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#1A73E8]/20 dark:text-[#8AB4F8]',
    }
  ];

  const faqs = [
    {
      q: 'How does PatentHub AI comply with the Indian Patents Act, 1970?',
      a: 'PatentHub AI is built specifically around the statutory requirements of the Indian Patents Act, 1970 and the Patent (Amendment) Rules, 2024. The platform structures specifications according to Section 10, validates two-part claim syntax under Indian practice, checks Section 3 statutory exclusions (such as Section 3(k) computer-related inventions and Section 3(d) chemical/substance efficacy), and compiles official Indian Patent Office forms (Form 1, Form 2, Form 3, Form 5, and Form 26).'
    },
    {
      q: 'How does the platform assist with Section 3(k) computer-related invention barriers?',
      a: 'Section 3(k) prohibits patenting of "computer programmes per se or algorithms". PatentHub AI incorporates guidelines issued by the Indian Patent Office for Computer Related Inventions (CRIs). The system guides inventors to anchor their technical claims in tangible physical hardware architectures, edge sensors, technical actuators, and specific industrial effects—ensuring the specification demonstrates a concrete physical technological contribution rather than abstract software.'
    },
    {
      q: 'Is our patent disclosure and research data kept confidential?',
      a: 'Yes, absolutely. PatentHub AI enforces an enterprise Zero-Model-Training policy: user invention disclosures, specifications, figures, and claims are never used to train or fine-tune public AI models. All data is protected with 256-bit AES encryption at rest and TLS 1.3 in transit. Furthermore, access is governed by strict Role-Based Access Controls (RBAC) ensuring unfiled inventions remain strictly privileged attorney-client work product.'
    },
    {
      q: 'Can universities and Technology Transfer Offices (TTOs) manage multiple departments?',
      a: 'Yes. PatentHub AI offers multi-tenant institutional governance for universities, colleges, and research foundations. TTO administrators can oversee student innovators, assign departmental faculty guides, invite external patent attorneys, monitor invention pipeline readiness across campuses, and manage institutional ownership and inventor assignment documentation.'
    },
    {
      q: 'What is the difference between a Provisional and Complete Specification on PatentHub AI?',
      a: 'If your invention is still in the experimental prototype phase, PatentHub AI can compile a Provisional Specification (Form 2) to secure an immediate priority date with the Indian Patent Office at minimum cost. Under Section 9 of the Patents Act, you have 12 months to conduct further R&D and submit the Complete Specification with formal statutory claims, which PatentHub AI then compiles seamlessly.'
    },
    {
      q: 'How are official Indian Patent Office fees calculated?',
      a: 'The Indian Patent Office categorizes applicants under the First Schedule of Patent Rules: Natural Persons, Startups, and Recognized Educational Institutions pay a concessional electronic filing fee (₹1,600 base fee up to 30 pages and 10 claims), whereas Large Entities pay standard fees (₹8,000 base fee). Excess pages, claims beyond 10, early publication (Form 9), and examination requests (Form 18 / 18A) incur itemized government surcharges, which our interactive calculator calculates automatically.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#202124] dark:text-[#F8FAFC] flex flex-col font-sans transition-colors duration-200">
      
      {/* 4-Color Continuous Google Ambient Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] z-50 transition-all duration-150"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#131B2B]/95 backdrop-blur-md border-b border-[#DADCE0] dark:border-[#23314B] transition-colors duration-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex size-8 items-center justify-center rounded-xl bg-white dark:bg-[#1C263B] border border-[#DADCE0] dark:border-[#23314B] shadow-2xs group-hover:shadow-xs transition-all">
              <div className="grid grid-cols-2 gap-0.5 p-0.5">
                <span className="size-1.5 rounded-full bg-[#4285F4]" />
                <span className="size-1.5 rounded-full bg-[#EA4335]" />
                <span className="size-1.5 rounded-full bg-[#FBBC05]" />
                <span className="size-1.5 rounded-full bg-[#34A853]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#202124] dark:text-[#F8FAFC] leading-none">
                PatentHub<span className="gemini-gradient-text font-black">AI</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-[#1A73E8] dark:text-[#8AB4F8] tracking-wider uppercase leading-tight mt-0.5">
                Indian Patent Engineering
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation (Compact & Non-Wrapping) */}
          <div className="hidden lg:flex items-center gap-0.5 text-xs font-medium text-[#5F6368] dark:text-[#94A3B8]">
            <a href="#simulator" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors">
              Terminal
            </a>
            <a href="#workflow" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors">
              Lifecycle
            </a>
            <a href="#forms" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors">
              IPO Forms
            </a>
            <a href="#calculator" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors">
              Fee Calculator
            </a>
            <a href="#roles" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors">
              Roles
            </a>
            <a href="#pro" className="text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-[#E8F0FE] dark:hover:bg-blue-950/40 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors">
              Pro Suite
            </a>
          </div>

          {/* Right Header Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#1C263B] text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#23314B] transition cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="size-3.5 text-[#FBBC04]" /> : <Moon className="size-3.5 text-[#5F6368]" />}
            </button>

            {token ? (
              <Link to={dashboardRoute} className="google-btn-primary px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
                <span>Workspace</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="google-btn-outline px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
                  Sign In
                </Link>
                <Link to="/register" className="google-btn-primary px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
                  <span>Get Started</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger & Quick Theme Toggle */}
          <div className="flex items-center gap-1.5 lg:hidden shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full border border-[#DADCE0] dark:border-[#23314B] text-current"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="size-3.5 text-[#FBBC04]" /> : <Moon className="size-3.5 text-[#5F6368]" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#5F6368] dark:text-[#94A3B8] rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B]"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Slideout Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] px-5 py-3 space-y-1.5 animate-fade-in text-xs font-semibold">
            <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#1A73E8]">Terminal</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#1A73E8]">8-Stage Lifecycle</a>
            <a href="#forms" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#1A73E8]">IPO Forms Engine</a>
            <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#1A73E8]">Fee Calculator</a>
            <a href="#roles" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#1A73E8]">Role Workspaces</a>
            <a href="#pro" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#1A73E8] dark:text-[#8AB4F8]">Pro Suite</a>
            <div className="pt-2 border-t border-[#DADCE0] dark:border-[#23314B] flex items-center gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="google-btn-outline w-1/2 text-center py-2 text-xs">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="google-btn-primary w-1/2 text-center py-2 text-xs">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* MAIN VIEWPORT */}
      <main className="space-y-14 sm:space-y-20 pb-20 overflow-hidden">
        
        {/* ==================================================== */}
        {/* 1. HERO SECTION: Authoritative, Grounded & High-Converting */}
        {/* ==================================================== */}
        <section className="relative px-4 sm:px-6 pt-8 pb-10 sm:pt-14 sm:pb-16 lg:px-8">
          {/* Subtle Google 4-Color Ambient Glows */}
          <div className="pointer-events-none absolute -top-16 left-1/4 size-80 rounded-full bg-[#4285F4]/10 blur-3xl -z-10" />
          <div className="pointer-events-none absolute top-16 right-1/4 size-72 rounded-full bg-[#EA4335]/10 blur-3xl -z-10" />
          <div className="pointer-events-none absolute bottom-10 left-1/3 size-64 rounded-full bg-[#FBBC05]/10 blur-3xl -z-10" />
          <div className="pointer-events-none absolute bottom-0 right-10 size-72 rounded-full bg-[#34A853]/10 blur-3xl -z-10" />

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              
              {/* Left Column: Headline & Value Proposition */}
              <div className="lg:col-span-6 space-y-4 text-left">
                
                {/* Google DeepMind Pill Badge */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] px-3 py-1 shadow-2xs">
                  <Sparkles className="size-3 text-[#1A73E8]" />
                  <span className="text-[11px] font-semibold text-[#202124] dark:text-[#F8FAFC]">
                    Governed by Patents Act 1970 & Patent Rules 2024
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight leading-[1.16] text-[#202124] dark:text-white">
                  Enterprise AI for{' '}
                  <span className="gemini-gradient-text block sm:inline">
                    Patent Engineering
                  </span>{' '}
                  & Statutory IPO Filings.
                </h1>

                <p className="text-xs sm:text-sm leading-relaxed text-[#5F6368] dark:text-[#94A3B8] font-normal max-w-lg">
                  Transform technical disclosures into certified Indian Patent Office specifications. Accelerate prior-art novelty discovery across InPASS and WIPO, draft two-part claims, clear Section 3 barriers, and automate Forms 1 through 26.
                </p>

                {/* Primary Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to={token ? dashboardRoute : "/register"}
                    className="google-btn-primary px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <span>Launch Patent Workspace</span>
                    <ArrowRight className="size-3.5" />
                  </Link>

                  <a
                    href="#calculator"
                    className="google-btn-outline px-4.5 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <span>Calculate Statutory Fees</span>
                    <Calculator className="size-3.5" />
                  </a>
                </div>

                {/* Statutory Trust Ribbon */}
                <div className="pt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#5F6368] dark:text-[#94A3B8] font-medium border-t border-[#DADCE0] dark:border-[#23314B]">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-[#34A853] shrink-0" />
                    <span>InPASS, WIPO & Espacenet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-[#34A853] shrink-0" />
                    <span>Section 3(k) CRI Aligned</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-[#34A853] shrink-0" />
                    <span>Zero AI Model Training Isolation</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive State-of-the-Art Patent Terminal Simulator */}
              <div id="simulator" className="lg:col-span-6 relative">
                <div className="google-card p-4 sm:p-5 space-y-3.5 bg-white dark:bg-[#131B2B] border border-[#DADCE0] dark:border-[#23314B] shadow-lg rounded-2xl">
                  
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between border-b border-[#DADCE0] dark:border-[#23314B] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-blue-800">
                        <Cpu className="size-3.5" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-[#202124] dark:text-white leading-tight">Patent Intelligence Terminal</h2>
                        <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8]">Live novelty, prior art & Form 2 claim analyzer</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[9.5px] font-bold tracking-wider uppercase border border-blue-200 dark:border-blue-800">
                      STAGE 03: NOVELTY MATRIX
                    </span>
                  </div>

                  {/* Google Search Style Concept Selector */}
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#94A3B8] block mb-1">
                      Select Invention Case Study for Live Audit:
                    </label>

                    {/* Google Recommendation Chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {CASE_STUDIES.map((cs) => (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => handleSelectCaseStudy(cs)}
                          className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition cursor-pointer whitespace-nowrap ${
                            selectedCaseStudy.id === cs.id
                              ? 'bg-[#1A73E8] text-white shadow-2xs font-semibold'
                              : 'border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#1C263B] text-[#5F6368] dark:text-[#94A3B8] hover:bg-[#F1F3F4] dark:hover:bg-[#23314B]'
                          }`}
                        >
                          {cs.chipLabel}
                        </button>
                      ))}
                    </div>

                    {/* Elevated Google Search Simulator Bar */}
                    <div className="google-search-bar p-2 px-3 flex items-center gap-2 bg-white dark:bg-[#0B0F17] border border-[#DFE1E5] dark:border-[#23314B]">
                      <Search className="size-3.5 text-[#4285F4] shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs font-medium text-[#202124] dark:text-[#F8FAFC] flex-1 bg-transparent border-none focus:outline-none truncate"
                        placeholder="Type invention disclosure keywords..."
                      />
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        InPASS Synced
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Metrics Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {/* Novelty Gauge */}
                    <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Novelty (Sec 2(1)(j))
                        </span>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 font-mono">
                          {selectedCaseStudy.noveltyScore}% High
                        </span>
                      </div>
                      <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-600 dark:bg-emerald-400 h-full transition-all duration-500"
                          style={{ width: `${selectedCaseStudy.noveltyScore}%` }}
                        />
                      </div>
                      <p className="text-[9.5px] text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                        Inventive step: {selectedCaseStudy.inventiveStepScore}%
                      </p>
                    </div>

                    {/* Classification & Section 3 Screening */}
                    <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8]">
                          IPC Class
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#1A73E8] dark:text-[#8AB4F8]">
                          {selectedCaseStudy.ipcClass.split(',')[0]}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#5F6368] dark:text-[#94A3B8] mt-1 line-clamp-1">
                        {selectedCaseStudy.section3Note}
                      </p>
                    </div>
                  </div>

                  {/* Nearest Prior Art Citation Card */}
                  <div className="p-2.5 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-0.5">
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="font-bold uppercase tracking-wider text-[#5F6368] dark:text-[#94A3B8]">
                        Closest Prior Art Citation:
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800 text-[9.5px]">
                        {selectedCaseStudy.nearestPriorArt.patentNumber} ({selectedCaseStudy.nearestPriorArt.similarity}% overlap)
                      </span>
                    </div>
                    <p className="text-[10.5px] font-semibold text-[#202124] dark:text-[#F8FAFC] truncate">
                      {selectedCaseStudy.nearestPriorArt.title}
                    </p>
                    <p className="text-[9.5px] text-[#5F6368] dark:text-[#94A3B8] leading-tight line-clamp-2">
                      <strong>Distinguishing:</strong> {selectedCaseStudy.nearestPriorArt.distinguishingLimitation}
                    </p>
                  </div>

                  {/* Live Form 2 Statutory Claim 1 Preview */}
                  <div className="p-2.5 sm:p-3 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] font-mono space-y-1">
                    <div className="flex items-center justify-between text-[9.5px] font-sans border-b border-[#DADCE0] dark:border-[#23314B] pb-1">
                      <span className="font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8]">
                        Synthesized Claim 1 (Form 2 Compliant)
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[9.5px]">
                        <Check className="size-2.5" /> Two-Part Format
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[10.5px] leading-relaxed text-[#202124] dark:text-[#F8FAFC] max-h-24 overflow-y-auto pr-1">
                      {selectedCaseStudy.claim1Preview}
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>
        {/* ==================================================== */}
        {/* 2. STATUTORY NUMBERS & PERFORMANCE ACCREDITATION */}
        {/* ==================================================== */}
        <section className="border-y border-[#DADCE0] dark:border-[#23314B] py-6 sm:py-7 bg-[#F8F9FA] dark:bg-[#131B2B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1A73E8] dark:text-[#8AB4F8]">10,000+</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-[#5F6368] dark:text-[#94A3B8]">Prior Art References</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#34A853] dark:text-[#81C995]">Forms 1 to 26</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-[#5F6368] dark:text-[#94A3B8]">Statutory IPO Formats</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#FBBC04] dark:text-[#FDD663]">8 Milestones</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-[#5F6368] dark:text-[#94A3B8]">Pre-Filing Gates</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#EA4335] dark:text-[#F28B82]">256-Bit AES</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-[#5F6368] dark:text-[#94A3B8]">Encrypted IP Vault</div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* 3. THE 8-STAGE STATUTORY LIFECYCLE ARCHITECTURE */}
        {/* ==================================================== */}
        <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
              <Zap className="size-3" />
              <span>Indian Patent Procedure Aligned</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202124] dark:text-white">
              The 8-Stage Statutory Patent Lifecycle
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#94A3B8] leading-relaxed font-normal">
              Every invention transitions through defined statutory gates ensuring technical disclosure rigor, prior-art non-obviousness, and seamless Indian Patent Office e-filing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {processStages.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="google-card p-4 sm:p-5 flex flex-col justify-between group space-y-3 bg-white dark:bg-[#131B2B] border border-[#DADCE0] dark:border-[#23314B] rounded-2xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${st.color}15`, color: st.color }}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badgeBg}`}>
                        {st.step}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span style={{ color: st.color }}>{st.name}</span>
                        <span className="text-[#5F6368] dark:text-[#94A3B8] font-mono text-[9.5px]">{st.statute}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#202124] dark:text-white">{st.title}</h3>
                      <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8] font-normal leading-relaxed mt-1.5">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================================================== */}
        {/* 4. INTERACTIVE OFFICIAL IPO STATUTORY FEE CALCULATOR */}
        {/* ==================================================== */}
        <section id="calculator" className="max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-20">
          <div className="google-card p-5 sm:p-8 bg-white dark:bg-[#131B2B] border border-[#DADCE0] dark:border-[#23314B] shadow-md rounded-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Calculator Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
                  <Calculator className="size-3" />
                  <span>First Schedule, Patent Rules (Amended 2024)</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202124] dark:text-white">
                  Official IPO Statutory Fee Calculator
                </h2>
                <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#94A3B8] leading-relaxed">
                  Calculate government filing fees payable directly to the Indian Patent Office (Controller General of Patents, Designs & Trade Marks).
                </p>

                {/* Control 1: Applicant Classification */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#202124] dark:text-[#F8FAFC]">
                    1. Applicant Statutory Classification:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCalcApplicantType('individual')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        calcApplicantType === 'individual'
                          ? 'border-[#1A73E8] bg-blue-50/60 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8]'
                          : 'border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#5F6368] dark:text-[#94A3B8]'
                      }`}
                    >
                      <div className="font-bold text-xs">🎓 Individual / Startup / Educational Institution</div>
                      <div className="text-[10px] text-[#5F6368] dark:text-[#94A3B8] mt-0.5">₹1,600 Base E-Filing Fee (80% Concession)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcApplicantType('large')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        calcApplicantType === 'large'
                          ? 'border-[#1A73E8] bg-blue-50/60 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8]'
                          : 'border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#5F6368] dark:text-[#94A3B8]'
                      }`}
                    >
                      <div className="font-bold text-xs">🏛️ Large Enterprise / Other Entities</div>
                      <div className="text-[10px] text-[#5F6368] dark:text-[#94A3B8] mt-0.5">₹8,000 Base E-Filing Fee (Standard Rate)</div>
                    </button>
                  </div>
                </div>

                {/* Controls 2 & 3: Pages and Claims Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-[#202124] dark:text-[#F8FAFC]">
                      <span>Specification Pages:</span>
                      <span className="font-mono text-[#1A73E8] dark:text-[#8AB4F8] text-xs">{calcPages} Pages</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={calcPages}
                      onChange={(e) => setCalcPages(Number(e.target.value))}
                      className="w-full accent-[#1A73E8] cursor-pointer h-1.5"
                    />
                    <div className="flex justify-between text-[9.5px] text-[#5F6368] dark:text-[#94A3B8]">
                      <span>30 Pages Included</span>
                      <span>{excessPages > 0 ? `+${excessPages} @ ₹${isEduOrInd ? 160 : 800}/page` : 'No Surcharge'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-[#202124] dark:text-[#F8FAFC]">
                      <span>Statutory Claims Count:</span>
                      <span className="font-mono text-[#1A73E8] dark:text-[#8AB4F8] text-xs">{calcClaims} Claims</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="40"
                      value={calcClaims}
                      onChange={(e) => setCalcClaims(Number(e.target.value))}
                      className="w-full accent-[#1A73E8] cursor-pointer h-1.5"
                    />
                    <div className="flex justify-between text-[9.5px] text-[#5F6368] dark:text-[#94A3B8]">
                      <span>10 Claims Included</span>
                      <span>{excessClaims > 0 ? `+${excessClaims} @ ₹${isEduOrInd ? 320 : 1600}/claim` : 'No Surcharge'}</span>
                    </div>
                  </div>
                </div>

                {/* Control 4: Examination Type */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#202124] dark:text-[#F8FAFC]">
                    2. Request for Examination (Form 18 / 18A):
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCalcExamType('none')}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer text-[11px] ${
                        calcExamType === 'none'
                          ? 'border-[#1A73E8] bg-blue-50/60 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] font-bold'
                          : 'border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#5F6368] dark:text-[#94A3B8]'
                      }`}
                    >
                      <span>Filing Only (₹0)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcExamType('form18')}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer text-[11px] ${
                        calcExamType === 'form18'
                          ? 'border-[#1A73E8] bg-blue-50/60 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] font-bold'
                          : 'border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#5F6368] dark:text-[#94A3B8]'
                      }`}
                    >
                      <span>Form 18 (+₹{isEduOrInd ? '4,000' : '20,000'})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcExamType('form18a')}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer text-[11px] ${
                        calcExamType === 'form18a'
                          ? 'border-[#1A73E8] bg-blue-50/60 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] font-bold'
                          : 'border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#5F6368] dark:text-[#94A3B8]'
                      }`}
                    >
                      <span>Form 18A (+₹{isEduOrInd ? '8,000' : '60,000'})</span>
                    </button>
                  </div>
                </div>

                {/* Control 5: Early Publication Checkbox */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="earlyPub"
                    checked={calcEarlyPub}
                    onChange={(e) => setCalcEarlyPub(e.target.checked)}
                    className="size-3.5 rounded accent-[#1A73E8] cursor-pointer"
                  />
                  <label htmlFor="earlyPub" className="text-[11px] text-[#202124] dark:text-[#F8FAFC] font-medium cursor-pointer">
                    Request Early Publication under Rule 24A (Form 9: +₹{isEduOrInd ? '2,500' : '12,500'})
                  </label>
                </div>
              </div>

              {/* Right Column: Live Statutory Receipt & Itemized Breakdown */}
              <div className="lg:col-span-5">
                <div className="p-4 sm:p-5 rounded-2xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-[#DADCE0] dark:border-[#23314B] pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="size-3.5 text-[#1A73E8]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#202124] dark:text-[#F8FAFC]">
                        IPO Fee Assessment
                      </span>
                    </div>
                    <span className="text-[9.5px] font-mono text-[#5F6368] dark:text-[#94A3B8]">
                      E-Filing Portal Gateway
                    </span>
                  </div>

                  {/* Itemized Table */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#5F6368] dark:text-[#94A3B8]">
                      <span>Form 1 Base E-Filing:</span>
                      <span className="font-mono font-bold text-[#202124] dark:text-[#F8FAFC]">₹{baseFilingFee.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-[#5F6368] dark:text-[#94A3B8]">
                      <span>Excess Pages ({excessPages} pages):</span>
                      <span className="font-mono font-bold text-[#202124] dark:text-[#F8FAFC]">₹{excessPageFee.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-[#5F6368] dark:text-[#94A3B8]">
                      <span>Excess Claims ({excessClaims} claims):</span>
                      <span className="font-mono font-bold text-[#202124] dark:text-[#F8FAFC]">₹{excessClaimFee.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-[#5F6368] dark:text-[#94A3B8]">
                      <span>Examination ({calcExamType.toUpperCase()}):</span>
                      <span className="font-mono font-bold text-[#202124] dark:text-[#F8FAFC]">₹{examFee.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-[#5F6368] dark:text-[#94A3B8]">
                      <span>Early Publication (Form 9):</span>
                      <span className="font-mono font-bold text-[#202124] dark:text-[#F8FAFC]">₹{earlyPubFee.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Total Statutory Fee */}
                  <div className="pt-3 border-t border-[#DADCE0] dark:border-[#23314B] space-y-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#5F6368] dark:text-[#94A3B8]">
                      Total Government Statutory Fee:
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-[#1A73E8] dark:text-[#8AB4F8]">
                        ₹{totalStatutoryFee.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {isEduOrInd ? '80% Subsidy' : 'Standard Rate'}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-[#5F6368] dark:text-[#94A3B8] pt-0.5">
                      Payable electronically upon submission through the official IP India E-Filing Portal.
                    </p>
                  </div>

                  <Link
                    to={token ? dashboardRoute : "/register"}
                    className="google-btn-primary w-full text-center py-2.5 text-xs font-semibold"
                  >
                    <span>Draft & File Application Package</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* ==================================================== */}
        {/* 5. INTERACTIVE STATUTORY IPO FORMS ENGINE */}
        {/* ==================================================== */}
        <section id="forms" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
              <FileText className="size-3" />
              <span>Official Indian Patent Office Bundle</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202124] dark:text-white">
              Automated Statutory Forms Engine
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#94A3B8] leading-relaxed">
              PatentHub AI automatically compiles the entire suite of official IPO forms required for grant, inventorship declaration, and foreign prosecution disclosure.
            </p>
          </div>

          {/* Form Tabs Segmented Pill */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-full border border-[#DADCE0] dark:border-[#23314B] gap-1 bg-[#F1F3F4] dark:bg-[#131B2B] overflow-x-auto max-w-full">
              {[
                { id: 'form1', label: 'Form 1: Grant' },
                { id: 'form2', label: 'Form 2: Specification' },
                { id: 'form3', label: 'Form 3: Foreign Filings' },
                { id: 'form5', label: 'Form 5: Inventorship' },
                { id: 'form26', label: 'Form 26: Power of Attorney' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFormTab(f.id as any)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeFormTab === f.id
                      ? 'bg-white dark:bg-[#1C263B] text-[#1A73E8] dark:text-[#8AB4F8] shadow-2xs'
                      : 'text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Document Preview Frame */}
          <div className="google-card p-4 sm:p-6 max-w-4xl mx-auto bg-white dark:bg-[#131B2B] border border-[#DADCE0] dark:border-[#23314B] font-mono text-xs shadow-xs rounded-2xl">
            {activeFormTab === 'form1' && (
              <div className="space-y-3">
                <div className="border-b border-[#DADCE0] dark:border-[#23314B] pb-2 flex justify-between items-center text-xs font-sans">
                  <span className="font-bold text-[#1A73E8] dark:text-[#8AB4F8] uppercase text-[11px]">FORM 1 • THE PATENTS ACT, 1970</span>
                  <span className="text-[#5F6368] dark:text-[#94A3B8] font-mono text-[10px]">Rule 12 • APPLICATION FOR GRANT</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-1.5 text-[#202124] dark:text-[#F8FAFC] leading-relaxed text-[11px]">
                  <p><strong>1. APPLICANT(S):</strong> Indian Institute of Technology / Registered University Entity</p>
                  <p><strong>2. INVENTOR(S):</strong> Athira Biju, Faculty Co-Inventors (Assignment of Rights attached)</p>
                  <p><strong>3. TITLE OF THE INVENTION:</strong> Autonomous Solar-Powered Hydration Tracking System</p>
                  <p><strong>4. ADDRESS FOR SERVICE:</strong> Registered Patent Agent Office, New Delhi</p>
                  <p><strong>5. STATUTORY DECLARATION:</strong> We hereby declare that the true and first inventor(s) are named above.</p>
                </div>
              </div>
            )}

            {activeFormTab === 'form2' && (
              <div className="space-y-3">
                <div className="border-b border-[#DADCE0] dark:border-[#23314B] pb-2 flex justify-between items-center text-xs font-sans">
                  <span className="font-bold text-[#1A73E8] dark:text-[#8AB4F8] uppercase text-[11px]">FORM 2 • COMPLETE SPECIFICATION</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">SECTION 10 & RULE 13</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-2 text-[#202124] dark:text-[#F8FAFC] leading-relaxed text-[11px]">
                  <p className="text-center font-bold font-sans">"AUTONOMOUS SOLAR-POWERED FLUID DIELECTRIC SENSOR"</p>
                  <p className="text-center text-[#5F6368] dark:text-[#94A3B8] text-[10px]">THE FOLLOWING SPECIFICATION PARTICULARLY DESCRIBES THE INVENTION AND THE MANNER IN WHICH IT IS TO BE PERFORMED.</p>
                  <div className="pt-1.5 border-t border-[#DADCE0] dark:border-[#23314B] space-y-1.5">
                    <p><strong>FIELD OF THE INVENTION:</strong> Capacitive liquid monitoring and solar dielectric permittivity sensing.</p>
                    <p><strong>BACKGROUND & PRIOR ART:</strong> Existing optical monitoring systems suffer from deposition (IN202141045612A)...</p>
                    <p><strong>SUMMARY:</strong> A planar interdigitated electrode array eliminates reagent consumption...</p>
                    <p><strong>CLAIMS:</strong> 1. An automated fluid analysis system comprising: a housing defining a flow chamber, characterized in that...</p>
                  </div>
                </div>
              </div>
            )}

            {activeFormTab === 'form3' && (
              <div className="space-y-3">
                <div className="border-b border-[#DADCE0] dark:border-[#23314B] pb-2 flex justify-between items-center text-xs font-sans">
                  <span className="font-bold text-[#1A73E8] dark:text-[#8AB4F8] uppercase text-[11px]">FORM 3 • SECTION 8 & RULE 12</span>
                  <span className="text-[#5F6368] dark:text-[#94A3B8] text-[10px]">STATEMENT & UNDERTAKING</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-1.5 text-[#202124] dark:text-[#F8FAFC] leading-relaxed text-[11px]">
                  <p>We undertake that until grant, we will keep the Controller informed of corresponding international applications (USPTO, EPO, PCT, JPO) along with filing dates and statuses within statutory timelines.</p>
                </div>
              </div>
            )}

            {activeFormTab === 'form5' && (
              <div className="space-y-3">
                <div className="border-b border-[#DADCE0] dark:border-[#23314B] pb-2 flex justify-between items-center text-xs font-sans">
                  <span className="font-bold text-[#1A73E8] dark:text-[#8AB4F8] uppercase text-[11px]">FORM 5 • SECTION 10(6) & RULE 13(6)</span>
                  <span className="text-[#5F6368] dark:text-[#94A3B8] text-[10px]">DECLARATION AS TO INVENTORSHIP</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-1.5 text-[#202124] dark:text-[#F8FAFC] leading-relaxed text-[11px]">
                  <p>We declare that our assent is given to the filing of this application by the applicant entity, with rights assigned under the institutional IP policy.</p>
                </div>
              </div>
            )}

            {activeFormTab === 'form26' && (
              <div className="space-y-3">
                <div className="border-b border-[#DADCE0] dark:border-[#23314B] pb-2 flex justify-between items-center text-xs font-sans">
                  <span className="font-bold text-[#1A73E8] dark:text-[#8AB4F8] uppercase text-[11px]">FORM 26 • SECTIONS 127 AND 132</span>
                  <span className="text-[#5F6368] dark:text-[#94A3B8] text-[10px]">AUTHORISATION OF A PATENT AGENT</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-1.5 text-[#202124] dark:text-[#F8FAFC] leading-relaxed text-[11px]">
                  <p>We authorize Registered Patent Agent (IN/PA No. 3412) to act on our behalf in all proceedings before the Controller of Patents, including prosecution, hearings, and FER replies.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================================================== */}
        {/* 6. PATENTHUB AI PRO WORKSPACE (Google Workspace Style) */}
        {/* ==================================================== */}
        <section id="pro" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10 scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-semibold text-[#1A73E8] dark:text-[#8AB4F8]">
                <Sparkles className="size-3" />
                <span>ENTERPRISE & ACADEMIC R&D SUITE</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] text-[#202124] dark:text-white">
                Accelerate With{' '}
                <span className="gemini-gradient-text">
                  PatentHub AI Pro
                </span>.
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-[#5F6368] dark:text-[#94A3B8] font-normal">
                Move from preliminary invention notes to an institutional AI engineering workspace equipped for thorough prior-art search, two-part claim hierarchy drafting, faculty review workflows, and official IPO filing bundles.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to={proCtaRoute} className="google-btn-primary px-5 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap">
                  <span>Explore Pro ({proPlanPrice} / {proBillingInterval})</span>
                  <ArrowRight className="size-3.5" />
                </Link>

                <Link to={trialCtaRoute} className="google-btn-outline px-4.5 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap">
                  <span>Start 14-Day Free Trial</span>
                </Link>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[#5F6368] dark:text-[#94A3B8] font-medium">
                <div className="flex items-center gap-1">
                  <Check className="size-3 text-[#34A853]" />
                  <span>14-Day Full Access Evaluation</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="size-3 text-[#34A853]" />
                  <span>Instant Multi-User Collaboration</span>
                </div>
              </div>
            </div>

            {/* Pro Capability Panel */}
            <div className="lg:col-span-6 relative">
              <div className="google-card border border-[#1A73E8]/50 p-5 sm:p-6 space-y-4 bg-white dark:bg-[#131B2B] rounded-2xl shadow-md">
                <div className="flex items-center justify-between border-b border-[#DADCE0] dark:border-[#23314B] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-[#1A73E8] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                      <Shield className="size-4 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#202124] dark:text-white">PatentHub AI Pro Suite</h3>
                      <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8]">Complete institutional intelligence & drafting suite</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[9.5px] font-bold tracking-wider uppercase border border-blue-200 dark:border-blue-800">
                    PRO SUITE
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-[#1A73E8] dark:text-[#8AB4F8] font-mono">{proPlanPrice}</span>
                      <span className="text-xs text-[#5F6368] dark:text-[#94A3B8] font-medium">/ {proBillingInterval}</span>
                    </div>
                    <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8] font-medium mt-0.5">
                      Includes full prior-art search & Form 2 specification compiler
                    </p>
                  </div>
                  <span className="text-[9.5px] font-bold text-[#1A73E8] dark:text-[#8AB4F8] bg-white dark:bg-[#131B2B] px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    High Volume Access
                  </span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8] block">
                    Unlocks Advanced Capabilities:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-medium text-[#202124] dark:text-[#F8FAFC]">
                    {[
                      'InPASS, WIPO & Espacenet Search',
                      'Statutory Form 2 Specification Compiler',
                      'Claim 1–10 Antecedent Verification',
                      'Section 3 Statutory Exclusion Audit',
                      'Technical Drawing Tagging (Rule 15)',
                      'Forms 1, 2, 3, 5 & 26 Package Generator',
                      'Faculty Guide & Attorney Review Queue',
                      'Exportable Word/PDF Ready for IP India',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-[#34A853] shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================== */}
        {/* 7. ROLE-SPECIFIC WORKSPACES */}
        {/* ==================================================== */}
        <section id="roles" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
              <GraduationCap className="size-3" />
              <span>Tailored Stakeholder Portals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202124] dark:text-white">
              Designed for Every Innovation Stakeholder
            </h2>
          </div>

          {/* Segmented Pill Selector */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-full border border-[#DADCE0] dark:border-[#23314B] gap-1 bg-[#F1F3F4] dark:bg-[#131B2B] overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTabRole('inventor')}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTabRole === 'inventor'
                    ? 'bg-white dark:bg-[#1C263B] text-[#1A73E8] dark:text-[#8AB4F8] shadow-2xs'
                    : 'text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-white'
                }`}
              >
                🎓 Student Inventor
              </button>
              <button
                type="button"
                onClick={() => setActiveTabRole('guide')}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTabRole === 'guide'
                    ? 'bg-white dark:bg-[#1C263B] text-[#1A73E8] dark:text-[#8AB4F8] shadow-2xs'
                    : 'text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-white'
                }`}
              >
                🧑‍🏫 Faculty Supervisor
              </button>
              <button
                type="button"
                onClick={() => setActiveTabRole('expert')}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTabRole === 'expert'
                    ? 'bg-white dark:bg-[#1C263B] text-[#1A73E8] dark:text-[#8AB4F8] shadow-2xs'
                    : 'text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-white'
                }`}
              >
                ⚖️ Patent Attorney
              </button>
              <button
                type="button"
                onClick={() => setActiveTabRole('admin')}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTabRole === 'admin'
                    ? 'bg-white dark:bg-[#1C263B] text-[#1A73E8] dark:text-[#8AB4F8] shadow-2xs'
                    : 'text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-white'
                }`}
              >
                🏛️ TTO Director
              </button>
            </div>
          </div>

          {/* Role Showcase Card */}
          <div className="google-card p-5 sm:p-7 max-w-4xl mx-auto bg-white dark:bg-[#131B2B] border border-[#DADCE0] dark:border-[#23314B] rounded-2xl shadow-xs">
            {activeTabRole === 'inventor' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8]">FOR STUDENT INVENTORS</span>
                  <h3 className="text-xl font-bold text-[#202124] dark:text-white">Bridge Laboratory Prototypes to Defensible IP</h3>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] leading-relaxed font-normal">
                    Guided patent drafting empowers academic researchers to translate experimental models into properly formatted patent specifications without getting tripped by legal jargon.
                  </p>
                  <ul className="space-y-1.5 text-xs font-medium text-[#202124] dark:text-[#F8FAFC]">
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Step-by-step 8-stage progress tracker</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>AI-assisted independent and dependent claim trees</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Instant Form 1, Form 2, and Form 3 generation</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Active Invention: Dielectric Water Sensor</span>
                    <span className="text-[#1A73E8] dark:text-[#8AB4F8] text-[11px]">Stage 4: Claims</span>
                  </div>
                  <div className="w-full bg-[#DADCE0] dark:bg-[#23314B] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#1A73E8] h-full w-[65%]"></div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] text-xs space-y-1">
                    <span className="font-bold text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] block">Next Action:</span>
                    <p className="text-[#5F6368] dark:text-[#94A3B8] text-[11px]">Submit Form 2 specification draft to Faculty Guide for review and approval.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'guide' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8]">FOR FACULTY GUIDES</span>
                  <h3 className="text-xl font-bold text-[#202124] dark:text-white">Supervise Student Inventions Rigorously</h3>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] leading-relaxed font-normal">
                    Dedicated supervisor workspace to review student research disclosures, evaluate novelty clearance, verify inventorship assignments, and provide structured inline feedback.
                  </p>
                  <ul className="space-y-1.5 text-xs font-medium text-[#202124] dark:text-[#F8FAFC]">
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Queue for approving student specifications and claim drafts</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Audit trail tracking revisions, comments, and decision logs</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Cohort oversight across multiple supervised degree projects</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-2">
                  <div className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC]">Guide Review Queue (2 Pending)</div>
                  <div className="p-2.5 rounded-lg border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#202124] dark:text-[#F8FAFC]">Dielectric Hydration Bottle</p>
                      <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8]">Student Cohort • Form 2 Claims Audit</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#1A73E8] text-white font-medium rounded-full text-[10px]">Audit</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#202124] dark:text-[#F8FAFC]">Non-Invasive Glucose Ring</p>
                      <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8]">Biomedical Team • Prior Art Sign-off</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#1A73E8] text-white font-medium rounded-full text-[10px]">Audit</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'expert' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8]">FOR PATENT ATTORNEYS</span>
                  <h3 className="text-xl font-bold text-[#202124] dark:text-white">Statutory FTO & Claim Scoping Clearance</h3>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] leading-relaxed font-normal">
                    Perform professional claim scoping, review prior art overlap matrices, certify inventorship declarations, and ensure filings satisfy Indian Patent Office examination standards.
                  </p>
                  <ul className="space-y-1.5 text-xs font-medium text-[#202124] dark:text-[#F8FAFC]">
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Element-by-element prior art claim overlap charts</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Form 18 examination request deadline monitoring</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Statutory filing readiness sign-off and agent clearance</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-2">
                  <div className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC]">Attorney FTO Clearance Panel</div>
                  <div className="p-2.5 rounded-lg border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[#1A73E8] dark:text-[#8AB4F8] text-[11px]">
                      <span>Cited Reference: US10925432B2</span>
                      <span className="text-[#34A853]">Low Risk (32%)</span>
                    </div>
                    <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8]">Distinguished by non-contact dielectric sensing element in Claim 1.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8]">FOR INSTITUTIONAL TTOs</span>
                  <h3 className="text-xl font-bold text-[#202124] dark:text-white">Campus-Wide IP Portfolio Governance</h3>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] leading-relaxed font-normal">
                    Complete administrative oversight over user verification, role assignments, institutional patent metrics, and department innovation audit trails.
                  </p>
                  <ul className="space-y-1.5 text-xs font-medium text-[#202124] dark:text-[#F8FAFC]">
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>User verification and department-wide RBAC</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Campus patent filing readiness analytics</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#34A853]" />
                      <span>Cryptographic invention priority audit logging</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] space-y-2">
                  <div className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC]">TTO Campus Portfolio Metrics</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B]">
                      <span className="text-[9.5px] text-[#5F6368] dark:text-[#94A3B8] font-bold block">ACTIVE PIPELINE</span>
                      <span className="text-xl font-extrabold text-[#1A73E8] dark:text-[#8AB4F8] font-mono">24 Projects</span>
                    </div>
                    <div className="p-3 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B]">
                      <span className="text-[9.5px] text-[#5F6368] dark:text-[#94A3B8] font-bold block">FILINGS READY</span>
                      <span className="text-xl font-extrabold text-[#34A853] dark:text-[#81C995] font-mono">8 Packages</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================================================== */}
        {/* 8. INTERACTIVE PATENT READINESS SIMULATOR */}
        {/* ==================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="google-card p-5 sm:p-8 relative overflow-hidden bg-white dark:bg-[#131B2B] border border-[#DADCE0] dark:border-[#23314B] rounded-2xl">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
                <Sliders className="size-3" />
                <span>Statutory Readiness Evaluation</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202124] dark:text-white">
                Evaluate Your Invention's Filing Readiness
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#94A3B8] leading-relaxed font-normal">
                Verify completion across essential Indian Patent Office milestones to calculate your estimated filing clearance score.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'problem', label: 'Problem & Novel Solution Documented (Section 10)' },
                  { id: 'priorArt', label: 'Prior Art Search Completed (InPASS & WIPO)' },
                  { id: 'claims', label: 'Independent & Dependent Claims Formulated' },
                  { id: 'drawings', label: 'Technical Figures Annotated (Rule 15)' },
                  { id: 'forms', label: 'Statutory Form 1, 2, 3 & 5 Generated' },
                  { id: 'guideReview', label: 'Faculty Guide & Attorney Sign-Off Completed' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between text-xs font-medium transition cursor-pointer ${
                      checkedItems[item.id]
                        ? 'border-[#1A73E8] bg-blue-50/60 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8]'
                        : 'border-[#DADCE0] dark:border-[#23314B] text-[#5F6368] dark:text-[#94A3B8] hover:bg-[#F8F9FA] dark:hover:bg-[#0B0F17]'
                    }`}
                  >
                    <span className="text-[11px]">{item.label}</span>
                    <div className={`size-4 rounded-full flex items-center justify-center border shrink-0 ${checkedItems[item.id] ? 'bg-[#1A73E8] border-[#1A73E8] text-white' : 'border-[#DADCE0] dark:border-[#23314B]'}`}>
                      {checkedItems[item.id] && <Check className="size-2.5" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-[#DADCE0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#5F6368] dark:text-[#94A3B8] font-semibold block uppercase tracking-wider">Calculated Readiness</span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#1A73E8] dark:text-[#8AB4F8] font-mono">{calculateReadiness()}% Ready</span>
                    <span className="text-xs font-semibold text-[#34A853] dark:text-[#81C995]">
                      {calculateReadiness() === 100 ? '🎉 Ready for Official IPO Filing!' : 'Milestones in Progress'}
                    </span>
                  </div>
                </div>
                <Link to="/register" className="google-btn-primary px-4 py-2 text-xs font-semibold whitespace-nowrap">
                  Start Invention Draft →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* 9. STATUTORY PATENT FAQ ACCORDION */}
        {/* ==================================================== */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
              <HelpCircle className="size-3" />
              <span>Statutory Legal & Technical Guidance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202124] dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="google-card overflow-hidden transition-all bg-white dark:bg-[#131B2B] border border-[#DADCE0] dark:border-[#23314B] rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 font-semibold text-xs sm:text-sm text-[#202124] dark:text-white hover:text-[#1A73E8] dark:hover:text-[#8AB4F8] transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`size-3.5 opacity-70 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#1A73E8] dark:text-[#8AB4F8]' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-[#5F6368] dark:text-[#94A3B8] font-normal leading-relaxed border-t border-[#DADCE0] dark:border-[#23314B] pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================================================== */}
        {/* 10. FINAL CALL TO ACTION (Gemini AI Gradient Banner) */}
        {/* ==================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="rounded-2xl p-6 sm:p-10 text-center space-y-4 shadow-lg relative overflow-hidden gemini-gradient-bg text-white">
            <div className="pointer-events-none absolute -top-10 -left-10 size-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 size-48 rounded-full bg-black/10 blur-2xl" />

            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Protect Your Next Breakthrough Invention
              </h2>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-md mx-auto text-blue-50">
                Join forward-thinking universities, academic research scholars, and patent attorneys across India. Launch your guided patent engineering workspace today.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white text-[#1A73E8] hover:bg-slate-50 shadow-sm cursor-pointer transition whitespace-nowrap"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition whitespace-nowrap"
                >
                  Institutional Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#DADCE0] dark:border-[#23314B] py-8 sm:py-10 px-4 sm:px-8 text-xs bg-[#F8F9FA] dark:bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-[#DADCE0] dark:border-[#23314B]">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 p-1 bg-white dark:bg-[#1C263B] rounded-lg border border-[#DADCE0] dark:border-[#23314B] shadow-2xs">
                <span className="size-1.5 rounded-full bg-[#4285F4]" />
                <span className="size-1.5 rounded-full bg-[#EA4335]" />
                <span className="size-1.5 rounded-full bg-[#FBBC05]" />
                <span className="size-1.5 rounded-full bg-[#34A853]" />
              </div>
              <span className="font-extrabold text-sm text-[#202124] dark:text-white">PatentHub AI</span>
            </div>
            <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8] leading-relaxed font-normal">
              Institutional Patent Intelligence & Statutory IPO Filing Platform adhering to the Patents Act, 1970 and Patent Rules, 2024.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8] mb-2.5">Platform Navigation</p>
            <ul className="space-y-1.5 text-[#5F6368] dark:text-[#94A3B8] font-medium text-[11px]">
              <li><a href="#simulator" className="hover:text-[#1A73E8] dark:hover:text-white transition">Terminal Simulator</a></li>
              <li><a href="#workflow" className="hover:text-[#1A73E8] dark:hover:text-white transition">8-Stage Lifecycle</a></li>
              <li><a href="#forms" className="hover:text-[#1A73E8] dark:hover:text-white transition">Statutory Forms Engine</a></li>
              <li><a href="#calculator" className="hover:text-[#1A73E8] dark:hover:text-white transition">IPO Fee Calculator</a></li>
              <li><a href="#pro" className="hover:text-[#1A73E8] dark:hover:text-white font-bold transition">Pro Workspace Suite</a></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8] mb-2.5">Stakeholder Portals</p>
            <ul className="space-y-1.5 text-[#5F6368] dark:text-[#94A3B8] font-medium text-[11px]">
              <li><Link to="/login" className="hover:text-[#1A73E8] dark:hover:text-white transition">Student Inventor Portal</Link></li>
              <li><Link to="/login" className="hover:text-[#1A73E8] dark:hover:text-white transition">Faculty Supervisor Workspace</Link></li>
              <li><Link to="/login" className="hover:text-[#1A73E8] dark:hover:text-white transition">Patent Attorney Review Queue</Link></li>
              <li><Link to="/login" className="hover:text-[#1A73E8] dark:hover:text-white transition">University TTO Director Portal</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8] mb-2.5">Compliance & Security</p>
            <ul className="space-y-1.5 text-[#5F6368] dark:text-[#94A3B8] font-medium text-[11px]">
              <li className="flex items-center gap-1.5"><Lock className="size-3 text-[#34A853]" /> <span>256-Bit Encrypted Data Vault</span></li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="size-3 text-[#1A73E8]" /> <span>Zero Model Training Privacy</span></li>
              <li className="flex items-center gap-1.5"><Binary className="size-3 text-[#FBBC04]" /> <span>CRI Section 3(k) Guidelines</span></li>
              <li className="flex items-center gap-1.5"><Award className="size-3 text-[#EA4335]" /> <span>Statutory Forms 1 through 26</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[#5F6368] dark:text-[#94A3B8] text-[11px]">
          <p>© 2026 PatentHub AI. Designed in Google Material 3 Design System.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link to="/login" className="hover:text-[#1A73E8] dark:hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-[#1A73E8] dark:hover:text-white transition">Create Account</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
