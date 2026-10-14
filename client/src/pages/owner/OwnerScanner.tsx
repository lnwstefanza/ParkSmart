import { useState, useEffect } from 'react';
import { QrCode, Scan, CheckCircle2, Clock, DollarSign, Car, AlertCircle, ArrowRight, X } from 'lucide-react';
import { User, ReservationItem } from '../../types';
import { formatThaiDateTime } from '../../lib/thai-time';

interface OwnerScannerProps {
  user: User | null;
}

export function OwnerScanner({ user }: OwnerScannerProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [activeBookings, setActiveBookings] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type?: 'warning' | 'error' | 'success';
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchActiveTickets();
    const interval = setInterval(fetchActiveTickets, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTickets = () => {
    const token = localStorage.getItem('token');
    fetch('/api/owner/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.recentBookings) {
          // Filter Confirmed and Checked_In
          const filtered = data.recentBookings.filter((b: any) =>
            ['Confirmed', 'Checked_In'].includes(b.Reservation_Status)
          );
          setActiveBookings(filtered);
        }
      })
      .catch(err => console.error(err));
  };

  const handleScanAction = async (actionType: 'check-in' | 'check-out', customToken?: string) => {
    const targetToken = customToken || tokenInput.trim();
    if (!targetToken) {
      setError('กรุณากรอกหรือเลือก QR Token เพื่อดำเนินการ');
      return;
    }

    setLoading(true);
    setError('');
    setActionResult(null);

    const token = localStorage.getItem('token');
    try {
      const endpoint = actionType === 'check-in' ? '/api/scan/check-in' : '/api/scan/check-out';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qrToken: targetToken })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'การสแกนไม่สำเร็จ');
      }

      setActionResult({
        type: actionType,
        ...data
      });
      setTokenInput('');
      fetchActiveTickets();
    } catch (err: any) {
      setError(err.message);
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: actionType === 'check-in' ? 'ไม่สามารถเช็คอินได้' : 'ไม่สามารถเช็คเอาท์ได้',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg">
          เครื่องมือสแกนสำหรับเจ้าของลานและพนักงาน
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
          <QrCode className="w-8 h-8 text-sky-600" />
          ระบบสแกน QR Code ตั๋วเข้า-ออกลานจอด (Scanner & Simulator)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          สแกนผ่าน Token ของลูกค้า หรือเลือกตั๋วที่รอการเข้า-ออกจากรายการสดเพื่อดำเนินการทันที
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Scanner Controller */}
        <div className="md:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
            <Scan className="w-12 h-12 text-sky-600 mx-auto animate-pulse" />
            <h3 className="font-bold text-sm text-slate-800">จุดสแกนเนอร์หน้าป้อมทางเข้า/ออก</h3>
            <p className="text-[11px] text-slate-400">
              รองรับทั้งการอ่าน QR Token หรือคลิกเลือกตั๋วจากรายการสดด้านขวา
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                กรอกหรือวาง QR Token ของลูกค้า
              </label>
              <input
                type="text"
                placeholder="เช่น PS-A1B2C3D4..."
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleScanAction('check-in')}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>สแกนเช็คอิน (เข้า)</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleScanAction('check-out')}
                className="py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-sky-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>สแกนเช็คเอาท์ (ออก)</span>
              </button>
            </div>
          </div>

          {/* Action Result Box */}
          {actionResult && (
            <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
              actionResult.type === 'check-in'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{actionResult.message}</span>
              </div>

              {actionResult.actualCheckIn && (
                <div className="flex justify-between">
                  <span>เวลาเข้าจริง:</span>
                  <span className="font-semibold">{formatThaiDateTime(actionResult.actualCheckIn)}</span>
                </div>
              )}

              {actionResult.actualCheckOut && (
                <div className="flex justify-between">
                  <span>เวลาออกจริง:</span>
                  <span className="font-semibold">{formatThaiDateTime(actionResult.actualCheckOut)}</span>
                </div>
              )}

              {actionResult.feeBreakdown && (
                <div className="pt-2 border-t border-sky-200/60 space-y-1 bg-white/60 p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span>ระยะเวลาจอดจริง:</span>
                    <span className="font-semibold">{actionResult.feeBreakdown.parkedMin} นาที</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เวลาที่นำมาคิดเงิน:</span>
                    <span className="font-semibold">{actionResult.feeBreakdown.billableMin} นาที</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ค่าจอดรวม (Total):</span>
                    <span className="font-bold text-slate-800">฿{actionResult.feeBreakdown.totalFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>หักเงินมัดจำ:</span>
                    <span className="font-semibold text-emerald-600">- ฿{actionResult.feeBreakdown.deposit}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
                    <span>ยอดคงเหลือที่ต้องเก็บ:</span>
                    <span className={actionResult.feeBreakdown.balance > 0 ? "text-rose-600" : "text-emerald-600"}>
                      ฿{Math.max(0, actionResult.feeBreakdown.balance)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Tickets Quick Clicker */}
        <div className="md:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-sky-600" />
              รายการรถสดที่พร้อมสแกน (Live Tickets)
            </h2>
            <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
              อัปเดตอัตโนมัติ
            </span>
          </div>
          <p className="text-xs text-slate-400">
            คลิกปุ่มสแกนด่วนบนรายการรถเพื่อทดสอบ Flow เข้า-ออกได้ทันทีโดยไม่ต้องพิมพ์ Token
          </p>

          {activeBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
              ขณะนี้ไม่มีรถที่รอเช็คอินหรือกำลังจอดอยู่
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {activeBookings.map((b: any) => {
                const isEarly = b.Reservation_Status === 'Confirmed' && b.Expected_Arrival ? (
                  Date.now() < new Date(b.Expected_Arrival.replace(' ', 'T') + '+07:00').getTime()
                ) : false;

                return (
                  <div
                    key={b.Booking_ID}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-sky-300 transition-all flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{b.LicensePlate}</span>
                        <span className="text-slate-400 text-[10px] font-mono">ช่อง {b.SpaceCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {b.LotName}
                      </div>
                      <div>
                        {b.Reservation_Status === 'Confirmed' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isEarly ? 'text-amber-800 bg-amber-100' : 'text-sky-700 bg-sky-100'
                            }`}>
                              {isEarly ? 'ยังไม่ถึงเวลาจอง' : 'รอเช็คอินเข้า'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (จองไว้: {formatThaiDateTime(b.Expected_Arrival)})
                            </span>
                          </div>
                        )}
                        {b.Reservation_Status === 'Checked_In' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded animate-pulse">
                            กำลังจอดอยู่ในลาน
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {b.Reservation_Status === 'Confirmed' && (
                        <button
                          onClick={() => handleScanAction('check-in', b.QRToken)}
                          className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all shadow-sm ${
                            isEarly 
                              ? 'bg-amber-600 hover:bg-amber-700' 
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          สแกนเข้า
                        </button>
                      )}
                      {b.Reservation_Status === 'Checked_In' && (
                        <button
                          onClick={() => handleScanAction('check-out', b.QRToken)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          สแกนออก
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Message / Alert Modal Popup */}
      {alertModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            {alertModal.type === 'success' ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : alertModal.type === 'warning' ? (
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Clock className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {alertModal.title}
            </h3>

            {/* Content / Message */}
            <div className={`p-4 rounded-2xl border text-sm font-semibold leading-relaxed mb-6 ${
              alertModal.type === 'success' 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : alertModal.type === 'warning'
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              {alertModal.message}
            </div>

            {/* Confirm / Dismiss Button */}
            <button
              onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-md transition-all text-sm ${
                alertModal.type === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200'
                  : alertModal.type === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-200'
                  : 'bg-sky-600 hover:bg-sky-700 hover:shadow-sky-200'
              }`}
            >
              ตกลง / เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
