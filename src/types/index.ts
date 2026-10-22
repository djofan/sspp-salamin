export type Gender = 'L' | 'P';
export type Program = 'MTs' | 'MA' | 'Tahfizh';
export type StudentStatus = 'Aktif' | 'Nonaktif' | 'Alumni';
export type BillStatus = 'Lunas' | 'Dibayar Sebagian' | 'Belum Bayar' | 'Terlambat';
export type PaymentMethod = 'Tunai' | 'Transfer BSI' | 'Transfer BCA' | 'Transfer Mandiri' | 'QRIS';

export interface Student {
  id: string;
  nis: string;
  name: string;
  gender: Gender;
  program: Program;
  classLevel: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: 'Ayah' | 'Ibu' | 'Wali';
  address: string;
  status: StudentStatus;
  dormitory: string;
  monthlySppAmount: number;
  joinDate: string; // YYYY-MM-DD
}

export interface BillBreakdown {
  spp: number;
  asrama: number;
  konsumsi: number;
}

export type TransactionStatus = 'Berhasil' | 'Dibatalkan';

export interface BillInstallment {
  id: string;
  paymentId: string;
  amount: number;
  paidDate: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  cashierName: string;
  status?: TransactionStatus;
}

export interface Bill {
  id: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  classLevel?: string;
  month: number; // 1-12
  monthName: string; // e.g. "Oktober"
  year: number; // e.g. 2026
  amount: number; // Total nominal tagihan
  paidAmount: number; // Jumlah yang sudah dibayarkan (bisa parsial)
  remainingAmount: number; // Sisa tagihan (amount - paidAmount)
  breakdown: BillBreakdown;
  dueDate: string;
  status: BillStatus;
  paidAt?: string;
  paymentId?: string;
  installments?: BillInstallment[];
}

export interface BillPaymentDetail {
  billId: string;
  amountPaid: number;
  monthName: string;
  year: number;
}

export interface Payment {
  id: string;
  receiptNumber: string; // Unique transaction number
  studentId: string;
  studentName: string;
  studentNis: string;
  classLevel: string;
  billIds: string[];
  billPaymentDetails?: BillPaymentDetail[];
  monthsCovered: string[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentType?: 'Lunas' | 'Cicilan / Sebagian';
  remainingBalanceTotal?: number;
  paidDate: string; // ISO string
  cashierName: string;
  payerName: string;
  notes?: string;
  status: TransactionStatus; // 'Berhasil' | 'Dibatalkan'
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
}

export interface BankAccount {
  bank: string;
  accountNumber: string;
  holderName: string;
}

export type UserRole = 'admin' | 'bendahara';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  program: Program;
  defaultSppAmount: number;
  academicYear: string;
}

export interface PesantrenSettings {
  pesantrenName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  academicYear: string;
  headmaster: string;
  principal?: string;
  treasurer: string;
  dueDay: number;
  defaultSppAmount: number;
  bankAccounts: BankAccount[];
  sppDefaultRates: {
    mts: number;
    ma: number;
    tahfizh: number;
  };
}

export type TabType = 
  | 'dashboard'
  | 'students'
  | 'bills'
  | 'payment'
  | 'history'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
}

