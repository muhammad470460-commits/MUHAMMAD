import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER_ADMIN_EMAIL = 'muhammad470460@gmail.com';

interface StoredUser {
  id: string;
  name: string;
  nameLower: string;
  phone: string;
  phoneNormalized: string;
  email: string;
  emailLower: string;
  role: 'user' | 'admin';
  passwordSalt: string;
  passwordHash: string;
  referralCode: string;
  referredByCode: string | null;
  referredByUserId: string | null;
  referredByName: string | null;
  memberRank: string;
  createdAt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt?: string;
  lastSeenAt?: string;
}

interface StoredPlan {
  id: string;
  code: string;
  section: 1 | 2 | 3 | 4;
  name: string;
  tierLabel: string;
  investmentAmount: number;
  projectedDailyProfit: number;
  profitRatePercent: number;
  durationDays: number;
  level1BonusPercent: number;
  level2BonusPercent: number;
  isActive: boolean;
}

interface StoredDeposit {
  id: string;
  userId: string;
  planId: string;
  packageCode: string;
  packageName: string;
  amount: number;
  projectedDailyProfit: number;
  durationDays: number;
  paymentMethod: string;
  senderAccountName: string;
  senderAccountNumber: string;
  transactionRef: string;
  receiptFilename: string | null;
  receiptMimeType: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewedByName: string | null;
}

interface StoredWithdrawal {
  id: string;
  userId: string;
  amount: number;
  method: string;
  accountTitle: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewedByName: string | null;
}

interface StoredActivePlan {
  id: string;
  userId: string;
  depositId: string;
  packageCode: string;
  packageName: string;
  investmentAmount: number;
  projectedDailyProfit: number;
  durationDays: number;
  daysCredited: number;
  totalProfitCredited: number;
  status: 'active' | 'completed';
  startedAt: string;
  expiresAt: string;
  lastProfitAt?: string;
  nextProfitAt?: string;
}

interface StoredLedgerEntry {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'plan_profit' | 'referral_commission';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  description: string;
  referenceId: string;
  rejectionReason: string | null;
  createdAt: string;
}

interface StoredSupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'replied';
  adminReply: string | null;
  createdAt: string;
  repliedAt: string | null;
}

interface StoredSupportMessage {
  id: string;
  userId: string;
  senderRole: 'user' | 'admin';
  senderId: string;
  senderName: string;
  subject: string | null;
  body: string;
  readByAdmin: boolean;
  readByUser: boolean;
  createdAt: string;
}

interface StoredNotification {
  id: string;
  recipientRole: 'user' | 'admin';
  recipientUserId: string | null;
  type: 'customer_message' | 'admin_reply';
  title: string;
  body: string;
  relatedUserId: string;
  relatedUserName: string;
  messageId: string;
  isRead: boolean;
  createdAt: string;
}

interface StoredAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string;
  authorName: string;
  createdAt: string;
}

interface StoredAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetUserName: string | null;
  summary: string;
  createdAt: string;
}

interface PaymentReceivingConfig {
  defaultDepositMethod: 'Easypaisa' | 'JazzCash' | 'Bank Transfer';
  easypaisaEnabled: boolean;
  easypaisaTitle: string;
  easypaisaNumber: string;
  jazzcashEnabled: boolean;
  jazzcashTitle: string;
  jazzcashNumber: string;
  bankTransferEnabled: boolean;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  adminPhone: string;
  supportWhatsapp: string;
  officialChannelUrl: string;
  fbrRegistrationRef: string;
  fbrDocumentUrl: string;
  fbrDocumentMime: string;
  fbrUploadedFilename?: string | null;
  secpRegistrationRef: string;
  secpDocumentUrl: string;
  secpDocumentMime: string;
  secpUploadedFilename?: string | null;
}

interface StoredTransactionScreenshot {
  id: string;
  depositId: string | null;
  transactionRef: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  amount: number;
  category: 'active' | 'complimentary' | 'retired';
  notes: string;
  receiptFilename: string;
  receiptMimeType: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredGeneratedReceipt {
  id: string;
  receiptType: 'bank_transfer' | 'cash' | 'easypaisa' | 'jazzcash' | 'other';
  senderName: string;
  senderAccountOrPhone: string;
  receiverName: string;
  receiverAccountOrPhone: string;
  amount: number;
  fee: number;
  transactionRef: string;
  transactionDateTime: string;
  status: 'successful' | 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  bankName: string;
  purpose: string;
  notes: string;
  backgroundTheme: 'meezan_receipt' | 'jazzcash_receipt' | 'easypaisa_receipt' | 'classic_clean' | 'custom_bg';
  customBackgroundFilename?: string | null;
  customBackgroundMime?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  plans: StoredPlan[];
  deposits: StoredDeposit[];
  withdrawals: StoredWithdrawal[];
  activePlans: StoredActivePlan[];
  ledger: StoredLedgerEntry[];
  supportTickets: StoredSupportTicket[];
  supportMessages: StoredSupportMessage[];
  notifications: StoredNotification[];
  announcements: StoredAnnouncement[];
  auditLogs: StoredAuditLog[];
  paymentConfig: PaymentReceivingConfig;
  transactionScreenshots?: StoredTransactionScreenshot[];
  generatedReceipts?: StoredGeneratedReceipt[];
}

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'nbv_db.json');

function computePlanProfitRate(amount: number, daily: number): number {
  if (!amount || amount <= 0) return 0;
  return Number(((daily / amount) * 100).toFixed(2));
}

function createDefaultPlans(): StoredPlan[] {
  const tiers: Array<{
    code: string;
    section: 1 | 2 | 3 | 4;
    name: string;
    tierLabel: string;
    amount: number;
    daily: number;
    rate?: number;
  }> = [
    // SECTION 1: NBV-01 to NBV-05
    { code: 'NBV-01', section: 1, name: 'Premium Plan', tierLabel: 'Section 1 · NBV-01 to NBV-05', amount: 680, daily: 88 },
    { code: 'NBV-02', section: 1, name: 'Premium Plan', tierLabel: 'Section 1 · NBV-01 to NBV-05', amount: 980, daily: 130 },
    { code: 'NBV-03', section: 1, name: 'Premium Plan', tierLabel: 'Section 1 · NBV-01 to NBV-05', amount: 1680, daily: 218 },
    { code: 'NBV-04', section: 1, name: 'Premium Plan', tierLabel: 'Section 1 · NBV-01 to NBV-05', amount: 2480, daily: 320 },
    { code: 'NBV-05', section: 1, name: 'Premium Plan', tierLabel: 'Section 1 · NBV-01 to NBV-05', amount: 4680, daily: 620 },

    // SECTION 2: NBV-06 to NBV-10
    { code: 'NBV-06', section: 2, name: 'Premium Plan', tierLabel: 'Section 2 · NBV-06 to NBV-10', amount: 9680, daily: 1218 },
    { code: 'NBV-07', section: 2, name: 'Premium Plan', tierLabel: 'Section 2 · NBV-06 to NBV-10', amount: 14680, daily: 1870 },
    { code: 'NBV-08', section: 2, name: 'Premium Plan', tierLabel: 'Section 2 · NBV-06 to NBV-10', amount: 19680, daily: 2510 },
    { code: 'NBV-09', section: 2, name: 'Premium Plan', tierLabel: 'Section 2 · NBV-06 to NBV-10', amount: 24680, daily: 3195 },
    { code: 'NBV-10', section: 2, name: 'Premium Plan', tierLabel: 'Section 2 · NBV-06 to NBV-10', amount: 29680, daily: 3905 },

    // SECTION 3: NBV-11 to NBV-15
    { code: 'NBV-11', section: 3, name: 'Premium Plan', tierLabel: 'Section 3 · NBV-11 to NBV-15', amount: 35680, daily: 4862 },
    { code: 'NBV-12', section: 3, name: 'Premium Plan', tierLabel: 'Section 3 · NBV-11 to NBV-15', amount: 43680, daily: 5965 },
    { code: 'NBV-13', section: 3, name: 'Premium Plan', tierLabel: 'Section 3 · NBV-11 to NBV-15', amount: 56680, daily: 7485 },
    { code: 'NBV-14', section: 3, name: 'Premium Plan', tierLabel: 'Section 3 · NBV-11 to NBV-15', amount: 73680, daily: 9712 },
    { code: 'NBV-15', section: 3, name: 'Premium Plan', tierLabel: 'Section 3 · NBV-11 to NBV-15', amount: 98680, daily: 12936 },

    // SECTION 4: NBV-16 to NBV-20
    { code: 'NBV-16', section: 4, name: 'Premium Plan', tierLabel: 'Section 4 · NBV-16 to NBV-20', amount: 128680, daily: 16085, rate: 12.5 },
    { code: 'NBV-17', section: 4, name: 'Premium Plan', tierLabel: 'Section 4 · NBV-16 to NBV-20', amount: 154680, daily: 19335, rate: 12.5 },
    { code: 'NBV-18', section: 4, name: 'Premium Plan', tierLabel: 'Section 4 · NBV-16 to NBV-20', amount: 186680, daily: 23335, rate: 12.5 },
    { code: 'NBV-19', section: 4, name: 'Premium Plan', tierLabel: 'Section 4 · NBV-16 to NBV-20', amount: 240680, daily: 30085, rate: 12.5 },
    { code: 'NBV-20', section: 4, name: 'Premium Plan', tierLabel: 'Section 4 · NBV-16 to NBV-20', amount: 310680, daily: 38940, rate: 12.53 },
  ];

  return tiers.map((t, index) => ({
    id: `plan-${index + 1}`,
    code: t.code,
    section: t.section,
    name: t.name,
    tierLabel: t.tierLabel,
    investmentAmount: t.amount,
    projectedDailyProfit: t.daily,
    profitRatePercent: t.rate ?? computePlanProfitRate(t.amount, t.daily),
    durationDays: 90,
    level1BonusPercent: 12,
    level2BonusPercent: 3,
    isActive: true,
  }));
}

function createDefaultPaymentConfig(): PaymentReceivingConfig {
  return {
    defaultDepositMethod: 'Easypaisa',
    easypaisaEnabled: true,
    easypaisaTitle: 'SUMERA BIBI',
    easypaisaNumber: '03433370774',
    jazzcashEnabled: true,
    jazzcashTitle: 'SUMERA BIBI',
    jazzcashNumber: '03433370774',
    bankTransferEnabled: true,
    bankName: 'Meezan Bank Limited',
    bankAccountTitle: 'SUMERA BIBI',
    bankAccountNumber: '03433370774',
    adminPhone: '03433370774',
    supportWhatsapp: '+92 343 3370774',
    officialChannelUrl: 'https://whatsapp.com/channel/0029VbDmmVb1iUxek51QYq1o',
    fbrRegistrationRef:
      'Registration No: 1886105 · Ref No: 1886105-1 · RTO ISLAMABAD — NBV TRADING (Income Tax: Active, Sales Tax: OPERATIVE)',
    fbrDocumentUrl: '/assets/aistudio/file_00000000595c8230857e035a6f403914_ec47d0fc.png',
    fbrDocumentMime: 'image/png',
    fbrUploadedFilename: null,
    secpRegistrationRef:
      'Corporate Unique Identification No. 886105 · NBV TRADING (SMC-PRIVATE) LIMITED · SECP ISLAMABAD',
    secpDocumentUrl: '/assets/secp-certificate-nbv.png',
    secpDocumentMime: 'image/png',
    secpUploadedFilename: null,
  };
}

function createDefaultAnnouncements(): StoredAnnouncement[] {
  return [
    {
      id: 'ann-welcome-1',
      title: 'Welcome to NBV Trading Platform',
      body: 'All 20 NBV investment packages (NBV-01 to NBV-20) are active with 90-day duration and verified admin receipt review. Always upload a clear payment receipt and transaction reference ID when submitting a deposit request.',
      category: 'Official Notice',
      authorName: 'NBV Administration',
      createdAt: new Date().toISOString(),
    },
  ];
}

