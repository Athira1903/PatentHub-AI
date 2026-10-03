import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('patenthub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Patent Engine Helper Endpoints
export const patentApi = {
  // Smart Next-Action
  getNextAction: (projectId: string) => api.get(`/projects/${projectId}/next-action`),
  getUserPrimaryNextAction: () => api.get('/projects/next-action/primary'),

  // Smart Filing Issue & Readiness Engine
  getFilingAssessment: (projectId: string) => api.get(`/projects/${projectId}/filing-assessment`),

  // Deadlines & Statutory Events
  getDeadlines: (projectId: string) => api.get(`/projects/${projectId}/deadlines`),
  recordFilingEvent: (projectId: string, data: any) => api.post(`/projects/${projectId}/filing-events`, data),

  // Intelligent Classification
  suggestClassification: (data: { title: string; description: string; projectId?: string }) =>
    api.post('/projects/classification/suggest', data),
  searchIPC: (query: string, domain?: string) =>
    api.get('/ipc', { params: { q: query, domain } }),

  // Multi-Section Specification & Versioning
  getSpecification: (projectId: string) => api.get(`/projects/${projectId}/specification`),
  saveSpecification: (projectId: string, data: any) => api.put(`/projects/${projectId}/specification`, data),
  createSpecificationVersion: (projectId: string, data: { changeSummary?: string }) =>
    api.post(`/projects/${projectId}/specification/versions`, data),
  getSpecificationVersions: (projectId: string) => api.get(`/projects/${projectId}/specification/versions`),
  getSpecificationVersion: (projectId: string, versionId: string) =>
    api.get(`/projects/${projectId}/specification/versions/${versionId}`),
  restoreSpecificationVersion: (projectId: string, versionId: string) =>
    api.post(`/projects/${projectId}/specification/versions/${versionId}/restore`),
  compareSpecificationVersions: (projectId: string, versionAId: string, versionBId: string) =>
    api.get(`/projects/${projectId}/specification/compare/${versionAId}/${versionBId}`),
  syncSpecificationWithForm2: (projectId: string) =>
    api.post(`/projects/${projectId}/specification/sync-form2`),
  exportSpecificationPdf: (projectId: string) => api.post(`/projects/${projectId}/specification/pdf`),

  // Legal Applicants
  getApplicants: (projectId: string) => api.get(`/projects/${projectId}/applicants`),
  addApplicant: (projectId: string, data: any) => api.post(`/projects/${projectId}/applicants`, data),
  deleteApplicant: (projectId: string, applicantId: string) =>
    api.delete(`/projects/${projectId}/applicants/${applicantId}`),

  // Legal Inventors
  getInventors: (projectId: string) => api.get(`/projects/${projectId}/inventors`),
  addInventor: (projectId: string, data: any) => api.post(`/projects/${projectId}/inventors`, data),
  deleteInventor: (projectId: string, inventorId: string) =>
    api.delete(`/projects/${projectId}/inventors/${inventorId}`),

  // Preliminary FTO Claim Charts & Overlap Analysis
  getProjectClaimCharts: (projectId: string) => api.get(`/projects/${projectId}/claims/charts`),
  getClaimChartByReference: (projectId: string, referenceId: string) =>
    api.get(`/projects/${projectId}/claims/charts/reference/${referenceId}`),
  generateFtoClaimChart: (projectId: string, claimId: string, referenceId: string) =>
    api.post(`/projects/${projectId}/claims/${claimId}/chart/${referenceId}`),
  deleteClaimChart: (projectId: string, chartId: string) =>
    api.delete(`/projects/${projectId}/claims/charts/${chartId}`),

  // AI Assistance
  runInnovationAnalysis: (projectId: string) => api.post(`/projects/${projectId}/ai/innovation-analysis`),
  runClaimSuggestion: (preamble: string, body: string) =>
    api.post('/projects/ai/claim-suggestion', { preamble, body }),
};
