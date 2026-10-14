import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Clock, 
  Shield, 
  Sparkles, 
  Navigation, 
  ChevronRight, 
  Car, 
  Zap, 
  Building2, 
  QrCode, 
  ShieldCheck, 
  X,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { ParkingLot } from '../types';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { formatThai24hTime } from '../lib/thai-time';
import { getGoogleMapsUrl } from '../lib/utils';

export function Home() {
  const [recommendedLots, setRecommendedLots] = useState<ParkingLot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/lots/recommended')
      .then(res => res.json())
      .then(data => {
        setRecommendedLots(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading lots:', err);
        setLoading(false);
      });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      navigate('/lots');
      return;
    }
    navigate(`/lots?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleQuickTagClick = (tagName: string) => {
    setSearchQuery(tagName);
    navigate(`/lots?search=${encodeURIComponent(tagName)}`);
  };

  // Popular quick tags for one-click search
  const popularTags = [
    { name: 'เซ็นทรัล ขอนแก่น', emoji: '🏢' },
    { name: 'แฟรี่ พลาซ่า', emoji: '🛍️' },
    { name: 'ตึกแก่น', emoji: '🏬' },
    { name: 'ตลาดต้นตาล', emoji: '🌆' },
    { name: 'Campus มข.', emoji: '🎓' },
    { name: 'Big C', emoji: '🏪' },
    { name: 'Lotus โนนม่วง', emoji: '🛒' }
  ];

  // Calculate total real-time available slots across all recommended lots
  const totalAvailableSlots = recommendedLots.reduce((sum, lot) => sum + (lot.available_slots || 0), 0);

  // Category filter
  const categories = [
    { id: 'all', label: 'ทั้งหมด (7 ลาน)' },
    { id: 'mall', label: 'ห้างสรรพสินค้า' },
    { id: 'campus', label: 'ย่าน มข. (กังสดาล)' },
    { id: 'market', label: 'ตลาด & คอมมูนิตี้' }
  ];

  const filteredLots = recommendedLots.filter(lot => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'mall') {
      return lot.LotName.includes('Central') || lot.LotName.includes('แฟรี่') || lot.LotName.includes('Big C');
    }
    if (selectedCategory === 'campus') {
      return lot.LotName.includes('Campus') || lot.LotName.includes('Lotus');
    }
    if (selectedCategory === 'market') {
      return lot.LotName.includes('ต้นตาล') || lot.LotName.includes('ตึกแก่น');
    }
    return true;
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50/50 pt-14 pb-20 border-b border-slate-200">
        {/* Subtle Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-gradient-to-tr from-sky-400/15 via-blue-400/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 left-10 w-72 h-72 bg-sky-300/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-blue-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/90 text-sky-800 text-xs font-bold tracking-wide border border-sky-200/90 shadow-xs backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ระบบเช็คช่องว่างและจองที่จอดรถล่วงหน้าแบบ Real-time</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              หมดปัญหาการวนหาที่จอดรถ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                จองล่วงหน้าง่ายๆ สแกนเข้าได้ทันที
              </span>
            </h1>

            {/* Modern Quick Search Bar */}
            <form 
              onSubmit={handleSearchSubmit} 
              className="mt-8 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-sky-600/10 border border-slate-200/90 hover:border-sky-300 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/15 transition-all flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto"
            >
              <div className="flex-1 flex items-center gap-3 px-3.5">
                <Search className="w-5 h-5 text-sky-500 shrink-0" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อห้าง, ลานจอด หรือถนนในขอนแก่น เช่น เซ็นทรัล, แฟรี่..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <InteractiveHoverButton type="submit" text="ค้นหาที่จอดรถ" />
            </form>

            {/* Popular Quick Location Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> ทำเลยอดนิยม:
              </span>
              {popularTags.map(tag => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => handleQuickTagClick(tag.name)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200 hover:border-sky-300 transition-all shadow-xs flex items-center gap-1.5 font-medium group active:scale-95"
                >
                  <span className="text-xs">{tag.emoji}</span>
                  <span className="group-hover:text-sky-700">{tag.name}</span>
                </button>
              ))}
            </div>

            {/* Live Real-time System Highlights Widget */}
            <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-emerald-300 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Car className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight">
                    {totalAvailableSlots > 0 ? `${totalAvailableSlots}+` : 'พร้อมบริการ'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">ช่องว่างพร้อมจองสด</span>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-sky-300 transition-all">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight">
                    {recommendedLots.length || 7} แห่ง
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">ลานจอดตัวเมืองขอนแก่น</span>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-purple-300 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight">
                    E-Ticket
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">สแกน QR เข้าจอดทันที</span>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-amber-300 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight">
                    ล็อคตามเวลา
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">ไม่จองชน ไม่แย่งช่อง</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Recommended Lots Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-bold text-xs tracking-wider uppercase mb-1">
              <MapPin className="w-4 h-4" />
              <span>Khon Kaen Recommended Parking Lots</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              7 ลานจอดรถแนะนำในตัวเมืองขอนแก่น
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              ทำเลสำคัญใจกลางเมืองขอนแก่น ทั้งห้างสรรพสินค้า ศูนย์ไอที ย่านมหาวิทยาลัย และตลาดคนเดินยอดนิยม
            </p>
          </div>

          <Link
            to="/lots"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all group shrink-0"
          >
            <span>ดูลานจอดทั้งหมด</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lots Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLots.map(lot => (
              <div
                key={lot.Lot_ID}
                className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col"
              >
                {/* 16:9 Landscape Real Photo */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={lot.Image_Url}
                    alt={lot.LotName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                    }}
                  />
                  {/* Fee badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-slate-800 shadow-sm border border-white/60">
                    ฿{lot.FeeRate_Per_Hour} <span className="text-[10px] font-normal text-slate-500">/ ชม.</span>
                  </div>
                  {/* Penalty badge */}
                  <div className="absolute top-3 right-3 bg-rose-600/95 backdrop-blur text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-sm">
                    ปรับ 2 เท่าหากเกินเวลา
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-sky-600 transition-colors">
                      {lot.LotName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lot.Location}</span>
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                      {lot.Description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        {formatThai24hTime(lot.OpenTime)} - {formatThai24hTime(lot.CloseTime)}
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ว่าง {lot.available_slots || 0} ช่อง
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={getGoogleMapsUrl(lot.LotName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                        title="เปิด Google Maps นำทาง"
                      >
                        <Navigation className="w-3.5 h-3.5 text-sky-600" />
                        <span>นำทาง</span>
                      </a>
                      <Link
                        to={`/lots/${lot.Lot_ID}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white shadow-xs transition-all duration-200"
                      >
                        <span>ดูแผนผังและจองช่อง</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works (4 steps) */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              จองง่าย 4 ขั้นตอน จอดสบายไร้กังวล
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              กระบวนการอัตโนมัติรวดเร็ว ไม่ต้องรอพนักงานโบกรถหรือเก็บตั๋วกระดาษ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center relative group hover:border-sky-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">เลือกลานและช่องจอด</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ดูสถานะช่องว่างสีเขียวแบบ Real-time ตามวันเวลา ชั้น และโซนที่ต้องการ
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center relative group hover:border-sky-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">ระบุวันเวลาและชำระเงิน</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                เลือกวันที่ เวลาเข้า และจำนวนชั่วโมงจอด ชำระค่าจอดรถล่วงหน้าผ่าน PromptPay QR
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center relative group hover:border-sky-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">รับตั๋ว QR สแกนเข้าจอด</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                เมื่อชำระสำเร็จจะได้รับ E-Ticket QR Code ทันทีเพื่อนำไปสแกนเข้าลานจอด
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center relative group hover:border-sky-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">สแกนออก (ระวังปรับ 2 เท่า)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                สแกนออกตามเวลาที่จองไว้ หากจอดเกินเวลาจะถูกคิดค่าปรับ 2 เท่าของอัตราปกติ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Callouts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-sky-50/70 border border-sky-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">จองล่วงหน้า คิดตามเวลาจริง</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                เลือกวัน เวลาเข้า และระยะเวลาที่ต้องการ ไม่มีจอดฟรีก่อนเวลา และหากจอดเกินเวลาที่จองจะถูกคิดค่าปรับ 2 เท่าอย่างโปร่งใส
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">ระบบ Concurrency ปลอดภัย</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                มี Database Transaction Lock ป้องกันการจองช่องซ้ำซ้อนในเสี้ยววินาที ข้อมูลปลอดภัยด้วยมาตรฐาน JWT & bcrypt
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">เวลาไทย 24 ชั่วโมงแม่นยำ</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ThaiTimePicker กำหนดรูปแบบ 24 ชั่วโมงต่อท้ายด้วย 'น.' แสดงเวลาเปิดปิดและระยะเวลานัดหมายชัดเจน ไม่มีสับสน AM/PM
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
