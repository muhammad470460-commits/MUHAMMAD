import React, { useEffect, useState } from 'react';
import {
  Menu,
  LogOut,
  Crown,
  Eye,
  EyeOff,
  Link2,
  ArrowRight,
  X,
  Check,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bell,
  MessageCircle,
  Share2,
  Copy,
  Send,
  User,
} from 'lucide-react';
import { buildReferralUrl, buildShareMessage } from '../utils/publicUrl';
import {
  NbvShieldEmblem,
  WalletWithCoins,
  WithdrawTrayIcon,
  ReceiptHistoryIcon,
  StackedPlansIcon,
  PurpleTeamIcon,
  PinkProfitChartIcon,
  CyanClockHistoryIcon,
  LimeAndroidPhoneIcon,
  StackedGoldCoinsIcon,
  EmeraldGiftIcon,
  WhatsAppSquareIcon,
  SupportChatSquareIcon,
  CertificateGoldSquareIcon,
  PromoSkylineArtwork,
} from './NbvVisuals';
import { DailyProfitCard } from './DailyProfitCard';
import { UserModulesModal } from './UserModulesModal';
import type {
  AppNotificationItem,
  DashboardSectionModal,
  SupportChatMessage,
  UserProfile,
} from '../types';

interface DashboardScreenProps {
  user: UserProfile;
  authToken: string;
  initialModal?: DashboardSectionModal;
  onClearInitialModal?: () => void;
  notifications: AppNotificationItem[];
  unreadNotificationsCount: number;
  unreadCustomerSupportCount: number;
  unreadAdminSupportCount: number;
  lastIncomingMessage: SupportChatMessage | null;
  onMarkNotificationRead: (id: string) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onRefreshNotifications: () => Promise<void>;
  onOpenAdminSupportThread: (customerUserId: string) => void;
  onOpenDepositPlans: () => void;
  onOpenWithdraw: () => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
  onRefreshProfile: () => Promise<void>;
}

