import { Student, Bill, Payment, PesantrenSettings, ClassItem } from '../types';

export const initialSettings: PesantrenSettings = {
  pesantrenName: 'Pondok Pesantren Salamatul Insan',
  tagline: 'Membina Generasi Qur\'ani, Berakhlak Mulia & Mandiri',
  address: 'Jl. Pesantren Salamatul Insan No. 45, Cileungsi, Kab. Bogor, Jawa Barat 16820',
  phone: '(021) 8249-8891 / 0812-8877-6655',
  email: 'keuangan@salamatulin-san.sch.id',
  website: 'www.salamatulin-san.sch.id',
  logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=200&q=80',
  academicYear: '2026/2027',
  headmaster: 'K.H. Dr. Ahmad Zaki Mubarak, M.A.',
  principal: 'K.H. Dr. Ahmad Zaki Mubarak, M.A.',
  treasurer: 'Ust. Syarif Hidayatullah, S.E.',
  dueDay: 10,
  defaultSppAmount: 650000,
  bankAccounts: [
    { bank: 'Bank Syariah Indonesia (BSI)', accountNumber: '7144-8899-23', holderName: 'Ponpes Salamatul Insan' },
    { bank: 'Bank Central Asia (BCA)', accountNumber: '6800-4521-99', holderName: 'Yayasan Salamatul Insan' },
    { bank: 'Bank Mandiri', accountNumber: '133-00-987123-4', holderName: 'Ponpes Salamatul Insan' }
  ],
  sppDefaultRates: {
    mts: 650000,
    ma: 750000,
    tahfizh: 850000
  }
};

export const initialClasses: ClassItem[] = [
  { id: 'cls-vii-a', name: 'VII-A', program: 'MTs', defaultSppAmount: 650000, academicYear: '2026/2027' },
  { id: 'cls-vii-b', name: 'VII-B', program: 'MTs', defaultSppAmount: 650000, academicYear: '2026/2027' },
  { id: 'cls-viii-a', name: 'VIII-A', program: 'MTs', defaultSppAmount: 650000, academicYear: '2026/2027' },
  { id: 'cls-ix-a', name: 'IX-A', program: 'MTs', defaultSppAmount: 650000, academicYear: '2026/2027' },
  { id: 'cls-x-ipa', name: 'X-IPA', program: 'MA', defaultSppAmount: 750000, academicYear: '2026/2027' },
  { id: 'cls-xi-ipa', name: 'XI-IPA', program: 'MA', defaultSppAmount: 750000, academicYear: '2026/2027' },
  { id: 'cls-thf-1', name: 'Tahfizh 1 (Juz 1-10)', program: 'Tahfizh', defaultSppAmount: 850000, academicYear: '2026/2027' },
  { id: 'cls-thf-2', name: 'Tahfizh 2 (Juz 11-20)', program: 'Tahfizh', defaultSppAmount: 850000, academicYear: '2026/2027' }
];

