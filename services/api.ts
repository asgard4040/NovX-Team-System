
import { GoogleGenAI } from "@google/genai";
import { User, SalesRequest, Institution, RequestStatus, UserRole, SystemProduct, Notification } from "../types";
import { AGENTS_DB } from "../agents.db";
import { ADMINS_DB } from "../admins.db";
import { REQUESTS_DB } from "../requests.db";
import { INSTITUTIONS_DB } from "../institutions.db";
import { SYSTEMS_DB } from "../systems.db";

const STORAGE_KEYS = {
  AGENTS: 'mandoubi_agents',
  ADMINS: 'mandoubi_admins',
  REQUESTS: 'mandoubi_requests',
  INSTITUTIONS: 'mandoubi_institutions',
  SYSTEMS: 'mandoubi_systems',
  NOTIFICATIONS: 'mandoubi_notifications',
  SESSION: 'mandoubi_session'
};

const seedData = () => {
  const checkAndSeed = (key: string, defaultData: any) => {
    // تم الإصلاح: لا نقوم بالمسح إذا كانت البيانات موجودة مسبقاً
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultData));
    }
  };

  checkAndSeed(STORAGE_KEYS.AGENTS, AGENTS_DB);
  checkAndSeed(STORAGE_KEYS.ADMINS, ADMINS_DB);
  checkAndSeed(STORAGE_KEYS.REQUESTS, REQUESTS_DB);
  checkAndSeed(STORAGE_KEYS.INSTITUTIONS, INSTITUTIONS_DB);
  checkAndSeed(STORAGE_KEYS.SYSTEMS, SYSTEMS_DB);
  checkAndSeed(STORAGE_KEYS.NOTIFICATIONS, []);
};

seedData();

