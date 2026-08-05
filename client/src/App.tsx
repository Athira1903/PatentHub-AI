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

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailsPage />} />
            <Route path="create-project" element={<CreateProject />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

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
