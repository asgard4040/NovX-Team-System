
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { User, SalesRequest, Institution, RequestStatus, UserRole, SystemProduct, Notification } from "../types";

// تحديث المفاتيح للرابط الجديد الخاص بك
const SUPABASE_URL = 'https://vjzopotnxnqccgpvahdi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kEIfBM8eQJqxU401V9xGLw_S81HoYQr';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SESSION_KEY = 'mandoubi_session';

export const api = {
  auth: {
    login: async (username: string, password: string, roleType: 'AGENT' | 'ADMIN'): Promise<User | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (error || !data) return null;
        
        const user = data as User;
        if (user.status === 'SUSPENDED') {
          throw new Error("ACCOUNT_SUSPENDED");
        }
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
      } catch (err) {
        console.error("Login Error:", err);
        throw err;
      }
    },
    logout: () => {
      localStorage.removeItem(SESSION_KEY);
    },
    getCurrentUser: (): User | null => {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    },
    updateProfile: async (id: string, updates: Partial<User>): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const currentUser = JSON.parse(session);
        if (currentUser.id === id) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(data));
        }
      }
      return data as User;
    }
  },

  requests: {
    getAll: async (): Promise<SalesRequest[]> => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data.map(item => ({
        ...item,
        agentId: item.agent_id,
        agentName: item.agent_name,
        institutionName: item.institution_name,
        systemId: item.system_id,
        systemName: item.system_name,
        subscriptionType: item.subscription_type,
        contactName: item.contact_name,
        contactPhone: item.contact_phone,
        rejectionReason: item.rejection_reason,
        adminNote: item.admin_note,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) as SalesRequest[];
    },
    create: async (request: Omit<SalesRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesRequest> => {
      const payload = {
        agent_id: request.agentId,
        agent_name: request.agentName,
        institution_name: request.institutionName,
        system_id: request.systemId,
        system_name: request.systemName,
        subscription_type: request.subscriptionType,
        location: request.location,
        contact_name: request.contactName,
        contact_phone: request.contactPhone,
        status: request.status,
        admin_note: request.adminNote
      };

      const { data, error } = await supabase
        .from('requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as SalesRequest;
    },
    updateStatus: async (id: string, status: RequestStatus, note?: string): Promise<void> => {
      const { data: request, error: fetchError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('requests')
        .update({ 
          status, 
          rejection_reason: note, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      if (status === RequestStatus.ACCEPTED) {
        await api.institutions.syncFromRequest({
          institutionName: request.institution_name,
          agentName: request.agent_name,
          location: request.location,
          status: status
        });
      }

      await supabase.from('notifications').insert([{
        user_id: request.agent_id,
        title: status === RequestStatus.ACCEPTED ? 'تم قبول طلبك ✅' : 'عذراً، تم رفض الطلب ❌',
        message: status === RequestStatus.ACCEPTED 
          ? `تمت الموافقة على طلبك لـ ${request.institution_name}. تم تحديث رصيد عمولاتك.`
          : `تم رفض الطلب المقدم لـ ${request.institution_name}. السبب: ${note || 'غير موضح'}`,
        type: status === RequestStatus.ACCEPTED ? 'SUCCESS' : 'DANGER'
      }]);
    }
  },

  notifications: {
    getAll: async (userId: string): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data.map(n => ({
        ...n,
        userId: n.user_id,
        isRead: n.is_read,
        createdAt: n.created_at
      })) as Notification[];
    },
    markAsRead: async (id: string): Promise<void> => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    markAllAsRead: async (userId: string): Promise<void> => {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    }
  },

  agents: {
    getAll: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', UserRole.AGENT);
      return (data || []) as User[];
    },
    getById: async (id: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return (data || null) as User;
    },
    create: async (agent: Omit<User, 'id' | 'status' | 'role'>): Promise<User> => {
      const payload = {
        name: agent.name,
        username: agent.username,
        password: agent.password,
        email: agent.email || '',
        city: agent.city || '',
        phone: agent.phone || '',
        role: UserRole.AGENT,
        status: 'ACTIVE'
      };

      const { data, error } = await supabase
        .from('users')
        .insert([payload])
        .select()
        .single();
        
      if (error) {
        console.error("Supabase Create Agent Error:", error);
        throw error;
      }
      return data as User;
    },
    update: async (id: string, updates: Partial<User>): Promise<void> => {
      const { error } = await supabase.from('users').update(updates).eq('id', id);
      if (error) throw error;
    },
    toggleStatus: async (id: string): Promise<void> => {
      const { data } = await supabase.from('users').select('status').eq('id', id).single();
      const newStatus = data?.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    }
  },

  admins: {
    getAll: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', [UserRole.ADMIN, UserRole.SUPERVISOR]);
      return (data || []) as User[];
    },
    create: async (admin: Omit<User, 'id' | 'status' | 'role'>): Promise<User> => {
      const payload = {
        name: admin.name,
        username: admin.username,
        password: admin.password,
        email: admin.email || '',
        role: UserRole.SUPERVISOR,
        status: 'ACTIVE'
      };

      const { data, error } = await supabase
        .from('users')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      return data as User;
    },
    update: async (id: string, updates: Partial<User>): Promise<void> => {
      const { error } = await supabase.from('users').update(updates).eq('id', id);
      if (error) throw error;
    }
  },

  institutions: {
    getAll: async (): Promise<Institution[]> => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('last_visit_date', { ascending: false });
      
      if (error) return [];
      return data.map(i => ({
        ...i,
        lastVisitedBy: i.last_visited_by,
        lastVisitDate: i.last_visit_date
      })) as Institution[];
    },
    create: async (data: Omit<Institution, 'id' | 'status' | 'lastVisitDate'>): Promise<Institution> => {
      const payload = {
        name: data.name,
        city: data.city,
        address: data.address,
        last_visited_by: data.lastVisitedBy,
        last_visit_date: new Date().toISOString().split('T')[0],
        status: 'INTERESTED'
      };

      const { data: result, error } = await supabase
        .from('institutions')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return result as Institution;
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('institutions').delete().eq('id', id);
    },
    syncFromRequest: async (request: any): Promise<void> => {
      const { data: existing } = await supabase
        .from('institutions')
        .select('id')
        .eq('name', request.institutionName)
        .maybeSingle();

      const payload = {
        name: request.institutionName,
        city: request.location?.split('-')[0]?.trim() || 'غير محدد',
        address: request.location || '',
        last_visited_by: request.agentName,
        last_visit_date: new Date().toISOString().split('T')[0],
        status: request.status === RequestStatus.ACCEPTED ? 'CUSTOMER' : 'INTERESTED'
      };

      if (existing) {
        await supabase.from('institutions').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('institutions').insert([payload]);
      }
    }
  },

  systems: {
    getAll: async (): Promise<SystemProduct[]> => {
      const { data, error } = await supabase.from('systems').select('*');
      return (data || []) as SystemProduct[];
    },
    create: async (system: Omit<SystemProduct, 'id'>): Promise<SystemProduct> => {
      const { data, error } = await supabase.from('systems').insert([system]).select().single();
      if (error) throw error;
      return data as SystemProduct;
    },
    update: async (id: string, system: Partial<SystemProduct>): Promise<void> => {
      await supabase.from('systems').update(system).eq('id', id);
    },
    delete: async (id: string): Promise<void> => {
      await supabase.from('systems').delete().eq('id', id);
    }
  },

  data: {
    exportAll: () => alert("البيانات مخزنة سحابياً الآن في Supabase وتتم حمايتها تلقائياً."),
    importAll: async (file: File) => alert("البيانات مخزنة سحابياً. لإجراء استيراد ضخم يرجى استخدام لوحة تحكم Supabase.")
  },

  ai: {
    analyzePerformance: async (requests: SalesRequest[]): Promise<string> => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summary = requests.map(r => `${r.agentName}: ${r.status}`).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `حلل بيانات المبيعات التالية باللغة العربية واقترح خطة عمل لتحسين أداء الفريق: ${summary}`,
        config: { systemInstruction: "أنت خبير مبيعات تحلل أداء الفريق الميداني لشركة برمجيات متخصصة في الأنظمة التعليمية." }
      });
      return response.text || "تعذر التحليل حالياً، يرجى المحاولة لاحقاً.";
    }
  }
};
