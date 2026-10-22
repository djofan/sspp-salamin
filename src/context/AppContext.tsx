import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Student, 
  Bill, 
  Payment, 
  PesantrenSettings, 
  TabType, 
  ToastMessage, 
  PaymentMethod,
  BillInstallment,
  BillStatus,
  UserRole,
  AppUser,
  ClassItem
} from '../types';
import { initialSettings, initialStudents, initialClasses, generateSeedBillsAndPayments } from '../data/initialData';
import { generateReceiptNumber, MONTH_NAMES, formatRupiah } from '../utils/formatters';
import { 
  db, 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  testFirestoreConnection, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface BillPaymentItem {
  billId: string;
  amountToPay: number;
}

export interface ProcessPaymentPayload {
  studentId: string;
  billIds?: string[];
  billPayments?: BillPaymentItem[];
  paymentMethod: PaymentMethod;
  payerName: string;
  cashierName?: string;
  notes?: string;
  paidDate?: string;
}

export interface SingleBillPayload {
  studentId: string;
  month: number;
  year: number;
  amount?: number;
  dueDate?: string;
}

interface AppContextType {
  // Data
  students: Student[];
  bills: Bill[];
  payments: Payment[];
  classes: ClassItem[];
  settings: PesantrenSettings;
  users: AppUser[];

  // Navigation & UI
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedReceiptPayment: Payment | null;
  setSelectedReceiptPayment: (payment: Payment | null) => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  removeToast: (id: string) => void;

  // Auth & Roles
  firebaseUser: FirebaseUser | null;
  currentUser: AppUser | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isBootstrappedAdmin: boolean;
  isAdmin: boolean;
  isBendahara: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  addStaffUser: (user: { email: string; displayName: string; role: UserRole }) => Promise<void>;
  updateUserRole: (uid: string, newRole: UserRole) => Promise<void>;

  // Sync state
  isFirestoreConnected: boolean;
  isSyncing: boolean;

  // Student Operations (Admin only for mutations)
  addStudent: (student: Omit<Student, 'id'>) => Promise<boolean>;
  updateStudent: (student: Student) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;

  // Class Operations (Admin only)
  addClass: (cls: Omit<ClassItem, 'id'>) => Promise<boolean>;
  updateClass: (cls: ClassItem) => Promise<boolean>;
  deleteClass: (id: string) => Promise<boolean>;

  // Payment & Billing Operations (Admin & Bendahara)
  processPayment: (payload: ProcessPaymentPayload) => Promise<Payment | null>;
  cancelPayment: (paymentId: string, cancelReason: string, cancelledBy?: string) => Promise<boolean>;
  generateBillsForMonth: (month: number, year: number) => Promise<{ created: number; skipped: number }>;
  generateBillsForClass: (classLevel: string, month: number, year: number, nominalOverride?: number) => Promise<{ created: number; skipped: number }>;
  createSingleBill: (payload: SingleBillPayload) => Promise<{ success: boolean; message: string }>;
  updateNominalForClass: (classLevel: string, newNominal: number) => Promise<void>;

  // Settings Operations (Admin only)
  updateSettings: (newSettings: PesantrenSettings) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  seedFirestoreData: () => Promise<void>;

  // Quick Action
  preselectedStudentIdForPayment: string | null;
  setPreselectedStudentIdForPayment: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAIL = 'raida.zaujaty@gmail.com';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [preselectedStudentIdForPayment, setPreselectedStudentIdForPayment] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>({
    uid: 'admin-seed-01',
    email: BOOTSTRAP_ADMIN_EMAIL,
    displayName: 'Ustadzah Raida (Admin Utama)',
    role: 'admin'
  });
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [users, setUsers] = useState<AppUser[]>([
    {
      uid: 'admin-seed-01',
      email: BOOTSTRAP_ADMIN_EMAIL,
      displayName: 'Ustadzah Raida (Admin)',
      role: 'admin',
      createdAt: '2026-07-01T08:00:00.000Z'
    },
    {
      uid: 'bendahara-seed-02',
      email: 'bendahara@salamatulin-san.sch.id',
      displayName: 'Ust. Syarif Hidayatullah, S.E.',
      role: 'bendahara',
      createdAt: '2026-07-01T08:00:00.000Z'
    }
  ]);

  // Firestore & Data States
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [settings, setSettings] = useState<PesantrenSettings>(initialSettings);
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [bills, setBills] = useState<Bill[]>(() => {
    const seed = generateSeedBillsAndPayments(initialStudents, initialSettings);
    return seed.bills;
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const seed = generateSeedBillsAndPayments(initialStudents, initialSettings);
    return seed.payments;
  });

  const isBootstrappedAdmin = firebaseUser?.email === BOOTSTRAP_ADMIN_EMAIL || currentUser?.email === BOOTSTRAP_ADMIN_EMAIL;
  const isAdmin = currentRole === 'admin';
  const isBendahara = currentRole === 'bendahara';

  // Toast Helper
  const addToast = useCallback((type: ToastMessage['type'], message: string, title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Seed Firestore initial data
  const seedFirestoreData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);

      // 1. Settings
      const settingsRef = doc(db, 'school_settings', 'default');
      batch.set(settingsRef, initialSettings);

      // 2. Classes
      initialClasses.forEach(cls => {
        const clsRef = doc(db, 'classes', cls.id);
        batch.set(clsRef, cls);
      });

      // 3. Students
      initialStudents.forEach(st => {
        const stRef = doc(db, 'students', st.id);
        batch.set(stRef, st);
      });

      // 4. Bills & Payments
      const seed = generateSeedBillsAndPayments(initialStudents, initialSettings);
      seed.bills.forEach(b => {
        const bRef = doc(db, 'bills', b.id);
        batch.set(bRef, b);
      });

      seed.payments.forEach(p => {
        const pRef = doc(db, 'payments', p.id);
        batch.set(pRef, p);
      });

      // 5. Default Users
      const adminUser: AppUser = {
        uid: 'admin-seed-01',
        email: BOOTSTRAP_ADMIN_EMAIL,
        displayName: 'Ustadzah Raida (Admin)',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      const bendaharaUser: AppUser = {
        uid: 'bendahara-seed-02',
        email: 'bendahara@salamatulin-san.sch.id',
        displayName: 'Ust. Syarif Hidayatullah, S.E.',
        role: 'bendahara',
        createdAt: new Date().toISOString()
      };
      batch.set(doc(db, 'users', adminUser.uid), adminUser);
      batch.set(doc(db, 'users', bendaharaUser.uid), bendaharaUser);

      await batch.commit();
      addToast('success', 'Data awal sistem SPP Pondok Pesantren Salamatul Insan berhasil disimpan ke Cloud Firestore!', 'Sinkronisasi Database');
    } catch (err) {
      console.warn('Seed write failed or skipped:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [addToast]);

  // Real-time Firestore Listeners
  useEffect(() => {
    let unsubs: Unsubscribe[] = [];

    const initializeFirestore = async () => {
      setIsSyncing(true);
      await testFirestoreConnection();

      try {
        // Check if settings exist in Firestore
        const settingsSnap = await getDoc(doc(db, 'school_settings', 'default'));
        if (!settingsSnap.exists()) {
          console.log('Database empty, auto-seeding initial data to Cloud Firestore...');
          await seedFirestoreData();
        }

        // Attach real-time listeners for all 6 collections
        const unsubSettings = onSnapshot(doc(db, 'school_settings', 'default'), (snap) => {
          if (snap.exists()) {
            setSettings(snap.data() as PesantrenSettings);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'school_settings/default'));
        unsubs.push(unsubSettings);

        const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
          if (!snap.empty) {
            const list: ClassItem[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as ClassItem));
            setClasses(list);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'classes'));
        unsubs.push(unsubClasses);

        const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
          if (!snap.empty) {
            const list: Student[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as Student));
            setStudents(list);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'students'));
        unsubs.push(unsubStudents);

        const unsubBills = onSnapshot(collection(db, 'bills'), (snap) => {
          if (!snap.empty) {
            const list: Bill[] = [];
            snap.forEach(d => {
              const b = d.data() as any;
              const totalAmt = b.amount || 0;
              const paid = b.paidAmount ?? (b.status === 'Lunas' ? totalAmt : 0);
              const remaining = b.remainingAmount ?? (totalAmt - paid);
              list.push({
                ...b,
                id: d.id,
                amount: totalAmt,
                paidAmount: paid,
                remainingAmount: remaining,
                installments: b.installments || []
              } as Bill);
            });
            setBills(list);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'bills'));
        unsubs.push(unsubBills);

        const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
          if (!snap.empty) {
            const list: Payment[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as Payment));
            list.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
            setPayments(list);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'payments'));
        unsubs.push(unsubPayments);

        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
          if (!snap.empty) {
            const list: AppUser[] = [];
            snap.forEach(d => list.push({ uid: d.id, ...d.data() } as AppUser));
            setUsers(list);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));
        unsubs.push(unsubUsers);

        setIsFirestoreConnected(true);
      } catch (err) {
        console.warn('Firestore initialization notice:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    initializeFirestore();

    return () => {
      unsubs.forEach(u => u());
    };
  }, [seedFirestoreData]);

  // Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);

          let role: UserRole = 'bendahara';
          if (user.email === BOOTSTRAP_ADMIN_EMAIL) {
            role = 'admin';
          } else if (snap.exists() && snap.data().role) {
            role = snap.data().role as UserRole;
          }

          const userProfile: AppUser = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Staf Pesantren',
            photoURL: user.photoURL || undefined,
            role,
            createdAt: snap.exists() ? snap.data().createdAt : new Date().toISOString()
          };

          if (!snap.exists()) {
            await setDoc(userDocRef, userProfile);
          }

          setCurrentUser(userProfile);
          setCurrentRole(role);
          addToast('success', `Selamat datang, ${userProfile.displayName} (${role === 'admin' ? 'Administrator' : 'Bendahara'}).`, 'Login Berhasil');
        } catch (err) {
          console.error('Error handling auth state:', err);
        }
      }
    });

    return () => unsubAuth();
  }, [addToast]);

  // Auth actions
  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      addToast('error', 'Gagal masuk dengan Google. Silakan coba kembali.', 'Login Gagal');
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      // Set to default demo admin state
      setCurrentUser({
        uid: 'admin-seed-01',
        email: BOOTSTRAP_ADMIN_EMAIL,
        displayName: 'Ustadzah Raida (Admin Utama)',
        role: 'admin'
      });
      setCurrentRole('admin');
      addToast('info', 'Anda telah keluar dari akun Google.', 'Keluar');
    } catch (err) {
      addToast('error', 'Gagal keluar.', 'Error');
    }
  };

  const addStaffUser = async (newStaff: { email: string; displayName: string; role: UserRole }) => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang memiliki akses untuk mengelola akun pengguna.', 'Akses Ditolak');
      return;
    }

    try {
      const generatedUid = `user-${Date.now()}`;
      const staffDoc: AppUser = {
        uid: generatedUid,
        email: newStaff.email.trim().toLowerCase(),
        displayName: newStaff.displayName.trim(),
        role: newStaff.role,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', generatedUid), staffDoc);
      addToast('success', `Akun ${newStaff.displayName} (${newStaff.role}) berhasil ditambahkan ke Firestore.`, 'Pengguna Ditambahkan');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang dapat mengubah hak akses pengguna.', 'Akses Ditolak');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole
      });
      addToast('success', `Peran pengguna berhasil diperbarui menjadi ${newRole.toUpperCase()}.`, 'Peran Diperbarui');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Student Operations (RBAC: Admin only for mutations)
  const addStudent = async (studentData: Omit<Student, 'id'>): Promise<boolean> => {
    if (!isAdmin) {
      addToast('warning', 'Akses Dibatasi: Hanya Administrator yang dapat menambah data santri baru. Bendahara hanya bertugas mencatat pembayaran dan laporan.', 'Izin Terbatas');
      return false;
    }

    const newId = `std-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id: newId
    };

    try {
      await setDoc(doc(db, 'students', newId), newStudent);
      addToast('success', `Santri ${newStudent.name} (${newStudent.nis}) berhasil ditambahkan ke database.`, 'Santri Baru Ditambahkan');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `students/${newId}`);
    }
  };

  const updateStudent = async (studentData: Student): Promise<boolean> => {
    if (!isAdmin) {
      addToast('warning', 'Akses Dibatasi: Hanya Administrator yang dapat mengedit data pokok santri.', 'Izin Terbatas');
      return false;
    }

    try {
      await setDoc(doc(db, 'students', studentData.id), studentData);
      addToast('success', `Data santri ${studentData.name} berhasil diperbarui.`, 'Data Santri Diperbarui');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${studentData.id}`);
    }
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      addToast('warning', 'Akses Dibatasi: Hanya Administrator yang dapat menghapus data santri dari sistem.', 'Izin Terbatas');
      return false;
    }

    const studentToDelete = students.find(s => s.id === id);
    try {
      await deleteDoc(doc(db, 'students', id));
      addToast('info', `Santri ${studentToDelete?.name || ''} telah dihapus dari sistem.`, 'Data Santri Dihapus');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  // Class Operations (Admin only)
  const addClass = async (cls: Omit<ClassItem, 'id'>): Promise<boolean> => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang dapat menambahkan rombongan belajar/kelas.', 'Izin Terbatas');
      return false;
    }
    const newId = `cls-${Date.now()}`;
    const newClass: ClassItem = { ...cls, id: newId };
    try {
      await setDoc(doc(db, 'classes', newId), newClass);
      addToast('success', `Kelas ${newClass.name} berhasil ditambahkan.`, 'Kelas Ditambahkan');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `classes/${newId}`);
    }
  };

  const updateClass = async (cls: ClassItem): Promise<boolean> => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang dapat mengubah data kelas.', 'Izin Terbatas');
      return false;
    }
    try {
      await setDoc(doc(db, 'classes', cls.id), cls);
      addToast('success', `Data kelas ${cls.name} berhasil diperbarui.`, 'Kelas Diperbarui');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${cls.id}`);
    }
  };

  const deleteClass = async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang dapat menghapus kelas.', 'Izin Terbatas');
      return false;
    }
    try {
      await deleteDoc(doc(db, 'classes', id));
      addToast('info', 'Kelas berhasil dihapus.', 'Kelas Dihapus');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${id}`);
    }
  };

  // Billing Operations (Both Admin & Bendahara)
  const createSingleBill = async (payload: SingleBillPayload): Promise<{ success: boolean; message: string }> => {
    const student = students.find(s => s.id === payload.studentId);
    if (!student) {
      return { success: false, message: 'Santri tidak ditemukan.' };
    }

    const monthName = MONTH_NAMES[payload.month - 1];
    const isDuplicate = bills.some(
      b => b.studentId === payload.studentId && b.month === payload.month && b.year === payload.year
    );

    if (isDuplicate) {
      const msg = `Tagihan untuk ${student.name} bulan ${monthName} ${payload.year} sudah ada di sistem. Tidak dapat membuat tagihan ganda.`;
      addToast('warning', msg, 'Peringatan Duplikasi Tagihan');
      return { success: false, message: msg };
    }

    const billAmount = payload.amount ?? student.monthlySppAmount ?? settings.defaultSppAmount;
    const dueDay = settings.dueDay || 10;
    const dueDateStr = payload.dueDate || `${payload.year}-${String(payload.month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const newBillId = `bill-${payload.studentId}-${payload.year}-${payload.month}`;

    const newBill: Bill = {
      id: newBillId,
      studentId: student.id,
      studentName: student.name,
      studentNis: student.nis,
      classLevel: student.classLevel,
      month: payload.month,
      monthName,
      year: payload.year,
      amount: billAmount,
      paidAmount: 0,
      remainingAmount: billAmount,
      breakdown: {
        spp: Math.round(billAmount * 0.6),
        asrama: Math.round(billAmount * 0.25),
        konsumsi: Math.round(billAmount * 0.15),
      },
      dueDate: dueDateStr,
      status: 'Belum Bayar',
      installments: []
    };

    try {
      await setDoc(doc(db, 'bills', newBillId), newBill);
      addToast('success', `Tagihan SPP ${monthName} ${payload.year} untuk ${student.name} (${formatRupiah(billAmount)}) berhasil diterbitkan.`, 'Tagihan Diterbitkan');
      return { success: true, message: 'Tagihan berhasil dibuat.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `bills/${newBillId}`);
    }
  };

  const generateBillsForMonth = async (month: number, year: number) => {
    const monthName = MONTH_NAMES[month - 1];
    const activeStudents = students.filter(s => s.status === 'Aktif');
    let created = 0;
    let skipped = 0;

    const dueDay = settings.dueDay || 10;
    const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const batch = writeBatch(db);

    activeStudents.forEach(student => {
      const exists = bills.some(b => b.studentId === student.id && b.month === month && b.year === year);
      if (exists) {
        skipped++;
        return;
      }

      created++;
      const billId = `bill-${student.id}-${year}-${month}`;
      const amount = student.monthlySppAmount || settings.defaultSppAmount;
      const newBill: Bill = {
        id: billId,
        studentId: student.id,
        studentName: student.name,
        studentNis: student.nis,
        classLevel: student.classLevel,
        month,
        monthName,
        year,
        amount,
        paidAmount: 0,
        remainingAmount: amount,
        breakdown: {
          spp: Math.round(amount * 0.6),
          asrama: Math.round(amount * 0.25),
          konsumsi: Math.round(amount * 0.15),
        },
        dueDate,
        status: 'Belum Bayar',
        installments: []
      };

      batch.set(doc(db, 'bills', billId), newBill);
    });

    if (created > 0) {
      await batch.commit();
      addToast('success', `Berhasil menerbitkan ${created} tagihan SPP ${monthName} ${year} ke Cloud Firestore. (${skipped} dilewati karena sudah ada).`, 'Tagihan Massal Terbit');
    } else {
      addToast('info', `Seluruh santri aktif (${skipped} santri) sudah memiliki tagihan untuk bulan ${monthName} ${year}.`, 'Tagihan Sudah Lengkap');
    }

    return { created, skipped };
  };

  const generateBillsForClass = async (classLevel: string, month: number, year: number, nominalOverride?: number) => {
    const monthName = MONTH_NAMES[month - 1];
    const targetStudents = students.filter(s => s.status === 'Aktif' && s.classLevel === classLevel);
    let created = 0;
    let skipped = 0;

    const dueDay = settings.dueDay || 10;
    const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const batch = writeBatch(db);

    targetStudents.forEach(student => {
      const exists = bills.some(b => b.studentId === student.id && b.month === month && b.year === year);
      if (exists) {
        skipped++;
        return;
      }

      created++;
      const billId = `bill-${student.id}-${year}-${month}`;
      const amount = nominalOverride !== undefined ? nominalOverride : (student.monthlySppAmount || settings.defaultSppAmount);
      const newBill: Bill = {
        id: billId,
        studentId: student.id,
        studentName: student.name,
        studentNis: student.nis,
        classLevel: student.classLevel,
        month,
        monthName,
        year,
        amount,
        paidAmount: 0,
        remainingAmount: amount,
        breakdown: {
          spp: Math.round(amount * 0.6),
          asrama: Math.round(amount * 0.25),
          konsumsi: Math.round(amount * 0.15),
        },
        dueDate,
        status: 'Belum Bayar',
        installments: []
      };

      batch.set(doc(db, 'bills', billId), newBill);
    });

    if (created > 0) {
      await batch.commit();
      addToast('success', `Berhasil menerbitkan ${created} tagihan untuk Kelas ${classLevel} bulan ${monthName} ${year}.`, 'Tagihan Kelas Terbit');
    } else {
      addToast('info', `Seluruh santri Kelas ${classLevel} sudah memiliki tagihan untuk bulan ${monthName} ${year}.`, 'Tagihan Sudah Ada');
    }

    return { created, skipped };
  };

  const updateNominalForClass = async (classLevel: string, newNominal: number) => {
    const batch = writeBatch(db);
    const updatedStudents = students.filter(s => s.classLevel === classLevel);
    
    updatedStudents.forEach(s => {
      batch.update(doc(db, 'students', s.id), { monthlySppAmount: newNominal });
    });

    const activeMonth = 10;
    const activeYear = 2026;
    const candidateBills = bills.filter(
      b => b.classLevel === classLevel && b.month === activeMonth && b.year === activeYear && b.status === 'Belum Bayar' && (!b.paidAmount || b.paidAmount === 0)
    );

    candidateBills.forEach(b => {
      batch.update(doc(db, 'bills', b.id), {
        amount: newNominal,
        remainingAmount: newNominal,
        breakdown: {
          spp: Math.round(newNominal * 0.6),
          asrama: Math.round(newNominal * 0.25),
          konsumsi: Math.round(newNominal * 0.15),
        }
      });
    });

    await batch.commit();
    addToast('success', `Nominal SPP Kelas ${classLevel} berhasil disetel ke ${formatRupiah(newNominal)}.`, 'Tarif Kelas Diperbarui');
  };

  // Payment Cashier Operation (Both Admin & Bendahara)
  const processPayment = async (payload: ProcessPaymentPayload): Promise<Payment | null> => {
    const student = students.find(s => s.id === payload.studentId);
    if (!student) {
      addToast('error', 'Data santri tidak ditemukan.', 'Gagal Memproses');
      return null;
    }

    const billPaymentMap = new Map<string, number>();
    if (payload.billPayments && payload.billPayments.length > 0) {
      payload.billPayments.forEach(item => {
        if (item.amountToPay > 0) {
          billPaymentMap.set(item.billId, item.amountToPay);
        }
      });
    } else if (payload.billIds && payload.billIds.length > 0) {
      payload.billIds.forEach(id => {
        const b = bills.find(item => item.id === id);
        if (b) {
          const rem = b.remainingAmount ?? (b.amount - (b.paidAmount || 0));
          billPaymentMap.set(id, rem);
        }
      });
    }

    if (billPaymentMap.size === 0) {
      addToast('warning', 'Pilih minimal satu tagihan dengan nominal pembayaran lebih dari Rp 0.', 'Tagihan Belum Dipilih');
      return null;
    }

    // Strict validation against exceeding remaining amount
    for (const [billId, payAmt] of billPaymentMap.entries()) {
      const b = bills.find(item => item.id === billId);
      if (!b) continue;
      const rem = b.remainingAmount ?? (b.amount - (b.paidAmount || 0));
      if (payAmt > rem) {
        addToast('error', `Nominal pembayaran untuk ${b.monthName} ${b.year} (${formatRupiah(payAmt)}) melebihi sisa tagihan (${formatRupiah(rem)}).`, 'Validasi Nominal Gagal');
        return null;
      }
    }

    const newPaymentId = `pay-${Date.now()}`;
    const receiptNumber = generateReceiptNumber();
    const effectivePaidDate = payload.paidDate ? new Date(payload.paidDate).toISOString() : new Date().toISOString();
    const cashier = payload.cashierName || currentUser?.displayName || settings.treasurer;

    let totalAmount = 0;
    const monthsCovered: string[] = [];
    const billIdsList: string[] = [];
    const billPaymentDetailsList: any[] = [];
    let isPartialPaymentOverall = false;

    const batch = writeBatch(db);

    for (const [billId, amountToPay] of billPaymentMap.entries()) {
      const bill = bills.find(b => b.id === billId);
      if (!bill) continue;

      totalAmount += amountToPay;
      billIdsList.push(billId);
      monthsCovered.push(`${bill.monthName} ${bill.year}`);
      billPaymentDetailsList.push({
        billId: bill.id,
        amountPaid: amountToPay,
        monthName: bill.monthName,
        year: bill.year
      });

      const currentPaid = bill.paidAmount || 0;
      const newPaidAmount = currentPaid + amountToPay;
      const newRemainingAmount = Math.max(0, bill.amount - newPaidAmount);

      let newStatus: BillStatus = 'Belum Bayar';
      if (newRemainingAmount <= 0) {
        newStatus = 'Lunas';
      } else {
        newStatus = 'Dibayar Sebagian';
        isPartialPaymentOverall = true;
      }

      const newInstallment: BillInstallment = {
        id: `inst-${newPaymentId}-${bill.id}`,
        paymentId: newPaymentId,
        amount: amountToPay,
        paidDate: effectivePaidDate,
        receiptNumber: receiptNumber,
        paymentMethod: payload.paymentMethod,
        cashierName: cashier,
        status: 'Berhasil'
      };

      const existingInstallments = bill.installments || [];
      const updatedInstallments = [...existingInstallments, newInstallment];

      const billDocRef = doc(db, 'bills', bill.id);
      batch.update(billDocRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paidAt: newStatus === 'Lunas' ? effectivePaidDate : bill.paidAt,
        paymentId: newPaymentId,
        installments: updatedInstallments
      });
    }

    const newPayment: Payment = {
      id: newPaymentId,
      receiptNumber: receiptNumber,
      studentId: student.id,
      studentName: student.name,
      studentNis: student.nis,
      classLevel: student.classLevel,
      billIds: billIdsList,
      billPaymentDetails: billPaymentDetailsList,
      monthsCovered: monthsCovered,
      totalAmount: totalAmount,
      paymentMethod: payload.paymentMethod,
      paymentType: isPartialPaymentOverall ? 'Cicilan / Sebagian' : 'Lunas',
      paidDate: effectivePaidDate,
      cashierName: cashier,
      payerName: payload.payerName,
      notes: payload.notes,
      status: 'Berhasil'
    };

    const paymentDocRef = doc(db, 'payments', newPaymentId);
    batch.set(paymentDocRef, newPayment);

    try {
      await batch.commit();
      setSelectedReceiptPayment(newPayment);
      addToast(
        'success',
        `Pembayaran ${receiptNumber} sebesar ${formatRupiah(totalAmount)} (${newPayment.paymentType}) untuk ${student.name} berhasil dicatat di Firestore.`,
        'Setoran SPP Diterima'
      );
      return newPayment;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `payments/${newPaymentId}`);
    }
  };

  // Transaction Cancellation (Void) with Balance Rollback
  const cancelPayment = async (paymentId: string, cancelReason: string, cancelledBy?: string): Promise<boolean> => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      addToast('error', 'Transaksi pembayaran tidak ditemukan.', 'Gatal Membatalkan');
      return false;
    }

    if (payment.status === 'Dibatalkan') {
      addToast('warning', 'Transaksi ini sudah dalam status dibatalkan sebelumnya.', 'Peringatan');
      return false;
    }

    const cancelDateIso = new Date().toISOString();
    const operator = cancelledBy || currentUser?.displayName || settings.treasurer;
    const reason = cancelReason.trim() || 'Dibatalkan oleh staf bendahara';

    const batch = writeBatch(db);

    // 1. Rollback affected bills
    payment.billIds.forEach(billId => {
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;

      let amountToRollback = 0;
      if (payment.billPaymentDetails && payment.billPaymentDetails.length > 0) {
        const detail = payment.billPaymentDetails.find(d => d.billId === bill.id);
        if (detail) {
          amountToRollback = detail.amountPaid;
        }
      } else {
        amountToRollback = Math.min(bill.paidAmount || 0, Math.round(payment.totalAmount / (payment.billIds.length || 1)));
      }

      const currentPaid = bill.paidAmount || 0;
      const newPaidAmount = Math.max(0, currentPaid - amountToRollback);
      const newRemainingAmount = Math.max(0, bill.amount - newPaidAmount);

      let newStatus: BillStatus = 'Belum Bayar';
      if (newRemainingAmount <= 0) {
        newStatus = 'Lunas';
      } else if (newPaidAmount > 0) {
        newStatus = 'Dibayar Sebagian';
      } else {
        const now = new Date();
        const due = new Date(bill.dueDate);
        newStatus = now > due ? 'Terlambat' : 'Belum Bayar';
      }

      const updatedInstallments = (bill.installments || []).map(inst => {
        if (inst.paymentId === paymentId) {
          return { ...inst, status: 'Dibatalkan' as const };
        }
        return inst;
      });

      const billRef = doc(db, 'bills', bill.id);
      batch.update(billRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paidAt: newStatus === 'Lunas' ? bill.paidAt : (newPaidAmount > 0 ? bill.paidAt : null),
        installments: updatedInstallments
      });
    });

    // 2. Mark payment document as Dibatalkan
    const payRef = doc(db, 'payments', paymentId);
    batch.update(payRef, {
      status: 'Dibatalkan',
      cancelledAt: cancelDateIso,
      cancelReason: reason,
      cancelledBy: operator
    });

    try {
      await batch.commit();

      if (selectedReceiptPayment?.id === paymentId) {
        setSelectedReceiptPayment({
          ...selectedReceiptPayment,
          status: 'Dibatalkan',
          cancelledAt: cancelDateIso,
          cancelReason: reason,
          cancelledBy: operator
        });
      }

      addToast(
        'info',
        `Transaksi ${payment.receiptNumber} (${formatRupiah(payment.totalAmount)}) telah dibatalkan di Cloud Firestore. Saldo tagihan ${payment.studentName} berhasil dipulihkan.`,
        'Transaksi Dibatalkan'
      );
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `payments/${paymentId}`);
    }
  };

  // Settings Operations (Admin only)
  const updateSettings = async (newSettings: PesantrenSettings): Promise<boolean> => {
    if (!isAdmin) {
      addToast('warning', 'Akses Ditolak: Hanya Administrator yang berwenang mengubah profil dan konfigurasi pesantren.', 'Izin Terbatas');
      return false;
    }

    try {
      await setDoc(doc(db, 'school_settings', 'default'), newSettings);
      addToast('success', 'Pengaturan sistem pesantren berhasil disimpan ke Cloud Firestore.', 'Pengaturan Tersimpan');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'school_settings/default');
    }
  };

  const resetToDefaults = async (): Promise<void> => {
    if (!isAdmin) {
      addToast('warning', 'Hanya Administrator yang dapat melakukan reset data demo bawaan.', 'Izin Terbatas');
      return;
    }
    await seedFirestoreData();
  };

  return (
    <AppContext.Provider
      value={{
        students,
        bills,
        payments,
        classes,
        settings,
        users,
        activeTab,
        setActiveTab,
        selectedReceiptPayment,
        setSelectedReceiptPayment,
        toasts,
        addToast,
        removeToast,
        firebaseUser,
        currentUser,
        currentRole,
        setCurrentRole,
        isBootstrappedAdmin,
        isAdmin,
        isBendahara,
        login,
        logout,
        addStaffUser,
        updateUserRole,
        isFirestoreConnected,
        isSyncing,
        addStudent,
        updateStudent,
        deleteStudent,
        addClass,
        updateClass,
        deleteClass,
        processPayment,
        cancelPayment,
        generateBillsForMonth,
        generateBillsForClass,
        createSingleBill,
        updateNominalForClass,
        updateSettings,
        resetToDefaults,
        seedFirestoreData,
        preselectedStudentIdForPayment,
        setPreselectedStudentIdForPayment
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
