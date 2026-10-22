import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatIndonesianDate, MONTH_NAMES } from '../../utils/formatters';
import { 
  Users, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  ChevronRight,
  Printer,
  Sparkles,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    students, 
    bills, 
    payments, 
    setActiveTab, 
    setSelectedReceiptPayment, 
    setPreselectedStudentIdForPayment 
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Oktober
  const [selectedYear] = useState<number>(2026);

  // 1. Total Siswa Aktif
  const activeStudents = students.filter(s => s.status === 'Aktif');
  const totalActiveStudents = activeStudents.length;
  const boysCount = activeStudents.filter(s => s.gender === 'L').length;
  const girlsCount = activeStudents.filter(s => s.gender === 'P').length;

  // 2. Bills for selected month (Oktober 2026)
  const currentMonthBills = bills.filter(b => b.month === selectedMonth && b.year === selectedYear);
  const totalTagihanBulanIni = currentMonthBills.reduce((acc, b) => acc + b.amount, 0);

  // 3. Total Pembayaran yang Sudah Diterima Bulan Ini
  const totalDiterimaBulanIni = currentMonthBills.reduce((acc, b) => acc + (b.paidAmount || (b.status === 'Lunas' ? b.amount : 0)), 0);
  const persentaseTerkumpul = totalTagihanBulanIni > 0 
    ? Math.round((totalDiterimaBulanIni / totalTagihanBulanIni) * 100) 
    : 0;

  // 4. Total Tunggakan SPP (All unpaid, partially paid & overdue bills across all months)
  const allUnpaidBills = bills.filter(b => b.status !== 'Lunas');
  const totalTunggakanSemua = allUnpaidBills.reduce((acc, b) => acc + (b.remainingAmount ?? (b.amount - (b.paidAmount || 0))), 0);
  const totalSantriNunggak = new Set(allUnpaidBills.map(b => b.studentId)).size;

  // 5. Ringkasan status pembayaran bulan ini
  const lunasCountBulanIni = currentMonthBills.filter(b => b.status === 'Lunas').length;
  const sebagianCountBulanIni = currentMonthBills.filter(b => b.status === 'Dibayar Sebagian').length;
  const belumCountBulanIni = currentMonthBills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat').length;

  // 6. Monthly trend data for the chart (Juli, Agustus, September, Oktober 2026)
  const chartMonths = [
    { month: 7, name: 'Jul' },
    { month: 8, name: 'Ags' },
    { month: 9, name: 'Sep' },
    { month: 10, name: 'Okt' },
  ];

  const chartData = chartMonths.map(m => {
    const monthBills = bills.filter(b => b.month === m.month && b.year === 2026);
    const target = monthBills.reduce((sum, b) => sum + b.amount, 0);
    const received = monthBills.reduce((sum, b) => sum + (b.paidAmount || (b.status === 'Lunas' ? b.amount : 0)), 0);
    return {
      label: m.name,
      target,
      received,
      percentage: target > 0 ? Math.round((received / target) * 100) : 0
    };
  });

  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.target, d.received)), 15000000);

  // 7. Payment method distribution (only count valid non-cancelled payments)
  const validPayments = payments.filter(p => p.status !== 'Dibatalkan');
  const methodCounts: Record<string, number> = {};
  validPayments.forEach(p => {
    methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] || 0) + 1;
  });

  // Recent 6 payments
  const recentPayments = payments.slice(0, 6);

  const handlePayForStudent = (studentId: string) => {
    setPreselectedStudentIdForPayment(studentId);
    setActiveTab('payment');
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-2xl text-white shadow-sm border border-emerald-900/40">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Tahun Ajaran 2026/2027 · Semester Ganjil</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Pondok Pesantren Salamatul Insan
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Sistem rekapitulasi pembayaran SPP bulanan, pencatatan kasir bendahara, dan pemantauan tunggakan santri secara terpusat.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('payment')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Terima Pembayaran</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
          >
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Santri Aktif */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Santri Aktif
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
                {totalActiveStudents}
              </h3>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{boysCount} Santriwan (Putra)</span>
            <span>·</span>
            <span>{girlsCount} Santriwati (Putri)</span>
          </div>
        </div>

        {/* Card 2: Total Tagihan Bulan Ini */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tagihan SPP ({MONTH_NAMES[selectedMonth - 1]})
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
                {formatRupiah(totalTagihanBulanIni)}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total {currentMonthBills.length} Tagihan Terbit</span>
            <span className="text-emerald-700 font-medium">Jatuh Tempo: 10 {MONTH_NAMES[selectedMonth - 1]}</span>
          </div>
        </div>

        {/* Card 3: Total Pembayaran Diterima */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pembayaran Diterima
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono mt-1 tabular-nums">
                {formatRupiah(totalDiterimaBulanIni)}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">{persentaseTerkumpul}% Terbayar</span>
            <span className="text-slate-500 font-mono">{lunasCountBulanIni} Lunas · {sebagianCountBulanIni} Dicicil</span>
          </div>
        </div>

        {/* Card 4: Total Tunggakan */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Tunggakan
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono mt-1 tabular-nums">
                {formatRupiah(totalTunggakanSemua)}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-rose-600 font-medium">{totalSantriNunggak} Santri Menunggak</span>
            <button 
              onClick={() => setActiveTab('bills')}
              className="text-xs text-slate-700 hover:text-emerald-700 font-medium underline transition-colors"
            >
              Lihat Rincian
            </button>
          </div>
        </div>

      </div>

      {/* Ringkasan Status Pembayaran Santri Bulan Ini */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Status Pembayaran SPP Bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rasio santri yang telah melunasi, mengangsur, atau belum membayar tagihan bulan berjalan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="text-slate-700 font-medium">Lunas: {lunasCountBulanIni} Santri</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-700 font-medium">Cicilan: {sebagianCountBulanIni} Santri</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="text-slate-700 font-medium">Belum Bayar: {belumCountBulanIni} Santri</span>
            </div>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        {(() => {
          const totalBillsCount = currentMonthBills.length || 1;
          const lunasPercent = Math.round((lunasCountBulanIni / totalBillsCount) * 100);
          const sebagianPercent = Math.round((sebagianCountBulanIni / totalBillsCount) * 100);
          const belumPercent = Math.max(0, 100 - lunasPercent - sebagianPercent);

          return (
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500"
                style={{ width: `${lunasPercent}%` }}
                title={`Lunas: ${lunasPercent}%`}
              />
              <div 
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${sebagianPercent}%` }}
                title={`Dicicil Sebagian: ${sebagianPercent}%`}
              />
              <div 
                className="bg-rose-400 h-full transition-all duration-500"
                style={{ width: `${belumPercent}%` }}
                title={`Belum Bayar: ${belumPercent}%`}
              />
            </div>
          );
        })()}

        {/* Breakdown by program */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
          {(['MTs', 'MA', 'Tahfizh'] as const).map(program => {
            const programStudents = activeStudents.filter(s => s.program === program);
            const programStudentIds = new Set(programStudents.map(s => s.id));
            const programBills = currentMonthBills.filter(b => programStudentIds.has(b.studentId));
            const programPaid = programBills.filter(b => b.status === 'Lunas').length;
            const programTotal = programBills.length;
            const rate = programTotal > 0 ? Math.round((programPaid / programTotal) * 100) : 0;

            return (
              <div key={program} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Tingkat {program}</span>
                  <p className="text-[11px] text-slate-500">
                    {programPaid} dari {programTotal} santri lunas
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-emerald-800">{rate}%</span>
                  <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-600 h-full" style={{ width: `${rate}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Grafik Pembayaran Bulanan & Ringkasan Metode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grafik Pembayaran Bulanan (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  Grafik Pembayaran SPP Bulanan (T.A. 2026/2027)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan target tagihan vs realisasi penerimaan kas bulanan
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-200"></span>
                  <span className="text-slate-600">Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600"></span>
                  <span className="text-slate-600 font-medium">Realisasi</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-60 w-full flex items-end gap-6 sm:gap-10 pt-6 px-4 pb-2 border-b border-slate-100">
              {chartData.map((d, i) => {
                const targetHeightPercent = Math.round((d.target / maxChartValue) * 100);
                const receivedHeightPercent = Math.round((d.received / maxChartValue) * 100);

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap font-mono">
                      Target: {formatRupiah(d.target)} | Masuk: {formatRupiah(d.received)} ({d.percentage}%)
                    </div>

                    <div className="w-full max-w-16 flex items-end justify-center gap-2 h-full">
                      {/* Target Bar */}
                      <div 
                        className="w-1/2 bg-slate-200 rounded-t-md transition-all duration-300 group-hover:bg-slate-300"
                        style={{ height: `${targetHeightPercent}%` }}
                        title={`Target: ${formatRupiah(d.target)}`}
                      />
                      {/* Received Bar */}
                      <div 
                        className="w-1/2 bg-emerald-600 rounded-t-md transition-all duration-300 group-hover:bg-emerald-500 shadow-xs"
                        style={{ height: `${receivedHeightPercent}%` }}
                        title={`Realisasi: ${formatRupiah(d.received)}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 mt-2">
                      {d.label}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                      {d.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Data per 22 Oktober 2026</span>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Lihat Laporan Lengkap <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ringkasan Metode Pembayaran & Jalur Cepat (1 col) */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              Kanal Penerimaan Kas
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribusi metode pelunasan SPP santri
            </p>

            <div className="space-y-3">
              {['Transfer BSI', 'Transfer BCA', 'Tunai', 'QRIS'].map((method) => {
                const count = methodCounts[method] || 0;
                const total = payments.length || 1;
                const percent = Math.round((count / total) * 100);

                return (
                  <div key={method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{method}</span>
                      <span className="text-slate-500 font-mono">{count} tx ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          method === 'Transfer BSI' ? 'bg-emerald-600' :
                          method === 'Transfer BCA' ? 'bg-blue-600' :
                          method === 'Tunai' ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Akses Cepat */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
              Jalur Cepat
            </span>
            <button
              onClick={() => setActiveTab('bills')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors"
            >
              <span>Daftar Tagihan Belum Lunas</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors"
            >
              <span>Kelola Data Santri / Kelas</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Tabel Pembayaran Terbaru */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-700" />
              Tabel Pembayaran Terbaru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar transaksi pelunasan SPP santri yang baru saja tercatat di sistem
            </p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
          >
            Lihat Semua Transaksi ({payments.length})
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Belum ada data transaksi pembayaran yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="py-3 px-4">No. Kwitansi</th>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Pembayaran Bulan</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => {
                  const isCancelled = p.status === 'Dibatalkan';
                  return (
                    <tr 
                      key={p.id} 
                      className={`transition-colors ${
                        isCancelled ? 'bg-rose-50/30 opacity-80 hover:bg-rose-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-emerald-800">
                        <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                          {p.receiptNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${isCancelled ? 'text-slate-600' : 'text-slate-900'}`}>{p.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIS: {p.studentNis}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        Kelas {p.classLevel}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {p.monthsCovered.join(', ')}
                        {p.paymentType === 'Cicilan / Sebagian' && (
                          <span className="text-[10px] text-amber-700 ml-1 font-semibold">(Cicilan)</span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-semibold tabular-nums ${
                        isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}>
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isCancelled 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {p.status || 'Berhasil'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatIndonesianDate(p.paidDate, true)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedReceiptPayment(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                          title="Lihat & Cetak Kwitansi"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Kwitansi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
