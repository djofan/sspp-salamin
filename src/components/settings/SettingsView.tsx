import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PesantrenSettings, ClassItem, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Building2, 
  CreditCard, 
  UserCheck, 
  Check, 
  AlertTriangle,
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  Edit2,
  Database,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetToDefaults, 
    addToast, 
    students, 
    bills, 
    payments,
    classes,
    addClass,
    updateClass,
    deleteClass,
    users,
    addStaffUser,
    updateUserRole,
    currentRole,
    setCurrentRole,
    isAdmin,
    isBendahara,
    isFirestoreConnected,
    isSyncing,
    seedFirestoreData
  } = useApp();

  const [formData, setFormData] = useState<PesantrenSettings>({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Class Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classForm, setClassForm] = useState<{ name: string; program: 'MTs' | 'MA' | 'Tahfizh'; defaultSppAmount: number; academicYear: string }>({
    name: '',
    program: 'MTs',
    defaultSppAmount: 650000,
    academicYear: settings.academicYear || '2026/2027'
  });

  // User Management Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<{ email: string; displayName: string; role: UserRole }>({
    email: '',
    displayName: '',
    role: 'bendahara'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang memiliki wewenang mengubah pengaturan pesantren.', 'Akses Ditolak');
      return;
    }
    updateSettings(formData);
  };

  const handleBankChange = (index: number, field: string, value: string) => {
    const updated = [...formData.bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, bankAccounts: updated });
  };

  const handleAddBankAccount = () => {
    setFormData({
      ...formData,
      bankAccounts: [
        ...formData.bankAccounts,
        { bank: 'Bank Baru', accountNumber: '000-000-000', holderName: 'Ponpes Salamatul Insan' }
      ]
    });
  };

  const handleRemoveBankAccount = (index: number) => {
    const updated = formData.bankAccounts.filter((_, i) => i !== index);
    setFormData({ ...formData, bankAccounts: updated });
  };

  // Class operations
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassForm({
      name: '',
      program: 'MTs',
      defaultSppAmount: 650000,
      academicYear: settings.academicYear || '2026/2027'
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      program: cls.program,
      defaultSppAmount: cls.defaultSppAmount,
      academicYear: cls.academicYear
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;

    if (editingClass) {
      await updateClass({
        ...editingClass,
        name: classForm.name.trim(),
        program: classForm.program,
        defaultSppAmount: Number(classForm.defaultSppAmount),
        academicYear: classForm.academicYear
      });
    } else {
      await addClass({
        name: classForm.name.trim(),
        program: classForm.program,
        defaultSppAmount: Number(classForm.defaultSppAmount),
        academicYear: classForm.academicYear
      });
    }
    setIsClassModalOpen(false);
  };

  // User management operations
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email.trim() || !userForm.displayName.trim()) return;

    await addStaffUser(userForm);
    setIsUserModalOpen(false);
    setUserForm({ email: '', displayName: '', role: 'bendahara' });
  };

  const handleBackupJSON = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '2.0-cloud-firestore',
      settings: formData,
      classes,
      users,
      students,
      bills,
      payments
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_SPP_Salamatul_Insan_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', 'Cadangan data sistem berhasil diunduh dalam format JSON.', 'Cadangan Selesai');
  };

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header and Cloud Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            Pengaturan Pondok Pesantren & Hak Akses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil lembaga, daftar kelas & tarif SPP, akun staf, dan konfigurasi Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBackupJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Cadangkan JSON</span>
          </button>
        </div>
      </div>

      {/* Access Control & RBAC Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isAdmin 
          ? 'bg-purple-50/80 border-purple-200 text-purple-950'
          : 'bg-amber-50/80 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
            {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                Mode Akses Aktif: {isAdmin ? 'Administrator (Akses Penuh)' : 'Bendahara (Hanya Lihat Pengaturan)'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isAdmin ? 'bg-purple-200 text-purple-800' : 'bg-amber-200 text-amber-800'
              }`}>
                {currentRole}
              </span>
            </div>
            <p className="text-[11px] mt-0.5 text-slate-600">
              {isAdmin 
                ? 'Anda memiliki hak penuh untuk mengubah data pokok santri, tarif SPP, menambah kelas, mengelola pengguna, dan mengubah pengaturan institusi.'
                : 'Akun Bendahara berwenang mengelola tagihan, mencatat pembayaran di kasir, dan membuat laporan tanpa mengubah pengaturan penting atau hak akses pengguna.'}
            </p>
          </div>
        </div>

        {/* Quick RBAC Switch Button for testing */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500">Uji Hak Akses:</span>
          <button
            type="button"
            onClick={() => setCurrentRole(isAdmin ? 'bendahara' : 'admin')}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all ${
              isAdmin 
                ? 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                : 'bg-white text-purple-800 border-purple-300 hover:bg-purple-50'
            }`}
          >
            Beralih ke {isAdmin ? 'Bendahara' : 'Admin'}
          </button>
        </div>
      </div>

      {/* Cloud Firestore Live Status Box */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Database Cloud Firestore Permanen</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online & Terhubung
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Project: <span className="font-mono text-slate-300">gen-lang-client-0553818565</span> · Koleksi: users, students, classes, bills, payments, school_settings
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={seedFirestoreData}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            title="Tulis ulang data awal jika koleksi database kosong"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sinkronkan ke Firestore</span>
          </button>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. Profil Pondok Pesantren */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Profil Pondok Pesantren
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lembaga Pesantren *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.pesantrenName}
                onChange={(e) => setFormData({ ...formData, pesantrenName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Semboyan Lembaga
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap Lembaga (Tercetak di Kwitansi & Laporan) *
            </label>
            <textarea
              rows={2}
              required
              disabled={!isAdmin}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Resmi Keuangan
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website Resmi
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Logo / Emblem Pesantren
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                disabled={!isAdmin}
                placeholder="https://... (URL gambar logo pesantren)"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {formData.logoUrl && (
                <img src={formData.logoUrl} alt="Logo" className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* 2. Tahun Ajaran & Jatuh Tempo */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-emerald-700" />
            Tahun Ajaran & Ketentuan Pembayaran
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periode Tahun Ajaran Aktif *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                placeholder="Contoh: 2026/2027"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Jatuh Tempo SPP Bulanan
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="28"
                  disabled={!isAdmin}
                  value={formData.dueDay || 10}
                  onChange={(e) => setFormData({ ...formData, dueDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
                />
                <span className="text-xs text-slate-500 shrink-0">Setiap Bulan</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal SPP Default Global
              </label>
              <input
                type="number"
                step="10000"
                disabled={!isAdmin}
                value={formData.defaultSppAmount || 650000}
                onChange={(e) => setFormData({ ...formData, defaultSppAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {formatRupiah(formData.defaultSppAmount || 650000)} / bulan
              </span>
            </div>
          </div>
        </div>

        {/* 3. Pejabat & Penandatangan Dokumen */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            Pejabat & Penandatangan Kwitansi / Laporan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pimpinan Pondok Pesantren (Mudirul Ma'had)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.principal || formData.headmaster}
                onChange={(e) => setFormData({ ...formData, principal: e.target.value, headmaster: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bendahara Pondok (Tanda Tangan Bukti Bayar) *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.treasurer}
                onChange={(e) => setFormData({ ...formData, treasurer: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 disabled:bg-slate-50 disabled:text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 4. Rekening Bank Penerima */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Rekening Bank Resmi Penerimaan SPP
            </h3>
            {isAdmin && (
              <button
                type="button"
                onClick={handleAddBankAccount}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rekening</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {formData.bankAccounts.map((account, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Bank</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={account.bank}
                    onChange={(e) => handleBankChange(index, 'bank', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-100"
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={account.accountNumber}
                    onChange={(e) => handleBankChange(index, 'accountNumber', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white disabled:bg-slate-100 font-medium"
                  />
                </div>
                <div className="w-full sm:w-1/3 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Atas Nama (Pemilik)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={account.holderName}
                      onChange={(e) => handleBankChange(index, 'holderName', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-100"
                    />
                  </div>
                  {isAdmin && formData.bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBankAccount(index)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      title="Hapus rekening ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Save Button */}
        {isAdmin && (
          <div className="flex justify-end p-4 bg-slate-100 rounded-2xl">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil & Konfigurasi</span>
            </button>
          </div>
        )}

      </form>

      {/* 5. DAFTAR KELAS & ROMBEL (Koleksi classes di Firestore) */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Daftar Kelas & Tarif SPP per Rombongan Belajar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola tingkatan kelas, jenjang program, dan nominal SPP bulanan khusus rombel
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAddClass}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kelas Baru</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-4">Nama Kelas</th>
                <th className="py-2.5 px-4">Jenjang Program</th>
                <th className="py-2.5 px-4">Tahun Ajaran</th>
                <th className="py-2.5 px-4 text-right">Nominal SPP Standar</th>
                <th className="py-2.5 px-4 text-center">Santri Terdaftar</th>
                {isAdmin && <th className="py-2.5 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map(cls => {
                const countStudents = students.filter(s => s.classLevel === cls.name).length;

                return (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      Kelas {cls.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        cls.program === 'MTs' ? 'bg-blue-50 text-blue-800' :
                        cls.program === 'MA' ? 'bg-emerald-50 text-emerald-800' : 'bg-purple-50 text-purple-800'
                      }`}>
                        {cls.program}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {cls.academicYear}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(cls.defaultSppAmount)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-600">
                      {countStudents} Santri
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditClass(cls)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                            title="Edit kelas"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteClass(cls.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus kelas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MANAJEMEN AKUN PENGGUNA & HAK AKSES (Koleksi users di Firestore) */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              Manajemen Pengguna & Pembagian Peran (RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar staf pesantren yang memiliki hak akses login ke sistem SPP
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengguna</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-4">Nama Petugas</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Hak Akses (Role)</th>
                <th className="py-2.5 px-4">Deskripsi Wewenang</th>
                {isAdmin && <th className="py-2.5 px-4 text-center">Ubah Peran</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {u.displayName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      <span>{u.role}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {u.role === 'admin'
                      ? 'Akses penuh: santri, tagihan, kasir, laporan, dan pengaturan'
                      : 'Akses bendahara: kelola tagihan, kasir, riwayat & cetak laporan'}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-center">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                        className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:outline-purple-600 cursor-pointer"
                      >
                        <option value="bendahara">Bendahara</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT KELAS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">
                {editingClass ? 'Edit Data Kelas & Tarif' : 'Tambah Rombongan Belajar (Kelas)'}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: VII-A, X-IPA, atau Tahfizh 1"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenjang Program *</label>
                  <select
                    value={classForm.program}
                    onChange={(e) => setClassForm({ ...classForm, program: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 bg-white"
                  >
                    <option value="MTs">MTs</option>
                    <option value="MA">MA</option>
                    <option value="Tahfizh">Tahfizh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran *</label>
                  <input
                    type="text"
                    required
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif SPP Bulanan Kelas Ini *</label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={classForm.defaultSppAmount}
                  onChange={(e) => setClassForm({ ...classForm, defaultSppAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                  {formatRupiah(classForm.defaultSppAmount)} / bulan
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PENGGUNA BARU */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Tambah Akun Pengguna Baru</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Petugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. Ahmad Fauzi, S.Pd."
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Staf (Google Account) *</label>
                <input
                  type="email"
                  required
                  placeholder="contoh: fauzi@salamatulin-san.sch.id"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hak Akses / Peran *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-purple-600 bg-white font-semibold"
                >
                  <option value="bendahara">Bendahara (Tagihan, Kasir Pembayaran, dan Laporan)</option>
                  <option value="admin">Administrator (Akses Penuh Seluruh Sistem & Pengaturan)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
                >
                  Tambah Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Confirmation */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Reset ke Data Bawaan?
            </h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Tindakan ini akan mengembalikan data santri, kelas, tagihan, dan pembayaran ke demo awal bawaan sistem di Cloud Firestore.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
