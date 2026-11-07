import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  Wallet,
  ArrowUpRight,
  ClipboardList,
  Settings,
  ShieldCheck,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  FileCheck2,
  Upload,
  Link2,
  Layers,
  LogOut,
  X,
  Bell,
  MessageCircle,
  Plus,
  Edit3,
  Image as ImageIcon,
  Trash2,
  CreditCard,
  Tag,
  Filter,
  Receipt,
  Download,
  FolderArchive,
} from 'lucide-react';
import { NbvShieldEmblem } from './NbvVisuals';
import { AdminReceiptGenerator } from './AdminReceiptGenerator';
import type {
  ActiveUserPlan,
  AdminAuditLogItem,
  AppNotificationItem,
  ChannelAnnouncement,
  DepositRequestItem,
  GeneratedReceiptItem,
  InvestmentPlan,
  LedgerTransaction,
  PaymentReceivingConfig,
  SupportChatMessage,
  SupportThreadSummary,
  TransactionScreenshotItem,
  UserProfile,
  WithdrawalRequestItem,
} from '../types';

export type AdminTab =
  | 'pending_deposits'
  | 'approved_deposits'
  | 'rejected_deposits'
  | 'payment_mgmt'
  | 'receipt_generator'
  | 'settings'
  | 'plans'
  | 'withdrawals'
  | 'overview'
  | 'users'
  | 'transactions'
  | 'support'
  | 'audit';

interface AdminPanelProps {
  authToken: string;
  currentAdmin: UserProfile;
  initialTab?: AdminTab;
  initialSupportUserId?: string | null;
  onClearInitialSupportTarget?: () => void;
  notifications?: AppNotificationItem[];
  unreadNotificationsCount?: number;
  unreadAdminSupportCount?: number;
  lastIncomingMessage?: SupportChatMessage | null;
  onMarkNotificationRead?: (id: string) => Promise<void>;
  onMarkAllNotificationsRead?: () => Promise<void>;
  onRefreshNotifications?: () => Promise<void>;
  onExitAdmin: () => void;
  onLogout?: () => void;
  onRefreshUser: () => Promise<void>;
}

