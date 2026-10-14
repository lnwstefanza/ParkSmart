import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Building2, Car, DollarSign, MessageSquareWarning, FileText, Database } from 'lucide-react';
import { formatBaht } from '../../lib/utils';
import { formatThaiDateTime } from '../../lib/thai-time';

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg">
          Administrator Control Center
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-purple-600" />
          แดชบอร์ดผู้ดูแลระบบ ParkSmart
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ควบคุมและตรวจสอบภาพรวมระบบจองที่จอดรถขอนแก่น การเงิน และความปลอดภัย
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>สมาชิกทั้งหมด</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {(data.customerCount || 0) + (data.ownerCount || 0)} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ลูกค้า {data.customerCount || 0} • เจ้าของลาน {data.ownerCount || 0}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>ลานและช่องจอดรวม</span>
            <Building2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {data.lotCount || 0} <span className="text-xs font-normal text-slate-500">ลาน</span>
          </div>
          <div className="text-[11px] text-slate-400">
            จำนวน {data.slotCount || 0} ช่องจอดทั้งหมด
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>ยอดธุรกรรมการจอง</span>
            <Car className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {data.bookingCount || 0} <span className="text-xs font-normal text-slate-500">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-400">
            คำร้องเรียนค้างตอบ {data.complaintPending || 0} เรื่อง
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>รายได้รวมทั้งระบบ</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {formatBaht(data.totalRevenue || 0)}
          </div>
          <div className="text-[11px] text-slate-400">
            ชำระผ่าน PromptPay QR
          </div>
        </div>
      </div>

      {/* Admin Quick Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          to="/admin/database"
          className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50/60 rounded-2xl border-2 border-purple-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
              <span>Database Inspector</span>
              <span className="text-[9px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">แนะนำ</span>
            </h3>
            <p className="text-[11px] text-purple-700/80">ตรวจระเบียน & Attributes</p>
          </div>
        </Link>

        <Link
          to="/admin/lots"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">ตรวจสอบลานจอด</h3>
            <p className="text-[11px] text-slate-500">อนุมัติ / ตั้งค่าลานแนะนำ</p>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">จัดการบัญชีสมาชิก</h3>
            <p className="text-[11px] text-slate-500">ดูสิทธิ์และสถานะบัญชี</p>
          </div>
        </Link>

        <Link
          to="/admin/complaints"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">เรื่องร้องเรียน</h3>
            <p className="text-[11px] text-slate-500">{data.complaintPending || 0} เรื่องรอดำเนินการ</p>
          </div>
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">รายงานรายได้</h3>
            <p className="text-[11px] text-slate-500">สรุปแยกตามลานจอด</p>
          </div>
        </Link>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>บันทึกความปลอดภัยและกิจกรรม (Audit Logs)</span>
          </h2>
          <span className="text-xs text-slate-400">15 รายการล่าสุด</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">เวลา</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">ผู้กระทำ</th>
                <th className="py-3 px-4">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentLogs?.map((log: any) => (
                <tr key={log.Audit_ID} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {formatThaiDateTime(log.Created_At)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {log.Action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-semibold whitespace-nowrap">
                    {log.Username} ({log.User_Type})
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                    {log.Details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
