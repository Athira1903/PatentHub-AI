import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  FileText,
  Cpu,
  UserPlus,
  Lightbulb,
  CheckCircle2,
  FileCode,
  BarChart2,
  Sparkles,
  Key,
  Eye,
  Calendar,
  Layers,
  Send,
  Upload,
  FileCheck,
  CheckSquare as CheckIcon,
  Trash2,
  Loader2,
  BookOpen,
  Folder,
  FolderOpen,
  Activity,
  Settings as SettingsIcon,
  Search,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

export interface ProjectDetail {
  id: string;
  title: string;
  innovationIdea: string;
  problemStatement: string;
  proposedSolution: string;
  existingSolutions?: string;
  drawbacks?: string;
  novelFeatures?: string;
  objectives?: string;
  technicalDomain: string;
  keywords?: string;
  category: string;
  stage: string;
  expectedFilingDate?: string;
  patentType?: string;
  visibility?: string;
  isOwner: boolean;
  isArchived: boolean;
  createdAt: string;
  owner: { id: string; fullName: string; username: string; email: string; institution?: string | null };
  members: Array<{ id: string; role: string; user: { id: string; fullName: string; username: string; email: string } }>;
  documents: Array<{ id: string; name: string; fileUrl: string; fileType?: string; fileSize?: number; version?: number; category: string; createdAt: string }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
    assignedTo?: { id: string; fullName: string; username: string } | null;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; fullName: string; username: string; role: string };
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: { fullName: string };
  }>;
}

const STAGES = [
  { key: 'IDEA', label: 'Idea' },
  { key: 'LITERATURE_REVIEW', label: 'Literature Review' },
  { key: 'PROTOTYPE', label: 'Prototype' },
  { key: 'DOCUMENTATION', label: 'Documentation' },
  { key: 'FORMS_PREPARATION', label: 'Forms Preparation' },
  { key: 'GUIDE_REVIEW', label: 'Guide Review' },
  { key: 'PATENT_EXPERT_REVIEW', label: 'Patent Expert Review' },
  { key: 'FILING_READY', label: 'Filing Ready' },
  { key: 'FILED', label: 'Filed' },
];

