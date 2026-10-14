import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Car, 
  Search, 
  Ticket, 
  Heart, 
  MessageSquareWarning, 
  LayoutDashboard, 
  QrCode, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X,
  ShieldCheck,
  Building2,
  Database
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img 
              src="/logo.svg" 
              alt="ParkSmart Logo" 
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform drop-shadow-sm" 
            />
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors block leading-tight">
                Park<span className="text-sky-600">Smart</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">ระบบจองที่จอดรถออนไลน์</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
            <Link
              to="/"
              className={`px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                isActive('/') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
              }`}
            >
              หน้าแรก
            </Link>

            <Link
              to="/lots"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                isActive('/lots') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>ค้นหาลานจอด</span>
            </Link>

            {user?.role === 'Customer' && (
              <>
                <Link
                  to="/my/bookings"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/my/bookings') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <Ticket className="w-4 h-4 shrink-0" />
                  <span>ตั๋วของฉัน</span>
                </Link>
                <Link
                  to="/my/favorites"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/my/favorites') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>ลานโปรด</span>
                </Link>
                <Link
                  to="/my/complaints"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/my/complaints') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquareWarning className="w-4 h-4 shrink-0" />
                  <span>ข้อร้องเรียน</span>
                </Link>
              </>
            )}

            {user?.role === 'Owner' && (
              <>
                <Link
                  to="/owner"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/owner') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>ภาพรวมลาน</span>
                </Link>
                <Link
                  to="/owner/lots"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/owner/lots') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>จัดการลาน</span>
                </Link>
                <Link
                  to="/owner/scanner"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/owner/scanner') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>สแกนเนอร์ QR</span>
                </Link>
              </>
            )}

            {user?.role === 'Admin' && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/admin') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>แอดมิน</span>
                </Link>
                <Link
                  to="/admin/lots"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/admin/lots') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>อนุมัติลาน</span>
                </Link>
                <Link
                  to="/admin/complaints"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/admin/complaints') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquareWarning className="w-4 h-4 shrink-0" />
                  <span>เรื่องร้องเรียน</span>
                </Link>
                <Link
                  to="/admin/reports"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/admin/reports') ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <span>รายงานรายได้</span>
                </Link>
                <Link
                  to="/admin/database"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive('/admin/database') ? 'text-purple-700 bg-purple-50 font-bold border border-purple-200' : 'text-purple-700 hover:text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  <Database className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>ตรวจสอบ Database</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Action / Auth */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold border border-slate-200 shrink-0">
                    {user.fname ? user.fname.charAt(0) : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className="whitespace-nowrap">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.fname} {user.lname}
                    </div>
                    <div className="flex items-center gap-1">
                      {user.role === 'Admin' && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" /> แอดมิน
                        </span>
                      )}
                      {user.role === 'Owner' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5" /> เจ้าของลาน
                        </span>
                      )}
                      {user.role === 'Customer' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                          ลูกค้า
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg font-medium transition-colors border border-rose-200 shrink-0 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm hover:shadow transition-all"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-slate-100"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            หน้าแรก
          </Link>
          <Link
            to="/lots"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            ค้นหาลานจอดรถ
          </Link>

          {user?.role === 'Customer' && (
            <>
              <Link
                to="/my/bookings"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                ตั๋วการจองของฉัน
              </Link>
              <Link
                to="/my/favorites"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                ลานโปรด
              </Link>
              <Link
                to="/my/complaints"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                ข้อร้องเรียน
              </Link>
            </>
          )}

          {user?.role === 'Owner' && (
            <>
              <Link
                to="/owner"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                ภาพรวมลาน
              </Link>
              <Link
                to="/owner/lots"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                จัดการลานจอด
              </Link>
              <Link
                to="/owner/scanner"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                สแกนเนอร์ QR
              </Link>
            </>
          )}

          {user?.role === 'Admin' && (
            <>
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                แอดมิน Dashboard
              </Link>
              <Link
                to="/admin/lots"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                อนุมัติลานจอด
              </Link>
              <Link
                to="/admin/complaints"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                จัดการข้อร้องเรียน
              </Link>
              <Link
                to="/admin/reports"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                รายงานรายได้
              </Link>
              <Link
                to="/admin/database"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
              >
                ตรวจสอบ Database (Entities & Attributes)
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-900 px-3">
                  {user.fname} {user.lname} ({user.role})
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-medium"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="flex-1 text-center py-2 text-sm font-semibold border border-slate-200 rounded-xl"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/register');
                  }}
                  className="flex-1 text-center py-2 text-sm font-semibold bg-sky-600 text-white rounded-xl"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
