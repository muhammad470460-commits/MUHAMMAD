export interface TeamMemberItem {
  id: string;
  name: string;
  phoneMasked: string;
  joinedAt: string;
  investment: number;
  level: 1 | 2;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'user' | 'admin';
  referralCode: string;
  referredBy: string;
  balance: number;
  totalDeposits: number;
  totalWithdraw: number;
  pendingWithdrawals: number;
  pendingDepositsCount: number;
  activePlansCount: number;
  recentDeposits?: DepositRequestItem[];
  teamMembersCount: number;
  level1Count: number;
  level2Count: number;
  teamMembers: TeamMemberItem[];
  teamInvestment: number;
  totalEarnings: number;
  todayEarnings: number;
  teamCommission: number;
  totalInvestment?: number;
  dailyProfit?: number;
  nextProfitAt?: string | null;
  totalProfitEarned?: number;
  memberRank: string;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  code: string;
  section: 1 | 2 | 3 | 4;
  name: string;
  tierLabel: string;
  investmentAmount: number;
  projectedDailyProfit: number;
  profitRatePercent?: number;
  durationDays: number;
  level1BonusPercent: number;
  level2BonusPercent: number;
  isActive: boolean;
}

export interface PaymentReceivingConfig {
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
  secpRegistrationRef: string;
  secpDocumentUrl: string;
  secpDocumentMime: string;
}

export interface DepositRequestItem {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
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
  hasReceipt: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
}

export interface WithdrawalRequestItem {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  method: string;
  accountTitle: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
}

export interface ActiveUserPlan {
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
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'plan_profit' | 'referral_commission';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  description: string;
  referenceId: string;
  rejectionReason: string | null;
  createdAt: string;
}

export interface TransactionScreenshotItem {
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
  receiptUrl: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedReceiptItem {
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
  customBackgroundUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketItem {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  subject: string;
  message: string;
  status: 'open' | 'replied';
  adminReply: string | null;
  createdAt: string;
  repliedAt: string | null;
}

export interface SupportChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  senderRole: 'user' | 'admin';
  senderId: string;
  senderName: string;
  subject: string | null;
  body: string;
  readByAdmin: boolean;
  readByUser: boolean;
  createdAt: string;
}

export interface SupportThreadSummary {
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userBalance: number;
  lastMessageBody: string;
  lastMessageSenderRole: 'user' | 'admin';
  lastMessageAt: string;
  unreadForAdminCount: number;
  unreadForUserCount: number;
  totalMessagesCount: number;
}

export interface AppNotificationItem {
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

export interface ChannelAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string;
  authorName: string;
  createdAt: string;
}

export interface AdminAuditLogItem {
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

export type AppScreen =
  | 'welcome'
  | 'register'
  | 'login'
  | 'dashboard'
  | 'deposit_plans'
  | 'withdraw'
  | 'admin';

export type DashboardSectionModal =
  | null
  | 'withdraw'
  | 'withdraw_history'
  | 'my_plans'
  | 'my_team'
  | 'profit'
  | 'deposit_history'
  | 'android_app'
  | 'badges'
  | 'admin_support'
  | 'join_channel'
  | 'fbr_docs'
  | 'secp_docs'
  | 'my_profile';
