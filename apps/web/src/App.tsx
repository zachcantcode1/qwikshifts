import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import { ScheduleBoard } from '@/pages/ScheduleBoard';
import { MySchedule } from '@/pages/MySchedule';
import { TimeOff } from '@/pages/TimeOff';
import { TimeOffRequests } from '@/pages/TimeOffRequests';
import { Employees } from '@/pages/Employees';
import { Settings } from '@/pages/Settings';
import Onboarding from '@/pages/Onboarding';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useState } from 'react';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const { user, isLoading, isOnboarded, login } = useAuth();
  const [email, setEmail] = useState('');

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading...</div>;
  }

  if (!isOnboarded) {
    return <Onboarding />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background text-foreground">
        <h1 className="text-2xl font-bold">QwikShifts</h1>
        <p className="text-muted-foreground">Please log in to continue.</p>
        <div className="flex flex-col gap-2 w-full max-w-sm px-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
          <button
            onClick={() => login(email)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<ScheduleBoard />} />
        <Route path="/my-schedule" element={<MySchedule />} />
        <Route path="/time-off" element={<TimeOff />} />
        <Route path="/time-off-requests" element={<TimeOffRequests />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
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
