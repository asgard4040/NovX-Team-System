
import React, { useState } from 'react';
import { SystemProduct, SubscriptionType } from '../../types';
import { ICONS } from '../../constants';

interface SystemsManagerProps {
  systems: SystemProduct[];
  onCreate: (system: Omit<SystemProduct, 'id'>) => void;
  onUpdate: (id: string, system: Partial<SystemProduct>) => void;
  onDelete: (id: string) => void;
}

const SystemsManager: React.FC<SystemsManagerProps> = ({ systems, onCreate, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemProduct | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prices: {
      [SubscriptionType.STANDARD]: 0,
      [SubscriptionType.PLUS]: 0,
      [SubscriptionType.PREMIUM]: 0
    },
    commission: {
      [SubscriptionType.STANDARD]: 0,
      [SubscriptionType.PLUS]: 0,
      [SubscriptionType.PREMIUM]: 0
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prices: { [SubscriptionType.STANDARD]: 0, [SubscriptionType.PLUS]: 0, [SubscriptionType.PREMIUM]: 0 },
      commission: { [SubscriptionType.STANDARD]: 0, [SubscriptionType.PLUS]: 0, [SubscriptionType.PREMIUM]: 0 }
    });
    setEditingSystem(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (system: SystemProduct) => {
    setEditingSystem(system);
    setFormData({
      name: system.name,
      description: system.description,
      prices: { ...system.prices },
      commission: { ...system.commission }
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSystem) {
      onUpdate(editingSystem.id, formData);
    } else {
      onCreate(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between bg-[#0A0A0A] p-10 rounded-[3rem] border border-[#1A1A1A] gap-6">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">بنية الأنظمة والأسعار</h3>
          <p className="text-[10px] text-gray-600 mt-2 font-black uppercase tracking-[0.4em]">Pricing & Commission Matrix (IQD)</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-white text-black px-12 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all active:scale-95 w-full md:w-auto text-center"
        >
          إضافة نظام جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {systems.map(sys => (
          <div key={sys.id} className="bg-[#0A0A0A] rounded-[3.5rem] border border-[#1A1A1A] overflow-hidden flex flex-col group hover:border-white/20 transition-all duration-500 relative">
            <div className="p-10 border-b border-[#111]">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-black border border-[#222] rounded-[1.5rem] flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all">
                    {ICONS.Package}
                  </div>
                  <div>
                    <h4 className="font-black text-2xl text-white tracking-tighter uppercase">{sys.name}</h4>
                    <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest mt-1">ID: {sys.id}</p>
                  </div>
                </div>
                <div className="flex gap-2 relative z-10">
                   <button 
                    onClick={() => handleOpenEdit(sys)} 
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white hover:text-black rounded-xl transition-all"
                    title="تعديل"
                   >
                    {ICONS.Settings}
                   </button>
                   <button 
                    onClick={(e) => handleDeleteClick(e, sys.id)} 
                    className="w-10 h-10 flex items-center justify-center bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                    title="حذف النظام"
                   >
                    {ICONS.X}
                   </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-bold leading-relaxed">{sys.description}</p>
            </div>
            
            <div className="p-10 space-y-6 flex-1 bg-[#050505]">
              <h5 className="font-black text-[9px] text-gray-700 uppercase tracking-[0.5em] border-r-2 border-white pr-3">مستويات الاشتراك</h5>
              <div className="space-y-4">
                {[SubscriptionType.STANDARD, SubscriptionType.PLUS, SubscriptionType.PREMIUM].map(tier => (
                  <div key={tier} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-black border border-[#111] rounded-[1.8rem] hover:border-white/10 transition-colors gap-6">
                    <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest">{tier}</span>
                    
                    <div className="grid grid-cols-2 gap-8 sm:gap-12 flex-1 sm:flex-initial">
                      <div className="relative text-right sm:text-left">
                        <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest mb-1.5">السعر</p>
                        <div className="flex items-center sm:justify-start gap-1">
                          <span className="font-black text-xl text-white tracking-tighter tabular-nums">{sys.prices[tier].toLocaleString()}</span>
                          <span className="text-[8px] font-black text-gray-600 uppercase">IQD</span>
                        </div>
                      </div>
                      
                      <div className="relative text-right sm:text-left border-r border-white/5 pr-8 sm:pr-0 sm:border-r-0">
                         <div className="absolute inset-y-0 -left-6 w-px bg-white/5 hidden sm:block"></div>
                        <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest mb-1.5">العمولة</p>
                        <div className="flex items-center sm:justify-start gap-1">
                          <span className="font-black text-xl text-white tracking-tighter tabular-nums">{sys.commission[tier].toLocaleString()}</span>
                          <span className="text-[8px] font-black text-gray-600 uppercase">IQD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-black border-t border-[#111] flex gap-4">
              <button 
                onClick={() => handleOpenEdit(sys)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-colors"
              >
                تحديث مصفوفة التسعير
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-8 overflow-y-auto">
          <div className="bg-[#0A0A0A] w-full max-w-3xl rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-300">
            <form onSubmit={handleSubmit}>
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                    {editingSystem ? 'تحديث بيانات النظام' : 'تفعيل وحدة نظام جديدة'}
                  </h4>
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] mt-1">System Matrix Configuration</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white hover:text-black transition-all">
                  {ICONS.X}
                </button>
              </div>

              <div className="p-12 space-y-10">
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mr-4">اسم النظام</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-8 py-5 rounded-[2rem] bg-black border border-white/5 text-white focus:border-white outline-none transition-all font-black text-sm"
                      placeholder="مثال: نظام إدراك المطور"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mr-4">وصف تفصيلي</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-8 py-5 rounded-[2rem] bg-black border border-white/5 text-white focus:border-white outline-none transition-all font-bold text-sm resize-none"
                      placeholder="اشرح الخصائص الأساسية للنظام..."
                    />
                  </div>
                </div>

                <div className="space-y-8">
                   <h5 className="text-[9px] font-black text-white uppercase tracking-[0.6em] border-b border-white/10 pb-4">مصفوفة الإيرادات والعمولات</h5>
                   
                   {[SubscriptionType.STANDARD, SubscriptionType.PLUS, SubscriptionType.PREMIUM].map(tier => (
                     <div key={tier} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-black/40 p-6 rounded-[2.5rem] border border-white/5">
                        <div className="font-black text-[10px] text-gray-500 uppercase tracking-widest">{tier}</div>
                        <div className="space-y-2">
                           <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest">السعر</label>
                           <input 
                              required
                              type="number"
                              value={formData.prices[tier]}
                              onChange={e => setFormData({
                                ...formData, 
                                prices: { ...formData.prices, [tier]: Number(e.target.value) }
                              })}
                              className="w-full px-6 py-4 rounded-2xl bg-black border border-white/5 text-white outline-none font-black text-xs"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest">العمولة</label>
                           <input 
                              required
                              type="number"
                              value={formData.commission[tier]}
                              onChange={e => setFormData({
                                ...formData, 
                                commission: { ...formData.commission, [tier]: Number(e.target.value) }
                              })}
                              className="w-full px-6 py-4 rounded-2xl bg-black border border-white/5 text-white outline-none font-black text-xs"
                           />
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-10 border-t border-white/5 flex gap-4">
                <button 
                  type="submit"
                  className="flex-1 bg-white text-black font-black py-6 rounded-[2.5rem] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all text-[11px] uppercase tracking-[0.5em]"
                >
                  حفظ البيانات
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 py-6 text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-widest"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemsManager;
