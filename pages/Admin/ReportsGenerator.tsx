
import React from 'react';
import { SalesRequest, User, SystemProduct, RequestStatus } from '../../types';
import { ICONS } from '../../constants';

interface ReportsGeneratorProps {
  requests: SalesRequest[];
  agents: User[];
  systems: SystemProduct[];
}

const ReportsGenerator: React.FC<ReportsGeneratorProps> = ({ requests, agents, systems }) => {
  // تصفية الطلبات المقبولة فقط للحسابات المالية
  const acceptedRequests = requests.filter(r => r.status === RequestStatus.ACCEPTED);
  
  // 1. حساب إجمالي حجم المبيعات (Revenue)
  const totalRevenue = acceptedRequests.reduce((sum, req) => {
    const system = systems.find(s => s.id === req.systemId);
    return sum + (system ? system.prices[req.subscriptionType] : 0);
  }, 0);

  // 2. حساب إجمالي العمولات المستحقة (Total Commissions)
  const totalCommission = acceptedRequests.reduce((sum, req) => {
    const system = systems.find(s => s.id === req.systemId);
    return sum + (system ? system.commission[req.subscriptionType] : 0);
  }, 0);

  // 3. متوسط قيمة العقد
  const avgContractValue = acceptedRequests.length > 0 
    ? Math.round(totalRevenue / acceptedRequests.length) 
    : 0;

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section - No Buttons as requested */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">الأداء التشغيلي والمالي</h2>
          <p className="text-[10px] text-gray-600 mt-2 font-black uppercase tracking-[0.5em]">Real-time Operational Intelligence Report</p>
        </div>
        <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
           <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1 text-left">Report Context</p>
           <p className="text-xs font-black text-white uppercase tracking-tighter italic">Full System Audit</p>
        </div>
      </div>

      {/* Main Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 flex flex-col justify-between h-64 hover:border-white/20 transition-all group">
          <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            {ICONS.Check}
          </div>
          <div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">إجمالي المبيعات المكتملة</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tighter">{acceptedRequests.length}</span>
              <span className="text-sm font-black text-gray-700 uppercase">عقد</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 flex flex-col justify-between h-64 hover:border-white/20 transition-all">
          <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-6">
            {ICONS.Trend}
          </div>
          <div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">إجمالي العمولات (IQD)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tighter">{totalCommission.toLocaleString()}</span>
              <span className="text-xs font-black text-gray-700 uppercase">د.ع</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 flex flex-col justify-between h-64 hover:border-white/20 transition-all">
          <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-6">
            {ICONS.Package}
          </div>
          <div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">متوسط قيمة العقد</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tighter">{avgContractValue.toLocaleString()}</span>
              <span className="text-xs font-black text-gray-700 uppercase">د.ع</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Market Share by System */}
        <div className="bg-[#0A0A0A] p-10 rounded-[3.5rem] border border-white/5">
          <div className="flex items-center justify-between mb-12">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] border-r-2 border-white pr-4">تحليل حصة السوق</h4>
            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest">بناءً على العقود الموقعة</span>
          </div>
          
          <div className="space-y-10">
            {systems.map(sys => {
              const count = acceptedRequests.filter(r => r.systemId === sys.id).length;
              const percentage = acceptedRequests.length > 0 ? (count / acceptedRequests.length * 100) : 0;
              
              return (
                <div key={sys.id} className="group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-black text-lg text-white tracking-tighter uppercase italic">{sys.name}</span>
                    <span className="text-xs font-black text-white/40 group-hover:text-white transition-colors">{count} مبيعات • {percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                      style={{width: `${percentage}%`}}
                    ></div>
                  </div>
                </div>
              );
            })}
            
            {systems.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">No systems registered in matrix</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Agents Index */}
        <div className="bg-[#0A0A0A] p-10 rounded-[3.5rem] border border-white/5">
           <div className="flex items-center justify-between mb-12">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] border-r-2 border-white pr-4">مؤشر أداء المناديب</h4>
            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest">Top Producers List</span>
          </div>

          <div className="space-y-6">
            {agents
              .map(agent => ({
                ...agent,
                count: acceptedRequests.filter(r => r.agentId === agent.id).length
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((agent, idx) => (
                <div key={agent.id} className="flex items-center justify-between p-6 bg-black border border-white/5 rounded-[2rem] hover:border-white/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black text-xs">
                      0{idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm uppercase tracking-tighter italic">{agent.name}</p>
                      <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-0.5">{agent.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white tracking-tighter">{agent.count}</p>
                    <p className="text-[7px] text-gray-700 font-black uppercase tracking-widest">Closed Deals</p>
                  </div>
                </div>
              ))}
              
            {agents.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">No active deployment data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center pt-12 border-t border-white/5">
        <p className="text-[8px] text-gray-900 font-black uppercase tracking-[1em]">Analytical Core Engine Protocol v4.0.0</p>
      </div>
    </div>
  );
};

export default ReportsGenerator;
