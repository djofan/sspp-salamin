import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import { formatRupiah, formatIndonesianDate, exportToCSV } from '../../utils/formatters';
import { 
  History, 
  Search, 
  Download, 
  Printer, 
  Eye, 
  Ban, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Calendar,
  Filter,
  CreditCard,
  Building2,
  Banknote,
  QrCode
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { payments, students, cancelPayment, setSelectedReceiptPayment, settings } = useApp();

  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [cancellingPayment, setCancellingPayment] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Extract distinct class list
  const classList = useMemo(() => {
    const set = new Set(students.map(s => s.classLevel));
    return Array.from(set).sort();
  }, [students]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Search
      const matchSearch = 
        p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.studentName.toLowerCase().includes(search.toLowerCase()) ||
        p.studentNis.includes(search) ||
        p.payerName.toLowerCase().includes(search.toLowerCase()) ||
        p.classLevel.toLowerCase().includes(search.toLowerCase());

      // Method
      let matchMethod = true;
      if (selectedMethod !== 'all') {
        if (selectedMethod === 'Transfer Bank') {
          matchMethod = p.paymentMethod.startsWith('Transfer');
        } else {
          matchMethod = p.paymentMethod === selectedMethod;
        }
      }

      // Class
      const matchClass = selectedClass === 'all' || p.classLevel === selectedClass;

      // Student
      const matchStudent = selectedStudentId === 'all' || p.studentId === selectedStudentId;

      // Status (Berhasil vs Dibatalkan)
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;

      // Period filter
      let matchPeriod = true;
      if (selectedPeriod !== 'all') {
        const pDate = new Date(p.paidDate);
        const pMonth = pDate.getMonth() + 1; // 1-12
        const pYear = pDate.getFullYear();

        if (selectedPeriod === 'current') {
          matchPeriod = pMonth === 10 && pYear === 2026;
        } else if (selectedPeriod === 'september') {
          matchPeriod = pMonth === 9 && pYear === 2026;
        } else if (selectedPeriod === 'august') {
          matchPeriod = pMonth === 8 && pYear === 2026;
        } else if (selectedPeriod === 'july') {
          matchPeriod = pMonth === 7 && pYear === 2026;
        }
      }

      return matchSearch && matchMethod && matchClass && matchStudent && matchStatus && matchPeriod;
    });
  }, [payments, search, selectedMethod, selectedClass, selectedStudentId, selectedStatus, selectedPeriod]);

  // Total nominal for valid (non-cancelled) transactions only!
  const validPayments = filteredPayments.filter(p => p.status !== 'Dibatalkan');
  const totalNominalSah = validPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const cancelledPaymentsCount = filteredPayments.filter(p => p.status === 'Dibatalkan').length;

  const handleOpenCancelModal = (p: Payment) => {
    setCancellingPayment(p);
    setCancelReason('');
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingPayment || !cancelReason.trim()) return;

    cancelPayment(cancellingPayment.id, cancelReason.trim(), settings.treasurer);
    setCancellingPayment(null);
    setCancelReason('');
  };

  const handleExportCSV = () => {
    const headers = [
      'No. Transaksi / Kwitansi',
      'Tanggal & Jam',
      'NIS',
      'Nama Santri',
      'Kelas',
      'Bulan SPP yang Dibayar',
      'Jumlah Pembayaran (Rp)',
      'Metode Pembayaran',
      'Status Transaksi',
      'Penyetor',
      'Petugas Kasir',
      'Tanggal Pembatalan',
      'Alasan Pembatalan',
      'Petugas Pembatal',
      'Catatan'
    ];
    const rows = filteredPayments.map(p => [
      p.receiptNumber,
      formatIndonesianDate(p.paidDate, true),
      p.studentNis,
      p.studentName,
      p.classLevel,
      p.monthsCovered.join('; '),
      p.totalAmount,
      p.paymentMethod,
      p.status,
      p.payerName,
      p.cashierName,
      p.cancelledAt ? formatIndonesianDate(p.cancelledAt, true) : '-',
      p.cancelReason || '-',
      p.cancelledBy || '-',
      p.notes || ''
    ]);
    exportToCSV(`Jurnal_Transaksi_SPP_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            Riwayat Pembayaran & Transaksi SPP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buku kas jurnal seluruh setoran, bukti pembayaran cetak, dan pencatatan audit pembatalan transaksi.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Ekspor Jurnal Transaksi</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Kas Diterima (Sah)</span>
          <p className="text-2xl font-bold text-emerald-800 font-mono mt-1 tabular-nums">{formatRupiah(totalNominalSah)}</p>
          <span className="text-xs text-slate-500">{validPayments.length} transaksi berstatus Berhasil</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rata-rata Transaksi</span>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {formatRupiah(validPayments.length > 0 ? Math.round(totalNominalSah / validPayments.length) : 0)}
          </p>
          <span className="text-xs text-slate-500">Per bukti kwitansi sah</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Transaksi Dibatalkan</span>
          <p className="text-2xl font-bold text-rose-600 font-mono mt-1 tabular-nums">
            {cancelledPaymentsCount} Transaksi
          </p>
          <span className="text-xs text-rose-600">Saldo tagihan telah dipulihkan</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no transaksi, santri, NIS, atau wali..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            
            {/* Periode */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Periode</option>
              <option value="current">Bulan Ini (Oktober 2026)</option>
              <option value="september">September 2026</option>
              <option value="august">Agustus 2026</option>
              <option value="july">Juli 2026</option>
            </select>

            {/* Kelas */}
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

            {/* Metode Pembayaran */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Metode</option>
              <option value="Tunai">Tunai / Kas</option>
              <option value="Transfer Bank">Transfer Bank (Semua)</option>
              <option value="Transfer BSI">Transfer BSI</option>
              <option value="Transfer BCA">Transfer BCA</option>
              <option value="QRIS">QRIS Pesantren</option>
            </select>

            {/* Status Transaksi */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Status Transaksi</option>
              <option value="Berhasil">Berhasil (Sah)</option>
              <option value="Dibatalkan">Dibatalkan (Void)</option>
            </select>

            {(search || selectedMethod !== 'all' || selectedClass !== 'all' || selectedStatus !== 'all' || selectedPeriod !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedMethod('all');
                  setSelectedClass('all');
                  setSelectedStatus('all');
                  setSelectedPeriod('all');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 underline"
              >
                Reset
              </button>
            )}

          </div>

        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan <strong className="text-slate-900">{filteredPayments.length}</strong> transaksi</span>
          <span className="font-mono text-emerald-800 font-semibold">Total Nominal Sah: {formatRupiah(totalNominalSah)}</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Tidak ada transaksi pembayaran yang cocok dengan kriteria filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3.5 px-4">No. Transaksi</th>
                  <th className="py-3.5 px-4">Tanggal Pembayaran</th>
                  <th className="py-3.5 px-4">Santri</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Bulan SPP</th>
                  <th className="py-3.5 px-4 text-right">Nominal</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const isCancelled = p.status === 'Dibatalkan';

                  return (
                    <tr 
                      key={p.id} 
                      className={`transition-colors ${
                        isCancelled ? 'bg-rose-50/30 opacity-75 hover:bg-rose-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                        <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                          {p.receiptNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {formatIndonesianDate(p.paidDate, true)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-semibold ${isCancelled ? 'text-slate-600' : 'text-slate-900'}`}>
                          {p.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">NIS: {p.studentNis}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        Kelas {p.classLevel}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {p.monthsCovered.join(', ')}
                        {p.paymentType === 'Cicilan / Sebagian' && (
                          <span className="text-[10px] text-amber-700 ml-1 font-semibold">(Cicilan)</span>
                        )}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold tabular-nums ${
                        isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}>
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isCancelled 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail Button */}
                          <button
                            onClick={() => setViewingPayment(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Lihat Detail Transaksi & Rincian Pembatalan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print / Kwitansi */}
                          <button
                            onClick={() => setSelectedReceiptPayment(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                            title="Cetak Bukti Pembayaran"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Kwitansi</span>
                          </button>

                          {/* Cancel Transaction Button (only if not yet cancelled) */}
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenCancelModal(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Batalkan Transaksi & Pulihkan Saldo Tagihan"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
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

      {/* Modal Detail Transaksi */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <span className="text-xs text-emerald-400 font-mono">No. Transaksi: {viewingPayment.receiptNumber}</span>
                <h3 className="font-bold text-sm">Detail Transaksi Pembayaran</h3>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Status Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                viewingPayment.status === 'Dibatalkan'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <div>
                  <span className="font-bold text-sm">Status Transaksi: {viewingPayment.status.toUpperCase()}</span>
                  <p className="text-[11px] mt-0.5">
                    {viewingPayment.status === 'Dibatalkan' 
                      ? 'Transaksi ini telah dibatalkan resmi. Saldo tagihan santri telah dipulihkan.' 
                      : 'Transaksi sah dan telah terverifikasi dalam pembukuan kas.'}
                  </p>
                </div>
                <span className="text-xl font-bold font-mono">
                  {formatRupiah(viewingPayment.totalAmount)}
                </span>
              </div>

              {/* Cancellation Audit Box if cancelled */}
              {viewingPayment.status === 'Dibatalkan' && (
                <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 space-y-1.5 text-xs text-rose-950">
                  <span className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Catatan Audit Pembatalan:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-500">Tanggal Dibatalkan:</span>
                      <p className="font-mono font-medium">{viewingPayment.cancelledAt ? formatIndonesianDate(viewingPayment.cancelledAt, true) : '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Petugas Pembatal:</span>
                      <p className="font-medium">{viewingPayment.cancelledBy || '-'}</p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500">Alasan Pembatalan:</span>
                    <p className="font-semibold text-rose-900 italic mt-0.5 bg-white p-2 rounded border border-rose-200">
                      "{viewingPayment.cancelReason || 'Tidak disebutkan'}"
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Attributes */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Santri:</span>
                  <span className="font-semibold text-slate-900">{viewingPayment.studentName} ({viewingPayment.studentNis})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kelas / Rombel:</span>
                  <span className="text-slate-800">Kelas {viewingPayment.classLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Pembayaran:</span>
                  <span className="font-mono text-slate-800">{formatIndonesianDate(viewingPayment.paidDate, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penyetor (Wali):</span>
                  <span className="text-slate-800">{viewingPayment.payerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Bendahara:</span>
                  <span className="text-slate-800">{viewingPayment.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Pembayaran:</span>
                  <span className="font-medium text-slate-900">{viewingPayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bulan yang Dilunasi:</span>
                  <span className="font-semibold text-emerald-800">{viewingPayment.monthsCovered.join(', ')}</span>
                </div>
                {viewingPayment.notes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <span className="text-slate-500 block text-[11px]">Keterangan:</span>
                    <p className="italic">{viewingPayment.notes}</p>
                  </div>
                )}
              </div>

              {/* Rincian Alokasi per Tagihan */}
              {viewingPayment.billPaymentDetails && viewingPayment.billPaymentDetails.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1.5 uppercase text-[11px] tracking-wider">
                    Rincian Alokasi Dana per Tagihan:
                  </span>
                  <div className="space-y-1.5">
                    {viewingPayment.billPaymentDetails.map(d => (
                      <div key={d.billId} className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700">SPP Bulan {d.monthName} {d.year}</span>
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(d.amountPaid)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => setViewingPayment(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const p = viewingPayment;
                      setViewingPayment(null);
                      setSelectedReceiptPayment(p);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Kwitansi</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembatalan Transaksi */}
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-rose-600 text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Konfirmasi Pembatalan Transaksi</h3>
              </div>
              <button
                onClick={() => setCancellingPayment(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4 text-xs">
              
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                <p className="font-bold mb-1">Penting:</p>
                <p>
                  Transaksi <strong>{cancellingPayment.receiptNumber}</strong> sebesar <strong>{formatRupiah(cancellingPayment.totalAmount)}</strong> untuk santri <strong>{cancellingPayment.studentName}</strong> akan dibatalkan.
                </p>
                <p className="mt-1 text-[11px] text-amber-800">
                  Sistem tidak akan menghapus riwayat secara diam-diam, melainkan mencatat status <em>Dibatalkan</em> dan <strong>secara otomatis mengembalikan saldo tagihan santri</strong> ke status belum lunas / sebagian.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Pembatalan Transaksi *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Salah memasukkan nominal / Bukti transfer fiktif / Salah pilih nama santri"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellingPayment(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!cancelReason.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  Ya, Batalkan Transaksi Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
