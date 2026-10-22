import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, PaymentMethod, Bill } from '../../types';
import { formatRupiah, terbilang } from '../../utils/formatters';
import { 
  CreditCard, 
  Search, 
  CheckCircle, 
  Receipt, 
  Building2, 
  QrCode, 
  Banknote,
  Coins,
  AlertCircle
} from 'lucide-react';

export const PaymentCashierView: React.FC = () => {
  const { 
    students, 
    bills, 
    processPayment, 
    settings,
    preselectedStudentIdForPayment,
    setPreselectedStudentIdForPayment 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  // Map of billId -> custom payment amount (defaults to remaining balance)
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [isPartialMode, setIsPartialMode] = useState<Record<string, boolean>>({});
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer BSI');
  const [payerName, setPayerName] = useState('');
  const [cashierName, setCashierName] = useState(settings.treasurer);
  const [notes, setNotes] = useState('');

  // Handle preselection if coming from student list or dashboard
  useEffect(() => {
    if (preselectedStudentIdForPayment) {
      const s = students.find(item => item.id === preselectedStudentIdForPayment);
      if (s) {
        handleSelectStudent(s);
      }
    }
  }, [preselectedStudentIdForPayment, students]);

  // Live filter students for search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return students.filter(s => 
      s.status === 'Aktif' && (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.classLevel.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ).slice(0, 6);
  }, [students, searchQuery]);

  // Unpaid or partially paid bills for currently selected student
  const unpaidBills = useMemo(() => {
    if (!selectedStudent) return [];
    return bills.filter(b => b.studentId === selectedStudent.id && b.status !== 'Lunas');
  }, [selectedStudent, bills]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setPayerName(student.guardianName);
    
    const studentUnpaid = bills.filter(b => b.studentId === student.id && b.status !== 'Lunas');
    if (studentUnpaid.length > 0) {
      const firstId = studentUnpaid[0].id;
      setSelectedBillIds([firstId]);
      const initialRemaining = studentUnpaid[0].remainingAmount ?? (studentUnpaid[0].amount - (studentUnpaid[0].paidAmount || 0));
      setCustomAmounts({ [firstId]: initialRemaining });
    } else {
      setSelectedBillIds([]);
      setCustomAmounts({});
    }
    setNotes('');
  };

  const handleToggleBill = (bill: Bill) => {
    const isCurrentlySelected = selectedBillIds.includes(bill.id);
    const remaining = bill.remainingAmount ?? (bill.amount - (bill.paidAmount || 0));

    if (isCurrentlySelected) {
      setSelectedBillIds(prev => prev.filter(id => id !== bill.id));
      setCustomAmounts(prev => {
        const copy = { ...prev };
        delete copy[bill.id];
        return copy;
      });
    } else {
      setSelectedBillIds(prev => [...prev, bill.id]);
      setCustomAmounts(prev => ({
        ...prev,
        [bill.id]: remaining
      }));
    }
  };

  const handleSelectAllBills = () => {
    if (selectedBillIds.length === unpaidBills.length) {
      setSelectedBillIds([]);
      setCustomAmounts({});
    } else {
      const allIds = unpaidBills.map(b => b.id);
      setSelectedBillIds(allIds);
      const newAmounts: Record<string, number> = {};
      unpaidBills.forEach(b => {
        newAmounts[b.id] = b.remainingAmount ?? (b.amount - (b.paidAmount || 0));
      });
      setCustomAmounts(newAmounts);
    }
  };

  const handleAmountChange = (billId: string, maxAmount: number, valueStr: string) => {
    const val = Number(valueStr);
    const safeVal = isNaN(val) ? 0 : Math.min(val, maxAmount);
    setCustomAmounts(prev => ({
      ...prev,
      [billId]: safeVal
    }));
  };

  const handleTogglePartialMode = (billId: string, remaining: number) => {
    setIsPartialMode(prev => {
      const willBePartial = !prev[billId];
      if (!willBePartial) {
        // Switch to full remaining
        setCustomAmounts(ca => ({ ...ca, [billId]: remaining }));
      } else {
        // Default partial to half or minimum
        const half = Math.round(remaining / 2 / 10000) * 10000;
        setCustomAmounts(ca => ({ ...ca, [billId]: half || remaining }));
      }
      return { ...prev, [billId]: willBePartial };
    });
  };

  // Selected bills objects
  const selectedBills = unpaidBills.filter(b => selectedBillIds.includes(b.id));

  // Calculate total payment amount
  const totalAmountToPay = selectedBills.reduce((sum, b) => {
    const amt = customAmounts[b.id] ?? (b.remainingAmount ?? (b.amount - (b.paidAmount || 0)));
    return sum + amt;
  }, 0);

  // Total remaining after this payment
  const totalRemainingAfter = selectedBills.reduce((sum, b) => {
    const originalRemaining = b.remainingAmount ?? (b.amount - (b.paidAmount || 0));
    const payThis = customAmounts[b.id] ?? originalRemaining;
    return sum + Math.max(0, originalRemaining - payThis);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || selectedBillIds.length === 0 || totalAmountToPay <= 0) return;

    // Check if any bill amount exceeds remaining balance
    for (const b of selectedBills) {
      const remaining = b.remainingAmount ?? (b.amount - (b.paidAmount || 0));
      const payThis = customAmounts[b.id] ?? remaining;
      if (payThis > remaining) {
        return; // blocked by validation
      }
    }

    const billPaymentsPayload = selectedBills.map(b => ({
      billId: b.id,
      amountToPay: customAmounts[b.id] ?? (b.remainingAmount ?? (b.amount - (b.paidAmount || 0)))
    }));

    processPayment({
      studentId: selectedStudent.id,
      billPayments: billPaymentsPayload,
      paymentMethod,
      payerName: payerName.trim() || selectedStudent.guardianName,
      cashierName: cashierName.trim() || settings.treasurer,
      notes: notes.trim(),
      paidDate: paymentDate
    });

    // Reset selection after payment
    setSelectedBillIds([]);
    setCustomAmounts({});
    setIsPartialMode({});
    setPreselectedStudentIdForPayment(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-700" />
          Kasir Pembayaran SPP Bulanan
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Pilih santri, pilih tagihan bulanan, tentukan pembayaran penuh atau cicilan/sebagian, dan terbitkan kwitansi sah.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Student Selection & Bill Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Step 1: Search Student */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Langkah 1: Cari & Pilih Siswa / Santri
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik nama santri, NIS, atau nama wali santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white transition-all"
              />

              {/* Autocomplete dropdown */}
              {filteredStudents.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden divide-y divide-slate-100">
                  {filteredStudents.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{s.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          NIS: {s.nis} · Kelas {s.classLevel} ({s.program})
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-slate-600">
                        <span>Wali: {s.guardianName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Suggestions if no student selected */}
            {!selectedStudent && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">Santri dengan tagihan belum lunas:</span>
                <div className="flex flex-wrap gap-2">
                  {students.slice(0, 5).map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                    >
                      {s.name} ({s.classLevel})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Student Card */}
            {selectedStudent && (
              <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {selectedStudent.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono mt-0.5">
                      <span>NIS: {selectedStudent.nis}</span>
                      <span>·</span>
                      <span>Kelas {selectedStudent.classLevel}</span>
                      <span>·</span>
                      <span className="text-emerald-800 font-semibold">{selectedStudent.program}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-right sm:border-l sm:border-emerald-200/80 sm:pl-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wali Santri</span>
                  <p className="font-semibold text-slate-800">{selectedStudent.guardianName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedStudent.guardianPhone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Unpaid Bills Selection & Flexible Amount */}
          {selectedStudent && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Langkah 2: Pilih Tagihan & Jumlah Pembayaran
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dapat melunasi penuh atau mencicil (pembayaran sebagian)
                  </p>
                </div>
                {unpaidBills.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllBills}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {selectedBillIds.length === unpaidBills.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                )}
              </div>

              {unpaidBills.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Alhamdulillah, Semua Tagihan Santri Ini Sudah Lunas!
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tidak ada tunggakan atau cicilan SPP yang perlu dibayarkan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidBills.map((b) => {
                    const isChecked = selectedBillIds.includes(b.id);
                    const remaining = b.remainingAmount ?? (b.amount - (b.paidAmount || 0));
                    const currentCustomAmt = customAmounts[b.id] ?? remaining;
                    const isPartial = isPartialMode[b.id] || false;

                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isChecked 
                            ? 'bg-emerald-50/40 border-emerald-500 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          
                          {/* Checkbox & Details */}
                          <div className="flex items-start gap-3 cursor-pointer" onClick={() => handleToggleBill(b)}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBill(b)}
                              className="w-4 h-4 mt-0.5 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  SPP Bulan {b.monthName} {b.year}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  b.status === 'Dibayar Sebagian' ? 'bg-amber-100 text-amber-800' :
                                  b.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {b.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Total Tagihan: {formatRupiah(b.amount)}
                                {b.paidAmount ? ` · Sudah Masuk: ${formatRupiah(b.paidAmount)}` : ''}
                              </div>
                              <span className="text-[11px] font-mono text-emerald-800 font-semibold block mt-0.5">
                                Sisa Kewajiban: {formatRupiah(remaining)}
                              </span>
                            </div>
                          </div>

                          {/* Amount selector if checked */}
                          {isChecked && (
                            <div className="text-right shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePartialMode(b.id, remaining);
                                }}
                                className="text-[11px] text-emerald-700 hover:underline font-medium block mb-1"
                              >
                                {isPartial ? 'Ubah ke Bayar Penuh' : 'Bayar Sebagian / Cicilan?'}
                              </button>

                              {isPartial ? (
                                <div className="flex items-center gap-1.5 justify-end">
                                  <span className="text-xs text-slate-500 font-mono">Rp</span>
                                  <input
                                    type="number"
                                    step="10000"
                                    min="10000"
                                    max={remaining}
                                    value={currentCustomAmt}
                                    onChange={(e) => handleAmountChange(b.id, remaining, e.target.value)}
                                    className="w-28 px-2 py-1 text-xs font-mono font-bold text-slate-900 border border-emerald-300 rounded-lg bg-white text-right focus:outline-emerald-600"
                                  />
                                </div>
                              ) : (
                                <span className="text-xs font-mono font-bold text-emerald-800 tabular-nums">
                                  {formatRupiah(remaining)}
                                </span>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Checkout & Payment Confirmation Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Langkah 3: Konfirmasi Kasir & Cetak Bukti
            </label>

            {!selectedStudent ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Pilih santri terlebih dahulu di kolom sebelah kiri untuk memulai pembayaran.
              </div>
            ) : selectedBillIds.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Pilih minimal 1 tagihan bulanan santri untuk memproses pelunasan atau cicilan.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Metode Pembayaran *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Transfer BSI', label: 'BSI (Syariah)', icon: <Building2 className="w-3.5 h-3.5" /> },
                      { id: 'Tunai', label: 'Tunai / Kas', icon: <Banknote className="w-3.5 h-3.5" /> },
                      { id: 'Transfer BCA', label: 'Transfer BCA', icon: <Building2 className="w-3.5 h-3.5" /> },
                      { id: 'QRIS', label: 'QRIS Pesantren', icon: <QrCode className="w-3.5 h-3.5" /> },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          paymentMethod === m.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m.icon}
                        <span className="truncate">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tanggal Pembayaran & Nama Penyetor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Pembayaran *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Penyetor (Wali Santri) *
                    </label>
                    <input
                      type="text"
                      required
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Cashier / Staff */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas Penerima (Bendahara)
                  </label>
                  <input
                    type="text"
                    required
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 bg-slate-50 font-medium"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cicilan ke-1 SPP / Transfer via m-banking BSI"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                {/* Order Summary Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Jumlah Tagihan Dipilih:</span>
                    <span className="font-semibold text-slate-900">{selectedBills.length} Tagihan Periode</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Periode:</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-44">
                      {selectedBills.map(b => b.monthName).join(', ')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-slate-700">Jumlah Dibayar:</span>
                    <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums">
                      {formatRupiah(totalAmountToPay)}
                    </span>
                  </div>

                  {totalRemainingAfter > 0 ? (
                    <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span>Sisa Kekurangan / Cicilan:</span>
                      <span className="font-mono font-bold">{formatRupiah(totalRemainingAfter)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tagihan terpilih akan menjadi LUNAS penuh.</span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 italic pt-1">
                    Terbilang: {terbilang(totalAmountToPay)}
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={totalAmountToPay <= 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Proses Transaksi & Cetak Kwitansi</span>
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  Kwitansi resmi dengan nomor seri dan tanggal transaksi akan otomatis ditampilkan untuk dicetak atau dikirim via WhatsApp.
                </p>

              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
