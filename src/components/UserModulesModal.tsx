import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Users,
  Award,
  FileCheck2,
  Smartphone,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Megaphone,
  TrendingUp,
  Layers,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Share2,
  Link2,
  EyeOff,
  User,
  Wallet,
  Coins,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import { buildReferralUrl, buildShareMessage } from '../utils/publicUrl';
import { NbvShieldEmblem } from './NbvVisuals';
import { PWAInstallButton } from './PWAInstallButton';
import type {
  ActiveUserPlan,
  ChannelAnnouncement,
  DashboardSectionModal,
  DepositRequestItem,
  LedgerTransaction,
  SupportChatMessage,
  UserProfile,
  WithdrawalRequestItem,
} from '../types';

interface UserModulesModalProps {
  section: Exclude<DashboardSectionModal, null>;
  user: UserProfile;
  authToken: string;
  referralUrl: string;
  lastIncomingMessage?: SupportChatMessage | null;
  onSupportRead?: () => void;
  onClose: () => void;
  onGoToPlans: () => void;
  onRefreshProfile: () => Promise<void>;
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

function StatusLabel({ status }: { status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'open' | 'replied' }) {
  if (status === 'approved' || status === 'active' || status === 'replied') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#6EE730]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="capitalize">{status}</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
        <XCircle className="w-3.5 h-3.5" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#facc15]">
      <Clock className="w-3.5 h-3.5" />
      <span>{status === 'pending' ? 'Pending' : status}</span>
    </span>
  );
}

