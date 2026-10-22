import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MONTH_NAMES, formatRupiah, formatIndonesianDate, exportToCSV } from '../../utils/formatters';
import { Bill } from '../../types';
import { 
  FileText, 
  Search, 
  Calendar, 
  CreditCard, 
  PlusCircle, 
  Share2, 
  Download, 
  Eye, 
  X, 
  Check, 
  Printer, 
  Sliders, 
  ShieldAlert,
  Info
} from 'lucide-react';

export const BillsView: React.FC = () => {
  const { 
    bills, 
    students, 
    payments, 
    generateBillsForMonth, 
    generateBillsForClass,
    createSingleBill,
    updateNominalForClass,
    setActiveTab, 
    setPreselectedStudentIdForPayment, 
    setSelectedReceiptPayment,
    settings,
    addToast
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Oktober
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generationType, setGenerationType] = useState<'all' | 'class' | 'single'>('all');
  
  // Mass generate form
  const [genMonth, setGenMonth] = useState<number>(11); // November
  const [genYear, setGenYear] = useState<number>(2026);
  const [genClass, setGenClass] = useState<string>('VII-A');
  const [genStudentId, setGenStudentId] = useState<string>('');
  const [genCustomNominal, setGenCustomNominal] = useState<number>(650000);
  const [genDueDate, setGenDueDate] = useState<string>('2026-11-10');

  // Class Nominal Manager Modal
  const [isClassNominalModalOpen, setIsClassNominalModalOpen] = useState(false);
  const [targetClassForNominal, setTargetClassForNominal] = useState<string>('VII-A');
  const [newClassNominal, setNewClassNominal] = useState<number>(650000);

  // Detail Modal per Bill
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);

  // WhatsApp Reminder modal
  const [reminderBill, setReminderBill] = useState<Bill | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Available classes
  const classList = useMemo(() => {
    const set = new Set(students.map(s => s.classLevel));
    return Array.from(set).sort();
  }, [students]);

  // Set default student for single bill generator
  React.useEffect(() => {
    if (students.length > 0 && !genStudentId) {
      setGenStudentId(students[0].id);
      setGenCustomNominal(students[0].monthlySppAmount);
    }
  }, [students, genStudentId]);

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchMonth = b.month === selectedMonth;
      const matchYear = b.year === selectedYear;
      const matchStatus = selectedStatus === 'all' || b.status === selectedStatus;
      const matchClass = selectedClass === 'all' || b.classLevel === selectedClass;
      
      const studentName = b.studentName || '';
      const studentNis = b.studentNis || '';
      const matchSearch = studentName.toLowerCase().includes(search.toLowerCase()) || studentNis.includes(search);

      return matchMonth && matchYear && matchStatus && matchClass && matchSearch;
    });
  }, [bills, selectedMonth, selectedYear, selectedStatus, selectedClass, search]);

  // Aggregate stats for current selected month & year (Rekap Seluruh Tagihan)
  const allCurrentMonthBills = bills.filter(b => b.month === selectedMonth && b.year === selectedYear);
  const totalNominalTagihan = allCurrentMonthBills.reduce((sum, b) => sum + b.amount, 0);
  const totalSudahTerbayar = allCurrentMonthBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalSisaTunggakan = allCurrentMonthBills.reduce((sum, b) => sum + (b.remainingAmount ?? (b.amount - (b.paidAmount || 0))), 0);
  
  const lunasCount = allCurrentMonthBills.filter(b => b.status === 'Lunas').length;
  const sebagianCount = allCurrentMonthBills.filter(b => b.status === 'Dibayar Sebagian').length;
  const belumCount = allCurrentMonthBills.filter(b => b.status === 'Belum Bayar').length;
  const terlambatCount = allCurrentMonthBills.filter(b => b.status === 'Terlambat').length;

  const persentasePelunasan = totalNominalTagihan > 0 ? Math.round((totalSudahTerbayar / totalNominalTagihan) * 100) : 0;

  const handlePayBill = (studentId: string) => {
    setPreselectedStudentIdForPayment(studentId);
    setActiveTab('payment');
  };

  const handleViewReceiptByPaymentId = (paymentId?: string) => {
    if (!paymentId) return;
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedReceiptPayment(payment);
    } else {
      addToast('info', 'Data bukti kwitansi tidak ditemukan.', 'Info');
    }
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (generationType === 'all') {
      generateBillsForMonth(genMonth, genYear);
    } else if (generationType === 'class') {
      generateBillsForClass(genClass, genMonth, genYear, genCustomNominal);
    } else if (generationType === 'single') {
      createSingleBill({
        studentId: genStudentId,
        month: genMonth,
        year: genYear,
        amount: genCustomNominal,
        dueDate: genDueDate
      });
    }

    setIsGenerateModalOpen(false);
    setSelectedMonth(genMonth);
    setSelectedYear(genYear);
  };

  const handleSaveClassNominal = (e: React.FormEvent) => {
    e.preventDefault();
    updateNominalForClass(targetClassForNominal, newClassNominal);
    setIsClassNominalModalOpen(false);
  };

  const handleOpenReminder = (bill: Bill) => {
    setReminderBill(bill);
    setCopiedText(false);
  };

  const getReminderMessage = (bill: Bill) => {
    const student = students.find(s => s.id === bill.studentId);
    const guardian = student ? `${student.guardianName} (${student.guardianRelation})` : 'Orang Tua / Wali';
    const remaining = bill.remainingAmount ?? (bill.amount - (bill.paidAmount || 0));

    return `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Yth. Bapak/Ibu ${guardian},

Kami dari Bagian Keuangan ${settings.pesantrenName} menginformasikan tagihan iuran SPP ananda:
- Nama Santri: *${bill.studentName}* (NIS: ${bill.studentNis})
- Kelas: ${bill.classLevel}
- Periode: *SPP Bulan ${bill.monthName} ${bill.year}*
- Total Biaya: ${formatRupiah(bill.amount)}
${bill.status === 'Dibayar Sebagian' ? `- Sudah Dibayarkan: ${formatRupiah(bill.paidAmount || 0)}\n- Sisa Kekurangan: *${formatRupiah(remaining)}*` : `- Jumlah Tagihan: *${formatRupiah(remaining)}*`}
- Status: *${bill.status.toUpperCase()}*

Pembayaran dapat ditransfer melalui:
${settings.bankAccounts.map(b => `• ${b.bank}: *${b.accountNumber}* a.n. ${b.holderName}`).join('\n')}

Atau secara langsung di kantor bendahara pesantren.
Mohon konfirmasi jika telah melakukan pembayaran.

Jazakumullahu Khairan Katsiran.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.
_Bagian Keuangan ${settings.pesantrenName}_`;
  };

  const handleCopyReminder = () => {
    if (!reminderBill) return;
    navigator.clipboard.writeText(getReminderMessage(reminderBill));
    setCopiedText(true);
    addToast('success', 'Pesan pengingat tagihan berhasil disalin.', 'Tersalin ke Clipboard');
  };

  const handleExportCSV = () => {
    const headers = [
      'Bulan & Tahun',
      'NIS',
      'Nama Santri',
      'Kelas',
      'Total Tagihan (Rp)',
      'Sudah Dibayar (Rp)',
      'Sisa Tagihan (Rp)',
      'Jatuh Tempo',
      'Status Pembayaran'
    ];
    const rows = filteredBills.map(b => [
      `${b.monthName} ${b.year}`,
      b.studentNis || '',
      b.studentName || '',
      b.classLevel || '',
      b.amount,
      b.paidAmount || 0,
      b.remainingAmount ?? (b.amount - (b.paidAmount || 0)),
      b.dueDate,
      b.status
    ]);
    exportToCSV(`Rekap_Tagihan_SPP_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}`, headers, rows);
  };

  return (
    <div className="space-y-6">

      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            Tagihan SPP Bulanan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen tagihan per periode, nominal kelas/siswa, monitoring cicilan, dan pencegahan tagihan ganda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsClassNominalModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs"
            title="Atur tarif dasar SPP per rombel kelas"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Atur Tarif per Kelas</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor Rekap</span>
          </button>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Tagihan Baru</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Strip (Rekap Seluruh Tagihan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Tagihan ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
          </span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {formatRupiah(totalNominalTagihan)}
          </p>
          <span className="text-xs text-slate-500">{allCurrentMonthBills.length} lembar tagihan terbit</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Realisasi Diterima
          </span>
          <p className="text-xl font-bold text-emerald-800 font-mono mt-1 tabular-nums">
            {formatRupiah(totalSudahTerbayar)}
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-700 mt-0.5">
            <span>{lunasCount} Lunas</span>
            <span>·</span>
            <span>{sebagianCount} Dicicil</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Sisa Belum Bayar / Tunggakan
          </span>
          <p className="text-xl font-bold text-rose-600 font-mono mt-1 tabular-nums">
            {formatRupiah(totalSisaTunggakan)}
          </p>
          <div className="flex items-center gap-2 text-xs text-rose-600 mt-0.5">
            <span>{belumCount} Belum Bayar</span>
            {terlambatCount > 0 && <span>· {terlambatCount} Terlambat</span>}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Persentase Pelunasan
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-emerald-800 font-mono">
              {persentasePelunasan}%
            </span>
            <span className="text-xs text-slate-500">T.A. {selectedYear}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300" 
              style={{ width: `${persentasePelunasan}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        
        {/* Month, Year, Status, & Class Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Periode Bulan & Tahun */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>
                  Bulan {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-900 focus:outline-hidden ml-1 cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Dibayar Sebagian">Dibayar Sebagian</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="Terlambat">Terlambat</option>
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600 cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {classList.map(cls => (
              <option key={cls} value={cls}>Kelas {cls}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari santri atau nomor induk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white transition-all"
          />
        </div>

      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <p>Tidak ada tagihan untuk periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear} dengan filter yang dipilih.</p>
            <button
              onClick={() => {
                setGenMonth(selectedMonth);
                setGenYear(selectedYear);
                setGenerationType('all');
                setIsGenerateModalOpen(true);
              }}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
            >
              Terbitkan Tagihan Bulan Ini Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3.5 px-4">Santri</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Bulan Tagihan</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-right">Sudah Dibayar</th>
                  <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                  <th className="py-3.5 px-4">Jatuh Tempo</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => {
                  const remaining = b.remainingAmount ?? (b.amount - (b.paidAmount || 0));

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIS: {b.studentNis}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        Kelas {b.classLevel}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold">
                        {b.monthName} {b.year}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(b.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-800 tabular-nums">
                        {formatRupiah(b.paidAmount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={remaining > 0 ? (b.status === 'Terlambat' ? 'text-rose-600' : 'text-slate-800') : 'text-slate-400'}>
                          {formatRupiah(remaining)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {b.dueDate}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          b.status === 'Lunas'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : b.status === 'Dibayar Sebagian'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : b.status === 'Terlambat'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail Button */}
                          <button
                            onClick={() => setViewingBill(b)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Lihat Detail Tagihan & Rincian Cicilan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {b.status === 'Lunas' ? (
                            <button
                              onClick={() => handleViewReceiptByPaymentId(b.paymentId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                              title="Lihat Bukti Kwitansi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Kwitansi</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handlePayBill(b.studentId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                                title={b.status === 'Dibayar Sebagian' ? 'Bayar Sisa Cicilan' : 'Proses Bayar'}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>{b.status === 'Dibayar Sebagian' ? 'Lunasi' : 'Bayar'}</span>
                              </button>
                              <button
                                onClick={() => handleOpenReminder(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                                title="Kirim Pengingat WhatsApp ke Wali"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WA</span>
                              </button>
                            </>
                          )}
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

      {/* Modal Detail Tagihan per Siswa */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <span className="text-xs text-emerald-400 font-mono">ID Tagihan: {viewingBill.id}</span>
                <h3 className="font-bold text-sm">Detail Tagihan: {viewingBill.studentName}</h3>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Santri / NIS</span>
                  <p className="font-bold text-slate-900">{viewingBill.studentName}</p>
                  <p className="font-mono text-slate-500">{viewingBill.studentNis} · Kelas {viewingBill.classLevel}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bulan & Jatuh Tempo</span>
                  <p className="font-bold text-emerald-800">{viewingBill.monthName} {viewingBill.year}</p>
                  <p className="font-mono text-slate-500">Jatuh Tempo: {viewingBill.dueDate}</p>
                </div>
              </div>

              {/* Status and Numbers Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Tagihan</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{formatRupiah(viewingBill.amount)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block text-[10px] uppercase font-semibold">Telah Dibayar</span>
                  <p className="font-mono font-bold text-emerald-800 text-sm mt-0.5">{formatRupiah(viewingBill.paidAmount || 0)}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-700 block text-[10px] uppercase font-semibold">Sisa Tagihan</span>
                  <p className="font-mono font-bold text-rose-600 text-sm mt-0.5">
                    {formatRupiah(viewingBill.remainingAmount ?? (viewingBill.amount - (viewingBill.paidAmount || 0)))}
                  </p>
                </div>
              </div>

              {/* Rincian Komponen Biaya */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Rincian Komponen Iuran
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>1. SPP Pendidikan / Pembinaan:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatRupiah(viewingBill.breakdown.spp)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>2. Pemeliharaan Asrama & Listrik:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatRupiah(viewingBill.breakdown.asrama)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>3. Konsumsi & Dapur Santri:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatRupiah(viewingBill.breakdown.konsumsi)}</span>
                </div>
              </div>

              {/* Riwayat Angsuran / Pembayaran */}
              <div>
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Riwayat Pembayaran / Cicilan ({(viewingBill.installments || []).length} Transaksi)
                </span>
                {(!viewingBill.installments || viewingBill.installments.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    Belum ada pembayaran yang tercatat untuk tagihan ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {viewingBill.installments.map(inst => (
                      <div key={inst.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-mono font-bold text-emerald-800">{inst.receiptNumber}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{formatIndonesianDate(inst.paidDate, true)} · {inst.paymentMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-900">{formatRupiah(inst.amount)}</p>
                          <p className="text-[10px] text-slate-400">Petugas: {inst.cashierName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => setViewingBill(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <div className="flex items-center gap-2">
                  {viewingBill.status !== 'Lunas' && (
                    <button
                      onClick={() => {
                        const sid = viewingBill.studentId;
                        setViewingBill(null);
                        handlePayBill(sid);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Bayar / Lunasi Tagihan Ini</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Terbitkan Tagihan Baru (Massal / Per Kelas / Per Santri) */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-semibold text-sm">Pembuatan Tagihan SPP</h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerateSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {/* Duplicate Prevention Notice */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Perlindungan Tagihan Ganda Aktif:</strong> Sistem otomatis mendeteksi dan mencegah pembuatan tagihan duplikat jika santri sudah memiliki tagihan pada bulan & tahun yang sama.
                </p>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Pilih Lingkup Pembuatan Tagihan:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setGenerationType('all')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      generationType === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Semua Santri Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationType('class')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      generationType === 'class'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Berdasarkan Kelas
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationType('single')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      generationType === 'single'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Per Santri Tertentu
                  </button>
                </div>
              </div>

              {/* If Single: Choose student */}
              {generationType === 'single' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Santri *
                  </label>
                  <select
                    value={genStudentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setGenStudentId(id);
                      const st = students.find(s => s.id === id);
                      if (st) setGenCustomNominal(st.monthlySppAmount);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-medium"
                  >
                    {students.filter(s => s.status === 'Aktif').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis}) - Kelas {s.classLevel}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If Class: Choose class */}
              {generationType === 'class' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Kelas / Rombel *
                  </label>
                  <select
                    value={genClass}
                    onChange={(e) => setGenClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-medium"
                  >
                    {classList.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Period selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bulan Tagihan *
                  </label>
                  <select
                    value={genMonth}
                    onChange={(e) => setGenMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={i} value={i + 1}>
                        Bulan {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Akademik *
                  </label>
                  <select
                    value={genYear}
                    onChange={(e) => setGenYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Nominal Override (if single or class) */}
              {(generationType === 'single' || generationType === 'class') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nominal SPP (Rp)
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={genCustomNominal}
                      onChange={(e) => setGenCustomNominal(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Jatuh Tempo
                    </label>
                    <input
                      type="date"
                      value={genDueDate}
                      onChange={(e) => setGenDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-emerald-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Buat Tagihan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Atur Tarif SPP per Kelas */}
      {isClassNominalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-semibold text-sm">Pengaturan Tarif SPP per Kelas</h3>
              <button
                onClick={() => setIsClassNominalModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClassNominal} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Pilih rombel kelas dan tentukan besaran nominal SPP bulanan. Semua santri pada kelas yang dipilih akan disesuaikan tarif SPP-nya.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kelas / Rombel *
                </label>
                <select
                  value={targetClassForNominal}
                  onChange={(e) => setTargetClassForNominal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-semibold"
                >
                  {classList.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal SPP Baru per Bulan (Rp) *
                </label>
                <input
                  type="number"
                  required
                  step="10000"
                  value={newClassNominal}
                  onChange={(e) => setNewClassNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Terbilang: {formatRupiah(newClassNominal)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassNominalModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Terapkan ke Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengingat WhatsApp */}
      {reminderBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-semibold text-sm">Template Pengingat WhatsApp Tagihan</h3>
              <button
                onClick={() => setReminderBill(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600">
                Kirim pesan sopan resmi kepada wali santri <strong className="text-slate-900">{reminderBill.studentName}</strong>:
              </div>

              <textarea
                readOnly
                rows={11}
                value={getReminderMessage(reminderBill)}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-800 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setReminderBill(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyReminder}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedText ? 'Teks Tersalin!' : 'Salin Pesan WA'}</span>
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
