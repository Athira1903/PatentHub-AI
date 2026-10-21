import React, { useEffect, useState } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { CoInventorDashboard } from '../components/dashboard/CoInventorDashboard';
import { PatentExpertDashboard } from '../components/dashboard/PatentExpertDashboard';
import { GuideDashboard } from '../components/dashboard/GuideDashboard';
import { InventorDashboard } from '../components/dashboard/InventorDashboard';
import { OrganizationAdminDashboardPage } from './admin/OrganizationAdminDashboardPage';
import { normalizeUserRole } from '../utils/roleUtils';

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
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (outletCtx.user) return outletCtx.user;
    try {
      const cached = localStorage.getItem('patenthub_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
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
        const userObj = profileRes.value.data.user || profileRes.value.data;
        if (userObj) {
          setCurrentUser(userObj);
          localStorage.setItem('patenthub_user', JSON.stringify(userObj));
        }
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
  const normalizedRole = normalizeUserRole(user?.role);

  if (normalizedRole === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (normalizedRole === 'ORGANIZATION_ADMIN') {
    return <OrganizationAdminDashboardPage />;
  }

  if (normalizedRole === 'GUIDE') {
    return <GuideDashboard user={user} projects={projects} onRefresh={fetchDashboardData} />;
  }

  if (normalizedRole === 'PATENT_EXPERT') {
    return <PatentExpertDashboard user={user} projects={projects} onRefresh={fetchDashboardData} />;
  }

  if (normalizedRole === 'CO_INVENTOR') {
    return <CoInventorDashboard user={user} projects={projects} onRefresh={fetchDashboardData} />;
  }

  // Default: Full Inventor Patent Innovation Command Center
  return <InventorDashboard user={user} onRefresh={fetchDashboardData} />;
};

export default DashboardPage;
