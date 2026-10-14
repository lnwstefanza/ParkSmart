import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User as UserIcon, ShieldAlert, ArrowRight, ShieldCheck, Building2, UserCheck, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();

    const u = (customUser !== undefined ? customUser : username).trim();
    const p = customPass !== undefined ? customPass : password;

    if (!u && !p) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    if (!u) {
      setError('กรุณากรอกชื่อผู้ใช้ (Username)');
      return;
    }
    if (!p) {
      setError('กรุณากรอกรหัสผ่าน (Password)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          // Fallback if HTML or non-JSON returned
          throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
      }

      if (!res.ok) {
        throw new Error(data?.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

      onLoginSuccess(data.user, data.token);

      // Redirect based on role
      const userRole = data.user.role;
      if (userRole === 'Admin' || userRole === 'Administrator') {
        navigate('/admin');
      } else if (userRole === 'Owner' || userRole === 'Parking_Owner') {
        navigate('/owner');
      } else {
        navigate('/lots');
      }
    } catch (err: any) {
      // Normalize errors to clean Thai messages - never display technical syntax/HTML parse errors
      let errMsg = err?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        errMsg = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
      } else if (
        errMsg.includes('JSON') || 
        errMsg.includes('<!doctype') || 
        errMsg.includes('Unexpected token') ||
        errMsg.includes('btoa') ||
        errMsg.includes('Latin1') ||
        errMsg.includes('Failed to execute')
      ) {
        errMsg = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
    handleLogin(undefined, u, p);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/logo.svg" 
            alt="ParkSmart Logo" 
            className="w-16 h-16 object-contain mx-auto drop-shadow-md" 
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            เข้าสู่ระบบ ParkSmart
          </h1>
          <p className="text-xs text-slate-500">
            ระบบจองที่จอดรถออนไลน์และสแกนเข้า-ออก
          </p>
        </div>

        {error && (
          <div 
            role="alert"
            className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 shadow-sm animate-shake"
          >
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="font-semibold text-rose-800 text-[13px]">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                autoComplete="username"
                required
                placeholder="ระบุชื่อผู้ใช้งาน"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                  error 
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                    : 'border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="ระบุรหัสผ่าน"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                  error 
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                    : 'border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-sky-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'กำลังตรวจสอบข้อมูล...' : 'เข้าสู่ระบบ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Accounts Quick Picker */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            ⚡ เลือกล็อกอินทันที (Quick Access)
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('customer1', 'cust123')}
              className="p-2.5 text-left rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-xs font-medium text-emerald-900 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-1 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold text-[11px]">ลูกค้า 1</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-mono">customer1</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('owner1', 'owner123')}
              className="p-2.5 text-left rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-xs font-medium text-amber-900 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold text-[11px]">เจ้าของลาน</span>
              </div>
              <span className="text-[10px] text-amber-700 font-mono">owner1</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="p-2.5 text-left rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-xs font-medium text-purple-900 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="font-bold text-[11px]">แอดมิน</span>
              </div>
              <span className="text-[10px] text-purple-700 font-mono">admin</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2">
          ยังไม่มีบัญชีใช้งาน?{' '}
          <Link to="/register" className="text-sky-600 font-semibold hover:underline">
            สมัครสมาชิกใหม่
          </Link>
        </div>
      </div>
    </div>
  );
}
