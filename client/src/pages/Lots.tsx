import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Clock, Heart, Filter, ChevronRight, Navigation, ArrowUpDown, X, Sparkles } from 'lucide-react';
import { ParkingLot, User } from '../types';
import { formatThai24hTime } from '../lib/thai-time';
import { getGoogleMapsUrl } from '../lib/utils';
import { toast } from '../lib/toast';

interface LotsProps {
  user: User | null;
}

export function Lots({ user }: LotsProps) {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('search') || '';
  const districtFilter = searchParams.get('district') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [sortBy, setSortBy] = useState<'recommended' | 'available_desc' | 'price_asc' | 'price_desc' | 'name'>('recommended');

  useEffect(() => {
    fetchLots();
    if (user?.role === 'Customer') {
      fetchFavorites();
    }
  }, [query, districtFilter]);

  const fetchLots = () => {
    setLoading(true);
    let url = '/api/lots?';
    if (query) url += `search=${encodeURIComponent(query)}&`;
    if (districtFilter) url += `district=${encodeURIComponent(districtFilter)}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setLots(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lots:', err);
        setLoading(false);
      });
  };

  const fetchFavorites = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: ParkingLot[]) => {
        setFavorites(data.map(l => l.Lot_ID));
      })
      .catch(err => console.error(err));
  };

  const toggleFavorite = async (e: React.MouseEvent, lotId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนบันทึกลานโปรด');
      return;
    }

    const targetLot = lots.find(l => l.Lot_ID === lotId);
    const token = localStorage.getItem('token');
    const isFav = favorites.includes(lotId);

    try {
      if (isFav) {
        await fetch(`/api/favorites/${lotId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(favorites.filter(id => id !== lotId));
        toast.info(`นำ "${targetLot?.LotName || 'ลานจอด'}" ออกจากรายการโปรดแล้ว`);
      } else {
        await fetch(`/api/favorites/${lotId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites([...favorites, lotId]);
        toast.favorite(`บันทึก "${targetLot?.LotName || 'ลานจอด'}" ในรายการโปรดแล้ว ❤️`);
      }
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถบันทึกรายการโปรดได้');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: searchInput, district: districtFilter });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setSortBy('recommended');
  };

  // Sorted lots
  const sortedLots = [...lots].sort((a, b) => {
    if (sortBy === 'available_desc') return (b.available_slots || 0) - (a.available_slots || 0);
    if (sortBy === 'price_asc') return a.FeeRate_Per_Hour - b.FeeRate_Per_Hour;
    if (sortBy === 'price_desc') return b.FeeRate_Per_Hour - a.FeeRate_Per_Hour;
    if (sortBy === 'name') return a.LotName.localeCompare(b.LotName, 'th');
    return 0; // recommended
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-sky-700 tracking-wide uppercase">Smart Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          ค้นหาลานจอดรถในขอนแก่น
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ตรวจสอบความพร้อมของช่องจอดแบบเรียลไทม์ อัตราค่าบริการ และแผนผังก่อนเดินทาง
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลาน, สถานที่สำคัญ หรือย่านในขอนแก่น..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams({ search: '', district: districtFilter });
                }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 active:scale-95 transition-all shadow-sm"
          >
            ค้นหา
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* District filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={districtFilter}
              onChange={e => setSearchParams({ search: query, district: e.target.value })}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="">ทุกอำเภอ / ทุกโซน</option>
              <option value="อ.เมืองขอนแก่น">อ.เมืองขอนแก่น</option>
              <option value="กังสดาล">ย่านกังสดาล (มข.)</option>
              <option value="ศรีจันทร์">ถนนศรีจันทร์</option>
              <option value="มิตรภาพ">ถนนมิตรภาพ</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="recommended">เรียง: แนะนำ</option>
              <option value="available_desc">เรียง: ช่องว่างมากสุด</option>
              <option value="price_asc">เรียง: ราคาถูกสุด</option>
              <option value="price_desc">เรียง: ราคาสูงสุด</option>
              <option value="name">เรียง: ชื่อ ก-ฮ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips & Summary */}
      {(query || districtFilter || sortBy !== 'recommended') && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 font-medium">ตัวกรองที่ใช้งาน:</span>
          {query && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold">
              ค้นหา: "{query}"
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchParams({ search: '', district: districtFilter });
                }}
                className="hover:text-sky-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {districtFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold">
              โซน: {districtFilter}
              <button
                onClick={() => setSearchParams({ search: query, district: '' })}
                className="hover:text-sky-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {sortBy !== 'recommended' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold">
              เรียง: {sortBy === 'available_desc' ? 'ช่องว่างมากสุด' : sortBy === 'price_asc' ? 'ราคาถูกสุด' : sortBy === 'price_desc' ? 'ราคาสูงสุด' : 'ชื่อ ก-ฮ'}
              <button onClick={() => setSortBy('recommended')} className="hover:text-slate-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 ml-1"
          >
            ล้างตัวกรองทั้งหมด
          </button>
          <span className="ml-auto text-xs text-slate-400">
            พบ {sortedLots.length} แห่ง
          </span>
        </div>
      )}

      {/* Lots Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : lots.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-base">ไม่พบลานจอดรถตามคำค้นหา</p>
          <button
            onClick={() => {
              setSearchInput('');
              setSearchParams({});
            }}
            className="mt-3 text-sm text-sky-600 font-semibold hover:underline"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedLots.map(lot => {
            const isFav = favorites.includes(lot.Lot_ID);
            const avail = lot.available_slots || 0;
            return (
              <div
                key={lot.Lot_ID}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col"
              >
                {/* 16:9 Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={lot.Image_Url}
                    alt={lot.LotName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm border border-white/50 flex items-center gap-1">
                    <span>฿{lot.FeeRate_Per_Hour}</span>
                    <span className="text-[10px] text-slate-500 font-normal">/ ชม.</span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <div className="bg-amber-500/95 backdrop-blur text-white px-2 py-0.5 rounded-lg text-[11px] font-semibold shadow-sm">
                      ปรับ 2 เท่า หากจอดเกินเวลา
                    </div>
                    {user?.role === 'Customer' && (
                      <button
                        onClick={(e) => toggleFavorite(e, lot.Lot_ID)}
                        className={`p-1.5 rounded-xl backdrop-blur-md shadow-sm transition-all ${
                          isFav
                            ? 'bg-rose-50 text-rose-500 border border-rose-200 shadow-sm'
                            : 'bg-white/80 text-slate-600 hover:text-rose-500 border border-white/50'
                        }`}
                        title={isFav ? 'ลบออกจากลานโปรด' : 'บันทึกเป็นลานโปรด'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors">
                        {lot.LotName}
                      </h3>
                      <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {lot.District || 'ขอนแก่น'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lot.Location}</span>
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                      {lot.Description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {/* Time & Slot Count */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        {formatThai24hTime(lot.OpenTime)} - {formatThai24hTime(lot.CloseTime)}
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded-md border ${
                        avail === 0
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : avail < 5
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        ว่าง {avail} ช่อง
                      </span>
                    </div>

                    {/* Vacancy Progress Meter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">ระดับความหนาแน่น</span>
                        <span className={`font-semibold ${
                          avail === 0
                            ? 'text-rose-600'
                            : avail < 5
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          {avail === 0 ? 'เต็มแล้ว' : avail < 5 ? 'ใกล้เต็ม' : 'ว่างสบาย'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            avail === 0
                              ? 'bg-rose-500 w-full'
                              : avail < 5
                              ? 'bg-amber-500 w-3/4'
                              : 'bg-emerald-500 w-1/3'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={getGoogleMapsUrl(lot.LotName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                        title="เปิด Google Maps นำทาง"
                      >
                        <Navigation className="w-3.5 h-3.5 text-sky-600" />
                        <span>เส้นทาง</span>
                      </a>
                      <Link
                        to={`/lots/${lot.Lot_ID}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-all duration-200 shadow-2xs"
                      >
                        <span>ดูแผนผังและจอง</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
