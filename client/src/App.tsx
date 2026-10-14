import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Lots } from './pages/Lots';
import { LotDetail } from './pages/LotDetail';
import { Booking } from './pages/Booking';
import { Payment } from './pages/Payment';
import { MyBookings } from './pages/MyBookings';
import { TicketDetail } from './pages/TicketDetail';
import { Favorites } from './pages/Favorites';
import { Complaints } from './pages/Complaints';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerLots } from './pages/owner/OwnerLots';
import { OwnerScanner } from './pages/owner/OwnerScanner';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLots } from './pages/admin/AdminLots';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminDatabaseInspector } from './pages/admin/AdminDatabaseInspector';
import { ToastContainer } from './lib/toast';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleLoginSuccess = (newUser: User, token: string) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('parksmart_user', JSON.stringify(newUser));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('parksmart_user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar user={user} onLogout={handleLogout} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/lots" element={<Lots user={user} />} />
            <Route path="/lots/:id" element={<LotDetail user={user} />} />
            <Route path="/booking/:slotId" element={<Booking user={user} />} />
            <Route path="/payment/:id" element={<Payment />} />
            
            {/* Customer Routes */}
            <Route path="/my/bookings" element={<MyBookings user={user} />} />
            <Route path="/my/bookings/:id" element={<TicketDetail user={user} />} />
            <Route path="/my/favorites" element={<Favorites user={user} />} />
            <Route path="/favorites" element={<Favorites user={user} />} />
            <Route path="/my/complaints" element={<Complaints user={user} />} />

            {/* Auth */}
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />

            {/* Owner Routes */}
            <Route path="/owner" element={<OwnerDashboard user={user} />} />
            <Route path="/owner/lots" element={<OwnerLots user={user} />} />
            <Route path="/owner/scanner" element={<OwnerScanner user={user} />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/lots" element={<AdminLots />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/database" element={<AdminDatabaseInspector />} />
            <Route path="/admin/inspector" element={<AdminDatabaseInspector />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
