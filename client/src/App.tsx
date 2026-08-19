import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AboutPage } from './pages/AboutPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { TasksPage } from './pages/TasksPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { ActivatePage } from './pages/ActivatePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ProjectSelectionPage } from './pages/ProjectSelectionPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/about"
            element={
              <>
                <Navbar />
                <AboutPage />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <LoginPage />
              </>
            }
          />
          <Route
            path="/register"
            element={
              <>
                <Navbar />
                <RegisterPage />
              </>
            }
          />
          <Route
            path="/activate"
            element={
              <>
                <Navbar />
                <ActivatePage />
              </>
            }
          />

          {/* Onboarding Profile Route */}
          <Route path="/complete-profile" element={<CompleteProfilePage />} />

          {/* Dedicated Central Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/*" element={<AdminDashboardPage />} />

          {/* Dedicated Inventor & Role-based Dashboard Workspace */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailsPage />} />
            <Route path="create-project" element={<CreateProject />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="claims" element={<ProjectSelectionPage />} />
            <Route path="documents" element={<ProjectSelectionPage />} />
            <Route path="prior-art" element={<ProjectSelectionPage />} />
            <Route path="fto-analysis" element={<ProjectSelectionPage />} />
            <Route path="team" element={<ProjectSelectionPage />} />
            <Route path="activity" element={<ProjectSelectionPage />} />
          </Route>

          {/* Direct Shortcuts */}
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashbord" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashbord/*" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0a2a28',
              border: '1px solid #dce4e2',
              boxShadow: '0 2px 6px rgba(10,42,40,0.08)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
