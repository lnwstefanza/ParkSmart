import { useState, useEffect } from 'react';
import { MessageSquareWarning, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ComplaintItem } from '../../types';
import { formatThaiDateTime } from '../../lib/thai-time';

export function AdminComplaints() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [statusToSet, setStatusToSet] = useState<'Resolved' | 'Rejected'>('Resolved');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = () => {
    const token = localStorage.getItem('token');
    fetch('/api/complaints', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setComplaints(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const token = localStorage.getItem('token');
    await fetch(`/api/complaints/${selectedComplaint.Complaint_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: statusToSet,
        adminResponse: adminReply
      })
    });

    setSelectedComplaint(null);
    setAdminReply('');
    fetchComplaints();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          จัดการและตอบกลับข้อร้องเรียน (Complaints)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ตรวจสอบปัญหาที่ผู้ใช้แจ้งเข้ามาและตอบกลับเพื่อปรับปรุงคุณภาพบริการ
        </p>
      </div>

      {loading ? (
        <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
          ไม่มีข้อร้องเรียนในระบบ
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => {
            const compTitle = c.Title || (c as any).title || 'เรื่องร้องเรียน';
            const compDesc = c.Description || (c as any).description || 'ไม่มีรายละเอียดเพิ่มเติม';
            const compUser = c.CustomerUsername || (c as any).customerUsername || 'ลูกค้า';
            const compReply = c.Admin_Response || (c as any).adminResponse || (c as any).Resolution_Notes;

            return (
              <div key={c.Complaint_ID} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{compTitle}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>ผู้ร้องเรียน: <strong>{compUser}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatThaiDateTime(c.Complaint_Date)}
                      </span>
                    </div>
                  </div>

                  <div>
                    {c.Complaint_Status === 'Pending' && (
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-lg">
                        รอดำเนินการ
                      </span>
                    )}
                    {c.Complaint_Status === 'Resolved' && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg">
                        แก้ไขแล้ว
                      </span>
                    )}
                    {c.Complaint_Status === 'Rejected' && (
                      <span className="text-xs font-bold bg-rose-100 text-rose-800 px-3 py-1 rounded-lg">
                        ปฏิเสธ
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {compDesc}
                </div>

                {compReply ? (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-950 space-y-1">
                    <strong className="block text-[11px] text-sky-800">คำตอบกลับของคุณ:</strong>
                    <p>{compReply}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setAdminReply('');
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    ตอบกลับและปรับสถานะ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900">
              ตอบกลับข้อร้องเรียน: {selectedComplaint.Title}
            </h2>

            <form onSubmit={handleResolve} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ปรับสถานะเป็น</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusToSet('Resolved')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      statusToSet === 'Resolved'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    แก้ไขแล้ว (Resolved)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusToSet('Rejected')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      statusToSet === 'Rejected'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    ปฏิเสธ (Rejected)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ข้อความตอบกลับลูกค้า</label>
                <textarea
                  required
                  rows={4}
                  placeholder="พิมพ์ข้อความชี้แจงการแก้ไขปัญหา..."
                  value={adminReply}
                  onChange={e => setAdminReply(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md"
                >
                  ส่งคำตอบและบันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
