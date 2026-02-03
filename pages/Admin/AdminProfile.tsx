
import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface AdminProfileProps {
  user: User;
  onUpdate: (updates: Partial<User>) => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    username: user.username,
    password: user.password || '',
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.updateProfile(user.id, formData);
      onUpdate(formData);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      alert("حدث خطأ أثناء تحديث الملف الشخصي");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">الإعدادات الشخصية</h2>
        <p className="text-[10px] text-gray-600 mt-1 font-black uppercase tracking-[0.4em]">Personal Access & Security Profile</p>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16"></div>
        
        {isSuccess && (
          <div className="mb-8 p-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] animate-in slide-in-from-top flex items-center justify-center gap-3">
             <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>
             تم تحديث البيانات بنجاح
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mr-4">Name / الاسم</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-8 py-5 rounded-3xl bg-black border border-white/5 text-white outline-none focus:border-white font-bold text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mr-4">Username / اسم المستخدم</label>
            <input 
              required
              type="text" 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full px-8 py-5 rounded-3xl bg-black border border-white/5 text-white outline-none focus:border-white font-bold text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mr-4">Access Token / كلمة المرور الجديدة</label>
            <input 
              required
              type="password" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-8 py-5 rounded-3xl bg-black border border-white/5 text-white outline-none focus:border-white font-bold text-sm"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-black font-black py-6 rounded-3xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all uppercase tracking-[0.4em] text-[10px]"
          >
            تعديل الحساب
          </button>
        </form>
      </div>

      <div className="text-center">
         <p className="text-[8px] text-gray-800 font-black uppercase tracking-[0.6em]">System Security Protocol V3.2</p>
      </div>
    </div>
  );
};

export default AdminProfile;
