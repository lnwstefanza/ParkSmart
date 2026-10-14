import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Car, QrCode, Building2, TrendingUp, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { User } from '../../types';
import { formatBaht } from '../../lib/utils';
import { formatThaiDateTime } from '../../lib/thai-time';

interface OwnerDashboardProps {
  user: User | null;
}

export function OwnerDashboard({ user }: OwnerDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/owner/dashboard', {
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
  }, [user]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const occupancyRate = data.totalSlots > 0 ? Math.round(((data.occupiedSlots || 0) / data.totalSlots) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
            Owner Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
            ภาพรวมลานจอดรถของคุณ ({user?.fname} {user?.lname})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบความหนาแน่นของช่องจอด รายได้สะสม และรายการรถที่กำลังเข้าใช้บริการ
          </p>
        </div>

        <Link
          to="/owner/scanner"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>เปิดเครื่องมือสแกนเนอร์ QR</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>ลานจอดในการดูแล</span>
            <Building2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {data.totalLots} <span className="text-xs font-normal text-slate-500">แห่ง</span>
          </div>
          {data.pendingLotsCount > 0 && (
            <div className="text-[11px] text-amber-600 font-medium">
              รอการอนุมัติ {data.pendingLotsCount} แห่ง
            </div>
          )}
          {data.rejectedLotsCount > 0 && (
            <div className="text-[11px] text-rose-500 font-medium">
              ไม่อนุมัติ {data.rejectedLotsCount} แห่ง
            </div>
          )}
          {(!data.pendingLotsCount || data.pendingLotsCount === 0) && (!data.rejectedLotsCount || data.rejectedLotsCount === 0) && (
            <div className="text-[11px] text-slate-400">
              {data.totalLots > 0 ? 'อนุมัติเปิดให้บริการแล้ว' : 'ยังไม่มีลานจอดที่อนุมัติ'}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>อัตราครองช่องจอด (Occupancy)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {occupancyRate}%
          </div>
          <div className="text-[11px] text-slate-400">
            มีรถจอด {data.occupiedSlots || 0} จากทั้งหมด {data.totalSlots || 0} ช่อง
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>ช่องจอดว่างพร้อมรับรถ</span>
            <Car className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {data.availableSlots || 0} <span className="text-xs font-normal text-slate-500">ช่อง</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ติดจอง {data.reservedSlots || 0} ช่อง
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>รายได้สะสมทั้งหมด</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {formatBaht(data.todayRevenue || 0)}
          </div>
          <div className="text-[11px] text-slate-400">
            รวมค่ามัดจำและส่วนต่าง
          </div>
        </div>
      </div>

      {/* Quick Links & Managed Lots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">ลานจอดรถของคุณ</h2>
            <Link to="/owner/lots" className="text-xs font-bold text-sky-600 hover:underline">
              จัดการทั้งหมด
            </Link>
          </div>

          <div className="space-y-3">
            {!data.lots || data.lots.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">คุณยังไม่มีลานจอดรถในการดูแล</p>
                <p className="text-[11px] text-slate-400 mt-0.5">เริ่มลงทะเบียนลานจอดรถแห่งแรกของคุณเพื่อเปิดรับการจอง</p>
                <Link
                  to="/owner/lots"
                  className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-sm"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  เพิ่มลานจอดรถของคุณ
                </Link>
              </div>
            ) : (
              data.lots.map((lot: any) => (
                <div key={lot.Lot_ID} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900">{lot.LotName}</h3>
                      {lot.ParkingLot_Status === 'Pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          รอการอนุมัติ
                        </span>
                      )}
                      {lot.ParkingLot_Status === 'Rejected' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          ไม่อนุมัติ
                        </span>
                      )}
                      {lot.ParkingLot_Status === 'Active' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          เปิดให้บริการ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{lot.Location}</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      ฿{lot.FeeRate_Per_Hour}/ชม. • ไม่มีจอดฟรี • ปรับ 2 เท่า หากเกินเวลา
                    </p>
                  </div>
                  <Link
                    to={`/lots/${lot.Lot_ID}`}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-sky-50 text-sky-700"
                  >
                    ดูแผนผัง
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">รายการรถล่าสุดในลาน</h2>
            <Link to="/owner/scanner" className="text-xs font-bold text-sky-600 hover:underline">
              ไปสแกนเช็คอิน/เอาท์
            </Link>
          </div>

          {data.recentBookings?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีประวัติการจอง</p>
          ) : (
            <div className="space-y-2">
              {data.recentBookings?.slice(0, 5).map((b: any) => (
                <div key={b.Booking_ID} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{b.LicensePlate}</span>
                    <span className="text-slate-400 ml-2">ช่อง {b.SpaceCode} ({b.LotName})</span>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                      {b.Reservation_Status}
                    </span>
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