function formatPkr(amount: number): string {
  return `Rs ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function ProtectedReceiptPreviewButton({
  deposit,
  authToken,
  busy,
  onInspect,
}: {
  deposit: DepositRequestItem;
  authToken: string;
  busy: boolean;
  onInspect: () => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    fetch(`/api/receipts/${deposit.id}`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.blob();
      })
      .then((blob) => {
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setThumbUrl(objectUrl);
      })
      .catch(() => {
        // Fallback button remains functional
      });
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [deposit.id, authToken]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onInspect}
      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#041f14] hover:bg-[#083824] border border-[#facc15]/45 text-xs font-bold text-[#fde047] flex items-center gap-2.5 cursor-pointer disabled:opacity-60"
    >
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={`Payment screenshot for ${deposit.packageCode}`}
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-lg object-cover border border-emerald-400/30 shrink-0"
        />
      ) : (
        <Eye className="w-4 h-4 shrink-0" />
      )}
      <span className="whitespace-nowrap">Review Screenshot</span>
    </button>
  );
}

export function AdminPanel({
  authToken,
  currentAdmin,
  initialTab,
  initialSupportUserId = null,
  onClearInitialSupportTarget,
  notifications = [],
  unreadNotificationsCount = 0,
  unreadAdminSupportCount = 0,
  lastIncomingMessage = null,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onRefreshNotifications,
  onExitAdmin,
  onLogout,
  onRefreshUser,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'pending_deposits');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRequestItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [activePlans, setActivePlans] = useState<ActiveUserPlan[]>([]);
  const [supportThreads, setSupportThreads] = useState<SupportThreadSummary[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([]);
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(
    initialSupportUserId || null
  );
  const [supportSearch, setSupportSearch] = useState('');
  const [adminReplyInput, setAdminReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);
  const adminChatEndRef = useRef<HTMLDivElement | null>(null);
  const [announcements, setAnnouncements] = useState<ChannelAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentReceivingConfig | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<'fbr' | 'secp' | null>(null);

  // Filters & Inline states
  const [withdrawalFilter, setWithdrawalFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);

  // Reject reason inline tracking
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Protected receipt preview modal
  const [receiptModal, setReceiptModal] = useState<{ url: string; deposit: DepositRequestItem } | null>(null);

  // Plan inline editing
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<{
    name: string;
    investmentAmount: string;
    projectedDailyProfit: string;
    durationDays: string;
    level1BonusPercent: string;
    level2BonusPercent: string;
    isActive: boolean;
  } | null>(null);

  // Payment & Transaction Management states
  const [screenshots, setScreenshots] = useState<TransactionScreenshotItem[]>([]);
  const [screenshotFilter, setScreenshotFilter] = useState<'all' | 'active' | 'complimentary' | 'retired'>('all');
  const [screenshotSearch, setScreenshotSearch] = useState('');
  const [editingScreenshotId, setEditingScreenshotId] = useState<string | null>(null);
  const [isCreatingScreenshot, setIsCreatingScreenshot] = useState(false);
  const [screenshotForm, setScreenshotForm] = useState<{
    customerName: string;
    customerPhone: string;
    paymentMethod: string;
    amount: string;
    transactionRef: string;
    category: 'active' | 'complimentary' | 'retired';
    notes: string;
    imageDataUrl: string | null;
  }>({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'JazzCash',
    amount: '',
    transactionRef: '',
    category: 'active',
    notes: '',
    imageDataUrl: null,
  });

  const [generatedReceipts, setGeneratedReceipts] = useState<GeneratedReceiptItem[]>([]);

  // Direct Deposit Payment Details inline editor
  const [editingDepositPaymentId, setEditingDepositPaymentId] = useState<string | null>(null);
  const [depositPaymentForm, setDepositPaymentForm] = useState<{
    senderAccountName: string;
    senderAccountNumber: string;
    transactionRef: string;
    paymentMethod: string;
    amount: string;
    receiptDataUrl: string | null;
  } | null>(null);

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialSupportUserId) {
      setSelectedSupportUserId(initialSupportUserId);
      setActiveTab('support');
      onClearInitialSupportTarget?.();
    }
  }, [initialTab, initialSupportUserId, onClearInitialSupportTarget]);

  const loadSupportThreadsOnly = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support/threads', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSupportThreads(data.threads || []);
      setSupportMessages(data.messages || []);
    } catch {
      // Ignore transient error
    }
  }, [authToken]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to load Admin overview.');
      const data = await res.json();
      setUsers(data.users || []);
      setDeposits(data.deposits || []);
      setWithdrawals(data.withdrawals || []);
      setTransactions(data.transactions || []);
      setPlans(data.plans || []);
      setActivePlans(data.activePlans || []);
      const fetchedThreads = (data.supportThreads || []) as SupportThreadSummary[];
      setSupportThreads(fetchedThreads);
      setSupportMessages(data.supportMessages || []);
      setSelectedSupportUserId((prev) => {
        if (prev) return prev;
        return fetchedThreads.length > 0 ? fetchedThreads[0].userId : null;
      });
      setAnnouncements(data.announcements || []);
      setAuditLogs(data.auditLogs || []);
      setPaymentConfig(data.paymentConfig || null);
      setScreenshots(data.transactionScreenshots || []);
      setGeneratedReceipts(data.generatedReceipts || []);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to fetch admin records.',
      });
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    return () => {
      if (receiptModal?.url) {
        URL.revokeObjectURL(receiptModal.url);
      }
    };
  }, [receiptModal]);

  async function handleInspectReceipt(deposit: DepositRequestItem) {
    setBusyId(deposit.id);
    try {
      const res = await fetch(`/api/receipts/${deposit.id}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        setActionMessage({ type: 'error', text: 'Could not load uploaded payment receipt.' });
        return;
      }
      const blob = await res.blob();
      if (receiptModal?.url) {
        URL.revokeObjectURL(receiptModal.url);
      }
      setReceiptModal({ url: URL.createObjectURL(blob), deposit });
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproveDeposit(depositId: string) {
    setBusyId(depositId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to approve deposit.' });
        return;
      }
      setActionMessage({
        type: 'success',
        text: `APPROVED: ${data.deposit.packageCode} (${formatPkr(data.deposit.amount)}) — Customer wallet balance updated automatically and 90-day plan activated.`,
      });
      if (receiptModal?.deposit.id === depositId) {
        setReceiptModal(null);
      }
      await Promise.all([loadOverview(), onRefreshUser()]);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectDeposit(depositId: string) {
    const finalReason =
      rejectReason.trim().length >= 2
        ? rejectReason.trim()
        : 'Payment screenshot or Transaction ID could not be verified.';
    setBusyId(depositId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: finalReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to reject deposit.' });
        return;
      }
      setRejectingId(null);
      setRejectReason('');
      if (receiptModal?.deposit.id === depositId) {
        setReceiptModal(null);
      }
      setActionMessage({
        type: 'success',
        text: 'REJECTED: Deposit status changed to Rejected. Customer wallet balance was NOT increased and plan was NOT activated.',
      });
      await Promise.all([loadOverview(), onRefreshUser()]);
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproveWithdrawal(withdrawalId: string) {
    setBusyId(withdrawalId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to approve withdrawal.' });
        return;
      }
      setActionMessage({
        type: 'success',
        text: 'APPROVED: Withdrawal authorized and deducted from customer available balance.',
      });
      await Promise.all([loadOverview(), onRefreshUser()]);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectWithdrawal(withdrawalId: string) {
    const finalReason =
      rejectReason.trim() || 'Withdrawal request could not be verified by Admin.';
    setBusyId(withdrawalId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: finalReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to reject withdrawal.' });
        return;
      }
      setRejectingId(null);
      setRejectReason('');
      setActionMessage({
        type: 'success',
        text: 'REJECTED: Withdrawal declined. Customer wallet balance remained unchanged.',
      });
      await Promise.all([loadOverview(), onRefreshUser()]);
    } finally {
      setBusyId(null);
    }
  }

  function handleOfficialDocFileSelect(
    docType: 'fbr' | 'secp',
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setActionMessage({
        type: 'error',
        text: 'Allowed document formats: JPG, PNG, WEBP, or PDF.',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionMessage({
        type: 'error',
        text: 'Document file must be smaller than 5 MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setUploadingDocType(docType);
      setActionMessage(null);
      try {
        const res = await fetch('/api/admin/settings/document-upload', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            docType,
            fileDataUrl: reader.result,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setActionMessage({
            type: 'error',
            text: data.error || `Failed to upload ${docType.toUpperCase()} document.`,
          });
          return;
        }
        if (data.paymentConfig) {
          setPaymentConfig(data.paymentConfig);
        }
        setActionMessage({
          type: 'success',
          text: `Official ${docType.toUpperCase()} document uploaded and updated immediately for all customers.`,
        });
      } catch {
        setActionMessage({
          type: 'error',
          text: `Network error while uploading ${docType.toUpperCase()} document.`,
        });
      } finally {
        setUploadingDocType(null);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleDistributeDailyProfit() {
    setBusyId('distribute');
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/plans/distribute-profit', {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'No active plans eligible.' });
        return;
      }
      setActionMessage({
        type: 'success',
        text: `Distributed ${formatPkr(data.totalDistributed)} verified daily profit across ${data.creditedCount} active plan(s).`,
      });
      await Promise.all([loadOverview(), onRefreshUser()]);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSavePlan(planId: string) {
    if (!planForm) return;
    setBusyId(planId);
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: planForm.name,
          investmentAmount: Number(planForm.investmentAmount),
          projectedDailyProfit: Number(planForm.projectedDailyProfit),
          durationDays: Number(planForm.durationDays),
          level1BonusPercent: Number(planForm.level1BonusPercent),
          level2BonusPercent: Number(planForm.level2BonusPercent),
          isActive: planForm.isActive,
        }),
      });
      if (res.ok) {
        setEditingPlanId(null);
        setPlanForm(null);
        setActionMessage({ type: 'success', text: 'Investment package updated successfully.' });
        await loadOverview();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleSavePaymentSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentConfig) return;
    setBusyId('payment-config');
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/settings/payment', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(paymentConfig),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.paymentConfig) {
          setPaymentConfig(data.paymentConfig);
        }
        setActionMessage({
          type: 'success',
          text: 'Saved! All deposit payment methods, deposit phone numbers, Admin/Support numbers, Join Channel link, and FBR/SECP references have been updated.',
        });
        await loadOverview();
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || 'Could not save settings.',
        });
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateScreenshot(e: React.FormEvent) {
    e.preventDefault();
    if (!screenshotForm.imageDataUrl) {
      setActionMessage({
        type: 'error',
        text: 'Please upload a transaction screenshot image.',
      });
      return;
    }
    setBusyId('create-screenshot');
    try {
      const res = await fetch('/api/admin/screenshots', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(screenshotForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({
          type: 'error',
          text: data.error || 'Could not save transaction screenshot.',
        });
        return;
      }
      setIsCreatingScreenshot(false);
      setScreenshotForm({
        customerName: '',
        customerPhone: '',
        paymentMethod: 'JazzCash',
        amount: '',
        transactionRef: '',
        category: 'active',
        notes: '',
        imageDataUrl: null,
      });
      setActionMessage({
        type: 'success',
        text: 'Transaction screenshot created and stored successfully.',
      });
      await loadOverview();
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdateScreenshot(id: string, e: React.FormEvent) {
    e.preventDefault();
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/screenshots/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(screenshotForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({
          type: 'error',
          text: data.error || 'Could not update transaction screenshot.',
        });
        return;
      }
      setEditingScreenshotId(null);
      setActionMessage({
        type: 'success',
        text: 'Transaction screenshot updated and saved.',
      });
      await loadOverview();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteScreenshot(id: string) {
    if (!window.confirm('Are you sure you want to delete this transaction screenshot?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/screenshots/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: 'Screenshot removed from management.',
        });
        await loadOverview();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveDepositPaymentDetails(depositId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!depositPaymentForm) return;
    setBusyId(depositId);
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/edit-payment`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(depositPaymentForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({
          type: 'error',
          text: data.error || 'Could not update deposit payment details.',
        });
        return;
      }
      setEditingDepositPaymentId(null);
      setDepositPaymentForm(null);
      setActionMessage({
        type: 'success',
        text: 'Customer deposit and payment details updated successfully.',
      });
      await loadOverview();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleUserRole(target: UserProfile) {
    const nextRole = target.role === 'admin' ? 'user' : 'admin';
    setBusyId(target.id);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/role`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Could not update role.' });
        return;
      }
      setSelectedUserDetail(data.profile);
      await loadOverview();
    } finally {
      setBusyId(null);
    }
  }

  const markSupportThreadRead = useCallback(
    async (customerUserId: string) => {
      try {
        const res = await fetch(`/api/admin/support/threads/${customerUserId}/read`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.threads)) {
            setSupportThreads(data.threads);
          }
          setSupportMessages((prev) =>
            prev.map((m) =>
              m.userId === customerUserId && m.senderRole === 'user'
                ? { ...m, readByAdmin: true }
                : m
            )
          );
          void onRefreshNotifications?.();
        }
      } catch {
        // Ignore transient network errors
      }
    },
    [authToken, onRefreshNotifications]
  );

  // Real-time incoming customer message handler inside Admin Panel
  useEffect(() => {
    if (!lastIncomingMessage) return;
    setSupportMessages((prev) =>
      prev.some((m) => m.id === lastIncomingMessage.id)
        ? prev
        : [...prev, lastIncomingMessage]
    );
    setSelectedSupportUserId((prev) => prev || lastIncomingMessage.userId);
    void loadSupportThreadsOnly();

    if (
      activeTab === 'support' &&
      selectedSupportUserId === lastIncomingMessage.userId &&
      lastIncomingMessage.senderRole === 'user'
    ) {
      void markSupportThreadRead(lastIncomingMessage.userId);
    }
  }, [
    lastIncomingMessage,
    activeTab,
    selectedSupportUserId,
    loadSupportThreadsOnly,
    markSupportThreadRead,
  ]);

  // Mark selected thread read when viewing in Support tab
  useEffect(() => {
    if (activeTab !== 'support' || !selectedSupportUserId) return;
    const thread = supportThreads.find((t) => t.userId === selectedSupportUserId);
    if (thread && thread.unreadForAdminCount > 0) {
      void markSupportThreadRead(selectedSupportUserId);
    }
  }, [activeTab, selectedSupportUserId, supportThreads, markSupportThreadRead]);

  const activeThreadMessages = supportMessages.filter(
    (m) => m.userId === selectedSupportUserId
  );

  useEffect(() => {
    if (activeTab !== 'support') return;
    adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, selectedSupportUserId, activeThreadMessages.length]);

  async function handleSendAdminReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupportUserId) return;
    const cleanReply = adminReplyInput.trim();
    if (!cleanReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(
        `/api/admin/support/messages/${selectedSupportUserId}/reply`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ body: cleanReply }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({
          type: 'error',
          text: data.error || 'Could not send support reply.',
        });
        return;
      }
      if (data.message) {
        const sentReply = data.message as SupportChatMessage;
        setSupportMessages((prev) =>
          prev.some((m) => m.id === sentReply.id) ? prev : [...prev, sentReply]
        );
      }
      if (Array.isArray(data.threads)) {
        setSupportThreads(data.threads);
      }
      setAdminReplyInput('');
      void onRefreshNotifications?.();
    } finally {
      setSendingReply(false);
    }
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    setBusyId('ann');
    try {
      const res = await fetch('/api/admin/channel', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: annTitle.trim(), body: annBody.trim() }),
      });
      if (res.ok) {
        setAnnTitle('');
        setAnnBody('');
        setActionMessage({ type: 'success', text: 'Announcement published to Official Channel.' });
        await loadOverview();
      }
    } finally {
      setBusyId(null);
    }
  }

  const pendingDepositsList = deposits.filter((d) => d.status === 'pending');
  const approvedDepositsList = deposits.filter((d) => d.status === 'approved');
  const rejectedDepositsList = deposits.filter((d) => d.status === 'rejected');

  const pendingDepositsCount = pendingDepositsList.length;
  const approvedDepositsCount = approvedDepositsList.length;
  const rejectedDepositsCount = rejectedDepositsList.length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const totalVerifiedDeposits = approvedDepositsList.reduce((sum, d) => sum + d.amount, 0);
  const totalApprovedWithdrawals = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  const visibleWithdrawals =
    withdrawalFilter === 'all'
      ? withdrawals
      : withdrawals.filter((w) => w.status === withdrawalFilter);
  const visibleUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.referralCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen w-full bg-[#031910] text-white pb-12">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#042416]/95 backdrop-blur-md border-b border-emerald-400/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitAdmin}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/30 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>User Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <NbvShieldEmblem size={34} />
              <span className="font-display text-base sm:text-xl font-extrabold tracking-wide whitespace-nowrap">
                NBV <span className="text-[#facc15]">ADMIN PANEL</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-emerald-200/80">
              Signed in: <strong className="text-white">{currentAdmin.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setAdminNotifOpen(true)}
              aria-label="Open admin notifications"
              className="relative min-h-[40px] px-3 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/25 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#facc15]" />
              <span className="hidden sm:inline">Alerts</span>
              {(unreadAdminSupportCount > 0 || unreadNotificationsCount > 0) && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-md bg-[#facc15] text-[#042416] text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                  {Math.max(unreadAdminSupportCount, unreadNotificationsCount)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => void loadOverview()}
              className="min-h-[40px] px-3 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/25 text-xs font-semibold text-emerald-100 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[40px] px-3 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/25 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Admin Navigation Bar — Includes 3 Separate Deposit Workflow Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
          {[
            {
              id: 'pending_deposits' as const,
              label: `Pending Deposits (${pendingDepositsCount})`,
              icon: Wallet,
            },
            {
              id: 'approved_deposits' as const,
              label: `Approved Deposits (${approvedDepositsCount})`,
              icon: CheckCircle2,
            },
            {
              id: 'rejected_deposits' as const,
              label: `Rejected Deposits (${rejectedDepositsCount})`,
              icon: XCircle,
            },
            {
              id: 'support' as const,
              label:
                unreadAdminSupportCount > 0
                  ? `Support Messages (${unreadAdminSupportCount} New)`
                  : `Support & Channel (${supportThreads.length})`,
              icon: MessageCircle,
            },
            {
              id: 'payment_mgmt' as const,
              label: `Payment & Transaction Management (${screenshots.length})`,
              icon: CreditCard,
            },
            {
              id: 'receipt_generator' as const,
              label: `Receipt Generator (${generatedReceipts.length})`,
              icon: Receipt,
            },
            {
              id: 'settings' as const,
              label: 'Gateways, Channel & Docs',
              icon: Settings,
            },
            {
              id: 'plans' as const,
              label: 'Deposit Plans (NBV-01–20)',
              icon: Layers,
            },
            {
              id: 'withdrawals' as const,
              label: `Withdrawals (${pendingWithdrawalsCount})`,
              icon: ArrowUpRight,
            },
            { id: 'overview' as const, label: 'Overview', icon: ShieldCheck },
            { id: 'users' as const, label: `Users (${users.length})`, icon: Users },
            { id: 'transactions' as const, label: 'Transactions', icon: ClipboardList },
            { id: 'audit' as const, label: 'Audit Log', icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            const hasUnreadAlert = tab.id === 'support' && unreadAdminSupportCount > 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#facc15] text-[#042416]'
                    : hasUnreadAlert
                      ? 'bg-[#0b4f33] text-[#fde047] border border-[#facc15]/60 hover:bg-[#0e603e]'
                      : 'bg-[#06321f] text-emerald-100 border border-emerald-400/20 hover:bg-[#094229]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {actionMessage && (
          <div
            className={`rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-900/70 border border-[#6EE730]/50 text-emerald-50'
                : 'bg-red-950/75 border border-red-400/50 text-red-100'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-xs underline ml-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
              <button
                type="button"
                onClick={() => setActiveTab('pending_deposits')}
                className="rounded-2xl bg-[#06321f] hover:bg-[#083f27] border border-[#facc15]/45 p-4 text-left transition-colors cursor-pointer"
              >
                <p className="text-xs text-[#fde047]">1. Pending Deposits</p>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#facc15] tabular-nums mt-1">
                  {pendingDepositsCount}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approved_deposits')}
                className="rounded-2xl bg-[#06321f] hover:bg-[#083f27] border border-emerald-400/35 p-4 text-left transition-colors cursor-pointer"
              >
                <p className="text-xs text-emerald-200/85">2. Approved Deposits ({approvedDepositsCount})</p>
                <p className="font-display text-xl sm:text-2xl font-extrabold text-[#6EE730] tabular-nums mt-1">
                  {formatPkr(totalVerifiedDeposits)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rejected_deposits')}
                className="rounded-2xl bg-[#06321f] hover:bg-[#083f27] border border-red-400/35 p-4 text-left transition-colors cursor-pointer"
              >
                <p className="text-xs text-red-200/85">3. Rejected Deposits</p>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-red-400 tabular-nums mt-1">
                  {rejectedDepositsCount}
                </p>
              </button>
              <div className="rounded-2xl bg-[#06321f] border border-emerald-400/30 p-4">
                <p className="text-xs text-emerald-200/75">Registered Users</p>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-white tabular-nums mt-1">
                  {users.length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#06321f] border border-amber-400/40 p-4">
                <p className="text-xs text-amber-200">Pending Withdrawal Requests</p>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-amber-300 tabular-nums mt-1">
                  {pendingWithdrawalsCount}
                </p>
              </div>
              <div className="rounded-2xl bg-[#06321f] border border-emerald-400/30 p-4">
                <p className="text-xs text-emerald-200/75">Active 90-Day Plans / Withdrawals</p>
                <p className="font-display text-lg sm:text-xl font-extrabold text-[#6EE730] tabular-nums mt-1">
                  {activePlans.filter((p) => p.status === 'active').length} Plans · {formatPkr(totalApprovedWithdrawals)}
                </p>
              </div>
            </div>

            {/* Verified Daily Profit Settlement Control */}
            <div className="rounded-3xl bg-gradient-to-r from-[#073b25] to-[#05291a] border border-[#facc15]/45 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-extrabold text-white">
                  Daily Plan Profit Settlement
                </h2>
                <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                  Credits 1 day of verified trading profit to each currently active 90-day user plan and records
                  auditable ledger entries.
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === 'distribute'}
                onClick={handleDistributeDailyProfit}
                className="min-h-[46px] px-5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-[#042416] font-bold text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {busyId === 'distribute' ? 'Processing...' : 'Post Daily Profit to Active Plans'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 3-STAGE DEPOSIT TABS: (1) PENDING DEPOSITS, (2) APPROVED DEPOSITS, (3) REJECTED DEPOSITS */}
        {(activeTab === 'pending_deposits' ||
          activeTab === 'approved_deposits' ||
          activeTab === 'rejected_deposits') && (
          <div className="space-y-4">
            {/* Dedicated 3-Tab Switcher Header */}
            <div className="rounded-2xl bg-[#06321f] border border-emerald-400/25 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                  {activeTab === 'pending_deposits'
                    ? '1. Pending Deposits — Awaiting Admin Verification'
                    : activeTab === 'approved_deposits'
                      ? '2. Approved Deposits — Wallet Updated & Plan Activated'
                      : '3. Rejected Deposits — Balance Unchanged & Plan Inactive'}
                </h2>
                <p className="text-xs text-emerald-100/75 mt-0.5">
                  {activeTab === 'pending_deposits'
                    ? 'Every new customer deposit arrives here first as PENDING. Review screenshot, TID, customer details, and amount before clicking APPROVE or REJECT.'
                    : activeTab === 'approved_deposits'
                      ? 'Verified deposits approved by Admin. Customer wallet balance and 90-day investment plan were activated automatically.'
                      : 'Declined deposits where payment was invalid or not received. Customer wallet balance did NOT increase and plan did NOT activate.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending_deposits')}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'pending_deposits'
                      ? 'bg-[#facc15] text-[#042416]'
                      : 'bg-[#041f14] text-emerald-100 border border-emerald-400/20 hover:bg-[#083824]'
                  }`}
                >
                  Pending ({pendingDepositsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('approved_deposits')}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'approved_deposits'
                      ? 'bg-[#10b956] text-white'
                      : 'bg-[#041f14] text-emerald-100 border border-emerald-400/20 hover:bg-[#083824]'
                  }`}
                >
                  Approved ({approvedDepositsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rejected_deposits')}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'rejected_deposits'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#041f14] text-emerald-100 border border-emerald-400/20 hover:bg-[#083824]'
                  }`}
                >
                  Rejected ({rejectedDepositsCount})
                </button>
              </div>
            </div>

            {(() => {
              const stageDeposits =
                activeTab === 'pending_deposits'
                  ? pendingDepositsList
                  : activeTab === 'approved_deposits'
                    ? approvedDepositsList
                    : rejectedDepositsList;

              if (stageDeposits.length === 0) {
                return (
                  <div className="rounded-2xl bg-[#06321f] border border-emerald-400/20 p-8 text-center text-sm text-emerald-200/75">
                    {activeTab === 'pending_deposits'
                      ? 'No pending deposit requests right now. New customer deposits automatically appear here as PENDING.'
                      : activeTab === 'approved_deposits'
                        ? 'No approved deposit records yet.'
                        : 'No rejected deposit records.'}
                  </div>
                );
              }

              return (
                <div className="space-y-3.5">
                  {stageDeposits.map((dep) => {
                    const customerProfile = users.find((u) => u.id === dep.userId);
                    return (
                      <div
                        key={dep.id}
                        className="rounded-2xl bg-[#06321f] border border-emerald-400/30 p-4 sm:p-5 space-y-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* Left: Customer Details, Package, Deposit Amount, TID */}
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-display text-xl font-extrabold text-[#facc15]">
                                {dep.packageCode}
                              </span>
                              <span className="text-emerald-300/60" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-display text-xl font-extrabold text-white tabular-nums">
                                {formatPkr(dep.amount)}
                              </span>
                              <span className="text-emerald-300/60" aria-hidden="true">
                                ·
                              </span>
                              <span
                                className={`text-xs font-extrabold uppercase tracking-wider ${
                                  dep.status === 'approved'
                                    ? 'text-[#6EE730]'
                                    : dep.status === 'rejected'
                                      ? 'text-red-400'
                                      : 'text-[#facc15]'
                                }`}
                              >
                                Status: {dep.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-[#041f14] border border-emerald-400/15 p-3 text-xs">
                              <div>
                                <p className="text-emerald-200/65">Customer Details</p>
                                <p className="text-sm font-bold text-white mt-0.5">{dep.userName}</p>
                                <p className="text-emerald-100/85 tabular-nums">
                                  Phone: {dep.userPhone || customerProfile?.phone || 'N/A'}
                                </p>
                                {customerProfile?.email && (
                                  <p className="text-emerald-200/70 truncate">Email: {customerProfile.email}</p>
                                )}
                              </div>

                              <div>
                                <p className="text-emerald-200/65">Payment &amp; Transaction ID</p>
                                <p className="text-sm font-bold text-white mt-0.5">
                                  Gateway: <span className="text-[#facc15]">{dep.paymentMethod}</span>
                                </p>
                                <p className="text-emerald-100/90 mt-0.5">
                                  TID:{' '}
                                  <span className="font-mono font-bold text-[#6EE730] select-all">
                                    {dep.transactionRef}
                                  </span>
                                </p>
                                <p className="text-emerald-200/70 tabular-nums">
                                  Plan Term: {dep.durationDays} Days · Est. Daily {formatPkr(dep.projectedDailyProfit)}
                                </p>
                              </div>
                            </div>

                            <p className="text-[11px] text-emerald-200/60 tabular-nums">
                              Submitted: {formatDateTime(dep.createdAt)}
                              {dep.reviewedAt ? ` · Reviewed: ${formatDateTime(dep.reviewedAt)}` : ''}
                              {dep.reviewedByName ? ` by ${dep.reviewedByName}` : ''}
                            </p>
                          </div>

                          {/* Right: Authenticated Screenshot Thumbnail + Review / APPROVE / REJECT Actions */}
                          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
                            {dep.hasReceipt && (
                              <ProtectedReceiptPreviewButton
                                deposit={dep}
                                authToken={authToken}
                                busy={busyId === dep.id}
                                onInspect={() => handleInspectReceipt(dep)}
                              />
                            )}

                            {dep.status === 'pending' && (
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  disabled={busyId === dep.id}
                                  onClick={() => handleApproveDeposit(dep.id)}
                                  className="min-h-[44px] px-5 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>APPROVE</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === dep.id}
                                  onClick={() => {
                                    setRejectingId(rejectingId === dep.id ? null : dep.id);
                                    setRejectReason('Payment screenshot or Transaction ID could not be verified.');
                                  }}
                                  className="min-h-[44px] px-5 rounded-xl bg-red-600 hover:bg-red-500 text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>REJECT</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {dep.status === 'approved' && (
                          <div className="rounded-xl bg-emerald-950/60 border border-[#6EE730]/35 px-3.5 py-2 text-xs text-emerald-100">
                            <strong>Approved:</strong> Customer wallet balance increased by {formatPkr(dep.amount)} and{' '}
                            <strong>{dep.packageCode}</strong> ({dep.durationDays} Days) plan is active.
                          </div>
                        )}

                        {dep.status === 'rejected' && (
                          <div className="rounded-xl bg-red-950/60 border border-red-400/35 px-3.5 py-2 text-xs text-red-200">
                            <strong>Rejected:</strong> {dep.rejectionReason || 'Payment not verified.'} (Customer wallet
                            balance unchanged; plan not activated.)
                          </div>
                        )}

                        {rejectingId === dep.id && dep.status === 'pending' && (
                          <div className="rounded-xl bg-[#041f14] border border-red-400/45 p-3.5 flex flex-col sm:flex-row gap-2.5">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Rejection reason (optional)"
                              className="flex-1 min-h-[42px] px-3 rounded-lg bg-[#06321f] border border-emerald-400/25 text-xs text-white focus:outline-none focus:border-red-400"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={busyId === dep.id}
                                onClick={() => handleRejectDeposit(dep.id)}
                                className="min-h-[42px] px-4 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-extrabold text-white cursor-pointer whitespace-nowrap"
                              >
                                Confirm REJECT
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                                className="min-h-[42px] px-3 rounded-lg bg-[#083c26] text-xs font-semibold text-emerald-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: WITHDRAWAL REQUESTS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setWithdrawalFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer ${
                    withdrawalFilter === st
                      ? 'bg-[#10b956] text-white'
                      : 'bg-[#06321f] text-emerald-200 border border-emerald-400/20'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {visibleWithdrawals.length === 0 ? (
              <div className="rounded-2xl bg-[#06321f] border border-emerald-400/20 p-8 text-center text-sm text-emerald-200/75">
                No {withdrawalFilter} withdrawal requests found.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleWithdrawals.map((wd) => {
                  const customerRecord = users.find((u) => u.id === wd.userId);
                  return (
                    <div
                      key={wd.id}
                      className="rounded-2xl bg-[#06321f] border border-emerald-400/30 p-4 sm:p-5 space-y-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <p className="font-display text-xl font-extrabold text-[#facc15] tabular-nums">
                              {formatPkr(wd.amount)}
                            </p>
                            <span
                              className={`text-xs font-extrabold uppercase tracking-wider ${
                                wd.status === 'approved'
                                  ? 'text-[#6EE730]'
                                  : wd.status === 'rejected'
                                    ? 'text-red-300'
                                    : 'text-amber-300'
                              }`}
                            >
                              · {wd.status}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-100">
                            Customer: <strong>{wd.userName}</strong> ({wd.userPhone}) · ID:{' '}
                            <span className="font-mono text-emerald-200/90">
                              {wd.userId.slice(0, 8)}
                            </span>
                          </p>
                          {customerRecord && (
                            <p className="text-xs text-emerald-200/85 tabular-nums">
                              Customer Available Balance:{' '}
                              <strong className="text-[#6EE730]">
                                {formatPkr(customerRecord.balance)}
                              </strong>
                            </p>
                          )}
                          <p className="text-[11px] text-emerald-200/55">
                            Requested: {formatDateTime(wd.createdAt)}
                          </p>
                        </div>

                        {wd.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busyId === wd.id}
                              onClick={() => handleApproveWithdrawal(wd.id)}
                              className="min-h-[40px] px-4 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve Payout</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(rejectingId === wd.id ? null : wd.id);
                                setRejectReason('');
                              }}
                              className="min-h-[40px] px-4 rounded-xl bg-red-900/75 hover:bg-red-800 border border-red-400/40 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl bg-[#041f14] border border-emerald-400/20 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <p className="text-[11px] text-emerald-200/65">Payment Method</p>
                          <p className="font-bold text-white mt-0.5">{wd.method}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-emerald-200/65">Account Number</p>
                          <p className="font-mono font-bold text-[#facc15] tabular-nums mt-0.5">
                            {wd.accountNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-emerald-200/65">Account Holder Name</p>
                          <p className="font-bold text-white mt-0.5">{wd.accountTitle}</p>
                        </div>
                      </div>

                      {wd.status === 'rejected' && wd.rejectionReason && (
                        <div className="rounded-xl bg-red-950/60 border border-red-400/35 px-3.5 py-2 text-xs text-red-200">
                          <strong>Rejection Reason:</strong> {wd.rejectionReason}
                        </div>
                      )}

                      {rejectingId === wd.id && (
                        <div className="rounded-xl bg-[#041f14] border border-red-400/45 p-3.5 flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Optional rejection reason (e.g. Invalid account details)"
                            className="flex-1 min-h-[40px] px-3 rounded-lg bg-[#06321f] border border-emerald-400/25 text-xs text-white focus:outline-none focus:border-red-400"
                          />
                          <button
                            type="button"
                            disabled={busyId === wd.id}
                            onClick={() => handleRejectWithdrawal(wd.id)}
                            className="min-h-[40px] px-4 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USERS & USER PROFILES */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-emerald-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, phone, email, or referral code..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#06321f] border border-emerald-400/30 text-sm text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-emerald-400/25 bg-[#06321f]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#041f14] text-emerald-200/80 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Phone / Email</th>
                    <th className="px-4 py-3">Referred By</th>
                    <th className="px-4 py-3 text-right">Verified Balance</th>
                    <th className="px-4 py-3 text-right">Deposits</th>
                    <th className="px-4 py-3 text-right">Team</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-400/15">
                  {visibleUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#083e27]">
                      <td className="px-4 py-3 font-bold text-white">{u.name}</td>
                      <td className="px-4 py-3 text-emerald-100/85 tabular-nums">
                        <div>{u.phone}</div>
                        <div className="text-[11px] text-emerald-200/60">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-[#facc15] font-medium">{u.referredBy}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#facc15] tabular-nums">
                        {formatPkr(u.balance)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#6EE730] font-semibold tabular-nums">
                        {formatPkr(u.totalDeposits)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{u.teamMembersCount}</td>
                      <td className="px-4 py-3 uppercase text-xs font-bold text-emerald-200">
                        {u.role}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetail(u)}
                          className="px-3 py-1.5 rounded-lg bg-[#041f14] hover:bg-[#0b4f33] border border-emerald-400/30 text-xs font-semibold text-white cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: COMPLETE TRANSACTION HISTORY */}
        {activeTab === 'transactions' && (
          <div className="space-y-2.5">
            {transactions.length === 0 ? (
              <div className="rounded-2xl bg-[#06321f] border border-emerald-400/20 p-8 text-center text-sm text-emerald-200/75">
                No financial transactions recorded yet.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl bg-[#06321f] border border-emerald-400/25 p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {tx.title} — <span className="text-[#facc15]">{tx.userName}</span>
                    </p>
                    <p className="text-xs text-emerald-200/75 mt-0.5">{tx.description}</p>
                    <p className="text-[11px] text-emerald-200/55 mt-0.5">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-extrabold text-[#facc15] tabular-nums">
                      {formatPkr(tx.amount)}
                    </p>
                    <p className="text-xs font-bold uppercase text-emerald-200 mt-0.5">
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: PAYMENT & TRANSACTION MANAGEMENT (ADMIN FULL EDIT & SAVE ACCESS) */}
        {activeTab === 'payment_mgmt' && (
          <div className="space-y-6">
            {/* Header Banner with Add Screenshot Button */}
            <div className="rounded-3xl bg-gradient-to-r from-[#063823] via-[#09472d] to-[#06301e] border border-[#facc15]/45 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#facc15]" />
                  <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#facc15]">
                    ADMIN CONTROL SUITE
                  </p>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white mt-1">
                  Payment &amp; Transaction Management
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                  Full Admin control: add, edit, or change receiving payment gateway details (bank accounts, phone numbers, holder titles); upload and edit transaction screenshots; update customer names &amp; TID amounts; and organize active, complimentary, and retired transaction screenshots.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingScreenshot(true);
                    setEditingScreenshotId(null);
                    setScreenshotForm({
                      customerName: '',
                      customerPhone: '',
                      paymentMethod: 'JazzCash',
                      amount: '',
                      transactionRef: '',
                      category: 'active',
                      notes: '',
                      imageDataUrl: null,
                    });
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-[#10b956] to-[#059669] hover:brightness-105 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload / Add Screenshot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="min-h-[44px] px-4 rounded-xl bg-[#041f14] hover:bg-[#073622] border border-emerald-400/30 text-xs sm:text-sm font-bold text-[#fde047] flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Settings className="w-4 h-4" />
                  <span>Deposit Gateways &amp; Numbers</span>
                </button>
              </div>
            </div>

            {/* Create / Edit Screenshot Modal or Form Card */}
            {(isCreatingScreenshot || editingScreenshotId) && (
              <form
                onSubmit={(e) => {
                  if (editingScreenshotId) {
                    void handleUpdateScreenshot(editingScreenshotId, e);
                  } else {
                    void handleCreateScreenshot(e);
                  }
                }}
                className="rounded-3xl bg-[#042416] border-2 border-[#facc15]/60 p-5 sm:p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-emerald-400/20">
                  <div className="flex items-center gap-2.5">
                    <Edit3 className="w-5 h-5 text-[#facc15]" />
                    <h2 className="font-display text-lg font-extrabold text-white">
                      {editingScreenshotId
                        ? 'Edit Payment Transaction Screenshot & Details'
                        : 'Upload & Create New Payment / Transaction Screenshot'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingScreenshot(false);
                      setEditingScreenshotId(null);
                    }}
                    className="w-9 h-9 rounded-xl bg-[#073622] flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block text-emerald-200 mb-1 font-semibold">
                      Customer Name <span className="text-[#facc15]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={screenshotForm.customerName}
                      onChange={(e) =>
                        setScreenshotForm({ ...screenshotForm, customerName: e.target.value })
                      }
                      placeholder="e.g. MUHAMMAD NAEEM"
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#03180f] border border-emerald-400/30 text-white font-medium focus:outline-none focus:border-[#facc15]"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-200 mb-1 font-semibold">
                      Customer Phone Number
                    </label>
                    <input
                      type="text"
                      value={screenshotForm.customerPhone}
                      onChange={(e) =>
                        setScreenshotForm({ ...screenshotForm, customerPhone: e.target.value })
                      }
                      placeholder="e.g. 03084704644"
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#03180f] border border-emerald-400/30 text-white font-mono tabular-nums focus:outline-none focus:border-[#facc15]"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-200 mb-1 font-semibold">
                      Payment Method <span className="text-[#facc15]">*</span>
                    </label>
                    <select
                      value={screenshotForm.paymentMethod}
                      onChange={(e) =>
                        setScreenshotForm({ ...screenshotForm, paymentMethod: e.target.value })
                      }
                      className="w-full min-h-[42px] px-3 rounded-xl bg-[#03180f] border border-emerald-400/30 text-white font-medium focus:outline-none focus:border-[#facc15]"
                    >
                      <option value="JazzCash">JazzCash</option>
                      <option value="Easypaisa">Easypaisa</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Meezan Bank">Meezan Bank</option>
                      <option value="Other Wallet">Other Wallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-emerald-200 mb-1 font-semibold">
                      Amount (Rs) <span className="text-[#facc15]">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={screenshotForm.amount}
                      onChange={(e) =>
                        setScreenshotForm({ ...screenshotForm, amount: e.target.value })
                      }
                      placeholder="e.g. 14615"
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#03180f] border border-emerald-400/30 text-white font-bold tabular-nums focus:outline-none focus:border-[#facc15]"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-200 mb-1 font-semibold">
                      Transaction ID (TID)
                    </label>
                    <input
                      type="text"
                      value={screenshotForm.transactionRef}
                      onChange={(e) =>
                        setScreenshotForm({ ...screenshotForm, transactionRef: e.target.value })
                      }
                      placeholder="e.g. 728057293613"
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#03180f] border border-emerald-400/30 text-white font-mono focus:outline-none focus:border-[#facc15]"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-200 mb-1 font-semibold">
                      Category (Active / Complimentary / Retired)
                    </label>
                    <select
                      value={screenshotForm.category}
                      onChange={(e) =>
                        setScreenshotForm({
                          ...screenshotForm,
                          category: e.target.value as 'active' | 'complimentary' | 'retired',
                        })
                      }
                      className="w-full min-h-[42px] px-3 rounded-xl bg-[#03180f] border border-[#facc15]/45 text-[#fde047] font-bold focus:outline-none"
                    >
                      <option value="active">Active Transaction Screenshots</option>
                      <option value="complimentary">Complimentary Screenshots</option>
                      <option value="retired">Retired / Archived Screenshots</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-emerald-200 mb-1 font-semibold">
                    Admin Notes / Details
                  </label>
                  <input
                    type="text"
                    value={screenshotForm.notes}
                    onChange={(e) =>
                      setScreenshotForm({ ...screenshotForm, notes: e.target.value })
                    }
                    placeholder="e.g. Verified payment to Syed Ishaq Hussain Shah"
                    className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#03180f] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>

                {/* Screenshot Image Upload or Replacement */}
                <div className="space-y-1.5 text-xs">
                  <label className="block text-emerald-200 font-semibold">
                    {editingScreenshotId
                      ? 'Replace Screenshot Image (Optional)'
                      : 'Upload Screenshot Image *'}
                  </label>
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#03180f] border-2 border-dashed border-emerald-400/35 hover:border-[#facc15] cursor-pointer transition-colors text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setScreenshotForm((prev) => ({
                            ...prev,
                            imageDataUrl: reader.result as string,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="sr-only"
                    />
                    {screenshotForm.imageDataUrl ? (
                      <div className="space-y-2">
                        <img
                          src={screenshotForm.imageDataUrl}
                          alt="New screenshot preview"
                          className="max-h-48 rounded-xl mx-auto border border-emerald-400/30 object-contain"
                        />
                        <p className="text-[#6EE730] font-bold">Image selected · Click to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-[#facc15] mx-auto" />
                        <p className="font-bold text-white">Click to Upload Payment / Receipt Screenshot</p>
                        <p className="text-[11px] text-emerald-200/65">JPG, PNG, WEBP (Max 5 MB)</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingScreenshot(false);
                      setEditingScreenshotId(null);
                    }}
                    className="min-h-[42px] px-5 rounded-xl bg-[#073622] text-emerald-100 hover:text-white font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busyId === 'create-screenshot' || (Boolean(editingScreenshotId) && busyId === editingScreenshotId)}
                    className="min-h-[42px] px-6 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] text-white font-extrabold shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {editingScreenshotId ? 'Save Screenshot Changes' : 'Save & Publish Screenshot'}
                  </button>
                </div>
              </form>
            )}

            {/* Filter Tabs & Search Bar */}
            <div className="rounded-2xl bg-[#06321f] border border-emerald-400/25 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'all' as const, label: `All Screenshots (${screenshots.length})` },
                  {
                    key: 'active' as const,
                    label: `Active (${screenshots.filter((s) => s.category === 'active').length})`,
                  },
                  {
                    key: 'complimentary' as const,
                    label: `Complimentary (${screenshots.filter((s) => s.category === 'complimentary').length})`,
                  },
                  {
                    key: 'retired' as const,
                    label: `Retired (${screenshots.filter((s) => s.category === 'retired').length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setScreenshotFilter(tab.key)}
                    className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      screenshotFilter === tab.key
                        ? 'bg-[#facc15] text-[#042416]'
                        : 'bg-[#041f14] text-emerald-100 border border-emerald-400/20 hover:bg-[#083824]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={screenshotSearch}
                  onChange={(e) => setScreenshotSearch(e.target.value)}
                  placeholder="Search customer, TID, or notes..."
                  className="w-full min-h-[38px] pl-9 pr-3 rounded-xl bg-[#041f14] border border-emerald-400/25 text-xs text-white placeholder:text-emerald-200/50 focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>

            {/* Screenshots Grid — Each card allows Edit, Category Change, Review, and Delete */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenshots
                .filter((s) => {
                  if (screenshotFilter !== 'all' && s.category !== screenshotFilter) return false;
                  if (!screenshotSearch.trim()) return true;
                  const q = screenshotSearch.toLowerCase();
                  return (
                    s.customerName.toLowerCase().includes(q) ||
                    s.customerPhone.toLowerCase().includes(q) ||
                    s.transactionRef.toLowerCase().includes(q) ||
                    s.notes.toLowerCase().includes(q) ||
                    s.paymentMethod.toLowerCase().includes(q)
                  );
                })
                .map((scr) => (
                  <div
                    key={scr.id}
                    className="rounded-3xl bg-[#06321f] border border-emerald-400/25 p-4 flex flex-col justify-between space-y-3 shadow-md hover:border-[#facc15]/50 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                            scr.category === 'active'
                              ? 'bg-emerald-950/80 border border-emerald-400/40 text-[#6EE730]'
                              : scr.category === 'complimentary'
                                ? 'bg-purple-950/80 border border-purple-400/40 text-purple-200'
                                : 'bg-slate-900 border border-slate-700 text-slate-300'
                          }`}
                        >
                          {scr.category === 'active'
                            ? 'Active Screenshot'
                            : scr.category === 'complimentary'
                              ? 'Complimentary'
                              : 'Retired / Archived'}
                        </span>
                        <span className="font-display text-base font-extrabold text-[#facc15] tabular-nums">
                          {formatPkr(scr.amount)}
                        </span>
                      </div>

                      {/* Screenshot Preview Image */}
                      <div className="relative rounded-2xl bg-black/50 border border-emerald-400/20 overflow-hidden h-48 flex items-center justify-center group">
                        <img
                          src={scr.receiptUrl}
                          alt={`Transaction screenshot for ${scr.customerName}`}
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setReceiptModal({
                              url: scr.receiptUrl,
                              deposit: {
                                id: scr.id,
                                userId: scr.userId || '',
                                userName: scr.customerName,
                                userPhone: scr.customerPhone,
                                planId: '',
                                packageCode: `${scr.paymentMethod} Receipt`,
                                packageName: scr.category,
                                amount: scr.amount,
                                projectedDailyProfit: 0,
                                durationDays: 90,
                                paymentMethod: scr.paymentMethod,
                                senderAccountName: scr.customerName,
                                senderAccountNumber: scr.customerPhone,
                                transactionRef: scr.transactionRef,
                                hasReceipt: true,
                                status: 'approved',
                                rejectionReason: null,
                                createdAt: scr.createdAt,
                                reviewedAt: scr.updatedAt,
                                reviewedByName: 'Admin',
                              },
                            })
                          }
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-bold transition-opacity cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Full Size</span>
                        </button>
                      </div>

                      {/* Transaction Information */}
                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-200/70">Customer Name:</span>
                          <span className="font-bold text-white">{scr.customerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-200/70">Phone:</span>
                          <span className="font-mono text-emerald-100">{scr.customerPhone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-200/70">Gateway / Method:</span>
                          <span className="font-bold text-[#6EE730]">{scr.paymentMethod}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-200/70">TID:</span>
                          <span className="font-mono text-[#facc15] font-bold">{scr.transactionRef}</span>
                        </div>
                        {scr.notes && (
                          <p className="text-[11px] text-emerald-200/80 pt-1 border-t border-emerald-400/15 line-clamp-2">
                            {scr.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-400/20">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingScreenshotId(scr.id);
                          setIsCreatingScreenshot(false);
                          setScreenshotForm({
                            customerName: scr.customerName,
                            customerPhone: scr.customerPhone,
                            paymentMethod: scr.paymentMethod,
                            amount: String(scr.amount),
                            transactionRef: scr.transactionRef,
                            category: scr.category,
                            notes: scr.notes,
                            imageDataUrl: null,
                          });
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="flex-1 min-h-[38px] px-3 rounded-xl bg-[#041f14] hover:bg-[#083c27] border border-emerald-400/30 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#facc15]" />
                        <span>Edit Details</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === scr.id}
                        onClick={() => handleDeleteScreenshot(scr.id)}
                        className="min-h-[38px] px-3 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-xs font-bold text-red-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Direct Edit Access for Verified Customer Deposits */}
            <div className="rounded-3xl bg-[#06321f] border border-emerald-400/35 p-5 sm:p-6 space-y-4">
              <div className="border-b border-emerald-400/20 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                    Direct Customer Deposit &amp; Payment Details Editor
                  </h2>
                  <p className="text-xs text-emerald-100/75 mt-0.5">
                    Need to modify an existing customer deposit? Admin can edit customer name, sender account, TID, payment method, or replace the attached receipt screenshot anytime.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#facc15] tabular-nums">
                  {deposits.length} Total Deposits Recorded
                </span>
              </div>

              <div className="space-y-3">
                {deposits.slice(0, 10).map((dep) => (
                  <div
                    key={dep.id}
                    className="rounded-2xl bg-[#041f14] border border-emerald-400/25 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="font-display text-base font-extrabold text-white">
                          {dep.userName}{' '}
                          <span className="text-xs text-emerald-200/70 font-mono">({dep.userPhone})</span>
                        </span>
                        <p className="text-xs text-emerald-100/80 mt-0.5 tabular-nums">
                          Package: <strong>{dep.packageCode}</strong> · Amount:{' '}
                          <strong className="text-[#facc15]">{formatPkr(dep.amount)}</strong> · Method:{' '}
                          <strong>{dep.paymentMethod}</strong> · TID:{' '}
                          <span className="font-mono text-[#6EE730]">{dep.transactionRef}</span> · Sender:{' '}
                          <span>{dep.senderAccountName || dep.userName}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {dep.hasReceipt && (
                          <ProtectedReceiptPreviewButton
                            deposit={dep}
                            authToken={authToken}
                            busy={busyId === dep.id}
                            onInspect={() => void handleInspectReceipt(dep)}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (editingDepositPaymentId === dep.id) {
                              setEditingDepositPaymentId(null);
                              setDepositPaymentForm(null);
                            } else {
                              setEditingDepositPaymentId(dep.id);
                              setDepositPaymentForm({
                                senderAccountName: dep.senderAccountName || dep.userName,
                                senderAccountNumber: dep.senderAccountNumber || dep.userPhone,
                                transactionRef: dep.transactionRef,
                                paymentMethod: dep.paymentMethod,
                                amount: String(dep.amount),
                                receiptDataUrl: null,
                              });
                            }
                          }}
                          className="min-h-[40px] px-3.5 rounded-xl bg-[#083c27] hover:bg-[#0b5134] border border-emerald-400/35 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#facc15]" />
                          <span>{editingDepositPaymentId === dep.id ? 'Cancel' : 'Edit Payment Details'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Editor for this Deposit */}
                    {editingDepositPaymentId === dep.id && depositPaymentForm && (
                      <form
                        onSubmit={(e) => void handleSaveDepositPaymentDetails(dep.id, e)}
                        className="pt-3 border-t border-emerald-400/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                      >
                        <div>
                          <label className="block text-emerald-200 mb-1 font-semibold">Sender Account Name</label>
                          <input
                            type="text"
                            value={depositPaymentForm.senderAccountName}
                            onChange={(e) =>
                              setDepositPaymentForm({
                                ...depositPaymentForm,
                                senderAccountName: e.target.value,
                              })
                            }
                            className="w-full min-h-[38px] px-3 rounded-lg bg-[#06321f] border border-emerald-400/30 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-200 mb-1 font-semibold">Sender Account / Phone</label>
                          <input
                            type="text"
                            value={depositPaymentForm.senderAccountNumber}
                            onChange={(e) =>
                              setDepositPaymentForm({
                                ...depositPaymentForm,
                                senderAccountNumber: e.target.value,
                              })
                            }
                            className="w-full min-h-[38px] px-3 rounded-lg bg-[#06321f] border border-emerald-400/30 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-200 mb-1 font-semibold">Transaction ID (TID)</label>
                          <input
                            type="text"
                            value={depositPaymentForm.transactionRef}
                            onChange={(e) =>
                              setDepositPaymentForm({
                                ...depositPaymentForm,
                                transactionRef: e.target.value,
                              })
                            }
                            className="w-full min-h-[38px] px-3 rounded-lg bg-[#06321f] border border-emerald-400/30 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-200 mb-1 font-semibold">Payment Method</label>
                          <select
                            value={depositPaymentForm.paymentMethod}
                            onChange={(e) =>
                              setDepositPaymentForm({
                                ...depositPaymentForm,
                                paymentMethod: e.target.value,
                              })
                            }
                            className="w-full min-h-[38px] px-2.5 rounded-lg bg-[#06321f] border border-emerald-400/30 text-white"
                          >
                            <option value="Easypaisa">Easypaisa</option>
                            <option value="JazzCash">JazzCash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-emerald-200 mb-1 font-semibold">Deposit Amount (Rs)</label>
                          <input
                            type="number"
                            value={depositPaymentForm.amount}
                            onChange={(e) =>
                              setDepositPaymentForm({
                                ...depositPaymentForm,
                                amount: e.target.value,
                              })
                            }
                            className="w-full min-h-[38px] px-3 rounded-lg bg-[#06321f] border border-emerald-400/30 text-white font-bold tabular-nums"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={busyId === dep.id}
                            className="w-full min-h-[38px] px-4 rounded-lg bg-[#10b956] hover:bg-[#0ea54c] text-white font-bold cursor-pointer"
                          >
                            Save Customer Details
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: TRANSACTION RECEIPT GENERATOR (ADMIN ONLY) */}
        {activeTab === 'receipt_generator' && (
          <AdminReceiptGenerator
            authToken={authToken}
            onAuditRefresh={loadOverview}
          />
        )}

        {/* TAB: CENTRALIZED ADMIN SETTINGS — DEPOSIT PAYMENT METHODS, DEPOSIT NUMBERS, ADMIN/SUPPORT NUMBERS, JOIN CHANNEL & FBR/SECP DOCUMENTS */}
        {activeTab === 'settings' && paymentConfig && (
          <div className="space-y-6">
            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              {/* SECTION 1: DEPOSIT PAYMENT METHODS & DEPOSIT RECEIVING PHONE NUMBERS */}
              <div className="rounded-3xl bg-[#06321f] border border-[#facc15]/45 p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/20 pb-3.5">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#6EE730]">
                      Deposit Gateway Configuration
                    </p>
                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-white mt-0.5">
                      1. Deposit Payment Methods &amp; Receiving Phone / Account Numbers
                    </h2>
                    <p className="text-xs text-emerald-100/75 mt-0.5">
                      Control which payment method is selected by default in Deposit, enable/disable gateways, and update Deposit receiving phone numbers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('plans')}
                    className="min-h-[40px] px-3.5 rounded-xl bg-[#041f14] hover:bg-[#083c26] border border-[#facc15]/40 text-xs font-bold text-[#fde047] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Edit Deposit Package Amounts (NBV-01–15)</span>
                  </button>
                </div>

                {/* Default Selected Payment Method in Deposit */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#facc15]">
                    Default Selected Payment Method on Customer Deposit Screen
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['Easypaisa', 'JazzCash', 'Bank Transfer'] as const).map((methodOption) => {
                      const selected = paymentConfig.defaultDepositMethod === methodOption;
                      return (
                        <button
                          key={methodOption}
                          type="button"
                          onClick={() =>
                            setPaymentConfig({
                              ...paymentConfig,
                              defaultDepositMethod: methodOption,
                              ...(methodOption === 'Easypaisa' ? { easypaisaEnabled: true } : {}),
                              ...(methodOption === 'JazzCash' ? { jazzcashEnabled: true } : {}),
                              ...(methodOption === 'Bank Transfer' ? { bankTransferEnabled: true } : {}),
                            })
                          }
                          className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-extrabold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#facc15] text-[#042416] border-[#fef08a]'
                              : 'bg-[#041f14] text-emerald-100 border-emerald-400/25 hover:bg-[#083824]'
                          }`}
                        >
                          {selected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                          <span>{methodOption} {selected ? '(Default Selected)' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Three Payment Gateway Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                  {/* EasyPaisa Card */}
                  <div className="rounded-2xl bg-[#041f14] border border-emerald-400/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-base font-extrabold text-[#6EE730]">
                        EasyPaisa Deposit Account
                      </span>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentConfig.easypaisaEnabled}
                          onChange={(e) =>
                            setPaymentConfig({
                              ...paymentConfig,
                              easypaisaEnabled: e.target.checked,
                            })
                          }
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        EasyPaisa Deposit Phone Number
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.easypaisaNumber}
                        onChange={(e) =>
                          setPaymentConfig({ ...paymentConfig, easypaisaNumber: e.target.value })
                        }
                        placeholder="03XX-XXXXXXX"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white font-mono tabular-nums focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        EasyPaisa Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.easypaisaTitle}
                        onChange={(e) =>
                          setPaymentConfig({ ...paymentConfig, easypaisaTitle: e.target.value })
                        }
                        placeholder="Account Holder Title"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </div>

                  {/* JazzCash Card */}
                  <div className="rounded-2xl bg-[#041f14] border border-emerald-400/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-base font-extrabold text-[#facc15]">
                        JazzCash Deposit Account
                      </span>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentConfig.jazzcashEnabled}
                          onChange={(e) =>
                            setPaymentConfig({
                              ...paymentConfig,
                              jazzcashEnabled: e.target.checked,
                            })
                          }
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        JazzCash Deposit Phone Number
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.jazzcashNumber}
                        onChange={(e) =>
                          setPaymentConfig({ ...paymentConfig, jazzcashNumber: e.target.value })
                        }
                        placeholder="03XX-XXXXXXX"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white font-mono tabular-nums focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        JazzCash Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.jazzcashTitle}
                        onChange={(e) =>
                          setPaymentConfig({ ...paymentConfig, jazzcashTitle: e.target.value })
                        }
                        placeholder="Account Holder Title"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </div>

                  {/* Bank Transfer Card */}
                  <div className="rounded-2xl bg-[#041f14] border border-emerald-400/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-base font-extrabold text-white">
                        Bank Transfer Deposit Account
                      </span>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentConfig.bankTransferEnabled}
                          onChange={(e) =>
                            setPaymentConfig({
                              ...paymentConfig,
                              bankTransferEnabled: e.target.checked,
                            })
                          }
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-emerald-200 mb-1 font-semibold">Bank Name</label>
                      <input
                        type="text"
                        value={paymentConfig.bankName}
                        onChange={(e) =>
                          setPaymentConfig({ ...paymentConfig, bankName: e.target.value })
                        }
                        placeholder="e.g. Meezan Bank / HBL"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        Bank Account / IBAN Number
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.bankAccountNumber}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            bankAccountNumber: e.target.value,
                          })
                        }
                        placeholder="Account Number or IBAN"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white font-mono tabular-nums focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        Bank Account Holder Title
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.bankAccountTitle}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            bankAccountTitle: e.target.value,
                          })
                        }
                        placeholder="Account Holder Name"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: OFFICIAL WHATSAPP CHANNEL LINK (SUPPORT IS HANDLED IN-APP) */}
              <div className="rounded-3xl bg-[#06321f] border border-emerald-400/35 p-5 sm:p-6 space-y-4">
                <div className="border-b border-emerald-400/20 pb-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#facc15]">
                    Official WhatsApp Channel
                  </p>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-white mt-0.5">
                    2. Official Join Channel Link
                  </h2>
                  <p className="text-xs text-emerald-100/75 mt-0.5">
                    Update the official WhatsApp Channel invitation link shown on the Customer Dashboard. All customer support conversations are handled directly inside the app via Support Messages.
                  </p>
                </div>

                <div className="text-xs">
                  <label className="flex items-center gap-1.5 text-emerald-200 mb-1.5 font-semibold">
                    <Link2 className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Official Join Channel Link (WhatsApp URL)</span>
                  </label>
                  <input
                    type="url"
                    value={paymentConfig.officialChannelUrl}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, officialChannelUrl: e.target.value })
                    }
                    placeholder="https://whatsapp.com/channel/..."
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#041f14] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              {/* SECTION 3: OFFICIAL FBR & SECP DOCUMENTS (ADMIN UPLOAD & REFERENCE DETAILS) */}
              <div className="rounded-3xl bg-[#06321f] border border-emerald-400/35 p-5 sm:p-6 space-y-5">
                <div className="border-b border-emerald-400/20 pb-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#6EE730]">
                    Platform Legal &amp; Tax Certificates (Admin Only)
                  </p>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-white mt-0.5">
                    3. Official FBR &amp; SECP Documents Management
                  </h2>
                  <p className="text-xs text-emerald-100/75 mt-0.5">
                    Only Admin can upload or update FBR and SECP documents. Customers view these certificates in read-only mode.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Official FBR Document Card */}
                  <div className="rounded-2xl bg-[#041f14] border border-emerald-400/30 p-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-[#6EE730]" />
                        <h3 className="font-display text-base font-extrabold text-white">
                          Official FBR Document
                        </h3>
                      </div>
                      <label className="min-h-[38px] px-3.5 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingDocType === 'fbr' ? 'Uploading...' : 'Upload / Replace FBR Doc'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          disabled={uploadingDocType === 'fbr'}
                          onChange={(e) => handleOfficialDocFileSelect('fbr', e)}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    {paymentConfig.fbrDocumentUrl && (
                      <div className="rounded-xl bg-white p-2 border border-emerald-400/20">
                        {paymentConfig.fbrDocumentMime === 'application/pdf' ? (
                          <iframe
                            src={paymentConfig.fbrDocumentUrl}
                            title="Current Official FBR Document"
                            className="w-full h-56 rounded-lg bg-white"
                          />
                        ) : (
                          <img
                            src={paymentConfig.fbrDocumentUrl}
                            alt="Current Official FBR Certificate"
                            referrerPolicy="no-referrer"
                            className="max-h-56 mx-auto rounded-lg object-contain"
                          />
                        )}
                      </div>
                    )}

                    <div className="text-xs">
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        FBR Registration Reference / Details
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.fbrRegistrationRef}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            fbrRegistrationRef: e.target.value,
                          })
                        }
                        placeholder="FBR Registration No & Tax Office details"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </div>

                  {/* Official SECP Document Card */}
                  <div className="rounded-2xl bg-[#041f14] border border-emerald-400/30 p-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-[#facc15]" />
                        <h3 className="font-display text-base font-extrabold text-white">
                          Official SECP Document
                        </h3>
                      </div>
                      <label className="min-h-[38px] px-3.5 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-[#facc15]/45 text-xs font-bold text-[#fde047] inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingDocType === 'secp'
                            ? 'Uploading...'
                            : 'Upload / Replace SECP Doc'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          disabled={uploadingDocType === 'secp'}
                          onChange={(e) => handleOfficialDocFileSelect('secp', e)}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    {(() => {
                      const secpUrl =
                        paymentConfig.secpDocumentUrl || '/assets/secp-certificate-nbv.png';
                      const isPdf = paymentConfig.secpDocumentMime === 'application/pdf';
                      return (
                        <div className="rounded-xl bg-white p-2 border border-emerald-400/20">
                          {isPdf ? (
                            <iframe
                              src={secpUrl}
                              title="Current Official SECP Document"
                              className="w-full h-56 rounded-lg bg-white"
                            />
                          ) : (
                            <img
                              src={secpUrl}
                              alt="Current Official SECP Certificate"
                              referrerPolicy="no-referrer"
                              className="max-h-56 mx-auto rounded-lg object-contain"
                            />
                          )}
                        </div>
                      );
                    })()}

                    <div className="text-xs">
                      <label className="block text-emerald-200 mb-1 font-semibold">
                        SECP Corporate Registration Reference / Details
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.secpRegistrationRef}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            secpRegistrationRef: e.target.value,
                          })
                        }
                        placeholder="SECP Corporate Registration Reference"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#06321f] border border-emerald-400/30 text-white focus:outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SAVE ALL SETTINGS BUTTON */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busyId === 'payment-config'}
                  className="w-full sm:w-auto min-h-[52px] px-8 rounded-2xl bg-gradient-to-b from-[#f7c644] to-[#c48312] hover:brightness-105 border border-[#fde047]/70 text-[#042415] font-display text-sm sm:text-base font-extrabold shadow-lg cursor-pointer disabled:opacity-60"
                >
                  {busyId === 'payment-config'
                    ? 'Saving All Admin Settings...'
                    : 'Save All Numbers, Payment Methods & Settings'}
                </button>
              </div>
            </form>

            {/* SECTION 4: COMPLETE PROJECT FILE MANAGEMENT & BACKUP ARCHIVE */}
            <div className="rounded-3xl bg-gradient-to-b from-[#083822] via-[#052919] to-[#041c11] border border-[#facc15]/50 p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/20 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#166534] via-[#22c55e] to-[#4ade80] border border-emerald-300/40 flex items-center justify-center text-white shadow-lg shrink-0">
                    <FolderArchive className="w-6 h-6 stroke-[2.3]" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#6EE730]">
                      Project Archive &amp; Recovery
                    </p>
                    <h3 className="font-display text-lg sm:text-xl font-extrabold text-white">
                      Complete NBV Trading App Project Backup
                    </h3>
                    <p className="text-xs text-emerald-100/75 mt-0.5">
                      Structured /NBV-TRADING-APP source files, backend, database guides, SECP certificates, and Android Play Store publishing guides.
                    </p>
                  </div>
                </div>
                <a
                  href="/NBV-TRADING-APP-BACKUP.zip"
                  download="NBV-TRADING-APP-BACKUP.zip"
                  className="min-h-[48px] px-5 rounded-2xl bg-gradient-to-r from-[#fde047] to-[#f59e0b] hover:brightness-105 active:scale-95 text-[#052e16] font-display text-sm font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download Project Backup (.ZIP)</span>
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="rounded-xl bg-[#042013] border border-emerald-400/25 p-3 text-center">
                  <span className="text-[11px] font-bold text-emerald-300/80 block uppercase">Archive Size</span>
                  <span className="font-display text-base sm:text-lg font-black text-[#facc15]">24 MB</span>
                </div>
                <div className="rounded-xl bg-[#042013] border border-emerald-400/25 p-3 text-center">
                  <span className="text-[11px] font-bold text-emerald-300/80 block uppercase">Archived Files</span>
                  <span className="font-display text-base sm:text-lg font-black text-[#6EE730]">86+ Files</span>
                </div>
                <div className="rounded-xl bg-[#042013] border border-emerald-400/25 p-3 text-center">
                  <span className="text-[11px] font-bold text-emerald-300/80 block uppercase">Target Platforms</span>
                  <span className="font-display text-xs sm:text-sm font-black text-white">Web, PWA &amp; Android</span>
                </div>
                <div className="rounded-xl bg-[#042013] border border-emerald-400/25 p-3 text-center">
                  <span className="text-[11px] font-bold text-emerald-300/80 block uppercase">Compliance</span>
                  <span className="font-display text-xs sm:text-sm font-black text-[#86efac]">SECP 886105 &amp; FBR</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MANAGE 20 INVESTMENT PLANS & DEPOSIT AMOUNTS (NBV-01 TO NBV-20) */}
        {activeTab === 'plans' && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-[#06321f] border border-[#facc15]/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                  Manage Deposit Packages &amp; Amounts (NBV-01 to NBV-20)
                </h2>
                <p className="text-xs text-emerald-100/75 mt-0.5">
                  Update Deposit / Investment Amount, Daily Profit, Profit Rate %, Plan Duration, and separate Level 1 (12%) &amp; Level 2 (3%) Referral Bonus % for each package.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="min-h-[40px] px-4 rounded-xl bg-[#041f14] hover:bg-[#083c26] border border-emerald-400/35 text-xs font-bold text-[#fde047] flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Payment Methods, Numbers &amp; Docs</span>
              </button>
            </div>

            <div className="space-y-3">
              {plans.map((plan) => {
                const displayProfitRate =
                  typeof plan.profitRatePercent === 'number' && plan.profitRatePercent > 0
                    ? plan.profitRatePercent
                    : plan.investmentAmount > 0
                      ? Number(((plan.projectedDailyProfit / plan.investmentAmount) * 100).toFixed(2))
                      : 0;
                return (
                <div
                  key={plan.id}
                  className="rounded-2xl bg-[#06321f] border border-emerald-400/25 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-display text-lg font-extrabold text-[#facc15]">
                        {plan.code}
                      </span>
                      <span className="text-sm font-bold text-white ml-2">{plan.name}</span>
                      <p className="text-xs text-emerald-200/80 mt-0.5 tabular-nums">
                        Section {plan.section} · Deposit Amount: <strong>{formatPkr(plan.investmentAmount)}</strong> · Daily Profit:{' '}
                        <strong>{formatPkr(plan.projectedDailyProfit)}</strong> · Profit Rate: <strong>{displayProfitRate}%</strong> · {plan.durationDays} Days · Level 1:{' '}
                        <strong>{plan.level1BonusPercent}%</strong> · Level 2: <strong>{plan.level2BonusPercent}%</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingPlanId === plan.id) {
                          setEditingPlanId(null);
                          setPlanForm(null);
                        } else {
                          setEditingPlanId(plan.id);
                          setPlanForm({
                            name: plan.name,
                            investmentAmount: String(plan.investmentAmount),
                            projectedDailyProfit: String(plan.projectedDailyProfit),
                            durationDays: String(plan.durationDays),
                            level1BonusPercent: String(plan.level1BonusPercent),
                            level2BonusPercent: String(plan.level2BonusPercent),
                            isActive: plan.isActive,
                          });
                        }
                      }}
                      className="min-h-[38px] px-4 rounded-xl bg-[#041f14] hover:bg-[#083e27] border border-emerald-400/30 text-xs font-bold text-white cursor-pointer"
                    >
                      {editingPlanId === plan.id ? 'Cancel' : 'Edit Amount & Plan'}
                    </button>
                  </div>

                  {editingPlanId === plan.id && planForm && (
                    <div className="pt-3 border-t border-emerald-400/15 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-emerald-200 mb-1">Subtitle</label>
                        <input
                          type="text"
                          value={planForm.name}
                          onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#041f14] border border-emerald-400/30 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[#facc15] font-bold mb-1">
                          Deposit Amount (Rs)
                        </label>
                        <input
                          type="number"
                          value={planForm.investmentAmount}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, investmentAmount: e.target.value })
                          }
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#041f14] border border-[#facc15]/45 text-white font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-emerald-200 mb-1">Daily Profit (Rs)</label>
                        <input
                          type="number"
                          value={planForm.projectedDailyProfit}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, projectedDailyProfit: e.target.value })
                          }
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#041f14] border border-emerald-400/30 text-white tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-emerald-200 mb-1">Duration (Days)</label>
                        <input
                          type="number"
                          value={planForm.durationDays}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, durationDays: e.target.value })
                          }
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#041f14] border border-emerald-400/30 text-white tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-emerald-200 mb-1">Level 1 (%)</label>
                        <input
                          type="number"
                          value={planForm.level1BonusPercent}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, level1BonusPercent: e.target.value })
                          }
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#041f14] border border-emerald-400/30 text-white tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-emerald-200 mb-1">Level 2 (%)</label>
                        <input
                          type="number"
                          value={planForm.level2BonusPercent}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, level2BonusPercent: e.target.value })
                          }
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#041f14] border border-emerald-400/30 text-white tabular-nums"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-3 flex items-center justify-between pt-1">
                        <label className="inline-flex items-center gap-2 text-xs text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={planForm.isActive}
                            onChange={(e) =>
                              setPlanForm({ ...planForm, isActive: e.target.checked })
                            }
                          />
                          <span>Package Visible &amp; Active for Deposits</span>
                        </label>
                        <button
                          type="button"
                          disabled={busyId === plan.id}
                          onClick={() => handleSavePlan(plan.id)}
                          className="min-h-[38px] px-5 rounded-lg bg-[#10b956] text-white font-bold cursor-pointer"
                        >
                          Save {plan.code}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: IN-APP CUSTOMER SUPPORT MESSAGING INBOX & OFFICIAL CHANNEL */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            {/* Two-Way Customer Messaging Inbox */}
            <div className="rounded-3xl bg-[#06321f] border border-emerald-400/35 overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-emerald-400/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#facc15]">
                    100% In-App Customer Support
                  </p>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                    Customer Support Conversations
                  </h2>
                </div>
                <span className="text-xs text-emerald-200/80">
                  Customers receive an instant in-app notification as soon as you reply.
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                {/* Left Sidebar: Thread List & Customer Search */}
                <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-emerald-400/20 bg-[#041f14]/65 p-3.5 space-y-3 flex flex-col">
                  <div className="relative">
                    <Search className="w-4 h-4 text-emerald-300/60 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={supportSearch}
                      onChange={(e) => setSupportSearch(e.target.value)}
                      placeholder="Search customer name or phone..."
                      className="w-full min-h-[40px] pl-9 pr-3 rounded-xl bg-[#05291a] border border-emerald-400/25 text-xs text-white focus:outline-none focus:border-[#facc15]"
                    />
                  </div>

                  <div className="flex-1 max-h-[360px] lg:max-h-[420px] overflow-y-auto space-y-2">
                    {(() => {
                      const q = supportSearch.trim().toLowerCase();
                      const filteredThreads = supportThreads.filter(
                        (t) =>
                          !q ||
                          t.userName.toLowerCase().includes(q) ||
                          t.userPhone.toLowerCase().includes(q) ||
                          t.lastMessageBody.toLowerCase().includes(q)
                      );
                      const extraMatchingUsers = q
                        ? users.filter(
                            (u) =>
                              !supportThreads.some((t) => t.userId === u.id) &&
                              (u.name.toLowerCase().includes(q) ||
                                u.phone.toLowerCase().includes(q))
                          )
                        : [];

                      if (
                        filteredThreads.length === 0 &&
                        extraMatchingUsers.length === 0
                      ) {
                        return (
                          <div className="py-10 px-3 text-center text-xs text-emerald-200/70">
                            {supportSearch.trim()
                              ? 'No matching customers found.'
                              : 'No customer support messages yet. When a customer sends a message, it appears here instantly.'}
                          </div>
                        );
                      }

                      return (
                        <>
                          {filteredThreads.map((thread) => {
                            const isSelected = selectedSupportUserId === thread.userId;
                            return (
                              <button
                                key={thread.userId}
                                type="button"
                                onClick={() => setSelectedSupportUserId(thread.userId)}
                                className={`w-full text-left rounded-2xl p-3 border transition-colors cursor-pointer space-y-1 ${
                                  isSelected
                                    ? 'bg-[#09472d] border-[#facc15]/65'
                                    : thread.unreadForAdminCount > 0
                                      ? 'bg-[#073824] border-[#6EE730]/45 hover:bg-[#09472d]'
                                      : 'bg-[#05291a]/80 border-emerald-400/15 hover:bg-[#073622]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-extrabold text-white truncate">
                                    {thread.userName}
                                  </span>
                                  {thread.unreadForAdminCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-[#facc15] text-[#042416] text-[10px] font-extrabold tabular-nums shrink-0">
                                      {thread.unreadForAdminCount} New
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-emerald-200/75">
                                  <span className="tabular-nums truncate">
                                    {thread.userPhone}
                                  </span>
                                  <span className="text-[#facc15] font-semibold tabular-nums shrink-0">
                                    {formatPkr(thread.userBalance)}
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-100/80 truncate">
                                  {thread.lastMessageSenderRole === 'admin' ? 'You: ' : ''}
                                  {thread.lastMessageBody}
                                </p>
                                <p className="text-[10px] text-emerald-200/55">
                                  {formatDateTime(thread.lastMessageAt)}
                                </p>
                              </button>
                            );
                          })}

                          {extraMatchingUsers.map((u) => {
                            const isSelected = selectedSupportUserId === u.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => setSelectedSupportUserId(u.id)}
                                className={`w-full text-left rounded-2xl p-3 border transition-colors cursor-pointer space-y-0.5 ${
                                  isSelected
                                    ? 'bg-[#09472d] border-[#facc15]/65'
                                    : 'bg-[#05291a]/80 border-emerald-400/15 hover:bg-[#073622]'
                                }`}
                              >
                                <p className="text-sm font-bold text-white truncate">
                                  {u.name}
                                </p>
                                <p className="text-[11px] text-emerald-200/75 tabular-nums">
                                  {u.phone} · {formatPkr(u.balance)}
                                </p>
                                <p className="text-[11px] text-[#6EE730] font-semibold">
                                  Start direct message →
                                </p>
                              </button>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Main Panel: Active Customer Conversation */}
                <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col justify-between bg-[#05291a]/60">
                  {(() => {
                    const selectedUser =
                      users.find((u) => u.id === selectedSupportUserId) || null;
                    const selectedThread =
                      supportThreads.find((t) => t.userId === selectedSupportUserId) ||
                      null;

                    if (!selectedSupportUserId || (!selectedUser && !selectedThread)) {
                      return (
                        <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-4">
                          <MessageCircle className="w-10 h-10 text-emerald-300/45 mb-2.5" />
                          <p className="text-sm font-bold text-white">
                            Select a Customer Conversation
                          </p>
                          <p className="text-xs text-emerald-200/70 mt-1 max-w-sm">
                            Choose any customer thread on the left (or search a customer by name/phone) to read their messages and send an instant in-app reply.
                          </p>
                        </div>
                      );
                    }

                    const displayName =
                      selectedUser?.name || selectedThread?.userName || 'Customer';
                    const displayPhone =
                      selectedUser?.phone || selectedThread?.userPhone || '';
                    const displayBalance =
                      selectedUser?.balance ?? selectedThread?.userBalance ?? 0;

                    return (
                      <div className="flex flex-col h-full space-y-3.5">
                        {/* Customer Conversation Header */}
                        <div className="rounded-2xl bg-[#041f14] border border-emerald-400/25 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm sm:text-base font-extrabold text-white">
                              {displayName}
                            </p>
                            <p className="text-xs text-emerald-200/80 tabular-nums">
                              {displayPhone} · Wallet Balance:{' '}
                              <strong className="text-[#facc15]">
                                {formatPkr(displayBalance)}
                              </strong>
                            </p>
                          </div>
                          {selectedUser && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserDetail(selectedUser);
                                setActiveTab('users');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/25 text-xs font-bold text-[#fde047] cursor-pointer"
                            >
                              View Account
                            </button>
                          )}
                        </div>

                        {/* Chat Messages Scroll Container */}
                        <div className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3.5 sm:p-4 min-h-[250px] max-h-[340px] overflow-y-auto space-y-3">
                          {activeThreadMessages.length === 0 ? (
                            <div className="h-[200px] flex items-center justify-center text-center text-xs text-emerald-200/70">
                              No messages in this conversation yet. Send a message below to notify {displayName} inside the app.
                            </div>
                          ) : (
                            activeThreadMessages.map((msg) => {
                              const isFromAdmin = msg.senderRole === 'admin';
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col ${
                                    isFromAdmin ? 'items-end' : 'items-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 space-y-1 ${
                                      isFromAdmin
                                        ? 'bg-gradient-to-br from-[#10b956] to-[#0b823c] text-white rounded-br-sm'
                                        : 'bg-[#073b25] border border-[#facc15]/40 text-emerald-50 rounded-bl-sm'
                                    }`}
                                  >
                                    <span
                                      className={`block text-[10.5px] font-extrabold uppercase tracking-wide ${
                                        isFromAdmin ? 'text-[#fde047]' : 'text-[#6EE730]'
                                      }`}
                                    >
                                      {isFromAdmin
                                        ? 'Admin Reply'
                                        : msg.subject
                                          ? `${displayName} · ${msg.subject}`
                                          : displayName}
                                    </span>
                                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                                      {msg.body}
                                    </p>
                                  </div>
                                  <div className="mt-1 px-1 flex items-center gap-1.5 text-[10.5px] text-emerald-200/60">
                                    <span>{formatDateTime(msg.createdAt)}</span>
                                    {isFromAdmin && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span
                                          className={
                                            msg.readByUser
                                              ? 'text-[#6EE730] font-semibold'
                                              : 'text-emerald-200/70'
                                          }
                                        >
                                          {msg.readByUser
                                            ? 'Read by Customer'
                                            : 'Customer Notified'}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={adminChatEndRef} />
                        </div>

                        {/* Admin Reply Input Form */}
                        <form
                          onSubmit={handleSendAdminReply}
                          className="flex flex-col sm:flex-row gap-2.5"
                        >
                          <textarea
                            rows={2}
                            required
                            value={adminReplyInput}
                            onChange={(e) => setAdminReplyInput(e.target.value)}
                            placeholder={`Write reply to ${displayName}...`}
                            className="flex-1 p-3 rounded-xl bg-[#041f14] border border-emerald-400/30 text-sm text-white placeholder:text-emerald-200/45 focus:outline-none focus:border-[#facc15]"
                          />
                          <button
                            type="submit"
                            disabled={sendingReply || !adminReplyInput.trim()}
                            className="min-h-[46px] px-5 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] disabled:opacity-55 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                          </button>
                        </form>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Official Channel Updates Publisher (Preserved) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handlePostAnnouncement}
                className="rounded-2xl bg-[#06321f] border border-emerald-400/25 p-4 sm:p-5 space-y-3"
              >
                <h2 className="font-display text-lg font-extrabold text-[#facc15]">
                  Publish Official Channel Update
                </h2>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Announcement headline"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#041f14] border border-emerald-400/25 text-sm text-white"
                />
                <textarea
                  rows={3}
                  required
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  placeholder="Write announcement details..."
                  className="w-full p-3 rounded-xl bg-[#041f14] border border-emerald-400/25 text-sm text-white"
                />
                <button
                  type="submit"
                  disabled={busyId === 'ann'}
                  className="min-h-[42px] px-5 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] text-white text-xs font-bold cursor-pointer"
                >
                  Publish to Official Channel
                </button>
              </form>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl bg-[#041f14] border border-emerald-400/20 p-3.5"
                  >
                    <p className="text-sm font-bold text-white">{a.title}</p>
                    <p className="text-xs text-emerald-100/75 mt-1">{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: ADMIN AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <div className="rounded-2xl bg-[#06321f] border border-emerald-400/20 p-8 text-center text-sm text-emerald-200/75">
                No admin actions logged yet. Every deposit verification, withdrawal decision, support reply, and plan edit is recorded here.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-[#06321f] border border-emerald-400/25 p-4 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-mono font-bold text-[#facc15]">{log.action}</p>
                    <p className="text-sm text-white mt-0.5">{log.summary}</p>
                  </div>
                  <div className="text-right text-xs text-emerald-200/70">
                    <p>Admin: {log.adminName}</p>
                    <p>{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Admin Notifications Modal */}
      {adminNotifOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setAdminNotifOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#05291a] border border-emerald-400/35 p-5 max-h-[82vh] overflow-y-auto shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-400/20">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#facc15]" />
                <h3 className="font-display text-lg font-extrabold text-white">
                  Admin Notifications
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {(unreadNotificationsCount > 0 || unreadAdminSupportCount > 0) && (
                  <button
                    type="button"
                    onClick={() => void onMarkAllNotificationsRead?.()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/25 text-[11px] font-bold text-[#fde047] cursor-pointer"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAdminNotifOpen(false)}
                  className="w-9 h-9 rounded-xl bg-[#073622] flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-emerald-200/75">
                No notifications yet. Instant alerts appear here whenever a customer sends a message.
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      void onMarkNotificationRead?.(notif.id);
                      setAdminNotifOpen(false);
                      setSelectedSupportUserId(notif.relatedUserId);
                      setActiveTab('support');
                    }}
                    className={`w-full text-left rounded-2xl p-3.5 border transition-colors cursor-pointer space-y-1 ${
                      notif.isRead
                        ? 'bg-[#041f14] border-emerald-400/20 hover:bg-[#073320]'
                        : 'bg-[#073b25] border-[#facc15]/55 hover:bg-[#0a492e]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#facc15] shrink-0" />
                        )}
                        <span>{notif.title}</span>
                      </span>
                      <span className="text-[10.5px] text-emerald-200/65 shrink-0">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/85 line-clamp-2">{notif.body}</p>
                    <p className="text-[11px] font-bold text-[#6EE730]">
                      Open conversation &amp; reply →
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Inspection Lightbox */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg rounded-3xl bg-[#05291a] border border-[#facc15]/50 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Verify Receipt — {receiptModal.deposit.packageCode} ({formatPkr(receiptModal.deposit.amount)})
                </h3>
                <p className="text-xs text-emerald-200/80">
                  User: {receiptModal.deposit.userName} · TID: {receiptModal.deposit.transactionRef}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="w-9 h-9 rounded-xl bg-[#083c26] flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={receiptModal.url}
              alt="Payment receipt uploaded by user"
              className="w-full max-h-[55vh] object-contain rounded-2xl bg-black/40 border border-emerald-400/20"
            />

            <div className="flex flex-wrap gap-2.5">
              {receiptModal.deposit.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={busyId === receiptModal.deposit.id}
                    onClick={() => handleApproveDeposit(receiptModal.deposit.id)}
                    className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] text-white font-extrabold text-sm cursor-pointer disabled:opacity-60"
                  >
                    APPROVE ({receiptModal.deposit.packageCode})
                  </button>
                  <button
                    type="button"
                    disabled={busyId === receiptModal.deposit.id}
                    onClick={() => handleRejectDeposit(receiptModal.deposit.id)}
                    className="flex-1 min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm cursor-pointer disabled:opacity-60"
                  >
                    REJECT
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="min-h-[44px] px-5 rounded-xl bg-[#083c26] text-white font-bold text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Inspection Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg rounded-3xl bg-[#05291a] border border-emerald-400/40 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-400/20">
              <div>
                <h3 className="font-display text-xl font-extrabold text-white">
                  {selectedUserDetail.name}
                </h3>
                <p className="text-xs text-emerald-200/75">
                  {selectedUserDetail.phone} · {selectedUserDetail.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="w-9 h-9 rounded-xl bg-[#083c26] flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[#041f14] p-3">
                <p className="text-emerald-200/70">Available Balance</p>
                <p className="font-display text-lg font-extrabold text-[#facc15] tabular-nums mt-0.5">
                  {formatPkr(selectedUserDetail.balance)}
                </p>
              </div>
              <div className="rounded-xl bg-[#041f14] p-3">
                <p className="text-emerald-200/70">Verified Deposits</p>
                <p className="font-display text-lg font-extrabold text-[#6EE730] tabular-nums mt-0.5">
                  {formatPkr(selectedUserDetail.totalDeposits)}
                </p>
              </div>
              <div className="rounded-xl bg-[#041f14] p-3">
                <p className="text-emerald-200/70">Total Earnings</p>
                <p className="font-display text-lg font-extrabold text-white tabular-nums mt-0.5">
                  {formatPkr(selectedUserDetail.totalEarnings)}
                </p>
              </div>
              <div className="rounded-xl bg-[#041f14] p-3">
                <p className="text-emerald-200/70">Referral Network</p>
                <p className="font-display text-lg font-extrabold text-white tabular-nums mt-0.5">
                  L1: {selectedUserDetail.level1Count} · L2: {selectedUserDetail.level2Count}
                </p>
              </div>
            </div>

            {selectedUserDetail.id !== currentAdmin.id && (
              <button
                type="button"
                disabled={busyId === selectedUserDetail.id}
                onClick={() => handleToggleUserRole(selectedUserDetail)}
                className="w-full min-h-[42px] rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-[#facc15]/40 text-xs font-bold text-[#fde047] cursor-pointer"
              >
                {selectedUserDetail.role === 'admin' ? 'Revoke Admin Role' : 'Grant Admin Role'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
