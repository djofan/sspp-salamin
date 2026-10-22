export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatIndonesianDate(dateInput: string | Date, withTime = false): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  if (withTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  }

  return `${day} ${month} ${year}`;
}

export function formatShortDate(dateInput: string | Date): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Indonesian "Terbilang" for receipts (e.g. 500000 -> "Lima Ratus Ribu Rupiah")
export function terbilang(n: number): string {
  if (n < 0) return 'Minus ' + terbilang(Math.abs(n));
  if (n === 0) return 'Nol Rupiah';

  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function toWords(num: number): string {
    if (num < 12) {
      return satuan[num];
    } else if (num < 20) {
      return toWords(num - 10) + ' Belas';
    } else if (num < 100) {
      return toWords(Math.floor(num / 10)) + ' Puluh ' + toWords(num % 10);
    } else if (num < 200) {
      return 'Seratus ' + toWords(num - 100);
    } else if (num < 1000) {
      return toWords(Math.floor(num / 100)) + ' Ratus ' + toWords(num % 100);
    } else if (num < 2000) {
      return 'Seribu ' + toWords(num - 1000);
    } else if (num < 1000000) {
      return toWords(Math.floor(num / 1000)) + ' Ribu ' + toWords(num % 1000);
    } else if (num < 1000000000) {
      return toWords(Math.floor(num / 1000000)) + ' Juta ' + toWords(num % 1000000);
    } else if (num < 1000000000000) {
      return toWords(Math.floor(num / 1000000000)) + ' Milyar ' + toWords(num % 1000000000);
    }
    return '';
  }

  const result = toWords(n).trim().replace(/\s+/g, ' ');
  return (result.charAt(0).toUpperCase() + result.slice(1) + ' Rupiah').replace('Satu Ratus', 'Seratus').replace('Satu Puluh', 'Sepuluh');
}

export function generateReceiptNumber(seq?: number, year?: number, month?: number): string {
  const d = new Date();
  const y = year ?? d.getFullYear();
  const m = String(month ?? (d.getMonth() + 1)).padStart(2, '0');
  const s = String(seq ?? Math.floor(1000 + Math.random() * 9000)).padStart(4, '0');
  return `KWT/${y}/${m}/${s}`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row.map(cell => {
        const str = String(cell ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
