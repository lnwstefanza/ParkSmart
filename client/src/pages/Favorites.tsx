import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, ChevronRight, Trash2, Navigation, Sparkles } from 'lucide-react';
import { ParkingLot, User } from '../types';
import { formatThai24hTime } from '../lib/thai-time';
import { getGoogleMapsUrl } from '../lib/utils';
import { toast } from '../lib/toast';

interface FavoritesProps {
  user: User | null;
}

export function Favorites({ user }: FavoritesProps) {
  const [favorites, setFavorites] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // ดึงข้อมูลลานโปรดและข้อมูลลานจอดทั้งหมดพร้อมกันเพื่อให้จำนวนที่ว่างเชื่อมโยงกับหน้าแรกแบบเรียลไทม์
      const [favRes, lotsRes] = await Promise.all([
        fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/lots')
      ]);

      const favData = await favRes.json();
      let lotsData: ParkingLot[] = [];
      try {
        lotsData = await lotsRes.json();
      } catch (_) {}

      const lotsMap = new Map<number, ParkingLot>();
      if (Array.isArray(lotsData)) {
        lotsData.forEach(l => {
          if (l && l.Lot_ID) lotsMap.set(Number(l.Lot_ID), l);
        });
      }

      if (Array.isArray(favData)) {
        const enriched = favData.map((favLot: ParkingLot) => {
          const mainLot = lotsMap.get(Number(favLot.Lot_ID));
          const available = mainLot?.available_slots !== undefined 
            ? mainLot.available_slots 
            : (favLot.available_slots !== undefined ? favLot.available_slots : 0);
          const total = mainLot?.total_slots !== undefined 
            ? mainLot.total_slots 
            : (favLot.total_slots || 10);

          return {
            ...favLot,
            available_slots: available,
            total_slots: total,
            occupied_slots: mainLot?.occupied_slots ?? favLot.occupied_slots,
            FeeRate_Per_Hour: mainLot?.FeeRate_Per_Hour ?? favLot.FeeRate_Per_Hour,
            OpenTime: mainLot?.OpenTime || favLot.OpenTime,
            CloseTime: mainLot?.CloseTime || favLot.CloseTime,
            Image_Url: mainLot?.Image_Url || favLot.Image_Url,
            Location: mainLot?.Location || favLot.Location,
            LotName: mainLot?.LotName || favLot.LotName,
          };
        });
        setFavorites(enriched);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (lotId: number) => {
    const target = favorites.find(l => l.Lot_ID === lotId);
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/favorites/${lotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(favorites.filter(l => l.Lot_ID !== lotId));
      toast.info(`ลบ "${target?.LotName || 'ลานจอด'}" ออกจากรายการโปรดแล้ว`);
    } catch {
      toast.error('ไม่สามารถลบรายการโปรดได้');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
          ลานจอดรถที่บันทึกเป็นรายการโปรด
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          เข้าถึงลานจอดรถที่คุณใช้งานเป็นประจำเพื่อเช็คช่องว่างและจองได้รวดเร็วทันใจ
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-400 border border-rose-100 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-slate-900 font-bold text-lg">ยังไม่มีลานจอดที่บันทึกไว้</h3>
          <p className="text-slate-500 text-sm mt-1">กดไอคอนหัวใจที่ลานจอดเพื่อบันทึกลานที่คุณมาบ่อยๆ ไว้นะครับ</p>
          <Link
            to="/lots"
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
          >
            <span>ค้นหาลานจอดเลย</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.filter(l => l && l.Lot_ID).map(lot => {
            const avail = lot.available_slots || 0;
            const total = lot.total_slots || 10;
            return (
              <div
                key={lot.Lot_ID}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                  <img
                    src={lot.Image_Url || '/images/lots/central-khonkaen.jpg'}
                    alt={lot.LotName || 'ลานจอดรถ'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                    }}
                  />
                  {lot.FeeRate_Per_Hour && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm border border-white/50">
                      ฿{lot.FeeRate_Per_Hour} / ชม.
                    </div>
                  )}
                  <button
                    onClick={() => removeFavorite(lot.Lot_ID)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur text-rose-600 rounded-xl hover:bg-rose-50 shadow-sm border border-white/60 transition-colors"
                    title="ลบออกจากลานโปรด"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors">
                      {lot.LotName || 'ลานจอดรถ ParkSmart'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lot.Location || 'ขอนแก่น'}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        {formatThai24hTime(lot.OpenTime || '06:00')} - {formatThai24hTime(lot.CloseTime || '22:00')}
                      </span>
                      <span className={`font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition-transform ${
                        avail > 8
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : avail > 0
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          avail > 8 ? 'bg-emerald-500 animate-pulse' : avail > 0 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {avail > 0 ? `ว่าง ${avail} ช่อง` : 'เต็มแล้ว (0 ช่อง)'}
                      </span>
                    </div>

                    {/* Vacancy Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          avail > 8 ? 'bg-emerald-500' : avail > 0 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, (avail / total) * 100))}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={getGoogleMapsUrl(lot.LotName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                        title="เปิด Google Maps นำทาง"
                      >
                        <Navigation className="w-3.5 h-3.5 text-sky-600" />
                        <span>เส้นทาง</span>
                      </a>
                      <Link
                        to={`/lots/${lot.Lot_ID}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white font-semibold text-xs rounded-xl transition-all shadow-2xs"
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
