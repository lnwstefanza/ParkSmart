import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Clock, MapPin, ChevronRight, AlertCircle, ArrowUpRight, Car } from 'lucide-react';
import { ReservationItem, User } from '../types';
import { formatThaiDateTime } from '../lib/thai-time';

interface MyBookingsProps {
  user: User | null;
}

export function MyBookings({ user }: MyBookingsProps) {
  const [bookings, setBookings] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = () => {
    const token = localStorage.getItem('token');
    fetch('/api/reservations/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending_Payment':
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold">รอชำระมัดจำ</span>;
      case 'Confirmed':
        return <span className="bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg text-xs font-bold">ยืนยันแล้ว (รอเช็คอิน)</span>;
      case 'Checked_In':
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">กำลังจอดอยู่ (Live)</span>;
      case 'Awaiting_Final_Payment':
        return <span className="bg-orange-100 text-orange-800 px-2.5 py-1 rounded-lg text-xs font-bold">รอชำระส่วนต่าง</span>;
      case 'Completed':
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">เสร็จสิ้น</span>;
      case 'Cancelled':
        return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-bold">ยกเลิกแล้ว</span>;
      case 'Expired':
        return <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-bold">หมดเวลา</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            ประวัติและตั๋วการจองของฉัน
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            คลิกดูตั๋ว E-Ticket แสดง QR Code สำหรับสแกนเข้า-ออก หรือดูตัวนับเวลาจอดจริง
          </p>
        </div>
        <Link
          to="/lots"
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-colors shadow-sm"
        >
          + จองที่จอดใหม่
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">ยังไม่มีรายการจองที่จอดรถ</p>
          <Link
            to="/lots"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            <span>ค้นหาและจองลานจอดรถ</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div
              key={b.Booking_ID}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-sky-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-slate-900">{b.LotName}</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-xs border border-sky-100">
                    ช่อง {b.SpaceCode}
                  </span>
                  {getStatusBadge(b.Reservation_Status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    ทะเบียน: <strong className="text-slate-700">{b.LicensePlate}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    เวลามาถึง: {formatThaiDateTime(b.Expected_Arrival)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {b.Reservation_Status === 'Pending_Payment' && (
                  <Link
                    to={`/payment/${b.Booking_ID}`}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    ชำระมัดจำ
                  </Link>
                )}

                <Link
                  to={`/my/bookings/${b.Booking_ID}`}
                  className="px-4 py-2 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span>เปิด E-Ticket QR</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
