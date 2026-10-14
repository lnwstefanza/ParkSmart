import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface ThaiDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  label?: string;
  minDate?: string; // "YYYY-MM-DD"
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const DAY_NAMES = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function ThaiDatePicker({
  value,
  onChange,
  label = "วันที่เข้าจอด (dd/mm/yyyy)"
}: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD or default to today in Bangkok time
  const today = new Date();
  const initialDate = value ? new Date(value + 'T00:00:00') : today;
  
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() ?? today.getMonth());

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format YYYY-MM-DD to strictly "dd/mm/yyyy"
  const formatDdMmYyyy = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return dateStr;
  };

  const getThaiFormatted = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const monthIdx = parseInt(m, 10) - 1;
      return `${parseInt(d, 10)} ${THAI_MONTHS[monthIdx] || ''} ${parseInt(y, 10) + 543} (${y})`;
    }
    return '';
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = `${viewYear}-${mm}-${dd}`;
    onChange(isoString);
    setIsOpen(false);
  };

  // Quick Select
  const selectQuickDay = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setViewYear(yyyy);
    setViewMonth(d.getMonth());
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Parse current value
  const [valY, valM, valD] = value ? value.split('-').map(Number) : [0, 0, 0];

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-sky-600" />
            {label}
          </span>
          <span className="text-[11px] font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md font-bold">
            dd/mm/yyyy
          </span>
        </label>
      )}

      {/* Main Clickable Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm text-left transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base font-extrabold text-sky-800 tracking-wide font-mono">
            {formatDdMmYyyy(value) || 'dd/mm/yyyy'}
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            • {getThaiFormatted(value)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{isOpen ? 'ปิดปฏิทิน' : 'เลือกวัน'}</span>
        </div>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-40 mt-2 w-full max-w-sm left-0 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                รูปแบบวัน/เดือน/ปี
              </span>
              <span className="text-[11px] font-mono font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                (dd/mm/yyyy)
              </span>
            </div>
            <div className="text-sm font-extrabold text-sky-700 font-mono">
              {formatDdMmYyyy(value)}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => selectQuickDay(0)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 transition-colors"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => selectQuickDay(1)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 transition-colors"
            >
              พรุ่งนี้
            </button>
            <button
              type="button"
              onClick={() => selectQuickDay(2)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 transition-colors"
            >
              มะรืนนี้
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-sm font-bold text-slate-800">
                {THAI_MONTHS[viewMonth]} {viewYear + 543}
              </span>
              <span className="text-xs text-slate-400 font-mono ml-1.5">
                ({viewYear})
              </span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day of Week Header (Sun to Sat) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d, i) => (
              <span
                key={d}
                className={`text-[11px] font-bold py-1 ${
                  i === 0 ? 'text-rose-500' : i === 6 ? 'text-sky-600' : 'text-slate-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for previous month offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                valD === day &&
                valM === viewMonth + 1 &&
                valY === viewYear;

              const isToday =
                today.getDate() === day &&
                today.getMonth() === viewMonth &&
                today.getFullYear() === viewYear;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`p-2 text-xs font-bold rounded-xl transition-all relative ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-105'
                      : isToday
                      ? 'bg-sky-50 text-sky-700 font-extrabold border border-sky-200 hover:bg-sky-100'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Summary at bottom of modal */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>วันที่เลือก: <strong className="text-slate-800 font-mono">{formatDdMmYyyy(value)}</strong></span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-sky-600 font-bold hover:underline"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
