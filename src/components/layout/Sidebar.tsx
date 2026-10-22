import React from 'react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  History, 
  BarChart3, 
  Settings, 
  School,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Lock
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, bills, students, currentRole, currentUser, firebaseUser } = useApp();

  const unpaidCount = bills.filter(b => b.month === 10 && b.year === 2026 && b.status !== 'Lunas').length;

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string; subNote?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />
    },
    {
      id: 'students',
      label: 'Data Siswa / Santri',
      icon: <Users className="w-5 h-5 shrink-0" />,
      badge: students.filter(s => s.status === 'Aktif').length,
      subNote: currentRole === 'bendahara' ? 'Lihat' : undefined
    },
    {
      id: 'bills',
      label: 'Tagihan SPP',
      icon: <FileText className="w-5 h-5 shrink-0" />,
      badge: unpaidCount > 0 ? `${unpaidCount} Belum` : undefined,
      badgeColor: 'text-amber-700 bg-amber-100'
    },
    {
      id: 'payment',
      label: 'Pembayaran (Kasir)',
      icon: <CreditCard className="w-5 h-5 shrink-0" />
    },
    {
      id: 'history',
      label: 'Riwayat Pembayaran',
      icon: <History className="w-5 h-5 shrink-0" />
    },
    {
      id: 'reports',
      label: 'Laporan Keuangan',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-5 h-5 shrink-0" />,
      subNote: currentRole === 'bendahara' ? 'Admin' : undefined
    }
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const displayName = firebaseUser?.displayName || (currentRole === 'admin' ? 'Ustadzah Raida' : 'Ust. Syarif Hidayatullah');
  const roleLabel = currentRole === 'admin' ? 'Administrator Utama' : 'Bendahara Pondok';
  const roleInitial = currentRole === 'admin' ? 'AD' : 'BH';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
              Sistem SPP
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium truncate">
              Salamatul Insan
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Operasional
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 truncate">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {item.subNote && (
                    <span className="text-[9px] font-mono uppercase bg-slate-800/90 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">
                      {item.subNote}
                    </span>
                  )}
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        isActive 
                          ? 'bg-emerald-700/80 text-white' 
                          : (item.badgeColor || 'bg-slate-800 text-slate-300')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Payment Banner */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Kasir Cepat
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Oktober 2026</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            Terima setoran SPP santri secara tunai, transfer atau QRIS.
          </p>
          <button
            onClick={() => handleSelectTab('payment')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <span>Bayar SPP Sekarang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Role Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-3 shrink-0">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
            currentRole === 'admin'
              ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
              : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
          }`}>
            {roleInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1 text-[11px]">
              {currentRole === 'admin' ? (
                <ShieldCheck className="w-3 h-3 text-purple-400" />
              ) : (
                <UserCheck className="w-3 h-3 text-emerald-400" />
              )}
              <span className={`font-medium ${currentRole === 'admin' ? 'text-purple-400' : 'text-emerald-400'}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