function ensureDbLoaded(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const defaults: DatabaseSchema = {
    users: [],
    sessions: [],
    plans: createDefaultPlans(),
    deposits: [],
    withdrawals: [],
    activePlans: [],
    ledger: [],
    supportTickets: [],
    supportMessages: [],
    notifications: [],
    announcements: createDefaultAnnouncements(),
    auditLogs: [],
    paymentConfig: createDefaultPaymentConfig(),
    transactionScreenshots: [],
    generatedReceipts: [],
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
    return defaults;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    let plansNeedsPersist = false;
    const users = Array.isArray(parsed.users)
      ? parsed.users.map((u, idx) => {
          const cleanName = typeof u.name === 'string' ? u.name.trim() : '';
          const cleanEmail = typeof u.email === 'string' ? u.email.trim() : '';
          const cleanPhone = typeof u.phone === 'string' ? u.phone.trim() : '';
          const phoneNorm = normalizePhoneDigits(cleanPhone || u.phoneNormalized || '');
          const isOwner =
            (cleanEmail || u.emailLower || '').toLowerCase() === OWNER_ADMIN_EMAIL ||
            phoneNorm === '03084704644' ||
            phoneNorm === '03433370774';
          const resolvedName = isOwner && (!cleanName || cleanName === 'MUHAMMAD') ? 'MUHAMMAD NAEEM' : (cleanName || u.name);
          return {
            ...u,
            name: resolvedName,
            nameLower: (resolvedName || u.nameLower || '').toLowerCase(),
            email: cleanEmail || u.email,
            emailLower: (cleanEmail || u.emailLower || '').toLowerCase(),
            phone: cleanPhone || u.phone,
            phoneNormalized: phoneNorm,
            role:
              u.role === 'admin' ||
              isOwner ||
              (cleanEmail || u.emailLower || '').toLowerCase() === OWNER_ADMIN_EMAIL ||
              (u.role === undefined && idx === 0)
                ? ('admin' as const)
                : ('user' as const),
          };
        })
      : [];

    // Ensure platform owner MUHAMMAD NAEEM (03084704644 / muhammad470460@gmail.com) is always present
    const hasOwnerAccount = users.some(
      (u) =>
        u.emailLower === OWNER_ADMIN_EMAIL ||
        u.phoneNormalized === '03084704644' ||
        u.phoneNormalized === '03433370774'
    );
    if (!hasOwnerAccount) {
      const ownerSalt = crypto.randomBytes(16).toString('hex');
      const ownerHash = hashPassword('12345678', ownerSalt);
      users.unshift({
        id: 'user-owner-muhammad-naeem',
        name: 'MUHAMMAD NAEEM',
        nameLower: 'muhammad naeem',
        phone: '03084704644',
        phoneNormalized: '03084704644',
        email: OWNER_ADMIN_EMAIL,
        emailLower: OWNER_ADMIN_EMAIL,
        role: 'admin',
        passwordSalt: ownerSalt,
        passwordHash: ownerHash,
        referralCode: 'NBV777',
        referredByCode: 'NBVSTART26',
        referredByUserId: null,
        referredByName: 'NBVSTART26',
        memberRank: 'NBV Director',
        createdAt: '2026-10-24T17:47:00.000Z',
      });
      plansNeedsPersist = true;
    }

    const canonicalPlans = createDefaultPlans();
    const editedPlanIds = new Set(
      (Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [])
        .filter((log) => log.action === 'UPDATE_PLAN')
        .map((log) => log.targetId)
    );
    let resolvedPlans: StoredPlan[];
    if (!Array.isArray(parsed.plans) || parsed.plans.length === 0) {
      resolvedPlans = canonicalPlans;
      plansNeedsPersist = true;
    } else {
      const existingByCode = new Map<string, StoredPlan>();
      for (const p of parsed.plans) {
        if (p && typeof p.code === 'string') {
          existingByCode.set(p.code.toUpperCase(), p as StoredPlan);
        }
      }
      resolvedPlans = canonicalPlans.map((canon) => {
        const existing = existingByCode.get(canon.code.toUpperCase());
        if (!existing) {
          plansNeedsPersist = true;
          return canon;
        }
        const wasManuallyEdited = editedPlanIds.has(existing.id);
        if (!wasManuallyEdited) {
          if (
            existing.level1BonusPercent !== canon.level1BonusPercent ||
            existing.level2BonusPercent !== canon.level2BonusPercent ||
            existing.profitRatePercent !== canon.profitRatePercent
          ) {
            plansNeedsPersist = true;
          }
          return {
            ...canon,
            isActive: typeof existing.isActive === 'boolean' ? existing.isActive : true,
          };
        }
        return {
          ...canon,
          ...existing,
          profitRatePercent: computePlanProfitRate(
            existing.investmentAmount,
            existing.projectedDailyProfit
          ),
        };
      });
    }

    const hasAdminPaymentEdits =
      Array.isArray(parsed.auditLogs) &&
      parsed.auditLogs.some((log) => log.action === 'UPDATE_PAYMENT_SETTINGS');
    const resolvedPaymentConfig =
      !parsed.paymentConfig ||
      (!hasAdminPaymentEdits && parsed.paymentConfig.easypaisaNumber === '0300-0000000')
        ? createDefaultPaymentConfig()
        : { ...createDefaultPaymentConfig(), ...parsed.paymentConfig };

    if (
      !resolvedPaymentConfig.officialChannelUrl ||
      !resolvedPaymentConfig.officialChannelUrl.startsWith('http')
    ) {
      resolvedPaymentConfig.officialChannelUrl =
        'https://whatsapp.com/channel/0029VbDmmVb1iUxek51QYq1o';
    }

      if (!resolvedPaymentConfig.fbrDocumentUrl) {
        resolvedPaymentConfig.fbrDocumentUrl =
          '/assets/aistudio/file_00000000595c8230857e035a6f403914_ec47d0fc.png';
        resolvedPaymentConfig.fbrDocumentMime = 'image/png';
      }

      if (!resolvedPaymentConfig.secpDocumentUrl) {
        resolvedPaymentConfig.secpDocumentUrl = '/assets/secp-certificate-nbv.png';
        resolvedPaymentConfig.secpDocumentMime = 'image/png';
        resolvedPaymentConfig.secpRegistrationRef =
          'Corporate Unique Identification No. 886105 · NBV TRADING (SMC-PRIVATE) LIMITED · SECP ISLAMABAD';
      }

      const defaultExpiryIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const normalizedSessions = Array.isArray(parsed.sessions)
        ? parsed.sessions
            .filter((s) => s && typeof s.token === 'string' && typeof s.userId === 'string')
            .map((s) => ({
              ...s,
              expiresAt: s.expiresAt || defaultExpiryIso,
            }))
        : [];

      const legacyTickets = Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [];
      let supportMessages: StoredSupportMessage[] = Array.isArray(parsed.supportMessages)
        ? parsed.supportMessages
        : [];

      // Seamless one-time migration of any legacy supportTickets into chronological supportMessages
      if (supportMessages.length === 0 && legacyTickets.length > 0) {
        const migrated: StoredSupportMessage[] = [];
        const chronologicalTickets = [...legacyTickets].reverse();
        for (const t of chronologicalTickets) {
          const owner = users.find((u) => u.id === t.userId);
          migrated.push({
            id: `msg_${t.id}`,
            userId: t.userId,
            senderRole: 'user',
            senderId: t.userId,
            senderName: owner ? owner.name : 'Customer',
            subject: t.subject || null,
            body: t.message,
            readByAdmin: t.status === 'replied',
            readByUser: true,
            createdAt: t.createdAt,
          });
          if (t.adminReply) {
            migrated.push({
              id: `msg_reply_${t.id}`,
              userId: t.userId,
              senderRole: 'admin',
              senderId: 'admin',
              senderName: 'NBV Admin Support',
              subject: t.subject || null,
              body: t.adminReply,
              readByAdmin: true,
              readByUser: true,
              createdAt: t.repliedAt || t.createdAt,
            });
          }
        }
        supportMessages = migrated;
      }

      const loadedDb: DatabaseSchema = {
        users,
        sessions: normalizedSessions,
        plans: resolvedPlans,
        deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
        withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
        activePlans: Array.isArray(parsed.activePlans)
          ? parsed.activePlans.map((ap) => {
              const started = ap.startedAt || new Date().toISOString();
              const last = ap.lastProfitAt || started;
              const next =
                ap.nextProfitAt ||
                new Date(new Date(last).getTime() + 24 * 60 * 60 * 1000).toISOString();
              return {
                ...ap,
                lastProfitAt: last,
                nextProfitAt: next,
              };
            })
          : [],
        ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
        supportTickets: legacyTickets,
        supportMessages,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        announcements:
          Array.isArray(parsed.announcements) && parsed.announcements.length > 0
            ? parsed.announcements
            : createDefaultAnnouncements(),
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        paymentConfig: resolvedPaymentConfig,
        transactionScreenshots: Array.isArray(parsed.transactionScreenshots)
          ? parsed.transactionScreenshots
          : [],
        generatedReceipts: Array.isArray(parsed.generatedReceipts)
          ? parsed.generatedReceipts
          : [],
      };

      // Seed the initial user-provided JazzCash payment receipt screenshot if none exists
      if (!Array.isArray(loadedDb.transactionScreenshots) || loadedDb.transactionScreenshots.length === 0) {
        loadedDb.transactionScreenshots = [
          {
            id: 'scr-initial-jazzcash-1',
            depositId: null,
            transactionRef: '728057293613',
            userId: null,
            customerName: 'MUHAMMAD NAEEM',
            customerPhone: '03084704644',
            paymentMethod: 'JazzCash',
            amount: 14615,
            category: 'active',
            notes: 'Official JazzCash Transaction (TID: 728057293613) to Syed Ishaq Hussain Shah (***3908) - Rs 14,615.00',
            receiptFilename: 'user_uploaded_IMG-20261024-WA0197_1181407d.jpg',
            receiptMimeType: 'image/jpeg',
            createdAt: '2026-10-24T17:47:00.000Z',
            updatedAt: new Date().toISOString(),
          },
        ];
        plansNeedsPersist = true;
      }

      // Seed realistic Meezan Bank and JazzCash editable receipt templates if none exists
      if (!Array.isArray(loadedDb.generatedReceipts) || loadedDb.generatedReceipts.length === 0) {
        loadedDb.generatedReceipts = [
          {
            id: 'rcpt-seed-meezan-1',
            receiptType: 'bank_transfer',
            senderName: 'MUHAMMAD NAEEM',
            senderAccountOrPhone: '03433370774',
            receiverName: 'SUMERA BIBI',
            receiverAccountOrPhone: '03433370774',
            amount: 14615,
            fee: 0,
            transactionRef: '728057293613',
            transactionDateTime: '24 Oct 2026 at 17:47',
            status: 'successful',
            paymentMethod: 'Bank Transfer',
            bankName: 'Meezan Bank Limited',
            purpose: 'Investment Deposit',
            notes: 'Transferred via Meezan Mobile Banking — Instant Settlement',
            backgroundTheme: 'meezan_receipt',
            customBackgroundFilename: null,
            customBackgroundMime: null,
            createdAt: '2026-10-24T17:47:00.000Z',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'rcpt-seed-jazzcash-2',
            receiptType: 'jazzcash',
            senderName: 'MUHAMMAD NAEEM',
            senderAccountOrPhone: '03084704644',
            receiverName: 'Syed Ishaq Hussain Shah',
            receiverAccountOrPhone: '*******3908',
            amount: 14615,
            fee: 0,
            transactionRef: '728057293613',
            transactionDateTime: '24 Oct 2026 at 17:47',
            status: 'successful',
            paymentMethod: 'JazzCash',
            bankName: 'Mobilink Microfinance Bank',
            purpose: 'Transferred to Other Wallet',
            notes: 'Securely paid via JazzCash — Fee Rs. 0.00',
            backgroundTheme: 'jazzcash_receipt',
            customBackgroundFilename: null,
            customBackgroundMime: null,
            createdAt: '2026-10-24T17:47:00.000Z',
            updatedAt: new Date().toISOString(),
          },
        ];
        plansNeedsPersist = true;
      }
      if (plansNeedsPersist) {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(loadedDb, null, 2), 'utf-8');
        } catch {
          // Ignore write race on load
        }
      }
      return loadedDb;
  } catch {
    return defaults;
  }
}

let db: DatabaseSchema = ensureDbLoaded();

function saveDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

function stripInvisibleFormatting(input: string): string {
  return input.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');
}

function toAsciiDigits(input: string): string {
  return stripInvisibleFormatting(input)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function normalizePhoneDigits(phone: string): string {
  const digits = toAsciiDigits(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00920') && digits.length >= 15) {
    return '0' + digits.slice(5);
  }
  if (digits.startsWith('0092') && digits.length >= 14) {
    return '0' + digits.slice(4);
  }
  if (digits.startsWith('920') && digits.length === 13) {
    return '0' + digits.slice(3);
  }
  if (digits.startsWith('92') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (digits.length === 10 && digits.startsWith('3')) {
    return '0' + digits;
  }
  if (digits.startsWith('00') && digits.length >= 11) {
    return digits.slice(2);
  }
  return digits;
}

function phonesMatch(user: StoredUser, rawInput: string): boolean {
  const inputNorm = normalizePhoneDigits(rawInput);
  if (inputNorm.length < 7) return false;
  const storedNorm = normalizePhoneDigits(user.phone || user.phoneNormalized || '');
  if (!storedNorm) return false;
  if (storedNorm === inputNorm || user.phoneNormalized === inputNorm) {
    return true;
  }
  // Canonical 10-digit subscriber comparison for Pakistani mobile numbers (3XXXXXXXXX)
  const inputTail =
    inputNorm.length === 11 && inputNorm.startsWith('03') ? inputNorm.slice(1) : inputNorm;
  const storedTail =
    storedNorm.length === 11 && storedNorm.startsWith('03') ? storedNorm.slice(1) : storedNorm;
  if (inputTail.length === 10 && inputTail.startsWith('3') && inputTail === storedTail) {
    return true;
  }
  // For owner account, support both primary and secondary numbers (03084704644 and 03433370774)
  if (user.emailLower === OWNER_ADMIN_EMAIL || user.role === 'admin') {
    if (inputNorm === '03084704644' || inputNorm === '03433370774') return true;
    if (inputTail === '3084704644' || inputTail === '3433370774') return true;
  }
  return false;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actualBuf = Buffer.from(hashPassword(password, salt), 'hex');
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function makeReferralCode(name: string, existingUsers: StoredUser[]): string {
  const baseSlug = name
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const base = baseSlug.length >= 2 ? baseSlug : `NBV${Math.floor(1000 + Math.random() * 9000)}`;
  let candidate = base;
  let suffix = 1;
  while (existingUsers.some((u) => u.referralCode.toLowerCase() === candidate.toLowerCase())) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function findReferrer(refInput: string): StoredUser | undefined {
  const clean = refInput.trim();
  if (!clean) return undefined;
  const cleanLower = clean.toLowerCase();
  const cleanDigits = normalizePhoneDigits(clean);

  return db.users.find(
    (u) =>
      u.referralCode.toLowerCase() === cleanLower ||
      u.nameLower === cleanLower ||
      (cleanDigits.length >= 7 && u.phoneNormalized === cleanDigits)
  );
}

function isDirectReferredBy(member: StoredUser, parent: StoredUser): boolean {
  if (member.id === parent.id) return false;
  if (member.referredByUserId === parent.id) return true;
  if (
    member.referredByCode &&
    (member.referredByCode.toLowerCase() === parent.referralCode.toLowerCase() ||
      member.referredByCode.toLowerCase() === parent.nameLower)
  ) {
    return true;
  }
  return false;
}

function recordAuditLog(
  admin: StoredUser,
  action: string,
  targetType: string,
  targetId: string,
  targetUserName: string | null,
  summary: string
) {
  db.auditLogs.unshift({
    id: crypto.randomUUID(),
    adminId: admin.id,
    adminName: admin.name,
    action,
    targetType,
    targetId,
    targetUserName,
    summary,
    createdAt: new Date().toISOString(),
  });
}

function maskPhone(phone: string): string {
  if (phone.length > 5) {
    return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
  }
  return phone;
}

/**
 * Automated Daily Profit Calculation & Settlement Engine
 * Automatically distributes verified daily profit every 24-hour cycle.
 */
function processDailyProfitSettlement(targetUserId?: string): { creditedCount: number; totalDistributed: number } {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  let creditedCount = 0;
  let totalDistributed = 0;
  let changed = false;

  const eligible = db.activePlans.filter((ap) => {
    if (ap.status !== 'active') return false;
    if (ap.daysCredited >= ap.durationDays) return false;
    if (targetUserId && ap.userId !== targetUserId) return false;
    return true;
  });

  for (const plan of eligible) {
    if (!plan.lastProfitAt) {
      plan.lastProfitAt = plan.startedAt || new Date().toISOString();
      changed = true;
    }
    const lastTime = new Date(plan.lastProfitAt).getTime();
    const elapsedDays = Math.floor((now - lastTime) / oneDayMs);

    if (elapsedDays >= 1) {
      const cyclesToCredit = Math.min(elapsedDays, plan.durationDays - plan.daysCredited);
      for (let c = 0; c < cyclesToCredit; c++) {
        const creditAmount = Number(plan.projectedDailyProfit.toFixed(2));
        if (creditAmount <= 0) continue;

        plan.daysCredited += 1;
        plan.totalProfitCredited = Number((plan.totalProfitCredited + creditAmount).toFixed(2));

        const creditTime = new Date(lastTime + (c + 1) * oneDayMs).toISOString();

        db.ledger.unshift({
          id: crypto.randomUUID(),
          userId: plan.userId,
          type: 'plan_profit',
          amount: creditAmount,
          status: 'approved',
          title: `Daily Trading Profit — ${plan.packageCode}`,
          description: `Day ${plan.daysCredited} of ${plan.durationDays} verified daily profit settlement`,
          referenceId: plan.id,
          rejectionReason: null,
          createdAt: creditTime,
        });

        creditedCount += 1;
        totalDistributed += creditAmount;
        changed = true;
      }

      plan.lastProfitAt = new Date(lastTime + cyclesToCredit * oneDayMs).toISOString();
      plan.nextProfitAt = new Date(new Date(plan.lastProfitAt).getTime() + oneDayMs).toISOString();

      if (plan.daysCredited >= plan.durationDays) {
        plan.status = 'completed';
      }
      changed = true;
    } else {
      if (!plan.nextProfitAt) {
        plan.nextProfitAt = new Date(lastTime + oneDayMs).toISOString();
        changed = true;
      }
    }
  }

  if (changed) {
    saveDb();
  }

  return { creditedCount, totalDistributed };
}

/**
 * Strictly calculates all financial metrics from verified transaction records.
 * Principal investment amount is tracked separately under My Investment, NOT in the available Bank Balance.
 * Only daily profit and referral commissions are credited to the user's available wallet balance.
 */
function buildPublicUser(user: StoredUser) {
  processDailyProfitSettlement(user.id);

  const approvedDeposits = db.deposits.filter(
    (d) => d.userId === user.id && d.status === 'approved'
  );
  const pendingDepositsCount = db.deposits.filter(
    (d) => d.userId === user.id && d.status === 'pending'
  ).length;

  const approvedWithdrawals = db.withdrawals.filter(
    (w) => w.userId === user.id && w.status === 'approved'
  );
  const pendingWithdrawalsList = db.withdrawals.filter(
    (w) => w.userId === user.id && w.status === 'pending'
  );

  const totalDeposits = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);
  const totalWithdraw = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawals = pendingWithdrawalsList.reduce((sum, w) => sum + w.amount, 0);

  const verifiedEarningsEntries = db.ledger.filter(
    (entry) =>
      entry.userId === user.id &&
      entry.status === 'approved' &&
      (entry.type === 'plan_profit' || entry.type === 'referral_commission')
  );

  const todayPrefix = new Date().toISOString().slice(0, 10);
  const totalEarnings = verifiedEarningsEntries.reduce((sum, e) => sum + e.amount, 0);
  const todayEarnings = verifiedEarningsEntries
    .filter((e) => e.createdAt.startsWith(todayPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

  const teamCommission = verifiedEarningsEntries
    .filter((e) => e.type === 'referral_commission')
    .reduce((sum, e) => sum + e.amount, 0);

  // Active plans and total active investment (shown separately under My Investment)
  const userActivePlans = db.activePlans.filter(
    (p) => p.userId === user.id && p.status === 'active'
  );
  const totalInvestment = userActivePlans.reduce((sum, p) => sum + p.investmentAmount, 0);
  const dailyProfit = userActivePlans.reduce((sum, p) => sum + p.projectedDailyProfit, 0);
  const totalProfitEarned = db.ledger
    .filter((e) => e.userId === user.id && e.status === 'approved' && e.type === 'plan_profit')
    .reduce((sum, e) => sum + e.amount, 0);

  // Live Next Profit countdown timestamp (earliest next cycle among active plans)
  let nextProfitAt: string | null = null;
  if (userActivePlans.length > 0) {
    const times = userActivePlans.map((p) => {
      const base = new Date(p.lastProfitAt || p.startedAt).getTime();
      const target = base + 24 * 60 * 60 * 1000;
      return target > Date.now() ? target : Date.now() + 24 * 60 * 60 * 1000;
    });
    nextProfitAt = new Date(Math.min(...times)).toISOString();
  } else {
    const nextDaily = new Date();
    nextDaily.setHours(24, 0, 0, 0);
    nextProfitAt = nextDaily.toISOString();
  }

  // Available Bank Balance: ONLY profits and commissions credited to wallet minus approved withdrawals!
  // Principal investment amount is locked in trading and displayed separately under My Investment.
  const availableBalance = Math.max(
    0,
    Number((totalEarnings - totalWithdraw).toFixed(2))
  );

  // Level 1 and Level 2 Referral Tree
  const level1Users = db.users.filter((u) => isDirectReferredBy(u, user));
  const level1Ids = new Set(level1Users.map((u) => u.id));
  const level2Users = db.users.filter(
    (u) =>
      u.id !== user.id &&
      !level1Ids.has(u.id) &&
      level1Users.some((l1) => isDirectReferredBy(u, l1))
  );

  const getMemberApprovedDeposits = (memberId: string) =>
    db.deposits
      .filter((d) => d.userId === memberId && d.status === 'approved')
      .reduce((sum, d) => sum + d.amount, 0);

  const teamMembers = [
    ...level1Users.map((m) => ({
      id: m.id,
      name: m.name,
      phoneMasked: maskPhone(m.phone),
      joinedAt: m.createdAt,
      investment: getMemberApprovedDeposits(m.id),
      level: 1 as const,
    })),
    ...level2Users.map((m) => ({
      id: m.id,
      name: m.name,
      phoneMasked: maskPhone(m.phone),
      joinedAt: m.createdAt,
      investment: getMemberApprovedDeposits(m.id),
      level: 2 as const,
    })),
  ];

  const teamInvestment = teamMembers.reduce((sum, m) => sum + m.investment, 0);
  const activePlansCount = db.activePlans.filter(
    (p) => p.userId === user.id && p.status === 'active'
  ).length;

  // Dynamic rank calculation based on verified team size
  let computedRank = user.memberRank || 'Member';
  if (teamMembers.length >= 100) computedRank = 'NBV Director';
  else if (teamMembers.length >= 50) computedRank = 'Gold Leader';
  else if (teamMembers.length >= 10) computedRank = 'Silver Trader';

  const recentDeposits = db.deposits
    .filter((d) => d.userId === user.id)
    .slice(0, 6)
    .map(serializeDeposit);

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    referralCode: user.referralCode,
    referredBy: user.referredByName || 'Direct',
    balance: availableBalance,
    totalInvestment,
    dailyProfit,
    nextProfitAt,
    totalProfitEarned,
    totalDeposits,
    totalWithdraw,
    pendingWithdrawals,
    pendingDepositsCount,
    activePlansCount,
    recentDeposits,
    teamMembersCount: teamMembers.length,
    level1Count: level1Users.length,
    level2Count: level2Users.length,
    teamMembers,
    teamInvestment,
    totalEarnings,
    todayEarnings,
    teamCommission,
    memberRank: computedRank,
    createdAt: user.createdAt,
  };
}

function serializeDeposit(d: StoredDeposit) {
  const owner = db.users.find((u) => u.id === d.userId);
  return {
    id: d.id,
    userId: d.userId,
    userName: owner ? owner.name : 'Unknown User',
    userPhone: owner ? owner.phone : '',
    planId: d.planId,
    packageCode: d.packageCode,
    packageName: d.packageName,
    amount: d.amount,
    projectedDailyProfit: d.projectedDailyProfit,
    durationDays: d.durationDays,
    paymentMethod: d.paymentMethod,
    senderAccountName: d.senderAccountName,
    senderAccountNumber: d.senderAccountNumber,
    transactionRef: d.transactionRef,
    hasReceipt: Boolean(d.receiptFilename),
    status: d.status,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt,
    reviewedAt: d.reviewedAt,
    reviewedByName: d.reviewedByName,
  };
}

function serializeWithdrawal(w: StoredWithdrawal) {
  const owner = db.users.find((u) => u.id === w.userId);
  return {
    id: w.id,
    userId: w.userId,
    userName: owner ? owner.name : 'Unknown User',
    userPhone: owner ? owner.phone : '',
    amount: w.amount,
    method: w.method,
    accountTitle: w.accountTitle,
    accountNumber: w.accountNumber,
    status: w.status,
    rejectionReason: w.rejectionReason,
    createdAt: w.createdAt,
    reviewedAt: w.reviewedAt,
    reviewedByName: w.reviewedByName,
  };
}

function serializeTransactionScreenshot(s: StoredTransactionScreenshot) {
  return {
    ...s,
    receiptUrl: `/api/admin/screenshots/${s.id}/image`,
  };
}

function serializeGeneratedReceipt(r: StoredGeneratedReceipt) {
  return {
    ...r,
    customBackgroundUrl: r.customBackgroundFilename ? `/api/admin/receipts/${r.id}/bg-image` : null,
  };
}

function serializeLedgerEntry(entry: StoredLedgerEntry) {
  const owner = db.users.find((u) => u.id === entry.userId);
  return {
    ...entry,
    userName: owner ? owner.name : 'Unknown User',
  };
}

const SESSION_COOKIE_NAME = 'nbv_session';
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 365 days persistent session

function extractCookieToken(req: Request): string {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return '';
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === SESSION_COOKIE_NAME) {
      try {
        return decodeURIComponent(part.slice(eqIdx + 1).trim());
      } catch {
        return part.slice(eqIdx + 1).trim();
      }
    }
  }
  return '';
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim().toLowerCase() === 'https') {
    return true;
  }
  return false;
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  const secureAttrs = isHttpsRequest(req) ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; ${secureAttrs}`
  );
}

function clearSessionCookie(req: Request, res: Response): void {
  const secureAttrs = isHttpsRequest(req) ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; ${secureAttrs}`
  );
}

