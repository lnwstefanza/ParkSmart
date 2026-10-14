import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Car, AlertCircle, AlertTriangle, ShieldCheck, CheckCircle2, Calendar, Clock, DollarSign } from 'lucide-react';
import { ParkingSlot, ParkingLot, User } from '../types';
import { ThaiTimePicker } from '../components/ThaiTimePicker';
import { ThaiDatePicker } from '../components/ThaiDatePicker';
import { getCurrentThaiTime } from '../lib/thai-time';

interface BookingProps {
  user: User | null;
}

export function Booking({ user }: BookingProps) {
  const { slotId } = useParams<{ slotId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [slot, setSlot] = useState<ParkingSlot | null>(null);
  const [lot, setLot] = useState<ParkingLot | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    fieldToFocus?: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
  
  // Date and Time selection (Local Bangkok date)
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const queryDate = searchParams.get('date');
  const queryTime = searchParams.get('time');
  const queryDuration = searchParams.get('duration');

  const [bookingDate, setBookingDate] = useState(queryDate || todayStr);
  const [startTime, setStartTime] = useState(queryTime || '10:00');
  const [durationHours, setDurationHours] = useState(queryDuration ? Number(queryDuration) : 2);
  const [slotConflict, setSlotConflict] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetch(`/api/lots`)
      .then(res => res.json())
      .then(async (lots: ParkingLot[]) => {
        for (const l of lots) {
          const res = await fetch(`/api/lots/${l.Lot_ID}/slots`);
          const slots: ParkingSlot[] = await res.json();
          const target = slots.find(s => s.Slot_ID === Number(slotId));
          if (target) {
            setSlot(target);
            setLot(l);
            // Pre-fill valid start time within lot operating hours if not specified
            if (!queryTime && l.OpenTime) {
              setStartTime(l.OpenTime);
            }
            break;
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slotId, user, queryTime]);

  // Calculate maximum allowed hours before mall closing time
  const maxAvailableHours = (() => {
    if (!lot?.CloseTime || !startTime) return 24;
    try {
      const [closeH, closeM] = lot.CloseTime.split(':').map(Number);
      const [startH, startM] = startTime.split(':').map(Number);
      const closeMin = closeH * 60 + (closeM || 0);
      const startMin = startH * 60 + (startM || 0);
      const diffMin = closeMin - startMin;
      return Math.max(1, Math.min(24, Math.floor(diffMin / 60)));
    } catch {
      return 24;
    }
  })();

  // Auto-clamp durationHours if it exceeds mall closing time
  useEffect(() => {
    if (durationHours > maxAvailableHours) {
      setDurationHours(maxAvailableHours);
    }
  }, [maxAvailableHours]);

  // Real-time slot availability check for the chosen date, time, and duration
  useEffect(() => {
    if (!slotId || !bookingDate || !startTime) return;
    const token = localStorage.getItem('token');
    fetch(`/api/slots/${slotId}/check-availability?date=${bookingDate}&time=${startTime}&duration=${durationHours}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.available === false) {
          setSlotConflict(data.message || 'ช่องจอดนี้มีการจองในช่วงเวลาดังกล่าวแล้ว');
        } else {
          setSlotConflict(null);
        }
      })
      .catch(() => setSlotConflict(null));
  }, [slotId, bookingDate, startTime, durationHours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      setValidationModal({
        isOpen: true,
        title: 'กรุณากรอกหมายเลขทะเบียนรถยนต์',
        message: 'โปรดระบุหมายเลขทะเบียนรถยนต์ก่อนดำเนินการต่อ',
        fieldToFocus: 'licensePlate'
      });
      return;
    }
    if (!bookingDate) {
      setValidationModal({
        isOpen: true,
        title: 'กรุณาระบุวันที่เข้าจอด',
        message: 'โปรดเลือกวันที่เข้าจอดให้ครบถ้วนก่อนดำเนินการต่อ',
        fieldToFocus: 'bookingDate'
      });
      return;
    }
    if (!startTime) {
      setValidationModal({
        isOpen: true,
        title: 'กรุณาระบุเวลาที่จะเข้าจอด',
        message: 'โปรดเลือกเวลาที่จะเข้าจอดให้ครบถ้วนก่อนดำเนินการต่อ',
        fieldToFocus: 'startTime'
      });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          slotId: Number(slotId),
          licensePlate: licensePlate.trim(),
          bookingDate,
          startTime,
          durationHours
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถทำการจองได้');
      }

      // Redirect to payment screen
      navigate(`/payment/${data.bookingId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!slot || !lot) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">ไม่พบข้อมูลช่องจอดที่เลือก</p>
        <Link to="/lots" className="mt-4 inline-block text-sky-600 font-semibold">
          กลับไปค้นหาลานจอด
        </Link>
      </div>
    );
  }

  const hourlyFee = (lot.FeeRate_Per_Hour || 20) * durationHours;
  const calculatedFee = (lot.Daily_Max_Fee && lot.Daily_Max_Fee > 0)
    ? Math.min(hourlyFee, lot.Daily_Max_Fee * Math.ceil(durationHours / 24))
    : hourlyFee;

  // Projected End Time: startTime + durationHours (e.g. 15:30 + 4h = 19:30)
  const projectedEndTime = (() => {
    try {
      if (!startTime || !bookingDate) return '';
      const [h, m] = startTime.split(':').map(Number);
      const startDateTime = new Date(`${bookingDate}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 3600000);
      const endH = String(endDateTime.getHours()).padStart(2, '0');
      const endM = String(endDateTime.getMinutes()).padStart(2, '0');
      const isNextDay = endDateTime.getDate() !== startDateTime.getDate();
      return `${endH}:${endM} น.${isNextDay ? ' (วันถัดไป)' : ''}`;
    } catch {
      return '';
    }
  })();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link to={`/lots/${lot.Lot_ID}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-sky-600">
        <ArrowLeft className="w-4 h-4" />
        กลับไปแผนผังช่องจอด
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">
            ขั้นตอนที่ 1 จาก 2: กำหนดวันเวลาและข้อมูลรถ
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            จองช่องจอดรถ {slot.SpaceCode}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lot.LotName} • ชั้น {slot.Floor} ({slot.Zone})
          </p>
        </div>

        {/* PROMINENT WARNING BOX AS REQUIRED */}
        <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-2 text-amber-900 shadow-sm">
          <div className="flex items-center gap-2 font-extrabold text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>หากจอดเกินเวลาจองจะปรับเงิน 2 เท่า</span>
          </div>
          <ul className="text-xs text-amber-800 space-y-1 pl-1 list-disc list-inside">
            <li><strong>สถานที่ต่างๆ จะไม่มีจอดฟรีก่อนเวลา</strong> ระบบคิดค่าบริการตามเวลาที่จองจริง</li>
            <li><strong>หากมาเกินเวลาที่จอง:</strong> จะคิดค่าปรับความล่าช้า 20 บาท ต่อ 30 นาที</li>
            <li><strong>หากจอดเกินเวลาที่จองไว้:</strong> ผู้ใช้งานจะโดนปรับ <strong>2 เท่า</strong> จากค่าจอดรถปกติ</li>
          </ul>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* License plate input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-sky-600" />
              หมายเลขทะเบียนรถยนต์ <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              ref={licenseInputRef}
              type="text"
              placeholder="ตัวอย่าง: กข 9999 ขอนแก่น"
              value={licensePlate}
              onChange={e => setLicensePlate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium text-base shadow-sm"
            />
          </div>

          {/* Date Picker strictly ordered dd/mm/yyyy */}
          <ThaiDatePicker
            value={bookingDate}
            onChange={setBookingDate}
            label="วันที่เข้าจอด (dd/mm/yyyy)"
          />

          {/* Time Picker */}
          <ThaiTimePicker
            value={startTime}
            onChange={setStartTime}
            minTime={lot.OpenTime}
            maxTime={lot.CloseTime}
            label="เวลาที่จะเข้าจอด (24 ชั่วโมง แบบไทย)"
          />

          {/* Duration Selector: 1 - maxAvailableHours Hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                ระยะเวลาที่ต้องการจอง (1 ชั่วโมง - {maxAvailableHours} ชั่วโมง)
              </label>
              <span className="text-xs font-black text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100 font-mono">
                {durationHours} ชั่วโมง
              </span>
            </div>

            {/* Stepper + Select Dropdown */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDurationHours(Math.max(1, durationHours - 1))}
                disabled={durationHours <= 1}
                className="w-11 h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-40 font-bold text-lg flex items-center justify-center text-slate-700 shadow-sm transition-all"
                title="ลด 1 ชั่วโมง"
              >
                -
              </button>

              <select
                value={durationHours}
                onChange={e => setDurationHours(Number(e.target.value))}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-sm focus:outline-none focus:border-sky-500 shadow-sm cursor-pointer"
              >
                {Array.from({ length: maxAvailableHours }, (_, i) => i + 1).map(h => {
                  const fee = (lot.Daily_Max_Fee && lot.Daily_Max_Fee > 0)
                    ? Math.min((lot.FeeRate_Per_Hour || 20) * h, lot.Daily_Max_Fee)
                    : (lot.FeeRate_Per_Hour || 20) * h;
                  const isClosingLimit = (h === maxAvailableHours && lot.CloseTime);
                  return (
                    <option key={h} value={h}>
                      {h} ชั่วโมง {isClosingLimit ? `(ถึงเวลาปิดห้าง ${lot.CloseTime} น.)` : ''} — ค่าจอด ฿{fee}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setDurationHours(Math.min(maxAvailableHours, durationHours + 1))}
                disabled={durationHours >= maxAvailableHours}
                className="w-11 h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-40 font-bold text-lg flex items-center justify-center text-slate-700 shadow-sm transition-all"
                title={durationHours >= maxAvailableHours ? "ถึงเวลาปิดของลานจอดแล้ว" : "เพิ่ม 1 ชั่วโมง"}
              >
                +
              </button>
            </div>

            {/* Quick Presets Pills */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5, 8, 12, 24]
                .filter(h => h <= maxAvailableHours)
                .map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDurationHours(h)}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      durationHours === h
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm scale-102'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {h} ชม.
                  </button>
                ))}
            </div>

            {/* Mall Closing Time Restriction Notice */}
            {lot.CloseTime && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {lot.LotName} ปิดให้บริการเวลา <strong>{lot.CloseTime} น.</strong> • จองเวลา {startTime} น. สามารถจองได้สูงสุด <strong>{maxAvailableHours} ชั่วโมง</strong> (ห้ามจองเกินเวลาปิดห้าง)
                </span>
              </div>
            )}
          </div>

          {/* Real-time Conflict Alert */}
          {slotConflict && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-800 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-rose-900">ช่องจอดนี้ไม่ว่างในช่วงเวลาที่เลือก</strong>
                <span>{slotConflict}</span>
              </div>
            </div>
          )}

          {/* Price Summary Card */}
          <div className="bg-sky-50/80 rounded-2xl p-5 border border-sky-100 space-y-3">
            <div className="flex justify-between text-xs text-slate-600">
              <span>อัตราค่าจอดปกติ:</span>
              <span className="font-semibold text-slate-800">฿{lot.FeeRate_Per_Hour} / ชั่วโมง</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>เวลาเริ่มเข้าจอด:</span>
              <span className="font-semibold text-slate-800">{startTime} น.</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>ระยะเวลาที่จอง:</span>
              <span className="font-semibold text-slate-800">{durationHours} ชั่วโมง</span>
            </div>
            {projectedEndTime && (
              <div className="flex justify-between text-xs text-sky-800 font-bold bg-sky-100/70 px-3 py-2 rounded-xl border border-sky-200">
                <span>เวลาสิ้นสุดที่จอง (+{durationHours} ชม.):</span>
                <span className="text-sky-950 font-extrabold">{projectedEndTime}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600">
              <span>นโยบายจอดฟรี:</span>
              <span className="font-semibold text-slate-700">ไม่มีจอดฟรีก่อนเวลา</span>
            </div>
            <div className="pt-2 border-t border-sky-200/60 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-slate-800 block">ค่าจอดรถที่ต้องชำระ:</span>
                <span className="text-[11px] text-slate-500">ชำระเพื่อรับ QR Code สำหรับสแกนเข้า</span>
              </div>
              <span className="text-2xl font-extrabold text-sky-700">฿{calculatedFee}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || Boolean(slotConflict)}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-sky-300 active:scale-95 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            {submitting ? (
              <span>กำลังสร้างรายการจอง...</span>
            ) : (
              <>
                <span>ยืนยันการจองและไปหน้าชำระเงิน (฿{calculatedFee})</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>เมื่อชำระเงินสำเร็จจะได้รับ QR Code เพื่อใช้สแกนเข้าที่จอดรถ</span>
        </div>
      </div>

      {/* Validation Alert Popup Modal */}
      {validationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {validationModal.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {validationModal.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const target = validationModal.fieldToFocus;
                setValidationModal({ isOpen: false, title: '', message: '' });
                if (target === 'licensePlate') {
                  setTimeout(() => licenseInputRef.current?.focus(), 100);
                }
              }}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              ตกลง เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
