import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  MapPin, 
  Building2, 
  Car, 
  Calendar, 
  Download, 
  Check, 
  UploadCloud, 
  FileText, 
  Timer, 
  ChevronLeft, 
  Info, 
  Lock,
  Copy,
  Receipt,
  CreditCard,
  XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReservationItem } from '../types';
import { formatThaiDateTime, getOvertimeSummary } from '../lib/thai-time';
import promptpayQrImg from '../assets/promptpay-qr.jpg';
import { toast } from '../lib/toast';

export function Payment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<ReservationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const calculateRemainingSeconds = (createdAtStr?: string) => {
    if (!createdAtStr) return 600;
    try {
      const createdMs = new Date(createdAtStr.replace(' ', 'T')).getTime();
      if (isNaN(createdMs)) return 600;
      const elapsedSec = Math.floor((Date.now() - createdMs) / 1000);
      return Math.max(0, 600 - elapsedSec);
    } catch {
      return 600;
    }
  };

  const handleAutoCancel = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/reservations/${bookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Auto cancel error:', e);
    }
  };

  const handleCancelAndLeave = async () => {
    if (booking?.Reservation_Status === 'Pending_Payment' && !success) {
      const ok = window.confirm('คุณต้องการยกเลิกคำสั่งจองนี้และย้อนกลับใช่หรือไม่?\n\nระบบจะคืนสถานะช่องจอดให้ว่างสำหรับผู้ใช้อื่นทันที');
      if (!ok) return;
      setCancelling(true);
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/reservations/${id}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setCancelling(false);
      }
    }
    if (booking?.Lot_ID) {
      navigate(`/lots/${booking.Lot_ID}`);
    } else {
      navigate('/lots');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBooking(data);
        setLoading(false);

        if (data.Reservation_Status === 'Cancelled' || data.Reservation_Status === 'Expired') {
          setIsExpired(true);
          setTimeLeft(0);
          return;
        }

        if (data.Reservation_Status === 'Pending_Payment') {
          const remaining = calculateRemainingSeconds(data.Created_At);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            setIsExpired(true);
            handleAutoCancel(data.Booking_ID);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // 10-minute Countdown Timer
  useEffect(() => {
    if (booking?.Reservation_Status !== 'Pending_Payment' || success || isExpired) return;

    if (timeLeft <= 0) {
      setIsExpired(true);
      if (booking?.Booking_ID) {
        handleAutoCancel(booking.Booking_ID);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          if (booking?.Booking_ID) {
            handleAutoCancel(booking.Booking_ID);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, booking?.Reservation_Status, booking?.Booking_ID, success, isExpired]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = promptpayQrImg;
    link.download = `PromptPay-ParkSmart-${booking?.Booking_ID || id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('ดาวน์โหลด QR Code สำหรับโอนเงินแล้ว');
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('คัดลอกรหัสอ้างอิงสำเร็จแล้ว!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSlipImage(reader.result as string);
        toast.success('แนบหลักฐานสลิปโอนเงินเรียบร้อย');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulatePayment = async () => {
    if (!booking) return;
    setPaying(true);

    const token = localStorage.getItem('token');
    const endpoint = booking.Reservation_Status === 'Awaiting_Final_Payment'
      ? `/api/reservations/${id}/pay-final`
      : `/api/reservations/${id}/pay-deposit`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: amountToPay, slip: slipImage ? true : false })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success('ชำระเงินสำเร็จแล้ว! กำลังออก E-Ticket...');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        setTimeout(() => {
          navigate(`/my/bookings/${id}`);
        }, 1800);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setPaying(false);
    }
  };

  if (loading || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลคำสั่งจองที่จอดรถ...</p>
      </div>
    );
  }

  const isFinal = booking.Reservation_Status === 'Awaiting_Final_Payment';
  const penaltyBalance = (booking.Late_Penalty || 0) + (booking.Overtime_Penalty || 0);
  const amountToPay = isFinal
    ? (penaltyBalance > 0 ? penaltyBalance : Math.max(0, (booking.Totalfee || 0) - (booking.Deposit_Amount || 0)))
    : (booking.Deposit_Amount || booking.Base_Fee || 40);

  const feeRate = booking.FeeRate_Per_Hour || 20;
  const bookedHours = booking.Booked_Hours || 2;
  const baseFee = booking.Base_Fee || (bookedHours * feeRate);

  // Compute clean end time if missing
  const calculateEndTime = () => {
    if (booking.Booked_End && booking.Booked_End !== booking.Expected_Arrival) {
      return booking.Booked_End;
    }
    if (booking.Expected_Arrival) {
      try {
        const d = new Date(booking.Expected_Arrival.replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
          return new Date(d.getTime() + bookedHours * 3600 * 1000).toISOString();
        }
      } catch {}
    }
    return booking.Booked_End || booking.Expected_Arrival;
  };
  const safeEndTime = calculateEndTime();

  const otSummary = getOvertimeSummary(booking.Booked_End, booking.Actual_Check_Out);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <button 
          type="button"
          onClick={handleCancelAndLeave}
          disabled={cancelling}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{cancelling ? 'กำลังยกเลิกรายการจอง...' : 'ยกเลิกการจองและย้อนกลับ'}</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 1. เลือกที่จอด
          </span>
          <span className="text-slate-300">/</span>
          <span className="flex items-center gap-1 font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            2. สแกนชำระเงิน
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">3. รับ QR เข้าจอด</span>
        </div>
      </div>

      {/* Main Grid Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Booking Details, Price Breakdown & Terms (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Booking Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    #BK-{booking.Booking_ID}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    {isFinal ? 'รอชำระค่าบริการส่วนเกิน' : 'รอการชำระเงิน'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  {isFinal ? 'ชำระค่าบริการส่วนเกินเพื่อเช็คเอาท์' : 'ยืนยันรายละเอียดการจองที่จอดรถ'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กรุณาตรวจสอบข้อมูลการจองด้านล่างก่อนสแกนชำระเงิน
                </p>
              </div>

              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl hidden sm:block">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            {/* Overtime Breakdown (if Awaiting Final Payment) */}
            {isFinal && (
              <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200 text-xs space-y-3">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-sm border-b border-amber-200 pb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>รายละเอียดค่าปรับส่วนเกินที่ต้องชำระ</span>
                </div>

                {otSummary && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 space-y-1">
                    <div className="font-black text-rose-800 flex items-center gap-1.5 text-xs">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span>สรุปการจอดเกินเวลา:</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed text-rose-900">
                      {otSummary.sentence}
                    </p>
                    <div className="text-[11px] text-rose-700 font-semibold pt-0.5">
                      คิดค่าปรับจอดเกินเวลา 2 เท่า ของอัตราปกติ: ฿{(feeRate) * 2}/ชั่วโมง
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Itemized Reservation Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Location Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="p-2 bg-white text-sky-600 rounded-xl shadow-xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ลานจอดรถ</div>
                  <div className="text-sm font-bold text-slate-800">{booking.LotName || 'ลานจอดรถ ParkSmart'}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{booking.Location || 'ขอนแก่น'} {booking.District ? `(${booking.District})` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Parking Space Code */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="p-2 bg-white text-emerald-600 rounded-xl shadow-xs shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ช่องจอดรถที่จอง</div>
                  <div className="text-sm font-extrabold text-emerald-700">
                    ช่อง {booking.SpaceCode || 'A-01'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ชั้น {booking.Floor || '1'} {booking.Zone ? `• โซน ${booking.Zone}` : ''}
                  </div>
                </div>
              </div>

              {/* License Plate Badge */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="p-2 bg-white text-amber-600 rounded-xl shadow-xs shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">หมายเลขทะเบียนรถ</div>
                  <div className="mt-1 inline-block px-2.5 py-0.5 bg-white border-2 border-slate-800 rounded-md font-mono font-black text-sm text-slate-900 shadow-xs">
                    {booking.LicensePlate || 'กข 1234 ขอนแก่น'}
                  </div>
                </div>
              </div>

              {/* Rate & Fee Info */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="p-2 bg-white text-purple-600 rounded-xl shadow-xs shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">อัตราค่าบริการ</div>
                  <div className="text-sm font-bold text-slate-800">
                    ฿{feeRate} <span className="text-xs font-normal text-slate-500">/ ชั่วโมง</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ระยะเวลาจอง: {bookedHours} ชั่วโมง
                  </div>
                </div>
              </div>
            </div>

            {/* Time Schedule Details */}
            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-2.5">
              <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>กำหนดเวลาการเข้าจอด</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-sky-200/60">
                  <div className="text-slate-400 text-[11px]">เวลาที่เริ่มเข้าจอด:</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {formatThaiDateTime(booking.Expected_Arrival)}
                  </div>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-sky-200/60">
                  <div className="text-slate-400 text-[11px]">เวลาสิ้นสุดที่จอง (ต้องออกจากลาน):</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {formatThaiDateTime(safeEndTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Price Summary */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>สรุปค่าธรรมเนียมและยอดชำระ:</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>ค่าบริการจอดรถ ({bookedHours} ชั่วโมง × ฿{feeRate}):</span>
                  <span className="font-semibold text-slate-800">฿{baseFee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-slate-600">
                  <span>ค่าธรรมเนียมการจองระบบออนไลน์:</span>
                  <span className="text-emerald-600 font-semibold">฿0.00 (ฟรี)</span>
                </div>

                {isFinal && (booking.Late_Penalty || 0) > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>ค่าปรับมาเช็คอินสาย:</span>
                    <span className="font-bold">+฿{(booking.Late_Penalty || 0).toFixed(2)}</span>
                  </div>
                )}

                {isFinal && (booking.Overtime_Penalty || 0) > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>ค่าปรับจอดเกินเวลา:</span>
                    <span className="font-bold">+฿{(booking.Overtime_Penalty || 0).toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      ยอดชำระเพื่อยืนยันการจอง:
                    </div>
                    <div className="text-[11px] text-slate-400">
                      (ชำระผ่าน PromptPay QR ตามยอดสุทธิ)
                    </div>
                  </div>
                  <div className="text-2xl font-black text-sky-600">
                    ฿{amountToPay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice & Terms Card */}
          <div className="bg-amber-50/70 rounded-3xl border border-amber-200/80 p-5 text-xs text-amber-900 space-y-2 shadow-xs">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ข้อควรทราบและคำแนะนำในการใช้บริการ</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              <li>เมื่อสแกนชำระเงินและกดยืนยัน ระบบจะออก <strong>E-Ticket QR Code</strong> ทันที</li>
              <li>ใช้ QR Code ดังกล่าวแสดงต่อเครื่องสแกนหน้าไม้กั้นเพื่อเข้า-ออกจากลานจอดรถ</li>
              <li>กรุณาเดินทางมาถึงก่อนหรือตรงเวลาที่จองไว้ หากเกินเวลา 15 นาที ระบบอาจคิดค่าปรับความล่าช้า</li>
              <li>หากจอดเกินเวลาที่ระบุ จะมีค่าบริการส่วนเกินตามอัตราที่กำหนด ณ จุดสแกนทางออก</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: PromptPay QR Box & Action Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main PromptPay Thai QR Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden text-center">
            
            {/* Authentic Thai QR PromptPay Header Banner */}
            <div className="bg-[#0B3B60] text-white px-6 py-4 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] tracking-widest uppercase font-bold text-sky-200">
                  THAI QR PAYMENT
                </div>
                <div className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  พร้อมเพย์ (PromptPay)
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-sky-200 font-medium">ยอดชำระสุทธิ</div>
                <div className="text-lg font-black text-white">
                  ฿{amountToPay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* QR Code Presentation Box */}
            <div className="p-6 space-y-4">
              
              {/* Countdown Warning Banner */}
              <div className={`px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 ${
                isExpired || timeLeft <= 0
                  ? 'bg-rose-50 border border-rose-300 text-rose-800'
                  : timeLeft <= 60
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 animate-pulse'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}>
                <Timer className={`w-4 h-4 shrink-0 ${isExpired || timeLeft <= 0 ? 'text-rose-600' : timeLeft <= 60 ? 'text-rose-600 animate-bounce' : 'text-amber-600 animate-spin'}`} />
                <span>
                  {isExpired || timeLeft <= 0 ? (
                    <strong className="text-rose-700 font-bold">หมดเวลาการชำระเงิน (เกิน 10 นาที) คำสั่งจองถูกยกเลิกแล้ว</strong>
                  ) : (
                    <>กรุณาชำระเงินภายใน: <strong className="font-mono font-bold text-amber-950 text-sm">{formatCountdown(timeLeft)}</strong> นาที</>
                  )}
                </span>
              </div>

              {/* The Provided QR Code Image with Authentic Frame */}
              <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl inline-block shadow-inner">
                <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100">
                  <img
                    src={promptpayQrImg}
                    alt="PromptPay QR Code - ParkSmart Payment"
                    className="w-56 h-56 object-contain mx-auto rounded-lg transition-transform hover:scale-102"
                  />
                  <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>สแกนผ่านแอปธนาคารทุกธนาคาร</span>
                  </div>
                </div>
              </div>

              {/* Payment Beneficiary & Reference Details */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-left space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">ชื่อบัญชี:</span>
                  <span className="font-bold text-slate-800">ParkSmart Thailand (ขอนแก่น)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">เลขอ้างอิง (Ref 1):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">BK-{booking.Booking_ID}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyRef(`BK-${booking.Booking_ID}`)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                      title="คัดลอกหมายเลขอ้างอิง"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">ทะเบียนรถ (Ref 2):</span>
                  <span className="font-mono font-semibold text-slate-800">{booking.LicensePlate}</span>
                </div>
              </div>

              {/* Download QR Button */}
              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>บันทึกภาพ QR Code ลงเครื่อง</span>
              </button>

              {/* Optional Slip Upload Box */}
              <div className="border-t border-slate-100 pt-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>แนบสลิปการโอนเงิน (ถ้ามี)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">ไม่บังคับ</span>
                </div>

                {slipImage ? (
                  <div className="relative p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <img src={slipImage} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-emerald-700">แนบสลิปเรียบร้อย</div>
                      <div className="text-[11px] text-slate-400">พร้อมยืนยันรายการ</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSlipImage(null)}
                      className="text-xs text-rose-600 hover:underline px-2"
                    >
                      ลบ
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/30 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs text-slate-500">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span>คลิกเพื่อแนบสลิปโอนเงิน</span>
                    <input type="file" accept="image/*" onChange={handleSlipChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Action Button: Confirm Payment */}
              {isExpired || timeLeft <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-slate-400 cursor-not-allowed shadow-none flex items-center justify-center gap-2 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>หมดเวลาชำระเงิน (10 นาที) คำสั่งจองถูกยกเลิกแล้ว</span>
                </button>
              ) : success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 animate-bounce shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ชำระเงินสำเร็จ! กำลังออก E-Ticket QR Code...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={paying}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {paying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังตรวจสอบยอดเงิน...</span>
                    </>
                  ) : (
                    <>
                      <span>ยืนยันการชำระเงินเรียบร้อย (฿{amountToPay.toLocaleString('th-TH', { minimumFractionDigits: 2 })})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {/* Cancel Button */}
              {!success && (
                <button
                  type="button"
                  onClick={handleCancelAndLeave}
                  disabled={paying || cancelling}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{cancelling ? 'กำลังยกเลิกคำสั่งจอง...' : 'ยกเลิกคำสั่งจองนี้ (คืนช่องจอดให้ว่าง)'}</span>
                </button>
              )}

              {/* Security Trust Badge */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 justify-center pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ระบบยืนยันสิทธิ์ทันทีผ่าน ParkSmart Instant Settlement</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 10-Minute Expiration Modal */}
      {isExpired && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border-2 border-rose-200">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">หมดเวลาการชำระเงิน (10 นาที)</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                คำสั่งจองนี้ถูกยกเลิกแล้วเนื่องจากไม่มีการชำระเงินภายในเวลา 10 นาที ระบบได้คืนสถานะช่องจอดรถให้ว่างเพื่อให้ผู้ใช้อื่นสามารถจองได้แล้ว
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (booking?.Lot_ID) {
                    navigate(`/lots/${booking.Lot_ID}`);
                  } else {
                    navigate('/lots');
                  }
                }}
                className="w-full py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md"
              >
                กลับไปเลือกลานจอดรถใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
