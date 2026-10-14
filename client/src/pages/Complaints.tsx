import { useState, useEffect } from 'react';
import { MessageSquareWarning, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ComplaintItem, User } from '../types';
import { formatThaiDateTime } from '../lib/thai-time';

interface ComplaintsProps {
  user: User | null;
}

export function Complaints({ user }: ComplaintsProps) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const fetchComplaints = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    setMsg('');

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setMsg('ส่งเรื่องร้องเรียนเรียบร้อยแล้ว เจ้าหน้าที่จะตรวจสอบและตอบกลับ');
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareWarning className="w-7 h-7 text-sky-600" />
          ระบบแจ้งข้อร้องเรียนและข้อเสนอแนะ
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          หากพบปัญหาการใช้บริการ อุปกรณ์ขัดข้อง หรือต้องการเสนอแนะการปรับปรุง สามารถแจ้งทีมงานได้ทันที
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form */}
        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900">ส่งเรื่องร้องเรียนใหม่</h2>

          {msg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">หัวข้อเรื่องร้องเรียน</label>
              <input
                type="text"
                required
                placeholder="เช่น ไม้กั้นไม่เปิด, มีรถจอดขวางช่อง..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดปัญหา</label>
              <textarea
                required
                rows={4}
                placeholder="ระบุรายละเอียด เช่น วันที่ เวลา ลานจอด หรือหมายเลขช่องจอด..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'กำลังส่งข้อมูล...' : 'ส่งเรื่องร้องเรียน'}</span>
            </button>
          </form>
        </div>

        {/* Complaints history */}
        <div className="md:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-slate-900">ประวัติเรื่องร้องเรียนของคุณ</h2>

          {loading ? (
            <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              ไม่พบประวัติเรื่องร้องเรียน
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map(c => (
                <div key={c.Complaint_ID} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{c.Title}</h3>
                    {c.Complaint_Status === 'Pending' && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                        รอดำเนินการ
                      </span>
                    )}
                    {c.Complaint_Status === 'Resolved' && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        แก้ไขแล้ว
                      </span>
                    )}
                    {c.Complaint_Status === 'Rejected' && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                        ปฏิเสธ
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {c.Description}
                  </p>

                  {c.Admin_Response && (
                    <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-xs space-y-1">
                      <strong className="text-sky-800 block text-[11px]">การตอบกลับจากผู้ดูแลระบบ:</strong>
                      <p className="text-slate-700">{c.Admin_Response}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3" />
                    ส่งเมื่อ: {formatThaiDateTime(c.Complaint_Date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