export const api = {
  auth: {
    login: async (username: string, password: string, roleType: 'AGENT' | 'ADMIN'): Promise<User | null> => {
      await new Promise(r => setTimeout(r, 600)); 
      const key = roleType === 'AGENT' ? STORAGE_KEYS.AGENTS : STORAGE_KEYS.ADMINS;
      const users: User[] = JSON.parse(localStorage.getItem(key) || '[]');
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        if (user.status === 'SUSPENDED') {
          throw new Error("ACCOUNT_SUSPENDED");
        }
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        return user;
      }
      return null;
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    },
    getCurrentUser: (): User | null => {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session) : null;
    },
    updateProfile: async (id: string, updates: Partial<User>): Promise<User> => {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!session) throw new Error("UNAUTHORIZED");
      
      const currentUser: User = JSON.parse(session);
      const isAgent = currentUser.role === UserRole.AGENT;
      const key = isAgent ? STORAGE_KEYS.AGENTS : STORAGE_KEYS.ADMINS;
      
      const users: User[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedUsers = users.map(u => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser.id === id) {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updated));
          }
          return updated;
        }
        return u;
      });
      
      localStorage.setItem(key, JSON.stringify(updatedUsers));
      return updatedUsers.find(u => u.id === id)!;
    }
  },

  requests: {
    getAll: async (): Promise<SalesRequest[]> => {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
    },
    create: async (request: Omit<SalesRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesRequest> => {
      const agents: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AGENTS) || '[]');
      const agent = agents.find(a => a.id === request.agentId);
      
      if (agent && agent.status === 'SUSPENDED') {
        throw new Error("AGENT_SUSPENDED_ACTION_BLOCKED");
      }

      const requests = await api.requests.getAll();
      const newRequest: SalesRequest = {
        ...request,
        id: `req-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [newRequest, ...requests];
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
      return newRequest;
    },
    updateStatus: async (id: string, status: RequestStatus, note?: string): Promise<void> => {
      const requests = await api.requests.getAll();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return;

      const request = requests[requestIndex];
      request.status = status;
      request.rejectionReason = note;
      request.updatedAt = new Date().toISOString();

      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

      // تحديث حالة المؤسسة تلقائياً عند قبول الطلب
      if (status === RequestStatus.ACCEPTED) {
        await api.institutions.syncFromRequest(request);
      }

      const notificationTitle = status === RequestStatus.ACCEPTED ? 'تم قبول طلبك' : 'تم رفض طلبك';
      const notificationMessage = status === RequestStatus.ACCEPTED 
        ? `تم قبول طلبك الخاص بـ ${request.institutionName} بنجاح.`
        : `عذراً، تم رفض طلبك الخاص بـ ${request.institutionName}. السبب: ${note || 'غير محدد'}`;
      
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: request.agentId,
        title: notificationTitle,
        message: notificationMessage,
        type: status === RequestStatus.ACCEPTED ? 'SUCCESS' : 'DANGER',
        isRead: false,
        createdAt: new Date().toISOString()
      };

      const notifications: Notification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([newNotif, ...notifications]));
    }
  },

  notifications: {
    getAll: async (userId: string): Promise<Notification[]> => {
      const all: Notification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      return all.filter(n => n.userId === userId);
    },
    markAsRead: async (id: string): Promise<void> => {
      const all: Notification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      const updated = all.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    },
    markAllAsRead: async (userId: string): Promise<void> => {
      const all: Notification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      const updated = all.map(n => n.userId === userId ? { ...n, isRead: true } : n);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    }
  },

  agents: {
    getAll: async (): Promise<User[]> => {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.AGENTS) || '[]');
    },
    getById: async (id: string): Promise<User | null> => {
      const agents = await api.agents.getAll();
      return agents.find(a => a.id === id) || null;
    },
    create: async (agent: Omit<User, 'id' | 'status' | 'role'>): Promise<User> => {
      const agents = await api.agents.getAll();
      const newAgent: User = {
        ...agent,
        id: `agent-${Date.now()}`,
        status: 'ACTIVE',
        role: UserRole.AGENT
      };
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify([newAgent, ...agents]));
      return newAgent;
    },
    update: async (id: string, updates: Partial<User>): Promise<void> => {
      const agents = await api.agents.getAll();
      const updated = agents.map(a => a.id === id ? { ...a, ...updates } : a);
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(updated));
    },
    toggleStatus: async (id: string): Promise<void> => {
      const agents = await api.agents.getAll();
      const updated = agents.map(a => a.id === id ? { 
        ...a, 
        status: a.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' 
      } : a);
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(updated));
    }
  },

  admins: {
    getAll: async (): Promise<User[]> => {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMINS) || '[]');
    },
    create: async (admin: Omit<User, 'id' | 'status' | 'role'>): Promise<User> => {
      const admins = await api.admins.getAll();
      const newAdmin: User = {
        ...admin,
        id: `admin-${Date.now()}`,
        status: 'ACTIVE',
        role: UserRole.ADMIN
      };
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify([newAdmin, ...admins]));
      return newAdmin;
    },
    update: async (id: string, updates: Partial<User>): Promise<void> => {
      const admins = await api.admins.getAll();
      const updated = admins.map(a => a.id === id ? { ...a, ...updates } : a);
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(updated));
    }
  },

  institutions: {
    getAll: async (): Promise<Institution[]> => {
      const data = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      return data ? JSON.parse(data) : [];
    },
    create: async (data: Omit<Institution, 'id' | 'status' | 'lastVisitDate'>): Promise<Institution> => {
      const institutions = await api.institutions.getAll();
      const newInst: Institution = {
        ...data,
        id: `inst-${Date.now()}`,
        status: 'INTERESTED',
        lastVisitDate: new Date().toISOString().split('T')[0]
      };
      const updated = [newInst, ...institutions];
      localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
      return newInst;
    },
    delete: async (id: string): Promise<void> => {
      const institutions = await api.institutions.getAll();
      const updated = institutions.filter(inst => String(inst.id) !== String(id));
      localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    },
    syncFromRequest: async (request: SalesRequest): Promise<void> => {
      const institutions = await api.institutions.getAll();
      const existingIndex = institutions.findIndex(inst => inst.name === request.institutionName);
      
      const status: Institution['status'] = request.status === RequestStatus.ACCEPTED ? 'CUSTOMER' : 'INTERESTED';
      
      if (existingIndex >= 0) {
        institutions[existingIndex] = {
          ...institutions[existingIndex],
          lastVisitedBy: request.agentName,
          lastVisitDate: new Date().toISOString().split('T')[0],
          status: status
        };
      } else {
        const newInst: Institution = {
          id: `inst-${Date.now()}`,
          name: request.institutionName,
          city: request.location.split('-')[0]?.trim() || 'غير محدد',
          address: request.location,
          lastVisitedBy: request.agentName,
          lastVisitDate: new Date().toISOString().split('T')[0],
          status: status
        };
        institutions.push(newInst);
      }
      localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(institutions));
    }
  },

  systems: {
    getAll: async (): Promise<SystemProduct[]> => {
      const data = localStorage.getItem(STORAGE_KEYS.SYSTEMS);
      return data ? JSON.parse(data) : [];
    },
    create: async (system: Omit<SystemProduct, 'id'>): Promise<SystemProduct> => {
      const systems = await api.systems.getAll();
      const newSystem: SystemProduct = {
        ...system,
        id: `sys-${Date.now()}`
      };
      localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify([...systems, newSystem]));
      return newSystem;
    },
    update: async (id: string, system: Partial<SystemProduct>): Promise<void> => {
      const systems = await api.systems.getAll();
      const updated = systems.map(s => s.id === id ? { ...s, ...system } : s);
      localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify(updated));
    },
    delete: async (id: string): Promise<void> => {
      const systems = await api.systems.getAll();
      const updated = systems.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify(updated));
    }
  },

  ai: {
    analyzePerformance: async (requests: SalesRequest[]): Promise<string> => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summary = requests.map(r => `${r.agentName}: ${r.status}`).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `حلل بيانات المبيعات التالية باللغة العربية: ${summary}`,
        config: { systemInstruction: "أنت خبير مبيعات تحلل أداء الفريق الميداني." }
      });
      return response.text || "تعذر التحليل.";
    }
  }
};
