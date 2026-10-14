import { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  CheckCircle2, 
  Ban, 
  Search, 
  Car, 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle,
  Lock,
  User as UserIcon,
  Phone,
  Mail
} from 'lucide-react';
import { formatThaiDateTime } from '../../lib/thai-time';

export function AdminUsers() {
  const [users, setUsers] = useState<{ customers: any[]; owners: any[] }>({ customers: [], owners: [] });
  const [activeTab, setActiveTab] = useState<'customers' | 'owners'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    password: '',
    fname: '',
    lname: '',
    phone: '',
    email: ''
  });
  const [addError, setAddError] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Customer Modal
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    fname: '',
    lname: '',
    phone: '',
    email: '',
    password: ''
  });
  const [editError, setEditError] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Customer Modal
  const [deletingCustomer, setDeletingCustomer] = useState<any | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Feedback Notification Modal
  const [alertNotice, setAlertNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers({
          customers: Array.isArray(data.customers) ? data.customers : [],
          owners: Array.isArray(data.owners) ? data.owners : []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleToggleStatus = async (role: string, id: number, currentStatus: string, username: string) => {
    const actionText = currentStatus === 'Active' ? 'ระงับบัญชี' : 'ปลดการระงับบัญชี';
    if (!confirm(`คุณต้องการ${actionText}ผู้ใช้ "${username}" ใช่หรือไม่?`)) return;

    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/admin/users/${role}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const d = await res.json();
        alert(d.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Customer Handler
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!addForm.username || !addForm.password || !addForm.fname || !addForm.lname) {
      setAddError('กรุณากรอก Username, Password, ชื่อ และนามสกุลให้ครบถ้วน');
      return;
    }

    setIsSubmittingAdd(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      setIsSubmittingAdd(false);

      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ username: '', password: '', fname: '', lname: '', phone: '', email: '' });
        setAlertNotice({ title: 'สำเร็จ', message: 'เพิ่มบัญชีลูกค้าใหม่เรียบร้อยแล้ว', type: 'success' });
        fetchUsers();
      } else {
        setAddError(data.error || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลลูกค้า');
      }
    } catch (err: any) {
      setIsSubmittingAdd(false);
      setAddError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Open Edit Customer Modal
  const handleOpenEdit = (customer: any) => {
    setEditingCustomer(customer);
    setEditForm({
      fname: customer.FName || '',
      lname: customer.LName || '',
      phone: customer.Phone_Number || '',
      email: customer.Email || '',
      password: ''
    });
    setEditError('');
  };

  // Edit Customer Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditError('');

    if (!editForm.fname || !editForm.lname) {
      setEditError('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    setIsSubmittingEdit(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      setIsSubmittingEdit(false);

      if (res.ok) {
        setEditingCustomer(null);
        setAlertNotice({ title: 'สำเร็จ', message: 'แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว', type: 'success' });
        fetchUsers();
      } else {
        setEditError(data.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      }
    } catch (err: any) {
      setIsSubmittingEdit(false);
      setEditError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Delete Customer Handler
  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsSubmittingDelete(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/admin/customers/${deletingCustomer.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setIsSubmittingDelete(false);

      if (res.ok) {
        setDeletingCustomer(null);
        setAlertNotice({ title: 'สำเร็จ', message: 'ลบบัญชีลูกค้าเรียบร้อยแล้ว', type: 'success' });
        fetchUsers();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบบัญชี');
      }
    } catch (err: any) {
      setIsSubmittingDelete(false);
      alert(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const currentList = activeTab === 'customers' ? users.customers : users.owners;
  const filteredList = currentList.filter(u => {
    const q = searchTerm.toLowerCase();
    const fullName = `${u.FName || ''} ${u.LName || ''}`.toLowerCase();
    const username = (u.Username || '').toLowerCase();
    const phone = (u.Phone_Number || '').toLowerCase();
    const email = (u.Email || '').toLowerCase();
    return username.includes(q) || fullName.includes(q) || phone.includes(q) || email.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            จัดการบัญชีสมาชิก (Users & Accounts)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบ เพิ่ม แก้ไข และจัดการรายชื่อลูกค้าและเจ้าของลานจอดในระบบ
          </p>
        </div>

        {/* Action Button & Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'customers' && (
            <button
              onClick={() => {
                setAddForm({ username: '', password: '', fname: '', lname: '', phone: '', email: '' });
                setAddError('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มบัญชีลูกค้า</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Users className="w-4 h-4 text-sky-600" />
            <span>ลูกค้า: {users.customers.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>เจ้าของลาน: {users.owners.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>บัญชีลูกค้า ({users.customers.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('owners'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'owners'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>บัญชีเจ้าของลาน ({users.owners.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-สกุล, เบอร์โทร..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500 bg-white"
          />
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <div className="text-sm font-bold text-slate-600">
            {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีข้อมูลบัญชีผู้ใช้ในหมวดนี้'}
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-sky-600 hover:underline font-semibold"
            >
              ล้างคำค้นหา
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">#ID</th>
                  <th className="py-3.5 px-4">ชื่อผู้ใช้ (Username)</th>
                  <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3.5 px-4">อีเมล</th>
                  {activeTab === 'customers' ? (
                    <th className="py-3.5 px-4">การจองสะสม</th>
                  ) : (
                    <>
                      <th className="py-3.5 px-4">ลานจอดในสังกัด</th>
                      <th className="py-3.5 px-4">บัญชีรับโอนเงิน</th>
                    </>
                  )}
                  <th className="py-3.5 px-4">วันที่สมัคร</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">
                      #{u.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-800">
                        {u.Username}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {u.FName} {u.LName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {u.Phone_Number || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {u.Email || '-'}
                    </td>
                    {activeTab === 'customers' ? (
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                          <Car className="w-3 h-3 text-sky-500" />
                          {u.totalBookings || 0} ครั้ง
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            <Building2 className="w-3 h-3 text-amber-600" />
                            {u.totalLots || 0} แห่ง
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 text-[11px]">
                          {u.Bank_Account ? (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              <CreditCard className="w-3 h-3 text-emerald-600" />
                              {u.Bank_Account}
                            </span>
                          ) : '-'}
                        </td>
                      </>
                    )}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {u.Created_At ? formatThaiDateTime(u.Created_At) : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.Account_Status === 'Active' ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ปกติ
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                          <Ban className="w-3 h-3 text-rose-600" />
                          ระงับการใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {activeTab === 'customers' && (
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all shadow-sm"
                            title="แก้ไขข้อมูลลูกค้า"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleStatus(u.role, u.id, u.Account_Status, u.Username)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shadow-sm ${
                            u.Account_Status === 'Active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                          }`}
                        >
                          {u.Account_Status === 'Active' ? 'ระงับ' : 'ปลด'}
                        </button>

                        {activeTab === 'customers' && (
                          <button
                            onClick={() => setDeletingCustomer(u)}
                            className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all shadow-sm"
                            title="ลบบัญชีลูกค้านี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: เพิ่มบัญชีลูกค้า (Add Customer) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">เพิ่มบัญชีลูกค้าใหม่</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อผู้ใช้ (Username) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น customer99"
                    value={addForm.username}
                    onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="อย่างน้อย 4 ตัวอักษร"
                    value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อจริง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อ"
                    value={addForm.fname}
                    onChange={e => setAddForm({ ...addForm, fname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="นามสกุล"
                    value={addForm.lname}
                    onChange={e => setAddForm({ ...addForm, lname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={addForm.phone}
                    onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">อีเมล</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: แก้ไขข้อมูลลูกค้า (Edit Customer) */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">แก้ไขข้อมูลลูกค้า</h3>
                  <p className="text-[11px] text-slate-400 font-mono">@{editingCustomer.Username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อจริง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fname}
                    onChange={e => setEditForm({ ...editForm, fname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.lname}
                    onChange={e => setEditForm({ ...editForm, lname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">อีเมล</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เปลี่ยนรหัสผ่านใหม่ <span className="text-slate-400 font-normal">(เว้นว่างไว้หากไม่เปลี่ยน)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="รหัสผ่านใหม่"
                    value={editForm.password}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันการลบบัญชีลูกค้า (Delete Confirmation) */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">ยืนยันการลบบัญชีลูกค้า</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ{' '}
                <strong className="text-slate-800">
                  {deletingCustomer.FName} {deletingCustomer.LName}
                </strong>{' '}
                (@{deletingCustomer.Username})? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {isSubmittingDelete ? 'กำลังลบ...' : 'ยืนยันลบบัญชี'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast Modal */}
      {alertNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            alertNotice.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">{alertNotice.title}</div>
            <div className="text-[11px] text-slate-500">{alertNotice.message}</div>
          </div>
          <button
            onClick={() => setAlertNotice(null)}
            className="p-1 text-slate-400 hover:text-slate-600 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