export const initialStudents: Student[] = [
  {
    id: 'std-01',
    nis: '202407001',
    name: 'Muhammad Rizky Pratama',
    gender: 'L',
    program: 'MTs',
    classLevel: 'VII-A',
    guardianName: 'H. Bambang Sugiarto',
    guardianPhone: '081234567890',
    guardianRelation: 'Ayah',
    address: 'Komplek Permata Hijau B5/12, Bekasi',
    status: 'Aktif',
    dormitory: 'Gedung Umar bin Khattab (Kamar 201)',
    monthlySppAmount: 650000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-02',
    nis: '202407002',
    name: 'Fatimah Az-Zahra',
    gender: 'P',
    program: 'MTs',
    classLevel: 'VII-B',
    guardianName: 'Dra. Hj. Nurjanah',
    guardianPhone: '081389012345',
    guardianRelation: 'Ibu',
    address: 'Jl. Margonda Raya No. 88, Depok',
    status: 'Aktif',
    dormitory: 'Gedung Khadijah (Kamar 102)',
    monthlySppAmount: 650000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-03',
    nis: '202407003',
    name: 'Ahmad Fauzi Ramadhan',
    gender: 'L',
    program: 'MTs',
    classLevel: 'VII-A',
    guardianName: 'Budi Santoso',
    guardianPhone: '085712345678',
    guardianRelation: 'Ayah',
    address: 'Kp. Tengah RT 02/05, Cibubur, Jakarta Timur',
    status: 'Aktif',
    dormitory: 'Gedung Umar bin Khattab (Kamar 203)',
    monthlySppAmount: 650000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-04',
    nis: '202407004',
    name: 'Aisyah Humaira',
    gender: 'P',
    program: 'MTs',
    classLevel: 'VIII-A',
    guardianName: 'Drs. H. Mulyadi',
    guardianPhone: '081298765432',
    guardianRelation: 'Ayah',
    address: 'Jl. Pahlawan No. 42, Bogor',
    status: 'Aktif',
    dormitory: 'Gedung Aisyah (Kamar 105)',
    monthlySppAmount: 650000,
    joinDate: '2023-07-10'
  },
  {
    id: 'std-05',
    nis: '202307005',
    name: 'Muhammad Ilham Akbar',
    gender: 'L',
    program: 'MTs',
    classLevel: 'VIII-B',
    guardianName: 'Siti Rohani',
    guardianPhone: '087812345678',
    guardianRelation: 'Ibu',
    address: 'Perumahan Citra Indah Blok R3, Jonggol',
    status: 'Aktif',
    dormitory: 'Gedung Utsman bin Affan (Kamar 301)',
    monthlySppAmount: 650000,
    joinDate: '2023-07-10'
  },
  {
    id: 'std-06',
    nis: '202307006',
    name: 'Salma Salsabila',
    gender: 'P',
    program: 'MTs',
    classLevel: 'IX-A',
    guardianName: 'Ir. Hendra Gunawan',
    guardianPhone: '08119876543',
    guardianRelation: 'Ayah',
    address: 'Taman Yasmin Sektor 6, Bogor Barat',
    status: 'Aktif',
    dormitory: 'Gedung Khadijah (Kamar 204)',
    monthlySppAmount: 650000,
    joinDate: '2022-07-12'
  },
  {
    id: 'std-07',
    nis: '202207007',
    name: 'Farhan Maulana Hakim',
    gender: 'L',
    program: 'MTs',
    classLevel: 'IX-B',
    guardianName: 'Agus Salim',
    guardianPhone: '081345678912',
    guardianRelation: 'Ayah',
    address: 'Jl. Raya Kranggan No. 17, Jatisampurna',
    status: 'Aktif',
    dormitory: 'Gedung Utsman bin Affan (Kamar 304)',
    monthlySppAmount: 650000,
    joinDate: '2022-07-12'
  },
  {
    id: 'std-08',
    nis: '202407008',
    name: 'Naufal Dzaki Ansori',
    gender: 'L',
    program: 'MA',
    classLevel: 'X-MIPA',
    guardianName: 'H. Ansori Lubis',
    guardianPhone: '081288899900',
    guardianRelation: 'Ayah',
    address: 'Jl. Teuku Umar No. 15, Jakarta Pusat',
    status: 'Aktif',
    dormitory: 'Gedung Ali bin Abi Thalib (Kamar 101)',
    monthlySppAmount: 750000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-09',
    nis: '202407009',
    name: 'Siti Maryam Al-Kubro',
    gender: 'P',
    program: 'MA',
    classLevel: 'X-IPS',
    guardianName: 'Hj. Endang Rahayu',
    guardianPhone: '085211223344',
    guardianRelation: 'Ibu',
    address: 'Grand Galaxy City Blok EB No. 8, Bekasi',
    status: 'Aktif',
    dormitory: 'Gedung Fatimah (Kamar 102)',
    monthlySppAmount: 750000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-10',
    nis: '202307010',
    name: 'Bilal Habibi Wahid',
    gender: 'L',
    program: 'MA',
    classLevel: 'XI-MIPA',
    guardianName: 'Dr. Wahid Hasyim, Sp.A',
    guardianPhone: '081122334455',
    guardianRelation: 'Ayah',
    address: 'Menteng Residence No. 27, Jakarta Pusat',
    status: 'Aktif',
    dormitory: 'Gedung Ali bin Abi Thalib (Kamar 201)',
    monthlySppAmount: 750000,
    joinDate: '2023-07-10'
  },
  {
    id: 'std-11',
    nis: '202307011',
    name: 'Khadijah Azzahra Putri',
    gender: 'P',
    program: 'MA',
    classLevel: 'XI-IPS',
    guardianName: 'H. Lukman Hakim',
    guardianPhone: '081399887766',
    guardianRelation: 'Ayah',
    address: 'Kota Wisata Cibubur Cluster Montreal No. 19',
    status: 'Aktif',
    dormitory: 'Gedung Fatimah (Kamar 203)',
    monthlySppAmount: 750000,
    joinDate: '2023-07-10'
  },
  {
    id: 'std-12',
    nis: '202207012',
    name: 'Rayhan Al-Ghifari',
    gender: 'L',
    program: 'MA',
    classLevel: 'XII-MIPA',
    guardianName: 'Supriatna, S.T.',
    guardianPhone: '085677889900',
    guardianRelation: 'Ayah',
    address: 'Villa Nusa Indah 2 Blok W5/10, Bojong Kulur',
    status: 'Aktif',
    dormitory: 'Gedung Ali bin Abi Thalib (Kamar 205)',
    monthlySppAmount: 750000,
    joinDate: '2022-07-12'
  },
  {
    id: 'std-13',
    nis: '202207013',
    name: 'Zaskia Nur Medina',
    gender: 'P',
    program: 'MA',
    classLevel: 'XII-IPS',
    guardianName: 'Hj. Rina Marlina',
    guardianPhone: '081233445566',
    guardianRelation: 'Ibu',
    address: 'Legenda Wisata Cluster Washington, Cibubur',
    status: 'Aktif',
    dormitory: 'Gedung Fatimah (Kamar 205)',
    monthlySppAmount: 750000,
    joinDate: '2022-07-12'
  },
  {
    id: 'std-14',
    nis: '202407014',
    name: 'Salman Al-Farisi',
    gender: 'L',
    program: 'Tahfizh',
    classLevel: 'Tahfizh-1',
    guardianName: 'H. Ridwan Kamil',
    guardianPhone: '081355667788',
    guardianRelation: 'Ayah',
    address: 'Jl. R.E. Martadinata No. 50, Bandung',
    status: 'Aktif',
    dormitory: 'Gedung Abu Bakar Ash-Shiddiq (Kamar 101)',
    monthlySppAmount: 850000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-15',
    nis: '202407015',
    name: 'Hafshah Binti Umar',
    gender: 'P',
    program: 'Tahfizh',
    classLevel: 'Tahfizh-1',
    guardianName: 'Umar Wirahadikusumah',
    guardianPhone: '081244556677',
    guardianRelation: 'Ayah',
    address: 'Perumahan Bukit Sentul Blok B No. 4, Babakan Madang',
    status: 'Aktif',
    dormitory: 'Gedung Hafshah (Kamar 101)',
    monthlySppAmount: 850000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-16',
    nis: '202307016',
    name: 'Thariq Bin Ziyad',
    gender: 'L',
    program: 'Tahfizh',
    classLevel: 'Tahfizh-2',
    guardianName: 'Drs. H. Mulyadi',
    guardianPhone: '081900112233',
    guardianRelation: 'Ayah',
    address: 'Jl. Pajajaran No. 34, Bogor Tengah',
    status: 'Aktif',
    dormitory: 'Gedung Abu Bakar Ash-Shiddiq (Kamar 104)',
    monthlySppAmount: 850000,
    joinDate: '2023-07-10'
  },
  {
    id: 'std-17',
    nis: '202407017',
    name: 'Zaid Bin Tsabit',
    gender: 'L',
    program: 'MTs',
    classLevel: 'VII-A',
    guardianName: 'H. Tsabit Abdullah',
    guardianPhone: '085799881122',
    guardianRelation: 'Ayah',
    address: 'Jl. Juanda No. 12, Sukabumi',
    status: 'Aktif',
    dormitory: 'Gedung Umar bin Khattab (Kamar 204)',
    monthlySppAmount: 650000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-18',
    nis: '202407018',
    name: 'Maryam Binti Imran',
    gender: 'P',
    program: 'MTs',
    classLevel: 'VII-B',
    guardianName: 'Imran Al-Mansyur',
    guardianPhone: '081277665544',
    guardianRelation: 'Ayah',
    address: 'Perum Kota Serang Baru Blok D No. 9, Cikarang',
    status: 'Aktif',
    dormitory: 'Gedung Khadijah (Kamar 106)',
    monthlySppAmount: 650000,
    joinDate: '2024-07-15'
  },
  {
    id: 'std-19',
    nis: '202307019',
    name: 'Hamzah Asadullah',
    gender: 'L',
    program: 'MA',
    classLevel: 'XI-MIPA',
    guardianName: 'Asad Subekti',
    guardianPhone: '081322110099',
    guardianRelation: 'Ayah',
    address: 'Jl. KH. Noer Ali No. 2, Kalimalang, Bekasi',
    status: 'Aktif',
    dormitory: 'Gedung Ali bin Abi Thalib (Kamar 204)',
    monthlySppAmount: 750000,
    joinDate: '2023-07-10'
  },
  {
    id: 'std-20',
    nis: '202207020',
    name: 'Ruqayyah Al-Habsyi',
    gender: 'P',
    program: 'MA',
    classLevel: 'XII-MIPA',
    guardianName: 'Habib Ali Al-Habsyi',
    guardianPhone: '085611228899',
    guardianRelation: 'Ayah',
    address: 'Condet Raya No. 45, Kramat Jati, Jakarta Timur',
    status: 'Aktif',
    dormitory: 'Gedung Fatimah (Kamar 206)',
    monthlySppAmount: 750000,
    joinDate: '2022-07-12'
  }
];

