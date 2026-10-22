import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatIndonesianDate, terbilang } from '../../utils/formatters';
import { Printer, X, Check, Copy, Share2 } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { selectedReceiptPayment, setSelectedReceiptPayment, settings, addToast } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!selectedReceiptPayment) return null;

  const payment = selectedReceiptPayment;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppMessage = () => {
    const isPartial = payment.remainingBalanceTotal && payment.remainingBalanceTotal > 0;
    const text = `*BUKTI PEMBAYARAN SPP*
${settings.pesantrenName}
---------------------------------
No. Kwitansi: ${payment.receiptNumber}
Tanggal: ${formatIndonesianDate(payment.paidDate, true)}
Nama Santri: ${payment.studentName} (NIS: ${payment.studentNis})
Kelas: ${payment.classLevel}
Pembayaran: ${payment.monthsCovered.join(', ')}
Jumlah Dibayar: ${formatRupiah(payment.totalAmount)}
${isPartial ? `Sisa Kekurangan: *${formatRupiah(payment.remainingBalanceTotal || 0)}*\nStatus: *DIBAYAR SEBAGIAN (CICILAN)*` : `Status: *LUNAS (SAH)*`}
Metode: ${payment.paymentMethod}
Diterima oleh: ${payment.cashierName}
---------------------------------
Jazakumullahu Khairan Katsiran atas pembayaran SPP ananda.
_Salam hormat, Bagian Keuangan ${settings.pesantrenName}_`;
    return text;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopied(true);
    addToast('info', 'Teks bukti pembayaran berhasil disalin untuk pesan WhatsApp.', 'Disalin ke Clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Bukti Kwitansi Pembayaran</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">
              {payment.receiptNumber}
            </span>
            {payment.status === 'Dibatalkan' && (
              <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded uppercase">
                Dibatalkan / Void
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedReceiptPayment(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" className="p-8 bg-white text-slate-800 relative">
          
          {/* Watermark if Cancelled */}
          {payment.status === 'Dibatalkan' && (
            <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-500 rounded-xl text-center text-rose-800">
              <span className="text-base font-extrabold uppercase tracking-widest block text-rose-600">
                [ PERHATIAN: TRANSAKSI TELAH DIBATALKAN / VOID ]
              </span>
              <p className="text-xs mt-0.5 font-medium">
                Dibatalkan pada: {payment.cancelledAt ? formatIndonesianDate(payment.cancelledAt, true) : '-'} oleh {payment.cancelledBy || 'Bendahara'}
              </p>
              <p className="text-[11px] italic mt-0.5 text-rose-700">
                Alasan: "{payment.cancelReason || 'Koreksi data bendahara'}"
              </p>
            </div>
          )}
          
          {/* Header Pesantren */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
            <p className="text-xs tracking-widest text-emerald-800 font-medium mb-1">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              {settings.pesantrenName}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {settings.address}
            </p>
            <p className="text-xs text-slate-500">
              Telp: {settings.phone} | Email: {settings.email}
            </p>
          </div>

          {/* Kwitansi Title & Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">
                Kwitansi Pembayaran Resmi
              </span>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>No: <span className="font-mono font-bold text-slate-900">{payment.receiptNumber}</span></p>
              <p>Tanggal: {formatIndonesianDate(payment.paidDate, true)}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-xs border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-5">
            <div className="flex">
              <span className="w-32 text-slate-500 shrink-0">Telah Diterima Dari</span>
              <span className="font-semibold text-slate-900">: {payment.payerName} (Wali Santri)</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 shrink-0">Nama Santri</span>
              <span className="font-semibold text-slate-900">: {payment.studentName}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 shrink-0">NIS / Kelas</span>
              <span className="font-mono text-slate-900">: {payment.studentNis} / Kelas {payment.classLevel}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 shrink-0">Untuk Pembayaran</span>
              <span className="font-semibold text-emerald-900">: SPP Bulan {payment.monthsCovered.join(', ')}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 shrink-0">Metode Pembayaran</span>
              <span className="text-slate-900">: {payment.paymentMethod}</span>
            </div>
            {payment.notes && (
              <div className="flex">
                <span className="w-32 text-slate-500 shrink-0">Catatan</span>
                <span className="text-slate-700 italic">: {payment.notes}</span>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-medium text-emerald-800 tracking-wider">Jumlah Dibayar</span>
                <div className="text-2xl font-bold text-emerald-900 font-mono tracking-tight mt-0.5">
                  {formatRupiah(payment.totalAmount)}
                </div>
              </div>
              <div className="text-right">
                {payment.status === 'Dibatalkan' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-rose-600 text-white rounded-md uppercase tracking-wider">
                    DIBATALKAN / VOID
                  </span>
                ) : payment.remainingBalanceTotal && payment.remainingBalanceTotal > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-500 text-white rounded-md">
                    CICILAN / SEBAGIAN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded-md">
                    <Check className="w-3.5 h-3.5" /> LUNAS
                  </span>
                )}
              </div>
            </div>

            {payment.remainingBalanceTotal && payment.remainingBalanceTotal > 0 ? (
              <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs text-amber-900 font-semibold">
                <span>Sisa Kekurangan Tagihan:</span>
                <span className="font-mono text-rose-700">{formatRupiah(payment.remainingBalanceTotal)}</span>
              </div>
            ) : null}

            <div className="mt-2.5 pt-2 border-t border-emerald-200/80 text-xs text-emerald-900">
              <span className="font-semibold">Terbilang: </span>
              <span className="italic">{terbilang(payment.totalAmount)}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 text-center text-xs pt-4 border-t border-dashed border-slate-300">
            <div>
              <p className="text-slate-500">Penyetor / Wali Santri</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-900 border-b border-slate-300 pb-0.5 inline-block min-w-32">
                ( {payment.payerName} )
              </p>
            </div>
            <div>
              <p className="text-slate-500">Petugas Keuangan / Bendahara</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] font-mono text-emerald-800/60 uppercase tracking-widest border border-dashed border-emerald-300 px-2 py-0.5 rounded">
                  [ CAP TERVERIFIKASI ]
                </span>
              </div>
              <p className="font-semibold text-slate-900 border-b border-slate-300 pb-0.5 inline-block min-w-32">
                ( {payment.cashierName} )
              </p>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-400 mt-6 print:block">
            * Simpan kwitansi ini sebagai bukti pembayaran SPP yang sah. Dicetak otomatis dari {settings.pesantrenName}.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 print:hidden">
          <button
            onClick={handleCopyWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Kirim Bukti via WhatsApp'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedReceiptPayment(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kwitansi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
