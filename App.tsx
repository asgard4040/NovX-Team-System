
import React, { useState, useEffect } from 'react';
import { UserRole, RequestStatus, SalesRequest, User, Institution, SystemProduct } from './types';
import Sidebar from './components/Sidebar';
import { ICONS } from './constants';
import { api } from './services/api';

// Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import RequestsManager from './pages/Admin/RequestsManager';
import AgentsManager from './pages/Admin/AgentsManager';
import AdminsManager from './pages/Admin/AdminsManager'; 
import LeadsManager from './pages/Admin/LeadsManager';
import SystemsManager from './pages/Admin/SystemsManager';
import ReportsGenerator from './pages/Admin/ReportsGenerator';
import AdminProfile from './pages/Admin/AdminProfile'; 
import AgentHome from './pages/Agent/AgentHome';
import SendRequest from './pages/Agent/SendRequest';
import MyRequests from './pages/Agent/MyRequests';
import PublicInstitutionsList from './pages/Agent/PublicInstitutionsList';
import AgentProfile from './pages/Agent/AgentProfile';
import Notifications from './pages/Agent/Notifications';
import Login from './pages/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(api.auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [requests, setRequests] = useState<SalesRequest[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [systems, setSystems] = useState<SystemProduct[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
      const statusInterval = setInterval(checkCurrentStatus, 30000);
      return () => clearInterval(statusInterval);
    }
  }, [currentUser]);

  const checkCurrentStatus = async () => {
    if (currentUser && currentUser.role === UserRole.AGENT) {
      const freshAgent = await api.agents.getById(currentUser.id);
      if (freshAgent && freshAgent.status === 'SUSPENDED') {
        alert("تم إيقاف حسابك من قبل الإدارة. سيتم تسجيل خروجك الآن.");
        handleLogout();
      }
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [reqs, insts, sys, agnts, admns] = await Promise.all([
        api.requests.getAll(),
        api.institutions.getAll(),
        api.systems.getAll(),
        api.agents.getAll(),
        api.admins.getAll()
      ]);
      setRequests(reqs);
      setInstitutions(insts);
      setSystems(sys);
      setAgents(agnts);
      setAdmins(admns);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string, type: 'AGENT' | 'ADMIN') => {
    setIsLoading(true);
    try {
      const user = await api.auth.login(username, password, type);
      if (user) {
        setCurrentUser(user);
        setActiveTab('dashboard');
      } else {
        alert("بيانات الدخول غير صحيحة، يرجى التأكد من اسم المستخدم وكلمة المرور ونوع الحساب المختار.");
      }
    } catch (error: any) {
      if (error.message === "ACCOUNT_SUSPENDED") {
        alert("هذا الحساب موقوف حالياً، يرجى التواصل مع الإدارة.");
      } else {
        alert("حدث خطأ أثناء تسجيل الدخول.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
  };

  const handleCreateAgent = async (agent: Omit<User, 'id' | 'status' | 'role'>) => {
    setIsLoading(true);
    try {
      await api.agents.create(agent);
      await loadAllData();
    } catch (error) {
      console.error("Failed to create agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAgent = async (id: string, updates: Partial<User>) => {
    setIsLoading(true);
    try {
      await api.agents.update(id, updates);
      await loadAllData();
    } catch (error) {
      console.error("Failed to update agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (admin: Omit<User, 'id' | 'status' | 'role'>) => {
    setIsLoading(true);
    try {
      await api.admins.create(admin);
      await loadAllData();
    } catch (error) {
      console.error("Failed to create admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAdmin = async (id: string, updates: Partial<User>) => {
    setIsLoading(true);
    try {
      await api.admins.update(id, updates);
      await loadAllData();
    } catch (error) {
      console.error("Failed to update admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
    }
  };

  const renderContent = () => {
    if (!currentUser) return <Login onLogin={handleLogin} />;
    
    if (currentUser.role === UserRole.AGENT) {
      switch (activeTab) {
        case 'dashboard': return <AgentHome user={currentUser} requests={requests} systems={systems} />;
        case 'send-request': return <SendRequest systems={systems} onSend={async (r) => {
          setIsLoading(true);
          try {
            await api.requests.create({...r, agentId: currentUser.id, agentName: currentUser.name});
            await loadAllData();
            setActiveTab('my-requests');
          } finally { setIsLoading(false); }
        }} />;
        case 'my-requests': return <MyRequests requests={requests.filter(r => r.agentId === currentUser.id)} />;
        case 'notifications': return <Notifications />;
        case 'names-list': return (
          <PublicInstitutionsList 
            institutions={institutions} 
            onAddVisit={async (d) => {
              setIsLoading(true);
              try { await api.institutions.create(d); await loadAllData(); } finally { setIsLoading(false); }
            }} 
            onDelete={() => {}}
            currentUserName={currentUser.name}
          />
        );
        case 'profile': return <AgentProfile user={currentUser} requests={requests.filter(r => r.agentId === currentUser.id)} systems={systems} />;
        default: return <AgentHome user={currentUser} requests={requests} systems={systems} />;
      }
    } 
    else {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard requests={requests} agents={agents} systems={systems} />;
        case 'requests': return <RequestsManager requests={requests} updateStatus={async (id, s, r) => {
           setIsLoading(true);
           try { await api.requests.updateStatus(id, s, r); await loadAllData(); } finally { setIsLoading(false); }
        }} systems={systems} />;
        case 'agents': return (
          <AgentsManager 
            agents={agents} 
            requests={requests} 
            onToggleStatus={async (id) => {
              setIsLoading(true);
              try { await api.agents.toggleStatus(id); await loadAllData(); } finally { setIsLoading(false); }
            }} 
            onCreate={handleCreateAgent}
            onUpdate={handleUpdateAgent}
            currentUser={currentUser}
          />
        );
        case 'admins': return <AdminsManager admins={admins} onCreate={handleCreateAdmin} onUpdate={handleUpdateAdmin} currentUser={currentUser} />;
        case 'leads': return <LeadsManager institutions={institutions} requests={requests} onDelete={async (id) => {
           setIsLoading(true);
           try { await api.institutions.delete(id); await loadAllData(); } finally { setIsLoading(false); }
        }} />;
        case 'systems': return (
          <SystemsManager 
            systems={systems} 
            onCreate={async (s) => { setIsLoading(true); try { await api.systems.create(s); await loadAllData(); } finally { setIsLoading(false); } }}
            onUpdate={async (id, s) => { setIsLoading(true); try { await api.systems.update(id, s); await loadAllData(); } finally { setIsLoading(false); } }}
            onDelete={async (id) => { setIsLoading(true); try { await api.systems.delete(id); await loadAllData(); } finally { setIsLoading(false); } }}
          />
        );
        case 'reports': return <ReportsGenerator requests={requests} agents={agents} systems={systems} />;
        case 'admin-profile': return <AdminProfile user={currentUser} onUpdate={handleUpdateProfile} />;
        default: return <AdminDashboard requests={requests} agents={agents} systems={systems} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black" dir="rtl">
      {currentUser && (
        <Sidebar 
          role={currentUser.role} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userName={currentUser.name}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <main className={`${currentUser ? 'lg:pr-64' : ''} transition-all duration-700 min-h-screen`}>
        {currentUser && (
          <header className="h-20 lg:h-24 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30 border-b border-white/5">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5">
                {ICONS.Menu}
              </button>
              <h2 className="font-black text-white text-lg lg:text-2xl tracking-tighter uppercase italic">{activeTab}</h2>
            </div>
            <button onClick={() => setActiveTab('notifications')} className="w-10 h-10 lg:w-12 lg:h-12 bg-white/5 border border-white/5 text-white flex items-center justify-center rounded-xl lg:rounded-[1.2rem] hover:bg-white hover:text-black transition-all relative">
              {ICONS.Notification}
            </button>
          </header>
        )}
        <div className="p-6 lg:p-12 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
      {isLoading && (
        <div className="fixed bottom-6 left-6 bg-white text-black px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] z-50 animate-pulse">Syncing Data</div>
      )}
    </div>
  );
};

export default App;