export const getStageProgress = (stage: string) => {
  const index = STAGES.findIndex((s) => s.key === stage);
  if (index === -1) return 12;
  return Math.round(((index + 1) / STAGES.length) * 100);
};

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useOutletContext<{ user: any }>() || {};
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const projectMemberRecord = project?.members?.find((m: any) => m.user.id === user?.id || m.user.id === user?.userId);
  const userProjectRole = projectMemberRecord?.role; // 'INVENTOR' | 'CO_INVENTOR' | 'GUIDE' | 'PATENT_EXPERT'
  const isProjectReviewer = userProjectRole === 'GUIDE' || userProjectRole === 'PATENT_EXPERT' || user?.role === 'Admin';
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | 'Overview'
    | 'Innovation Workspace'
    | 'Prototype Module'
    | 'Document Manager'
    | 'Patent Forms'
    | 'Collaboration'
    | 'Guide Reviews'
    | 'Expert Audit'
    | 'Filing Timeline'
    | 'Reports Center'
    | 'AI Workspace'
  >('Overview');

  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Basic project fields for edit
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    innovationIdea: '',
    problemStatement: '',
    existingSolutions: '',
    drawbacks: '',
    proposedSolution: '',
    novelFeatures: '',
    objectives: '',
    technicalDomain: '',
    keywords: '',
    category: '',
    patentType: 'Utility',
    visibility: 'PRIVATE',
  });

  const [isAutosaving, setIsAutosaving] = useState(false);

  useEffect(() => {
    if (!project || !editMode) return;

    // Check if anything actually changed to avoid saving immediately on load
    const changed =
      formData.title !== project.title ||
      formData.innovationIdea !== project.innovationIdea ||
      formData.problemStatement !== project.problemStatement ||
      formData.existingSolutions !== (project.existingSolutions || '') ||
      formData.drawbacks !== (project.drawbacks || '') ||
      formData.proposedSolution !== project.proposedSolution ||
      formData.novelFeatures !== (project.novelFeatures || '') ||
      formData.objectives !== (project.objectives || '') ||
      formData.technicalDomain !== project.technicalDomain ||
      formData.keywords !== (project.keywords || '') ||
      formData.category !== project.category ||
      formData.patentType !== (project.patentType || 'Utility') ||
      formData.visibility !== (project.visibility || 'PRIVATE');

    if (!changed) return;

    setIsAutosaving(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.put(`/projects/${id}`, formData);
        setProject((prev) => (prev ? { ...prev, ...response.data.project } : null));
        setIsAutosaving(false);
      } catch (err) {
        setIsAutosaving(false);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData, editMode, id, project]);

  // AI loading indicators
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Invite states
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState<'CO_INVENTOR' | 'GUIDE' | 'PATENT_EXPERT'>('CO_INVENTOR');
  const [inviting, setInviting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Task states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Prototype states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [drawingVersions, setDrawingVersions] = useState<any[]>([
    {
      version: 'V1',
      original: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
      drawing: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400',
      metadata: 'Initial visual circuit blueprint drafting',
      date: '2026-07-28',
    },
  ]);
  const [isProcessingDrawing, setIsProcessingDrawing] = useState(false);

  // AI assistant state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your context-aware Specification Companion. Ask me to improve your innovation descriptions, suggest claims schemas, or explain filing documents.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Similarity states
  const [similarityData, setSimilarityData] = useState<any>(null);
  const [loadingSimilarity, setLoadingSimilarity] = useState(false);
  const [similarityError, setSimilarityError] = useState<string | null>(null);

  // Novelty states
  const [noveltyData, setNoveltyData] = useState<any>(null);
  const [loadingNovelty, setLoadingNovelty] = useState(false);
  const [noveltyError, setNoveltyError] = useState<string | null>(null);

  // Patent Search & Reference States
  const [patentSearchQuery, setPatentSearchQuery] = useState('');
  const [patentSearchResults, setPatentSearchResults] = useState<any[]>([]);
  const [loadingPatentSearch, setLoadingPatentSearch] = useState(false);
  const [patentSearchError, setPatentSearchError] = useState<string | null>(null);

  const [savedReferences, setSavedReferences] = useState<any[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);

  // Determine if the current project member has rights to manage patent references
  const canManageReferences =
    user?.role === 'Admin' ||
    project?.owner?.id === user?.id ||
    project?.owner?.id === user?.userId ||
    userProjectRole === 'INVENTOR' ||
    userProjectRole === 'CO_INVENTOR';

  // Search Patents
  const handlePatentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patentSearchQuery.trim()) return;
    setLoadingPatentSearch(true);
    setPatentSearchError(null);
    try {
      const res = await api.get(`/projects/${id}/patents/search?q=${encodeURIComponent(patentSearchQuery.trim())}`);
      setPatentSearchResults(res.data.results || []);
    } catch (err: any) {
      setPatentSearchError(err.response?.data?.message || 'Failed to search patents.');
    } finally {
      setLoadingPatentSearch(false);
    }
  };

  // Fetch Saved References
  const fetchSavedReferences = async () => {
    setLoadingReferences(true);
    try {
      const res = await api.get(`/projects/${id}/patents/references`);
      setSavedReferences(res.data.references || []);
    } catch (err) {
      console.error('Failed to load saved references', err);
    } finally {
      setLoadingReferences(false);
    }
  };

  // Save Reference
  const handleSaveReference = async (pat: any) => {
    try {
      const res = await api.post(`/projects/${id}/patents/references`, pat);
      toast.success('Patent saved to project as a reference!');
      setSavedReferences(prev => [res.data.reference, ...prev]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save reference.');
    }
  };

  // Delete Reference
  const handleDeleteReference = async (refId: string) => {
    try {
      await api.delete(`/projects/${id}/patents/references/${refId}`);
      toast.success('Patent reference deleted from project.');
      setSavedReferences(prev => prev.filter(r => r.id !== refId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete reference.');
    }
  };

  // Forms checklist wizard
  const [activeFormIndex, setActiveFormIndex] = useState<string | null>(null);
  const [formField1, setFormField1] = useState('');
  const [formField2, setFormField2] = useState('');

  // Guide Review States
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Drafting Tips and match expansion states
  const [showTips, setShowTips] = useState(true);
  const [expandedMatchIndex, setExpandedMatchIndex] = useState<number | null>(null);

  // Load project detail
  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      const proj = response.data.project;
      setProject(proj);
      setFormData({
        title: proj.title,
        innovationIdea: proj.innovationIdea,
        problemStatement: proj.problemStatement,
        existingSolutions: proj.existingSolutions || '',
        drawbacks: proj.drawbacks || '',
        proposedSolution: proj.proposedSolution,
        novelFeatures: proj.novelFeatures || '',
        objectives: proj.objectives || '',
        technicalDomain: proj.technicalDomain,
        keywords: proj.keywords || '',
        category: proj.category,
        patentType: proj.patentType || 'Utility',
        visibility: proj.visibility || 'PRIVATE',
      });
    } catch (error: any) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchSavedReferences();
    }
  }, [id]);

  // Username search debouncing
  useEffect(() => {
    const search = async () => {
      if (!inviteUsername.trim() || inviteUsername.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/users/search?q=${inviteUsername}`);
        setSearchResults(res.data || []);
      } catch (e) {
        setSearchResults([]);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [inviteUsername]);

  const handleStageChange = async (newStage: string) => {
    try {
      const response = await api.put(`/projects/${id}`, { stage: newStage });
      setProject((prev) => (prev ? { ...prev, stage: response.data.project.stage } : null));
      toast.success(`Updated stage to ${newStage.replace(/_/g, ' ')}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update stage');
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put(`/projects/${id}`, formData);
      setProject((prev) => (prev ? { ...prev, ...response.data.project } : null));
      setEditMode(false);
      toast.success('Project details updated successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save changes');
    }
  };

  // AI Innovation triggers
  const triggerAiInnovation = async (actionType: 'abstract' | 'description' | 'keywords' | 'title') => {
    setAiLoading(actionType);
    try {
      const response = await api.post(`/projects/${id}/ai/innovation`, { action: actionType });
      const text = response.data.suggestion;

      if (actionType === 'abstract') {
        setFormData((prev) => ({ ...prev, innovationIdea: text }));
      } else if (actionType === 'description') {
        setFormData((prev) => ({ ...prev, proposedSolution: text }));
      } else if (actionType === 'keywords') {
        setFormData((prev) => ({ ...prev, keywords: text }));
      } else if (actionType === 'title') {
        setFormData((prev) => ({ ...prev, title: text }));
      }
      toast.success(`AI suggested update populated in edit fields!`);
      setEditMode(true);
    } catch (e) {
      toast.error('AI assistant failed to generate suggestion.');
    } finally {
      setAiLoading(null);
    }
  };

  // Invite member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      await api.post('/collaboration/invite', {
        projectId: id,
        username: inviteUsername.trim(),
        role: inviteRole,
      });
      toast.success(`Invitation sent successfully to @${inviteUsername}!`);
      setInviteUsername('');
      setSearchResults([]);
      fetchProject();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  // Task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    try {
      await api.post(`/projects/${id}/tasks`, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignedToUsername: taskAssignee.trim() || undefined,
      });
      toast.success('Task assigned successfully!');
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      fetchProject();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to assign task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/projects/${id}/tasks/${taskId}`, { status: nextStatus });
      toast.success(`Task marked as ${nextStatus.toLowerCase()}`);
      fetchProject();
    } catch (e) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      fetchProject();
    } catch (e) {
      toast.error('Failed to delete task');
    }
  };

  const handleUploadDocument = async (file: File, category = 'SUPPORTING') => {
    const formDataObj = new FormData();
    formDataObj.append('document', file);
    formDataObj.append('projectId', id!);
    formDataObj.append('category', category);

    setUploadingDoc(true);
    try {
      await api.post('/documents/upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded successfully!');
      fetchProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted successfully!');
      fetchProject();
    } catch (err: any) {
      toast.error('Failed to delete document.');
    }
  };

  const generatePdfReport = (reportType: string) => {
    if (!project) return;
    const doc = new jsPDF();

    // Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('PatentHub AI', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('IPO Compliant Lifecycle Management Systems Report', 15, 30);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportType, 15, 55);

    // Separator line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 60, 195, 60);

    // Write key parameters
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);

    let yPos = 70;

    const writeField = (label: string, value: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 15, yPos);
      doc.setFont('helvetica', 'normal');

      const splitVal = doc.splitTextToSize(value || 'N/A', 135);
      doc.text(splitVal, 60, yPos);
      yPos += (splitVal.length * 6) + 4;
    };

    writeField('Project Title', project.title);
    writeField('Technical Domain', project.technicalDomain);
    writeField('Category', project.category);
    writeField('Filing Stage', project.stage.replace(/_/g, ' '));
    writeField('Owner / Inventor', project.owner.fullName);
    writeField('Institution', project.owner.institution || 'N/A');

    if (reportType === 'Patent Summary Report') {
      writeField('Innovation Abstract', project.innovationIdea);
      writeField('Problem Statement', project.problemStatement);
      writeField('Proposed Solution', project.proposedSolution);
      writeField('Objectives', project.objectives || 'N/A');
      writeField('Keywords', project.keywords || 'N/A');
    } else if (reportType.includes('Filing') || reportType.includes('readiness')) {
      writeField('Forms Compilation', 'IPO Forms 1, 2, 3, 5, and 26 pre-filled drafts generated successfully.');
      writeField('Filing Readiness Index', `${getStageProgress(project.stage)}% stage completion`);
      writeField('Task Completion', `${project.tasks.filter(t => t.status === 'COMPLETED').length} / ${project.tasks.length} tasks completed`);
    } else {
      writeField('Review Comments Logged', `${project.comments?.length || 0} observations cataloged`);
      project.comments?.forEach((c) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${c.user.fullName} (${c.user.role}):`, 15, yPos);
        doc.setFont('helvetica', 'italic');
        const lines = doc.splitTextToSize(`"${c.content}"`, 175);
        doc.text(lines, 15, yPos + 6);
        yPos += (lines.length * 6) + 12;
      });
    }

    const cleanFileName = `${reportType.toLowerCase().replace(/ /g, '_')}_${project.id.substring(0, 8)}.pdf`;
    doc.save(cleanFileName);
    toast.success(`${reportType} downloaded!`);
  };

  const generateIpoFormPdf = (formId: string) => {
    if (!project) return;
    const doc = new jsPDF();

    // Top border color block (slate-800)
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`IPO Patent Form ${formId}`, 15, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Intellectual Property India (Government of India / Patent Office Registry)', 15, 25);

    // Main section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`FORM ${formId}`, 15, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 55, 195, 55);

    let yPos = 65;
    const writeLine = (label: string, text: string, isHeader = false) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      doc.setFontSize(isHeader ? 10 : 9);
      
      if (label) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 15, yPos);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(text || 'N/A', 135);
        doc.text(splitText, 60, yPos);
        yPos += (splitText.length * 5) + 3;
      } else {
        const splitText = doc.splitTextToSize(text || '', 180);
        doc.text(splitText, 15, yPos);
        yPos += (splitText.length * 5) + 3;
      }
    };

    if (formId === '1') {
      writeLine('', 'APPLICATION FOR GRANT OF PATENT (Section 7, 54 & 135; Rule 5(1))', true);
      yPos += 5;
      writeLine('Applicant Type', formField2 || 'Natural Person');
      writeLine('Applicant Name', project.owner.fullName);
      writeLine('Nationality', 'Indian');
      writeLine('Address (Institution)', project.owner.institution || 'Registry Institution');
      writeLine('Email', project.owner.email);
      writeLine('Title of Invention', project.title);
      writeLine('State / Province', formField1 || 'State Default');
      yPos += 5;
      writeLine('', 'INVENTOR(S) DETAILS:', true);
      writeLine('1. First Inventor', `${project.owner.fullName} (@${project.owner.username})`);
      project.members.forEach((m, idx) => {
        writeLine(`${idx + 2}. Co-Inventor`, `${m.user.fullName} (@${m.user.username}) - [${m.role.replace(/_/g, ' ')}]`);
      });
    } else if (formId === '2') {
      writeLine('', 'PROVISIONAL / COMPLETE SPECIFICATION (Section 10; Rule 13)', true);
      yPos += 5;
      writeLine('1. Title of Invention', project.title);
      writeLine('2. Applicant Details', `${project.owner.fullName}, Nationality: Indian, Address: ${project.owner.institution || 'N/A'}`);
      writeLine('3. Preamble to Description', 'The following specification particularly describes the invention and the manner in which it is to be performed.');
      yPos += 5;
      writeLine('', '4. DESCRIPTION:', true);
      writeLine('Abstract Description', project.innovationIdea);
      writeLine('Problem Statement', project.problemStatement);
      writeLine('Proposed Solution', project.proposedSolution);
      writeLine('Novel Features', project.novelFeatures || 'N/A');
      writeLine('Scope Claims Count', formField1 || '1');
    } else if (formId === '3') {
      writeLine('', 'STATEMENT AND UNDERTAKING UNDER SECTION 8 (Rule 12)', true);
      yPos += 5;
      writeLine('Applicant Name', project.owner.fullName);
      writeLine('Title of Invention', project.title);
      writeLine('Undertaking Details', 'I hereby declare that we have not made any application for a patent for the same or substantially the same invention in any country outside India other than those disclosed herein.');
    } else if (formId === '5') {
      writeLine('', 'DECLARATION AS TO INVENTORSHIP (Section 10(6); Rule 4.17(i))', true);
      yPos += 5;
      writeLine('Applicant Name', project.owner.fullName);
      writeLine('Title of Invention', project.title);
      writeLine('Declaration text', `I/We, the true and first inventors for the patent project titled "${project.title}" hereby confirm our inventorship credentials under IPO terms.`);
    } else if (formId === '26') {
      writeLine('', 'FORM FOR AUTHORISATION OF A PATENT AGENT / ATTORNEY (Section 140; Rule 135)', true);
      yPos += 5;
      writeLine('Principal Authoriser', project.owner.fullName);
      writeLine('Designated Patent Agent', 'IPO Registered Attorney Agent (appointed via Form 26 authorization)');
      writeLine('Scope of Authorization', `To act, represent, file and prosecute the patent specification titled "${project.title}" on behalf of the applicant.`);
    }

    doc.save(`IPO_Form_${formId}_${project.title.toLowerCase().replace(/ /g, '_')}.pdf`);
    toast.success(`Form ${formId} downloaded successfully!`);
  };

  // Prototype photo drawing transformation simulation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const triggerGenerateDrawing = async () => {
    setIsProcessingDrawing(true);
    try {
      const res = await api.post(`/projects/${id}/ai/drawing`, {
        originalUrl: previewUrl,
        originalName: selectedFile?.name || 'sketch.png',
      });
      const data = res.data;

      // Add to drawing list history
      setDrawingVersions((prev) => [
        {
          version: data.version,
          original: data.originalImage,
          drawing: data.patentDrawing,
          metadata: `FIG 1: Schematic assembly view with reference tags: ${data.drawingMetadata.components
            .map((c: any) => `${c.number} (${c.label})`)
            .join(', ')}`,
          date: new Date().toLocaleDateString(),
        },
        ...prev,
      ]);
      toast.success('AI conversion successfully generated 2D schematic layout!');
    } catch (e) {
      toast.error('AI Drawing generator failed');
    } finally {
      setIsProcessingDrawing(false);
    }
  };

  // Chatbot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Simulate context-aware project query
      let promptAction: 'abstract' | 'description' | 'keywords' | 'title' = 'abstract';
      if (userText.toLowerCase().includes('claim') || userText.toLowerCase().includes('novel')) {
        promptAction = 'description';
      } else if (userText.toLowerCase().includes('keyword')) {
        promptAction = 'keywords';
      } else if (userText.toLowerCase().includes('title')) {
        promptAction = 'title';
      }

      const res = await api.post(`/projects/${id}/ai/innovation`, { action: promptAction });
      let reply = `Here is a drafted recommendation based on your current project details: \n\n${res.data.suggestion}`;
      if (userText.toLowerCase().includes('form 2')) {
        reply = `Form 2 is the Specification document. Based on your project, the Title is: "${project?.title}". \n\nThe technical description includes: "${project?.proposedSolution}". Make sure to explicitly write the field of invention, background, and summary of implementation in claims format.`;
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } catch (e) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, I encountered an issue parsing your query.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChipClick = (prompt: string) => {
    setChatInput(prompt);
  };

  // Run Similarity Check
  const runSimilarityCheck = async () => {
    setLoadingSimilarity(true);
    setSimilarityError(null);
    try {
      const res = await api.get(`/projects/${id}/ai/similarity`);
      setSimilarityData(res.data);
      toast.success('Prior art index search completed successfully!');
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Google Gemini AI similarity analysis is currently unavailable.';
      setSimilarityError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoadingSimilarity(false);
    }
  };

  // Run Novelty assessment
  const runNoveltyAssessment = async () => {
    setLoadingNovelty(true);
    setNoveltyError(null);
    try {
      const res = await api.get(`/projects/${id}/ai/novelty`);
      setNoveltyData(res.data);
      toast.success('Claims novelty assessment completed!');
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Google Gemini AI novelty assessment is currently unavailable.';
      setNoveltyError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoadingNovelty(false);
    }
  };

  // Guide reviews comment submit
  const handleSubmitReviewComment = async (e: React.FormEvent, stageAction: 'APPROVE' | 'REJECT' | 'COMMENT' | 'EXPERT_APPROVE' | 'EXPERT_REJECT' | 'EXPERT_FILED') => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      // Add comments via standard comments endpoint
      await api.post(`/projects/${id}/comments`, { content: reviewComment.trim() });

      if (stageAction === 'APPROVE') {
        // Increment stage or update status
        const nextIndex = STAGES.findIndex((s) => s.key === project?.stage) + 1;
        if (nextIndex < STAGES.length) {
          await handleStageChange(STAGES[nextIndex].key);
        }
      } else if (stageAction === 'EXPERT_APPROVE') {
        await handleStageChange('FILING_READY');
      } else if (stageAction === 'EXPERT_FILED') {
        await handleStageChange('FILED');
      } else if (stageAction === 'EXPERT_REJECT' || stageAction === 'REJECT') {
        await handleStageChange('DOCUMENTATION');
      }

      toast.success('Review comments and action processed successfully!');
      setReviewComment('');
      fetchProject();
    } catch (err) {
      toast.error('Failed to process review feedback');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-medium">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  if (!project) {
    return <div className="p-12 text-center text-rose-600 font-medium">Project not found or access denied.</div>;
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === project.stage);

  const tabs = [
    { name: 'Overview', icon: Lightbulb, subtitle: 'Workspace Dashboard' },
    { name: 'Innovation Workspace', icon: FileText, subtitle: 'Patent Drafting Details' },
    { name: 'Prototype Module', icon: Cpu, subtitle: 'Blueprints & CAD Files' },
    { name: 'Document Manager', icon: Folder, subtitle: 'Folder-Grouped Repository' },
    { name: 'Patent Forms', icon: FileCode, subtitle: 'IPO Filing Packages' },
    { name: 'Collaboration', icon: Users, subtitle: 'Team Assignments & Tasks' },
    { name: 'Guide Reviews', icon: BookOpen, subtitle: 'Supervisor Comments Board' },
    { name: 'Expert Audit', icon: Eye, subtitle: 'Patent Expert Evaluation' },
    { name: 'Filing Timeline', icon: Calendar, subtitle: 'Lifecycle Progress Stages' },
    { name: 'Reports Center', icon: BarChart2, subtitle: 'PDF Summaries & Compliance' },
    { name: 'AI Workspace', icon: Sparkles, subtitle: 'Specification Drafting and Analysis Tools' },
  ] as const;

  const sidebarLinks = [
    { label: 'Overview', tab: 'Overview', icon: Lightbulb },
    { label: 'Specification', tab: 'Innovation Workspace', icon: FileText },
    { label: 'Tasks', tab: 'Collaboration', icon: CheckIcon },
    { label: 'Documents', tab: 'Document Manager', icon: Folder },
    { label: 'AI Tools', tab: 'AI Workspace', icon: Cpu },
    { label: 'Members', tab: 'Collaboration', icon: Users },
    { label: 'Activity Log', tab: 'Filing Timeline', icon: Activity },
    { label: 'Forms', tab: 'Patent Forms', icon: FileCode },
    { label: 'Settings', tab: 'Reports Center', icon: SettingsIcon },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-505 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                {project.category}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">• {project.technicalDomain}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{project.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {project.isOwner && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              {editMode ? 'Finish Editing' : 'Edit Project'}
            </button>
          )}
          <span className="text-xs text-indigo-700 font-extrabold bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
            Filing Index: {getStageProgress(project.stage)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Project Sidebar */}
        <aside className="lg:col-span-1 lg:sticky lg:top-4 h-fit space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[9px] font-mono text-slate-450 uppercase">Project ID</span>
              <h3 className="font-extrabold text-slate-800 text-xs truncate uppercase">PI-{project.id.substring(0, 10).toUpperCase()}</h3>
            </div>
            
            {/* Stage indicator progress bar */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>{project.stage.replace(/_/g, ' ')}</span>
                <span className="font-mono">{getStageProgress(project.stage)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: `${getStageProgress(project.stage)}%` }} />
              </div>
            </div>

            {/* Sidebar Menu items */}
            <nav className="space-y-1 border-t border-slate-100 pt-3">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.tab;
                return (
                  <button
                    key={link.label}
                    onClick={() => setActiveTab(link.tab as any)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-450'}`} />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Content Panel */}
        <div className="lg:col-span-3 p-8 rounded-3xl bg-white border border-slate-200 shadow-md min-h-[400px] space-y-6">
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between shadow-3xs">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{activeTab}</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                ✦ {tabs.find((t) => t.name === activeTab)?.subtitle}
              </p>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              SEC_ID: {activeTab.replace(/\s+/g, '_').toUpperCase()}
            </span>
          </div>
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Patent Type</p>
                  <p className="text-xs font-bold text-slate-800">{project.patentType || 'Utility'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Visibility</p>
                  <p className="text-xs font-bold text-slate-800">{project.visibility || 'PRIVATE'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Expected Filing Date</p>
                  <p className="text-xs font-bold text-slate-800">
                    {project.expectedFilingDate ? new Date(project.expectedFilingDate).toLocaleDateString() : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>

            {project.keywords && (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> Keywords:
                </span>
                {project.keywords.split(',').map((kw, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    {kw.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Innovation Abstract</h4>
                <p className="text-slate-850 text-xs sm:text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-medium">
                  {project.innovationIdea}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problem Statement</h4>
                <p className="text-slate-850 text-xs sm:text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-medium">
                  {project.problemStatement}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proposed Solution</h4>
                <p className="text-slate-850 text-xs sm:text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-medium">
                  {project.proposedSolution}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* T2: INNOVATION */}
        {activeTab === 'Innovation Workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Innovation Draft Spec Editor</span>
                    <button
                      type="button"
                      onClick={() => setShowTips(!showTips)}
                      className="px-2 py-0.5 text-[8px] font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 rounded transition-all cursor-pointer"
                    >
                      {showTips ? 'Hide Drafting Tips' : 'Show Drafting Tips'}
                    </button>
                  </h3>
                  {editMode && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
                      {isAutosaving ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          <span className="text-indigo-650">Autosaving specifications draft...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600">Draft changes autosaved to database</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${editMode ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {editMode ? 'Disable Autosave' : 'Enable Live Edit'}
                </button>
              </div>

              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Patent Title</label>
                  {showTips && (
                    <p className="text-[10px] text-indigo-650 font-bold mb-1 bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/50">
                      💡 Tip: Use a clear, technical description of the system or method. Avoid proprietary or brand names.
                    </p>
                  )}
                  <input
                    type="text"
                    disabled={!editMode}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Technology Domain</label>
                    <input
                      type="text"
                      disabled={!editMode}
                      value={formData.technicalDomain}
                      onChange={(e) => setFormData({ ...formData, technicalDomain: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                    <input
                      type="text"
                      disabled={!editMode}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Innovation Description / Abstract</label>
                  <textarea
                    rows={4}
                    disabled={!editMode}
                    value={formData.innovationIdea}
                    onChange={(e) => setFormData({ ...formData, innovationIdea: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Problem Statement</label>
                    <textarea
                      rows={3}
                      disabled={!editMode}
                      value={formData.problemStatement}
                      onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Proposed Technical Solution</label>
                    <textarea
                      rows={3}
                      disabled={!editMode}
                      value={formData.proposedSolution}
                      onChange={(e) => setFormData({ ...formData, proposedSolution: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Existing Solutions Mapped</label>
                    <textarea
                      rows={3}
                      disabled={!editMode}
                      value={formData.existingSolutions}
                      onChange={(e) => setFormData({ ...formData, existingSolutions: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Existing Drawbacks & Infringements</label>
                    <textarea
                      rows={3}
                      disabled={!editMode}
                      value={formData.drawbacks}
                      onChange={(e) => setFormData({ ...formData, drawbacks: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Objectives</label>
                    <textarea
                      rows={2}
                      disabled={!editMode}
                      value={formData.objectives}
                      onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Novel Features Mapped</label>
                    <textarea
                      rows={2}
                      disabled={!editMode}
                      value={formData.novelFeatures}
                      onChange={(e) => setFormData({ ...formData, novelFeatures: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Keywords (Comma separated)</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 disabled:opacity-75 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                {editMode && (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Save Specifications Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Finish Editing
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* AI Assistant recommendations column */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" /> AI Innovation Optimizers
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                  Select a module to automatically review and enhance your patent specifications copy:
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('title')}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {aiLoading === 'title' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Optimize Title
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('abstract')}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {aiLoading === 'abstract' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Generate Better Abstract
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('description')}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {aiLoading === 'description' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Improve Specification
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('keywords')}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {aiLoading === 'keywords' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Suggest Patent Keywords
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* T3: PROTOTYPE MODULE */}
        {activeTab === 'Prototype Module' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Cpu className="w-4.5 h-4.5 text-indigo-650" /> Upload Prototype Artifacts
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                    Maintain engineering blueprints, cad structures, electrical circuit sheets, test logs, and demonstrator videos. Files are versioned automatically.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Asset Classification</label>
                      <select
                        id="prototypeCategorySelector"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none"
                        defaultValue="PROTOTYPE_CAD"
                      >
                        <option value="PROTOTYPE_CAD">CAD File (.step, .dwg, .f3d)</option>
                        <option value="PROTOTYPE_CIRCUIT">Circuit Diagram / Schematic (.pdf, .png)</option>
                        <option value="PROTOTYPE_IMAGE">Prototype Photo / Rendering (.png, .jpg)</option>
                        <option value="PROTOTYPE_VIDEO">Demonstration Video (.mp4)</option>
                        <option value="PROTOTYPE_TEST_LOG">Testing & Performance Logs (.txt, .pdf)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select & Upload File</span>
                        <input
                          type="file"
                          disabled={uploadingDoc}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const selector = document.getElementById('prototypeCategorySelector') as HTMLSelectElement;
                              handleUploadDocument(e.target.files[0], selector.value);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Uploaded Blueprints & Prototypes</h4>

                  {project.documents.filter(d => d.category.startsWith('PROTOTYPE_')).length === 0 ? (
                    <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white text-slate-400 text-xs font-medium space-y-2">
                      <Cpu className="w-8 h-8 mx-auto text-slate-300" />
                      <p>No prototype blueprints or log sheets uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.documents.filter(d => d.category.startsWith('PROTOTYPE_')).map((doc) => (
                        <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-3xs flex flex-col justify-between hover:border-indigo-400 transition-colors">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[8px] font-bold text-indigo-700 uppercase tracking-wider">
                              {doc.category.replace('PROTOTYPE_', '').replace('_', ' ')}
                            </span>
                            <h5 className="font-extrabold text-xs text-slate-900 truncate" title={doc.name}>{doc.name}</h5>
                            <p className="text-[9px] text-slate-400 font-semibold">
                              Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 font-mono">VER: {doc.version || 1}</span>
                            <div className="flex items-center gap-2">
                              <a
                                href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 border border-slate-250 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-655"
                              >
                                View File
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Prototype"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vector blueprint mock helper panel */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-650 animate-pulse" /> AI Blueprint Engine
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                    Convert hand-drawn drafts or diagrams into USPTO/IPO compliant 2D line schematics:
                  </p>

                  <div className="space-y-3">
                    <label className="block w-full border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-white transition-all">
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-550 font-bold block">
                        {selectedFile ? selectedFile.name : 'Upload draft sketch'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {previewUrl && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white p-2">
                        <img src={previewUrl} alt="Preview" className="w-full h-24 object-contain rounded-lg" />
                      </div>
                    )}

                    {previewUrl && (
                      <button
                        onClick={triggerGenerateDrawing}
                        disabled={isProcessingDrawing}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessingDrawing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            <Cpu className="w-3.5 h-3.5" /> Convert to Schematic
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {drawingVersions.length > 0 && (
                    <div className="space-y-3 border-t border-slate-200 pt-4">
                      <h5 className="text-[10px] font-bold text-slate-900 uppercase">Conversion History</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {drawingVersions.map((d, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                              <span>VERSION {d.version}</span>
                              <span>{d.date}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[8px] text-slate-400 font-bold block mb-1">ORIGINAL</span>
                                <img src={d.original} alt="Original" className="w-full h-16 object-contain border rounded" />
                              </div>
                              <div>
                                <span className="text-[8px] text-indigo-500 font-bold block mb-1">COMPLIANT SCHEMA</span>
                                <img src={d.drawing} alt="Patent Drawing" className="w-full h-16 object-contain border rounded border-indigo-200" />
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-500 italic leading-normal">
                              {d.metadata}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* T4: DOCUMENT MANAGER */}
        {activeTab === 'Document Manager' && (
          <div className="space-y-6">
            {!activeFolder ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Select a category directory to view, upload, and organize reference documents, drafts, and compliance audits:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[
                    { key: 'RESEARCH_PAPER', label: 'Research Papers', desc: 'Reference publications' },
                    { key: 'LITERATURE_REVIEW', label: 'Literature Review', desc: 'Prior-art reference summaries' },
                    { key: 'PATENT_DRAFT', label: 'Patent Drafts', desc: 'Complete specifications draft sheets' },
                    { key: 'PROTOTYPE_DOCS', label: 'Prototype Documents', desc: 'Engineering designs and blueprints' },
                    { key: 'TESTING', label: 'Testing Logs', desc: 'Lab validation & safety reports' },
                    { key: 'SUPPORTING', label: 'Supporting Documents', desc: 'Forms drafts & legal briefs' },
                  ].map((folder) => {
                    const count = project.documents.filter((d) => d.category === folder.key).length;
                    return (
                      <button
                        key={folder.key}
                        onClick={() => setActiveFolder(folder.key)}
                        className="p-6 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-400 rounded-3xl text-left transition-all space-y-3 cursor-pointer group shadow-3xs"
                      >
                        <Folder className="w-8 h-8 text-indigo-650 group-hover:scale-105 transition-transform" />
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">{folder.label}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{folder.desc}</p>
                          <span className="inline-block mt-2 text-[9px] font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded">
                            {count} {count === 1 ? 'file' : 'files'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl flex-col sm:flex-row border border-slate-200/50 gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveFolder(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5"
                    >
                      ← Back to Folders
                    </button>
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider ml-2">
                      📁 {activeFolder.replace('_', ' ')}
                    </span>
                  </div>

                  <label className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload to Folder</span>
                    <input
                      type="file"
                      disabled={uploadingDoc}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadDocument(e.target.files[0], activeFolder);
                        }
                      }}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    />
                  </label>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-150 bg-white shadow-3xs">
                  {project.documents.filter((d) => d.category === activeFolder).length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
                      <FolderOpen className="w-10 h-10 mx-auto text-slate-300" />
                      <p>No documents uploaded in this directory category.</p>
                    </div>
                  ) : (
                    project.documents
                      .filter((d) => d.category === activeFolder)
                      .map((doc) => (
                        <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 bg-white">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-indigo-650 shrink-0" />
                            <div>
                              <p className="font-bold text-xs text-slate-800">{doc.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">
                                Uploaded on: {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-655"
                            >
                              Download
                            </a>
                            <label className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                              <span>Replace</span>
                              <input
                                type="file"
                                disabled={uploadingDoc}
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    await api.delete(`/documents/${doc.id}`);
                                    await handleUploadDocument(e.target.files[0], activeFolder);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* T5: SPECIFICATION DRAFTING COMPANION */}
        {activeTab === 'AI Workspace' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> Context-Aware Specification Companion
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Initialized with: <strong className="text-slate-700">"{project.title}"</strong> ({project.category})
                </p>
              </div>
            </div>

            {/* Chatbox messages scroll view */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 h-80 overflow-y-auto space-y-4">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-semibold ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-2xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-3xs'
                      }`}
                  >
                    {msg.text.split('\n').map((line, lidx) => (
                      <p key={lidx} className="mt-1">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-3xs text-xs font-semibold flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Analyzing specification context...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Helper Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Actions:</span>
              <button
                onClick={() => handleChipClick('Improve my innovation abstract description')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-150 rounded-full text-[10px] font-bold transition-all"
              >
                Improve Abstract
              </button>
              <button
                onClick={() => handleChipClick('Explain requirements for Form 2 Specification')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-150 rounded-full text-[10px] font-bold transition-all"
              >
                Explain Form 2
              </button>
              <button
                onClick={() => handleChipClick('Suggest patent claims based on this project')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-150 rounded-full text-[10px] font-bold transition-all"
              >
                Suggest Claims
              </button>
            </div>

            {/* Send bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask drafting companion (e.g. 'suggest independent claims structure')"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="px-4.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
        {/* T6: EXPERT AUDIT */}
        {activeTab === 'Expert Audit' && (
          <div className="space-y-8">
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Search the public patent database to link relevant prior art documents to your project, then run AI diagnostics to audit similarity and novelty strength.
            </p>

            {/* PATENT EXPLORER & REFERENCES MANAGER */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🔍 Verified Patent Explorer & References Manager
                  </h4>
                  <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                    Search public patent registries and link relevant prior-art documents as context for AI diagnostics.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search Panel */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>Registry Search</span>
                  </h5>
                  <form onSubmit={handlePatentSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search by keywords, patent number, or assignee..."
                        value={patentSearchQuery}
                        onChange={(e) => setPatentSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-650"
                      />
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <button
                      type="submit"
                      disabled={loadingPatentSearch}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {loadingPatentSearch ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                        </>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </form>

                  {patentSearchError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold leading-normal flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{patentSearchError}</span>
                    </div>
                  )}

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {patentSearchResults.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        {loadingPatentSearch ? 'Fetching records...' : 'Enter keywords above to search patent registries.'}
                      </div>
                    ) : (
                      patentSearchResults.map((pat) => {
                        const isSaved = savedReferences.some(r => r.patentNumber === pat.patentNumber);
                        const isMock = pat.source === 'MOCK';

                        return (
                          <div key={pat.patentNumber} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-3xs space-y-2 hover:border-slate-350 transition-all">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                                  isMock
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {isMock ? 'Mock / Offline Data' : 'Verified USPTO Patent'}
                                </span>
                                <h6 className="font-extrabold text-[10px] text-slate-900 mt-1">{pat.patentNumber}</h6>
                              </div>

                              {canManageReferences && (
                                <button
                                  onClick={() => handleSaveReference(pat)}
                                  disabled={isSaved}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold border cursor-pointer transition-all flex items-center gap-1 ${
                                    isSaved
                                      ? 'bg-slate-50 border-slate-200 text-slate-450'
                                      : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                  }`}
                                >
                                  {isSaved ? 'Linked ✓' : <><Plus className="w-2.5 h-2.5" /> Link Reference</>}
                                </button>
                              )}
                            </div>
                            <h6 className="font-bold text-[11px] text-slate-800 leading-snug">{pat.title}</h6>
                            {pat.abstract && (
                              <p className="text-[10px] text-slate-500 leading-normal line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                {pat.abstract}
                              </p>
                            )}
                            <div className="flex gap-4 text-[9px] text-slate-400 font-semibold">
                              {pat.inventors && <span>👤 {pat.inventors}</span>}
                              {pat.publishDate && <span>📅 {pat.publishDate}</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Saved References Panel */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Saved Project References ({savedReferences.length})</span>
                  </h5>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {loadingReferences ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-medium">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Loading references...
                      </div>
                    ) : savedReferences.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        No references linked to this project yet. Use the explorer search panel to link patents.
                      </div>
                    ) : (
                      savedReferences.map((ref) => {
                        const isMock = ref.source === 'MOCK';
                        return (
                          <div key={ref.id} className="p-3 bg-indigo-50/20 border border-indigo-200/60 rounded-2xl shadow-3xs space-y-1.5 relative">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${
                                  isMock
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {isMock ? 'Offline Reference' : 'Verified Patent'}
                                </span>
                                <h6 className="font-extrabold text-[10px] text-indigo-800 mt-1">{ref.patentNumber}</h6>
                              </div>

                              {canManageReferences && (
                                <button
                                  onClick={() => handleDeleteReference(ref.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Delete Reference"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <h6 className="font-bold text-[11px] text-slate-900 leading-snug">{ref.title}</h6>
                            {ref.abstract && (
                              <p className="text-[10px] text-slate-655 leading-normal italic line-clamp-2 bg-white p-2 rounded border border-slate-150">
                                {ref.abstract}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-[9px] pt-1">
                              <span className="text-slate-400 font-semibold">
                                {ref.publishDate && `Published: ${new Date(ref.publishDate).toLocaleDateString()}`}
                              </span>
                              {ref.url && (
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-650 hover:underline font-bold flex items-center gap-0.5"
                                >
                                  Registry link →
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Prior Art / Similarity Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-3xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      🕵️ Prior Art & Similarity Check
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Registry overlap analysis</p>
                  </div>
                  <button
                    onClick={runSimilarityCheck}
                    disabled={loadingSimilarity}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loadingSimilarity ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Audit Registry
                      </>
                    )}
                  </button>
                </div>

                {similarityError ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold leading-normal">
                    ❌ {similarityError}
                  </div>
                ) : !similarityData ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    Click "Audit Registry" to inspect database matches.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="relative inline-flex items-center justify-center shrink-0">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="#10b981"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={213}
                            strokeDashoffset={213 - (213 * similarityData.similarityScore) / 100}
                          />
                        </svg>
                        <span className="absolute text-xs font-extrabold text-emerald-600 font-mono">{similarityData.similarityScore}%</span>
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-xs text-slate-800">Similarity Match Index</h5>
                        <p className="text-[9px] text-slate-450 font-semibold leading-normal">
                          Matches below 30% are highly safe. Current risk status:
                        </p>
                        <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          {similarityData.riskLevel} Risk
                        </span>
                      </div>
                    </div>

                    {similarityData.matches && similarityData.matches.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {similarityData.matches.map((m: any, idx: number) => {
                          const isExpanded = expandedMatchIndex === idx;
                          return (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-[10px] text-indigo-700">{m.patentId}</span>
                                <span className="text-[9px] font-bold text-slate-450 font-mono">{m.similarityPercent}% match</span>
                              </div>
                              <h6 className="font-bold text-[11px] text-slate-900">{m.title}</h6>
                              <p className="text-[10px] text-slate-500 leading-normal italic bg-white p-2 rounded border border-slate-150">
                                {m.drawbackOverlap}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <a href={m.url} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-650 font-bold hover:underline">
                                  Registry entry →
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setExpandedMatchIndex(isExpanded ? null : idx)}
                                  className="text-[9px] text-indigo-700 font-extrabold hover:underline"
                                >
                                  {isExpanded ? 'Hide strategy' : 'Bypass strategy'}
                                </button>
                              </div>
                              {isExpanded && (
                                <p className="p-2.5 bg-indigo-50 border border-indigo-200 rounded text-[10px] leading-relaxed text-indigo-950 font-semibold mt-1">
                                  💡 Claim modification strategy populated in specifications drafter companion workspace.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {similarityData.explanation && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                        <h6 className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wider">AI Comparison Explanation:</h6>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">{similarityData.explanation}</p>
                      </div>
                    )}

                    {similarityData.disclaimer && (
                      <div className="text-[9px] text-slate-450 italic font-bold leading-normal">
                        ⚠ {similarityData.disclaimer}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Claims Strength / Novelty Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-3xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      ⚖ Novelty & Claims Auditor
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Novelty strength evaluator</p>
                  </div>
                  <button
                    onClick={runNoveltyAssessment}
                    disabled={loadingNovelty}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loadingNovelty ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Audit Claims
                      </>
                    )}
                  </button>
                </div>

                {noveltyError ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold leading-normal">
                    ❌ {noveltyError}
                  </div>
                ) : !noveltyData ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    Click "Audit Claims" to evaluate non-obviousness metrics.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="relative inline-flex items-center justify-center shrink-0">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="#4f46e5"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={213}
                            strokeDashoffset={213 - (213 * noveltyData.noveltyScore) / 100}
                          />
                        </svg>
                        <span className="absolute text-xs font-extrabold text-indigo-600 font-mono">{noveltyData.noveltyScore}%</span>
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-xs text-slate-800">Novelty Strength Score</h5>
                        <p className="text-[9px] text-slate-450 font-semibold leading-normal">
                          Patent eligibility strength rating:
                        </p>
                        <span className="inline-block px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          {noveltyData.strength} Eligible
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50/20 border border-emerald-200 rounded-xl space-y-1">
                        <h6 className="font-bold text-[10px] text-emerald-950 uppercase">Strong Area claims:</h6>
                        <ul className="list-disc pl-4 text-[9px] text-slate-655 leading-relaxed font-semibold">
                          {noveltyData.strongAreas.slice(0, 2).map((sa: string, si: number) => (
                            <li key={si}>{sa}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-rose-50/20 border border-rose-200 rounded-xl space-y-1">
                        <h6 className="font-bold text-[10px] text-rose-950 uppercase">Weak Area claims:</h6>
                        <ul className="list-disc pl-4 text-[9px] text-slate-655 leading-relaxed font-semibold">
                          {noveltyData.weakAreas.slice(0, 2).map((wa: string, wi: number) => (
                            <li key={wi}>{wa}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {noveltyData.explanation && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                        <h6 className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wider">AI Novelty Explanation:</h6>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">{noveltyData.explanation}</p>
                      </div>
                    )}

                    {noveltyData.recommendations && noveltyData.recommendations.length > 0 && (
                      <div className="p-3.5 bg-indigo-50/30 border border-indigo-150 rounded-2xl space-y-1">
                        <h6 className="font-extrabold text-[10px] text-indigo-950 uppercase tracking-wider">Recommendations:</h6>
                        <ul className="list-disc pl-4 text-[9px] text-slate-600 leading-relaxed font-bold">
                          {noveltyData.recommendations.map((rec: string, ri: number) => (
                            <li key={ri}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {noveltyData.disclaimer && (
                      <div className="text-[9px] text-slate-450 italic font-bold leading-normal">
                        ⚠ {noveltyData.disclaimer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* T8: PATENT FORMS */}
        {activeTab === 'Patent Forms' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">IPO Patent Forms Checklist Wizard</h3>
            <p className="text-xs text-slate-500 font-semibold leading-normal">
              Below are the standard forms required to file your patent request in India. Click to fill out credentials or preview the generated documents.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form selection column */}
              <div className="md:col-span-1 space-y-2.5">
                {[
                  { id: '1', title: 'Form 1 (Application for Patent)', desc: 'General applicant metadata registration details' },
                  { id: '2', title: 'Form 2 (Specifications & Claims)', desc: 'Detailed description, abstract, and drawings list' },
                  { id: '3', title: 'Form 3 (Statement & Undertaking)', desc: 'State declaration of prior filings outside India' },
                  { id: '5', title: 'Form 5 (Declaration of Inventorship)', desc: 'Inventor details declaration of credentials' },
                  { id: '26', title: 'Form 26 (Power of Attorney)', desc: 'Assign filing duties to a Patent Agent' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFormIndex(f.id)}
                    className={`w-full p-4 text-left border rounded-2xl flex items-center justify-between transition-all cursor-pointer ${activeFormIndex === f.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-2xs font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[11px] uppercase tracking-wider block font-bold">Form {f.id}</span>
                      <p className="text-xs font-semibold">{f.title}</p>
                    </div>
                    <FileCheck className={`w-4 h-4 shrink-0 ${activeFormIndex === f.id ? 'text-indigo-600' : 'text-slate-350'}`} />
                  </button>
                ))}
              </div>

              {/* Form editing wizard column */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-6 rounded-3xl min-h-[300px] flex flex-col justify-between">
                {!activeFormIndex ? (
                  <div className="m-auto text-center text-slate-400 text-xs font-medium space-y-2">
                    <FileCode className="w-10 h-10 mx-auto text-slate-300" />
                    <p>Select an IPO Form from the left to start compiling your draft.</p>
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <h4 className="font-extrabold text-sm text-slate-900">Form {activeFormIndex} Wizard</h4>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-150">Pre-filled with metadata</span>
                    </div>

                    <div className="space-y-4">
                      {activeFormIndex === '1' && (
                        <>
                          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 font-bold">
                            📝 <strong>About Form 1 (Application for Patent):</strong> This registers applicant details, signatures, and inventorship designations to legally open your filing docket at the Indian Patent Office (IPO).
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-150 text-[11px] leading-relaxed text-slate-650 font-medium">
                            <strong>THE PATENT ACT 1970</strong> (39 of 1970) & THE PATENTS RULES, 2003 <br />
                            <strong>APPLICATION FOR GRANT OF PATENT</strong> (Section 7, 54 & 135) <br /><br />
                            APPLICANT NAME: <span className="text-slate-900 font-bold">{project.owner.fullName}</span> <br />
                            INSTITUTION: <span className="text-slate-900 font-bold">{project.owner.email.split('@')[1] || 'Institutions Registry'}</span> <br />
                            TITLE OF INVENTION: <span className="text-slate-900 font-bold">{project.title}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">State / Province</label>
                              <input
                                type="text"
                                value={formField1}
                                onChange={(e) => setFormField1(e.target.value)}
                                placeholder="e.g. Kerala"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Applicant Type</label>
                              <input
                                type="text"
                                value={formField2}
                                onChange={(e) => setFormField2(e.target.value)}
                                placeholder="e.g. Natural Person"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {activeFormIndex === '2' && (
                        <>
                          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 font-bold">
                            📝 <strong>About Form 2 (Specifications & Claims):</strong> This is the most critical document. It describes the background of the invention, visual assembly drawings details, and lists your legal 'Claims' which define the boundary of your technology.
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-150 text-[11px] leading-relaxed text-slate-650 font-medium space-y-2">
                            <strong>FORM 2: SPECIFICATION</strong> (Section 10; Rule 13) <br /><br />
                            <p><strong>1. TITLE OF THE INVENTION:</strong> {project.title}</p>
                            <p><strong>2. APPLICANTS:</strong> {project.owner.fullName} (Student/Inventor)</p>
                            <p><strong>3. PREAMBLE TO DESCRIPTION:</strong> The following specification particularly describes the invention and the manner in which it is to be performed.</p>
                            <p><strong>4. DESCRIPTION (Abstract):</strong> {project.innovationIdea}</p>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Scope Claims Count</label>
                            <input
                              type="number"
                              value={formField1}
                              onChange={(e) => setFormField1(e.target.value)}
                              placeholder="e.g. 5"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </>
                      )}

                      {(activeFormIndex === '3' || activeFormIndex === '5' || activeFormIndex === '26') && (
                        <div className="space-y-3">
                          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 font-bold">
                            {activeFormIndex === '3' && "📝 About Form 3 (Statement & Undertaking): Declares details of corresponding patent filings registered outside India."}
                            {activeFormIndex === '5' && "📝 About Form 5 (Declaration of Inventorship): Formal confirmation stating who the true inventors and creators are."}
                            {activeFormIndex === '26' && "📝 About Form 26 (Power of Attorney): Assigns filing and representation privileges to a registered Patent Agent/attorney."}
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-150 text-[11px] leading-relaxed text-slate-650 font-medium">
                            <strong>FORM {activeFormIndex} REGISTRATIONS</strong> <br />
                            Pre-populated draft file generation is ready. Generates legal claims bindings utilizing username <strong>@{project.owner.username}</strong> and institution details.
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                          generateIpoFormPdf(activeFormIndex);
                          setActiveFormIndex(null);
                        }}
                        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                      >
                        Download generated PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* T9: TEAM & TASKS */}
        {activeTab === 'Collaboration' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Task column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-slate-900">Project Tasks</h3>
                <span className="text-xs text-slate-400 font-semibold">{project.tasks.length} total tasks</span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {project.tasks.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
                    <CheckIcon className="w-10 h-10 mx-auto text-slate-300" />
                    <p>No active tasks assigned yet.</p>
                  </div>
                ) : (
                  project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-white transition-all shadow-2xs hover:shadow-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id, task.status)}
                          className="w-5 h-5 border-2 border-slate-350 hover:border-indigo-600 rounded-lg flex items-center justify-center transition-colors bg-white cursor-pointer"
                        >
                          {task.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-indigo-650" />}
                        </button>
                        <div>
                          <p className={`font-bold text-xs ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </p>
                          {task.description && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{task.description}</p>}
                          {task.assignedTo && (
                            <p className="text-[9px] text-indigo-600 font-semibold mt-1">Assigned to: @{task.assignedTo.username}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-250'
                            }`}
                        >
                          {task.status}
                        </span>
                        {project.isOwner && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Task assign form */}
              {project.isOwner && (
                <form onSubmit={handleCreateTask} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase">Create Task</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Task title (e.g. Draft claim 1)"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Assignee username (optional)"
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Short description (optional)"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-2xs"
                  >
                    {creatingTask ? 'Assigning...' : 'Assign Task'}
                  </button>
                </form>
              )}
            </div>

            {/* Team members & invite column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Collaborators</h4>
                </div>

                {project.isOwner && (
                  <form onSubmit={handleInviteMember} className="flex flex-col gap-2 relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        placeholder="Search student or guide username..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {searchResults.map((u) => (
                            <button
                              type="button"
                              key={u.id}
                              onClick={() => {
                                setInviteUsername(u.username);
                                setSearchResults([]);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-xs flex flex-col cursor-pointer"
                            >
                              <span className="font-bold text-slate-800">{u.fullName}</span>
                              <span className="text-[10px] text-slate-500">@{u.username} • {u.role}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer font-bold"
                      >
                        <option value="CO_INVENTOR">Co-Inventor</option>
                        <option value="GUIDE">Faculty Guide</option>
                        <option value="PATENT_EXPERT">Patent Expert</option>
                      </select>
                      <button
                        type="submit"
                        disabled={inviting}
                        className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Invite
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-3xs">
                    <div>
                      <p className="text-xs font-extrabold text-slate-850">{project.owner.fullName}</p>
                      <p className="text-[10px] text-slate-450 font-bold">@{project.owner.username}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                      Owner
                    </span>
                  </div>

                  {project.members &&
                    project.members.map((m) => (
                      <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-3xs">
                        <div>
                          <p className="text-xs font-extrabold text-slate-850">{m.user.fullName}</p>
                          <p className="text-[10px] text-slate-450 font-bold">@{m.user.username}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {m.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* T10: GUIDE REVIEW */}
        {activeTab === 'Guide Reviews' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {userProjectRole === 'PATENT_EXPERT' || (user?.role === 'Admin' && project.stage === 'PATENT_EXPERT_REVIEW') ? 'Patent Expert Legal Review Deck' : 'Faculty Supervisor Review Deck'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Endorsements, legal checklists, and supervisor sign-offs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column Guide/Expert Comment inputs */}
              <div className="md:col-span-1 space-y-4">
                {isProjectReviewer ? (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-3xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Review Feedback Actions</h4>
                    <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                      {userProjectRole === 'PATENT_EXPERT' || (user?.role === 'Admin' && project.stage === 'PATENT_EXPERT_REVIEW')
                        ? 'Log legal observations, approve applications, or reject drafts.'
                        : 'Submit guidance reviews and optionally advance workflow stage nodes.'}
                    </p>

                    <form onSubmit={(e) => handleSubmitReviewComment(e, 'COMMENT')} className="space-y-3 pt-2">
                      <textarea
                        rows={3}
                        required
                        placeholder="Enter review comments, drawbacks, or validation instructions..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />

                      <div className="flex flex-col gap-2">
                        {userProjectRole === 'PATENT_EXPERT' || (user?.role === 'Admin' && project.stage === 'PATENT_EXPERT_REVIEW') ? (
                          <>
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                            >
                              Submit Legal Observation
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleSubmitReviewComment(e, 'EXPERT_APPROVE')}
                              disabled={submittingReview}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                            >
                              Approve & Mark Filing Ready
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleSubmitReviewComment(e, 'EXPERT_FILED')}
                              disabled={submittingReview}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                            >
                              Approve & Mark Filed
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleSubmitReviewComment(e, 'EXPERT_REJECT')}
                              disabled={submittingReview}
                              className="w-full py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                            >
                              Reject & Request Revision
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                            >
                              Submit Feedback Comment
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleSubmitReviewComment(e, 'APPROVE')}
                              disabled={submittingReview}
                              className="w-full py-2 border border-emerald-500 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Approve & Advance Stage
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleSubmitReviewComment(e, 'REJECT')}
                              disabled={submittingReview}
                              className="w-full py-2 border border-rose-500 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Request Revision
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-5 bg-indigo-50/20 border border-indigo-150 rounded-2xl shadow-3xs text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-indigo-600 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase">Supervisor Space</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      This panel is reserved for your Faculty Guide and Patent Expert supervisors to submit check-off endorsements.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Review comments logs history */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900">Review Comments Audit Log</h4>
                <div className="space-y-3">
                  {project.comments && project.comments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      No review comments logged for this project yet.
                    </div>
                  ) : (
                    project.comments &&
                    project.comments.map((c) => (
                      <div key={c.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <div>
                            <span className="font-extrabold text-xs text-slate-800">{c.user.fullName}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                              {c.user.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-650 italic font-semibold leading-relaxed">
                          "{c.content}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* T11: TIMELINE */}
        {activeTab === 'Filing Timeline' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900"> Chronological Progression Track</h3>
            <p className="text-xs text-slate-500 font-semibold leading-normal">
              A checklist representation indicating pipeline accomplishments:
            </p>

            <div className="max-w-md mx-auto space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {STAGES.map((s, index) => {
                const isCompleted = index <= currentStageIndex;
                return (
                  <div key={s.key} className="relative flex gap-4 items-start">
                    <span
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                        }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <div>
                      <h4 className={`text-xs font-extrabold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {isCompleted ? 'Completed and verified.' : 'Awaiting dependencies.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* T12: REPORTS */}
        {activeTab === 'Reports Center' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">Compile & Export Filing Bundles</h3>
            <p className="text-xs text-slate-500 font-semibold leading-normal">
              Download automated claims evaluations, AI suggestions digests, and compiled readiness checklists:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Patent Summary Report', desc: 'Consolidated abstract, specs list, and keywords' },
                { name: 'AI Innovation Audit Digest', desc: 'Rewriting suggestions and claims modifications logs' },
                { name: 'Similarity diagnostics report', desc: 'Risk evaluation index, USPTO matching patents citations list' },
                { name: 'Novelty assessment score compilation', desc: 'Novelty score dial matching indicators' },
                { name: 'Guide endorsement sign-off report', desc: 'Audit reviews logs and supervisor signatures' },
                { name: 'Filing readiness final checklist', desc: 'Step-by-step checklist of Forms 1, 2, 3, 5, 26' },
              ].map((rep, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">{rep.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal">{rep.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      generatePdfReport(rep.name);
                    }}
                    className="w-full py-2 border border-indigo-200 hover:border-indigo-500 rounded-xl text-xs font-bold text-indigo-700 bg-white transition-all cursor-pointer text-center"
                  >
                    Compile PDF Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
      </div>
    </div>
  );
};