function formatPkr(amount: number): string {
  return `Rs ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const OFFICIAL_WHATSAPP_CHANNEL_URL =
  'https://whatsapp.com/channel/0029VbDmmVb1iUxek51QYq1o';

export function DashboardScreen({
  user,
  authToken,
  initialModal = null,
  onClearInitialModal,
  notifications,
  unreadNotificationsCount,
  unreadCustomerSupportCount,
  unreadAdminSupportCount,
  lastIncomingMessage,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onRefreshNotifications,
  onOpenAdminSupportThread,
  onOpenDepositPlans,
  onOpenWithdraw,
  onOpenAdminPanel,
  onLogout,
  onRefreshProfile,
}: DashboardScreenProps) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<DashboardSectionModal>(initialModal);
  const [officialChannelUrl, setOfficialChannelUrl] = useState<string>(
    OFFICIAL_WHATSAPP_CHANNEL_URL
  );

  useEffect(() => {
    if (initialModal) {
      setActiveModal(initialModal);
    }
  }, [initialModal]);

  useEffect(() => {
    const onFocus = () => {
      void onRefreshProfile();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [onRefreshProfile]);

  useEffect(() => {
    let active = true;
    fetch('/api/channel', {
      credentials: 'include',
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          active &&
          data &&
          typeof data.officialChannelUrl === 'string' &&
          data.officialChannelUrl.startsWith('http')
        ) {
          setOfficialChannelUrl(data.officialChannelUrl);
        }
      })
      .catch(() => {
        // Keep canonical official WhatsApp Channel invitation link
      });
    return () => {
      active = false;
    };
  }, [authToken]);

  const referralUrl = buildReferralUrl(user.referralCode);
  const shareMessage = buildShareMessage(user.referralCode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  async function handleCopyReferral() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = referralUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
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
          url: referralUrl,
        });
        setShareFeedback('Shared successfully!');
        setTimeout(() => setShareFeedback(null), 2500);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          void handleCopyReferral();
        }
      }
    } else {
      void handleCopyReferral();
    }
  }

  function openSection(section: DashboardSectionModal) {
    setDrawerOpen(false);
    void onRefreshProfile();
    setActiveModal(section);
  }

  function closeSection() {
    setActiveModal(null);
    if (onClearInitialModal) {
      onClearInitialModal();
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#042919] via-[#042014] to-[#02150d] text-white pb-8">
      <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-3.5 space-y-4">
        {/* 1. Top Header Bar */}
        <header className="flex items-center justify-between gap-3 py-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="w-14 h-14 rounded-2xl bg-[#06321f]/90 hover:bg-[#094229] border border-emerald-400/30 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-7 h-7 stroke-[2.4]" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <NbvShieldEmblem size={38} />
            <span className="font-display text-xl sm:text-2xl font-extrabold tracking-wide whitespace-nowrap">
              <span className="text-white">NBV </span>
              <span className="text-[#6EE730]">TRADING</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              aria-label="Open notifications"
              className="relative min-w-[54px] sm:min-w-[60px] h-16 px-2.5 rounded-2xl bg-[#06321f]/90 hover:bg-[#094229] border border-emerald-400/30 flex flex-col items-center justify-center gap-1 text-white transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 stroke-[2.3] text-[#fde047]" />
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                Alerts
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-md bg-red-500 border border-[#042416] text-[10px] font-extrabold text-white flex items-center justify-center tabular-nums">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="relative min-w-[58px] sm:min-w-[64px] h-16 px-2.5 sm:px-3 rounded-2xl bg-[#073a24] hover:bg-[#0b4f32] border border-[#facc15]/55 flex flex-col items-center justify-center gap-1 text-[#fde047] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
                <span className="text-[11px] font-bold leading-none whitespace-nowrap">Admin</span>
                {unreadAdminSupportCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-md bg-[#facc15] border border-[#042416] text-[10px] font-extrabold text-[#042416] flex items-center justify-center tabular-nums">
                    {unreadAdminSupportCount > 9 ? '9+' : unreadAdminSupportCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="min-w-[58px] sm:min-w-[66px] h-16 px-2.5 sm:px-3 rounded-2xl bg-[#06321f]/90 hover:bg-[#094229] border border-emerald-400/30 flex flex-col items-center justify-center gap-1 text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 stroke-[2.3]" />
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">Logout</span>
            </button>
          </div>
        </header>

        {/* 1. User Profile Row (Screenshot 4 Matching) */}
        <section className="rounded-3xl bg-gradient-to-r from-[#073b25] via-[#08432a] to-[#09482e] border border-[#2dd483]/45 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shadow-lg shadow-black/25">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-[62px] h-[62px] rounded-full border-2 border-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.35)] bg-[#042316] flex items-center justify-center shrink-0">
              <NbvShieldEmblem size={44} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight truncate">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#eab308] mt-0.5 truncate">
                Referred by: {user.referredBy || 'Official NBV'}
              </p>
            </div>
          </div>

          <div className="w-[60px] h-[60px] rounded-full border border-[#eab308]/65 bg-[#052919]/75 flex flex-col items-center justify-center gap-0.5 shrink-0 shadow-sm">
            <Crown className="w-5 h-5 text-[#facc15] fill-[#facc15]" />
            <span className="text-[11px] font-semibold text-[#fde047] leading-none text-center px-1">
              {user.memberRank || 'Member'}
            </span>
          </div>
        </section>

        {/* 2. Total Balance Card (Screenshot 4 Matching) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#052818] via-[#124d23] to-[#28701b] border border-[#4ade80]/40 px-5 sm:px-6 py-5 sm:py-6 flex items-center justify-between gap-3 shadow-lg shadow-black/25">
          <svg
            viewBox="0 0 400 120"
            fill="none"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-45"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M45 122C135 72 245 64 385 88"
              stroke="#EAB308"
              strokeWidth="2.5"
              strokeOpacity="0.6"
            />
            <path
              d="M65 126C155 82 255 74 390 96"
              stroke="#FACC15"
              strokeWidth="1.6"
              strokeOpacity="0.45"
            />
          </svg>
          <div className="relative z-10 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-white/90">Total Balance</p>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="font-display text-2xl sm:text-4xl font-extrabold text-[#f5d061] tabular-nums tracking-tight">
                {balanceVisible ? formatPkr(user.balance) : 'Rs ••••••'}
              </span>
              <button
                type="button"
                onClick={() => setBalanceVisible((prev) => !prev)}
                aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 border border-white/15 flex items-center justify-center text-white/90 transition-colors cursor-pointer shrink-0"
              >
                {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="relative z-10 shrink-0 -my-2 -mr-1">
            <WalletWithCoins size={96} className="sm:w-[110px] sm:h-[110px]" />
          </div>
        </section>

        {/* 3. Quick Referral Link Bar (Screenshot 4 Matching) */}
        <section className="rounded-2xl bg-[#02170e] border border-emerald-400/25 px-3 py-2.5 flex items-center justify-between gap-2.5 shadow-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link2 className="w-4 h-4 text-[#6EE730] -rotate-45 shrink-0" />
            <span className="text-xs text-emerald-100/90 font-mono truncate select-all">
              {referralUrl}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="min-h-[36px] px-4 rounded-xl bg-[#10b956] hover:bg-[#0ea54c] active:scale-[0.98] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </section>

        {/* 4. Four Action Cards (Deposit, Withdraw, Withdraw History, My Plans - Screenshot 4 Matching) */}
        <section className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={onOpenDepositPlans}
            className="min-h-[118px] sm:min-h-[130px] rounded-2xl bg-gradient-to-b from-[#17d45f] to-[#0a8f3d] border border-[#86efac]/60 p-2.5 flex flex-col items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            <WalletWithCoins size={46} />
            <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">
              Deposit
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenWithdraw}
            className="min-h-[118px] sm:min-h-[130px] rounded-2xl bg-gradient-to-b from-[#f7c644] to-[#c48312] border border-[#fde047]/65 p-2.5 flex flex-col items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            <WithdrawTrayIcon size={44} />
            <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">
              Withdraw
            </span>
          </button>

          <button
            type="button"
            onClick={() => openSection('withdraw_history')}
            className="min-h-[118px] sm:min-h-[130px] rounded-2xl bg-gradient-to-b from-[#f62b97] to-[#9b1256] border border-[#f9a8d4]/60 p-2 flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            <ReceiptHistoryIcon size={42} />
            <span className="text-[11px] sm:text-sm font-bold text-white text-center leading-tight">
              Withdraw History
            </span>
          </button>

          <button
            type="button"
            onClick={() => openSection('my_plans')}
            className="min-h-[118px] sm:min-h-[130px] rounded-2xl bg-gradient-to-b from-[#238cff] to-[#0b52c4] border border-[#93c5fd]/60 p-2.5 flex flex-col items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            <StackedPlansIcon size={44} />
            <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">
              My Plans
            </span>
          </button>
        </section>

        {/* 5. Live Running Countdown Timer (Next Profit) */}
        <DailyProfitCard
          user={user}
          authToken={authToken}
          onOpenDepositPlans={onOpenDepositPlans}
          onProfitSettled={async () => {
            await onRefreshProfile();
          }}
        />

        {/* 6. Invite Friends & Multi-Channel Share Card */}
        <section className="rounded-3xl bg-gradient-to-b from-[#06301e] to-[#042215] border border-emerald-400/35 p-4 sm:p-5 space-y-3 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b956] animate-pulse shrink-0" />
              <div>
                <h3 className="font-display text-sm sm:text-base font-extrabold text-white leading-tight">
                  Invite Friends &amp; Build Team
                </h3>
                <p className="text-[11px] text-[#6EE730] font-semibold">
                  Earn 12% Level-1 + 3% Level-2 Daily Team Bonus
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1.5 rounded-xl bg-[#031b11] hover:bg-[#072a1b] border border-[#facc15]/45 text-xs font-mono font-bold text-[#facc15] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Click to copy referral code"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Code Copied!' : user.referralCode}</span>
            </button>
          </div>

          {/* Multi-Channel Action Buttons: WhatsApp, Android Native Share Sheet, Copy Link */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="min-h-[44px] px-2.5 rounded-xl bg-gradient-to-b from-[#25D366] to-[#128C7E] hover:brightness-105 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 stroke-[2.5]" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleAndroidShare}
              className="min-h-[44px] px-2.5 rounded-xl bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] hover:brightness-105 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>Share App</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReferral}
              className="min-h-[44px] px-2.5 rounded-xl bg-[#083a24] hover:bg-[#0c4e31] border border-emerald-400/40 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-[#facc15]" />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {shareFeedback && (
            <p className="text-center text-xs font-bold text-[#6EE730] animate-pulse">
              {shareFeedback}
            </p>
          )}
        </section>

        {/* 7. Row 2: 4 Dark Sleek Action Cards */}
        <section className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => openSection('my_team')}
            className="min-h-[112px] sm:min-h-[124px] rounded-2xl bg-[#0b1913] hover:bg-[#0f231a] border border-white/12 p-2.5 flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.98] cursor-pointer"
          >
            <PurpleTeamIcon size={40} />
            <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">
              My Team
            </span>
          </button>

          <button
            type="button"
            onClick={() => openSection('profit')}
            className="min-h-[112px] sm:min-h-[124px] rounded-2xl bg-[#0b1913] hover:bg-[#0f231a] border border-white/12 p-2.5 flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.98] cursor-pointer"
          >
            <PinkProfitChartIcon size={40} />
            <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">
              Profit
            </span>
          </button>

          <button
            type="button"
            onClick={() => openSection('deposit_history')}
            className="min-h-[112px] sm:min-h-[124px] rounded-2xl bg-[#0b1913] hover:bg-[#0f231a] border border-white/12 p-2 flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
          >
            <CyanClockHistoryIcon size={38} />
            <span className="text-[11px] sm:text-sm font-bold text-white text-center leading-tight">
              Deposit History
            </span>
          </button>

          <button
            type="button"
            onClick={() => openSection('android_app')}
            className="min-h-[112px] sm:min-h-[124px] rounded-2xl bg-[#0b1913] hover:bg-[#0f231a] border border-white/12 p-2 flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
          >
            <LimeAndroidPhoneIcon size={38} />
            <span className="text-[10.5px] sm:text-xs font-bold text-white text-center leading-tight">
              Download Android App
            </span>
          </button>
        </section>

        {/* 7. Promotional Badges Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#041f14] via-[#062d1c] to-[#0d3a1e] border border-emerald-400/30 p-5 sm:p-6 flex items-center justify-between gap-2">
          <div className="relative z-10 max-w-[60%] sm:max-w-[62%]">
            <p className="text-[11px] tracking-[0.18em] uppercase text-emerald-100/85 font-semibold">
              NBV TRADING
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight mt-1.5">
              Small steps.
              <span className="block text-[#6EE730]">New possibilities.</span>
            </h2>
            <button
              type="button"
              onClick={() => openSection('badges')}
              className="mt-3 min-h-[36px] inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-100/90 hover:text-white transition-colors cursor-pointer"
            >
              <span>Explore badges</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <PromoSkylineArtwork className="w-40 sm:w-56 h-auto shrink-0 -mr-3 -my-3" />
        </section>

        {/* 9. Support & Contact Section + Official WhatsApp Channel CTA */}
        <section className="rounded-3xl bg-[#05291a] border border-emerald-400/30 p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-[11px] tracking-[0.14em] uppercase text-[#84cc16] font-semibold">
              HERE TO HELP
            </p>
            <h2 className="font-display text-2xl sm:text-[26px] font-extrabold text-white mt-0.5">
              Support &amp; Contact
            </h2>
          </div>

          {/* Direct Official WhatsApp Channel CTA Button */}
          <div className="rounded-2xl bg-[#073823] border border-[#4ade80]/40 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center gap-3">
              <WhatsAppSquareIcon size={42} />
              <div className="min-w-0">
                <p className="font-display text-sm sm:text-base font-extrabold text-white leading-snug">
                  Official NBV Trading WhatsApp Channel
                </p>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Join directly to receive the latest updates, announcements, and notifications.
                </p>
              </div>
            </div>

            <a
              href={officialChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[52px] px-4 sm:px-5 rounded-xl bg-gradient-to-r from-[#16a34a] via-[#15803d] to-[#0d9448] hover:brightness-110 active:scale-[0.99] border border-[#86efac]/65 text-white font-display text-xs sm:text-sm font-extrabold tracking-wide flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer text-center"
            >
              <span>JOIN OUR OFFICIAL WHATSAPP CHANNEL</span>
              <ExternalLink className="w-4 h-4 text-[#fde047] shrink-0" />
            </a>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => openSection('admin_support')}
              className="relative rounded-2xl bg-[#0a3c28] hover:bg-[#0d4a31] border border-emerald-300/25 px-2 py-3.5 flex flex-col items-center text-center transition-colors cursor-pointer"
            >
              {unreadCustomerSupportCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-md bg-[#facc15] text-[#042416] text-[10px] font-extrabold flex items-center justify-center tabular-nums shadow-sm">
                  {unreadCustomerSupportCount > 9 ? '9+' : unreadCustomerSupportCount}
                </span>
              )}
              <SupportChatSquareIcon size={42} />
              <span className="mt-2.5 text-[11px] sm:text-sm font-bold text-white leading-tight">
                Admin Support
              </span>
              <span className="mt-1 text-[10px] sm:text-xs text-emerald-100/70 leading-tight">
                In-App Chat
              </span>
            </button>

            <a
              href={officialChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#0a3c28] hover:bg-[#0d4a31] border border-emerald-300/25 px-2 py-3.5 flex flex-col items-center text-center transition-colors cursor-pointer"
            >
              <WhatsAppSquareIcon size={42} />
              <span className="mt-2.5 text-[11px] sm:text-sm font-bold text-white leading-tight">
                Join Channel
              </span>
              <span className="mt-1 text-[10px] sm:text-xs text-emerald-100/70 leading-tight">
                News &amp; updates
              </span>
            </a>

            <button
              type="button"
              onClick={() => openSection('fbr_docs')}
              className="rounded-2xl bg-[#0a3c28] hover:bg-[#0d4a31] border border-emerald-300/25 px-2 py-3.5 flex flex-col items-center text-center transition-colors cursor-pointer"
            >
              <CertificateGoldSquareIcon size={42} />
              <span className="mt-2.5 text-[11px] sm:text-sm font-bold text-white leading-tight">
                FBR Documents
              </span>
              <span className="mt-1 text-[10px] sm:text-xs text-emerald-100/70 leading-tight">
                View documents
              </span>
            </button>

            <button
              type="button"
              onClick={() => openSection('secp_docs')}
              className="rounded-2xl bg-[#0a3c28] hover:bg-[#0d4a31] border border-emerald-300/25 px-2 py-3.5 flex flex-col items-center text-center transition-colors cursor-pointer"
            >
              <CertificateGoldSquareIcon size={42} />
              <span className="mt-2.5 text-[11px] sm:text-sm font-bold text-white leading-tight">
                SECP Documents
              </span>
              <span className="mt-1 text-[10px] sm:text-xs text-emerald-100/70 leading-tight">
                View documents
              </span>
            </button>
          </div>
        </section>

        {/* 10. Bottom NBV Trading Tagline Card */}
        <section className="rounded-3xl bg-gradient-to-r from-[#084227] to-[#0c5935] border border-emerald-400/35 px-5 sm:px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.12em] uppercase text-[#a3e635] font-semibold">
              NBV TRADING
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white mt-1">
              Built for your next step.
            </h2>
          </div>
          <NbvShieldEmblem size={54} />
        </section>

        {/* 11. Footer Brand Signature */}
        <footer className="pt-2 pb-4 text-center">
          <p className="text-xs tracking-[0.22em] uppercase text-emerald-200/55 font-medium">
            NBV TRADING
          </p>
        </footer>
      </div>

      {/* Navigation Drawer (Hamburger Menu) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[82vw] h-full bg-[#042416] border-r border-emerald-400/25 p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-emerald-400/20">
                <div className="flex items-center gap-2">
                  <NbvShieldEmblem size={34} />
                  <span className="font-display text-lg font-extrabold text-white">
                    NBV <span className="text-[#6EE730]">TRADING</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="w-10 h-10 rounded-xl bg-[#073622] flex items-center justify-center text-emerald-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 p-3.5 rounded-2xl bg-[#073622] border border-emerald-400/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-emerald-200/75 truncate mt-0.5">{user.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#052919] border border-[#facc15]/50 text-[10px] font-extrabold text-[#fde047]">
                    {user.memberRank || 'VIP'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    openSection('my_profile');
                  }}
                  className="w-full min-h-[38px] px-3 rounded-xl bg-gradient-to-r from-[#10b956] to-[#059669] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile &amp; Investment Details</span>
                </button>
              </div>

              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenAdminPanel();
                  }}
                  className="w-full min-h-[44px] mb-3 px-3.5 rounded-xl bg-[#facc15] text-[#042416] font-extrabold text-sm flex items-center justify-between cursor-pointer"
                >
                  <span>Open Secure Admin Panel</span>
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}

              <a
                href={officialChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDrawerOpen(false)}
                className="w-full min-h-[46px] mb-3 px-3.5 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#15803d] hover:brightness-110 border border-[#86efac]/60 text-white font-extrabold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer"
              >
                <span>JOIN OUR OFFICIAL WHATSAPP CHANNEL</span>
                <ExternalLink className="w-4 h-4 text-[#fde047] shrink-0" />
              </a>

              <nav className="space-y-1.5 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    openSection('my_profile');
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[#facc15] bg-[#073622] hover:bg-[#0a452b] border border-[#facc15]/30 flex items-center justify-between transition-colors cursor-pointer font-bold"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>My Profile &amp; Investments</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#facc15]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenDepositPlans();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-emerald-50 hover:bg-[#094229] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Deposit / Investment Plans</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300/60" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenWithdraw();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-emerald-50 hover:bg-[#094229] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Withdraw</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300/60" />
                </button>
                {[
                  { label: 'Investment History & Plans', key: 'my_plans' as const },
                  { label: 'My Team', key: 'my_team' as const },
                  { label: 'Profit & Ledger', key: 'profit' as const },
                  { label: 'Deposit History', key: 'deposit_history' as const },
                  { label: 'Withdraw History', key: 'withdraw_history' as const },
                  { label: 'Admin Support (In-App Chat)', key: 'admin_support' as const },
                  { label: 'Channel Announcements', key: 'join_channel' as const },
                  { label: 'FBR Documents', key: 'fbr_docs' as const },
                  { label: 'SECP Documents', key: 'secp_docs' as const },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openSection(item.key)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-emerald-50 hover:bg-[#094229] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.key === 'admin_support' && unreadCustomerSupportCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#facc15] text-[#042416] text-[10px] font-extrabold tabular-nums">
                          {unreadCustomerSupportCount}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-300/60" />
                  </button>
                ))}
              </nav>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full min-h-[46px] mt-6 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-400/35 text-red-100 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </aside>
        </div>
      )}

      {/* In-App Notifications Center Modal */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setNotificationsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#05291a] border border-emerald-400/35 p-5 max-h-[82vh] overflow-y-auto shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-400/20">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-[#facc15]" />
                <h3 className="font-display text-lg font-extrabold text-white">
                  Notifications
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void onMarkAllNotificationsRead()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/25 text-[11px] font-bold text-[#fde047] cursor-pointer"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close notifications"
                  className="w-9 h-9 rounded-xl bg-[#073622] flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <MessageCircle className="w-8 h-8 text-emerald-300/50 mx-auto" />
                <p className="text-sm font-bold text-white">No notifications yet</p>
                <p className="text-xs text-emerald-200/70">
                  Instant alerts for support messages and Admin replies appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      void onMarkNotificationRead(notif.id);
                      setNotificationsOpen(false);
                      if (notif.type === 'customer_message' && user.role === 'admin') {
                        onOpenAdminSupportThread(notif.relatedUserId);
                      } else {
                        openSection('admin_support');
                      }
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
                        {new Date(notif.createdAt).toLocaleString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/85 line-clamp-2">{notif.body}</p>
                    <p className="text-[11px] font-bold text-[#6EE730]">
                      {notif.type === 'customer_message' && user.role === 'admin'
                        ? 'Tap to reply in Admin Panel →'
                        : 'Tap to view conversation →'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database-Backed User Module Modal */}
      {activeModal && (
        <UserModulesModal
          section={activeModal}
          user={user}
          authToken={authToken}
          referralUrl={referralUrl}
          lastIncomingMessage={lastIncomingMessage}
          onSupportRead={() => void onRefreshNotifications()}
          onClose={closeSection}
          onGoToPlans={onOpenDepositPlans}
          onRefreshProfile={onRefreshProfile}
        />
      )}
    </div>
  );
}
