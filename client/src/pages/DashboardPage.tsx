import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { CoInventorDashboard } from '../components/dashboard/CoInventorDashboard';
import { PatentExpertDashboard } from '../components/dashboard/PatentExpertDashboard';
import { GuideDashboard } from '../components/dashboard/GuideDashboard';
import { InventorDashboard } from '../components/dashboard/InventorDashboard';
import { OrganizationAdminDashboardPage } from './admin/OrganizationAdminDashboardPage';

interface Project {
  id: string;
  title: string;
  stage: string;
  category: string;
  technicalDomain: string;
  createdAt: string;
  updatedAt: string;
}

export const DashboardPage: React.FC = () => {
  const outletCtx = useOutletContext<{ user: any }>() || {};
  const [currentUser, setCurrentUser] = useState<any>(outletCtx.user || null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [projRes, profileRes] = await Promise.allSettled([
        api.get('/projects'),
        api.get('/auth/profile'),
      ]);

      if (projRes.status === 'fulfilled') {
        const fetchedProjects = projRes.value.data.projects || [];
        setProjects(fetchedProjects);
      }
      if (profileRes.status === 'fulfilled') {
        setCurrentUser(profileRes.value.data.user);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const user = currentUser || outletCtx.user;
  const userRole = user?.role || 'Inventor';
  const isOrgAdminRole = userRole === 'OrganizationAdmin' || userRole === 'OrgAdmin';
  const isGuideRole = userRole === 'Guide' || userRole === 'GUIDE';
  const isPatentExpertRole = userRole === 'PatentExpert' || userRole === 'Patent Expert' || userRole === 'PATENT_EXPERT';
  const isCoInventorRole = userRole === 'CoInventor' || userRole === 'CO_INVENTOR' || userRole === 'Co-Inventor';

  if (isOrgAdminRole) {
    return <OrganizationAdminDashboardPage />;
  }

  if (isGuideRole) {
    return <GuideDashboard user={user} projects={projects} onRefresh={fetchDashboardData} />;
  }

  if (isPatentExpertRole) {
    return <PatentExpertDashboard user={user} projects={projects} onRefresh={fetchDashboardData} />;
  }

  if (isCoInventorRole) {
    return <CoInventorDashboard user={user} projects={projects} onRefresh={fetchDashboardData} />;
  }

  // Default: Full Inventor Patent Innovation Command Center
  return <InventorDashboard user={user} onRefresh={fetchDashboardData} />;
};
