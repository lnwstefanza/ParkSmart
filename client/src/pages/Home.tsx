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
  CheckCircle2,
  Radio,
  Smartphone,
  Lock,
  Eye,
  Check,
  Heart
} from 'lucide-react';
import { ParkingLot, User } from '../types';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { formatThai24hTime } from '../lib/thai-time';
import { getGoogleMapsUrl } from '../lib/utils';
import { toast } from '../lib/toast';

interface HomeProps {
  user?: User | null;
}

export function Home({ user: propUser }: HomeProps = {}) {
  const [recommendedLots, setRecommendedLots] = useState<ParkingLot[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUser = propUser || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  const fetchFavorites = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setFavorites([]);
      return;
    }

    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: ParkingLot[]) => {
        if (Array.isArray(data)) {
          setFavorites(data.map(l => l.Lot_ID));
        }
      })
      .catch(err => console.error(err));
  };

  const toggleFavorite = async (e: React.MouseEvent, lotId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบก่อนบันทึกลานโปรด');
      return;
    }

    const targetLot = recommendedLots.find(l => l.Lot_ID === lotId);
    const token = localStorage.getItem('token');
    const isFav = favorites.includes(lotId);

    try {
      if (isFav) {
        await fetch(`/api/favorites/${lotId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => prev.filter(id => id !== lotId));
        toast.info(`นำ "${targetLot?.LotName || 'ลานจอด'}" ออกจากรายการโปรดแล้ว`);
      } else {
        await fetch(`/api/favorites/${lotId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => [...prev, lotId]);
        toast.favorite(`บันทึก "${targetLot?.LotName || 'ลานจอด'}" ในรายการโปรดแล้ว ❤️`);
      }
    } catch {
      toast.error('ไม่สามารถอัปเดตรายการโปรดได้');
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [currentUser]);

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
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-600 hover:text-white text-slate-700 border border-slate-200/90 hover:border-sky-500 transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-sky-500/20 hover:-translate-y-1 hover:scale-105 flex items-center gap-1.5 font-medium group active:scale-95 cursor-pointer"
                >
                  <span className="text-xs transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">{tag.emoji}</span>
                  <span className="transition-colors duration-200">{tag.name}</span>
                </button>
              ))}
            </div>

            {/* Live Real-time System Highlights Widget */}
            <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="group bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                  <Car className="w-5 h-5 transition-transform duration-300" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                    {totalAvailableSlots > 0 ? `${totalAvailableSlots}+` : 'พร้อมบริการ'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-800 transition-colors">ช่องว่างพร้อมจองสด</span>
                </div>
              </div>

              <div className="group bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/15 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-sky-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 group-hover:bg-sky-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                  <Building2 className="w-5 h-5 transition-transform duration-300" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight group-hover:text-sky-700 transition-colors">
                    {recommendedLots.length || 7} แห่ง
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-800 transition-colors">ลานจอดตัวเมืองขอนแก่น</span>
                </div>
              </div>

              <div className="group bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                  <QrCode className="w-5 h-5 transition-transform duration-300" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight group-hover:text-purple-700 transition-colors">
                    E-Ticket
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-800 transition-colors">สแกน QR เข้าจอดทันที</span>
                </div>
              </div>

              <div className="group bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                  <ShieldCheck className="w-5 h-5 transition-transform duration-300" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 leading-tight group-hover:text-amber-700 transition-colors">
                    ล็อคตามเวลา
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-800 transition-colors">ไม่จองชน ไม่แย่งช่อง</span>
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
                className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-sky-500/15 hover:border-sky-400 hover:-translate-y-2.5 transition-all duration-300 flex flex-col"
              >
                {/* 16:9 Landscape Real Photo with Hover Effects */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 cursor-pointer">
                  <img
                    src={lot.Image_Url}
                    alt={lot.LotName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                    }}
                  />
                  {/* Fee badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-slate-800 shadow-sm border border-white/60 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-500 transition-all duration-300">
                    ฿{lot.FeeRate_Per_Hour} <span className="text-[10px] font-normal text-slate-500 group-hover:text-sky-100">/ ชม.</span>
                  </div>
                  {/* Penalty badge & Favorite button */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <div className="bg-rose-600/95 backdrop-blur text-white px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm group-hover:scale-105 transition-transform">
                      ปรับ 2 เท่าหากเกินเวลา
                    </div>
                    {(!currentUser || currentUser.role === 'Customer') && (
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, lot.Lot_ID)}
                        className={`p-1.5 rounded-xl backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 active:scale-95 ${
                          favorites.includes(lot.Lot_ID)
                            ? 'bg-rose-50 text-rose-500 border border-rose-200 shadow-rose-200/50'
                            : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white border border-white/60'
                        }`}
                        title={favorites.includes(lot.Lot_ID) ? 'ลบออกจากลานโปรด' : 'บันทึกเป็นลานโปรด'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favorites.includes(lot.Lot_ID) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    )}
                  </div>

                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-sky-600 transition-colors duration-200">
                      {lot.LotName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-sky-500 transition-colors" />
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
                      <span className={`font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition-transform group-hover:scale-105 ${
                        (lot.available_slots || 0) > 8 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                          : (lot.available_slots || 0) > 0 
                          ? 'text-amber-700 bg-amber-50 border-amber-100' 
                          : 'text-rose-700 bg-rose-50 border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (lot.available_slots || 0) > 8 ? 'bg-emerald-500 animate-pulse' : (lot.available_slots || 0) > 0 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {(lot.available_slots || 0) > 0 ? `ว่าง ${lot.available_slots} ช่อง` : 'เต็มแล้ว'}
                      </span>
                    </div>

                    {/* Vacancy Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          (lot.available_slots || 0) > 8 ? 'bg-emerald-500' : (lot.available_slots || 0) > 0 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, ((lot.available_slots || 10) / 20) * 100))}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={getGoogleMapsUrl(lot.LotName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 border border-transparent text-slate-700 transition-all shrink-0 hover:scale-105 active:scale-95"
                        title="เปิด Google Maps นำทาง"
                      >
                        <Navigation className="w-3.5 h-3.5 text-sky-600" />
                        <span>นำทาง</span>
                      </a>
                      <Link
                        to={`/lots/${lot.Lot_ID}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white shadow-xs group-hover:shadow-md group-hover:shadow-sky-600/25 transition-all duration-200"
                      >
                        <span>{currentUser?.role === 'Owner' || currentUser?.role === 'Admin' ? 'ดูแผนผังลานจอด' : 'ดูแผนผังและจองช่อง'}</span>
                        <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interactive Experience Playground Section (Hover Micro-interactions) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 shadow-2xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Interactive Features • เลื่อนเมาส์ชี้เพื่อดูการตอบสนอง</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            เทคโนโลยีอัจฉริยะที่ช่วยให้คุณประหยัดเวลา
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            ทดลองนำเมาส์ชี้เพื่อดูการทำงานของระบบตรวจจับช่องว่าง ตั๋วดิจิทัล และระบบล็อคความปลอดภัย
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Interactive Card 1: Smart Radar Live Sensor */}
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-emerald-400 hover:-translate-y-2.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                  <Radio className="w-6 h-6 transition-transform duration-300" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  เรดาร์เรียลไทม์
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                เรดาร์ตรวจจับช่องว่างสด
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                อัปเดตสถานะช่องจอดรถว่างแบบวินาทีต่อวินาที ไม่ต้องเสี่ยงขับไปแล้วไม่มีที่จอด
              </p>
            </div>

            {/* Interactive Visual Radar Box */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-900 text-white relative overflow-hidden group-hover:bg-slate-950 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>จำลองการตรวจจับ</span>
                <span className="text-emerald-400 font-bold group-hover:underline">อัปเดตทุก 5 วิ</span>
              </div>

              {/* Simulated parking slots grid */}
              <div className="grid grid-cols-4 gap-2 py-2">
                {['A01', 'A02', 'A03', 'A04'].map((code, idx) => (
                  <div
                    key={code}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-black transition-all duration-300 ${
                      idx === 1
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : idx === 3
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/40'
                    }`}
                  >
                    <div>{code}</div>
                    <div className="text-[9px] font-normal opacity-80">
                      {idx === 1 ? 'ไม่ว่าง' : idx === 3 ? 'ติดจอง' : 'ว่าง'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-center text-[10px] text-slate-400 group-hover:text-emerald-300 transition-colors flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>ชี้เมาส์เพื่อจำลองตรวจจับช่องว่าง</span>
              </div>
            </div>
          </div>

          {/* Interactive Card 2: Touchless Digital E-Ticket */}
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-sky-400 hover:-translate-y-2.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:bg-sky-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                  <Smartphone className="w-6 h-6 transition-transform duration-300" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-sky-600" />
                  ไร้สัมผัส 100%
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                E-Ticket QR สแกนเข้าอัตโนมัติ
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                รับตั๋วอิเล็กทรอนิกส์พร้อม QR Code บนมือถือทันที สแกนผ่านไม้กั้นไม่ต้องเปิดกระจกรับบัตร
              </p>
            </div>

            {/* Interactive Digital QR Ticket Mockup */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-sky-900 to-indigo-950 text-white relative overflow-hidden group-hover:shadow-lg group-hover:shadow-sky-500/20 transition-all">
              <div className="flex items-center justify-between text-[11px] text-sky-200 mb-2">
                <span>ตั๋วอิเล็กทรอนิกส์</span>
                <span className="bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full font-mono text-[10px]">
                  #PS-9842
                </span>
              </div>

              {/* QR Preview Box with laser scanner animation */}
              <div className="relative bg-white rounded-xl p-3 flex items-center justify-center gap-3 text-slate-800 shadow-inner group-hover:scale-102 transition-transform">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-sky-500 transition-all">
                  <QrCode className="w-10 h-10 text-white" />
                  {/* Laser scan line effect */}
                  <div className="absolute inset-x-0 h-0.5 bg-sky-400 shadow-lg shadow-sky-400 group-hover:animate-bounce top-1/2" />
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-bold text-slate-900">ช่อง B04 • ชั้น 2</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">เซ็นทรัล ขอนแก่น</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> พร้อมสแกนเข้า
                  </div>
                </div>
              </div>

              <div className="mt-2 text-center text-[10px] text-sky-200 flex items-center justify-center gap-1">
                <span>ชี้เมาส์เพื่อเปิดเลเซอร์สแกนเนอร์</span>
              </div>
            </div>
          </div>

          {/* Interactive Card 3: Concurrency Safety Lock */}
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-2.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                  <Lock className="w-6 h-6 transition-transform duration-300" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  การันตีช่อง 100%
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                ระบบล็อคช่องจอด Concurrency
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ระบบจัดการคิวมาตรฐานสากล ล็อคช่องตามเวลาเสี้ยววินาที ไม่มีการจองซ้อนทับหรือแย่งที่จอดกัน
              </p>
            </div>

            {/* Interactive Safety Lock Visual */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-900 text-white relative overflow-hidden group-hover:bg-slate-950 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>ระดับความปลอดภัย</span>
                <span className="text-indigo-400 font-bold">มาตรฐานระดับองค์กร</span>
              </div>

              <div className="bg-white/10 rounded-xl p-3 space-y-2 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:animate-ping" />
                    สถานะการล็อค
                  </span>
                  <span className="font-bold text-emerald-400 group-hover:scale-105 transition-transform">
                    Locked & Secured ✓
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">อัตราการจองชนกัน:</span>
                  <span className="font-bold text-sky-300">0.00%</span>
                </div>
              </div>

              <div className="mt-2 text-center text-[10px] text-slate-400 group-hover:text-indigo-300 transition-colors flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>ชี้เมาส์เพื่อตรวจสอบระบบป้องกัน</span>
              </div>
            </div>
          </div>
        </div>
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
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm text-center relative group hover:border-sky-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-sky-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-600/30 transition-all duration-300">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-sky-600 transition-colors">เลือกลานและช่องจอด</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ดูสถานะช่องว่างสีเขียวแบบ Real-time ตามวันเวลา ชั้น และโซนที่ต้องการ
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm text-center relative group hover:border-sky-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-sky-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-600/30 transition-all duration-300">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-sky-600 transition-colors">ระบุวันเวลาและชำระเงิน</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                เลือกวันที่ เวลาเข้า และจำนวนชั่วโมงจอด ชำระค่าจอดรถล่วงหน้าผ่าน PromptPay QR
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm text-center relative group hover:border-sky-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-sky-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-600/30 transition-all duration-300">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-sky-600 transition-colors">รับตั๋ว QR สแกนเข้าจอด</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                เมื่อชำระสำเร็จจะได้รับ E-Ticket QR Code ทันทีเพื่อนำไปสแกนเข้าลานจอด
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm text-center relative group hover:border-sky-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 font-black text-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-sky-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-600/30 transition-all duration-300">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-sky-600 transition-colors">สแกนออก (ระวังปรับ 2 เท่า)</h3>
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
          <div className="group p-6 rounded-3xl bg-sky-50/70 border border-sky-100 flex items-start gap-4 hover:bg-white hover:border-sky-300 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/25 group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-sky-700 transition-colors">จองล่วงหน้า คิดตามเวลาจริง</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                เลือกวัน เวลาเข้า และระยะเวลาที่ต้องการ ไม่มีจอดฟรีก่อนเวลา และหากจอดเกินเวลาที่จองจะถูกคิดค่าปรับ 2 เท่าอย่างโปร่งใส
              </p>
            </div>
          </div>

          <div className="group p-6 rounded-3xl bg-blue-50/70 border border-blue-100 flex items-start gap-4 hover:bg-white hover:border-blue-300 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25 group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-blue-700 transition-colors">ระบบ Concurrency ปลอดภัย</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                มี Database Transaction Lock ป้องกันการจองช่องซ้ำซ้อนในเสี้ยววินาที ข้อมูลปลอดภัยด้วยมาตรฐาน JWT & bcrypt
              </p>
            </div>
          </div>

          <div className="group p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-4 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25 group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-700 transition-colors">เวลาไทย 24 ชั่วโมงแม่นยำ</h3>
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
