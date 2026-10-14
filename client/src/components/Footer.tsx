import { Car, MapPin, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="ParkSmart" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-white tracking-tight">
                Park<span className="text-sky-400">Smart</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              แพลตฟอร์มตัวกลางจองที่จอดรถออนไลน์ชั้นนำ ให้คุณเลือกจองวันเวลาล่วงหน้า รับ QR Code สแกนเข้า-ออกได้สะดวกรวดเร็ว
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <span>รองรับลานจอดหลัก (ทำเลจริง ปี 2569)</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">บริการ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/lots" className="hover:text-sky-400 transition-colors">ค้นหาลานจอดรถ</Link></li>
              <li><Link to="/my/bookings" className="hover:text-sky-400 transition-colors">ตรวจสอบตั๋ว E-Ticket</Link></li>
              <li><Link to="/my/favorites" className="hover:text-sky-400 transition-colors">รายการลานโปรด</Link></li>
              <li><Link to="/my/complaints" className="hover:text-sky-400 transition-colors">ส่งเรื่องร้องเรียน</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">เงื่อนไขการใช้บริการ</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>จองวันเวลาล่วงหน้า สะดวก รวดเร็ว</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>สแกนเข้า-ออกผ่าน QR Code ปลอดภัย</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">2x</span>
                <span>หากจอดเกินเวลาจองจะปรับเงิน 2 เท่า</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">ติดต่อสอบถาม</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p className="leading-relaxed">ศูนย์บริการช่วยเหลือผู้ใช้งาน ParkSmart</p>
              <div className="text-xs text-slate-400 pt-1 space-y-1">
                <div>📞 โทร: 0930981819 (ศูนย์บริการติดต่อได้ 24 ชั่วโมง)</div>
                <div>✉️ อีเมล: kanatip.pr@kkumail.com</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            © 2569 ParkSmart. สงวนลิขสิทธิ์ทุกประการ.
          </div>
          <div className="mt-2 sm:mt-0 flex gap-4">
            <span>มาตรฐานเวลา Asia/Bangkok (UTC+7)</span>
            <span>•</span>
            <span>SQLite Database Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
