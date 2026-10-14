import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { ParkingLot, User } from '../types';
import { formatThai24hTime } from '../lib/thai-time';

interface FavoritesProps {
  user: User | null;
}

export function Favorites({ user }: FavoritesProps) {
  const [favorites, setFavorites] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const fetchFavorites = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFavorites(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const removeFavorite = async (lotId: number) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/favorites/${lotId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setFavorites(favorites.filter(l => l.Lot_ID !== lotId));
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
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">ยังไม่มีลานจอดที่บันทึกไว้ในรายการโปรด</p>
          <Link
            to="/lots"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            <span>ค้นหาและกดรูปหัวใจเพื่อบันทึก</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(lot => (
            <div
              key={lot.Lot_ID}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-video w-full">
                <img
                  src={lot.Image_Url}
                  alt={lot.LotName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                  }}
                />
                <button
                  onClick={() => removeFavorite(lot.Lot_ID)}
                  className="absolute top-3 right-3 p-2 bg-white/90 text-rose-600 rounded-xl hover:bg-rose-50 shadow-sm"
                  title="ลบออกจากลานโปรด"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{lot.LotName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{lot.Location}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    {formatThai24hTime(lot.OpenTime)} - {formatThai24hTime(lot.CloseTime)}
                  </span>
                  <Link
                    to={`/lots/${lot.Lot_ID}`}
                    className="px-4 py-2 bg-sky-600 text-white font-semibold text-xs rounded-xl hover:bg-sky-700"
                  >
                    ดูแผนผังและจอง
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