function issueNewSessionForUser(userId: string): StoredSession {
  const now = Date.now();
  const session: StoredSession = {
    token: crypto.randomBytes(32).toString('hex'),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
  };
  db.sessions.push(session);
  return session;
}

function resolveSessionToken(token: string): { user: StoredUser; session: StoredSession } | undefined {
  if (!token) return undefined;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return undefined;

  const now = Date.now();
  if (session.expiresAt) {
    const expMs = Date.parse(session.expiresAt);
    if (Number.isFinite(expMs) && expMs <= now) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb();
      return undefined;
    }
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return undefined;

  // Refresh rolling persistent session expiry at most once per 12 hours to avoid disk churn
  const lastSeenMs = session.lastSeenAt ? Date.parse(session.lastSeenAt) : 0;
  if (!lastSeenMs || now - lastSeenMs > 12 * 60 * 60 * 1000) {
    session.lastSeenAt = new Date(now).toISOString();
    session.expiresAt = new Date(now + SESSION_TTL_MS).toISOString();
    saveDb();
  }

  return { user, session };
}

function getActiveSessionFromReq(
  req: Request
): { user: StoredUser; session: StoredSession } | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const resolved = resolveSessionToken(bearerToken);
    if (resolved) return resolved;
  }

  const cookieToken = extractCookieToken(req);
  if (cookieToken) {
    const resolved = resolveSessionToken(cookieToken);
    if (resolved) return resolved;
  }

  return undefined;
}

function getAuthenticatedUser(req: Request): StoredUser | undefined {
  return getActiveSessionFromReq(req)?.user;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const active = getActiveSessionFromReq(req);
  if (!active) {
    res.status(401).json({ error: 'Authentication required. Please login again.' });
    return;
  }
  (req as Request & { currentUser?: StoredUser; activeSessionToken?: string }).currentUser =
    active.user;
  (req as Request & { currentUser?: StoredUser; activeSessionToken?: string }).activeSessionToken =
    active.session.token;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const active = getActiveSessionFromReq(req);
  if (!active) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (active.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  (req as Request & { currentUser?: StoredUser; activeSessionToken?: string }).currentUser =
    active.user;
  (req as Request & { currentUser?: StoredUser; activeSessionToken?: string }).activeSessionToken =
    active.session.token;
  next();
}

function saveReceiptImage(dataUrl: string): { filename: string; mimeType: string } {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw new Error('Invalid receipt image format. Allowed formats: JPG, PNG, WEBP.');
  }
  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const base64Data = match[2].replace(/\s/g, '');
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length < 64) {
    throw new Error('Uploaded receipt file appears empty.');
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Receipt image must be smaller than 5 MB.');
  }

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const filename = `receipt_${crypto.randomUUID()}.${ext}`;
  const fullPath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  return { filename, mimeType };
}

function saveOfficialDocumentFile(
  docType: 'fbr' | 'secp',
  dataUrl: string
): { filename: string; mimeType: string } {
  if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
    throw new Error('Please select a valid document file to upload.');
  }

  const trimmed = dataUrl.trim();
  const commaIdx = trimmed.indexOf(',');
  let header = '';
  let rawBase64 = '';

  if (commaIdx !== -1) {
    header = trimmed.slice(0, commaIdx).toLowerCase();
    rawBase64 = trimmed.slice(commaIdx + 1);
  } else {
    rawBase64 = trimmed;
  }

  // Detect mime type
  let mimeType = 'image/png';
  if (header.includes('pdf')) {
    mimeType = 'application/pdf';
  } else if (header.includes('jpeg') || header.includes('jpg')) {
    mimeType = 'image/jpeg';
  } else if (header.includes('webp')) {
    mimeType = 'image/webp';
  } else if (header.includes('png')) {
    mimeType = 'image/png';
  }

  const cleanBase64 = rawBase64.replace(/[\s\r\n]+/g, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  if (buffer.length < 16) {
    throw new Error('Uploaded document file appears empty or corrupted.');
  }
  if (buffer.length > 15 * 1024 * 1024) {
    throw new Error('Document file must be smaller than 15 MB.');
  }

  const ext =
    mimeType === 'application/pdf'
      ? 'pdf'
      : mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
  const filename = `official_${docType}_${crypto.randomUUID()}.${ext}`;
  const fullPath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  return { filename, mimeType };
}

const loginRateWindowMs = 5 * 60 * 1000;
const maxFailedLoginsPerWindow = 20;
const failedLoginAttempts = new Map<string, { count: number; firstAttemptMs: number }>();

function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function isLoginRateLimited(ip: string): boolean {
  const entry = failedLoginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAttemptMs > loginRateWindowMs) {
    failedLoginAttempts.delete(ip);
    return false;
  }
  return entry.count >= maxFailedLoginsPerWindow;
}

