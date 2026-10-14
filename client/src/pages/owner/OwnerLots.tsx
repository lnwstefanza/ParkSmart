import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { ParkingLot, User } from '../../types';
import { formatThai24hTime } from '../../lib/thai-time';

interface OwnerLotsProps {
  user: User | null;
}

const IMAGE_PRESETS = [
  { name: 'ห้างเซ็นทรัล', url: '/images/lots/central-khonkaen.jpg' },
  { name: 'ตลาดต้นตาล', url: '/images/lots/tontan.jpg' },
  { name: 'อาคารตึกแก่น', url: '/images/lots/the-kaen.jpg' },
  { name: 'โลตัส โนนม่วง', url: '/images/lots/lotus.jpg' },
  { name: 'แฟรี่ พลาซ่า', url: '/images/lots/fairy-plaza.jpg' }
];

export function OwnerLots({ user }: OwnerLotsProps) {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLot, setEditingLot] = useState<ParkingLot | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New lot form state
  const [newLotName, setNewLotName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFreeMin, setNewFreeMin] = useState('0');
  const [newOpen, setNewOpen] = useState('10:00');
  const [newClose, setNewClose] = useState('22:00');
  const [newDailyMax, setNewDailyMax] = useState('200');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('/images/lots/central-khonkaen.jpg');

  // Popup modal for submitted pending lot
  const [pendingNoticeModal, setPendingNoticeModal] = useState<{
    isOpen: boolean;
    lotName: string;
  }>({
    isOpen: false,
    lotName: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLots();
  }, [user]);

  const fetchLots = () => {
    const url = user?.role === 'Owner' && user.id ? `/api/lots?ownerId=${user.id}` : '/api/lots';
    fetch(url)
      .then(res => res.json())
      .then((data: ParkingLot[]) => {
        if (user?.role === 'Owner') {
          setLots(data.filter(l => Number(l.ParkingOwner_ID) === Number(user.id)));
        } else {
          setLots(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      if (isEdit && editingLot) {
        setEditingLot({ ...editingLot, Image_Url: base64Url });
      } else {
        setNewImageUrl(base64Url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLot) return;

    const token = localStorage.getItem('token');
    await fetch(`/api/owner/lots/${editingLot.Lot_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        lotName: editingLot.LotName,
        location: editingLot.Location,
        openTime: editingLot.OpenTime,
        closeTime: editingLot.CloseTime,
        feeRatePerHour: editingLot.FeeRate_Per_Hour,
        freeMinutes: editingLot.Free_Minutes,
        dailyMaxFee: editingLot.Daily_Max_Fee,
        description: editingLot.Description,
        imageUrl: editingLot.Image_Url
      })
    });

    setEditingLot(null);
    fetchLots();
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const res = await fetch('/api/owner/lots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        lotName: newLotName,
        location: newLocation,
        district: 'อ.เมืองขอนแก่น',
        openTime: newOpen,
        closeTime: newClose,
        feeRatePerHour: Number(newFeeRate),
        freeMinutes: Number(newFreeMin),
        dailyMaxFee: Number(newDailyMax),
        description: newDesc,
        imageUrl: newImageUrl || '/images/lots/central-khonkaen.jpg'
      })
    });

    const data = await res.json();
    const savedName = newLotName;

    setShowAddModal(false);
    // Reset form
    setNewLotName('');
    setNewLocation('');
    setNewFeeRate('20');
    setNewFreeMin('0');
    setNewOpen('10:00');
    setNewClose('22:00');
    setNewDailyMax('200');
    setNewDesc('');
    setNewImageUrl('/images/lots/central-khonkaen.jpg');

    if (data.success) {
      setPendingNoticeModal({
        isOpen: true,
        lotName: savedName
      });
    }

    fetchLots();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            จัดการลานจอดรถของคุณ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            เพิ่มลานจอดรถใหม่ อัปโหลดรูปภาพสถานที่ และติดตามสถานะการอนุมัติจากผู้ดูแลระบบ
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มลานจอดใหม่</span>
        </button>
      </div>

      {loading ? (
        <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
      ) : lots.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-700 font-bold text-sm">ไม่พบลานจอดรถภายใต้บัญชีนี้</p>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            คุณยังไม่มีลานจอดรถที่ลงทะเบียนไว้ สามารถเริ่มต้นสร้างลานจอดรถและช่องจอดได้ทันที
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มลานจอดใหม่ของคุณ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map(lot => (
            <div key={lot.Lot_ID} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Image */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={lot.Image_Url || '/images/lots/central-khonkaen.jpg'}
                    alt={lot.LotName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                    }}
                  />
                  {/* Status Overlay Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {lot.ParkingLot_Status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        <Clock className="w-3 h-3" />
                        รอการอนุมัติจาก Admin
                      </span>
                    )}
                    {lot.ParkingLot_Status === 'Active' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        อนุมัติแล้ว (เปิดบริการ)
                      </span>
                    )}
                    {lot.ParkingLot_Status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1 bg-rose-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        <XCircle className="w-3 h-3" />
                        ไม่อนุมัติ (ถูกปฏิเสธ)
                      </span>
                    )}
                    {lot.ParkingLot_Status === 'Suspended' && (
                      <span className="inline-flex items-center gap-1 bg-slate-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        <AlertCircle className="w-3 h-3" />
                        ระงับบริการ
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Location */}
                <div>
                  <h3 className="font-bold text-base text-slate-900">{lot.LotName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lot.Location}</span>
                  </p>
                </div>

                {/* Notice message for Pending & Rejected */}
                {lot.ParkingLot_Status === 'Pending' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>คำขอนี้อยู่ระหว่างรอผู้ดูแลระบบตรวจสอบและอนุมัติ เมื่ออนุมัติแล้วจะเปิดให้ลูกค้าเข้าจองทันที</span>
                  </div>
                )}

                {lot.ParkingLot_Status === 'Rejected' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>คำขอนี้ไม่ผ่านการอนุมัติ คุณสามารถแก้ไขข้อมูลและส่งใหม่อีกครั้งได้</span>
                  </div>
                )}

                {/* Rates & Operating Info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">อัตราค่าจอด:</span>
                    <span className="font-bold text-sky-700">฿{lot.FeeRate_Per_Hour}/ชม.</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">นโยบายจอดฟรี:</span>
                    <span className="font-bold text-amber-600">ไม่มีจอดฟรี (0 นาที)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เวลาทำการ:</span>
                    <span className="font-semibold text-slate-700">
                      {formatThai24hTime(lot.OpenTime)} - {formatThai24hTime(lot.CloseTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เพดานค่าจอดต่อวัน:</span>
                    <span className="font-bold text-slate-700">฿{lot.Daily_Max_Fee}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setEditingLot(lot)}
                  className="w-full py-2 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลลานจอด</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submitted Pending Notice Popup */}
      {pendingNoticeModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-slate-100">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                ส่งคำขอเพิ่มลานจอดรถเรียบร้อยแล้ว
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ลานจอดรถ <strong className="text-slate-900 font-bold">"{pendingNoticeModal.lotName}"</strong> ถูกสร้างในระบบแล้ว ขณะนี้มีสถานะ:
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                รอการอนุมัติจาก Admin (Pending)
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                ผู้ดูแลระบบ (Admin) จะทำการตรวจสอบข้อมูล หากได้รับการอนุมัติ ลานจอดจะเปิดให้บริการบนหน้าแอปพลิเคชันโดยอัตโนมัติ
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPendingNoticeModal({ isOpen: false, lotName: '' })}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">แก้ไขข้อมูลลาน: {editingLot.LotName}</h2>
              <button
                onClick={() => setEditingLot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLot} className="space-y-4 text-xs">
              {/* Image Preview & Upload */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">รูปภาพสถานที่</label>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={editingLot.Image_Url || '/images/lots/central-khonkaen.jpg'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileChange(e, true)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    <span>เลือกรูปภาพจากเครื่อง</span>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="หรือระบุ URL รูปภาพ (เช่น /images/lots/...)"
                    value={editingLot.Image_Url}
                    onChange={e => setEditingLot({ ...editingLot, Image_Url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อลานจอด</label>
                <input
                  type="text"
                  required
                  value={editingLot.LotName}
                  onChange={e => setEditingLot({ ...editingLot, LotName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สถานที่ตั้ง</label>
                <input
                  type="text"
                  required
                  value={editingLot.Location}
                  onChange={e => setEditingLot({ ...editingLot, Location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อัตราค่าบริการ (บาท/ชม.)</label>
                  <input
                    type="number"
                    value={editingLot.FeeRate_Per_Hour}
                    onChange={e => setEditingLot({ ...editingLot, FeeRate_Per_Hour: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เพดานค่าจอดต่อวัน (บาท)</label>
                  <input
                    type="number"
                    value={editingLot.Daily_Max_Fee}
                    onChange={e => setEditingLot({ ...editingLot, Daily_Max_Fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลาเปิด (เช่น 10:00)</label>
                  <input
                    type="text"
                    value={editingLot.OpenTime}
                    onChange={e => setEditingLot({ ...editingLot, OpenTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลาปิด (เช่น 22:00)</label>
                  <input
                    type="text"
                    value={editingLot.CloseTime}
                    onChange={e => setEditingLot({ ...editingLot, CloseTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={editingLot.Description}
                  onChange={e => setEditingLot({ ...editingLot, Description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLot(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">เพิ่มลานจอดรถใหม่</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLot} className="space-y-4 text-xs">
              {/* Image Upload & Selection Section */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  รูปภาพสถานที่ <span className="text-sky-600 font-normal">(อัปโหลดไฟล์ หรือเลือกรูปภาพ)</span>
                </label>

                {/* Preview Box */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                  <img
                    src={newImageUrl || '/images/lots/central-khonkaen.jpg'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lots/central-khonkaen.jpg';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[10px]">
                    ตัวอย่างรูปภาพที่จะแสดง
                  </div>
                </div>

                {/* File picker button */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileChange(e, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    <span>เลือกรูปภาพจากเครื่อง</span>
                  </button>
                </div>

                {/* Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">หรือเลือกภาพสำเร็จรูป:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {IMAGE_PRESETS.map(preset => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setNewImageUrl(preset.url)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border ${
                          newImageUrl === preset.url
                            ? 'bg-sky-50 border-sky-400 text-sky-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct URL input */}
                <div>
                  <input
                    type="text"
                    placeholder="หรือระบุ URL รูปภาพ เช่น https://..."
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อลานจอดรถ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น อู่ฟู่, ลานจอดเซ็นทรัล โซนใหม่"
                  value={newLotName}
                  onChange={e => setNewLotName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งที่ตั้ง</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 456 หมู่ 12 ถ.มิตรภาพ ต.เมืองเก่า อ.เมืองขอนแก่น"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ค่าบริการ (บาท/ชม.)</label>
                  <input
                    type="number"
                    value={newFeeRate}
                    onChange={e => setNewFeeRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จอดฟรี (นาที - ค่ามาตรฐาน 0)</label>
                  <input
                    type="number"
                    value={newFreeMin}
                    onChange={e => setNewFreeMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลาเปิด (เช่น 10:00)</label>
                  <input
                    type="text"
                    value={newOpen}
                    onChange={e => setNewOpen(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลาปิด (เช่น 22:00)</label>
                  <input
                    type="text"
                    value={newClose}
                    onChange={e => setNewClose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เพดานค่าจอดต่อวัน (บาท)</label>
                <input
                  type="number"
                  value={newDailyMax}
                  onChange={e => setNewDailyMax(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>เงื่อนไขการอนุมัติ:</strong> เมื่อกดส่งคำขอ ลานจอดจะอยู่ในสถานะ <strong>"รอการอนุมัติจาก Admin"</strong> และจะเปิดให้ลูกค้าเข้าจองได้หลังจาก Admin ตรวจสอบและกดอนุมัติเรียบร้อยแล้ว
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md transition"
                >
                  ส่งคำขอสร้างลานจอดรถ (พร้อม 20 ช่องแรก)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
