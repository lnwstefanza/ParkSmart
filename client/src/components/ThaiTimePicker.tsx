import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThaiTimePickerProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  label?: string;
  minTime?: string; // e.g. "10:00"
  maxTime?: string; // e.g. "22:00"
}

export function ThaiTimePicker({
  value,
  onChange,
  label = "เวลาที่คาดว่าจะมาถึง (24 ชั่วโมง)",
  minTime,
  maxTime
}: ThaiTimePickerProps) {
  const [hour, minute] = (value || "12:00").split(':');
  const [isOpen, setIsOpen] = useState(false);

  // Parse operating hours (if provided)
  const openH = minTime ? parseInt(minTime.split(':')[0], 10) : 0;
  const openM = minTime ? parseInt(minTime.split(':')[1] || '0', 10) : 0;
  const closeH = maxTime ? parseInt(maxTime.split(':')[0], 10) : 24;
  const closeM = maxTime ? parseInt(maxTime.split(':')[1] || '0', 10) : 0;

  // Maximum allowed entry time (at least 1 hour before mall close)
  const closeTotalMinutes = closeH * 60 + closeM;
  const latestEntryMinutes = maxTime ? Math.max(openH * 60, closeTotalMinutes - 60) : 23 * 60 + 55;

  // Filter hours within operating range
  const allHours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const hours = allHours.filter(hStr => {
    if (!minTime && !maxTime) return true;
    const h = parseInt(hStr, 10);
    return h * 60 >= openH * 60 && h * 60 <= latestEntryMinutes;
  });

  // Filter minutes for the currently selected hour
  const allMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const minutes = allMinutes.filter(mStr => {
    if (!minTime && !maxTime) return true;
    const currentH = parseInt(hour, 10);
    const m = parseInt(mStr, 10);
    const currentTotalMin = currentH * 60 + m;
    return currentTotalMin >= (openH * 60 + openM) && currentTotalMin <= latestEntryMinutes;
  });

  // Auto-clamp if initial or current time is outside valid operating hours
  useEffect(() => {
    if ((minTime || maxTime) && hours.length > 0) {
      const currentH = parseInt(hour, 10);
      const currentM = parseInt(minute || '0', 10);
      const currentTotalMin = currentH * 60 + currentM;

      if (currentTotalMin < (openH * 60 + openM) || currentTotalMin > latestEntryMinutes) {
        const defaultH = hours[0];
        const defaultM = '00';
        onChange(`${defaultH}:${defaultM}`);
      }
    }
  }, [minTime, maxTime, hours.length]);

  const handleHourSelect = (newH: string) => {
    const validM = minutes.includes(minute) ? minute : (minutes[0] || '00');
    onChange(`${newH}:${validM}`);
  };

  const handleMinuteSelect = (newM: string) => {
    onChange(`${hour || hours[0] || '12'}:${newM}`);
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            {label}
          </label>
          {minTime && maxTime && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              เวลาเปิด-ปิด: {minTime} - {maxTime} น.
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm text-left transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-700 text-lg">
              {hour}:{minute}
            </span>
            <span className="text-slate-500 font-medium">น. (ระบบ 24 ชม.)</span>
          </div>
          <span className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded-lg border border-sky-100 font-medium">
            {isOpen ? 'ปิดตัวเลือก' : 'เลือกเวลา'}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-30 mt-2 w-full p-4 bg-white rounded-2xl border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  ระบุเวลาเข้าจอด (ตามเวลาทำการของลาน)
                </span>
                {minTime && maxTime && (
                  <span className="text-[11px] text-slate-500 block">
                    เปิด {minTime} น. - ปิด {maxTime} น. (จองได้ถึง {String(Math.floor(latestEntryMinutes / 60)).padStart(2, '0')}:{String(latestEntryMinutes % 60).padStart(2, '0')} น.)
                  </span>
                )}
              </div>
              <span className="text-base font-black text-sky-600 font-mono">
                {hour}:{minute} น.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Hours Wheel */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5 text-center">
                  ชั่วโมง ({hours[0] || '00'} - {hours[hours.length - 1] || '23'})
                </p>
                <div className="h-44 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                  {hours.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={cn(
                        "w-full py-1.5 text-sm rounded-lg font-medium transition-colors text-center font-mono",
                        h === hour
                          ? "bg-sky-600 text-white shadow-sm font-bold"
                          : "hover:bg-slate-200 text-slate-700"
                      )}
                    >
                      {h} น.
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Wheel */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5 text-center">
                  นาที ({minutes[0] || '00'} - {minutes[minutes.length - 1] || '55'})
                </p>
                <div className="h-44 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                  {minutes.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={cn(
                        "w-full py-1.5 text-sm rounded-lg font-medium transition-colors text-center font-mono",
                        m === minute
                          ? "bg-sky-600 text-white shadow-sm font-bold"
                          : "hover:bg-slate-200 text-slate-700"
                      )}
                    >
                      {m} นาที
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 shadow-sm"
              >
                ยืนยันเวลานี้ ({hour}:{minute} น.)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
