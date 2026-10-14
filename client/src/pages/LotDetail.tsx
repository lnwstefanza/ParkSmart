import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, Calendar, ShieldAlert, Sparkles, ArrowLeft, CheckCircle2, AlertTriangle, Navigation, Lock, LogIn, X } from 'lucide-react';
import { ParkingLot, ParkingSlot, User } from '../types';
import { formatThai24hTime } from '../lib/thai-time';
import { getGoogleMapsUrl } from '../lib/utils';
import { ThaiDatePicker } from '../components/ThaiDatePicker';
import { ThaiTimePicker } from '../components/ThaiTimePicker';

interface LotDetailProps {
  user: User | null;
}

export function LotDetail({ user }: LotDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lot, setLot] = useState<ParkingLot | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Date and Time selection (Bangkok date)
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const [timeInitialized, setTimeInitialized] = useState<boolean>(false);

  // Set initial time within lot operating hours if lot is loaded and time not initialized
  useEffect(() => {
    if (lot && !timeInitialized) {
      if (lot.OpenTime) {
        setSelectedTime(lot.OpenTime);
      }
      setTimeInitialized(true);
    }
  }, [lot, timeInitialized]);

  // Calculate maximum allowed hours before mall closing time
  const maxAvailableHours = (() => {
    if (!lot?.CloseTime || !selectedTime) return 24;
    try {
      const [closeH, closeM] = lot.CloseTime.split(':').map(Number);
      const [startH, startM] = selectedTime.split(':').map(Number);
      const closeMin = closeH * 60 + (closeM || 0);
      const startMin = startH * 60 + (startM || 0);
      const diffMin = closeMin - startMin;
      return Math.max(1, Math.min(24, Math.floor(diffMin / 60)));
    } catch {
      return 24;
    }
  })();

  // Auto-clamp selectedDuration if it exceeds mall closing time
  useEffect(() => {
    if (selectedDuration > maxAvailableHours) {
      setSelectedDuration(maxAvailableHours);
    }
  }, [maxAvailableHours]);

  // Calculate end time string
  const endTimeStr = (() => {
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const endH = (h + selectedDuration) % 24;
      return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } catch {
      return '';
    }
  })();

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const fetchLotAndSlots = () => {
    const query = `date=${selectedDate}&time=${selectedTime}&duration=${selectedDuration}`;
    Promise.all([
      fetch(`/api/lots/${id}`).then(res => res.json()),
      fetch(`/api/lots/${id}/slots?${query}`).then(res => res.json())
    ])
      .then(([lotData, slotsData]) => {
        setLot(lotData);
        setSlots(slotsData);
        if (!selectedFloor && slotsData.length > 0) {
          // unique floors
          const floors = Array.from(new Set(slotsData.map((s: ParkingSlot) => s.Floor))) as string[];
          setSelectedFloor(floors[0] || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLotAndSlots();
    // Poll slots every 5 seconds for real-time update
    const interval = setInterval(fetchLotAndSlots, 5000);
    return () => clearInterval(interval);
  }, [id, selectedDate, selectedTime, selectedDuration]);

  // If selectedSlot is no longer available in the newly loaded slots list, unselect it
  useEffect(() => {
    if (selectedSlot) {
      const updated = slots.find(s => s.Slot_ID === selectedSlot.Slot_ID);
      if (updated && updated.ParkingSlot_Status !== 'Available') {
        setSelectedSlot(null);
      }
    }
  }, [slots]);

  const handleSelectSlot = (slot: ParkingSlot) => {
    if (slot.ParkingSlot_Status !== 'Available') return;
    setSelectedSlot(slot);
  };

  const handleProceedBooking = () => {
    if (!selectedSlot) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/booking/${selectedSlot.Slot_ID}?date=${selectedDate}&time=${selectedTime}&duration=${selectedDuration}`);
  };

  if (loading || !lot) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Floors list
  const floors = Array.from(new Set(slots.map(s => s.Floor)));
  const currentFloorSlots = slots.filter(s => s.Floor === selectedFloor);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link to="/lots" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-sky-600">
        <ArrowLeft className="w-4 h-4" />
        กลับหน้ารวมลานจอด
      </Link>

      {/* Lot Header & Info */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-5 relative aspect-video lg:aspect-auto">
          <img
            src={lot.Image_Url}
            alt={lot.LotName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
            }}
          />
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                {lot.District}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                สถานะเปิดให้บริการ
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lot.LotName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                <span>{lot.Location}</span>
              </p>
              <a
                href={getGoogleMapsUrl(lot.LotName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition-colors"
                title="เปิดเส้นทางใน Google Maps"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>เปิด Google Maps นำทาง</span>
              </a>
            </div>

            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
              {lot.Description}
            </p>
          </div>

          {/* Pricing & Time Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block">อัตราค่าบริการ</span>
              <span className="text-lg font-bold text-sky-700">฿{lot.FeeRate_Per_Hour}</span>
              <span className="text-xs text-slate-500 block">/ ชม.</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block">เวลาเปิด-ปิด</span>
              <span className="text-sm font-bold text-slate-800 block mt-1">
                {formatThai24hTime(lot.OpenTime)} - {formatThai24hTime(lot.CloseTime)}
              </span>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-100">
              <span className="text-xs text-rose-500 block font-medium">ค่าปรับจอดเกินเวลา</span>
              <span className="text-lg font-bold text-rose-600">2 เท่า</span>
              <span className="text-xs text-rose-500/80 block">ของอัตราปกติ</span>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold text-amber-950">ข้อควรระวัง:</strong>{' '}
              <span className="font-bold text-rose-600">หากจอดเกินเวลาจองจะปรับเงิน 2 เท่า จากค่าจอดรถ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Parking Slot Layout Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              แผนผังช่องจอดรถแบบ Real-time
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              คลิกเลือกช่องจอดสีเขียวเพื่อเริ่มทำรายการจอง (ข้อมูลอัปเดตสดอัตโนมัติทุก 5 วินาที)
            </p>
          </div>

          {/* Status Legends */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500" /> ว่าง (จองได้)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-500" /> ถูกจองแล้ว
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500" /> รถกำลังจอด
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-300" /> ปิดปรับปรุง
            </span>
          </div>
        </div>

        {/* Date, Time & Duration Filter Section */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>ระบุวันและเวลาที่ต้องการเข้าจอด เพื่อแสดงช่องว่างที่ถูกต้อง</span>
            </h3>
            {lot.CloseTime && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg w-fit">
                เวลาเปิดห้าง: {formatThai24hTime(lot.OpenTime)} - {formatThai24hTime(lot.CloseTime)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Date Picker */}
            <div>
              <ThaiDatePicker
                value={selectedDate}
                onChange={(d) => setSelectedDate(d)}
                minDate={todayStr}
                label="วันที่ต้องการเข้าจอด (dd/mm/yyyy)"
              />
            </div>

            {/* 2. Time Picker with Mall Operating Hours */}
            <div>
              <ThaiTimePicker
                value={selectedTime}
                onChange={(t) => setSelectedTime(t)}
                minTime={lot.OpenTime}
                maxTime={lot.CloseTime}
                label="เวลาเริ่มจอด (24 ชั่วโมง)"
              />
            </div>

            {/* 3. Duration Selector */}
            <div className="flex flex-col justify-end">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ระยะเวลาจอด (ชั่วโมง)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {Array.from({ length: maxAvailableHours }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>
                      {h} ชั่วโมง
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  สิ้นสุดเวลา: <strong className="text-slate-800 font-bold">{endTimeStr} น.</strong>
                </span>
                {maxAvailableHours < 24 && (
                  <span className="text-amber-600 font-semibold">
                    (สูงสุด {maxAvailableHours} ชม. ตามเวลาปิดห้าง)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floor Selection Tabs */}
        {floors.length > 1 && (
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
            {floors.map(fl => (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedFloor === fl
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ชั้น {fl}
              </button>
            ))}
          </div>
        )}

        {/* Slot Grid Map */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 pt-2">
          {currentFloorSlots.map(slot => {
            const isAvailable = slot.ParkingSlot_Status === 'Available';
            const isSelected = selectedSlot?.Slot_ID === slot.Slot_ID;

            let cardStyle = "bg-white border-emerald-300/80 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-50/60 hover:shadow-md hover:-translate-y-0.5 cursor-pointer shadow-sm";
            let badgeStyle = "bg-emerald-100 text-emerald-800 font-bold";
            let statusText = "ว่าง";

            if (slot.ParkingSlot_Status === 'Reserved') {
              cardStyle = "bg-amber-50/60 border-amber-200 text-amber-900 cursor-not-allowed opacity-85";
              badgeStyle = "bg-amber-100/90 text-amber-800 font-semibold";
              statusText = "ติดจอง";
            } else if (slot.ParkingSlot_Status === 'Occupied') {
              cardStyle = "bg-rose-50/60 border-rose-200 text-rose-900 cursor-not-allowed opacity-85";
              badgeStyle = "bg-rose-100/90 text-rose-800 font-semibold";
              statusText = "มีรถจอด";
            } else if (slot.ParkingSlot_Status === 'Maintenance') {
              cardStyle = "bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed opacity-60";
              badgeStyle = "bg-slate-200 text-slate-600 font-medium";
              statusText = "ปิดซ่อม";
            }

            if (isSelected) {
              cardStyle = "bg-gradient-to-br from-sky-600 to-sky-700 border-sky-600 text-white shadow-xl shadow-sky-600/25 ring-4 ring-sky-300/60 -translate-y-1 scale-105 z-10";
              badgeStyle = "bg-white/20 text-white font-bold backdrop-blur-sm";
              statusText = "เลือกแล้ว ✓";
            }

            return (
              <button
                key={slot.Slot_ID}
                disabled={!isAvailable}
                onClick={() => handleSelectSlot(slot)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between min-h-[92px] transition-all duration-200 relative overflow-hidden ${cardStyle}`}
              >
                {/* Visual Top Lane Marker */}
                <div className={`w-8 h-1 rounded-full mb-1.5 ${isSelected ? 'bg-white/40' : 'bg-slate-300/60'}`} />
                
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 whitespace-nowrap">
                  {slot.Zone}
                </span>

                <span className="text-base sm:text-lg font-black tracking-tight my-0.5 whitespace-nowrap">
                  {slot.SpaceCode}
                </span>

                <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 whitespace-nowrap ${badgeStyle}`}>
                  {statusText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Slot Action Bar */}
        {selectedSlot && (
          <div className="mt-6 p-4 sm:p-5 bg-gradient-to-r from-sky-50 to-blue-50/80 rounded-3xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="h-12 px-4 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-700 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-sky-600/25 shrink-0 whitespace-nowrap min-w-[76px] tracking-wide border border-sky-400/30">
                {selectedSlot.SpaceCode}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-sky-700 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  ช่องจอดที่คุณเลือก
                </div>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  ชั้น {selectedSlot.Floor} • {selectedSlot.Zone} (ลาน {lot.LotName})
                </p>
                <p className="text-xs text-sky-800 font-semibold mt-0.5">
                  วันที่: <span className="text-slate-800 font-bold">{formatDateDisplay(selectedDate)}</span> • เวลา: <span className="text-slate-800 font-bold">{selectedTime} - {endTimeStr} น.</span> ({selectedDuration} ชม.)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-colors"
              >
                ยกเลิกการเลือก
              </button>
              <button
                onClick={handleProceedBooking}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-sky-300 transition-all flex items-center justify-center gap-2"
              >
                <span>ดำเนินการจองช่องนี้</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Login Required Modal Popup */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning / Lock Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              กรุณาเข้าสู่ระบบก่อน
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              คุณต้องเข้าสู่ระบบบัญชีผู้ใช้ก่อนทำการจองช่องจอดรถ เพื่อระบุข้อมูลทะเบียนรถ ชำระเงินค่าบริการ และรับตั๋ว E-Ticket QR Code
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-sky-200 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบทันที</span>
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
              >
                ยังไม่มีบัญชี? สมัครสมาชิกใหม่
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-1 text-xs text-slate-400 hover:text-slate-600 transition-colors pt-2"
              >
                ยกเลิก / ไว้คราวหลัง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
