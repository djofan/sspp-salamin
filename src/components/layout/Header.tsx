import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Menu, 
  Plus, 
  Calendar, 
  Database, 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  LogOut, 
  ChevronDown,
  Layers
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { 
    activeTab, 
    setActiveTab, 
    settings, 
    setPreselectedStudentIdForPayment,
    currentRole,
    setCurrentRole,
    currentUser,
    firebaseUser,
    login,
    logout,
    isFirestoreConnected,
    isSyncing
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Keuangan';
      case 'students':
        return 'Data Siswa & Santri';
      case 'bills':
        return 'Daftar Tagihan SPP Bulanan';
      case 'payment':
        return 'Kasir Pembayaran SPP';
      case 'history':
        return 'Riwayat Transaksi & Kwitansi';
      case 'reports':
        return 'Laporan Realisasi & Tunggakan';
      case 'settings':
        return 'Pengaturan Pondok Pesantren';
      default:
        return 'Dashboard';
    }
  };

  const today = new Date();

  const handleQuickPay = () => {
    setPreselectedStudentIdForPayment(null);
    setActiveTab('payment');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Buka navigasi menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Salamatul Insan</span>
            <span>/</span>
            <span className="text-emerald-700 font-medium">T.A. {settings.academicYear}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {getBreadcrumbTitle()}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Firestore Online Status */}
        <div 
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200"
          title="Cloud Firestore Terkoneksi & Tersinkronisasi Aktif"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <Database className="w-3 h-3 text-emerald-600" />
          <span>Firestore Online</span>
        </div>

        {/* Role Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
              currentRole === 'admin'
                ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Klik untuk beralih mode akun (Admin / Bendahara)"
          >
            {currentRole === 'admin' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span className="capitalize">Peran: {currentRole}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <span className="font-bold text-slate-900 block">Pilih Hak Akses Akun</span>
                <span className="text-[10px] text-slate-500">Uji coba simulasi hak akses RBAC</span>
              </div>
              <button
                onClick={() => {
                  setCurrentRole('admin');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                  currentRole === 'admin' ? 'font-bold text-purple-700 bg-purple-50/50' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Administrator</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block ml-5">Kelola data santri, akun & pengaturan</span>
                </div>
                {currentRole === 'admin' && <span className="text-purple-600 font-bold">✓</span>}
              </button>
              <button
                onClick={() => {
                  setCurrentRole('bendahara');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                  currentRole === 'bendahara' ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bendahara Pondok</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block ml-5">Kasir, tagihan & cetak laporan</span>
                </div>
                {currentRole === 'bendahara' && <span className="text-emerald-600 font-bold">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Google Auth Button */}
        {firebaseUser ? (
          <button
            onClick={logout}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
            title={`Masuk sebagai ${firebaseUser.email}. Klik untuk keluar.`}
          >
            {firebaseUser.photoURL ? (
              <img src={firebaseUser.photoURL} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span className="truncate max-w-28">{firebaseUser.displayName?.split(' ')[0] || 'Keluar'}</span>
          </button>
        ) : (
          <button
            onClick={login}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Masuk dengan akun Google resmi pesantren"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-600" />
            <span>Login Google</span>
          </button>
        )}

        {/* Quick Payment Button */}
        <button
          onClick={handleQuickPay}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Kasir SPP</span>
          <span className="sm:hidden">Bayar</span>
        </button>
      </div>
    </header>
  );
};
