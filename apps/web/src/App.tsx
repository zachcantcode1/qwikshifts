import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Layout } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import { ScheduleBoard } from '@/pages/ScheduleBoard';
import { MySchedule } from '@/pages/MySchedule';
import { TimeOff } from '@/pages/TimeOff';
import { TimeOffRequests } from '@/pages/TimeOffRequests';
import { Employees } from '@/pages/Employees';
import { Settings } from '@/pages/Settings';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import VerifyEmail from '@/pages/VerifyEmail';
import { AuthProvider, useAuth } from '@/lib/auth';
import './App.css';

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isOnboarded } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return children;
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route path="/" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
      <Route path="/schedule" element={<RequireAuth><Layout><ScheduleBoard /></Layout></RequireAuth>} />
      <Route path="/my-schedule" element={<RequireAuth><Layout><MySchedule /></Layout></RequireAuth>} />
      <Route path="/time-off" element={<RequireAuth><Layout><TimeOff /></Layout></RequireAuth>} />
      <Route path="/time-off-requests" element={<RequireAuth><Layout><TimeOffRequests /></Layout></RequireAuth>} />
      <Route path="/employees" element={<RequireAuth><Layout><Employees /></Layout></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Layout><Settings /></Layout></RequireAuth>} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
