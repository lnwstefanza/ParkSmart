import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { 
  ArrowLeft, 
  QrCode, 
  Clock, 
  Car, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2,
  Copy, 
  Check, 
  CreditCard, 
  Sparkles,
  Zap,
  X,
  Trash2
} from 'lucide-react';
import { ReservationItem, User } from '../types';
import { formatThaiDateTime, getOvertimeSummary, parseDateSafe } from '../lib/thai-time';

interface TicketDetailProps {
  user: User | null;
}

export function TicketDetail({ user }: TicketDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<ReservationItem | null>(null);
  const [generatedQr, setGeneratedQr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [simulateError, setSimulateError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type?: 'warning' | 'error' | 'success' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const fetchTicket = () => {
    const token = localStorage.getItem('token');
    fetch(`/api/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTicket(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTicket();
    // Poll ticket status every 3 seconds
    const interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [id]);

  // Generate live scannable QR Code on-the-fly
  useEffect(() => {
    if (ticket) {
      if (ticket.qrDataUrl) {
        setGeneratedQr(ticket.qrDataUrl);
      } else {
        const qrContent = ticket.QRToken || `PARK-RESERVATION-${ticket.Booking_ID || id}`;
        QRCode.toDataURL(qrContent, {
          width: 300,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        }).then(url => {
          setGeneratedQr(url);
        }).catch(err => {
          console.error('Failed to generate QR Code:', err);
        });
      }
    }
  }, [ticket?.QRToken, ticket?.qrDataUrl, id]);

  // Live timer when Checked_In
  useEffect(() => {
    if (ticket?.Reservation_Status === 'Checked_In' && ticket.Actual_Check_In) {
      const inDate = parseDateSafe(ticket.Actual_Check_In);
      const inTime = inDate ? inDate.getTime() : Date.now();
      const updateTimer = () => {
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((now - inTime) / 1000));
        setElapsedSeconds(isNaN(diffSec) ? 0 : diffSec);
      };
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [ticket?.Reservation_Status, ticket?.Actual_Check_In]);

  const copyToken = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.QRToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenCancelModal = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    setIsCanceling(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/reservations/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setIsCanceling(false);
      setShowCancelModal(false);

      if (res.ok) {
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'ยกเลิกการจองสำเร็จ',
          message: data.message || 'ระบบได้ทำการยกเลิกการจองและคืนสถานะช่องจอดให้ว่างเรียบร้อยแล้ว'
        });
        fetchTicket();
      } else {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'ไม่สามารถยกเลิกได้',
          message: data.error || 'เกิดข้อผิดพลาดในการยกเลิก'
        });
      }
    } catch (err: any) {
      console.error(err);
      setIsCanceling(false);
      setShowCancelModal(false);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      });
    }
  };

  // Quick Simulator Actions for Demo
  const handleSimulateCheckIn = async () => {
    setSimulateError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/scan/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qrToken: ticket?.QRToken })
      });
      const data = await res.json();
      if (res.ok) {
        setSimulateError('');
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'เช็คอินสำเร็จ',
          message: data.message || 'บันทึกเวลาเข้าจอดเรียบร้อยแล้ว'
        });
        fetchTicket();
      } else {
        setSimulateError(data.error);
        setAlertModal({
          isOpen: true,
          type: 'warning',
          title: 'ไม่สามารถเข้าจอดได้',
          message: data.error
        });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setSimulateError(errMsg);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: errMsg
      });
    }
  };

  const handleSimulateCheckOut = async () => {
    setSimulateError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/scan/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qrToken: ticket?.QRToken })
      });
      const data = await res.json();
      if (res.ok) {
        setSimulateError('');
        if (data.status === 'Awaiting_Final_Payment') {
          navigate(`/payment/${id}`);
        } else {
          setAlertModal({
            isOpen: true,
            type: 'success',
            title: 'เช็คเอาท์สำเร็จ',
            message: data.message || 'บันทึกเวลาออกและคิดค่าบริการเรียบร้อยแล้ว'
          });
          fetchTicket();
        }
      } else {
        setSimulateError(data.error);
        setAlertModal({
          isOpen: true,
          type: 'warning',
          title: 'ไม่สามารถเช็คเอาท์ได้',
          message: data.error
        });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setSimulateError(errMsg);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: errMsg
      });
    }
  };

  if (loading || !ticket) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Parking countdown calculations: Count down from booked hours (e.g. booked 2 hours, count down 2 hours)
  const bookedHours = Number(ticket.Booked_Hours) || 1;
  const totalBookedSec = Math.round(bookedHours * 3600);
  const checkInDate = parseDateSafe(ticket.Actual_Check_In);
  const calculatedEnd = checkInDate 
    ? new Date(checkInDate.getTime() + totalBookedSec * 1000) 
    : parseDateSafe(ticket.Booked_End);

  let remainingSec = 0;
  let isOvertime = false;
  let overtimeSec = 0;

  if (ticket.Reservation_Status === 'Checked_In') {
    if (elapsedSeconds >= totalBookedSec) {
      isOvertime = true;
      overtimeSec = elapsedSeconds - totalBookedSec;
      remainingSec = 0;
    } else {
      isOvertime = false;
      remainingSec = Math.max(0, totalBookedSec - elapsedSeconds);
      overtimeSec = 0;
    }
  } else {
    remainingSec = totalBookedSec;
    isOvertime = false;
    overtimeSec = 0;
  }

  const otSummary = getOvertimeSummary(calculatedEnd?.toISOString() || ticket.Booked_End, ticket.Actual_Check_Out);

  const isEarly = ticket.Reservation_Status === 'Confirmed' && ticket.Expected_Arrival ? (
    Date.now() < (parseDateSafe(ticket.Expected_Arrival)?.getTime() || 0)
  ) : false;

  const formatTimer = (totalSec: number) => {
    if (isNaN(totalSec) || totalSec < 0) return '00 : 00 : 00';
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h} : ${m} : ${s}`;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <Link to="/my/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-sky-600">
        <ArrowLeft className="w-4 h-4" />
        กลับรายการการจองของฉัน
      </Link>

      {/* E-Ticket Boarding Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 p-6 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> E-Ticket QR Code
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.LotName}</h1>
          <p className="text-xs text-sky-100 mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {ticket.Location}
          </p>

          <div className="mt-4 inline-block bg-white text-sky-700 px-4 py-1.5 rounded-xl font-extrabold text-sm shadow-md">
            ช่องจอด {ticket.SpaceCode} (ชั้น {ticket.Floor})
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 text-center space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
            {(generatedQr || ticket.qrDataUrl) ? (
              <img
                src={generatedQr || ticket.qrDataUrl}
                alt="Parking E-Ticket QR Code"
                className="w-56 h-56 mx-auto rounded-xl shadow-sm border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-56 h-56 bg-slate-100 flex items-center justify-center rounded-xl animate-pulse">
                <QrCode className="w-20 h-20 text-slate-400" />
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 tracking-wider">
                {ticket.QRToken}
              </span>
              <button
                onClick={copyToken}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                title="คัดลอกรหัส"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5">
            <span className="text-amber-600 font-extrabold text-sm">⚠️</span>
            <span>หากจอดเกินเวลาจองจะปรับเงิน 2 เท่า ของอัตราค่าจอดปกติ</span>
          </div>

          {/* Status Display */}
          <div>
            {ticket.Reservation_Status === 'Pending_Payment' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
                ⚠️ อยู่ระหว่างรอชำระค่าบริการ (ช่องจอดถูกล็อกชั่วคราว)
              </div>
            )}
            {ticket.Reservation_Status === 'Confirmed' && (
              <div className="space-y-2">
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs space-y-1">
                  <div className="font-bold text-sky-800 flex items-center justify-center gap-1">
                    <span>✅ ยืนยันการจองแล้ว ได้รับ QR Code เรียบร้อย</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    แสดง QR Code นี้ให้เจ้าของลานสแกนเมื่อเดินทางมาถึง (โปรดเข้าจอดตามเวลาที่จอง)
                  </p>
                </div>

                {isEarly && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1 text-center">
                    <div className="font-bold text-amber-800 flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>ยังไม่ถึงเวลาเข้าจอด</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      เวลาที่คุณจองเข้าจอดคือ <strong className="font-bold text-slate-900">{formatThaiDateTime(ticket.Expected_Arrival)}</strong>
                    </p>
                    <p className="text-[10px] text-amber-600">
                      * ระบบไม่อนุญาตให้เช็คอินก่อนเวลาที่จองไว้
                    </p>
                  </div>
                )}
              </div>
            )}
            {ticket.Reservation_Status === 'Checked_In' && (
              <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${
                isOvertime 
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950' 
                  : remainingSec <= 600 
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              }`}>
                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 text-xs font-bold">
                  {isOvertime ? (
                    <div className="flex items-center gap-1.5 text-rose-700 font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>🚨 หมดเวลาการจอดที่จองไว้แล้ว</span>
                    </div>
                  ) : remainingSec <= 600 ? (
                    <div className="flex items-center gap-1.5 text-amber-700 font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span>⏳ ใกล้หมดเวลาการจอด (เหลือไม่ถึง 10 นาที)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>⏳ เวลาที่เหลือในการจอด (นับถอยหลัง)</span>
                    </div>
                  )}
                </div>

                {/* Big Countdown Timer Display */}
                <div className="space-y-1">
                  <div className={`text-4xl font-mono font-black tracking-wider ${
                    isOvertime 
                      ? 'text-rose-600 animate-pulse' 
                      : remainingSec <= 600 
                      ? 'text-amber-600' 
                      : 'text-emerald-700'
                  }`}>
                    {formatTimer(remainingSec)}
                  </div>
                  {isOvertime && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-200/90 text-rose-900 text-xs font-extrabold">
                      เกินเวลาแล้ว +{formatTimer(overtimeSec)}
                    </div>
                  )}
                </div>

                {/* Overtime Notice */}
                {isOvertime && (
                  <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold text-center leading-relaxed">
                    ⚠️ เกินเวลาการจอดที่จองไว้แล้ว! ระบบคำนวณค่าปรับเกินเวลา 2 เท่า ของอัตราปกติ (ชำระตอนสแกนออก)
                  </div>
                )}

                {/* Booking Time Details */}
                <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200/80 space-y-1 text-center">
                  <div>
                    ระยะเวลาที่จอง: <strong className="text-slate-800 font-bold">{ticket.Booked_Hours || 1} ชั่วโมง</strong>
                    {ticket.Actual_Check_In && (
                      <span className="text-slate-500 ml-1.5">
                        (สแกนเข้า: {formatThaiDateTime(ticket.Actual_Check_In)})
                      </span>
                    )}
                  </div>
                  {(calculatedEnd || ticket.Booked_End) && (
                    <div>
                      เวลาสิ้นสุดที่จองไว้: <strong className="text-slate-800 font-bold">{formatThaiDateTime(calculatedEnd || ticket.Booked_End)}</strong>
                    </div>
                  )}
                </div>

                {ticket.Late_Penalty && ticket.Late_Penalty > 0 ? (
                  <div className="p-2 bg-amber-100 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-semibold text-center">
                    มาสายกว่าเวลาจอง: มีค่าปรับความล่าช้า ฿{ticket.Late_Penalty} (จะคิดเงินตอนออก)
                  </div>
                ) : null}
              </div>
            )}
            {ticket.Reservation_Status === 'Awaiting_Final_Payment' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-900 space-y-3">
                <div className="text-xs font-bold text-orange-800">
                  🔔 สแกนออกแล้ว: มียอดค่าปรับที่ต้องชำระเพิ่ม
                </div>

                {/* Overtime Sentence Alert */}
                {otSummary && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 text-left space-y-1">
                    <div className="font-black text-rose-800 flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>สรุปการจอดเกินเวลา:</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed text-rose-900">
                      {otSummary.sentence}
                    </p>
                    <div className="text-[11px] text-rose-700">
                      คิดค่าปรับจอดเกินเวลา 2 เท่า ของอัตราปกติ: ฿{(ticket.FeeRate_Per_Hour || 20) * 2}/ชั่วโมง
                    </div>
                  </div>
                )}

                <div className="bg-white/80 p-3 rounded-xl border border-orange-200 space-y-1 text-xs text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ค่าจอดล่วงหน้าที่ชำระแล้ว:</span>
                    <span className="font-semibold text-emerald-600">฿{ticket.Base_Fee || ticket.Deposit_Amount} (ชำระแล้ว)</span>
                  </div>
                  {(ticket.Late_Penalty || 0) > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>ค่าปรับมาเช็คอินสาย:</span>
                      <span className="font-bold">+ ฿{ticket.Late_Penalty}</span>
                    </div>
                  )}
                  {(ticket.Overtime_Penalty || 0) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ค่าปรับจอดเกินเวลา (2 เท่า):</span>
                      <span className="font-bold">+ ฿{ticket.Overtime_Penalty}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-orange-200 flex justify-between font-bold text-sm">
                    <span className="text-slate-800">ยอดเงินที่ต้องชำระเพิ่ม:</span>
                    <span className="text-rose-600 font-extrabold text-base">
                      ฿{(ticket.Late_Penalty || 0) + (ticket.Overtime_Penalty || 0)}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/payment/${ticket.Booking_ID}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <CreditCard className="w-4 h-4" /> ชำระค่าปรับส่วนเกินผ่าน PromptPay
                </Link>
              </div>
            )}
            {ticket.Reservation_Status === 'Completed' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs space-y-2.5">
                <div className="font-bold text-emerald-700 flex items-center justify-center gap-1.5 text-sm">
                  <span>🎉 การใช้บริการเสร็จสมบูรณ์เรียบร้อย ขอบคุณที่ใช้บริการ ParkSmart</span>
                </div>
                {otSummary && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-left space-y-0.5">
                    <div className="font-extrabold text-[11px] text-rose-800">บันทึกการจอดเกินเวลา:</div>
                    <div className="font-semibold text-xs leading-relaxed">{otSummary.sentence}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ticket Information Table */}
          <div className="border-t border-dashed border-slate-200 pt-4 space-y-2.5 text-xs text-left">
            <div className="flex justify-between text-slate-600">
              <span>หมายเลขทะเบียน:</span>
              <span className="font-bold text-slate-900">{ticket.LicensePlate}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>เวลาที่จองเข้าจอด:</span>
              <span className="font-semibold text-slate-800">{formatThaiDateTime(ticket.Expected_Arrival)}</span>
            </div>
            {ticket.Booked_End && (
              <div className="flex justify-between text-slate-600">
                <span>เวลาสิ้นสุดที่จองไว้:</span>
                <span className="font-semibold text-slate-800">{formatThaiDateTime(ticket.Booked_End)}</span>
              </div>
            )}
            {ticket.Booked_Hours && (
              <div className="flex justify-between text-slate-600">
                <span>ระยะเวลาที่จอง:</span>
                <span className="font-semibold text-slate-800">{ticket.Booked_Hours} ชั่วโมง</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>ค่าจอดที่ชำระล่วงหน้า:</span>
              <span className="font-semibold text-emerald-600">฿{ticket.Base_Fee || ticket.Deposit_Amount}</span>
            </div>
            {ticket.Actual_Check_In && (
              <div className="flex justify-between text-slate-600">
                <span>เวลาสแกนเข้าจริง:</span>
                <span className="font-semibold text-slate-800">{formatThaiDateTime(ticket.Actual_Check_In)}</span>
              </div>
            )}
            {ticket.Actual_Check_Out && (
              <div className="flex justify-between text-slate-600">
                <span>เวลาสแกนออกจริง:</span>
                <span className="font-semibold text-slate-800">{formatThaiDateTime(ticket.Actual_Check_Out)}</span>
              </div>
            )}
            {otSummary && (
              <div className="flex justify-between text-rose-800 font-bold bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                <span>ระยะเวลาที่จอดเกิน:</span>
                <span>{otSummary.durationText}</span>
              </div>
            )}
            {(ticket.Overtime_Penalty || 0) > 0 && (
              <div className="flex justify-between text-rose-700 font-semibold">
                <span>ค่าปรับจอดเกินเวลา (2 เท่า):</span>
                <span>+ ฿{ticket.Overtime_Penalty}</span>
              </div>
            )}
            {(ticket.Late_Penalty || 0) > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>ค่าปรับมาเช็คอินสาย:</span>
                <span>+ ฿{ticket.Late_Penalty}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            {ticket.Reservation_Status === 'Pending_Payment' && (
              <Link
                to={`/payment/${ticket.Booking_ID}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-3 bg-sky-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-sky-700"
              >
                ไปชำระเงินมัดจำ (฿{ticket.Deposit_Amount})
              </Link>
            )}

            {['Pending_Payment', 'Confirmed'].includes(ticket.Reservation_Status) && (
              <button
                onClick={handleOpenCancelModal}
                className="w-full py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors border border-rose-200 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยกเลิกการจองนี้</span>
              </button>
            )}

            {/* Quick Demo Simulator Box */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                โหมดทดสอบ / เดโม (Quick Action Simulator)
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                สามารถกดจำลองการสแกนผ่านปุ่มนี้ได้ทันที หรือเปิดหน้า <code>/owner/scanner</code> ด้วยบัญชีเจ้าของลาน
              </p>

              {simulateError && (
                <div className="p-3 mb-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <div className="font-bold text-rose-900">แจ้งเตือน:</div>
                    <div>{simulateError}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {ticket.Reservation_Status === 'Confirmed' && (
                  <div className="flex-1 space-y-1">
                    <button
                      onClick={handleSimulateCheckIn}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      จำลอง: สแกนเช็คอิน
                    </button>
                    {isEarly && (
                      <p className="text-[10px] text-amber-700 text-center font-medium">
                        * ยังไม่ถึงเวลาจอง หากกดจะแจ้งเตือนว่าไม่สามารถเข้าจอดได้
                      </p>
                    )}
                  </div>
                )}
                {ticket.Reservation_Status === 'Checked_In' && (
                  <button
                    onClick={handleSimulateCheckOut}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    จำลอง: สแกนเช็คเอาท์
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Modal ยืนยันการยกเลิกการจอง (Confirm Cancellation Modal) */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isCanceling && setShowCancelModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              disabled={isCanceling}
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Icon */}
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Title & Question */}
            <h3 className="text-xl font-black text-slate-900 mb-1.5">
              ยืนยันการยกเลิกการจอง?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              คุณต้องการยกเลิกการจองช่องจอดนี้ใช่หรือไม่
            </p>

            {/* Booking Summary Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">ลานจอดรถ:</span>
                <span className="font-bold text-slate-900">{ticket.LotName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ช่องจอด:</span>
                <span className="font-bold text-sky-700">ช่อง {ticket.SpaceCode} (ชั้น {ticket.Floor})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">หมายเลขทะเบียน:</span>
                <span className="font-bold text-slate-900">{ticket.LicensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เวลาที่จองเข้าจอด:</span>
                <span className="font-bold text-slate-800">{formatThaiDateTime(ticket.Expected_Arrival)}</span>
              </div>
              {ticket.Deposit_Amount && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">ค่าบริการที่ชำระ:</span>
                  <span className="font-bold text-emerald-600">฿{ticket.Base_Fee || ticket.Deposit_Amount}</span>
                </div>
              )}
            </div>

            {/* Warning Alert */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium text-left flex items-start gap-2 mb-6">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>เมื่อยกเลิกแล้ว ระบบจะปล่อยช่องจอดนี้ให้ว่างทันที และไม่สามารถกู้คืนการจองเดิมได้</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                disabled={isCanceling}
                onClick={handleConfirmCancel}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isCanceling ? (
                  <span>กำลังดำเนินการยกเลิก...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ยืนยันยกเลิกการจอง</span>
                  </>
                )}
              </button>
              <button
                disabled={isCanceling}
                onClick={() => setShowCancelModal(false)}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm disabled:opacity-50"
              >
                ไม่ยกเลิก / ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal แจ้งเตือนข้อความ (Message / Alert Modal Popup) */}
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

            {/* Icon Header */}
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
