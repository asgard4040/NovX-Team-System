
import React, { useState } from 'react';
import { SystemProduct, SubscriptionType, RequestStatus } from '../../types';

interface SendRequestProps {
  systems: SystemProduct[];
  onSend: (req: any) => void;
}

const SendRequest: React.FC<SendRequestProps> = ({ systems, onSend }) => {
  const [formData, setFormData] = useState({
    institutionName: '',
    systemId: '',
    subscriptionType: SubscriptionType.STANDARD,
    location: '',
    contactName: '',
    contactPhone: '',
    note: ''
  });

  const [submitted, setSubmitted] = useState(false);

  // العثور على النظام المختار لعرض أسعاره
  const selectedSystem = systems.find(s => s.id === formData.systemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institutionName || !formData.systemId) return;

    const system = systems.find(s => s.id === formData.systemId);

    onSend({
      ...formData,
      systemName: system?.name || '',
      status: RequestStatus.PENDING,
      adminNote: formData.note
    });

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({
      institutionName: '',
      systemId: '',
      subscriptionType: SubscriptionType.STANDARD,
      location: '',
      contactName: '',
      contactPhone: '',
      note: ''
    });
  };

  const formatPrice = (price: number) => {
    return price >= 1000 ? (price / 1000) + ' الف' : price;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800">إرسال طلب مبيعات جديد</h3>
          <p className="text-gray-500 text-sm mt-1">املأ البيانات التالية بعناية لإرسال الطلب للمراجعة</p>
        </div>

        {submitted && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-center gap-2 animate-pulse">
            <span>تم إرسال الطلب بنجاح! سيتم إشعارك عند التحديث.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المؤسسة (مدرسة/جامعة/معهد)</label>
              <input 
                required
                type="text" 
                value={formData.institutionName}
                onChange={e => setFormData({...formData, institutionName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-black"
                placeholder="مثال: مدارس الرواد الأهلية"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">النظام المباع</label>
              <select 
                required
                value={formData.systemId}
                onChange={e => setFormData({...formData, systemId: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-black"
              >
                <option value="">اختر النظام...</option>
                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الاشتراك والسعر</label>
              <select 
                value={formData.subscriptionType}
                onChange={e => setFormData({...formData, subscriptionType: e.target.value as SubscriptionType})}
                disabled={!formData.systemId}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-black disabled:opacity-50"
              >
                <option value={SubscriptionType.STANDARD}>
                  عادي (Standard) {selectedSystem ? `- ${formatPrice(selectedSystem.prices[SubscriptionType.STANDARD])} د.ع` : ''}
                </option>
                <option value={SubscriptionType.PLUS}>
                  بلس (Plus) {selectedSystem ? `- ${formatPrice(selectedSystem.prices[SubscriptionType.PLUS])} د.ع` : ''}
                </option>
                <option value={SubscriptionType.PREMIUM}>
                  بريميوم (Premium) {selectedSystem ? `- ${formatPrice(selectedSystem.prices[SubscriptionType.PREMIUM])} د.ع` : ''}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">الموقع الجغرافي</label>
              <input 
                required
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-black"
                placeholder="المدينة - الحي"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">رقم هاتف المسؤول</label>
              <input 
                required
                type="tel" 
                value={formData.contactPhone}
                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-black"
                placeholder="07XXXXXXXX"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">اسم الشخص المسؤول</label>
              <input 
                required
                type="text" 
                value={formData.contactName}
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-black"
                placeholder="الاسم الثلاثي للمدير أو المحاسب"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات إضافية (اختياري)</label>
              <textarea 
                rows={3}
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-black"
                placeholder="اكتب أي تفاصيل مهمة عن الطلب هنا..."
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
          >
            إرسال الطلب الآن
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendRequest;
