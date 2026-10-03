import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  FileText,
  Cpu,
  UserPlus,
  Lightbulb,
  CheckCircle2,
  FileCode,
  Sparkles,
  Send,
  Upload,
  FileCheck as FileCheck2,
  CheckSquare as CheckIcon,
  Trash2,
  Loader2,
  Folder,
  FolderOpen,
  Activity,
  Search,
  AlertCircle,
  Plus,
  Shield,
  BookOpen,
  Scale,
} from 'lucide-react';
import { api, patentApi } from '../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ClaimsEngineeringStudio } from '../components/claims/ClaimsEngineeringStudio';
import { ProjectCommandCenter } from '../components/project/ProjectCommandCenter';
import { FilingReadinessView } from '../components/project/FilingReadinessView';
import { PriorArtEvidenceView } from '../components/project/PriorArtEvidenceView';
import { ProjectReviewCenter } from '../components/project/ProjectReviewCenter';
import { SpecificationStudio } from '../components/project/SpecificationStudio';

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
  ownerId?: string;
  isOwner: boolean;
  isArchived: boolean;
  createdAt: string;
  owner: { id: string; fullName: string; username: string; email: string; institution?: string | null };
  members: Array<{ id: string; role: string; permissionLevel?: 'VIEW' | 'EDIT' | 'SUBMIT'; user: { id: string; fullName: string; username: string; email: string } }>;
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
  projectReviews?: Array<{
    id: string;
    reviewType: string;
    decision: string;
    comments: string | null;
    createdAt: string;
    reviewer: { id: string; fullName: string; username: string; role: string };
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
  const [searchParams, setSearchParams] = useSearchParams();
  const outletCtx = useOutletContext<{ user: any }>() || {};
  const [currentUser, setCurrentUser] = useState<any>(outletCtx.user || null);

  useEffect(() => {
    if (outletCtx.user) {
      setCurrentUser(outletCtx.user);
    }
  }, [outletCtx.user]);

  useEffect(() => {
    if (!currentUser) {
      api.get('/auth/profile')
        .then((res) => setCurrentUser(res.data.user))
        .catch(() => { });
    }
  }, [currentUser]);

  const user = currentUser;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const projectMemberRecord = project?.members?.find((m: any) => m.user?.id === user?.id || m.user?.id === user?.userId || m.userId === user?.id || m.userId === user?.userId);
  
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isGlobalGuide = userRoleName === 'Guide' || userRoleName === 'GUIDE';
  const isGlobalExpert = userRoleName === 'PatentExpert' || userRoleName === 'Patent Expert' || userRoleName === 'PATENT_EXPERT';

  const rawMemberRole = (projectMemberRecord?.role as any);
  const memberRole = typeof rawMemberRole === 'object' ? rawMemberRole?.name : rawMemberRole;
  const userProjectRole = memberRole || 
    (isGlobalGuide ? 'GUIDE' : isGlobalExpert ? 'PATENT_EXPERT' : undefined);
  const isOwner = !!(project?.isOwner || (project?.owner && (project.owner.id === user?.id || project.owner.id === user?.userId)) || (project?.ownerId && (project.ownerId === user?.id || project.ownerId === user?.userId)) || userRoleName === 'Admin');
  const permissionLevel: 'VIEW' | 'EDIT' | 'SUBMIT' = isOwner ? 'SUBMIT' : (projectMemberRecord as any)?.permissionLevel || 'EDIT';
  const canEdit = isOwner || permissionLevel === 'EDIT' || permissionLevel === 'SUBMIT';
  const canSubmit = isOwner || permissionLevel === 'SUBMIT';
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const urlTab = searchParams.get('tab');
  const isReviewsRoute = location.pathname.endsWith('/reviews');

  const computeActiveTab = () => {
    if (isReviewsRoute) return 'Reviews';
    if (urlTab) {
      if (urlTab.toLowerCase() === 'draft' || urlTab.toLowerCase() === 'drafting') return 'Specification';
      return urlTab;
    }
    return 'Overview';
  };

  const [activeTab, setActiveTab] = useState<string>(computeActiveTab());

  useEffect(() => {
    setActiveTab(computeActiveTab());
  }, [urlTab, location.pathname]);

  const handleSelectTab = (tabName: string) => {
    setActiveTab(tabName);
    const isDashboard = location.pathname.startsWith('/dashboard');
    const baseProjectUrl = isDashboard ? `/dashboard/projects/${id}` : `/projects/${id}`;

    if (tabName === 'Reviews' || tabName === 'Guide Reviews') {
      navigate(`${baseProjectUrl}/reviews`);
    } else if (tabName === 'Overview') {
      navigate(baseProjectUrl);
      setSearchParams({});
    } else {
      navigate(`${baseProjectUrl}?tab=${encodeURIComponent(tabName)}`);
      setSearchParams({ tab: tabName });
    }
  };

  // AI Assistant Interactive State
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantHistory, setAssistantHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp?: string }>>([]);

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

  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [generatingMasterReport, setGeneratingMasterReport] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/projects/${id}/analytics`);
      setAnalyticsSummary(res.data);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    }
  };

  const handleGenerateMasterReport = async () => {
    try {
      setGeneratingMasterReport(true);
      const res = await api.post(`/projects/${id}/reports/comprehensive-pdf`);
      toast.success('Master Patent Intelligence Report PDF compiled!');
      if (res.data && res.data.fileUrl) {
        window.open(`http://localhost:5000${res.data.fileUrl}`, '_blank');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to generate Master Patent Report.');
    } finally {
      setGeneratingMasterReport(false);
    }
  };

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

  // FTO Claim Charts & Overlap Analysis states
  const [projectClaimsList, setProjectClaimsList] = useState<any[]>([]);
  const [ftoClaimCharts, setFtoClaimCharts] = useState<any[]>([]);
  const [loadingFtoCharts, setLoadingFtoCharts] = useState(false);
  const [generatingFtoChart, setGeneratingFtoChart] = useState(false);
  const [selectedFtoClaimId, setSelectedFtoClaimId] = useState<string>('');
  const [selectedFtoReferenceId, setSelectedFtoReferenceId] = useState<string>('');

  const fetchProjectClaims = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/projects/${id}/claims`);
      const claims = res.data.claims || [];
      setProjectClaimsList(claims);
      if (claims.length > 0 && !selectedFtoClaimId) {
        setSelectedFtoClaimId(claims[0].id);
      }
    } catch (e) {
      console.error('Failed to load project claims', e);
    }
  };

  const fetchFtoCharts = async () => {
    if (!id) return;
    setLoadingFtoCharts(true);
    try {
      const res = await patentApi.getProjectClaimCharts(id);
      setFtoClaimCharts(res.data.charts || []);
    } catch (e) {
      console.error('Failed to load FTO claim charts', e);
    } finally {
      setLoadingFtoCharts(false);
    }
  };

  const handleGenerateFtoChart = async () => {
    const claimId = selectedFtoClaimId || projectClaimsList[0]?.id;
    const refId = selectedFtoReferenceId || savedReferences[0]?.id;
    if (!id || !claimId || !refId) {
      toast.error('Please select both a claim and a saved patent reference.');
      return;
    }
    setGeneratingFtoChart(true);
    try {
      await patentApi.generateFtoClaimChart(id, claimId, refId);
      toast.success('Preliminary FTO claim chart generated successfully!');
      fetchFtoCharts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to generate FTO claim chart.');
    } finally {
      setGeneratingFtoChart(false);
    }
  };

  const handleDeleteFtoChart = async (chartId: string) => {
    if (!id) return;
    try {
      await patentApi.deleteClaimChart(id, chartId);
      toast.success('FTO claim chart deleted.');
      setFtoClaimCharts(prev => prev.filter(c => c.id !== chartId));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete FTO chart.');
    }
  };

  // Forms checklist wizard
  const [activeFormIndex, setActiveFormIndex] = useState<string | null>(null);
  const [formField1, setFormField1] = useState('');
  const [formField2, setFormField2] = useState('');

  // Drafting Tips and match expansion states
  const [showTips, setShowTips] = useState(true);
  const [expandedMatchIndex, setExpandedMatchIndex] = useState<number | null>(null);

  // Initialize AI assistant welcome message when project loads
  useEffect(() => {
    if (project && assistantHistory.length === 0) {
      setAssistantHistory([
        {
          role: 'assistant',
          text: `Hello! I am your **PatentHub-AI Project Assistant** for **"${project.title}"**.\n\nI have real-time access to your technical domain, claims, prior-art citations, and filing readiness checklist. How can I assist you with your patent journey today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [project]);

  const handleSendAssistant = async (textToSend?: string) => {
    const msg = (textToSend || assistantInput).trim();
    if (!msg || !project) return;

    const userEntry = {
      role: 'user' as const,
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...assistantHistory, userEntry];
    setAssistantHistory(updatedHistory);
    setAssistantInput('');
    setAssistantLoading(true);

    try {
      const res = await api.post(`/projects/${project.id}/ai/assistant`, {
        message: msg,
        history: updatedHistory.map(h => ({ role: h.role, text: h.text }))
      });

      setAssistantHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.data.reply || 'Analysis completed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      let errMsg = err.response?.data?.message || 'Google Gemini AI assistant is currently unavailable.';
      if (errMsg.includes('403') || errMsg.includes('denied access') || errMsg.includes('GoogleGenerativeAI')) {
        errMsg = 'Cloud AI project access restricted. Operating in local heuristic assistance mode.';
      }
      setAssistantHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **${errMsg}**`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Load project detail
  const fetchProject = async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const response = await api.get(`/projects/${id}`);
      const proj = response.data?.project;
      if (proj) {
        setProject(proj);
        setFormData({
          title: proj.title || '',
          innovationIdea: proj.innovationIdea || '',
          problemStatement: proj.problemStatement || '',
          existingSolutions: proj.existingSolutions || '',
          drawbacks: proj.drawbacks || '',
          proposedSolution: proj.proposedSolution || '',
          novelFeatures: proj.novelFeatures || '',
          objectives: proj.objectives || '',
          technicalDomain: proj.technicalDomain || '',
          keywords: proj.keywords || '',
          category: proj.category || '',
          patentType: proj.patentType || 'Utility',
          visibility: proj.visibility || 'PRIVATE',
        });
      }
    } catch (error: any) {
      console.error('Failed to load project details', error);
      const errMsg = error.response?.data?.message || 'Failed to load project details or access restricted.';
      setLoadError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchProject();
      fetchSavedReferences();
      fetchProjectClaims();
      fetchFtoCharts();
    }
  }, [id]);

  useEffect(() => {
    if (savedReferences.length > 0 && !selectedFtoReferenceId) {
      setSelectedFtoReferenceId(savedReferences[0].id);
    }
  }, [savedReferences]);

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
    const nextStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await api.put(`/projects/${id}/tasks/${taskId}`, { status: nextStatus });
      toast.success(nextStatus === 'COMPLETED' ? 'Task marked completed' : 'Task marked to-do');
      fetchProject();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update task status');
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
    writeField('Filing Stage', (project.stage || 'IDEA').replace(/_/g, ' '));
    writeField('Owner / Inventor', project.owner?.fullName || 'Inventor');
    writeField('Institution', project.owner?.institution || 'N/A');

    if (reportType === 'Patent Summary Report') {
      writeField('Innovation Abstract', project.innovationIdea);
      writeField('Problem Statement', project.problemStatement);
      writeField('Proposed Solution', project.proposedSolution);
      writeField('Objectives', project.objectives || 'N/A');
      writeField('Keywords', project.keywords || 'N/A');
    } else if (reportType.includes('Filing') || reportType.includes('readiness')) {
      writeField('Forms Compilation', 'IPO Forms 1, 2, 3, 5, and 26 pre-filled drafts generated successfully.');
      writeField('Filing Readiness Index', `${getStageProgress(project.stage)}% stage completion`);
      writeField('Task Completion', `${project.tasks?.filter(t => t.status === 'COMPLETED').length || 0} / ${project.tasks?.length || 0} tasks completed`);
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
      writeLine('1. First Inventor', `${project.owner?.fullName || 'Inventor'} (@${project.owner?.username || 'user'})`);
      if (project.members) {
        project.members.forEach((m, idx) => {
          writeLine(`${idx + 2}. Co-Inventor`, `${m.user?.fullName || 'User'} (@${m.user?.username || 'user'}) - [${(m.role || 'MEMBER').replace(/_/g, ' ')}]`);
        });
      }
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

  // Remove team collaborator
  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;
    try {
      await api.delete(`/collaboration/projects/${id}/members/${memberUserId}`);
      toast.success(`Removed ${memberName} from project team.`);
      fetchProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-medium space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-600">Loading project workspace...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">Project Not Found or Access Restricted</h3>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {loadError || "You don't have authorization to view this patent project, or it may have been removed."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/projects')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Back to My Projects
          </button>
          <button
            type="button"
            onClick={() => fetchProject()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === project.stage);

  const sidebarLinks = [
    { label: 'Overview', tab: 'Overview', icon: Lightbulb },
    { label: 'AI Assistant', tab: 'AI Assistant', icon: Sparkles },
    { label: 'Innovation Details', tab: 'Innovation Details', icon: FileText },
    { label: 'Prior Art Search', tab: 'Prior Art Search', icon: Search },
    { label: 'Specification', tab: 'Specification', icon: BookOpen },
    { label: 'Claims Studio', tab: 'Claims Studio', icon: FileCode },
    { label: 'Tasks', tab: 'Tasks', icon: CheckIcon },
    { label: 'Forms & Filing', tab: 'Forms & Filing', icon: FileCheck2 },
    { label: 'Documents', tab: 'Documents', icon: Folder },
    { label: 'Drawings', tab: 'Drawings', icon: Cpu },
    { label: 'FTO Analysis', tab: 'FTO Analysis', icon: Shield },
    { label: 'Reviews', tab: 'Reviews', icon: Users },
    { label: 'Activity Timeline', tab: 'Activity Timeline', icon: Activity },
  ] as const;

  const filingScore = analyticsSummary?.scores?.filingReadinessScore ?? (
    project?.stage === 'FILED' ? 100 :
      project?.stage === 'FILING_READY' ? 95 :
        project?.stage === 'PATENT_EXPERT_REVIEW' ? 80 :
          project?.stage === 'GUIDE_REVIEW' ? 65 :
            project?.stage === 'FORMS_PREPARATION' ? 50 :
              project?.stage === 'DOCUMENTATION' ? 35 :
                project?.stage === 'LITERATURE_REVIEW' ? 20 : 10
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Project Sidebar (3 cols) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-4 h-fit space-y-5">
          {/* Main Patent Journey Nav Card */}
          <div className="app-card p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patent Journey</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                {(project?.stage || 'IDEA').replace(/_/g, ' ')}
              </span>
            </div>

            {/* Sidebar Menu items */}
            <nav className="space-y-1">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const isReviewsItem = link.tab === 'Reviews';
                const isActive =
                  activeTab === link.tab ||
                  (isReviewsItem &&
                    (activeTab === 'Reviews' ||
                      activeTab === 'Guide Reviews' ||
                      location.pathname.endsWith('/reviews')));
                return (
                  <button
                    key={link.label}
                    onClick={() => handleSelectTab(link.tab)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Widget: Filing Readiness */}
          <div className="app-card p-5 space-y-3 shadow-xs bg-gradient-to-b from-white to-slate-50/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900">Filing Readiness</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${filingScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-900 font-sans">
                  {filingScore}%
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-600">Complete</span>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                  You're {100 - filingScore}% away from filing ready status.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('Forms & Filing')}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <span>View Details</span>
              <ArrowLeft className="w-3 h-3 rotate-180 text-slate-400" />
            </button>
          </div>
        </aside>

        {/* Right Content Panel (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* T_COMMAND_CENTER: COMMAND CENTER OVERVIEW */}
          {(activeTab === 'Overview' || (activeTab as any) === 'Command center') && !location.pathname.endsWith('/reviews') && (
            <ProjectCommandCenter
              project={project}
              analyticsSummary={analyticsSummary}
              onNavigateTab={(tab) => handleSelectTab(tab as any)}
              onShare={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Project workspace link copied to clipboard!');
              }}
              onRefreshProject={fetchProject}
            />
          )}

          {/* T_AI_ASSISTANT: INTERACTIVE CONTEXT-AWARE GEMINI COPILOT */}
          {activeTab === 'AI Assistant' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">PatentHub-AI Project Assistant</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      AI copilot initialized with full context of <strong>"{project.title}"</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    S10 Scope • Preview
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Gemini Connected
                  </span>
                </div>
              </div>

              {/* Messages Box */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 h-[420px] overflow-y-auto space-y-4">
                {assistantHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-xs font-semibold'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-3xs'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1.5 opacity-75 text-[10px] font-mono">
                        <span className="font-bold uppercase">{msg.role === 'user' ? 'You' : 'PatentHub-AI'}</span>
                        {msg.timestamp && <span>{msg.timestamp}</span>}
                      </div>
                      <div className="space-y-2 whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}

                {assistantLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-3xs text-xs font-semibold flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Analyzing project claims, prior art, and readiness context...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt Suggestion Chips */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'What is the current filing readiness score and what is missing?',
                    'Summarize my invention and technical novelty.',
                    'What are the weak areas or risks in my patent?',
                    'Explain Claim 1 in clear, simple terms.',
                    'What prior-art references have been added?',
                    'What documents and forms should I complete before filing?'
                  ].map((promptText, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      disabled={assistantLoading}
                      onClick={() => handleSendAssistant(promptText)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAssistant();
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  disabled={assistantLoading}
                  placeholder="Ask the AI Assistant about claims, prior art, IPO procedures, or drafting..."
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-600 shadow-xs"
                />
                <button
                  type="submit"
                  disabled={assistantLoading || !assistantInput.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {assistantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send</span>
                </button>
              </form>

              {/* Statutory Disclaimer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-normal flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Statutory Notice:</strong> AI-generated guidance is preliminary and does not constitute legal advice, a formal patentability determination, or a definitive FTO opinion.
                </span>
              </div>
            </div>
          )}

          {/* T_FILING_READINESS: 6-POINT READINESS CHECKLIST & FINAL PACKAGE */}
          {activeTab === 'Forms & Filing' && (
            <FilingReadinessView
              projectId={project.id}
              project={project}
              analyticsSummary={analyticsSummary}
              onRefreshProject={fetchProject}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {/* T_PRIOR_ART: PRIOR ART SEARCH & EVIDENCE INSPECTOR */}
          {activeTab === 'Prior Art Search' && (
            <PriorArtEvidenceView
              projectId={project.id}
              project={project}
              onRefreshReferences={fetchSavedReferences}
            />
          )}

          {/* T_SPECIFICATION: FORM 2 MULTI-SECTION SPECIFICATION STUDIO */}
          {(activeTab === 'Specification' || activeTab === 'Draft' || activeTab === 'draft') && (
            <SpecificationStudio
              projectId={project.id}
              project={project}
              onRefreshProject={fetchProject}
              onNavigateTab={handleSelectTab}
            />
          )}

          {/* T_CLAIMS: CLAIMS STUDIO */}
          {(activeTab === 'Claims Studio' || activeTab === 'Claims Engineering') && (
            <ClaimsEngineeringStudio
              projectId={project.id}
              isOwnerOrMember={isOwner || !!projectMemberRecord}
              canEdit={canEdit}
              canSubmit={canSubmit}
              permissionLevel={permissionLevel}
              onRefreshDocuments={fetchProject}
            />
          )}

          {/* T2: INNOVATION */}
          {(activeTab === 'Innovation Details' || activeTab === 'Innovation Workspace') && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
              {/* 1. Header & Live Edit Control Bar */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      Specification Editor
                    </span>
                    {editMode ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Live Edit Enabled
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        View Only Mode
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Invention Specifications & Disclosure</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Draft, refine, and structure the technical description, abstract, and inventive step for Form 2.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTips(!showTips)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      showTips ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {showTips ? '💡 Hide Drafting Tips' : '💡 Show Drafting Tips'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer border shadow-xs ${
                      editMode
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
                    }`}
                  >
                    {editMode ? 'Exit Edit Mode' : 'Enable Live Edit'}
                  </button>
                </div>
              </div>

              {/* 2. Top AI Innovation Optimizers Toolbar */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h4 className="text-sm font-black tracking-tight text-white">AI Innovation & Drafting Optimizers</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Automatically enhance specifications and claims copy with Google Gemini AI
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('title')}
                    className="p-3 bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 hover:border-indigo-400/50 rounded-2xl text-left transition group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-200 group-hover:text-white">Optimize Title</span>
                      {aiLoading === 'title' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 group-hover:text-slate-300 line-clamp-2">
                      Formats technical title to adhere to statutory IPO guidelines.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('abstract')}
                    className="p-3 bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 hover:border-indigo-400/50 rounded-2xl text-left transition group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-200 group-hover:text-white">Enhance Abstract</span>
                      {aiLoading === 'abstract' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 group-hover:text-slate-300 line-clamp-2">
                      Summarizes the technical solution within standard 150-word limits.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('description')}
                    className="p-3 bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 hover:border-indigo-400/50 rounded-2xl text-left transition group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-200 group-hover:text-white">Improve Solution</span>
                      {aiLoading === 'description' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 group-hover:text-slate-300 line-clamp-2">
                      Deepens technical architecture and embodiment descriptions.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!!aiLoading}
                    onClick={() => triggerAiInnovation('keywords')}
                    className="p-3 bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 hover:border-indigo-400/50 rounded-2xl text-left transition group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-200 group-hover:text-white">Suggest Keywords</span>
                      {aiLoading === 'keywords' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 group-hover:text-slate-300 line-clamp-2">
                      Generates statutory IPC classification tags and keywords.
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Main Specifications Form Divided into Clean, Spacious Cards */}
              <form onSubmit={handleSaveDetails} className="space-y-6">
                {/* Card 1: Title & Classification */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">1. Patent Title & Technology Classification</h4>
                      <p className="text-xs text-slate-500 font-medium">Core metadata defining the invention scope</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Patent Title <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formData.title?.length || 0} characters
                        </span>
                      </div>
                      {showTips && (
                        <p className="text-xs text-indigo-900 font-medium mb-2 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                          💡 <strong>Statutory Tip:</strong> Use a concise, technical description (under 15 words) of the system or method. Avoid proprietary product names or abbreviations.
                        </p>
                      )}
                      <input
                        type="text"
                        disabled={!editMode}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Smart Waste Segregation and Resource Recovery System Using Computer Vision..."
                        className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Technology Domain
                        </label>
                        <input
                          type="text"
                          disabled={!editMode}
                          value={formData.technicalDomain}
                          onChange={(e) => setFormData({ ...formData, technicalDomain: e.target.value })}
                          placeholder="e.g. Artificial Intelligence / Robotics"
                          className="w-full px-4 py-2.5 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Patent Category / Type
                        </label>
                        <input
                          type="text"
                          disabled={!editMode}
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="e.g. Utility Patent / System"
                          className="w-full px-4 py-2.5 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Statutory Keywords & Classification Tags (Comma separated)
                      </label>
                      <input
                        type="text"
                        disabled={!editMode}
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        placeholder="e.g. computer vision, optical sensors, robotic sorter, waste classification"
                        className="w-full px-4 py-2.5 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Innovation Description / Abstract */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">2. Innovation Description & Abstract (Form 2)</h4>
                      <p className="text-xs text-slate-500 font-medium">Concise summary of the technical disclosure and functional operation</p>
                    </div>
                  </div>

                  <div>
                    {showTips && (
                      <p className="text-xs text-indigo-900 font-medium mb-2 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                        💡 <strong>Statutory Tip:</strong> The abstract should summarize the technical problem, solution approach, and principal use of the invention in roughly 150 words.
                      </p>
                    )}
                    <textarea
                      rows={5}
                      disabled={!editMode}
                      value={formData.innovationIdea}
                      onChange={(e) => setFormData({ ...formData, innovationIdea: e.target.value })}
                      placeholder="Describe the overall technical system, working method, sensor architecture, and operational flow..."
                      className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                {/* Card 3: Problem Statement & Proposed Technical Solution */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">3. Problem Statement & Technical Solution</h4>
                      <p className="text-xs text-slate-500 font-medium">Clear definition of current technological bottlenecks and how your invention resolves them</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Technical Problem Statement
                      </label>
                      <textarea
                        rows={5}
                        disabled={!editMode}
                        value={formData.problemStatement}
                        onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                        placeholder="State the technological limitations, inefficiencies, high error rates, or manual bottlenecks in existing systems..."
                        className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Proposed Technical Solution
                      </label>
                      <textarea
                        rows={5}
                        disabled={!editMode}
                        value={formData.proposedSolution}
                        onChange={(e) => setFormData({ ...formData, proposedSolution: e.target.value })}
                        placeholder="Detail the novel hardware integration, algorithmic decision framework, sensory feedback, or operational apparatus..."
                        className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 4: Prior Art Gaps & Distinctive Novel Features */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">4. State-of-the-Art Analysis & Inventive Step</h4>
                      <p className="text-xs text-slate-500 font-medium">Distinction from prior art citations and legal non-obviousness justification</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Existing Solutions Mapped
                      </label>
                      <textarea
                        rows={4}
                        disabled={!editMode}
                        value={formData.existingSolutions}
                        onChange={(e) => setFormData({ ...formData, existingSolutions: e.target.value })}
                        placeholder="Describe conventional commercial machines, existing patent citations, or academic baseline methods..."
                        className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Existing Drawbacks & Infringement Gaps
                      </label>
                      <textarea
                        rows={4}
                        disabled={!editMode}
                        value={formData.drawbacks}
                        onChange={(e) => setFormData({ ...formData, drawbacks: e.target.value })}
                        placeholder="List specific drawbacks of prior art (e.g. latency, false positive rate, expensive calibration)..."
                        className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Invention Objectives
                      </label>
                      <textarea
                        rows={4}
                        disabled={!editMode}
                        value={formData.objectives}
                        onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                        placeholder="Primary and secondary technical goals accomplished by the proposed invention..."
                        className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Novel Features & Inventive Step (Non-Obviousness)
                      </label>
                      <textarea
                        rows={4}
                        disabled={!editMode}
                        value={formData.novelFeatures}
                        onChange={(e) => setFormData({ ...formData, novelFeatures: e.target.value })}
                        placeholder="State the core inventive features that cannot be deduced by a person skilled in the art..."
                        className="w-full px-4 py-3 bg-white border border-slate-250 disabled:bg-slate-50/80 disabled:text-slate-700 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                {editMode && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-4 shadow-lg sticky bottom-4 z-20 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs">
                      {isAutosaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          <span className="text-slate-300 font-medium">Autosaving specifications draft...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-300 font-medium">All edits synced & ready to save</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Finish Editing
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                      >
                        Save Specifications Now
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
          {/* T3: PROTOTYPE MODULE */}
          {(activeTab === 'Drawings' || activeTab === 'Prototype Module') && (
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
                                {(doc.category || '').replace('PROTOTYPE_', '').replace(/_/g, ' ')}
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
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-indigo-650 animate-pulse" /> AI Blueprint Engine
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        S10 Scope
                      </span>
                    </div>
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
          {(activeTab === 'Documents' || activeTab === 'Document Manager') && (
            <div className="space-y-6">
              {!activeFolder ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Project Document Repository</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Select a category directory to view or upload reference documents, drafts, and compliance files.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/15 flex items-center gap-1.5 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingDoc ? 'Uploading...' : 'Quick Upload File'}</span>
                        <input
                          type="file"
                          disabled={uploadingDoc}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadDocument(e.target.files[0], 'SUPPORTING');
                            }
                          }}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                      { key: 'RESEARCH_PAPER', label: 'Research Papers', desc: 'Reference publications & academic papers' },
                      { key: 'LITERATURE_REVIEW', label: 'Literature Review', desc: 'Prior-art reference summaries & audits' },
                      { key: 'PATENT_DRAFT', label: 'Patent Drafts', desc: 'Complete specifications draft sheets' },
                      { key: 'PROTOTYPE_DOCS', label: 'Prototype Documents', desc: 'Engineering designs, schematics & blueprints' },
                      { key: 'TESTING', label: 'Testing Logs', desc: 'Lab validation, benchmarking & safety reports' },
                      { key: 'SUPPORTING', label: 'Supporting Documents', desc: 'Forms drafts, disclosures & legal briefs' },
                    ].map((folder) => {
                      const count = (project.documents || []).filter((d: any) => d.category === folder.key).length;
                      return (
                        <div
                          key={folder.key}
                          className="p-5 bg-white hover:bg-slate-50/90 border border-slate-200/80 hover:border-blue-400 rounded-3xl text-left transition-all space-y-3 shadow-3xs flex flex-col justify-between group"
                        >
                          <div
                            onClick={() => setActiveFolder(folder.key)}
                            className="cursor-pointer space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl group-hover:scale-105 transition-transform">
                                <Folder className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/60">
                                {count} {count === 1 ? 'file' : 'files'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-900 transition-colors">
                                {folder.label}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{folder.desc}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-150 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveFolder(folder.key)}
                              className="text-xs font-bold text-blue-900 hover:text-blue-950 cursor-pointer"
                            >
                              Open folder →
                            </button>

                            <label className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-900 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1" title="Upload directly to this folder">
                              <Upload className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Add File</span>
                              <input
                                type="file"
                                disabled={uploadingDoc}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadDocument(e.target.files[0], folder.key);
                                  }
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                              />
                            </label>
                          </div>
                        </div>
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
                        className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 transition shadow-3xs"
                      >
                        ← Back to Directories
                      </button>
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider ml-2">
                        📁 {activeFolder.replace('_', ' ')}
                      </span>
                    </div>

                    <label className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/15 flex items-center gap-1.5 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingDoc ? 'Uploading...' : 'Upload to Folder'}</span>
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

                  {/* Drag and Drop Box */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleUploadDocument(e.dataTransfer.files[0], activeFolder);
                      }
                    }}
                    className="p-8 border-2 border-dashed border-slate-250 hover:border-blue-400 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2 transition cursor-pointer"
                  >
                    <FolderOpen className="w-8 h-8 text-blue-900/60" />
                    <p className="text-xs font-bold text-slate-700">Drag and drop files here to upload</p>
                    <p className="text-[10px] text-slate-400 font-medium">Supports PDF, DOCX, TXT, PNG, JPG (up to 25MB)</p>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-150 bg-white shadow-3xs">
                    {(project.documents || []).filter((d: any) => d.category === activeFolder).length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
                        <FolderOpen className="w-10 h-10 mx-auto text-slate-300" />
                        <p>No documents uploaded in this directory category yet.</p>
                      </div>
                    ) : (
                      (project.documents || [])
                        .filter((d: any) => d.category === activeFolder)
                        .map((doc: any) => (
                          <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 bg-white">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-800">{doc.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  Uploaded on: {new Date(doc.createdAt).toLocaleDateString()} {doc.fileSize ? `• ${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition"
                              >
                                Download
                              </a>
                              <label className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1 transition">
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
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
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
          {(activeTab === 'AI Workspace' || activeTab === 'AI Analysis') && (
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
          {/* T6: EXPERT AUDIT & FTO ANALYSIS */}
          {(activeTab === 'Expert Audit' || activeTab === 'FTO Analysis') && (
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
                                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${isMock
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
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold border cursor-pointer transition-all flex items-center gap-1 ${isSaved
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
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${isMock
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          🕵️ Prior Art & Similarity Check
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          S10 Scope
                        </span>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          ⚖ Novelty & Claims Auditor
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          S10 Scope
                        </span>
                      </div>
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

              {/* FTO CLAIM CHARTS & TECHNICAL OVERLAP MATRIX WORKSPACE */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-3xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        ⚖️ Freedom-to-Operate (FTO) Claim Charts & Technical Overlap Analysis
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                        Patent Intelligence
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Map specific technical claim elements against cited prior-art references to evaluate overlap boundaries.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchFtoCharts}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition cursor-pointer self-start sm:self-auto"
                    title="Refresh FTO charts"
                  >
                    <Loader2 className={`w-3.5 h-3.5 ${loadingFtoCharts ? 'animate-spin text-teal-600' : ''}`} />
                  </button>
                </div>

                {/* Statutory AI Boundary Disclaimer */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 text-amber-950 rounded-2xl text-[11px] leading-relaxed font-semibold">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>AI-Assisted Preliminary FTO Research:</strong> Technical overlap analysis evaluates claim element language against publicly indexed disclosures for engineering and research guidance. This does not constitute legal clearance, guaranteed freedom to operate, or a formal legal opinion of non-infringement. Substantive clearance requires evaluation by a qualified patent attorney.
                    </div>
                  </div>
                </div>

                {/* Generator Card */}
                <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Generate Preliminary Claim Chart
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Select Project Claim
                      </label>
                      <select
                        value={selectedFtoClaimId}
                        onChange={(e) => setSelectedFtoClaimId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                      >
                        {projectClaimsList.length === 0 ? (
                          <option value="">No claims formulated yet</option>
                        ) : (
                          projectClaimsList.map((c) => (
                            <option key={c.id} value={c.id}>
                              Claim #{c.claimNumber} ({c.claimType}) - {c.preamble?.slice(0, 45) || 'Claim body'}...
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Select Cited Prior-Art Patent Reference
                      </label>
                      <select
                        value={selectedFtoReferenceId}
                        onChange={(e) => setSelectedFtoReferenceId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                      >
                        {savedReferences.length === 0 ? (
                          <option value="">No saved references available</option>
                        ) : (
                          savedReferences.map((r) => (
                            <option key={r.id} value={r.id}>
                              [{r.patentNumber}] {r.title?.slice(0, 50)}...
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Evaluates each limitation element against the reference's disclosure.
                    </p>
                    <button
                      type="button"
                      disabled={generatingFtoChart || projectClaimsList.length === 0 || savedReferences.length === 0}
                      onClick={handleGenerateFtoChart}
                      className="px-5 py-2.5 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {generatingFtoChart ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Claim Chart...
                        </>
                      ) : (
                        <>
                          <Scale className="w-3.5 h-3.5" /> Generate FTO Claim Chart
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Existing Charts Display */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Verified Project Claim Charts ({ftoClaimCharts.length})
                    </h5>
                  </div>

                  {loadingFtoCharts ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                      Loading FTO claim charts...
                    </div>
                  ) : ftoClaimCharts.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                      <Scale className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No FTO Claim Charts Generated Yet</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Link at least one patent reference and formulate claims to generate structured claim-by-claim technical overlap matrices.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {ftoClaimCharts.map((chart: any) => {
                        const riskBadge =
                          chart.overallRisk === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : chart.overallRisk === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                        return (
                          <div key={chart.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-3xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border uppercase ${riskBadge}`}>
                                  {chart.overallRisk} Overlap Risk
                                </span>
                                <h6 className="font-extrabold text-xs text-slate-900">
                                  Ref: {chart.reference?.patentNumber || 'Cited Reference'} · {chart.reference?.title || ''}
                                </h6>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteFtoChart(chart.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer self-start sm:self-auto"
                                title="Delete this claim chart"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {chart.summary && (
                              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70 font-medium leading-relaxed">
                                {chart.summary}
                              </p>
                            )}

                            {/* Elements Breakdown Table */}
                            {chart.elements && chart.elements.length > 0 && (
                              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                                    <tr>
                                      <th className="py-2.5 px-3">Our Claim Element</th>
                                      <th className="py-2.5 px-3">Prior Art Feature</th>
                                      <th className="py-2.5 px-3">Overlap Level</th>
                                      <th className="py-2.5 px-3">Analysis Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-[11px]">
                                    {chart.elements.map((el: any) => {
                                      const overlapColor =
                                        el.overlapLevel === 'IDENTICAL' || el.overlapLevel === 'EQUIVALENT'
                                          ? 'text-rose-700 font-black'
                                          : el.overlapLevel === 'PARTIAL'
                                          ? 'text-amber-700 font-bold'
                                          : 'text-emerald-700 font-bold';

                                      return (
                                        <tr key={el.id} className="hover:bg-slate-50/50">
                                          <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[160px]">
                                            {el.claimElement?.elementName || 'Limitation'}
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-700 max-w-[200px]">
                                            {el.priorArtFeature}
                                          </td>
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            <span className={overlapColor}>{el.overlapLevel}</span>
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-600 italic">
                                            {el.analysisNotes || '—'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                              <span>Generated: {new Date(chart.createdAt).toLocaleDateString()}</span>
                              <span className="italic">Advisory finding only · Subject to Patent Expert review</span>
                            </div>
                          </div>
                        );
                      })}
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
                      <FileCheck2 className={`w-4 h-4 shrink-0 ${activeFormIndex === f.id ? 'text-indigo-600' : 'text-slate-350'}`} />
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
                                <span className="text-[10px] text-slate-500">@{u.username} • {typeof u.role === 'object' ? u.role?.name : u.role}</span>
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
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {(m.role || 'MEMBER').replace(/_/g, ' ')}
                            </span>
                            {(project.isOwner || isOwner) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.user.id, m.user.fullName)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Remove Collaborator"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* T10: PROJECT REVIEW CENTER */}
          {(activeTab === 'Guide Reviews' || activeTab === 'Reviews' || location.pathname.endsWith('/reviews')) && (
            <ErrorBoundary fallbackTitle="Review Center Error">
              <ProjectReviewCenter
                projectId={id!}
                project={project}
                analyticsSummary={analyticsSummary}
                currentUser={user}
                userProjectRole={userProjectRole}
                onRefreshProject={fetchProject}
                onNavigateTab={(tab) => handleSelectTab(tab)}
              />
            </ErrorBoundary>
          )}

          {/* T_TASKS: PROJECT ACTION ITEMS & TASKS */}
          {activeTab === 'Tasks' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Project Action Items & Tasks</h3>
                  <p className="text-xs text-slate-500 font-medium">Manage project milestones and assign tasks to collaborators</p>
                </div>
              </div>

              {/* Task Creation Form */}
              <form onSubmit={handleCreateTask} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Create New Project Task</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Task title (e.g. Draft dependent claims 2-5)..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="">Assign to (Optional)...</option>
                    {project.owner && (
                      <option key={project.owner.id} value={project.owner.username}>
                        {project.owner.fullName} (OWNER / INVENTOR)
                      </option>
                    )}
                    {project.members && project.members.map(m => (
                      m.user.id !== project.owner?.id && (
                        <option key={m.user.id} value={m.user.username}>
                          {m.user.fullName} ({(m.role || 'MEMBER').replace(/_/g, ' ')})
                        </option>
                      )
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Task details or description (optional)..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingTask || !taskTitle.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {creatingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Add Task</span>
                  </button>
                </div>
              </form>

              {/* Task List */}
              <div className="space-y-3">
                {project.tasks && project.tasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    No tasks created for this project yet. Use the form above to add one.
                  </div>
                ) : (
                  project.tasks && project.tasks.map((t) => {
                    const isDone = t.status === 'COMPLETED';
                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition ${isDone ? 'bg-slate-50/70 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-slate-300 shadow-3xs'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(t.id, t.status)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition ${isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-indigo-600 bg-white'
                              }`}
                          >
                            {isDone && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div className="min-w-0">
                            <h5 className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {t.title}
                            </h5>
                            {t.description && (
                              <p className="text-[11px] text-slate-500 truncate">{t.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                              {t.assignedTo && <span>👤 {t.assignedTo.fullName}</span>}
                              <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                          {t.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* T11: TIMELINE */}
          {(activeTab === 'Filing Timeline' || activeTab === 'Activity Timeline') && (
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

          {/* T_CLAIMS: CLAIMS ENGINEERING & PRELIMINARY FTO STUDIO */}
          {activeTab === 'Claims Engineering' && (
            <ClaimsEngineeringStudio
              projectId={project.id}
              isOwnerOrMember={project.isOwner || Boolean(projectMemberRecord)}
              onRefreshDocuments={fetchProject}
            />
          )}

          {/* T12: REPORTS */}
          {activeTab === 'Reports Center' && (
            <div className="space-y-6">
              <h3 className="text-base font-extrabold text-slate-900">Compile & Export Filing Bundles</h3>
              <p className="text-xs text-slate-500 font-semibold leading-normal">
                Download automated claims evaluations, AI suggestions digests, and compiled readiness checklists:
              </p>

              {/* Task 8: Master Patent Intelligence Report PDF Banner Card */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 tracking-wider">
                    ✦ Comprehensive Audit Dossier
                  </span>
                  <h4 className="text-lg font-black tracking-tight text-white">Master Patent Intelligence Report PDF</h4>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Generates an executive 6-page filing dossier combining Invention Specifications, Prior Art Citations, AI Novelty Evaluation, 2D Figure Legends, IPO Form Approvals, Supervisor Review Audit Logs, and Filing Readiness Certification.
                  </p>
                </div>
                <button
                  onClick={handleGenerateMasterReport}
                  disabled={generatingMasterReport}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-500/25 shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {generatingMasterReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Compiling Master Report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" /> Compile Master Report PDF
                    </>
                  )}
                </button>
              </div>

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
