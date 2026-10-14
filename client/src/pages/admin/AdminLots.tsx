import { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Star,
  StarOff,
  MapPin,
  Trash2,
  Clock,
  AlertCircle,
  Search,
  User,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { ParkingLot } from '../../types';
import { formatThai24hTime } from '../../lib/thai-time';

export function AdminLots() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Active' | 'Rejected' | 'Suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [lotToDelete, setLotToDelete] = useState<ParkingLot | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchLots();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchLots = () => {
    fetch('/api/lots?status=all')
      .then(res => res.json())
      .then(data => {
        setLots(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleStatusChange = async (lotId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/lots/${lotId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          newStatus === 'Active'
            ? 'อนุมัติเปิดให้บริการลานจอดรถเรียบร้อยแล้ว'
            : newStatus === 'Rejected'
            ? 'ปฏิเสธคำขอ (ไม่อนุมัติ) ลานจอดรถเรียบร้อย'
            : 'อัปเดตสถานะลานจอดเรียบร้อยแล้ว',
          'success'
        );
        fetchLots();
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleRecommend = async (lotId: number, currentRec: number) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/lots/${lotId}/recommend`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isRecommended: !currentRec, order: 1 })
    });
    fetchLots();
  };

  const handleDeleteConfirm = async () => {
    if (!lotToDelete) return;
    setDeleteLoading(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/lots/${lotToDelete.Lot_ID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`ลบลานจอดรถ "${lotToDelete.LotName}" สำเร็จแล้ว`, 'success');
        setLotToDelete(null);
        fetchLots();
      } else {
        showToast(data.error || 'ไม่สามารถลบลานจอดรถได้', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter lots
  const filteredLots = lots.filter(lot => {
    if (statusFilter !== 'all' && lot.ParkingLot_Status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lot.LotName?.toLowerCase().includes(q);
      const matchLoc = lot.Location?.toLowerCase().includes(q);
      const matchOwner = (
        (lot.OwnerFName || '') + ' ' + (lot.OwnerLName || '') + ' ' + (lot.OwnerUsername || '')
      ).toLowerCase().includes(q);
      return matchName || matchLoc || matchOwner;
    }
    return true;
  });

  const pendingCount = lots.filter(l => l.ParkingLot_Status === 'Pending').length;
  const activeCount = lots.filter(l => l.ParkingLot_Status === 'Active').length;
  const rejectedCount = lots.filter(l => l.ParkingLot_Status === 'Rejected').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg">
              Admin Console
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                มี {pendingCount} ลานจอดรอการอนุมัติ
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
            ตรวจสอบและอนุมัติลานจอดรถ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            พิจารณาอนุมัติคำขอเพิ่มลานจอดรถของเจ้าของลาน (Owner) จัดการระงับบริการ หรือลบลานจอดออกจากระบบ
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl transition ${
              statusFilter === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({lots.length})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              statusFilter === 'Pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>รอการอนุมัติ</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px]">
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3.5 py-2 rounded-xl transition ${
              statusFilter === 'Active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            เปิดใช้งาน ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3.5 py-2 rounded-xl transition ${
              statusFilter === 'Rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            ไม่อนุมัติ ({rejectedCount})
          </button>
          <button
            onClick={() => setStatusFilter('Suspended')}
            className={`px-3.5 py-2 rounded-xl transition ${
              statusFilter === 'Suspended'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ระงับบริการ
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อลาน, ทำเล, เจ้าของ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500 bg-slate-50/70 focus:bg-white"
          />
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
      ) : filteredLots.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-2">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-bold text-sm">ไม่พบลานจอดรถตามเงื่อนไขที่เลือก</p>
          <p className="text-slate-400 text-xs">ลองเปลี่ยนแท็บสถานะหรือคำค้นหา</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">ลานจอดรถ</th>
                  <th className="py-3.5 px-4">เจ้าของลาน (Owner)</th>
                  <th className="py-3.5 px-4">ทำเลที่ตั้ง</th>
                  <th className="py-3.5 px-4">ค่าบริการ/เวลาทำการ</th>
                  <th className="py-3.5 px-4 text-center">ช่องจอด</th>
                  <th className="py-3.5 px-4 text-center">ลานแนะนำ</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLots.map(lot => (
                  <tr key={lot.Lot_ID} className="hover:bg-slate-50/60 transition-colors">
                    {/* Lot Name & Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={lot.Image_Url || '/images/lots/central-khonkaen.jpg'}
                            alt={lot.LotName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {lot.LotName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            รหัสลาน: #{lot.Lot_ID}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">
                            {lot.OwnerFName ? `${lot.OwnerFName} ${lot.OwnerLName || ''}` : `Owner #${lot.ParkingOwner_ID}`}
                          </div>
                          {lot.OwnerUsername && (
                            <div className="text-[11px] text-slate-400">
                              @{lot.OwnerUsername}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">
                        {lot.Location}
                      </p>
                    </td>

                    {/* Fee & Operating Hours */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sky-700">
                        ฿{lot.FeeRate_Per_Hour}/ชม.
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatThai24hTime(lot.OpenTime)} - {formatThai24hTime(lot.CloseTime)}
                      </div>
                    </td>

                    {/* Slots Count */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {lot.total_slots || 0} ช่อง
                    </td>

                    {/* Featured / Recommended */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleRecommend(lot.Lot_ID, lot.Is_Recommended)}
                        title={lot.Is_Recommended ? 'คลิกเพื่อยกเลิกลานแนะนำ' : 'คลิกเพื่อตั้งเป็นลานแนะนำ'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          lot.Is_Recommended
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {lot.Is_Recommended ? (
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5" />
                        )}
                        <span>{lot.Is_Recommended ? 'แนะนำ' : 'ทั่วไป'}</span>
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {lot.ParkingLot_Status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[10px] border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          รอการอนุมัติ
                        </span>
                      )}
                      {lot.ParkingLot_Status === 'Active' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          อนุมัติแล้ว (Active)
                        </span>
                      )}
                      {lot.ParkingLot_Status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold text-[10px] border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          ไม่อนุมัติ (Rejected)
                        </span>
                      )}
                      {lot.ParkingLot_Status === 'Suspended' && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold text-[10px] border border-slate-200">
                          <AlertCircle className="w-3 h-3 text-slate-500" />
                          ระงับบริการ
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                        {/* If Pending: Show Approve and Reject buttons */}
                        {lot.ParkingLot_Status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(lot.Lot_ID, 'Active')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>อนุมัติ</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(lot.Lot_ID, 'Rejected')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-xs transition border border-rose-200"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>ไม่อนุมัติ</span>
                            </button>
                          </>
                        )}

                        {/* If Active: Show Suspend button */}
                        {lot.ParkingLot_Status === 'Active' && (
                          <button
                            onClick={() => handleStatusChange(lot.Lot_ID, 'Suspended')}
                            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl font-semibold text-xs border border-amber-200 transition"
                          >
                            ระงับบริการ
                          </button>
                        )}

                        {/* If Suspended or Rejected: Show Activate / Re-approve button */}
                        {(lot.ParkingLot_Status === 'Suspended' || lot.ParkingLot_Status === 'Rejected') && (
                          <button
                            onClick={() => handleStatusChange(lot.Lot_ID, 'Active')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold text-xs border border-emerald-200 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>อนุมัติเปิดบริการ</span>
                          </button>
                        )}

                        {/* Delete Lot Button for ALL lots */}
                        <button
                          onClick={() => setLotToDelete(lot)}
                          title="ลบลานจอดรถนี้"
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {lotToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                ยืนยันการลบลานจอดรถ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบลานจอดรถ{' '}
                <strong className="text-slate-900 font-bold">"{lotToDelete.LotName}"</strong>?
              </p>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-left text-[11px] text-rose-800 space-y-1">
                <div>• เจ้าของลาน: <strong>{lotToDelete.OwnerFName || 'Owner'} {lotToDelete.OwnerLName || ''}</strong></div>
                <div>• จำนวนช่องจอดที่จะถูกลบ: <strong>{lotToDelete.total_slots || 0} ช่อง</strong></div>
                <div className="text-rose-600 font-semibold mt-1">⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลลานและช่องจอดจะถูกลบออกจากฐานข้อมูลอย่างถาวร</div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setLotToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {deleteLoading ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
