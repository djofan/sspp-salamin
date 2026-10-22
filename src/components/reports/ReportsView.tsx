import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatIndonesianDate, MONTH_NAMES, exportToCSV } from '../../utils/formatters';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  CreditCard,
  Building,
  Users,
  Search,
  Filter,
  ArrowRight,
  Clock,
  BookOpen,
  PieChart,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { Bill, Student } from '../../types';

export const ReportsView: React.FC = () => {
  const { students, bills, payments, settings, setActiveTab, setPreselectedStudentIdForPayment, currentRole } = useApp();

  // Active Report Tab
  const [activeReportTab, setActiveReportTab] = useState<'rekap' | 'kelas' | 'tunggakan' | 'kartu-santri'>('rekap');

  // Filters
  const [filterPeriodType, setFilterPeriodType] = useState<'tahunan' | 'bulanan' | 'harian'>('bulanan');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Oktober
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // For Kartu Santri Tab
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<string>(students[0]?.id || '');
  const [studentSearchKeyword, setStudentSearchKeyword] = useState<string>('');

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Distinct classes
  const classList = useMemo(() => {
    const set = new Set(students.map(s => s.classLevel));
    return Array.from(set).sort();
  }, [students]);

  // Filtered Bills based on active filters
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      // Class filter
      if (selectedClass !== 'all' && b.classLevel !== selectedClass) return false;

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'Tunggakan') {
          if (b.status === 'Lunas') return false;
        } else if (b.status !== selectedStatus) {
          return false;
        }
      }

      // Period filter
      if (filterPeriodType === 'tahunan') {
        return b.year === selectedYear;
      } else if (filterPeriodType === 'bulanan') {
        return b.year === selectedYear && b.month === selectedMonth;
      } else {
        // Harian / Date Range
        const billDate = b.dueDate;
        return billDate >= startDate && billDate <= endDate;
      }
    });
  }, [bills, selectedClass, selectedStatus, filterPeriodType, selectedYear, selectedMonth, startDate, endDate]);

  // Financial Metrics for Filtered Bills
  const totalTargetTagihan = filteredBills.reduce((acc, b) => acc + b.amount, 0);
  const totalRealisasiMasuk = filteredBills.reduce((acc, b) => acc + (b.paidAmount || (b.status === 'Lunas' ? b.amount : 0)), 0);
  const totalSisaTunggakan = filteredBills.reduce((acc, b) => acc + (b.remainingAmount ?? (b.amount - (b.paidAmount || 0))), 0);
  const persentaseCapaian = totalTargetTagihan > 0 ? Math.round((totalRealisasiMasuk / totalTargetTagihan) * 100) : 0;

  // Filtered Payments (Non-cancelled only for cash metrics)
  const validPayments = useMemo(() => {
    return payments.filter(p => {
      if (p.status === 'Dibatalkan') return false;
      if (selectedClass !== 'all' && p.classLevel !== selectedClass) return false;

      const pDate = new Date(p.paidDate);
      const pYear = pDate.getFullYear();
      const pMonth = pDate.getMonth() + 1;
      const pIsoDate = p.paidDate.split('T')[0];

      if (filterPeriodType === 'tahunan') {
        return pYear === selectedYear;
      } else if (filterPeriodType === 'bulanan') {
        return pYear === selectedYear && pMonth === selectedMonth;
      } else {
        return pIsoDate >= startDate && pIsoDate <= endDate;
      }
    });
  }, [payments, selectedClass, filterPeriodType, selectedYear, selectedMonth, startDate, endDate]);

  const totalKasDiterimaNyata = validPayments.reduce((acc, p) => acc + p.totalAmount, 0);

  // Santri Belum Bayar Sama Sekali (Tunggakan Penuh)
  const fullArrearsBills = filteredBills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat');
  
  // Santri Pembayaran Sebagian (Cicilan Berjalan)
  const partialArrearsBills = filteredBills.filter(b => b.status === 'Dibayar Sebagian');

  // Breakdown per Class
  const classBreakdown = useMemo(() => {
    const classMap: Record<string, { totalStudents: number; target: number; paid: number; arrears: number }> = {};

    students.forEach(s => {
      if (!classMap[s.classLevel]) {
        classMap[s.classLevel] = { totalStudents: 0, target: 0, paid: 0, arrears: 0 };
      }
      classMap[s.classLevel].totalStudents++;
    });

    filteredBills.forEach(b => {
      const cls = b.classLevel || 'Lainnya';
      if (!classMap[cls]) {
        classMap[cls] = { totalStudents: 1, target: 0, paid: 0, arrears: 0 };
      }
      classMap[cls].target += b.amount;
      const paid = b.paidAmount || (b.status === 'Lunas' ? b.amount : 0);
      const remaining = b.remainingAmount ?? (b.amount - paid);
      classMap[cls].paid += paid;
      classMap[cls].arrears += remaining;
    });

    return Object.entries(classMap).sort(([a], [b]) => a.localeCompare(b));
  }, [students, filteredBills]);

  // Selected Student for Kartu SPP
  const currentCardStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentForCard) || students[0];
  }, [students, selectedStudentForCard]);

  const studentBillsHistory = useMemo(() => {
    if (!currentCardStudent) return [];
    return bills
      .filter(b => b.studentId === currentCardStudent.id)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }, [bills, currentCardStudent]);

  const studentPaymentsHistory = useMemo(() => {
    if (!currentCardStudent) return [];
    return payments
      .filter(p => p.studentId === currentCardStudent.id)
      .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
  }, [payments, currentCardStudent]);

  const handlePayStudent = (studentId: string) => {
    setPreselectedStudentIdForPayment(studentId);
    setActiveTab('payment');
  };

  // CSV Export
  const handleExportCSV = () => {
    if (activeReportTab === 'rekap') {
      const headers = ['No', 'No. Tagihan / ID', 'NIS', 'Nama Santri', 'Kelas', 'Bulan SPP', 'Tahun', 'Target (Rp)', 'Dibayar (Rp)', 'Sisa (Rp)', 'Status'];
      const rows = filteredBills.map((b, idx) => [
        idx + 1,
        b.id,
        b.studentNis || '',
        b.studentName || '',
        b.classLevel || '',
        b.monthName,
        b.year,
        b.amount,
        b.paidAmount || 0,
        b.remainingAmount || 0,
        b.status
      ]);
      exportToCSV(`Laporan_SPP_${filterPeriodType}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeReportTab === 'kelas') {
      const headers = ['Kelas / Rombel', 'Jumlah Santri', 'Target Tagihan (Rp)', 'Realisasi Masuk (Rp)', 'Sisa Tunggakan (Rp)', 'Capaian (%)'];
      const rows = classBreakdown.map(([cls, data]) => [
        `Kelas ${cls}`,
        data.totalStudents,
        data.target,
        data.paid,
        data.arrears,
        data.target > 0 ? Math.round((data.paid / data.target) * 100) : 0
      ]);
      exportToCSV(`Laporan_SPP_per_Kelas_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeReportTab === 'tunggakan') {
      const headers = ['No', 'NIS', 'Nama Santri', 'Kelas', 'Bulan Menunggak', 'Tipe', 'Total Tagihan', 'Sudah Dicicil', 'Sisa Tunggakan'];
      const allArrears = [...fullArrearsBills, ...partialArrearsBills];
      const rows = allArrears.map((b, idx) => [
        idx + 1,
        b.studentNis || '',
        b.studentName || '',
        b.classLevel || '',
        `${b.monthName} ${b.year}`,
        b.status,
        b.amount,
        b.paidAmount || 0,
        b.remainingAmount || (b.amount - (b.paidAmount || 0))
      ]);
      exportToCSV(`Laporan_Daftar_Tunggakan_SPP_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeReportTab === 'kartu-santri' && currentCardStudent) {
      const headers = ['Bulan', 'Tahun', 'Nominal Tagihan (Rp)', 'Terbayar (Rp)', 'Sisa (Rp)', 'Status', 'Tanggal Bayar'];
      const rows = studentBillsHistory.map(b => [
        b.monthName,
        b.year,
        b.amount,
        b.paidAmount || 0,
        b.remainingAmount || 0,
        b.status,
        b.paidAt ? formatIndonesianDate(b.paidAt) : '-'
      ]);
      exportToCSV(`Kartu_SPP_${currentCardStudent.nis}_${currentCardStudent.name.replace(/\s+/g, '_')}`, headers, rows);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* Header and Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            Laporan Keuangan & Rekapitulasi SPP Santri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan rekap pembayaran harian, bulanan, tahunan, evaluasi tunggakan, dan kartu pembayaran per santri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setActiveReportTab('rekap')}
          className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-semibold transition-all ${
            activeReportTab === 'rekap'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          <span>Rekapitulasi Keuangan</span>
        </button>
        <button
          onClick={() => setActiveReportTab('kelas')}
          className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-semibold transition-all ${
            activeReportTab === 'kelas'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-emerald-700" />
          <span>Rekap per Kelas ({classBreakdown.length})</span>
        </button>
        <button
          onClick={() => setActiveReportTab('tunggakan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-semibold transition-all ${
            activeReportTab === 'tunggakan'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Daftar Tunggakan & Cicilan ({fullArrearsBills.length + partialArrearsBills.length})</span>
        </button>
        <button
          onClick={() => setActiveReportTab('kartu-santri')}
          className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-semibold transition-all ${
            activeReportTab === 'kartu-santri'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
          <span>Riwayat per Siswa (Kartu SPP)</span>
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Filter Periode:
            </span>

            {/* Type selector */}
            <select
              value={filterPeriodType}
              onChange={(e) => setFilterPeriodType(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
            >
              <option value="bulanan">Bulanan</option>
              <option value="tahunan">Tahunan (T.A.)</option>
              <option value="harian">Rentang Tanggal (Harian)</option>
            </select>

            {/* Conditional Period Inputs */}
            {filterPeriodType === 'bulanan' && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </>
            )}

            {filterPeriodType === 'tahunan' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
              >
                <option value={2026}>Tahun 2026</option>
                <option value={2027}>Tahun 2027</option>
              </select>
            )}

            {filterPeriodType === 'harian' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
            >
              <option value="all">Semua Kelas</option>
              {classList.map(c => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
            >
              <option value="all">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Dibayar Sebagian">Dibayar Sebagian (Cicilan)</option>
              <option value="Belum Bayar">Belum Bayar</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Tunggakan">Semua Belum Lunas (Tunggakan)</option>
            </select>
          </div>

        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Menyaring <strong className="text-slate-800">{filteredBills.length}</strong> tagihan SPP terpilih</span>
          <span>Target: <strong className="text-slate-800">{formatRupiah(totalTargetTagihan)}</strong> | Masuk: <strong className="text-emerald-700">{formatRupiah(totalRealisasiMasuk)}</strong> | Tunggakan: <strong className="text-rose-600">{formatRupiah(totalSisaTunggakan)}</strong></span>
        </div>
      </div>

      {/* 3 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Tagihan */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Target Tagihan
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {formatRupiah(totalTargetTagihan)}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{filteredBills.length} Tagihan Terbit</span>
            <span>T.A. {settings.academicYear}</span>
          </div>
        </div>

        {/* Card 2: Pembayaran Diterima */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Kas Diterima (Realisasi)
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-800 font-mono mt-1 tabular-nums">
            {formatRupiah(totalRealisasiMasuk)}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">{persentaseCapaian}% Tercapai</span>
            <span className="text-slate-500">{validPayments.length} transaksi sah</span>
          </div>
        </div>

        {/* Card 3: Total Tunggakan */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Piutang / Tunggakan
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono mt-1 tabular-nums">
            {formatRupiah(totalSisaTunggakan)}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600">
            <span>{fullArrearsBills.length} Belum Bayar · {partialArrearsBills.length} Dicicil</span>
            <button 
              onClick={() => setActiveReportTab('tunggakan')}
              className="underline font-semibold hover:text-rose-800"
            >
              Lihat Santri
            </button>
          </div>
        </div>

      </div>

      {/* TAB 1: REKAPITULASI KEUANGAN TABEL */}
      {activeReportTab === 'rekap' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tabel Rincian Rekapitulasi Tagihan & Penerimaan Kas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar transaksi dan tagihan SPP sesuai periode dan kelas yang disaring
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
              {filteredBills.length} Tagihan
            </span>
          </div>

          {filteredBills.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Tidak ada data tagihan yang sesuai dengan filter yang dipilih.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Bulan Tagihan</th>
                    <th className="py-3 px-4 text-right">Target (Rp)</th>
                    <th className="py-3 px-4 text-right">Sudah Dibayar (Rp)</th>
                    <th className="py-3 px-4 text-right">Sisa Tunggakan (Rp)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Kasir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.slice(0, 30).map((b) => {
                    const paid = b.paidAmount || (b.status === 'Lunas' ? b.amount : 0);
                    const remaining = b.remainingAmount ?? (b.amount - paid);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{b.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">NIS: {b.studentNis}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          Kelas {b.classLevel}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          {b.monthName} {b.year}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 tabular-nums">
                          {formatRupiah(b.amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-800 tabular-nums">
                          {formatRupiah(paid)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold tabular-nums ${remaining > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {formatRupiah(remaining)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            b.status === 'Lunas' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            b.status === 'Dibayar Sebagian' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            b.status === 'Terlambat' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {b.status !== 'Lunas' && (
                            <button
                              onClick={() => handlePayStudent(b.studentId)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Bayar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredBills.length > 30 && (
                <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-100">
                  Menampilkan 30 dari {filteredBills.length} baris data. Silakan unduh CSV untuk dokumen lengkap.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REKAPITULASI BERDASARKAN KELAS */}
      {activeReportTab === 'kelas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rekapitulasi Pembayaran SPP Berdasarkan Kelas / Rombongan Belajar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi tingkat pelunasan per rombel santri dan perbandingan efektivitas penerimaan kas
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {classBreakdown.length} Rombel
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3.5 px-4">Kelas / Rombel</th>
                  <th className="py-3.5 px-4 text-center">Jumlah Santri</th>
                  <th className="py-3.5 px-4 text-right">Target Tagihan</th>
                  <th className="py-3.5 px-4 text-right">Realisasi Penerimaan</th>
                  <th className="py-3.5 px-4 text-right">Sisa Tunggakan</th>
                  <th className="py-3.5 px-4 text-center">Persentase Capaian</th>
                  <th className="py-3.5 px-4">Status Grafik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classBreakdown.map(([cls, data]) => {
                  const percent = data.target > 0 ? Math.round((data.paid / data.target) * 100) : 0;
                  return (
                    <tr key={cls} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Kelas {cls}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-700 font-mono">
                        {data.totalStudents} Santri
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                        {formatRupiah(data.target)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                        {formatRupiah(data.paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600 tabular-nums">
                        {formatRupiah(data.arrears)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {percent}%
                      </td>
                      <td className="py-3.5 px-4 w-44">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent >= 80 ? 'bg-emerald-600' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR SANTRI DENGAN TUNGGAKAN & PEMBAYARAN SEBAGIAN */}
      {activeReportTab === 'tunggakan' && (
        <div className="space-y-6">
          
          {/* Section A: Belum Bayar Sama Sekali (Tunggakan Penuh) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Daftar Santri Belum Membayar Sama Sekali ({fullArrearsBills.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Santri dengan tagihan yang belum memiliki riwayat setoran sama sekali pada periode ini
                </p>
              </div>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                Tunggakan Penuh
              </span>
            </div>

            {fullArrearsBills.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada santri dengan status belum bayar sama sekali pada filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                      <th className="py-3 px-4">Santri</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Bulan Tagihan</th>
                      <th className="py-3 px-4 text-right">Nominal Tunggakan</th>
                      <th className="py-3 px-4">Jatuh Tempo</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fullArrearsBills.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{b.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">NIS: {b.studentNis}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">Kelas {b.classLevel}</td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{b.monthName} {b.year}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 tabular-nums">
                          {formatRupiah(b.amount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{b.dueDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handlePayStudent(b.studentId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar Kasir</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: Pembayaran Sebagian (Cicilan Berjalan) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Daftar Santri dengan Pembayaran Sebagian / Cicilan ({partialArrearsBills.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Santri yang sudah mengangsur namun masih memiliki sisa saldo tagihan yang belum lunas
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                Cicilan Berjalan
              </span>
            </div>

            {partialArrearsBills.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada santri dengan status cicilan pada filter periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                      <th className="py-3 px-4">Santri</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Bulan Tagihan</th>
                      <th className="py-3 px-4 text-right">Total Tagihan</th>
                      <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                      <th className="py-3 px-4 text-right">Sisa Tagihan</th>
                      <th className="py-3 px-4 text-center">Riwayat Angsuran</th>
                      <th className="py-3 px-4 text-center">Aksi Pelunasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partialArrearsBills.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{b.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">NIS: {b.studentNis}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">Kelas {b.classLevel}</td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{b.monthName} {b.year}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                          {formatRupiah(b.amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-800 tabular-nums">
                          {formatRupiah(b.paidAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 tabular-nums">
                          {formatRupiah(b.remainingAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                            {b.installments?.length || 1}x Angsuran
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handlePayStudent(b.studentId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Lunaskan</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: RIWAYAT PEMBAYARAN PER SISWA (KARTU SPP) */}
      {activeReportTab === 'kartu-santri' && (
        <div className="space-y-6">
          
          {/* Student Selector Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Santri untuk Riwayat Kartu SPP:
              </label>
              <select
                value={selectedStudentForCard}
                onChange={(e) => setSelectedStudentForCard(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600 cursor-pointer"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (NIS: {s.nis} · Kelas {s.classLevel})
                  </option>
                ))}
              </select>
            </div>

            {currentCardStudent && (
              <div className="flex items-center gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Wali Santri:</span>
                  <span className="font-semibold text-slate-900">{currentCardStudent.guardianName} ({currentCardStudent.guardianPhone})</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Tarif SPP Bulanan:</span>
                  <span className="font-mono font-bold text-emerald-800">{formatRupiah(currentCardStudent.monthlySppAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Kartu SPP Santri Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Buku Catatan SPP Bulanan (Kartu Iuran) · {currentCardStudent?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekam jejak seluruh bulan tagihan, tanggal penyetoran, dan status kelulusan bayar santri
                </p>
              </div>
              <button
                onClick={() => currentCardStudent && handlePayStudent(currentCardStudent.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Input Setoran Santri Ini</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                    <th className="py-3.5 px-4">Bulan / Periode</th>
                    <th className="py-3.5 px-4 text-right">Nominal SPP</th>
                    <th className="py-3.5 px-4 text-right">Sudah Dibayar</th>
                    <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                    <th className="py-3.5 px-4">Tanggal Pembayaran</th>
                    <th className="py-3.5 px-4">Status SPP</th>
                    <th className="py-3.5 px-4">Riwayat Angsuran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentBillsHistory.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {b.monthName} {b.year}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                        {formatRupiah(b.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                        {formatRupiah(b.paidAmount || 0)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold tabular-nums ${b.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {formatRupiah(b.remainingAmount || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {b.paidAt ? formatIndonesianDate(b.paidAt, true) : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          b.status === 'Lunas' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          b.status === 'Dibayar Sebagian' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          b.status === 'Terlambat' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {b.installments && b.installments.length > 0 ? (
                          <div className="space-y-0.5">
                            {b.installments.map((inst, i) => (
                              <div key={i} className="text-[10px] font-mono">
                                #{inst.receiptNumber}: {formatRupiah(inst.amount)} ({inst.paymentMethod})
                              </div>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction Receipts for This Student */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Seluruh Bukti Pembayaran (Kwitansi Sah) · {currentCardStudent?.name}
              </h3>
            </div>
            {studentPaymentsHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Belum ada transaksi pembayaran yang dicatat untuk santri ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                      <th className="py-3 px-4">No. Kwitansi</th>
                      <th className="py-3 px-4">Waktu Setor</th>
                      <th className="py-3 px-4">Bulan yang Dibayar</th>
                      <th className="py-3 px-4 text-right">Jumlah Setor</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4">Penyetor (Wali)</th>
                      <th className="py-3 px-4">Petugas</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentPaymentsHistory.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800">{p.receiptNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{formatIndonesianDate(p.paidDate, true)}</td>
                        <td className="py-3 px-4 text-slate-800">{p.monthsCovered.join(', ')}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">{formatRupiah(p.totalAmount)}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium">{p.paymentMethod}</span></td>
                        <td className="py-3 px-4 text-slate-700">{p.payerName}</td>
                        <td className="py-3 px-4 text-slate-600">{p.cashierName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* PRINT-FRIENDLY MODAL / PREVIEW */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Actions Bar (Excluded from Print) */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
              <span className="text-xs font-semibold">Tinjauan Dokumen Resmi Laporan SPP</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Content Sheet */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white">
              
              {/* Kop Pesantren Resmi */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <p className="text-xs font-serif italic text-slate-600">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  {settings.pesantrenName}
                </h1>
                <p className="text-xs font-medium text-slate-700">{settings.tagline}</p>
                <p className="text-[11px] text-slate-500 max-w-2xl mx-auto">
                  {settings.address} · Telp: {settings.phone} · Email: {settings.email}
                </p>
              </div>

              {/* Title & Metadata */}
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold uppercase tracking-wider underline">
                  LAPORAN REKAPITULASI PENERIMAAN SPP SANTRI
                </h2>
                <p className="text-xs text-slate-600">
                  Tahun Ajaran {settings.academicYear} · Periode: {filterPeriodType === 'bulanan' ? `Bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : filterPeriodType === 'tahunan' ? `Tahun ${selectedYear}` : `${startDate} s.d. ${endDate}`}
                </p>
              </div>

              {/* Financial Summary Box */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Target Anggaran:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{formatRupiah(totalTargetTagihan)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Realisasi Kas Masuk:</span>
                  <span className="font-mono font-bold text-sm text-emerald-800">{formatRupiah(totalRealisasiMasuk)} ({persentaseCapaian}%)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sisa Tunggakan:</span>
                  <span className="font-mono font-bold text-sm text-rose-700">{formatRupiah(totalSisaTunggakan)}</span>
                </div>
              </div>

              {/* Rincian Tabel Ringkas */}
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th className="py-2 px-3 border-r border-slate-300">Kelas / Rombel</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Jumlah Santri</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Target SPP</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Kas Diterima</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Tunggakan</th>
                    <th className="py-2 px-3 text-center">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classBreakdown.map(([cls, d]) => (
                    <tr key={cls}>
                      <td className="py-2 px-3 font-semibold border-r border-slate-200">Kelas {cls}</td>
                      <td className="py-2 px-3 text-center font-mono border-r border-slate-200">{d.totalStudents}</td>
                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">{formatRupiah(d.target)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold border-r border-slate-200">{formatRupiah(d.paid)}</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-700 border-r border-slate-200">{formatRupiah(d.arrears)}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        {d.target > 0 ? Math.round((d.paid / d.target) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td className="py-2 px-3 border-r border-slate-300">TOTAL KESELURUHAN</td>
                    <td className="py-2 px-3 text-center border-r border-slate-300">{students.length}</td>
                    <td className="py-2 px-3 text-right font-mono border-r border-slate-300">{formatRupiah(totalTargetTagihan)}</td>
                    <td className="py-2 px-3 text-right font-mono border-r border-slate-300">{formatRupiah(totalRealisasiMasuk)}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-700 border-r border-slate-300">{formatRupiah(totalSisaTunggakan)}</td>
                    <td className="py-2 px-3 text-center font-mono">{persentaseCapaian}%</td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan Resmi */}
              <div className="pt-8 flex justify-between text-xs">
                <div className="text-center w-60">
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-semibold text-slate-800 mt-1">Pimpinan Pondok Pesantren</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{settings.principal || settings.headmaster}</p>
                  <p className="text-[10px] text-slate-500">Mudirul Ma'had</p>
                </div>

                <div className="text-center w-60">
                  <p className="text-slate-500">Bogor, {formatIndonesianDate(new Date())}</p>
                  <p className="font-semibold text-slate-800 mt-1">Bendahara Keuangan</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{settings.treasurer}</p>
                  <p className="text-[10px] text-slate-500">Bagian Keuangan & SPP</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