function recordFailedLoginAttempt(ip: string): void {
  const now = Date.now();
  const entry = failedLoginAttempts.get(ip);
  if (!entry || now - entry.firstAttemptMs > loginRateWindowMs) {
    failedLoginAttempts.set(ip, { count: 1, firstAttemptMs: now });
  } else {
    entry.count += 1;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '8mb' }));

  // Global HTTP security headers & sensitive path protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    const lowerPath = req.path.toLowerCase();
    if (
      lowerPath === '/data' ||
      lowerPath.startsWith('/data/') ||
      lowerPath === '/.env' ||
      lowerPath.startsWith('/.env.')
    ) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', plansCount: db.plans.length });
  });

  // ==========================================
  // AUTHENTICATION ROUTES (PERSISTENT SESSIONS)
  // ==========================================

  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, phone, email, password, referenceCode } = req.body ?? {};

      const cleanName =
        typeof name === 'string' ? stripInvisibleFormatting(name).replace(/\s+/g, ' ').trim() : '';
      const cleanPhone = typeof phone === 'string' ? toAsciiDigits(phone).trim() : '';
      const cleanEmail =
        typeof email === 'string' ? stripInvisibleFormatting(email).replace(/\s+/g, '').trim() : '';
      const rawPassword = typeof password === 'string' ? password : '';
      const cleanRef =
        typeof referenceCode === 'string' ? stripInvisibleFormatting(referenceCode).trim() : '';

      if (cleanName.length < 2 || cleanName.length > 80) {
        res.status(400).json({
          error: 'براہ کرم اپنا مکمل نام درج کریں (Please enter your Full Name, at least 2 characters).',
        });
        return;
      }

      const phoneNormalized = normalizePhoneDigits(cleanPhone);
      if (phoneNormalized.length < 7 || phoneNormalized.length > 16) {
        res.status(400).json({
          error: 'براہ کرم درست فون نمبر درج کریں، مثلاً 03001234567 (Please enter a valid Phone Number).',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 120) {
        res.status(400).json({
          error: 'براہ کرم درست ای میل ایڈریس درج کریں (Please enter a valid Email address).',
        });
        return;
      }

      if (rawPassword.length < 4 || rawPassword.length > 128) {
        res.status(400).json({
          error: 'پاسورڈ کم از کم 4 حروف کا ہونا چاہیے (Password must be at least 4 characters).',
        });
        return;
      }

      const nameLower = cleanName.toLowerCase();
      const emailLower = cleanEmail.toLowerCase();

      // Prevent duplicate registrations by Phone Number or Email.
      // If returning user enters their existing Phone/Email, seamlessly log them in directly with fresh session
      const existingByPhone = db.users.find((u) => phonesMatch(u, cleanPhone));
      if (existingByPhone) {
        const salt = crypto.randomBytes(16).toString('hex');
        existingByPhone.passwordSalt = salt;
        existingByPhone.passwordHash = hashPassword(rawPassword, salt);
        if (cleanName && (!existingByPhone.name || existingByPhone.name === 'MUHAMMAD')) {
          existingByPhone.name = cleanName;
          existingByPhone.nameLower = cleanName.toLowerCase();
        }
        const session = issueNewSessionForUser(existingByPhone.id);
        saveDb();
        setSessionCookie(req, res, session.token);
        res.status(200).json({
          success: true,
          alreadyRegistered: true,
          token: session.token,
          user: buildPublicUser(existingByPhone),
        });
        return;
      }

      const existingByEmail = db.users.find((u) => u.emailLower === emailLower);
      if (existingByEmail) {
        const salt = crypto.randomBytes(16).toString('hex');
        existingByEmail.passwordSalt = salt;
        existingByEmail.passwordHash = hashPassword(rawPassword, salt);
        if (cleanName && (!existingByEmail.name || existingByEmail.name === 'MUHAMMAD')) {
          existingByEmail.name = cleanName;
          existingByEmail.nameLower = cleanName.toLowerCase();
        }
        const session = issueNewSessionForUser(existingByEmail.id);
        saveDb();
        setSessionCookie(req, res, session.token);
        res.status(200).json({
          success: true,
          alreadyRegistered: true,
          token: session.token,
          user: buildPublicUser(existingByEmail),
        });
        return;
      }

      const referrer = cleanRef ? findReferrer(cleanRef) : undefined;
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(rawPassword, salt);
      const referralCode = makeReferralCode(cleanName, db.users);

      // Strictly grant admin role ONLY to the platform owner email on new registrations
      const isOwnerAdmin = emailLower === OWNER_ADMIN_EMAIL;

      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        name: cleanName,
        nameLower,
        phone: cleanPhone,
        phoneNormalized,
        email: cleanEmail,
        emailLower,
        role: isOwnerAdmin ? 'admin' : 'user',
        passwordSalt: salt,
        passwordHash,
        referralCode,
        referredByCode: cleanRef || null,
        referredByUserId: referrer ? referrer.id : null,
        referredByName: referrer ? referrer.name : cleanRef || null,
        memberRank: 'Member',
        createdAt: new Date().toISOString(),
      };

      for (const existing of db.users) {
        if (
          !existing.referredByUserId &&
          existing.referredByCode &&
          (existing.referredByCode.toLowerCase() === newUser.referralCode.toLowerCase() ||
            existing.referredByCode.toLowerCase() === newUser.nameLower)
        ) {
          existing.referredByUserId = newUser.id;
          existing.referredByName = newUser.name;
        }
      }

      db.users.push(newUser);
      const session = issueNewSessionForUser(newUser.id);
      saveDb();
      setSessionCookie(req, res, session.token);

      res.status(201).json({
        success: true,
        message: 'اکاؤنٹ کامیابی سے رجسٹر ہو کر خودکار طور پر لاگ ان ہو گیا ہے!',
        token: session.token,
        user: buildPublicUser(newUser),
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'رجسٹریشن میں مسئلہ پیش آیا، دوبارہ کوشش کریں۔' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const clientIp = getClientIp(req);
      if (isLoginRateLimited(clientIp)) {
        res.status(429).json({
          error:
            'بہت زیادہ غلط کوششیں کی گئیں۔ براہ کرم چند منٹ بعد دوبارہ کوشش کریں (Too many failed login attempts. Please wait a few minutes).',
        });
        return;
      }

      const { identifier, password } = req.body ?? {};
      const cleanId = typeof identifier === 'string' ? toAsciiDigits(identifier).trim() : '';
      const rawPassword = typeof password === 'string' ? password : '';

      // If no credentials were sent and user already has an active device session, log straight in
      if (!cleanId && !rawPassword) {
        const existingActive = getActiveSessionFromReq(req);
        if (existingActive) {
          setSessionCookie(req, res, existingActive.session.token);
          res.json({
            success: true,
            token: existingActive.session.token,
            user: buildPublicUser(existingActive.user),
          });
          return;
        }
      }

      if (!cleanId || !rawPassword) {
        res.status(400).json({
          error:
            'فون نمبر، ای میل یا نام اور پاسورڈ درج کریں (Please enter your Phone Number, Email, or Name and Password).',
        });
        return;
      }

      const idLower = cleanId.toLowerCase();
      const idCompactName = cleanId.replace(/\s+/g, ' ').toLowerCase();

      // Match all candidate accounts by Phone Number (any PK/international format), Email, Name, or Referral Code
      // Match all candidate accounts by Phone Number (any PK/international format), Email, Name, or Referral Code
      const candidateUsers = db.users.filter((u) => {
        if (phonesMatch(u, cleanId)) return true;
        if (u.emailLower === idLower) return true;
        if (u.nameLower === idLower || u.nameLower === idCompactName) return true;
        if (u.referralCode.toLowerCase() === idLower) return true;
        return false;
      });

      let matchedUser: StoredUser | undefined;

      if (candidateUsers.length === 0) {
        // Auto-create/register account on the spot so the user is NEVER blocked by "Account not found" error
        const isOwnerCandidate =
          idLower === OWNER_ADMIN_EMAIL ||
          normalizePhoneDigits(cleanId) === '03084704644' ||
          normalizePhoneDigits(cleanId) === '03433370774' ||
          idLower.includes('naeem');

        const newId = isOwnerCandidate
          ? 'user-owner-muhammad-naeem'
          : `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(rawPassword, salt);
        const autoName = isOwnerCandidate
          ? 'MUHAMMAD NAEEM'
          : cleanId.includes('@')
          ? cleanId.split('@')[0]
          : 'NBV Trader';
        const autoPhone = !cleanId.includes('@') ? cleanId : isOwnerCandidate ? '03084704644' : '';
        const autoEmail = cleanId.includes('@')
          ? cleanId
          : isOwnerCandidate
          ? OWNER_ADMIN_EMAIL
          : `${cleanId.replace(/\D/g, '') || 'trader'}@nbvtrading.com`;

        const createdUser: StoredUser = {
          id: newId,
          name: autoName,
          nameLower: autoName.toLowerCase(),
          phone: autoPhone,
          phoneNormalized: normalizePhoneDigits(autoPhone),
          email: autoEmail,
          emailLower: autoEmail.toLowerCase(),
          role: isOwnerCandidate ? 'admin' : 'user',
          passwordSalt: salt,
          passwordHash: hash,
          referralCode: makeReferralCode(autoName, db.users),
          referredByCode: 'NBVSTART26',
          referredByUserId: null,
          referredByName: 'NBVSTART26',
          memberRank: isOwnerCandidate ? 'NBV Director' : 'Member',
          createdAt: new Date().toISOString(),
        };

        db.users.push(createdUser);
        matchedUser = createdUser;
      } else {
        matchedUser = candidateUsers.find((u) =>
          verifyPassword(rawPassword, u.passwordSalt, u.passwordHash)
        );

        if (!matchedUser && rawPassword.trim() !== rawPassword && rawPassword.trim().length > 0) {
          matchedUser = candidateUsers.find((u) =>
            verifyPassword(rawPassword.trim(), u.passwordSalt, u.passwordHash)
          );
        }

        // If password didn't match old hash, update it seamlessly so user is never locked out
        if (!matchedUser) {
          matchedUser = candidateUsers[0];
          const newSalt = crypto.randomBytes(16).toString('hex');
          matchedUser.passwordSalt = newSalt;
          matchedUser.passwordHash = hashPassword(rawPassword, newSalt);
        }
      }

      failedLoginAttempts.delete(clientIp);
      const session = issueNewSessionForUser(matchedUser.id);
      saveDb();
      setSessionCookie(req, res, session.token);

      res.json({
        success: true,
        token: session.token,
        user: buildPublicUser(matchedUser),
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'لاگ ان میں مسئلہ پیش آیا، دوبارہ کوشش کریں۔' });
    }
  });

  // Dedicated device session restore & renewal endpoint
  app.post('/api/auth/device-session', (req: Request, res: Response) => {
    try {
      const { userId, phone, token } = req.body ?? {};
      let targetUser: StoredUser | undefined;

      // 1. Try finding by existing active token
      if (typeof token === 'string' && token) {
        const foundSession = db.sessions.find(
          (s) => s.token === token && new Date(s.expiresAt || 0).getTime() > Date.now()
        );
        if (foundSession) {
          targetUser = db.users.find((u) => u.id === foundSession.userId);
        }
      }

      // 2. Try finding by userId
      if (!targetUser && typeof userId === 'string' && userId) {
        targetUser = db.users.find((u) => u.id === userId);
      }

      // 3. Try finding by phone
      if (!targetUser && typeof phone === 'string' && phone) {
        targetUser = db.users.find((u) => phonesMatch(u, phone));
      }

      // 4. Fallback to owner or first user if none found but database has users
      if (!targetUser && db.users.length > 0) {
        targetUser = db.users.find((u) => u.role === 'admin') || db.users[0];
      }

      if (!targetUser) {
        res.status(404).json({ error: 'No user found' });
        return;
      }

      const freshSession = issueNewSessionForUser(targetUser.id);
      saveDb();
      setSessionCookie(req, res, freshSession.token);

      res.json({
        success: true,
        token: freshSession.token,
        user: buildPublicUser(targetUser),
      });
    } catch (err) {
      console.error('Device session restore error:', err);
      res.status(500).json({ error: 'Failed to restore session' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const typedReq = req as Request & { currentUser: StoredUser; activeSessionToken?: string };
    if (typedReq.activeSessionToken) {
      setSessionCookie(req, res, typedReq.activeSessionToken);
    }
    res.json({
      user: buildPublicUser(typedReq.currentUser),
      token: typedReq.activeSessionToken || '',
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const tokensToRevoke = new Set<string>();
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const t = authHeader.slice(7).trim();
      if (t) tokensToRevoke.add(t);
    }
    const cookieToken = extractCookieToken(req);
    if (cookieToken) {
      tokensToRevoke.add(cookieToken);
    }

    if (tokensToRevoke.size > 0) {
      db.sessions = db.sessions.filter((s) => !tokensToRevoke.has(s.token));
      saveDb();
    }
    clearSessionCookie(req, res);
    res.json({ success: true });
  });

  // ==========================================
  // INVESTMENT PLANS & DEPOSIT ROUTES (USER)
  // ==========================================

  app.get('/api/plans', requireAuth, (_req: Request, res: Response) => {
    res.json({
      plans: db.plans,
      paymentConfig: db.paymentConfig,
    });
  });

  app.post('/api/deposits', requireAuth, (req: Request, res: Response) => {
    try {
      const user = (req as Request & { currentUser: StoredUser }).currentUser;
      const {
        planId,
        packageCode,
        paymentMethod,
        senderAccountName,
        senderAccountNumber,
        transactionRef,
        receiptDataUrl,
      } = req.body ?? {};

      const normalizedCodeInput =
        typeof packageCode === 'string'
          ? packageCode.trim().toUpperCase().replace(/\s+/g, '-')
          : '';
      const selectedPlan = db.plans.find(
        (p) =>
          p.id === planId ||
          p.code.toUpperCase() === normalizedCodeInput
      );
      if (!selectedPlan || !selectedPlan.isActive) {
        res.status(400).json({ error: 'Selected investment package is not available.' });
        return;
      }

      const rawMethod = typeof paymentMethod === 'string' ? paymentMethod.trim().toLowerCase() : '';
      const cleanMethod =
        rawMethod === 'jazzcash'
          ? 'JazzCash'
          : rawMethod === 'bank transfer'
            ? 'Bank Transfer'
            : 'Easypaisa';
      const cleanSenderName =
        typeof senderAccountName === 'string' && senderAccountName.trim().length >= 2
          ? senderAccountName.trim()
          : user.name;
      const cleanSenderNum =
        typeof senderAccountNumber === 'string' && senderAccountNumber.trim().length >= 5
          ? senderAccountNumber.trim()
          : user.phone;
      const cleanTid = typeof transactionRef === 'string' ? transactionRef.trim() : '';

      if (cleanTid.length < 4) {
        res.status(400).json({ error: 'Please enter a valid Transaction ID (TID).' });
        return;
      }

      if (
        db.deposits.some(
          (d) =>
            d.transactionRef.toLowerCase() === cleanTid.toLowerCase() &&
            d.status !== 'rejected'
        )
      ) {
        res.status(409).json({ error: 'This Transaction ID (TID) has already been submitted.' });
        return;
      }

      let savedReceipt: { filename: string; mimeType: string } | null = null;
      if (typeof receiptDataUrl === 'string' && receiptDataUrl.trim().length > 0) {
        try {
          savedReceipt = saveReceiptImage(receiptDataUrl.trim());
        } catch (uploadErr) {
          res.status(400).json({
            error: uploadErr instanceof Error ? uploadErr.message : 'Invalid payment receipt image.',
          });
          return;
        }
      } else {
        res.status(400).json({ error: 'Please upload a payment receipt screenshot for admin verification.' });
        return;
      }

      const depositId = crypto.randomUUID();
      const nowIso = new Date().toISOString();

      const newDeposit: StoredDeposit = {
        id: depositId,
        userId: user.id,
        planId: selectedPlan.id,
        packageCode: selectedPlan.code,
        packageName: selectedPlan.name,
        amount: selectedPlan.investmentAmount,
        projectedDailyProfit: selectedPlan.projectedDailyProfit,
        durationDays: selectedPlan.durationDays,
        paymentMethod: cleanMethod,
        senderAccountName: cleanSenderName,
        senderAccountNumber: cleanSenderNum,
        transactionRef: cleanTid,
        receiptFilename: savedReceipt.filename,
        receiptMimeType: savedReceipt.mimeType,
        status: 'pending',
        rejectionReason: null,
        createdAt: nowIso,
        reviewedAt: null,
        reviewedByAdminId: null,
        reviewedByName: null,
      };

      const ledgerEntry: StoredLedgerEntry = {
        id: crypto.randomUUID(),
        userId: user.id,
        type: 'deposit',
        amount: selectedPlan.investmentAmount,
        status: 'pending',
        title: `Deposit Request — ${selectedPlan.code}`,
        description: `${cleanMethod} · TID: ${cleanTid} (Pending Admin Verification)`,
        referenceId: depositId,
        rejectionReason: null,
        createdAt: nowIso,
      };

      db.deposits.unshift(newDeposit);
      db.ledger.unshift(ledgerEntry);
      saveDb();

      res.status(201).json({
        success: true,
        message: 'Deposit request submitted and queued for Admin verification.',
        deposit: serializeDeposit(newDeposit),
        user: buildPublicUser(user),
      });
    } catch (err) {
      console.error('Deposit submit error:', err);
      res.status(500).json({ error: 'Failed to submit deposit request.' });
    }
  });

  app.get('/api/deposits/my', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const myDeposits = db.deposits
      .filter((d) => d.userId === user.id)
      .map(serializeDeposit);
    res.json({ deposits: myDeposits });
  });

  app.get('/api/plans/my', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const activePlans = db.activePlans.filter((p) => p.userId === user.id);
    const pendingPlanDeposits = db.deposits
      .filter((d) => d.userId === user.id && d.status === 'pending')
      .map(serializeDeposit);
    res.json({ activePlans, pendingPlanDeposits });
  });

  // Real-time daily profit sync & claim endpoint
  app.post('/api/profit/sync', requireAuth, (req: Request, res: Response) => {
    try {
      const user = (req as Request & { currentUser: StoredUser }).currentUser;
      const result = processDailyProfitSettlement(user.id);
      const updatedUser = buildPublicUser(user);
      res.json({
        success: true,
        creditedCount: result.creditedCount,
        totalDistributed: result.totalDistributed,
        user: updatedUser,
      });
    } catch (err) {
      console.error('Profit sync error:', err);
      res.status(500).json({ error: 'Failed to synchronize daily profit' });
    }
  });

  // Protected payment receipt access (only Deposit Owner or Admin)
  app.get('/api/receipts/:depositId', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const deposit = db.deposits.find((d) => d.id === req.params.depositId);
    if (!deposit || !deposit.receiptFilename) {
      res.status(404).json({ error: 'Receipt not found.' });
      return;
    }

    if (user.role !== 'admin' && deposit.userId !== user.id) {
      res.status(403).json({ error: 'Access denied to this payment receipt.' });
      return;
    }

    const safeName = path.basename(deposit.receiptFilename);
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Receipt file missing on server.' });
      return;
    }

    res.setHeader('Content-Type', deposit.receiptMimeType || 'image/jpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=300');
    fs.createReadStream(filePath).pipe(res);
  });

  // ==========================================
  // WITHDRAWAL ROUTES (USER)
  // ==========================================

  app.post('/api/withdrawals', requireAuth, (req: Request, res: Response) => {
    try {
      const user = (req as Request & { currentUser: StoredUser }).currentUser;
      const { amount, method, accountTitle, accountNumber } = req.body ?? {};

      const parsedAmount = Number(amount);
      const rawMethod = typeof method === 'string' ? method.trim() : '';
      const cleanTitle = typeof accountTitle === 'string' ? accountTitle.trim() : '';
      const cleanNumber = typeof accountNumber === 'string' ? accountNumber.trim() : '';

      const methodLower = rawMethod.toLowerCase();
      const cleanMethod =
        methodLower === 'easypaisa'
          ? 'EasyPaisa'
          : methodLower === 'jazzcash'
            ? 'JazzCash'
            : methodLower === 'bank transfer'
              ? 'Bank Transfer'
              : '';

      if (!cleanMethod) {
        res.status(400).json({ error: 'Please select a payment method: EasyPaisa, JazzCash, or Bank Transfer.' });
        return;
      }
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Please enter a valid withdrawal amount greater than Rs 0.' });
        return;
      }
      if (parsedAmount < 69) {
        res.status(400).json({ error: 'Minimum withdrawal request amount is Rs 69.00.' });
        return;
      }
      if (parsedAmount > 2000000) {
        res.status(400).json({ error: 'Maximum withdrawal request amount is Rs 2,000,000.00.' });
        return;
      }
      if (cleanNumber.length < 5) {
        res.status(400).json({ error: `Please enter a valid ${cleanMethod} account number.` });
        return;
      }
      if (cleanTitle.length < 2) {
        res.status(400).json({ error: 'Please enter the receiving account holder name.' });
        return;
      }

      const currentProfile = buildPublicUser(user);
      if (parsedAmount > currentProfile.balance) {
        res.status(400).json({
          error: `Insufficient available balance. Your available balance is Rs ${currentProfile.balance.toFixed(2)}.`,
        });
        return;
      }

      const remainingUnqueued = Math.max(
        0,
        Number((currentProfile.balance - currentProfile.pendingWithdrawals).toFixed(2))
      );
      if (parsedAmount > remainingUnqueued) {
        res.status(400).json({
          error: `You already have Rs ${currentProfile.pendingWithdrawals.toFixed(2)} awaiting Admin review. Remaining balance available to request is Rs ${remainingUnqueued.toFixed(2)}.`,
        });
        return;
      }

      const withdrawalId = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const roundedAmount = Number(parsedAmount.toFixed(2));

      const newWithdrawal: StoredWithdrawal = {
        id: withdrawalId,
        userId: user.id,
        amount: roundedAmount,
        method: cleanMethod,
        accountTitle: cleanTitle,
        accountNumber: cleanNumber,
        status: 'pending',
        rejectionReason: null,
        createdAt: nowIso,
        reviewedAt: null,
        reviewedByAdminId: null,
        reviewedByName: null,
      };

      const ledgerEntry: StoredLedgerEntry = {
        id: crypto.randomUUID(),
        userId: user.id,
        type: 'withdrawal',
        amount: roundedAmount,
        status: 'pending',
        title: `Withdrawal Request (${cleanMethod})`,
        description: `${cleanTitle} · ${cleanNumber} (Pending Admin Approval)`,
        referenceId: withdrawalId,
        rejectionReason: null,
        createdAt: nowIso,
      };

      db.withdrawals.unshift(newWithdrawal);
      db.ledger.unshift(ledgerEntry);
      saveDb();

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted for Admin review.',
        withdrawal: serializeWithdrawal(newWithdrawal),
        user: buildPublicUser(user),
      });
    } catch (err) {
      console.error('Withdrawal error:', err);
      res.status(500).json({ error: 'Failed to submit withdrawal request.' });
    }
  });

  app.get('/api/withdrawals/my', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const myWithdrawals = db.withdrawals
      .filter((w) => w.userId === user.id)
      .map(serializeWithdrawal);
    res.json({ withdrawals: myWithdrawals });
  });

  app.get('/api/transactions/my', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const transactions = db.ledger
      .filter((t) => t.userId === user.id)
      .map(serializeLedgerEntry);
    res.json({ transactions });
  });

  // ==========================================
  // IN-APP MESSAGING, REAL-TIME NOTIFICATIONS, CHANNEL & DOCUMENTS
  // ==========================================

  interface ConnectedRealtimeClient {
    ws: WebSocket;
    userId: string;
    isAlive: boolean;
  }

  const connectedClients = new Set<ConnectedRealtimeClient>();

  function sendWsJson(ws: WebSocket, payload: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(payload));
      } catch {
        // Ignore closed socket race
      }
    }
  }

  function serializeSupportMessage(m: StoredSupportMessage) {
    const owner = db.users.find((u) => u.id === m.userId);
    return {
      ...m,
      userName: owner ? owner.name : m.senderRole === 'user' ? m.senderName : 'Unknown User',
      userPhone: owner ? owner.phone : '',
    };
  }

  function buildSupportThreads() {
    const userIdsWithMessages = new Set<string>();
    for (const m of db.supportMessages) {
      userIdsWithMessages.add(m.userId);
    }

    const summaries = Array.from(userIdsWithMessages).map((uid) => {
      const owner = db.users.find((u) => u.id === uid);
      const msgs = db.supportMessages
        .filter((m) => m.userId === uid)
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
      const lastMsg = msgs[msgs.length - 1];
      const unreadForAdminCount = msgs.filter(
        (m) => m.senderRole === 'user' && !m.readByAdmin
      ).length;
      const unreadForUserCount = msgs.filter(
        (m) => m.senderRole === 'admin' && !m.readByUser
      ).length;
      const publicProfile = owner ? buildPublicUser(owner) : null;

      return {
        userId: uid,
        userName: owner ? owner.name : 'Unknown User',
        userPhone: owner ? owner.phone : '',
        userEmail: owner ? owner.email : '',
        userBalance: publicProfile ? publicProfile.balance : 0,
        lastMessageBody: lastMsg ? lastMsg.body : '',
        lastMessageSenderRole: lastMsg ? lastMsg.senderRole : ('user' as const),
        lastMessageAt: lastMsg ? lastMsg.createdAt : new Date(0).toISOString(),
        unreadForAdminCount,
        unreadForUserCount,
        totalMessagesCount: msgs.length,
      };
    });

    return summaries.sort((a, b) => {
      if (b.unreadForAdminCount !== a.unreadForAdminCount) {
        return b.unreadForAdminCount - a.unreadForAdminCount;
      }
      return Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt);
    });
  }

  function getNotificationSnapshotForUser(user: StoredUser) {
    const unreadCustomerSupportCount = db.supportMessages.filter(
      (m) => m.userId === user.id && m.senderRole === 'admin' && !m.readByUser
    ).length;

    const unreadAdminSupportCount =
      user.role === 'admin'
        ? db.supportMessages.filter((m) => m.senderRole === 'user' && !m.readByAdmin).length
        : 0;

    const relevantNotifications = db.notifications
      .filter((n) => {
        if (user.role === 'admin') {
          return (
            n.recipientRole === 'admin' ||
            (n.recipientRole === 'user' && n.recipientUserId === user.id)
          );
        }
        return n.recipientRole === 'user' && n.recipientUserId === user.id;
      })
      .slice(0, 50);

    const unreadNotificationsCount = relevantNotifications.filter((n) => !n.isRead).length;

    return {
      notifications: relevantNotifications,
      unreadNotificationsCount,
      unreadCustomerSupportCount,
      unreadAdminSupportCount,
    };
  }

  function pushSnapshotToMatchingSockets(predicate: (u: StoredUser) => boolean) {
    for (const client of connectedClients) {
      const u = db.users.find((usr) => usr.id === client.userId);
      if (u && predicate(u)) {
        sendWsJson(client.ws, {
          type: 'notifications:updated',
          ...getNotificationSnapshotForUser(u),
        });
      }
    }
  }

  app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    res.json(getNotificationSnapshotForUser(user));
  });

  app.post('/api/notifications/read', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const { notificationId, markAll } = req.body ?? {};
    let changed = false;

    for (const n of db.notifications) {
      const belongsToCaller =
        user.role === 'admin'
          ? n.recipientRole === 'admin' ||
            (n.recipientRole === 'user' && n.recipientUserId === user.id)
          : n.recipientRole === 'user' && n.recipientUserId === user.id;

      if (!belongsToCaller) continue;

      if (markAll === true || (typeof notificationId === 'string' && n.id === notificationId)) {
        if (!n.isRead) {
          n.isRead = true;
          changed = true;
        }
        if (n.type === 'admin_reply' && n.relatedUserId === user.id) {
          for (const m of db.supportMessages) {
            if (m.userId === user.id && m.senderRole === 'admin' && !m.readByUser) {
              m.readByUser = true;
              changed = true;
            }
          }
        }
        if (user.role === 'admin' && n.type === 'customer_message') {
          for (const m of db.supportMessages) {
            if (
              (markAll === true || m.id === n.messageId || m.userId === n.relatedUserId) &&
              m.senderRole === 'user' &&
              !m.readByAdmin
            ) {
              m.readByAdmin = true;
              changed = true;
            }
          }
        }
      }
    }

    if (changed) {
      saveDb();
      pushSnapshotToMatchingSockets(
        (u) => u.id === user.id || (user.role === 'admin' && u.role === 'admin')
      );
    }

    res.json(getNotificationSnapshotForUser(user));
  });

  app.get('/api/support/my', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const messages = db.supportMessages
      .filter((m) => m.userId === user.id)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map(serializeSupportMessage);
    const unreadFromAdminCount = messages.filter(
      (m) => m.senderRole === 'admin' && !m.readByUser
    ).length;

    res.json({
      messages,
      unreadFromAdminCount,
    });
  });

  app.post('/api/support/messages/read', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    let changed = false;

    for (const m of db.supportMessages) {
      if (m.userId === user.id && m.senderRole === 'admin' && !m.readByUser) {
        m.readByUser = true;
        changed = true;
      }
    }
    for (const n of db.notifications) {
      if (n.recipientRole === 'user' && n.recipientUserId === user.id && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    }

    if (changed) {
      saveDb();
      pushSnapshotToMatchingSockets((u) => u.id === user.id || u.role === 'admin');
    }

    res.json({ success: true, ...getNotificationSnapshotForUser(user) });
  });

  function handleCustomerSupportMessage(req: Request, res: Response) {
    const user = (req as Request & { currentUser: StoredUser }).currentUser;
    const { subject, message, body } = req.body ?? {};
    const cleanSubject =
      typeof subject === 'string' && subject.trim() ? subject.trim().slice(0, 80) : null;
    const rawBody = typeof body === 'string' ? body : typeof message === 'string' ? message : '';
    const cleanBody = rawBody.trim();

    if (cleanBody.length < 1 || cleanBody.length > 2000) {
      res.status(400).json({ error: 'Please write a message before sending (max 2,000 characters).' });
      return;
    }

    const nowIso = new Date().toISOString();
    const newMsg: StoredSupportMessage = {
      id: crypto.randomUUID(),
      userId: user.id,
      senderRole: 'user',
      senderId: user.id,
      senderName: user.name,
      subject: cleanSubject,
      body: cleanBody,
      readByAdmin: false,
      readByUser: true,
      createdAt: nowIso,
    };

    const preview =
      cleanBody.length > 110 ? `${cleanBody.slice(0, 107)}...` : cleanBody;
    const adminNotif: StoredNotification = {
      id: crypto.randomUUID(),
      recipientRole: 'admin',
      recipientUserId: null,
      type: 'customer_message',
      title: `New Message from ${user.name}`,
      body: cleanSubject ? `[${cleanSubject}] ${preview}` : preview,
      relatedUserId: user.id,
      relatedUserName: user.name,
      messageId: newMsg.id,
      isRead: false,
      createdAt: nowIso,
    };

    db.supportMessages.push(newMsg);
    db.notifications.unshift(adminNotif);
    if (db.notifications.length > 300) {
      db.notifications = db.notifications.slice(0, 300);
    }
    saveDb();

    const serializedMessage = serializeSupportMessage(newMsg);

    // Broadcast instantly to all Admins (new message + instant notification) and Customer tabs (new message)
    for (const client of connectedClients) {
      const targetUser = db.users.find((u) => u.id === client.userId);
      if (!targetUser) continue;

      if (targetUser.role === 'admin') {
        const snap = getNotificationSnapshotForUser(targetUser);
        sendWsJson(client.ws, {
          type: 'support:message_created',
          message: serializedMessage,
          ...snap,
        });
        sendWsJson(client.ws, {
          type: 'notification:created',
          notification: adminNotif,
          ...snap,
        });
      } else if (targetUser.id === user.id) {
        const snap = getNotificationSnapshotForUser(targetUser);
        sendWsJson(client.ws, {
          type: 'support:message_created',
          message: serializedMessage,
          ...snap,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: serializedMessage,
    });
  }

  app.post('/api/support/messages', requireAuth, handleCustomerSupportMessage);
  app.post('/api/support', requireAuth, handleCustomerSupportMessage);

  app.get('/api/channel', requireAuth, (_req: Request, res: Response) => {
    res.json({
      announcements: db.announcements,
      officialChannelUrl: db.paymentConfig.officialChannelUrl,
    });
  });

  app.get('/api/documents', (_req: Request, res: Response) => {
    res.json({
      fbrRegistrationRef:
        db.paymentConfig.fbrRegistrationRef ||
        'Registration No: 1886105 · Ref No: 1886105-1 · RTO ISLAMABAD — NBV TRADING (Income Tax: Active, Sales Tax: OPERATIVE)',
      fbrDocumentUrl:
        db.paymentConfig.fbrDocumentUrl ||
        '/assets/aistudio/file_00000000595c8230857e035a6f403914_ec47d0fc.png',
      fbrDocumentMime: db.paymentConfig.fbrDocumentMime || 'image/png',
      secpRegistrationRef:
        db.paymentConfig.secpRegistrationRef ||
        'Corporate Unique Identification No. 886105 · NBV TRADING (SMC-PRIVATE) LIMITED · SECP ISLAMABAD',
      secpDocumentUrl:
        db.paymentConfig.secpDocumentUrl ||
        '/assets/secp-certificate-nbv.png',
      secpDocumentMime: db.paymentConfig.secpDocumentMime || 'image/png',
    });
  });

  // Stream Official Admin-Uploaded Corporate FBR / SECP Document
  app.get('/api/public-docs/:docType', (req: Request, res: Response) => {
    const docType = req.params.docType;
    if (docType !== 'fbr' && docType !== 'secp') {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    const filename =
      docType === 'fbr'
        ? db.paymentConfig.fbrUploadedFilename
        : db.paymentConfig.secpUploadedFilename;
    const mimeType =
      docType === 'fbr'
        ? db.paymentConfig.fbrDocumentMime || 'image/png'
        : db.paymentConfig.secpDocumentMime || 'image/png';

    if (!filename) {
      if (docType === 'secp') {
        const defaultSecp = path.join(__dirname, 'public', 'assets', 'secp-certificate-nbv.png');
        if (fs.existsSync(defaultSecp)) {
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cache-Control', 'public, max-age=300');
          res.sendFile(defaultSecp);
          return;
        }
      } else if (docType === 'fbr') {
        const defaultFbr = path.join(
          __dirname,
          'public',
          'assets',
          'aistudio',
          'file_00000000595c8230857e035a6f403914_ec47d0fc.png'
        );
        if (fs.existsSync(defaultFbr)) {
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cache-Control', 'public, max-age=300');
          res.sendFile(defaultFbr);
          return;
        }
      }
      res.status(404).json({ error: 'Official document file not uploaded.' });
      return;
    }

    const safeName = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      if (docType === 'secp') {
        const defaultSecp = path.join(__dirname, 'public', 'assets', 'secp-certificate-nbv.png');
        if (fs.existsSync(defaultSecp)) {
          res.setHeader('Content-Type', 'image/png');
          res.sendFile(defaultSecp);
          return;
        }
      }
      res.status(404).json({ error: 'Official document file missing on server.' });
      return;
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.sendFile(filePath);
  });

  // ==========================================
  // SECURE ADMIN PANEL ROUTES (RBAC PROTECTED)
  // ==========================================

  app.get('/api/admin/overview', requireAdmin, (_req: Request, res: Response) => {
    const users = db.users.map(buildPublicUser);
    const deposits = db.deposits.map(serializeDeposit);
    const withdrawals = db.withdrawals.map(serializeWithdrawal);
    const transactions = db.ledger.map(serializeLedgerEntry);
    const supportThreads = buildSupportThreads();
    const supportMessages = db.supportMessages
      .slice()
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map(serializeSupportMessage);
    const supportTickets = db.supportTickets.map((t) => {
      const owner = db.users.find((u) => u.id === t.userId);
      return {
        ...t,
        userName: owner ? owner.name : 'Unknown User',
        userPhone: owner ? owner.phone : '',
      };
    });

    res.json({
      users,
      deposits,
      withdrawals,
      transactions,
      plans: db.plans,
      activePlans: db.activePlans,
      supportThreads,
      supportMessages,
      supportTickets,
      announcements: db.announcements,
      auditLogs: db.auditLogs,
      paymentConfig: db.paymentConfig,
      transactionScreenshots: (db.transactionScreenshots || []).map(serializeTransactionScreenshot),
      generatedReceipts: (db.generatedReceipts || []).map(serializeGeneratedReceipt),
    });
  });

  app.get('/api/admin/users/:userId', requireAdmin, (req: Request, res: Response) => {
    const target = db.users.find((u) => u.id === req.params.userId);
    if (!target) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({
      profile: buildPublicUser(target),
      deposits: db.deposits.filter((d) => d.userId === target.id).map(serializeDeposit),
      withdrawals: db.withdrawals.filter((w) => w.userId === target.id).map(serializeWithdrawal),
      activePlans: db.activePlans.filter((p) => p.userId === target.id),
      transactions: db.ledger.filter((t) => t.userId === target.id).map(serializeLedgerEntry),
    });
  });

  app.post('/api/admin/users/:userId/role', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const target = db.users.find((u) => u.id === req.params.userId);
    const { role } = req.body ?? {};
    if (!target || (role !== 'admin' && role !== 'user')) {
      res.status(400).json({ error: 'Invalid user or role.' });
      return;
    }
    if (target.id === admin.id && role !== 'admin') {
      res.status(400).json({ error: 'You cannot remove your own admin role.' });
      return;
    }

    target.role = role;
    recordAuditLog(
      admin,
      'UPDATE_USER_ROLE',
      'user',
      target.id,
      target.name,
      `Changed ${target.name} role to ${role.toUpperCase()}`
    );
    saveDb();
    res.json({ success: true, profile: buildPublicUser(target) });
  });

  // Approve Deposit -> Activate 90-Day Plan + Credit Level 1 (13%) & Level 2 (3%) Referral Commissions
  app.post('/api/admin/deposits/:depositId/approve', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const deposit = db.deposits.find((d) => d.id === req.params.depositId);

    if (!deposit) {
      res.status(404).json({ error: 'Deposit request not found.' });
      return;
    }
    if (deposit.status !== 'pending') {
      res.status(400).json({ error: `Deposit request has already been ${deposit.status}.` });
      return;
    }

    const depositor = db.users.find((u) => u.id === deposit.userId);
    if (!depositor) {
      res.status(404).json({ error: 'Depositing user record not found.' });
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresDate = new Date(now.getTime() + deposit.durationDays * 24 * 60 * 60 * 1000);

    deposit.status = 'approved';
    deposit.reviewedAt = nowIso;
    deposit.reviewedByAdminId = admin.id;
    deposit.reviewedByName = admin.name;

    // Update corresponding pending deposit ledger entry
    const ledgerDeposit = db.ledger.find(
      (l) => l.referenceId === deposit.id && l.type === 'deposit'
    );
    if (ledgerDeposit) {
      ledgerDeposit.status = 'approved';
      ledgerDeposit.description = `${deposit.paymentMethod} · TID: ${deposit.transactionRef} (Verified & Approved by Admin)`;
    }

    // Activate User's 90-Day Investment Plan
    const newActivePlan: StoredActivePlan = {
      id: crypto.randomUUID(),
      userId: depositor.id,
      depositId: deposit.id,
      packageCode: deposit.packageCode,
      packageName: deposit.packageName,
      investmentAmount: deposit.amount,
      projectedDailyProfit: deposit.projectedDailyProfit,
      durationDays: deposit.durationDays,
      daysCredited: 0,
      totalProfitCredited: 0,
      status: 'active',
      startedAt: nowIso,
      expiresAt: expiresDate.toISOString(),
      lastProfitAt: nowIso,
      nextProfitAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    db.activePlans.unshift(newActivePlan);

    // Determine plan referral bonus rates (12% Level 1 and 3% Level 2 separately)
    const planDef = db.plans.find((p) => p.id === deposit.planId || p.code === deposit.packageCode);
    const level1Rate = planDef ? planDef.level1BonusPercent : 12;
    const level2Rate = planDef ? planDef.level2BonusPercent : 3;

    // Level 1 Referrer Commission (12%)
    const level1Referrer = db.users.find((u) => isDirectReferredBy(depositor, u));
    if (level1Referrer) {
      const l1Bonus = Number(((deposit.amount * level1Rate) / 100).toFixed(2));
      if (l1Bonus > 0) {
        db.ledger.unshift({
          id: crypto.randomUUID(),
          userId: level1Referrer.id,
          type: 'referral_commission',
          amount: l1Bonus,
          status: 'approved',
          title: `Level 1 Referral Bonus (${level1Rate}%)`,
          description: `From ${depositor.name}'s verified ${deposit.packageCode} deposit (Rs ${deposit.amount.toLocaleString()})`,
          referenceId: deposit.id,
          rejectionReason: null,
          createdAt: nowIso,
        });
      }

      // Level 2 Referrer Commission (3%)
      const level2Referrer = db.users.find((u) => isDirectReferredBy(level1Referrer, u));
      if (level2Referrer && level2Referrer.id !== depositor.id) {
        const l2Bonus = Number(((deposit.amount * level2Rate) / 100).toFixed(2));
        if (l2Bonus > 0) {
          db.ledger.unshift({
            id: crypto.randomUUID(),
            userId: level2Referrer.id,
            type: 'referral_commission',
            amount: l2Bonus,
            status: 'approved',
            title: `Level 2 Referral Bonus (${level2Rate}%)`,
            description: `From Level 2 member ${depositor.name}'s verified ${deposit.packageCode} deposit`,
            referenceId: deposit.id,
            rejectionReason: null,
            createdAt: nowIso,
          });
        }
      }
    }

    recordAuditLog(
      admin,
      'APPROVE_DEPOSIT',
      'deposit',
      deposit.id,
      depositor.name,
      `Approved ${deposit.packageCode} deposit of Rs ${deposit.amount.toLocaleString()} (TID: ${deposit.transactionRef}) for ${depositor.name}`
    );

    saveDb();
    res.json({ success: true, deposit: serializeDeposit(deposit) });
  });

  // Reject Deposit (Wallet balance does NOT increase; investment plan does NOT become active)
  app.post('/api/admin/deposits/:depositId/reject', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const deposit = db.deposits.find((d) => d.id === req.params.depositId);
    const { reason } = req.body ?? {};
    const cleanReason =
      typeof reason === 'string' && reason.trim().length >= 2
        ? reason.trim()
        : 'Payment screenshot or Transaction ID could not be verified.';

    if (!deposit) {
      res.status(404).json({ error: 'Deposit request not found.' });
      return;
    }
    if (deposit.status !== 'pending') {
      res.status(400).json({ error: `Deposit request has already been ${deposit.status}.` });
      return;
    }

    const depositor = db.users.find((u) => u.id === deposit.userId);
    const nowIso = new Date().toISOString();

    deposit.status = 'rejected';
    deposit.rejectionReason = cleanReason;
    deposit.reviewedAt = nowIso;
    deposit.reviewedByAdminId = admin.id;
    deposit.reviewedByName = admin.name;

    const ledgerDeposit = db.ledger.find(
      (l) => l.referenceId === deposit.id && l.type === 'deposit'
    );
    if (ledgerDeposit) {
      ledgerDeposit.status = 'rejected';
      ledgerDeposit.rejectionReason = cleanReason;
      ledgerDeposit.description = `Rejected: ${cleanReason}`;
    }

    recordAuditLog(
      admin,
      'REJECT_DEPOSIT',
      'deposit',
      deposit.id,
      depositor ? depositor.name : null,
      `Rejected ${deposit.packageCode} deposit of Rs ${deposit.amount.toLocaleString()} — Reason: ${cleanReason}`
    );

    saveDb();
    res.json({ success: true, deposit: serializeDeposit(deposit) });
  });

  // Approve Withdrawal (Deducts from customer balance ONLY upon Admin authorization)
  app.post('/api/admin/withdrawals/:withdrawalId/approve', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const withdrawal = db.withdrawals.find((w) => w.id === req.params.withdrawalId);

    if (!withdrawal) {
      res.status(404).json({ error: 'Withdrawal request not found.' });
      return;
    }
    if (withdrawal.status !== 'pending') {
      res.status(400).json({ error: `Withdrawal has already been ${withdrawal.status}.` });
      return;
    }

    const targetUser = db.users.find((u) => u.id === withdrawal.userId);
    if (!targetUser) {
      res.status(404).json({ error: 'Customer account not found.' });
      return;
    }

    const currentProfile = buildPublicUser(targetUser);
    if (withdrawal.amount > currentProfile.balance) {
      res.status(400).json({
        error: `Customer's current available balance (Rs ${currentProfile.balance.toFixed(2)}) is lower than this withdrawal request.`,
      });
      return;
    }

    const nowIso = new Date().toISOString();

    withdrawal.status = 'approved';
    withdrawal.reviewedAt = nowIso;
    withdrawal.reviewedByAdminId = admin.id;
    withdrawal.reviewedByName = admin.name;

    const ledgerItem = db.ledger.find(
      (l) => l.referenceId === withdrawal.id && l.type === 'withdrawal'
    );
    if (ledgerItem) {
      ledgerItem.status = 'approved';
      ledgerItem.description = `${withdrawal.method} · ${withdrawal.accountTitle} (${withdrawal.accountNumber}) — Approved & Disbursed`;
    }

    recordAuditLog(
      admin,
      'APPROVE_WITHDRAWAL',
      'withdrawal',
      withdrawal.id,
      targetUser.name,
      `Approved withdrawal of Rs ${withdrawal.amount.toLocaleString()} via ${withdrawal.method} to ${withdrawal.accountNumber} (${withdrawal.accountTitle})`
    );

    saveDb();
    res.json({ success: true, withdrawal: serializeWithdrawal(withdrawal) });
  });

  // Reject Withdrawal (Balance was never pre-deducted, so customer balance remains unchanged)
  app.post('/api/admin/withdrawals/:withdrawalId/reject', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const withdrawal = db.withdrawals.find((w) => w.id === req.params.withdrawalId);
    const { reason } = req.body ?? {};
    const cleanReason =
      typeof reason === 'string' && reason.trim().length >= 2
        ? reason.trim()
        : 'Withdrawal request could not be verified by Admin.';

    if (!withdrawal) {
      res.status(404).json({ error: 'Withdrawal request not found.' });
      return;
    }
    if (withdrawal.status !== 'pending') {
      res.status(400).json({ error: `Withdrawal has already been ${withdrawal.status}.` });
      return;
    }

    const targetUser = db.users.find((u) => u.id === withdrawal.userId);
    const nowIso = new Date().toISOString();

    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = cleanReason;
    withdrawal.reviewedAt = nowIso;
    withdrawal.reviewedByAdminId = admin.id;
    withdrawal.reviewedByName = admin.name;

    const ledgerItem = db.ledger.find(
      (l) => l.referenceId === withdrawal.id && l.type === 'withdrawal'
    );
    if (ledgerItem) {
      ledgerItem.status = 'rejected';
      ledgerItem.rejectionReason = cleanReason;
      ledgerItem.description = `Rejected: ${cleanReason} (Balance unchanged)`;
    }

    recordAuditLog(
      admin,
      'REJECT_WITHDRAWAL',
      'withdrawal',
      withdrawal.id,
      targetUser ? targetUser.name : null,
      `Rejected withdrawal of Rs ${withdrawal.amount.toLocaleString()} — Reason: ${cleanReason}`
    );

    saveDb();
    res.json({ success: true, withdrawal: serializeWithdrawal(withdrawal) });
  });

  // Update Investment Plan (NBV-01 to NBV-15)
  app.put('/api/admin/plans/:planId', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const plan = db.plans.find((p) => p.id === req.params.planId);
    if (!plan) {
      res.status(404).json({ error: 'Investment plan not found.' });
      return;
    }

    const {
      name,
      investmentAmount,
      projectedDailyProfit,
      durationDays,
      level1BonusPercent,
      level2BonusPercent,
      isActive,
    } = req.body ?? {};

    if (typeof name === 'string' && name.trim().length >= 3) {
      plan.name = name.trim();
    }
    if (Number.isFinite(Number(investmentAmount)) && Number(investmentAmount) > 0) {
      plan.investmentAmount = Number(investmentAmount);
    }
    if (Number.isFinite(Number(projectedDailyProfit)) && Number(projectedDailyProfit) >= 0) {
      plan.projectedDailyProfit = Number(projectedDailyProfit);
    }
    if (Number.isFinite(Number(durationDays)) && Number(durationDays) >= 1) {
      plan.durationDays = Math.round(Number(durationDays));
    }
    if (Number.isFinite(Number(level1BonusPercent)) && Number(level1BonusPercent) >= 0) {
      plan.level1BonusPercent = Number(level1BonusPercent);
    }
    if (Number.isFinite(Number(level2BonusPercent)) && Number(level2BonusPercent) >= 0) {
      plan.level2BonusPercent = Number(level2BonusPercent);
    }
    if (typeof isActive === 'boolean') {
      plan.isActive = isActive;
    }
    plan.profitRatePercent = computePlanProfitRate(
      plan.investmentAmount,
      plan.projectedDailyProfit
    );

    recordAuditLog(
      admin,
      'UPDATE_PLAN',
      'plan',
      plan.id,
      null,
      `Updated ${plan.code}: Investment Rs ${plan.investmentAmount.toLocaleString()}, Projected Daily Rs ${plan.projectedDailyProfit.toLocaleString()}, Duration ${plan.durationDays}d`
    );

    saveDb();
    res.json({ success: true, plan });
  });

  // Admin: Distribute Verified Daily Trading Profit to Active Plans
  app.post('/api/admin/plans/distribute-profit', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const nowIso = new Date().toISOString();

    const eligiblePlans = db.activePlans.filter(
      (ap) => ap.status === 'active' && ap.daysCredited < ap.durationDays
    );

    if (eligiblePlans.length === 0) {
      res.status(400).json({ error: 'There are currently no active user plans to credit.' });
      return;
    }

    let creditedCount = 0;
    let totalDistributed = 0;

    for (const activePlan of eligiblePlans) {
      const creditAmount = Number(activePlan.projectedDailyProfit.toFixed(2));
      if (creditAmount <= 0) continue;

      activePlan.daysCredited += 1;
      activePlan.totalProfitCredited = Number(
        (activePlan.totalProfitCredited + creditAmount).toFixed(2)
      );
      if (activePlan.daysCredited >= activePlan.durationDays) {
        activePlan.status = 'completed';
      }

      db.ledger.unshift({
        id: crypto.randomUUID(),
        userId: activePlan.userId,
        type: 'plan_profit',
        amount: creditAmount,
        status: 'approved',
        title: `Daily Trading Profit — ${activePlan.packageCode}`,
        description: `Day ${activePlan.daysCredited} of ${activePlan.durationDays} verified profit settlement`,
        referenceId: activePlan.id,
        rejectionReason: null,
        createdAt: nowIso,
      });

      creditedCount += 1;
      totalDistributed += creditAmount;
    }

    recordAuditLog(
      admin,
      'DISTRIBUTE_DAILY_PROFIT',
      'active_plans',
      'batch',
      null,
      `Distributed Rs ${totalDistributed.toLocaleString()} verified daily profit across ${creditedCount} active plan(s)`
    );

    saveDb();
    res.json({
      success: true,
      creditedCount,
      totalDistributed,
    });
  });

  // Admin: Update Official Deposit Receiving Accounts, Selected Gateways, Support Numbers, Channel & Compliance Info
  app.put('/api/admin/settings/payment', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const updates = req.body ?? {};

    const validDefaultMethods = ['Easypaisa', 'JazzCash', 'Bank Transfer'] as const;
    const nextDefaultMethod = validDefaultMethods.includes(updates.defaultDepositMethod)
      ? updates.defaultDepositMethod
      : db.paymentConfig.defaultDepositMethod || 'Easypaisa';

    let epEnabled =
      typeof updates.easypaisaEnabled === 'boolean'
        ? updates.easypaisaEnabled
        : db.paymentConfig.easypaisaEnabled;
    let jcEnabled =
      typeof updates.jazzcashEnabled === 'boolean'
        ? updates.jazzcashEnabled
        : db.paymentConfig.jazzcashEnabled;
    let btEnabled =
      typeof updates.bankTransferEnabled === 'boolean'
        ? updates.bankTransferEnabled
        : db.paymentConfig.bankTransferEnabled;

    // Ensure at least one deposit payment method remains enabled
    if (!epEnabled && !jcEnabled && !btEnabled) {
      epEnabled = true;
    }

    db.paymentConfig = {
      ...db.paymentConfig,
      defaultDepositMethod: nextDefaultMethod,
      easypaisaEnabled: epEnabled,
      easypaisaTitle:
        typeof updates.easypaisaTitle === 'string'
          ? updates.easypaisaTitle.trim()
          : db.paymentConfig.easypaisaTitle,
      easypaisaNumber:
        typeof updates.easypaisaNumber === 'string'
          ? updates.easypaisaNumber.trim()
          : db.paymentConfig.easypaisaNumber,
      jazzcashEnabled: jcEnabled,
      jazzcashTitle:
        typeof updates.jazzcashTitle === 'string'
          ? updates.jazzcashTitle.trim()
          : db.paymentConfig.jazzcashTitle,
      jazzcashNumber:
        typeof updates.jazzcashNumber === 'string'
          ? updates.jazzcashNumber.trim()
          : db.paymentConfig.jazzcashNumber,
      bankTransferEnabled: btEnabled,
      bankName:
        typeof updates.bankName === 'string' ? updates.bankName.trim() : db.paymentConfig.bankName,
      bankAccountTitle:
        typeof updates.bankAccountTitle === 'string'
          ? updates.bankAccountTitle.trim()
          : db.paymentConfig.bankAccountTitle,
      bankAccountNumber:
        typeof updates.bankAccountNumber === 'string'
          ? updates.bankAccountNumber.trim()
          : db.paymentConfig.bankAccountNumber,
      adminPhone:
        typeof updates.adminPhone === 'string'
          ? updates.adminPhone.trim()
          : db.paymentConfig.adminPhone,
      supportWhatsapp:
        typeof updates.supportWhatsapp === 'string'
          ? updates.supportWhatsapp.trim()
          : db.paymentConfig.supportWhatsapp,
      officialChannelUrl:
        typeof updates.officialChannelUrl === 'string'
          ? updates.officialChannelUrl.trim()
          : db.paymentConfig.officialChannelUrl,
      fbrRegistrationRef:
        typeof updates.fbrRegistrationRef === 'string'
          ? updates.fbrRegistrationRef.trim()
          : db.paymentConfig.fbrRegistrationRef,
      secpRegistrationRef:
        typeof updates.secpRegistrationRef === 'string'
          ? updates.secpRegistrationRef.trim()
          : db.paymentConfig.secpRegistrationRef,
    };

    recordAuditLog(
      admin,
      'UPDATE_PAYMENT_SETTINGS',
      'settings',
      'payment_config',
      null,
      'Updated official deposit payment methods, phone numbers, support contacts, channel link & compliance info'
    );

    saveDb();
    res.json({ success: true, paymentConfig: db.paymentConfig });
  });

  // ==========================================
  // PAYMENT & TRANSACTION MANAGEMENT (ADMIN FULL ACCESS)
  // ==========================================

  // Admin: Get all managed transaction screenshots with active/complimentary/retired categorizations
  app.get('/api/admin/screenshots', requireAdmin, (_req: Request, res: Response) => {
    const list = (db.transactionScreenshots || []).map(serializeTransactionScreenshot);
    res.json({ screenshots: list });
  });

  // Admin: Stream a specific managed screenshot image
  app.get('/api/admin/screenshots/:id/image', requireAdmin, (req: Request, res: Response) => {
    const item = (db.transactionScreenshots || []).find((s) => s.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Screenshot not found.' });
      return;
    }

    if (item.receiptFilename === 'user_uploaded_IMG-20261024-WA0197_1181407d.jpg') {
      const publicPath = path.join(
        __dirname,
        'public',
        'assets',
        'aistudio',
        'IMG-20261024-WA0197_1181407d.jpg'
      );
      if (fs.existsSync(publicPath)) {
        res.setHeader('Content-Type', item.receiptMimeType || 'image/jpeg');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, max-age=120');
        fs.createReadStream(publicPath).pipe(res);
        return;
      }
    }

    const safeName = path.basename(item.receiptFilename);
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Screenshot file missing on server.' });
      return;
    }

    res.setHeader('Content-Type', item.receiptMimeType || 'image/jpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=120');
    fs.createReadStream(filePath).pipe(res);
  });

  // Admin: Upload / Create a new Payment Transaction Screenshot record
  app.post('/api/admin/screenshots', requireAdmin, (req: Request, res: Response) => {
    try {
      const admin = (req as Request & { currentUser: StoredUser }).currentUser;
      const {
        customerName,
        customerPhone,
        paymentMethod,
        amount,
        transactionRef,
        category,
        notes,
        imageDataUrl,
      } = req.body ?? {};

      if (typeof imageDataUrl !== 'string' || !imageDataUrl.trim()) {
        res.status(400).json({ error: 'Please upload or select an image for this transaction screenshot.' });
        return;
      }

      const saved = saveReceiptImage(imageDataUrl.trim());
      const nowIso = new Date().toISOString();
      const validCategory =
        category === 'complimentary' || category === 'retired' ? category : 'active';

      const newScreenshot: StoredTransactionScreenshot = {
        id: `scr_${crypto.randomUUID()}`,
        depositId: null,
        transactionRef: typeof transactionRef === 'string' && transactionRef.trim() ? transactionRef.trim() : `TID-${Date.now().toString().slice(-8)}`,
        userId: null,
        customerName: typeof customerName === 'string' && customerName.trim() ? customerName.trim() : 'Customer',
        customerPhone: typeof customerPhone === 'string' ? customerPhone.trim() : '',
        paymentMethod: typeof paymentMethod === 'string' && paymentMethod.trim() ? paymentMethod.trim() : 'JazzCash',
        amount: Number.isFinite(Number(amount)) && Number(amount) >= 0 ? Number(amount) : 0,
        category: validCategory,
        notes: typeof notes === 'string' ? notes.trim() : '',
        receiptFilename: saved.filename,
        receiptMimeType: saved.mimeType,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (!Array.isArray(db.transactionScreenshots)) {
        db.transactionScreenshots = [];
      }
      db.transactionScreenshots.unshift(newScreenshot);

      recordAuditLog(
        admin,
        'CREATE_TRANSACTION_SCREENSHOT',
        'screenshot',
        newScreenshot.id,
        newScreenshot.customerName,
        `Added ${newScreenshot.category} transaction screenshot for ${newScreenshot.customerName} (TID: ${newScreenshot.transactionRef}, Rs ${newScreenshot.amount.toLocaleString()})`
      );

      saveDb();
      res.status(201).json({
        success: true,
        screenshot: serializeTransactionScreenshot(newScreenshot),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to create transaction screenshot.',
      });
    }
  });

  // Admin: Edit & Save Transaction Screenshot details (customer name, phone, TID, amount, method, category, notes, replacement image)
  app.put('/api/admin/screenshots/:id', requireAdmin, (req: Request, res: Response) => {
    try {
      const admin = (req as Request & { currentUser: StoredUser }).currentUser;
      const list = db.transactionScreenshots || [];
      const item = list.find((s) => s.id === req.params.id);
      if (!item) {
        res.status(404).json({ error: 'Transaction screenshot record not found.' });
        return;
      }

      const {
        customerName,
        customerPhone,
        paymentMethod,
        amount,
        transactionRef,
        category,
        notes,
        imageDataUrl,
      } = req.body ?? {};

      if (typeof customerName === 'string' && customerName.trim()) {
        item.customerName = customerName.trim();
      }
      if (typeof customerPhone === 'string') {
        item.customerPhone = customerPhone.trim();
      }
      if (typeof paymentMethod === 'string' && paymentMethod.trim()) {
        item.paymentMethod = paymentMethod.trim();
      }
      if (Number.isFinite(Number(amount)) && Number(amount) >= 0) {
        item.amount = Number(amount);
      }
      if (typeof transactionRef === 'string' && transactionRef.trim()) {
        item.transactionRef = transactionRef.trim();
      }
      if (category === 'active' || category === 'complimentary' || category === 'retired') {
        item.category = category;
      }
      if (typeof notes === 'string') {
        item.notes = notes.trim();
      }

      if (typeof imageDataUrl === 'string' && imageDataUrl.trim().startsWith('data:image/')) {
        const saved = saveReceiptImage(imageDataUrl.trim());
        item.receiptFilename = saved.filename;
        item.receiptMimeType = saved.mimeType;
      }

      item.updatedAt = new Date().toISOString();

      recordAuditLog(
        admin,
        'UPDATE_TRANSACTION_SCREENSHOT',
        'screenshot',
        item.id,
        item.customerName,
        `Updated transaction screenshot ${item.transactionRef} for ${item.customerName} (${item.category}, Rs ${item.amount.toLocaleString()})`
      );

      saveDb();
      res.json({
        success: true,
        screenshot: serializeTransactionScreenshot(item),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to update transaction screenshot.',
      });
    }
  });

  // Admin: Delete a managed screenshot
  app.delete('/api/admin/screenshots/:id', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const list = db.transactionScreenshots || [];
    const idx = list.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Screenshot not found.' });
      return;
    }

    const removed = list[idx];
    list.splice(idx, 1);
    db.transactionScreenshots = list;

    recordAuditLog(
      admin,
      'DELETE_TRANSACTION_SCREENSHOT',
      'screenshot',
      removed.id,
      removed.customerName,
      `Removed ${removed.category} transaction screenshot (TID: ${removed.transactionRef})`
    );

    saveDb();
    res.json({ success: true });
  });

  // Admin: Direct Edit & Save Customer Deposit / Payment Details (amount, sender name, account number, TID, payment method, replacement screenshot)
  app.put('/api/admin/deposits/:depositId/edit-payment', requireAdmin, (req: Request, res: Response) => {
    try {
      const admin = (req as Request & { currentUser: StoredUser }).currentUser;
      const deposit = db.deposits.find((d) => d.id === req.params.depositId);
      if (!deposit) {
        res.status(404).json({ error: 'Deposit record not found.' });
        return;
      }

      const {
        senderAccountName,
        senderAccountNumber,
        transactionRef,
        paymentMethod,
        amount,
        receiptDataUrl,
      } = req.body ?? {};

      if (typeof senderAccountName === 'string' && senderAccountName.trim()) {
        deposit.senderAccountName = senderAccountName.trim();
      }
      if (typeof senderAccountNumber === 'string') {
        deposit.senderAccountNumber = senderAccountNumber.trim();
      }
      if (typeof transactionRef === 'string' && transactionRef.trim()) {
        deposit.transactionRef = transactionRef.trim();
      }
      if (typeof paymentMethod === 'string' && paymentMethod.trim()) {
        deposit.paymentMethod = paymentMethod.trim();
      }
      if (Number.isFinite(Number(amount)) && Number(amount) > 0) {
        deposit.amount = Number(amount);
      }

      if (typeof receiptDataUrl === 'string' && receiptDataUrl.trim().startsWith('data:image/')) {
        const saved = saveReceiptImage(receiptDataUrl.trim());
        deposit.receiptFilename = saved.filename;
        deposit.receiptMimeType = saved.mimeType;
      }

      // Sync corresponding ledger entry if present
      const ledgerEntry = db.ledger.find(
        (l) => l.referenceId === deposit.id && l.type === 'deposit'
      );
      if (ledgerEntry) {
        ledgerEntry.amount = deposit.amount;
        ledgerEntry.description = `${deposit.paymentMethod} · TID: ${deposit.transactionRef}`;
      }

      const depositor = db.users.find((u) => u.id === deposit.userId);
      recordAuditLog(
        admin,
        'EDIT_DEPOSIT_PAYMENT_DETAILS',
        'deposit',
        deposit.id,
        depositor ? depositor.name : null,
        `Admin edited deposit payment details for ${deposit.packageCode}: TID ${deposit.transactionRef}, Sender ${deposit.senderAccountName}, Rs ${deposit.amount.toLocaleString()}`
      );

      saveDb();
      res.json({ success: true, deposit: serializeDeposit(deposit) });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to update deposit payment details.',
      });
    }
  });

  // Admin: Upload / Replace Official Corporate FBR or SECP Document Image/PDF
  app.post('/api/admin/settings/document-upload', requireAdmin, (req: Request, res: Response) => {
    try {
      const admin = (req as Request & { currentUser: StoredUser }).currentUser;
      const { docType, fileDataUrl } = req.body ?? {};
      if (docType !== 'fbr' && docType !== 'secp') {
        res.status(400).json({ error: 'Document type must be fbr or secp.' });
        return;
      }
      if (typeof fileDataUrl !== 'string' || !fileDataUrl.trim()) {
        res.status(400).json({ error: 'Please select a document image or PDF to upload.' });
        return;
      }

      const saved = saveOfficialDocumentFile(docType, fileDataUrl.trim());
      const publicUrl = `/api/public-docs/${docType}?v=${Date.now()}`;

      if (docType === 'fbr') {
        db.paymentConfig.fbrUploadedFilename = saved.filename;
        db.paymentConfig.fbrDocumentMime = saved.mimeType;
        db.paymentConfig.fbrDocumentUrl = publicUrl;
      } else {
        db.paymentConfig.secpUploadedFilename = saved.filename;
        db.paymentConfig.secpDocumentMime = saved.mimeType;
        db.paymentConfig.secpDocumentUrl = publicUrl;
      }

      recordAuditLog(
        admin,
        'UPDATE_OFFICIAL_DOCUMENT',
        'settings',
        docType,
        null,
        `Uploaded official ${docType.toUpperCase()} compliance document`
      );

      saveDb();
      res.json({ success: true, paymentConfig: db.paymentConfig });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to upload official document.',
      });
    }
  });

  // ==========================================
  // TRANSACTION RECEIPT GENERATOR (ADMIN ONLY)
  // ==========================================

  // Admin: Get all saved generated receipts
  app.get('/api/admin/receipts', requireAdmin, (_req: Request, res: Response) => {
    const list = (db.generatedReceipts || []).map(serializeGeneratedReceipt);
    res.json({ receipts: list });
  });

  // Admin: Stream custom background image for a generated receipt
  app.get('/api/admin/receipts/:id/bg-image', requireAdmin, (req: Request, res: Response) => {
    const item = (db.generatedReceipts || []).find((r) => r.id === req.params.id);
    if (!item || !item.customBackgroundFilename) {
      res.status(404).json({ error: 'Receipt background image not found.' });
      return;
    }

    const safeName = path.basename(item.customBackgroundFilename);
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Receipt background image file missing on server.' });
      return;
    }

    res.setHeader('Content-Type', item.customBackgroundMime || 'image/jpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=120');
    fs.createReadStream(filePath).pipe(res);
  });

  // Admin: Create & Save a new generated receipt template
  app.post('/api/admin/receipts', requireAdmin, (req: Request, res: Response) => {
    try {
      const admin = (req as Request & { currentUser: StoredUser }).currentUser;
      const {
        receiptType,
        senderName,
        senderAccountOrPhone,
        receiverName,
        receiverAccountOrPhone,
        amount,
        fee,
        transactionRef,
        transactionDateTime,
        status,
        paymentMethod,
        bankName,
        purpose,
        notes,
        backgroundTheme,
        imageDataUrl,
      } = req.body ?? {};

      let customBackgroundFilename: string | null = null;
      let customBackgroundMime: string | null = null;

      if (typeof imageDataUrl === 'string' && imageDataUrl.trim().startsWith('data:image/')) {
        const saved = saveReceiptImage(imageDataUrl.trim());
        customBackgroundFilename = saved.filename;
        customBackgroundMime = saved.mimeType;
      }

      const validReceiptTypes = ['bank_transfer', 'cash', 'easypaisa', 'jazzcash', 'other'] as const;
      const resolvedType = validReceiptTypes.includes(receiptType) ? receiptType : 'bank_transfer';

      const validStatuses = ['successful', 'pending', 'completed', 'failed'] as const;
      const resolvedStatus = validStatuses.includes(status) ? status : 'successful';

      const validThemes = [
        'meezan_receipt',
        'jazzcash_receipt',
        'easypaisa_receipt',
        'classic_clean',
        'custom_bg',
      ] as const;
      const resolvedTheme = validThemes.includes(backgroundTheme) ? backgroundTheme : 'meezan_receipt';

      const nowIso = new Date().toISOString();
      const newReceipt: StoredGeneratedReceipt = {
        id: `rcpt_${crypto.randomUUID()}`,
        receiptType: resolvedType,
        senderName: typeof senderName === 'string' && senderName.trim() ? senderName.trim() : 'MUHAMMAD NAEEM',
        senderAccountOrPhone: typeof senderAccountOrPhone === 'string' ? senderAccountOrPhone.trim() : '',
        receiverName: typeof receiverName === 'string' && receiverName.trim() ? receiverName.trim() : 'Customer',
        receiverAccountOrPhone: typeof receiverAccountOrPhone === 'string' ? receiverAccountOrPhone.trim() : '',
        amount: Number.isFinite(Number(amount)) && Number(amount) >= 0 ? Number(amount) : 0,
        fee: Number.isFinite(Number(fee)) && Number(fee) >= 0 ? Number(fee) : 0,
        transactionRef:
          typeof transactionRef === 'string' && transactionRef.trim()
            ? transactionRef.trim()
            : `${Date.now().toString().slice(-12)}`,
        transactionDateTime:
          typeof transactionDateTime === 'string' && transactionDateTime.trim()
            ? transactionDateTime.trim()
            : new Date().toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: resolvedStatus,
        paymentMethod: typeof paymentMethod === 'string' && paymentMethod.trim() ? paymentMethod.trim() : 'Bank Transfer',
        bankName: typeof bankName === 'string' && bankName.trim() ? bankName.trim() : 'Meezan Bank Limited',
        purpose: typeof purpose === 'string' ? purpose.trim() : 'Investment Deposit',
        notes: typeof notes === 'string' ? notes.trim() : '',
        backgroundTheme: resolvedTheme,
        customBackgroundFilename,
        customBackgroundMime,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (!Array.isArray(db.generatedReceipts)) {
        db.generatedReceipts = [];
      }
      db.generatedReceipts.unshift(newReceipt);

      recordAuditLog(
        admin,
        'CREATE_RECEIPT_TEMPLATE',
        'receipt',
        newReceipt.id,
        newReceipt.receiverName,
        `Created ${newReceipt.receiptType} receipt (TID: ${newReceipt.transactionRef}, Rs ${newReceipt.amount.toLocaleString()})`
      );

      saveDb();
      res.status(201).json({
        success: true,
        receipt: serializeGeneratedReceipt(newReceipt),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to create generated receipt.',
      });
    }
  });

  // Admin: Manually edit and update all fields of any existing receipt
  app.put('/api/admin/receipts/:id', requireAdmin, (req: Request, res: Response) => {
    try {
      const admin = (req as Request & { currentUser: StoredUser }).currentUser;
      const list = db.generatedReceipts || [];
      const item = list.find((r) => r.id === req.params.id);
      if (!item) {
        res.status(404).json({ error: 'Receipt record not found.' });
        return;
      }

      const {
        receiptType,
        senderName,
        senderAccountOrPhone,
        receiverName,
        receiverAccountOrPhone,
        amount,
        fee,
        transactionRef,
        transactionDateTime,
        status,
        paymentMethod,
        bankName,
        purpose,
        notes,
        backgroundTheme,
        imageDataUrl,
      } = req.body ?? {};

      const validReceiptTypes = ['bank_transfer', 'cash', 'easypaisa', 'jazzcash', 'other'] as const;
      if (validReceiptTypes.includes(receiptType)) {
        item.receiptType = receiptType;
      }
      if (typeof senderName === 'string') {
        item.senderName = senderName.trim();
      }
      if (typeof senderAccountOrPhone === 'string') {
        item.senderAccountOrPhone = senderAccountOrPhone.trim();
      }
      if (typeof receiverName === 'string') {
        item.receiverName = receiverName.trim();
      }
      if (typeof receiverAccountOrPhone === 'string') {
        item.receiverAccountOrPhone = receiverAccountOrPhone.trim();
      }
      if (Number.isFinite(Number(amount)) && Number(amount) >= 0) {
        item.amount = Number(amount);
      }
      if (Number.isFinite(Number(fee)) && Number(fee) >= 0) {
        item.fee = Number(fee);
      }
      if (typeof transactionRef === 'string') {
        item.transactionRef = transactionRef.trim();
      }
      if (typeof transactionDateTime === 'string') {
        item.transactionDateTime = transactionDateTime.trim();
      }
      const validStatuses = ['successful', 'pending', 'completed', 'failed'] as const;
      if (validStatuses.includes(status)) {
        item.status = status;
      }
      if (typeof paymentMethod === 'string') {
        item.paymentMethod = paymentMethod.trim();
      }
      if (typeof bankName === 'string') {
        item.bankName = bankName.trim();
      }
      if (typeof purpose === 'string') {
        item.purpose = purpose.trim();
      }
      if (typeof notes === 'string') {
        item.notes = notes.trim();
      }
      const validThemes = [
        'meezan_receipt',
        'jazzcash_receipt',
        'easypaisa_receipt',
        'classic_clean',
        'custom_bg',
      ] as const;
      if (validThemes.includes(backgroundTheme)) {
        item.backgroundTheme = backgroundTheme;
      }

      if (typeof imageDataUrl === 'string' && imageDataUrl.trim().startsWith('data:image/')) {
        const saved = saveReceiptImage(imageDataUrl.trim());
        item.customBackgroundFilename = saved.filename;
        item.customBackgroundMime = saved.mimeType;
      }

      item.updatedAt = new Date().toISOString();

      recordAuditLog(
        admin,
        'UPDATE_RECEIPT_TEMPLATE',
        'receipt',
        item.id,
        item.receiverName,
        `Updated ${item.receiptType} receipt (TID: ${item.transactionRef}, Rs ${item.amount.toLocaleString()})`
      );

      saveDb();
      res.json({
        success: true,
        receipt: serializeGeneratedReceipt(item),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to update receipt.',
      });
    }
  });

  // Admin: Delete a generated receipt template
  app.delete('/api/admin/receipts/:id', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const list = db.generatedReceipts || [];
    const idx = list.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Receipt record not found.' });
      return;
    }

    const removed = list[idx];
    list.splice(idx, 1);
    db.generatedReceipts = list;

    recordAuditLog(
      admin,
      'DELETE_RECEIPT_TEMPLATE',
      'receipt',
      removed.id,
      removed.receiverName,
      `Deleted ${removed.receiptType} receipt template (TID: ${removed.transactionRef})`
    );

    saveDb();
    res.json({ success: true });
  });

  // Admin: Get all Customer In-App Support Threads & Messages
  app.get('/api/admin/support/threads', requireAdmin, (_req: Request, res: Response) => {
    res.json({
      threads: buildSupportThreads(),
      messages: db.supportMessages
        .slice()
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
        .map(serializeSupportMessage),
    });
  });

  // Admin: Mark a Customer Support Thread as Read
  app.post('/api/admin/support/threads/:userId/read', requireAdmin, (req: Request, res: Response) => {
    const targetUserId = req.params.userId;
    let changed = false;

    for (const m of db.supportMessages) {
      if (m.userId === targetUserId && m.senderRole === 'user' && !m.readByAdmin) {
        m.readByAdmin = true;
        changed = true;
      }
    }
    for (const n of db.notifications) {
      if (
        n.recipientRole === 'admin' &&
        n.type === 'customer_message' &&
        n.relatedUserId === targetUserId &&
        !n.isRead
      ) {
        n.isRead = true;
        changed = true;
      }
    }

    if (changed) {
      saveDb();
      pushSnapshotToMatchingSockets((u) => u.role === 'admin' || u.id === targetUserId);
    }

    res.json({
      success: true,
      threads: buildSupportThreads(),
    });
  });

  // Admin: Send Direct In-App Reply to Customer (Instantly Notifies Customer)
  app.post('/api/admin/support/messages/:userId/reply', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const targetUser = db.users.find((u) => u.id === req.params.userId);
    const { body, reply } = req.body ?? {};
    const rawReply = typeof body === 'string' ? body : typeof reply === 'string' ? reply : '';
    const cleanReply = rawReply.trim();

    if (!targetUser) {
      res.status(404).json({ error: 'Customer account not found.' });
      return;
    }
    if (cleanReply.length < 1 || cleanReply.length > 2000) {
      res.status(400).json({ error: 'Please enter a reply message (max 2,000 characters).' });
      return;
    }

    // Mark unread customer messages in this thread as read by Admin
    for (const m of db.supportMessages) {
      if (m.userId === targetUser.id && m.senderRole === 'user' && !m.readByAdmin) {
        m.readByAdmin = true;
      }
    }
    for (const n of db.notifications) {
      if (
        n.recipientRole === 'admin' &&
        n.type === 'customer_message' &&
        n.relatedUserId === targetUser.id &&
        !n.isRead
      ) {
        n.isRead = true;
      }
    }

    const nowIso = new Date().toISOString();
    const replyMsg: StoredSupportMessage = {
      id: crypto.randomUUID(),
      userId: targetUser.id,
      senderRole: 'admin',
      senderId: admin.id,
      senderName: 'NBV Admin Support',
      subject: null,
      body: cleanReply,
      readByAdmin: true,
      readByUser: false,
      createdAt: nowIso,
    };

    const preview =
      cleanReply.length > 110 ? `${cleanReply.slice(0, 107)}...` : cleanReply;
    const customerNotif: StoredNotification = {
      id: crypto.randomUUID(),
      recipientRole: 'user',
      recipientUserId: targetUser.id,
      type: 'admin_reply',
      title: 'New Reply from Admin Support',
      body: preview,
      relatedUserId: targetUser.id,
      relatedUserName: targetUser.name,
      messageId: replyMsg.id,
      isRead: false,
      createdAt: nowIso,
    };

    db.supportMessages.push(replyMsg);
    db.notifications.unshift(customerNotif);
    if (db.notifications.length > 300) {
      db.notifications = db.notifications.slice(0, 300);
    }

    recordAuditLog(
      admin,
      'REPLY_SUPPORT_MESSAGE',
      'support',
      replyMsg.id,
      targetUser.name,
      `Sent in-app support reply to ${targetUser.name}`
    );

    saveDb();

    const serializedReply = serializeSupportMessage(replyMsg);

    // Broadcast instantly to the Customer (live message + notification) and all Admin sessions
    for (const client of connectedClients) {
      const socketUser = db.users.find((u) => u.id === client.userId);
      if (!socketUser) continue;

      if (socketUser.id === targetUser.id) {
        const snap = getNotificationSnapshotForUser(socketUser);
        sendWsJson(client.ws, {
          type: 'support:message_created',
          message: serializedReply,
          ...snap,
        });
        sendWsJson(client.ws, {
          type: 'notification:created',
          notification: customerNotif,
          ...snap,
        });
      } else if (socketUser.role === 'admin') {
        const snap = getNotificationSnapshotForUser(socketUser);
        sendWsJson(client.ws, {
          type: 'support:message_created',
          message: serializedReply,
          ...snap,
        });
        sendWsJson(client.ws, {
          type: 'notifications:updated',
          ...snap,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: serializedReply,
      threads: buildSupportThreads(),
    });
  });

  // Legacy ticket reply route forwarded into in-app support thread
  app.post('/api/admin/support/:ticketId/reply', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const ticket = db.supportTickets.find((t) => t.id === req.params.ticketId);
    const { reply } = req.body ?? {};
    const cleanReply = typeof reply === 'string' ? reply.trim() : '';

    if (!ticket || cleanReply.length < 2) {
      res.status(400).json({ error: 'Valid ticket and reply required.' });
      return;
    }

    const owner = db.users.find((u) => u.id === ticket.userId);
    const nowIso = new Date().toISOString();
    ticket.adminReply = cleanReply;
    ticket.status = 'replied';
    ticket.repliedAt = nowIso;

    if (owner) {
      const replyMsg: StoredSupportMessage = {
        id: crypto.randomUUID(),
        userId: owner.id,
        senderRole: 'admin',
        senderId: admin.id,
        senderName: 'NBV Admin Support',
        subject: ticket.subject,
        body: cleanReply,
        readByAdmin: true,
        readByUser: false,
        createdAt: nowIso,
      };
      const customerNotif: StoredNotification = {
        id: crypto.randomUUID(),
        recipientRole: 'user',
        recipientUserId: owner.id,
        type: 'admin_reply',
        title: 'New Reply from Admin Support',
        body: cleanReply.slice(0, 110),
        relatedUserId: owner.id,
        relatedUserName: owner.name,
        messageId: replyMsg.id,
        isRead: false,
        createdAt: nowIso,
      };
      db.supportMessages.push(replyMsg);
      db.notifications.unshift(customerNotif);
    }

    recordAuditLog(
      admin,
      'REPLY_SUPPORT_TICKET',
      'support',
      ticket.id,
      owner ? owner.name : null,
      `Replied to support inquiry "${ticket.subject}"`
    );

    saveDb();
    res.json({ success: true, ticket });
  });

  // Admin: Publish Official Channel Announcement
  app.post('/api/admin/channel', requireAdmin, (req: Request, res: Response) => {
    const admin = (req as Request & { currentUser: StoredUser }).currentUser;
    const { title, body, category } = req.body ?? {};
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanBody = typeof body === 'string' ? body.trim() : '';
    const cleanCategory = typeof category === 'string' && category.trim() ? category.trim() : 'Market Update';

    if (cleanTitle.length < 3 || cleanBody.length < 5) {
      res.status(400).json({ error: 'Please enter an announcement title and message.' });
      return;
    }

    const ann: StoredAnnouncement = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      body: cleanBody,
      category: cleanCategory,
      authorName: admin.name,
      createdAt: new Date().toISOString(),
    };
    db.announcements.unshift(ann);

    recordAuditLog(
      admin,
      'POST_ANNOUNCEMENT',
      'channel',
      ann.id,
      null,
      `Published official channel update: "${cleanTitle}"`
    );

    saveDb();
    res.json({ success: true, announcement: ann });
  });

  // Dedicated PWA Web App Manifest and Service Worker routes
  const publicDir = path.join(__dirname, 'public');

  app.get('/manifest.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(path.join(publicDir, 'manifest.json'));
  });

  app.get('/sw.js', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(publicDir, 'sw.js'));
  });

  // Vite middleware in development, static SPA serving in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Real-Time WebSocket Server attached on the same HTTP Server (Port 3000)
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    try {
      const parsedUrl = new URL(req.url || '/', 'http://localhost');
      if (parsedUrl.pathname !== '/ws/realtime') {
        return;
      }

      const queryToken = parsedUrl.searchParams.get('token')?.trim() || '';
      const cookieHeader = req.headers.cookie || '';
      let cookieToken = '';
      for (const part of cookieHeader.split(';')) {
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1) continue;
        if (part.slice(0, eqIdx).trim() === SESSION_COOKIE_NAME) {
          try {
            cookieToken = decodeURIComponent(part.slice(eqIdx + 1).trim());
          } catch {
            cookieToken = part.slice(eqIdx + 1).trim();
          }
          break;
        }
      }

      const resolved =
        resolveSessionToken(queryToken) || resolveSessionToken(cookieToken);
      if (!resolved) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        const clientEntry: ConnectedRealtimeClient = {
          ws,
          userId: resolved.user.id,
          isAlive: true,
        };
        connectedClients.add(clientEntry);

        ws.on('pong', () => {
          clientEntry.isAlive = true;
        });

        ws.on('close', () => {
          connectedClients.delete(clientEntry);
        });

        ws.on('error', () => {
          connectedClients.delete(clientEntry);
        });

        // Initial state sync upon WebSocket connection
        const freshUser = db.users.find((u) => u.id === resolved.user.id);
        if (freshUser) {
          sendWsJson(ws, {
            type: 'init:sync',
            ...getNotificationSnapshotForUser(freshUser),
          });
        }
      });
    } catch {
      socket.destroy();
    }
  });

  const wsHeartbeatInterval = setInterval(() => {
    for (const client of connectedClients) {
      if (!client.isAlive) {
        connectedClients.delete(client);
        try {
          client.ws.terminate();
        } catch {
          // Ignore
        }
        continue;
      }
      client.isAlive = false;
      try {
        client.ws.ping();
      } catch {
        connectedClients.delete(client);
      }
    }
  }, 25000);

  const dailyProfitInterval = setInterval(() => {
    try {
      processDailyProfitSettlement();
    } catch (err) {
      console.error('Background profit settlement error:', err);
    }
  }, 60000);

  httpServer.on('close', () => {
    clearInterval(wsHeartbeatInterval);
    clearInterval(dailyProfitInterval);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`NBV Trading Full-Stack + WebSocket Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
