import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, User as UserIcon, Lock, Phone, Mail, Building2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Role } from '../types';

export function Register() {
  const [role, setRole] = useState<'Customer' | 'Owner'>('Customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          username,
          password,
          fname,
          lname,
          phone,
          email,
          bankAccount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'สมัครสมาชิกไม่สำเร็จ');
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/logo.svg" 
            alt="ParkSmart Logo" 
            className="w-16 h-16 object-contain mx-auto drop-shadow-md" 
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            สมัครสมาชิก ParkSmart
          </h1>
          <p className="text-xs text-slate-500">
            เลือกระบุบทบาทผู้ใช้งานเพื่อเริ่มต้นใช้งานระบบ
          </p>
        </div>

        {/* Role Segmented Buttons */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('Customer')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              role === 'Customer'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ลูกค้า (Customer)
          </button>
          <button
            type="button"
            onClick={() => setRole('Owner')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              role === 'Owner'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เจ้าของลาน (Owner)
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-sm">สมัครสมาชิกสำเร็จ!</h3>
            <p className="text-xs text-emerald-700">กำลังนำทางไปยังหน้าเข้าสู่ระบบ...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อจริง</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย"
                  value={fname}
                  onChange={e => setFname(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ใจดี"
                  value={lname}
                  onChange={e => setLname(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label>
              <input
                type="text"
                required
                placeholder="ระบุตัวอักษรภาษาอังกฤษหรือตัวเลข"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่าน (Password)</label>
              <input
                type="password"
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  placeholder="08X-XXX-XXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {role === 'Owner' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บัญชีธนาคารสำหรับรับโอนค่าจอด
                </label>
                <input
                  type="text"
                  placeholder="เช่น กสิกรไทย 123-4-56789-0"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-sky-300 transition-all disabled:opacity-50"
            >
              {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันการสมัครสมาชิก'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-sky-600 font-semibold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
