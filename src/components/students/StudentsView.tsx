import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, Program, Gender, StudentStatus } from '../../types';
import { formatRupiah, formatIndonesianDate, exportToCSV } from '../../utils/formatters';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Edit2, 
  Trash2, 
  Eye, 
  CreditCard, 
  X, 
  Phone,
  MessageCircle,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export const StudentsView: React.FC = () => {
  const { 
    students, 
    bills, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    setActiveTab, 
    setPreselectedStudentIdForPayment,
    settings,
    currentRole,
    isAdmin,
    addToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    gender: 'L' as Gender,
    program: 'MTs' as Program,
    classLevel: 'VII-A',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Ayah' as 'Ayah' | 'Ibu' | 'Wali',
    address: '',
    status: 'Aktif' as StudentStatus,
    dormitory: 'Gedung Umar bin Khattab',
    monthlySppAmount: 650000,
    joinDate: new Date().toISOString().split('T')[0]
  });

  // Extract distinct class list
  const classOptions = useMemo(() => {
    const set = new Set(students.map(s => s.classLevel));
    return Array.from(set).sort();
  }, [students]);

  // Filter students based on search, program, class, and status
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.nis.includes(search) ||
        s.guardianName.toLowerCase().includes(search.toLowerCase()) ||
        s.classLevel.toLowerCase().includes(search.toLowerCase());

      const matchProgram = selectedProgram === 'all' || s.program === selectedProgram;
      const matchClass = selectedClass === 'all' || s.classLevel === selectedClass;
      const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;

      return matchSearch && matchProgram && matchClass && matchStatus;
    });
  }, [students, search, selectedProgram, selectedClass, selectedStatus]);

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang memiliki wewenang menambah data santri baru. Akun Bendahara bertugas mencatat pembayaran dan laporan.', 'Izin Terbatas');
      return;
    }
    const nextSeq = students.length + 1;
    const nextNis = `202407${String(nextSeq).padStart(3, '0')}`;
    setFormData({
      nis: nextNis,
      name: '',
      gender: 'L',
      program: 'MTs',
      classLevel: 'VII-A',
      guardianName: '',
      guardianPhone: '',
      guardianRelation: 'Ayah',
      address: '',
      status: 'Aktif',
      dormitory: 'Gedung Umar bin Khattab (Kamar 101)',
      monthlySppAmount: settings.sppDefaultRates.mts,
      joinDate: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang dapat mengedit data pokok santri.', 'Izin Terbatas');
      return;
    }
    setEditingStudent(student);
    setFormData({
      nis: student.nis,
      name: student.name,
      gender: student.gender,
      program: student.program,
      classLevel: student.classLevel,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianRelation: student.guardianRelation,
      address: student.address,
      status: student.status,
      dormitory: student.dormitory,
      monthlySppAmount: student.monthlySppAmount,
      joinDate: student.joinDate || '2024-07-15'
    });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nis.trim()) return;

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        ...formData,
      });
      setEditingStudent(null);
    } else {
      addStudent({
        ...formData
      });
      setIsAddModalOpen(false);
    }
  };

  const handleProgramChange = (prog: Program) => {
    let defaultAmount = settings.sppDefaultRates.mts;
    let defaultClass = 'VII-A';
    if (prog === 'MA') {
      defaultAmount = settings.sppDefaultRates.ma;
      defaultClass = 'X-MIPA';
    } else if (prog === 'Tahfizh') {
      defaultAmount = settings.sppDefaultRates.tahfizh;
      defaultClass = 'Tahfizh-1';
    }
    setFormData(prev => ({
      ...prev,
      program: prog,
      classLevel: defaultClass,
      monthlySppAmount: defaultAmount
    }));
  };

  const handlePayShortcut = (studentId: string) => {
    setPreselectedStudentIdForPayment(studentId);
    setViewingStudent(null);
    setActiveTab('payment');
  };

  const handleExportCSV = () => {
    const headers = [
      'Nomor Induk (NIS)',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Tingkat',
      'Kelas',
      'Nama Orang Tua / Wali',
      'No. WhatsApp Wali',
      'Tanggal Masuk',
      'Kamar Asrama',
      'Nominal SPP (Rp)',
      'Status Santri'
    ];
    const rows = filteredStudents.map(s => [
      s.nis,
      s.name,
      s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      s.program,
      s.classLevel,
      s.guardianName,
      s.guardianPhone,
      s.joinDate || '-',
      s.dormitory,
      s.monthlySppAmount,
      s.status
    ]);
    exportToCSV(`Data_Santri_Salamatul_Insan_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Compute viewing student statistics
  const viewingStudentStats = useMemo(() => {
    if (!viewingStudent) return null;
    const studentBills = bills.filter(b => b.studentId === viewingStudent.id);
    const totalTagihan = studentBills.reduce((sum, b) => sum + b.amount, 0);
    const totalTerbayar = studentBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const totalSisa = studentBills.reduce((sum, b) => sum + (b.remainingAmount ?? (b.amount - (b.paidAmount || 0))), 0);
    const unpaidCount = studentBills.filter(b => b.status !== 'Lunas').length;

    return {
      bills: studentBills,
      totalTagihan,
      totalTerbayar,
      totalSisa,
      unpaidCount
    };
  }, [viewingStudent, bills]);

  return (
    <div className="space-y-6">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            Data Siswa & Santri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen master data santri, nomor induk, wali, status aktif, dan tarif SPP per santri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors shadow-xs ${
              isAdmin 
                ? 'text-white bg-emerald-700 hover:bg-emerald-800' 
                : 'text-slate-400 bg-slate-200 cursor-not-allowed'
            }`}
            title={!isAdmin ? 'Hanya Administrator yang dapat menambah data santri baru' : 'Tambah data santri baru'}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Santri {isAdmin ? 'Baru' : '(Admin Only)'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search by name or NIS */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama santri atau nomor induk (NIS)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            {/* Tingkat / Program */}
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600"
            >
              <option value="all">Semua Tingkat</option>
              <option value="MTs">Tingkat MTs</option>
              <option value="MA">Tingkat MA</option>
              <option value="Tahfizh">Tingkat Tahfizh</option>
            </select>

            {/* Kelas */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600"
            >
              <option value="all">Semua Kelas</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>

            {/* Status Aktif */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Status: Aktif</option>
              <option value="Nonaktif">Status: Nonaktif</option>
            </select>

            {(search || selectedProgram !== 'all' || selectedClass !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedProgram('all');
                  setSelectedClass('all');
                  setSelectedStatus('all');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 underline"
              >
                Reset Filter
              </button>
            )}

          </div>

        </div>

        {/* Counter strip */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan <strong className="text-slate-900">{filteredStudents.length}</strong> dari total {students.length} santri</span>
          <span className="font-mono">{students.filter(s => s.status === 'Aktif').length} Santri Aktif</span>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Tidak ada santri yang cocok dengan kriteria pencarian atau filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3.5 px-4">Santri</th>
                  <th className="py-3.5 px-4">Nomor Induk (NIS)</th>
                  <th className="py-3.5 px-4">Tingkat & Kelas</th>
                  <th className="py-3.5 px-4">Nama Orang Tua / Wali</th>
                  <th className="py-3.5 px-4">WhatsApp Wali</th>
                  <th className="py-3.5 px-4">Tgl Masuk</th>
                  <th className="py-3.5 px-4 text-right">Tarif SPP</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            s.gender === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.gender === 'L' ? 'L' : 'P'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{s.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {s.gender === 'L' ? 'Santriwan' : 'Santriwati'} · {s.dormitory}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {s.nis}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{s.classLevel}</span>
                        <span className="text-[11px] text-slate-500 block">Tingkat {s.program}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-medium">{s.guardianName}</span>
                        <span className="text-[11px] text-slate-400 block">({s.guardianRelation})</span>
                      </td>
                      <td className="py-3 px-4">
                        <a 
                          href={`https://wa.me/${s.guardianPhone.replace(/^0/, '62')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 font-mono flex items-center gap-1 font-medium"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{s.guardianPhone}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {s.joinDate || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(s.monthlySppAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.status === 'Aktif' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingStudent(s)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Lihat Detail Profil & Tagihan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePayShortcut(s.id)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Bayar SPP Santri Ini"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (!isAdmin) {
                                addToast('warning', 'Hanya Administrator yang dapat mengedit data santri.', 'Izin Terbatas');
                                return;
                              }
                              handleOpenEditModal(s);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAdmin ? 'text-slate-500 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={isAdmin ? "Edit Data Santri" : "Hanya Administrator"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (!isAdmin) {
                                addToast('warning', 'Hanya Administrator yang dapat menghapus data santri.', 'Izin Terbatas');
                                return;
                              }
                              if (confirm(`Yakin ingin menghapus santri ${s.name} (NIS: ${s.nis})?`)) {
                                deleteStudent(s.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAdmin ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-200 cursor-not-allowed'
                            }`}
                            title={isAdmin ? "Hapus Data" : "Hanya Administrator"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-semibold text-sm">
                {editingStudent ? `Edit Data Santri: ${editingStudent.name}` : 'Tambah Data Siswa / Santri Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Induk Santri (NIS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    <option value="L">Laki-laki (Santriwan)</option>
                    <option value="P">Perempuan (Santriwati)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa / Santri *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Raihan Al-Ghifari"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Pendidikan *
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => handleProgramChange(e.target.value as Program)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    <option value="MTs">Madrasah Tsanawiyah (MTs)</option>
                    <option value="MA">Madrasah Aliyah (MA)</option>
                    <option value="Tahfizh">Program Khusus Tahfizh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas / Rombel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: VII-A, X-MIPA"
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Orang Tua / Wali *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama orang tua"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hubungan
                  </label>
                  <select
                    value={formData.guardianRelation}
                    onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Wali">Wali</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP Orang Tua *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Masuk *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal SPP Bulanan Khusus (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    step="10000"
                    value={formData.monthlySppAmount}
                    onChange={(e) => setFormData({ ...formData, monthlySppAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bisa disesuaikan per siswa jika ada beasiswa / keringanan
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Santri *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kamar & Gedung Asrama
                </label>
                <input
                  type="text"
                  placeholder="Gedung Umar bin Khattab Kamar 201"
                  value={formData.dormitory}
                  onChange={(e) => setFormData({ ...formData, dormitory: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Rumah Asal Santri
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat asal kota tempat tinggal keluarga"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Daftarkan Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Detail Drawer / Modal */}
      {viewingStudent && viewingStudentStats && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <span className="text-xs text-emerald-400 font-mono">NIS: {viewingStudent.nis}</span>
                <h3 className="font-bold text-base">{viewingStudent.name}</h3>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Profile summary grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tingkat & Kelas</span>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingStudent.program} · Kelas {viewingStudent.classLevel}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tarif SPP Bulanan</span>
                  <p className="font-mono font-bold text-emerald-800 mt-0.5">{formatRupiah(viewingStudent.monthlySppAmount)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tanggal Masuk</span>
                  <p className="font-mono text-slate-800 mt-0.5">{viewingStudent.joinDate || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Santri</span>
                  <span className={`inline-block mt-0.5 font-semibold px-2 py-0.5 rounded text-[10px] ${
                    viewingStudent.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {viewingStudent.status}
                  </span>
                </div>
              </div>

              {/* Wali & Asrama Information */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-slate-500 font-medium">Orang Tua / Wali: </span>
                  <strong className="text-slate-900">{viewingStudent.guardianName} ({viewingStudent.guardianRelation})</strong>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Asrama: <span className="text-slate-700">{viewingStudent.dormitory}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Alamat: <span className="text-slate-700">{viewingStudent.address || '-'}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <a
                    href={`https://wa.me/${viewingStudent.guardianPhone.replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp: {viewingStudent.guardianPhone}</span>
                  </a>
                </div>
              </div>

              {/* Financial Status Summary */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Tagihan</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{formatRupiah(viewingStudentStats.totalTagihan)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block text-[10px] uppercase font-semibold">Sudah Dibayar</span>
                  <p className="font-mono font-bold text-emerald-800 mt-0.5">{formatRupiah(viewingStudentStats.totalTerbayar)}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-700 block text-[10px] uppercase font-semibold">Sisa Tunggakan</span>
                  <p className="font-mono font-bold text-rose-600 mt-0.5">{formatRupiah(viewingStudentStats.totalSisa)}</p>
                </div>
              </div>

              {/* Bills List for this Student */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  Riwayat Tagihan & Pembayaran Santri ({viewingStudentStats.bills.length} Periode):
                </h4>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto">
                  {viewingStudentStats.bills.map(b => (
                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">SPP Bulan {b.monthName} {b.year}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            b.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' :
                            b.status === 'Dibayar Sebagian' ? 'bg-amber-100 text-amber-800' :
                            b.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block">Jatuh Tempo: {b.dueDate}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="font-mono font-semibold text-slate-900 block tabular-nums">
                            {formatRupiah(b.amount)}
                          </span>
                          {b.status === 'Dibayar Sebagian' && (
                            <span className="text-[10px] text-amber-700 font-mono block">
                              Terbayar: {formatRupiah(b.paidAmount || 0)} (Sisa: {formatRupiah(b.remainingAmount || 0)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setViewingStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Tutup
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const st = viewingStudent;
                      setViewingStudent(null);
                      handleOpenEditModal(st);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Edit Profil
                  </button>
                  <button
                    onClick={() => handlePayShortcut(viewingStudent.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bayar SPP Sekarang</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