export function UserModulesModal({
  section,
  user,
  authToken,
  referralUrl,
  lastIncomingMessage = null,
  onSupportRead,
  onClose,
  onGoToPlans,
  onRefreshProfile,
}: UserModulesModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Loaded module states
  const [deposits, setDeposits] = useState<DepositRequestItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [activePlans, setActivePlans] = useState<ActiveUserPlan[]>([]);
  const [pendingPlanDeposits, setPendingPlanDeposits] = useState<DepositRequestItem[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [txFilter, setTxFilter] = useState<'all' | 'plan_profit' | 'referral_commission' | 'deposit' | 'withdrawal'>('all');
  const [teamTab, setTeamTab] = useState<'all' | 1 | 2>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');
  const [profileBalanceVisible, setProfileBalanceVisible] = useState(true);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);

  // Withdraw form state
  const [wdMethod, setWdMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Bank Transfer'>('EasyPaisa');
  const [wdTitle, setWdTitle] = useState('');
  const [wdNumber, setWdNumber] = useState('');
  const [wdAmount, setWdAmount] = useState('');
  const [wdSubmitting, setWdSubmitting] = useState(false);
  const [wdError, setWdError] = useState<string | null>(null);
  const [wdSuccess, setWdSuccess] = useState<string | null>(null);

  // In-App Support Messaging state (100% in-app, no phone/WhatsApp support numbers)
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([]);
  const [supportTopic, setSupportTopic] = useState<string>('General Issue');
  const [supportBody, setSupportBody] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const supportChatEndRef = useRef<HTMLDivElement | null>(null);

  // Channel & Docs state (Official Admin-Managed Documents)
  const [announcements, setAnnouncements] = useState<ChannelAnnouncement[]>([]);
  const [channelName, setChannelName] = useState('');
  const [docsInfo, setDocsInfo] = useState<{
    fbrRegistrationRef: string;
    fbrDocumentUrl: string;
    fbrDocumentMime: string;
    secpRegistrationRef: string;
    secpDocumentUrl: string;
    secpDocumentMime: string;
  } | null>(null);
  const [showOfficialFbrZoom, setShowOfficialFbrZoom] = useState(false);
  const [showOfficialSecpZoom, setShowOfficialSecpZoom] = useState(false);

  // Protected Receipt Viewer
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      try {
        if (section === 'deposit_history') {
          const res = await fetch('/api/deposits/my', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setDeposits(data.deposits || []);
          }
        } else if (section === 'withdraw_history') {
          const res = await fetch('/api/withdrawals/my', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setWithdrawals(data.withdrawals || []);
          }
        } else if (section === 'my_plans' || section === 'my_profile') {
          const res = await fetch('/api/plans/my', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setActivePlans(data.activePlans || []);
            setPendingPlanDeposits(data.pendingPlanDeposits || []);
          }
          void onRefreshProfile();
        } else if (section === 'profit') {
          const res = await fetch('/api/transactions/my', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setTransactions(data.transactions || []);
          }
        } else if (section === 'admin_support') {
          const res = await fetch('/api/support/my', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setSupportMessages(data.messages || []);
            if ((data.unreadFromAdminCount || 0) > 0) {
              void fetch('/api/support/messages/read', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
              }).then(() => {
                onSupportRead?.();
              });
            }
          }
        } else if (section === 'join_channel') {
          const res = await fetch('/api/channel', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setAnnouncements(data.announcements || []);
            setChannelName(data.officialChannelUrl || 'NBV Trading Official Channel');
          }
        } else if (section === 'fbr_docs' || section === 'secp_docs') {
          const res = await fetch('/api/documents', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setDocsInfo(data);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchData();
    return () => {
      active = false;
    };
  }, [section, authToken]);

  useEffect(() => {
    return () => {
      if (receiptBlobUrl) {
        URL.revokeObjectURL(receiptBlobUrl);
      }
    };
  }, [receiptBlobUrl]);

  const effectiveReferralUrl = buildReferralUrl(user.referralCode);
  const shareMessage = buildShareMessage(user.referralCode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [teamShareFeedback, setTeamShareFeedback] = useState<string | null>(null);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(effectiveReferralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      setCopiedCode(false);
    }
  }

  function handleWhatsAppShare() {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleAndroidShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'NBV Trading App',
          text: shareMessage,
          url: effectiveReferralUrl,
        });
        setTeamShareFeedback('Link shared successfully!');
        setTimeout(() => setTeamShareFeedback(null), 2500);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          void handleCopyLink();
        }
      }
    } else {
      void handleCopyLink();
    }
  }

  async function handleViewReceipt(depositId: string) {
    setReceiptLoadingId(depositId);
    try {
      const res = await fetch(`/api/receipts/${depositId}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      if (receiptBlobUrl) {
        URL.revokeObjectURL(receiptBlobUrl);
      }
      setReceiptBlobUrl(URL.createObjectURL(blob));
    } finally {
      setReceiptLoadingId(null);
    }
  }

  async function handleWithdrawSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWdError(null);
    setWdSuccess(null);
    setWdSubmitting(true);

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: Number(wdAmount),
          method: wdMethod,
          accountTitle: wdTitle.trim(),
          accountNumber: wdNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWdError(data.error || 'Could not submit withdrawal request.');
        setWdSubmitting(false);
        return;
      }

      setWdSuccess(
        `Withdrawal request of ${formatPkr(Number(wdAmount))} submitted and queued for Admin review.`
      );
      setWdAmount('');
      await onRefreshProfile();
    } catch {
      setWdError('Network error while submitting withdrawal request.');
    } finally {
      setWdSubmitting(false);
    }
  }

  // Real-time incoming message append & read-acknowledgement while Customer Support chat is open
  useEffect(() => {
    if (section !== 'admin_support' || !lastIncomingMessage) return;
    if (lastIncomingMessage.userId !== user.id) return;

    setSupportMessages((prev) =>
      prev.some((m) => m.id === lastIncomingMessage.id)
        ? prev
        : [...prev, lastIncomingMessage]
    );

    if (lastIncomingMessage.senderRole === 'admin') {
      void fetch('/api/support/messages/read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }).then(() => {
        onSupportRead?.();
      });
    }
  }, [section, lastIncomingMessage, user.id, authToken, onSupportRead]);

  useEffect(() => {
    if (section !== 'admin_support') return;
    supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [section, supportMessages.length]);

  async function handleSendSupportMessage(e: React.FormEvent) {
    e.preventDefault();
    const cleanBody = supportBody.trim();
    if (!cleanBody) return;

    setSupportError(null);
    setSupportSending(true);
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          subject: supportTopic,
          body: cleanBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSupportError(data.error || 'Unable to send message right now.');
        return;
      }
      if (data.message) {
        const sentMsg = data.message as SupportChatMessage;
        setSupportMessages((prev) =>
          prev.some((m) => m.id === sentMsg.id) ? prev : [...prev, sentMsg]
        );
        setSupportBody('');
      }
    } catch {
      setSupportError('Network error while sending message. Please try again.');
    } finally {
      setSupportSending(false);
    }
  }

  const modalTitleMap: Record<Exclude<DashboardSectionModal, null>, string> = {
    withdraw: 'Withdraw Verified Balance',
    withdraw_history: 'Withdrawal History',
    my_plans: 'My Investment Plans (90 Days)',
    my_team: 'My Team & Referral Network',
    profit: 'Profit & Transaction Records',
    deposit_history: 'Deposit History',
    android_app: 'NBV Trading Mobile App',
    badges: 'NBV Trading Member Ranks',
    admin_support: 'NBV Admin Support',
    join_channel: 'Official NBV Channel Updates',
    fbr_docs: 'FBR Registration Certificate',
    secp_docs: 'SECP Registration Verification',
    my_profile: 'My Profile & Complete Investment Details',
  };

  const filteredTransactions =
    txFilter === 'all' ? transactions : transactions.filter((t) => t.type === txFilter);

  const filteredTeam =
    teamTab === 'all' ? user.teamMembers : user.teamMembers.filter((m) => m.level === teamTab);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-[#05291a] border border-emerald-400/35 p-5 sm:p-6 max-h-[88vh] overflow-y-auto shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-emerald-400/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <NbvShieldEmblem size={34} />
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-white truncate">
              {modalTitleMap[section]}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] text-emerald-100 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="pt-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-emerald-200/75">Loading records...</div>
          ) : section === 'withdraw' ? (
            /* 1. WITHDRAWAL MANAGEMENT */
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-[#073b25] to-[#0b4d30] border border-[#facc15]/45 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-100/80">Available Verified Balance</p>
                  <p className="font-display text-2xl font-extrabold text-[#facc15] tabular-nums mt-0.5">
                    {formatPkr(user.balance)}
                  </p>
                </div>
                {user.pendingWithdrawals > 0 && (
                  <div className="text-right">
                    <p className="text-[11px] text-amber-200/80">Pending Review</p>
                    <p className="font-mono text-sm font-bold text-amber-300 tabular-nums">
                      {formatPkr(user.pendingWithdrawals)}
                    </p>
                  </div>
                )}
              </div>

              {wdError && (
                <div className="rounded-2xl bg-red-950/70 border border-red-400/45 px-4 py-3 text-xs text-red-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{wdError}</span>
                </div>
              )}

              {wdSuccess && (
                <div className="rounded-2xl bg-emerald-900/60 border border-[#6EE730]/45 px-4 py-3 text-xs text-emerald-50 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#6EE730] shrink-0 mt-0.5" />
                  <span>{wdSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {(['EasyPaisa', 'JazzCash', 'Bank Transfer'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setWdMethod(m)}
                    className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                      wdMethod === m
                        ? 'bg-[#facc15] text-[#052919] border-[#fef08a]'
                        : 'bg-[#041f14] text-emerald-100 border-emerald-400/25'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 mb-1">
                    Account Holder Title
                  </label>
                  <input
                    type="text"
                    required
                    value={wdTitle}
                    onChange={(e) => setWdTitle(e.target.value)}
                    placeholder="Account holder full name"
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#041f14] border border-emerald-400/30 text-sm text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 mb-1">
                    Account / Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={wdNumber}
                    onChange={(e) => setWdNumber(e.target.value)}
                    placeholder="03XX-XXXXXXX or IBAN"
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#041f14] border border-emerald-400/30 text-sm text-white tabular-nums focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-100 mb-1">
                  Withdrawal Amount (PKR · Min Rs 69.00)
                </label>
                <input
                  type="number"
                  min={69}
                  max={2000000}
                  step="any"
                  required
                  value={wdAmount}
                  onChange={(e) => setWdAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#041f14] border border-emerald-400/30 text-base font-bold text-[#facc15] tabular-nums focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <button
                type="submit"
                disabled={wdSubmitting}
                className="w-full min-h-[50px] rounded-xl bg-gradient-to-b from-[#f7c644] to-[#c48312] border border-[#fde047]/70 text-[#042415] font-display text-base font-extrabold disabled:opacity-60 cursor-pointer"
              >
                {wdSubmitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}
              </button>
            </form>
          ) : (section === 'my_plans' || section === 'my_profile') ? (
            /* MY PROFILE & COMPLETE INVESTMENT DETAILS (Screenshot 2 Matching) */
            <div className="space-y-5">
              {/* 1. User Identity & Profile Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-[#073b25] via-[#08432a] to-[#09482e] border border-[#2dd483]/45 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.35)] bg-[#042316] flex items-center justify-center shrink-0">
                    <NbvShieldEmblem size={40} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white truncate">
                        {user.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#052919] border border-[#facc15]/50 text-[10px] font-extrabold text-[#fde047]">
                        {user.memberRank || 'VIP Member'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/80 mt-0.5 font-mono">
                      {user.phone} · Ref: <span className="text-[#facc15] font-bold">{user.referralCode}</span>
                    </p>
                    <p className="text-[11px] text-emerald-300/70 mt-0.5">
                      Sponsor: {user.referredBy || 'Official NBV'} · Joined: {formatDateTime(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSyncingProfile(true);
                      try {
                        const res = await fetch('/api/plans/my', {
                          credentials: 'include',
                          headers: { Authorization: `Bearer ${authToken}` },
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setActivePlans(data.activePlans || []);
                          setPendingPlanDeposits(data.pendingPlanDeposits || []);
                        }
                        await onRefreshProfile();
                      } finally {
                        setTimeout(() => setIsSyncingProfile(false), 600);
                      }
                    }}
                    disabled={isSyncingProfile}
                    className="min-h-[40px] px-3.5 rounded-xl bg-[#041f14] hover:bg-[#07331f] border border-emerald-400/35 text-xs font-bold text-[#86efac] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                    title="Synchronize and fetch latest database data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingProfile ? 'animate-spin text-[#facc15]' : ''}`} />
                    <span>{isSyncingProfile ? 'Syncing...' : 'Sync Live Data'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToPlans();
                    }}
                    className="min-h-[40px] px-3.5 rounded-xl bg-gradient-to-r from-[#fde047] to-[#f59e0b] text-[#052e16] text-xs font-extrabold flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>New Investment</span>
                  </button>
                </div>
              </div>

              {/* 2. Comprehensive Financial Details Grid (Moved from Home Page) */}
              <div className="rounded-3xl bg-gradient-to-b from-[#06301e] to-[#042013] border border-emerald-400/35 p-4 sm:p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-emerald-400/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#052919] border border-emerald-400/30 flex items-center justify-center text-[#6EE730]">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display text-base font-extrabold text-white">
                        Financial Overview &amp; Wallet Ledger
                      </h4>
                      <p className="text-[11px] text-emerald-200/70">
                        Live balance, investments, and accumulated daily returns
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileBalanceVisible((prev) => !prev)}
                    className="p-1.5 rounded-lg bg-black/25 hover:bg-black/40 border border-white/10 text-emerald-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title={profileBalanceVisible ? 'Hide Balance' : 'Show Balance'}
                  >
                    {profileBalanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="text-[11px] hidden xs:inline">{profileBalanceVisible ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* Available Balance */}
                  <div className="rounded-2xl bg-[#031d12] border border-[#4ade80]/40 p-3 sm:p-3.5 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Available Balance
                    </span>
                    <span className="font-display text-lg sm:text-xl font-black text-[#facc15] tabular-nums block truncate">
                      {profileBalanceVisible ? formatPkr(user.balance) : 'Rs ••••••'}
                    </span>
                    <span className="text-[10px] text-emerald-400/70 block">Withdrawable wallet</span>
                  </div>

                  {/* Total Investment */}
                  <div className="rounded-2xl bg-[#031d12] border border-[#22c55e]/40 p-3 sm:p-3.5 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Total Investment
                    </span>
                    <span className="font-display text-lg sm:text-xl font-black text-[#6EE730] tabular-nums block truncate">
                      {formatPkr(user.totalInvestment ?? activePlans.filter((p) => p.status === 'active').reduce((sum, p) => sum + p.investmentAmount, 0))}
                    </span>
                    <span className="text-[10px] text-emerald-400/70 block">Active principal locked</span>
                  </div>

                  {/* Daily Profit */}
                  <div className="rounded-2xl bg-[#031d12] border border-[#facc15]/40 p-3 sm:p-3.5 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Daily Profit
                    </span>
                    <span className="font-display text-lg sm:text-xl font-black text-[#fde047] tabular-nums block truncate">
                      {formatPkr(user.dailyProfit ?? activePlans.filter((p) => p.status === 'active').reduce((sum, p) => sum + p.projectedDailyProfit, 0))}
                    </span>
                    <span className="text-[10px] text-emerald-400/70 block">Per 24h cycle return</span>
                  </div>

                  {/* Total Profit Earned */}
                  <div className="rounded-2xl bg-[#031d12] border border-[#38bdf8]/40 p-3 sm:p-3.5 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Total Profit Earned
                    </span>
                    <span className="font-display text-lg sm:text-xl font-black text-[#38bdf8] tabular-nums block truncate">
                      {formatPkr(user.totalProfitEarned ?? user.totalEarnings ?? 0)}
                    </span>
                    <span className="text-[10px] text-emerald-400/70 block">Credited to balance</span>
                  </div>

                  {/* Total Earnings */}
                  <div className="rounded-2xl bg-[#031d12] border border-emerald-400/25 p-3 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Total Earnings
                    </span>
                    <span className="font-display text-base sm:text-lg font-black text-white tabular-nums block truncate">
                      {formatPkr(user.totalEarnings ?? 0)}
                    </span>
                    <span className="text-[10px] text-emerald-400/60 block">Profit + Team commission</span>
                  </div>

                  {/* Total Deposits */}
                  <div className="rounded-2xl bg-[#031d12] border border-emerald-400/25 p-3 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Total Deposits
                    </span>
                    <span className="font-display text-base sm:text-lg font-black text-white tabular-nums block truncate">
                      {formatPkr(user.totalDeposits ?? 0)}
                    </span>
                    <span className="text-[10px] text-emerald-400/60 block">Approved capital</span>
                  </div>

                  {/* Total Withdrawals */}
                  <div className="rounded-2xl bg-[#031d12] border border-emerald-400/25 p-3 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Total Withdraw
                    </span>
                    <span className="font-display text-base sm:text-lg font-black text-white tabular-nums block truncate">
                      {formatPkr(user.totalWithdraw ?? 0)}
                    </span>
                    <span className="text-[10px] text-emerald-400/60 block">Disbursed to bank/wallet</span>
                  </div>

                  {/* Team Commission */}
                  <div className="rounded-2xl bg-[#031d12] border border-emerald-400/25 p-3 space-y-1">
                    <span className="text-[10.5px] font-bold text-emerald-300/80 block uppercase tracking-wider">
                      Team Commission
                    </span>
                    <span className="font-display text-base sm:text-lg font-black text-[#a7f3d0] tabular-nums block truncate">
                      {formatPkr(user.teamCommission ?? 0)}
                    </span>
                    <span className="text-[10px] text-emerald-400/60 block">12% L1 + 3% L2 bonuses</span>
                  </div>
                </div>
              </div>

              {/* 3. Investment History Banner (Exact Match to Screenshot 2) */}
              <div className="rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#3b0764] to-[#1e1b4b] border border-purple-400/40 p-4 sm:p-5 flex items-center gap-3.5 shadow-xl">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#6b21a8] to-[#c084fc] flex items-center justify-center text-white shadow-lg shrink-0">
                  <BarChart3 className="w-6 h-6 stroke-[2.4]" />
                </div>
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                    Investment <span className="text-[#c084fc]">History</span>
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-0.5 font-medium">
                    Your plans, profits and progress
                  </p>
                </div>
              </div>

              {/* 4. Filter Tabs (Screenshot 2 Matching) */}
              {(() => {
                const activeCount = activePlans.filter((p) => p.status === 'active').length;
                const completedCount = activePlans.filter((p) => p.status === 'completed').length;
                const pendingCount = pendingPlanDeposits.length;
                const allCount = activePlans.length + pendingCount;

                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setPlanFilter('all')}
                      className={`min-h-[38px] px-4 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        planFilter === 'all'
                          ? 'bg-[#10b956] text-white shadow-md shadow-emerald-950/40'
                          : 'bg-[#042013] text-emerald-200/80 hover:bg-[#07331f] border border-emerald-400/25'
                      }`}
                    >
                      All Investments ({allCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanFilter('active')}
                      className={`min-h-[38px] px-4 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        planFilter === 'active'
                          ? 'bg-[#10b956] text-white shadow-md shadow-emerald-950/40'
                          : 'bg-[#042013] text-emerald-200/80 hover:bg-[#07331f] border border-emerald-400/25'
                      }`}
                    >
                      Active ({activeCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanFilter('completed')}
                      className={`min-h-[38px] px-4 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        planFilter === 'completed'
                          ? 'bg-[#10b956] text-white shadow-md shadow-emerald-950/40'
                          : 'bg-[#042013] text-emerald-200/80 hover:bg-[#07331f] border border-emerald-400/25'
                      }`}
                    >
                      Completed ({completedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanFilter('pending')}
                      className={`min-h-[38px] px-4 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        planFilter === 'pending'
                          ? 'bg-[#facc15] text-[#052e16] shadow-md shadow-amber-950/40'
                          : 'bg-[#042013] text-emerald-200/80 hover:bg-[#07331f] border border-emerald-400/25'
                      }`}
                    >
                      Pending Verification ({pendingCount})
                    </button>
                  </div>
                );
              })()}

              {/* 5. Investment Plan Cards List */}
              {(() => {
                const displayedActivePlans = activePlans.filter((plan) => {
                  if (planFilter === 'all') return true;
                  if (planFilter === 'active') return plan.status === 'active';
                  if (planFilter === 'completed') return plan.status === 'completed';
                  return false;
                });

                const showPending = (planFilter === 'all' || planFilter === 'pending') && pendingPlanDeposits.length > 0;

                if (displayedActivePlans.length === 0 && !showPending) {
                  return (
                    <div className="rounded-3xl bg-[#041f14] border border-emerald-400/20 p-8 text-center space-y-3">
                      <Layers className="w-12 h-12 text-emerald-400/60 mx-auto" />
                      <h4 className="font-display text-lg font-extrabold text-white">
                        {planFilter === 'completed'
                          ? 'No Completed Plans Yet'
                          : planFilter === 'pending'
                            ? 'No Pending Verifications'
                            : 'No Active Investment Plan'}
                      </h4>
                      <p className="text-xs text-emerald-200/75 max-w-sm mx-auto">
                        Activate your desired VIP package to start generating automatic daily profits credited straight to your balance every 24 hours.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToPlans();
                        }}
                        className="mt-2 min-h-[44px] px-6 rounded-xl bg-gradient-to-r from-[#10b956] to-[#059669] text-white text-xs font-extrabold shadow-md cursor-pointer"
                      >
                        Browse All 20 Investment Plans
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Render Pending Plan Verification Cards */}
                    {showPending && (
                      <div className="space-y-3">
                        {pendingPlanDeposits.map((dep) => (
                          <div
                            key={dep.id}
                            className="rounded-3xl bg-gradient-to-b from-[#1c1806] to-[#120f03] border border-amber-400/50 p-4 sm:p-5 space-y-3 shadow-lg"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-400/40 text-amber-300 font-extrabold">
                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                <span>Pending Verification</span>
                              </span>
                              <span className="text-amber-200/75 text-[11px] font-mono">
                                Submitted: {formatDateTime(dep.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="font-display text-lg sm:text-xl font-black text-white">
                                  {dep.packageCode}
                                </h4>
                                <p className="text-xs text-amber-200/80">
                                  {dep.paymentMethod} · TID: <span className="font-mono font-bold text-amber-300">{dep.transactionRef}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] text-amber-200/70 block uppercase">Deposit Amount</span>
                                <span className="font-display text-lg sm:text-xl font-black text-[#facc15] tabular-nums">
                                  {formatPkr(dep.amount)}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-amber-300/80 bg-amber-950/40 rounded-xl p-2.5 border border-amber-400/20">
                              Awaiting Admin verification. Once approved, this plan activates automatically and starts your 24h profit cycles.
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Active and Completed Investment Cards (Matching Screenshot 2) */}
                    {displayedActivePlans.map((plan) => {
                      const duration = plan.durationDays || 30;
                      const credited = plan.daysCredited || 0;
                      const progressPercent = Math.min(100, Math.round((credited / duration) * 100));
                      const totalProfitExpected = duration * plan.projectedDailyProfit;
                      const totalEarnedSoFar = plan.totalProfitCredited || (credited * plan.projectedDailyProfit);
                      const remainingProfitExpected = Math.max(0, totalProfitExpected - totalEarnedSoFar);

                      return (
                        <div
                          key={plan.id}
                          className="rounded-3xl bg-gradient-to-b from-[#06301e] via-[#042315] to-[#02170e] border border-emerald-400/40 p-4 sm:p-5 space-y-4 shadow-xl"
                        >
                          {/* Top Card Header: Status & Reference */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-emerald-400/20 pb-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6EE730]">
                              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping" />
                              <span className="capitalize">{plan.status === 'active' ? 'Active Plan' : 'Completed'}</span>
                            </span>
                            <span className="text-emerald-200/70 text-[11px] font-mono truncate">
                              Invested on: {formatDateTime(plan.startedAt)} · Ref: <span className="text-[#facc15] font-bold">{plan.depositId || plan.id.substring(0, 10).toUpperCase()}</span>
                            </span>
                          </div>

                          {/* Main Row: Plan Info & Daily Profit Box */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#166534] to-[#22c55e] flex items-center justify-center text-white shrink-0">
                                  <BarChart3 className="w-5 h-5 stroke-[2.3]" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-display text-lg sm:text-xl font-black text-white">
                                      {plan.packageCode}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full bg-[#052919] border border-purple-400/40 text-[10px] font-extrabold text-purple-300">
                                      {duration} Days
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#facc15] font-semibold truncate">
                                    {plan.packageName}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-1">
                                <span className="text-[11px] text-emerald-300/75 block">Investment Amount</span>
                                <span className="font-display text-xl sm:text-2xl font-black text-white tabular-nums">
                                  {formatPkr(plan.investmentAmount)}
                                </span>
                              </div>
                            </div>

                            {/* Daily Profit Rounded Box */}
                            <div className="rounded-2xl bg-[#042416] border border-emerald-400/35 p-3 sm:p-4 text-right shrink-0 min-w-[130px]">
                              <span className="text-[11px] font-bold text-emerald-300/80 block uppercase">
                                Daily Profit
                              </span>
                              <span className="font-display text-lg sm:text-2xl font-black text-[#6EE730] tabular-nums block mt-0.5">
                                {formatPkr(plan.projectedDailyProfit)}
                              </span>
                            </div>
                          </div>

                          {/* Progress Section: Payouts Counter & Next Profit Live In */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-400/15">
                            {/* Plan Progress */}
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full border-2 border-[#38bdf8] bg-[#042416] flex items-center justify-center text-[#38bdf8] font-bold text-xs shrink-0 tabular-nums">
                                {progressPercent}%
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-emerald-200/80 font-semibold">Plan Progress</span>
                                  <span className="text-white font-bold tabular-nums">
                                    {credited} / {duration} payouts
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[#031c11] overflow-hidden border border-emerald-400/20">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#10b956] to-[#38bdf8] transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Next Profit In */}
                            <div className="rounded-xl bg-[#042013] border border-emerald-400/25 p-2.5 flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#facc15] animate-pulse shrink-0" />
                                <div>
                                  <span className="text-[10px] text-emerald-300/75 block">Next Profit In</span>
                                  <span className="font-bold text-white tabular-nums">
                                    {user.nextProfitAt ? formatDateTime(user.nextProfitAt) : 'Auto 24h cycle'}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-[10px] font-bold text-[#86efac]">
                                Active
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: 3 Metrics (Screenshot 2 Matching) */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-400/15 text-xs text-center">
                            <div className="rounded-xl bg-[#041f14] p-2 sm:p-2.5">
                              <p className="text-[10.5px] text-emerald-300/75 uppercase tracking-tight">Total Profit Earned</p>
                              <p className="font-display text-sm sm:text-base font-extrabold text-[#6EE730] tabular-nums mt-0.5">
                                {formatPkr(totalEarnedSoFar)}
                              </p>
                            </div>
                            <div className="rounded-xl bg-[#041f14] p-2 sm:p-2.5">
                              <p className="text-[10.5px] text-emerald-300/75 uppercase tracking-tight">Remaining Profit (Exp)</p>
                              <p className="font-display text-sm sm:text-base font-extrabold text-[#facc15] tabular-nums mt-0.5">
                                {formatPkr(remainingProfitExpected)}
                              </p>
                            </div>
                            <div className="rounded-xl bg-[#041f14] p-2 sm:p-2.5">
                              <p className="text-[10.5px] text-emerald-300/75 uppercase tracking-tight">Total Profit (Exp)</p>
                              <p className="font-display text-sm sm:text-base font-extrabold text-white tabular-nums mt-0.5">
                                {formatPkr(totalProfitExpected)}
                              </p>
                            </div>
                          </div>

                          {/* Dates & Disclaimer */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-emerald-300/65 pt-1">
                            <span>Started: {formatDateTime(plan.startedAt)}</span>
                            <span>Expires: {formatDateTime(plan.expiresAt)}</span>
                          </div>

                          <p className="text-[10px] text-emerald-300/50 text-center leading-relaxed">
                            Progress is based on payouts received. Expected profit excludes capital and referral bonuses. Dates and times follow the platform timezone.
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : section === 'my_team' ? (
            /* 3. MY TEAM (Level 1: 12% & Level 2: 3% — Separate Rates) */
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-b from-[#073824] to-[#042416] border border-emerald-400/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-emerald-200/80">Your Reference Code</p>
                    <p className="font-mono text-xl font-bold text-[#facc15] truncate">{user.referralCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="min-h-[38px] px-3.5 rounded-xl bg-[#041f14] hover:bg-[#07301f] border border-[#facc15]/40 text-[#facc15] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Permanent Public HTTPS Referral Link */}
                <div className="rounded-xl bg-[#02170e] border border-emerald-400/20 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Link2 className="w-3.5 h-3.5 text-[#6EE730] -rotate-45 shrink-0" />
                    <span className="text-xs font-mono text-emerald-100/90 truncate select-all">
                      {effectiveReferralUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="min-h-[32px] px-3 rounded-lg bg-[#10b956] hover:bg-[#0ea54c] text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* Direct Share Options: WhatsApp, Android Native Share Sheet, Copy Link */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="min-h-[40px] px-2 rounded-xl bg-gradient-to-b from-[#25D366] to-[#128C7E] hover:brightness-105 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[2.4]" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAndroidShare}
                    className="min-h-[40px] px-2 rounded-xl bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] hover:brightness-105 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 stroke-[2.4]" />
                    <span>Share App</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="min-h-[40px] px-2 rounded-xl bg-[#083a24] hover:bg-[#0c4e31] border border-emerald-400/40 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-[#facc15]" />
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                {teamShareFeedback && (
                  <p className="text-center text-xs font-bold text-[#6EE730]">
                    {teamShareFeedback}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3">
                  <p className="text-[11px] text-emerald-200/75">Level 1 (12%)</p>
                  <p className="font-display text-xl font-extrabold text-white tabular-nums mt-0.5">
                    {user.level1Count}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3">
                  <p className="text-[11px] text-emerald-200/75">Level 2 (3%)</p>
                  <p className="font-display text-xl font-extrabold text-white tabular-nums mt-0.5">
                    {user.level2Count}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3">
                  <p className="text-[11px] text-emerald-200/75">Commission</p>
                  <p className="font-display text-base sm:text-lg font-extrabold text-[#facc15] tabular-nums mt-0.5 truncate">
                    {formatPkr(user.teamCommission)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#041f14] p-1 rounded-xl">
                {[
                  { key: 'all' as const, label: `All (${user.teamMembersCount})` },
                  { key: 1 as const, label: `Level 1 · 12% (${user.level1Count})` },
                  { key: 2 as const, label: `Level 2 · 3% (${user.level2Count})` },
                ].map((tab) => (
                  <button
                    key={String(tab.key)}
                    type="button"
                    onClick={() => setTeamTab(tab.key)}
                    className={`flex-1 min-h-[36px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      teamTab === tab.key
                        ? 'bg-[#10b956] text-white'
                        : 'text-emerald-200/75 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredTeam.length === 0 ? (
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/15 p-7 text-center">
                  <Users className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">No referral members in this tier yet</p>
                  <p className="text-xs text-emerald-200/70 mt-1">
                    Earn separate referral bonuses of <strong>12%</strong> (Level 1) and <strong>3%</strong> (Level 2)
                    when your invited members have verified deposits.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTeam.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl bg-[#041f14] border border-emerald-400/20 px-4 py-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {member.name}{' '}
                          <span className="text-[11px] font-semibold text-[#facc15] ml-1">
                            · Level {member.level}
                          </span>
                        </p>
                        <p className="text-xs text-emerald-200/65 tabular-nums">{member.phoneMasked}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-emerald-200/70">Verified Invest</p>
                        <p className="text-xs font-bold text-[#6EE730] tabular-nums">
                          {formatPkr(member.investment)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : section === 'profit' ? (
            /* 4. PROFIT & COMPLETE TRANSACTION LEDGER */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3">
                  <p className="text-[11px] text-emerald-200/70">Total Earnings</p>
                  <p className="font-display text-base sm:text-lg font-extrabold text-[#facc15] tabular-nums mt-0.5">
                    {formatPkr(user.totalEarnings)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3">
                  <p className="text-[11px] text-emerald-200/70">Today Earnings</p>
                  <p className="font-display text-base sm:text-lg font-extrabold text-[#6EE730] tabular-nums mt-0.5">
                    {formatPkr(user.todayEarnings)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3">
                  <p className="text-[11px] text-emerald-200/70">Team Bonus</p>
                  <p className="font-display text-base sm:text-lg font-extrabold text-[#facc15] tabular-nums mt-0.5">
                    {formatPkr(user.teamCommission)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 bg-[#041f14] p-1.5 rounded-xl">
                {[
                  { key: 'all' as const, label: 'All' },
                  { key: 'plan_profit' as const, label: 'Daily Profit' },
                  { key: 'referral_commission' as const, label: 'Refer Bonus' },
                  { key: 'deposit' as const, label: 'Deposits' },
                  { key: 'withdrawal' as const, label: 'Withdrawals' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setTxFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      txFilter === f.key
                        ? 'bg-[#10b956] text-white'
                        : 'text-emerald-200/75 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/15 p-8 text-center">
                  <TrendingUp className="w-9 h-9 text-emerald-400/60 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No transaction records in this view</p>
                  <p className="text-xs text-emerald-200/70 mt-1">
                    All verified plan profits, referral commissions, deposits, and withdrawals appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{tx.title}</p>
                        <p className="text-xs text-emerald-200/70 mt-0.5">{tx.description}</p>
                        <p className="text-[11px] text-emerald-200/50 mt-1">{formatDateTime(tx.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p
                          className={`font-display text-base font-extrabold tabular-nums ${
                            tx.type === 'withdrawal' ? 'text-amber-300' : 'text-[#6EE730]'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? '-' : '+'}
                          {formatPkr(tx.amount)}
                        </p>
                        <StatusLabel status={tx.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : section === 'deposit_history' ? (
            /* 5. DEPOSIT HISTORY */
            <div className="space-y-3">
              {deposits.length === 0 ? (
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/15 p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-white">No Deposit Requests Submitted Yet</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToPlans();
                    }}
                    className="min-h-[42px] px-5 rounded-xl bg-[#10b956] text-white text-xs font-bold cursor-pointer"
                  >
                    Open Investment Plans (NBV-01 to NBV-15)
                  </button>
                </div>
              ) : (
                deposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="rounded-2xl bg-[#041f14] border border-emerald-400/25 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-display text-base font-extrabold text-white">
                          {dep.packageCode}
                        </span>
                        <span className="text-xs font-bold text-[#facc15] ml-2 tabular-nums">
                          {formatPkr(dep.amount)}
                        </span>
                      </div>
                      <StatusLabel status={dep.status} />
                    </div>

                    <div className="text-xs text-emerald-100/80 space-y-0.5">
                      <p>
                        Method: <strong>{dep.paymentMethod}</strong> · TID:{' '}
                        <span className="font-mono">{dep.transactionRef}</span>
                      </p>
                      <p>
                        Sender: {dep.senderAccountName} ({dep.senderAccountNumber})
                      </p>
                      <p className="text-emerald-200/55">{formatDateTime(dep.createdAt)}</p>
                    </div>

                    {dep.status === 'rejected' && dep.rejectionReason && (
                      <div className="rounded-xl bg-red-950/60 border border-red-400/35 px-3 py-2 text-xs text-red-200">
                        <strong>Rejection Reason:</strong> {dep.rejectionReason}
                      </div>
                    )}

                    {dep.hasReceipt && (
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(dep.id)}
                        className="min-h-[36px] px-3.5 rounded-lg bg-[#083c26] hover:bg-[#0b4f33] text-xs font-semibold text-[#fde047] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{receiptLoadingId === dep.id ? 'Loading...' : 'View Uploaded Receipt'}</span>
                      </button>
                    )}
                  </div>
                ))
              )}

              {receiptBlobUrl && (
                <div className="rounded-2xl bg-[#041f14] border border-[#facc15]/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#facc15]">Uploaded Payment Receipt</span>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(receiptBlobUrl);
                        setReceiptBlobUrl(null);
                      }}
                      className="text-xs text-emerald-200 hover:text-white cursor-pointer"
                    >
                      Hide
                    </button>
                  </div>
                  <img
                    src={receiptBlobUrl}
                    alt="Uploaded payment receipt"
                    className="max-h-72 mx-auto rounded-xl object-contain"
                  />
                </div>
              )}
            </div>
          ) : section === 'withdraw_history' ? (
            /* 6. WITHDRAWAL HISTORY */
            <div className="space-y-3">
              {withdrawals.length === 0 ? (
                <div className="rounded-2xl bg-[#041f14] border border-emerald-400/15 p-8 text-center">
                  <p className="text-sm font-bold text-white">No Withdrawal Requests Yet</p>
                  <p className="text-xs text-emerald-200/70 mt-1">
                    Submitted withdrawal requests and their approval statuses will be listed here.
                  </p>
                </div>
              ) : (
                withdrawals.map((wd) => (
                  <div
                    key={wd.id}
                    className="rounded-2xl bg-[#041f14] border border-emerald-400/25 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg font-extrabold text-[#facc15] tabular-nums">
                        {formatPkr(wd.amount)}
                      </span>
                      <StatusLabel status={wd.status} />
                    </div>
                    <div className="text-xs text-emerald-100/80 space-y-0.5">
                      <p>
                        Method: <strong>{wd.method}</strong> · {wd.accountTitle} ({wd.accountNumber})
                      </p>
                      <p className="text-emerald-200/55">{formatDateTime(wd.createdAt)}</p>
                    </div>
                    {wd.status === 'rejected' && wd.rejectionReason && (
                      <div className="rounded-xl bg-red-950/60 border border-red-400/35 px-3 py-2 text-xs text-red-200">
                        <strong>Rejection Reason:</strong> {wd.rejectionReason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : section === 'admin_support' ? (
            /* 7. IN-APP MESSAGING & ADMIN SUPPORT CHAT */
            <div className="space-y-4">
              {/* In-App Support Header Banner (No Phone/WhatsApp Support Numbers) */}
              <div className="rounded-2xl bg-[#073824] border border-emerald-400/35 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#041f14] border border-[#6EE730]/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#6EE730]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-white truncate">
                        Direct In-App Support Chat
                      </p>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#6EE730]" />
                    </div>
                    <p className="text-xs text-emerald-100/80">
                      Send a message or report any issue. Admin is notified instantly and replies right here.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversation History Window */}
              <div className="rounded-2xl bg-[#041f14] border border-emerald-400/25 p-3.5 sm:p-4 min-h-[260px] max-h-[42vh] overflow-y-auto space-y-3">
                {supportMessages.length === 0 ? (
                  <div className="h-[220px] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#06321f] border border-emerald-400/25 flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6 text-[#6EE730]" />
                    </div>
                    <p className="text-sm font-bold text-white">
                      Start a Support Conversation
                    </p>
                    <p className="text-xs text-emerald-200/75 mt-1 max-w-sm">
                      Have a question about deposits, withdrawals, or your account? Type your message below and NBV Admin Support will reply directly inside the app.
                    </p>
                  </div>
                ) : (
                  supportMessages.map((msg) => {
                    const isCustomer = msg.senderRole === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 shadow-sm space-y-1 ${
                            isCustomer
                              ? 'bg-gradient-to-br from-[#10b956] to-[#0b823c] text-white rounded-br-sm'
                              : 'bg-[#073b25] border border-[#facc15]/45 text-emerald-50 rounded-bl-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`text-[10.5px] font-extrabold tracking-wide uppercase ${
                                isCustomer ? 'text-[#fde047]' : 'text-[#facc15]'
                              }`}
                            >
                              {isCustomer
                                ? msg.subject || 'You'
                                : 'NBV Admin Support'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {msg.body}
                          </p>
                        </div>
                        <div className="mt-1 px-1 flex items-center gap-1.5 text-[10.5px] text-emerald-200/65">
                          <span>{formatDateTime(msg.createdAt)}</span>
                          {isCustomer && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  msg.readByAdmin
                                    ? 'text-[#6EE730] font-semibold'
                                    : 'text-emerald-200/70'
                                }
                              >
                                {msg.readByAdmin ? 'Seen by Admin' : 'Admin Notified'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={supportChatEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSendSupportMessage}
                className="space-y-3 bg-[#041f14] border border-emerald-400/25 rounded-2xl p-3.5 sm:p-4"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-200/80 mr-1">
                    Topic:
                  </span>
                  {['General Issue', 'Deposit / TID', 'Withdrawal', 'Account Help'].map(
                    (topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSupportTopic(topic)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          supportTopic === topic
                            ? 'bg-[#facc15] text-[#042416]'
                            : 'bg-[#06321f] text-emerald-100 border border-emerald-400/20 hover:bg-[#094229]'
                        }`}
                      >
                        {topic}
                      </button>
                    )
                  )}
                </div>

                {supportError && (
                  <p className="text-xs text-red-300 font-semibold">{supportError}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <textarea
                    rows={2}
                    required
                    value={supportBody}
                    onChange={(e) => setSupportBody(e.target.value)}
                    placeholder="Write your message or report an issue..."
                    className="flex-1 p-3 rounded-xl bg-[#05291a] border border-emerald-400/30 text-sm text-white placeholder:text-emerald-200/45 focus:outline-none focus:border-[#facc15]"
                  />
                  <button
                    type="submit"
                    disabled={supportSending || !supportBody.trim()}
                    className="min-h-[46px] px-5 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] disabled:opacity-55 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{supportSending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : section === 'join_channel' ? (
            /* 8. OFFICIAL CHANNEL UPDATES */
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-[#073824] border border-emerald-400/35 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-6 h-6 text-[#facc15] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">
                      NBV Trading Official WhatsApp Channel
                    </p>
                    <p className="text-xs text-emerald-200/80">
                      Join directly to receive the latest updates, announcements, and notifications
                    </p>
                  </div>
                </div>

                <a
                  href={
                    channelName.startsWith('http')
                      ? channelName
                      : 'https://whatsapp.com/channel/0029VbDmmVb1iUxek51QYq1o'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[50px] px-4 rounded-xl bg-gradient-to-r from-[#16a34a] via-[#15803d] to-[#0d9448] hover:brightness-110 border border-[#86efac]/65 text-white font-display text-xs sm:text-sm font-extrabold tracking-wide flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer text-center"
                >
                  <span>JOIN OUR OFFICIAL WHATSAPP CHANNEL</span>
                  <ExternalLink className="w-4 h-4 text-[#fde047] shrink-0" />
                </a>
              </div>

              {announcements.map((ann) => (
                <div key={ann.id} className="rounded-2xl bg-[#041f14] border border-emerald-400/20 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#facc15] font-semibold">
                    <span>{ann.category}</span>
                    <span>{formatDateTime(ann.createdAt)}</span>
                  </div>
                  <h4 className="font-display text-base font-bold text-white">{ann.title}</h4>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">{ann.body}</p>
                </div>
              ))}
            </div>
          ) : section === 'fbr_docs' ? (
            /* 9A. OFFICIAL FBR DOCUMENTS (READ-ONLY — MANAGED BY ADMIN) */
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#041f14] border border-emerald-400/30 p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck2 className="w-8 h-8 text-[#6EE730] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-[#6EE730] font-bold">
                        Official Platform Registration
                      </p>
                      <h4 className="font-display text-base sm:text-lg font-extrabold text-white truncate">
                        NBV Trading FBR Registration Certificate
                      </h4>
                    </div>
                  </div>
                  {docsInfo?.fbrDocumentMime !== 'application/pdf' && (
                    <button
                      type="button"
                      onClick={() => setShowOfficialFbrZoom((prev) => !prev)}
                      className="min-h-[36px] px-3 rounded-lg bg-[#083c26] hover:bg-[#0b4f33] text-xs font-bold text-[#fde047] cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {showOfficialFbrZoom ? 'Compact View' : 'Full View'}
                    </button>
                  )}
                </div>

                <div className="rounded-xl bg-white p-2 border border-emerald-400/20">
                  {docsInfo?.fbrDocumentMime === 'application/pdf' && docsInfo.fbrDocumentUrl ? (
                    <iframe
                      src={docsInfo.fbrDocumentUrl}
                      title="Official FBR Registration Certificate"
                      className="w-full h-[65vh] rounded-lg bg-white"
                    />
                  ) : (
                    <img
                      src={
                        docsInfo?.fbrDocumentUrl ||
                        '/assets/aistudio/file_00000000595c8230857e035a6f403914_ec47d0fc.png'
                      }
                      alt="Official FBR Registration Certificate for NBV Trading"
                      referrerPolicy="no-referrer"
                      onClick={() => setShowOfficialFbrZoom((prev) => !prev)}
                      className={`w-full mx-auto rounded-lg object-contain cursor-pointer transition-all ${
                        showOfficialFbrZoom ? 'max-h-[75vh]' : 'max-h-80'
                      }`}
                    />
                  )}
                </div>

                <div className="rounded-xl bg-[#06321f] border border-emerald-400/20 p-3.5 text-xs space-y-1.5 text-emerald-50">
                  <p>
                    <strong>Official Record:</strong>{' '}
                    {docsInfo?.fbrRegistrationRef ||
                      'FBR Registration No: 1886105 · Reference No: 1886105-1 · RTO ISLAMABAD'}
                  </p>
                  <p className="text-emerald-200/80">
                    <strong>Entity Name:</strong> NBV TRADING · <strong>Status:</strong> Income Tax: Active, Sales Tax: OPERATIVE
                  </p>
                </div>
              </div>
            </div>
          ) : section === 'secp_docs' ? (
            /* 9B. OFFICIAL SECP CORPORATE DOCUMENTS (READ-ONLY — MANAGED BY ADMIN) */
            <div className="rounded-2xl bg-[#041f14] border border-[#facc15]/35 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileCheck2 className="w-9 h-9 text-[#facc15] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-[#6EE730] font-bold">
                      Corporate Verification Record
                    </p>
                    <h4 className="font-display text-base sm:text-lg font-extrabold text-white truncate">
                      SECP Corporate Registration Information
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfficialSecpZoom((prev) => !prev)}
                  className="min-h-[36px] px-3 rounded-lg bg-[#083c26] hover:bg-[#0b4f33] text-xs font-bold text-[#fde047] cursor-pointer whitespace-nowrap shrink-0"
                >
                  {showOfficialSecpZoom ? 'Compact View' : 'Full View'}
                </button>
              </div>

              {/* Official Permanent SECP Certificate Display */}
              {(() => {
                const secpUrl = docsInfo?.secpDocumentUrl || '/assets/secp-certificate-nbv.png';
                const isPdf = docsInfo?.secpDocumentMime === 'application/pdf';
                return (
                  <div className="rounded-xl bg-white p-2 border border-emerald-400/20 shadow-md">
                    {isPdf ? (
                      <iframe
                        src={secpUrl}
                        title="Official SECP Registration Document"
                        className="w-full h-[65vh] rounded-lg bg-white"
                      />
                    ) : (
                      <img
                        src={secpUrl}
                        alt="Official SECP Corporate Registration Certificate"
                        referrerPolicy="no-referrer"
                        onClick={() => setShowOfficialSecpZoom((prev) => !prev)}
                        className={`w-full mx-auto rounded-lg object-contain cursor-pointer transition-all ${
                          showOfficialSecpZoom ? 'max-h-[75vh]' : 'max-h-80'
                        }`}
                      />
                    )}
                  </div>
                );
              })()}

              <div className="rounded-xl bg-[#06321f] border border-emerald-400/20 p-4 text-xs space-y-2 text-emerald-50">
                <p>
                  <strong>Official SECP Record:</strong>{' '}
                  {docsInfo?.secpRegistrationRef ||
                    'Corporate Unique Identification No. 886105 · NBV TRADING (SMC-PRIVATE) LIMITED · SECP ISLAMABAD'}
                </p>
                <p className="text-emerald-200/85">
                  <strong>Company Status:</strong> Incorporated under Section 16 of Companies Act 2017 (XIX of 2017) · Limited by Shares
                </p>
                <p className="text-emerald-200/75 leading-relaxed">
                  Certificate issued at Islamabad on 30-OCT-2026 by Assistant Registrar Muhammad Shoaib Khan. Verified via official SECP eServices.
                </p>
              </div>
            </div>
          ) : section === 'badges' ? (
            /* 10. MEMBER RANKS & BADGES */
            <div className="space-y-3">
              {[
                { title: 'Member', req: 'Active Registered Account', active: true },
                { title: 'Silver Trader', req: '10+ Referral Team Members', active: user.teamMembersCount >= 10 },
                { title: 'Gold Leader', req: '50+ Referral Team Members', active: user.teamMembersCount >= 50 },
                { title: 'NBV Director', req: '100+ Referral Team Members', active: user.teamMembersCount >= 100 },
              ].map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl bg-[#041f14] border border-emerald-400/20 px-4 py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Award className={`w-6 h-6 ${b.active ? 'text-[#facc15]' : 'text-emerald-200/35'}`} />
                    <div>
                      <p className="text-sm font-bold text-white">{b.title}</p>
                      <p className="text-xs text-emerald-200/70">{b.req}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${b.active ? 'text-[#6EE730]' : 'text-emerald-200/50'}`}>
                    {b.active ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* 11. ANDROID APP INSTALL INFO */
            <div className="py-1">
              <PWAInstallButton variant="modal_card" onInstalled={onClose} />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[46px] mt-2 rounded-xl bg-[#0b4d30] hover:bg-[#0e5e3b] border border-emerald-400/30 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