export function generateSeedBillsAndPayments(students: Student[], settings: PesantrenSettings): { bills: Bill[]; payments: Payment[] } {
  const bills: Bill[] = [];
  const payments: Payment[] = [];

  // Academic year 2026/2027:
  // July (7), August (8), September (9), October (10 - current)
  const targetMonths = [
    { month: 7, name: 'Juli', year: 2026, dueDate: '2026-07-10' },
    { month: 8, name: 'Agustus', year: 2026, dueDate: '2026-08-10' },
    { month: 9, name: 'September', year: 2026, dueDate: '2026-09-10' },
    { month: 10, name: 'Oktober', year: 2026, dueDate: '2026-10-10' },
  ];

  let receiptSeq = 101;

  students.forEach((student, studentIndex) => {
    const sppAmount = student.monthlySppAmount;
    const sppPart = Math.round(sppAmount * 0.5);
    const asramaPart = Math.round(sppAmount * 0.25);
    const konsumsiPart = sppAmount - sppPart - asramaPart;

    targetMonths.forEach((m) => {
      const billId = `bill-${student.id}-${m.year}-${m.month}`;
      
      let status: 'Lunas' | 'Dibayar Sebagian' | 'Belum Bayar' | 'Terlambat' = 'Belum Bayar';
      let paidAmount = 0;
      let remainingAmount = sppAmount;
      let paidAtDate: string | undefined = undefined;
      let paymentId: string | undefined = undefined;
      const installments: any[] = [];

      // Determine payment distribution
      if (m.month === 7 || m.month === 8) {
        // July & August: Almost all lunas except student 4 & 18 who are terlambat
        if (studentIndex === 4 || studentIndex === 18) {
          status = 'Terlambat';
          paidAmount = 0;
          remainingAmount = sppAmount;
        } else {
          status = 'Lunas';
          paidAmount = sppAmount;
          remainingAmount = 0;
        }
      } else if (m.month === 9) {
        // September:
        if (studentIndex === 4 || studentIndex === 18) {
          status = 'Terlambat';
          paidAmount = 0;
          remainingAmount = sppAmount;
        } else if (studentIndex === 2) {
          // Ahmad Fauzi paid partially in September!
          status = 'Dibayar Sebagian';
          paidAmount = 350000;
          remainingAmount = sppAmount - 350000;
        } else if (studentIndex === 11) {
          status = 'Terlambat';
          paidAmount = 0;
          remainingAmount = sppAmount;
        } else {
          status = 'Lunas';
          paidAmount = sppAmount;
          remainingAmount = 0;
        }
      } else if (m.month === 10) {
        // Current month (Oktober):
        if (studentIndex === 1) {
          // Fatimah Az-Zahra: Dibayar Sebagian (e.g. bayar Rp 350.000)
          status = 'Dibayar Sebagian';
          paidAmount = 350000;
          remainingAmount = sppAmount - 350000;
        } else if (studentIndex === 7) {
          // Naufal Dzaki: Dibayar Sebagian (e.g. bayar Rp 400.000)
          status = 'Dibayar Sebagian';
          paidAmount = 400000;
          remainingAmount = sppAmount - 400000;
        } else if ([2, 4, 11, 14, 18].includes(studentIndex)) {
          // Belum bayar
          status = 'Belum Bayar';
          paidAmount = 0;
          remainingAmount = sppAmount;
        } else {
          // Lunas
          status = 'Lunas';
          paidAmount = sppAmount;
          remainingAmount = 0;
        }
      }

      // If there is any paid amount, generate payment records & installments
      if (paidAmount > 0) {
        const paymentDay = 2 + (studentIndex % 8);
        const dayStr = String(paymentDay).padStart(2, '0');
        const hour = 8 + (studentIndex % 8);
        const min = (studentIndex * 13) % 60;
        paidAtDate = `2026-${String(m.month).padStart(2, '0')}-${dayStr}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
        paymentId = `pay-${student.id}-${m.year}-${m.month}`;

        const methods: ('Tunai' | 'Transfer BSI' | 'Transfer BCA' | 'QRIS')[] = ['Transfer BSI', 'Tunai', 'Transfer BCA', 'QRIS'];
        const chosenMethod = methods[(studentIndex + m.month) % methods.length];
        const receiptNo = `KWT/${m.year}/${String(m.month).padStart(2, '0')}/${String(receiptSeq++).padStart(4, '0')}`;

        installments.push({
          id: `inst-${paymentId}-1`,
          paymentId: paymentId,
          amount: paidAmount,
          paidDate: paidAtDate,
          receiptNumber: receiptNo,
          paymentMethod: chosenMethod,
          cashierName: settings.treasurer
        });

        payments.push({
          id: paymentId,
          receiptNumber: receiptNo,
          studentId: student.id,
          studentName: student.name,
          studentNis: student.nis,
          classLevel: student.classLevel,
          billIds: [billId],
          billPaymentDetails: [{
            billId: billId,
            amountPaid: paidAmount,
            monthName: m.name,
            year: m.year
          }],
          monthsCovered: [`${m.name} ${m.year}`],
          totalAmount: paidAmount,
          paymentMethod: chosenMethod,
          paymentType: status === 'Lunas' ? 'Lunas' : 'Cicilan / Sebagian',
          remainingBalanceTotal: remainingAmount,
          paidDate: paidAtDate,
          cashierName: settings.treasurer,
          payerName: student.guardianName,
          status: 'Berhasil',
          notes: status === 'Lunas' 
            ? `Pembayaran Lunas SPP Bulan ${m.name} ${m.year}`
            : `Pembayaran Cicilan/Sebagian SPP Bulan ${m.name} ${m.year} (Sisa ${remainingAmount})`
        });
      }

      bills.push({
        id: billId,
        studentId: student.id,
        studentName: student.name,
        studentNis: student.nis,
        classLevel: student.classLevel,
        month: m.month,
        monthName: m.name,
        year: m.year,
        amount: sppAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        breakdown: {
          spp: sppPart,
          asrama: asramaPart,
          konsumsi: konsumsiPart
        },
        dueDate: m.dueDate,
        status: status,
        paidAt: paidAtDate,
        paymentId: paymentId,
        installments: installments
      });
    });
  });

  // Sort payments newest first
  payments.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());

  return { bills, payments };
}
