import React, { useEffect, useState, useId } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Clock,
  Check,
  AlertTriangle,
  CheckCircle2,
  History,
  FileImage,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { NbvShieldEmblem } from './NbvVisuals';
import type { DepositRequestItem, InvestmentPlan, PaymentReceivingConfig } from '../types';

interface InvestmentPlansComponentProps {
  authToken: string;
  onBackToDashboard: () => void;
  onOpenDepositHistory: () => void;
  onDepositSubmitted: () => Promise<void>;
}

function formatRsDot(val: number): string {
  return `Rs. ${val.toLocaleString('en-PK')}`;
}

function formatPkrDecimal(val: number): string {
  return `PKR ${val.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatProfitRate(plan: InvestmentPlan): string {
  const computed =
    typeof plan.profitRatePercent === 'number' && plan.profitRatePercent > 0
      ? plan.profitRatePercent
      : plan.investmentAmount > 0
        ? Number(((plan.projectedDailyProfit / plan.investmentAmount) * 100).toFixed(2))
        : 0;
  return `${computed}%`;
}

function formatPlanDisplayTitle(plan: InvestmentPlan): string {
  return plan.section === 4 ? plan.code.replace('-', ' ') : plan.code;
}

function PlanCoinsLeafBadgeIcon() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width="50" height="46" viewBox="0 0 64 58" fill="none" className="shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`leafG-${uid}`} x1="4" y1="6" x2="32" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="55%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id={`coinG-${uid}`} x1="18" y1="12" x2="58" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="45%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path d="M18 34C7 30 4 17 12 8C21 12 25 22 18 34Z" fill={`url(#leafG-${uid})`} />
      <path d="M26 30C19 20 22 9 32 5C36 14 34 24 26 30Z" fill="#4ADE80" />
      <path d="M14 42C5 40 2 31 7 24C15 26 18 34 14 42Z" fill="#16A34A" />
      <path d="M10 38L44 16" stroke="#FDE047" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="16" y="38" width="12" height="14" rx="3" fill={`url(#coinG-${uid})`} />
      <rect x="30" y="24" width="13" height="28" rx="3" fill={`url(#coinG-${uid})`} />
      <rect x="45" y="31" width="12" height="21" rx="3" fill={`url(#coinG-${uid})`} />
      <circle cx="42" cy="43" r="10" fill={`url(#coinG-${uid})`} stroke="#92400E" strokeOpacity="0.45" strokeWidth="1.5" />
      <text x="42" y="46.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#78350F">
        ₨
      </text>
    </svg>
  );
}

function CashStackMiniIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M20 7L35 15L20 23L5 15L20 7Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
      <path d="M5 20L20 28L35 20" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      <path d="M5 25.5L20 33.5L35 25.5" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="15" r="3.5" fill="#FEF08A" />
    </svg>
  );
}

function GoldChartMiniIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" className="shrink-0" aria-hidden="true">
      <rect x="8" y="23" width="5.5" height="10" rx="1.5" fill="#F59E0B" />
      <rect x="17" y="18" width="5.5" height="15" rx="1.5" fill="#D97706" />
      <rect x="26" y="12" width="5.5" height="21" rx="1.5" fill="#B45309" />
      <path
        d="M8 18L19 9L24 12L32 5M32 5H25.5M32 5V11.5"
        stroke="#EA580C"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfitRateMiniIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" className="shrink-0" aria-hidden="true">
      <rect x="5" y="5" width="30" height="30" rx="8" fill="#0D9488" />
      <circle cx="14.5" cy="14.5" r="3.2" stroke="#CCFBF1" strokeWidth="2.4" />
      <circle cx="25.5" cy="25.5" r="3.2" stroke="#CCFBF1" strokeWidth="2.4" />
      <path d="M13 27L27 13" stroke="#FEF08A" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function BlueCalendarMiniIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" className="shrink-0" aria-hidden="true">
      <rect x="6" y="9" width="28" height="25" rx="5" fill="#2563EB" />
      <rect x="9" y="16" width="22" height="15" rx="2.5" fill="#EFF6FF" />
      <line x1="14" y1="6" x2="14" y2="11" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
      <line x1="26" y1="6" x2="26" y2="11" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="14.5" cy="21" r="1.8" fill="#1D4ED8" />
      <circle cx="20" cy="21" r="1.8" fill="#1D4ED8" />
      <circle cx="25.5" cy="21" r="1.8" fill="#1D4ED8" />
      <circle cx="14.5" cy="26.5" r="1.8" fill="#1D4ED8" />
      <circle cx="20" cy="26.5" r="1.8" fill="#1D4ED8" />
      <circle cx="25.5" cy="26.5" r="1.8" fill="#1D4ED8" />
    </svg>
  );
}

function PurpleReferMiniIcon() {
  return (
    <svg width="32" height="30" viewBox="0 0 42 40" fill="none" className="shrink-0" aria-hidden="true">
      <circle cx="12" cy="17" r="4.2" fill="#9333EA" />
      <path d="M5 30C5 26.2 8 23.5 12 23.5C16 23.5 19 26.2 19 30V31.5H5V30Z" fill="#9333EA" />
      <circle cx="30" cy="17" r="4.2" fill="#9333EA" />
      <path d="M23 30C23 26.2 26 23.5 30 23.5C34 23.5 37 26.2 37 30V31.5H23V30Z" fill="#9333EA" />
      <circle cx="21" cy="13.5" r="5.5" fill="#6D28D9" />
      <path d="M11.5 31.5C11.5 26.5 15.6 22.8 21 22.8C26.4 22.8 30.5 26.5 30.5 31.5V33H11.5V31.5Z" fill="#6D28D9" />
    </svg>
  );
}

async function compressReceiptFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const rawResult = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        const maxDim = 1400;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawResult);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  });
}

export function InvestmentPlansComponent({
  authToken,
  onBackToDashboard,
  onOpenDepositHistory,
  onDepositSubmitted,
}: InvestmentPlansComponentProps) {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentReceivingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected package for Plan Payment / Deposit checkout
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Easypaisa' | 'JazzCash' | 'Bank Transfer'>('Easypaisa');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'number' | 'title' | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedDeposit, setSubmittedDeposit] = useState<DepositRequestItem | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/plans', {
      credentials: 'include',
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load NBV investment plans.');
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setPlans(data.plans || []);
        const cfg: PaymentReceivingConfig | null = data.paymentConfig || null;
        setPaymentConfig(cfg);
        if (cfg) {
          const enabledList: Array<'Easypaisa' | 'JazzCash' | 'Bank Transfer'> = [];
          if (cfg.easypaisaEnabled !== false) enabledList.push('Easypaisa');
          if (cfg.jazzcashEnabled !== false) enabledList.push('JazzCash');
          if (cfg.bankTransferEnabled !== false) enabledList.push('Bank Transfer');
          const preferred = cfg.defaultDepositMethod || 'Easypaisa';
          if (enabledList.includes(preferred)) {
            setPaymentMethod(preferred);
          } else if (enabledList.length > 0) {
            setPaymentMethod(enabledList[0]);
          }
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load plans.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [authToken]);

  const enabledGateways: Array<'Easypaisa' | 'JazzCash' | 'Bank Transfer'> = (() => {
    if (!paymentConfig) return ['Easypaisa', 'JazzCash', 'Bank Transfer'];
    const list: Array<'Easypaisa' | 'JazzCash' | 'Bank Transfer'> = [];
    if (paymentConfig.easypaisaEnabled !== false) list.push('Easypaisa');
    if (paymentConfig.jazzcashEnabled !== false) list.push('JazzCash');
    if (paymentConfig.bankTransferEnabled !== false) list.push('Bank Transfer');
    return list.length > 0 ? list : ['Easypaisa'];
  })();

  function handleSelectPlan(plan: InvestmentPlan) {
    setSelectedPlan(plan);
    if (paymentConfig) {
      const preferred = paymentConfig.defaultDepositMethod || 'Easypaisa';
      setPaymentMethod(
        enabledGateways.includes(preferred) ? preferred : enabledGateways[0]
      );
    }
    setSubmittedDeposit(null);
    setSubmitError(null);
    setTransactionRef('');
    setReceiptPreview(null);
    setReceiptFileName('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleReceiptFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitError(null);
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Screenshot must be smaller than 5 MB.');
      return;
    }
    try {
      const compressedDataUrl = await compressReceiptFileToDataUrl(file);
      setReceiptPreview(compressedDataUrl);
      setReceiptFileName(file.name);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Invalid receipt image.');
    }
  }

  async function handleCopyInstruction(value: string, field: 'number' | 'title') {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  async function handleSubmitDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmitError(null);

    if (!receiptPreview) {
      setSubmitError('Please upload your payment screenshot before submitting.');
      return;
    }

    if (transactionRef.trim().length < 4) {
      setSubmitError('Please enter a valid Transaction ID (TID).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          packageCode: selectedPlan.code,
          paymentMethod,
          transactionRef: transactionRef.trim(),
          receiptDataUrl: receiptPreview,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not submit deposit request.');
        setSubmitting(false);
        return;
      }

      setSubmittedDeposit(data.deposit);
      await onDepositSubmitted();
    } catch {
      setSubmitError('Network error while submitting deposit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const activePlansList = plans.filter((p) => p.isActive);
  const section1Plans = activePlansList.filter((p) => p.section === 1);
  const section2Plans = activePlansList.filter((p) => p.section === 2);
  const section3Plans = activePlansList.filter((p) => p.section === 3);
  const section4Plans = activePlansList.filter((p) => p.section === 4);

  const activeReceivingDetails = (() => {
    if (!paymentConfig) {
      return { title: 'SUMERA BIBI', number: '03433370774', gatewayLabel: paymentMethod };
    }
    if (paymentMethod === 'Easypaisa') {
      return {
        title: paymentConfig.easypaisaTitle || 'SUMERA BIBI',
        number: paymentConfig.easypaisaNumber || '03433370774',
        gatewayLabel: 'Easypaisa',
      };
    }
    if (paymentMethod === 'JazzCash') {
      return {
        title: paymentConfig.jazzcashTitle || 'SUMERA BIBI',
        number: paymentConfig.jazzcashNumber || '03433370774',
        gatewayLabel: 'JazzCash',
      };
    }
    return {
      title: `${paymentConfig.bankAccountTitle || 'SUMERA BIBI'}${paymentConfig.bankName ? ` (${paymentConfig.bankName})` : ''}`,
      number: paymentConfig.bankAccountNumber || '03433370774',
      gatewayLabel: 'Bank Transfer',
    };
  })();

  // Dedicated Deposit / Plan Payment Screen with Selected Plan & Investment Amount Auto-Filled
  if (selectedPlan) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#c4b5fd] via-[#bae6fd] to-[#ecfccb] text-slate-900 pb-12">
        <div className="max-w-xl mx-auto px-4 pt-4 space-y-5">
          {/* Top Escape Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedPlan(null);
                setSubmittedDeposit(null);
                setSubmitError(null);
              }}
              className="min-h-[44px] px-4 rounded-2xl bg-white/85 hover:bg-white text-[#4c1d95] text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Plans</span>
            </button>

            <button
              type="button"
              onClick={onOpenDepositHistory}
              className="min-h-[44px] px-4 rounded-2xl bg-white/85 hover:bg-white text-[#4c1d95] text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <History className="w-4 h-4" />
              <span>Deposit History</span>
            </button>
          </div>

          {/* Purple Plan Payment Header Card */}
          <div className="rounded-3xl bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] p-5 sm:p-6 shadow-lg flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center text-[#6d28d9] shrink-0 shadow-xs">
              <Wallet className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl sm:text-[28px] font-extrabold text-white leading-tight">
                Deposit &amp; Plan Payment
              </h1>
              <p className="text-sm text-purple-100 font-medium mt-0.5">
                Selected plan &amp; investment amount automatically filled below
              </p>
            </div>
          </div>

          {submittedDeposit ? (
            /* Stage 1 (PENDING) Confirmation Card — Never claims auto-approval */
            <div className="rounded-3xl bg-white/95 border border-purple-200 p-6 sm:p-7 text-center space-y-5 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 stroke-[2.3]" />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                  Deposit Status: PENDING
                </p>
                <h2 className="font-display text-2xl font-extrabold text-slate-900">
                  Deposit Request Submitted
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your deposit request for <strong>{submittedDeposit.packageCode}</strong> (
                  <strong className="tabular-nums">{formatRsDot(submittedDeposit.amount)}</strong>) has been
                  placed in <strong>Pending</strong> status for Admin review. Once Admin verifies your payment and
                  clicks <strong>Approve</strong>, your wallet balance and 90-day investment plan will activate
                  automatically.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left text-xs sm:text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Selected Package</span>
                  <span className="font-bold text-slate-900">
                    {submittedDeposit.packageCode} ({submittedDeposit.durationDays} Days)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Deposit Amount</span>
                  <span className="font-extrabold text-[#6d28d9] tabular-nums">
                    {formatRsDot(submittedDeposit.amount)} ({formatPkrDecimal(submittedDeposit.amount)})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Daily Profit Rate</span>
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {formatProfitRate(selectedPlan)} ({formatRsDot(selectedPlan.projectedDailyProfit)}/day)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Gateway</span>
                  <span className="font-bold text-slate-900">{submittedDeposit.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Transaction ID (TID)</span>
                  <span className="font-mono font-bold text-slate-900">{submittedDeposit.transactionRef}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Current Status</span>
                  <span className="font-extrabold text-amber-600">Pending (Awaiting Admin Review)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="flex-1 min-h-[50px] px-4 rounded-2xl bg-gradient-to-r from-[#a3e635] via-[#7c3aed] to-[#6d28d9] text-white font-display font-bold text-sm sm:text-base shadow-md hover:brightness-105 transition-all cursor-pointer whitespace-nowrap"
                >
                  Go to Customer Dashboard
                </button>
                <button
                  type="button"
                  onClick={onOpenDepositHistory}
                  className="flex-1 min-h-[50px] px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-sm sm:text-base transition-colors cursor-pointer whitespace-nowrap"
                >
                  View Deposit History
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitDeposit} className="space-y-5">
              {/* Auto-Filled Selected Plan & Investment Amount Card */}
              <div className="rounded-3xl bg-white/95 shadow-sm border border-purple-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d28d9]">
                      Auto-Filled Plan Summary
                    </p>
                    <h2 className="font-display text-lg font-extrabold text-slate-900">
                      Selected Investment Package
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="min-h-[38px] px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6d28d9] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Change Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="autofilled-selected-plan"
                      className="block text-xs font-semibold text-slate-600 mb-1"
                    >
                      Selected Plan
                    </label>
                    <input
                      id="autofilled-selected-plan"
                      type="text"
                      readOnly
                      value={`${formatPlanDisplayTitle(selectedPlan)} — ${selectedPlan.name}`}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-display font-extrabold text-slate-900 text-sm sm:text-base focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="autofilled-investment-amount"
                      className="block text-xs font-semibold text-slate-600 mb-1"
                    >
                      Investment / Deposit Amount
                    </label>
                    <input
                      id="autofilled-investment-amount"
                      type="text"
                      readOnly
                      value={formatRsDot(selectedPlan.investmentAmount)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 font-display font-extrabold text-emerald-800 text-sm sm:text-base tabular-nums focus:outline-none"
                    />
                  </div>
                </div>

                {/* Clear Profit Rate, Daily Profit, Duration, and Separate 12% & 3% Rates */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-2.5">
                    <p className="text-[11px] font-semibold text-slate-600">Daily Profit</p>
                    <p className="font-display text-sm sm:text-base font-extrabold text-amber-800 tabular-nums mt-0.5">
                      {formatRsDot(selectedPlan.projectedDailyProfit)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-teal-50 border border-teal-200/80 p-2.5">
                    <p className="text-[11px] font-semibold text-slate-600">Profit Rate</p>
                    <p className="font-display text-sm sm:text-base font-extrabold text-teal-800 tabular-nums mt-0.5">
                      {formatProfitRate(selectedPlan)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-200/80 p-2.5">
                    <p className="text-[11px] font-semibold text-slate-600">Duration</p>
                    <p className="font-display text-sm sm:text-base font-extrabold text-blue-800 tabular-nums mt-0.5">
                      {selectedPlan.durationDays} Days
                    </p>
                  </div>

                  <div className="rounded-xl bg-purple-50 border border-purple-200/80 p-2.5">
                    <p className="text-[11px] font-semibold text-slate-600">Referral Rates</p>
                    <p className="text-xs font-extrabold text-[#6d28d9] tabular-nums mt-0.5 leading-snug">
                      Level 1: {selectedPlan.level1BonusPercent}%
                    </p>
                    <p className="text-xs font-extrabold text-[#6d28d9] tabular-nums leading-snug">
                      Level 2: {selectedPlan.level2BonusPercent}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector — Always Visible & 1-Tap Clickable */}
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-800 px-1">
                  Select Payment Method
                </p>
                <div
                  className={`grid gap-2.5 p-2 rounded-2xl bg-white/90 border border-purple-200 shadow-xs ${
                    enabledGateways.length === 1
                      ? 'grid-cols-1'
                      : enabledGateways.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                  }`}
                >
                  {enabledGateways.map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => setPaymentMethod(gw)}
                      className={`min-h-[46px] px-3 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        paymentMethod === gw
                          ? 'bg-[#6d28d9] text-white shadow-xs'
                          : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
                      }`}
                    >
                      {gw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details White Card */}
              <div className="rounded-3xl bg-white/95 shadow-sm overflow-hidden border border-white/90">
                <div className="bg-[#f3e8ff]/90 px-5 py-4 flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900">
                    Payment Details
                  </h2>
                  <span className="text-xs sm:text-sm font-extrabold text-[#6d28d9] whitespace-nowrap">
                    {activeReceivingDetails.gatewayLabel}
                  </span>
                </div>

                <div className="px-5 divide-y divide-slate-100">
                  <div className="py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        Account Number / IBAN
                      </p>
                      <p className="font-mono text-base sm:text-lg font-extrabold text-slate-900 tabular-nums mt-0.5 select-all">
                        {activeReceivingDetails.number}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyInstruction(activeReceivingDetails.number, 'number')}
                      className="min-h-[44px] px-4 rounded-2xl bg-[#faf5ff] hover:bg-[#f3e8ff] text-[#6d28d9] font-bold text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {copiedField === 'number' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <span>Copy</span>
                      )}
                    </button>
                  </div>

                  <div className="py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        Account Holder Title
                      </p>
                      <p className="font-display text-base sm:text-lg font-extrabold text-slate-900 uppercase mt-0.5 select-all">
                        {activeReceivingDetails.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyInstruction(activeReceivingDetails.title, 'title')}
                      className="min-h-[44px] px-4 rounded-2xl bg-[#faf5ff] hover:bg-[#f3e8ff] text-[#6d28d9] font-bold text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {copiedField === 'title' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <span>Copy</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Amount to Send Bar */}
              <div className="rounded-2xl bg-white/95 px-5 py-4 flex items-center justify-between gap-3 shadow-sm border border-white/90">
                <span className="text-sm sm:text-base font-medium text-slate-600">
                  Amount to Send
                </span>
                <div className="text-right">
                  <span className="block font-display text-xl sm:text-2xl font-extrabold text-[#6d28d9] tabular-nums">
                    {formatRsDot(selectedPlan.investmentAmount)}
                  </span>
                  <span className="block text-xs text-slate-500 font-semibold tabular-nums">
                    {formatPkrDecimal(selectedPlan.investmentAmount)}
                  </span>
                </div>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-red-700 font-medium"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Upload Payment Screenshot */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-medium text-slate-800">
                  Upload Payment Screenshot <span className="text-[#6d28d9] font-bold">*</span>
                </label>

                <label className="flex flex-col items-center justify-center w-full min-h-[168px] rounded-3xl bg-white/95 border-2 border-dashed border-[#c4b5fd] hover:border-[#7c3aed] px-5 py-7 text-center cursor-pointer transition-colors shadow-sm">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReceiptFileChange}
                    className="sr-only"
                  />
                  {receiptPreview ? (
                    <div className="space-y-2.5">
                      <img
                        src={receiptPreview}
                        alt="Uploaded payment screenshot preview"
                        className="max-h-48 rounded-2xl mx-auto border border-purple-200 object-contain"
                      />
                      <p className="text-xs sm:text-sm font-bold text-[#6d28d9] flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{receiptFileName || 'Payment screenshot attached'} · Tap to change</span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] text-[#6d28d9] flex items-center justify-center mx-auto">
                        <ArrowUp className="w-6 h-6 stroke-[2.6]" />
                      </div>
                      <p className="font-display text-base sm:text-lg font-extrabold text-slate-900 pt-1">
                        Click to Upload Screenshot
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        JPG, PNG · Max 5 MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Transaction ID (TID) */}
              <div className="space-y-2">
                <label
                  htmlFor="deposit-tid-input"
                  className="block text-sm sm:text-base font-medium text-slate-800"
                >
                  Transaction ID (TID) <span className="text-[#6d28d9] font-bold">*</span>
                </label>
                <div className="rounded-2xl bg-white/95 px-3.5 py-2 flex items-center gap-3 shadow-sm border border-white/90 focus-within:border-[#7c3aed]">
                  <span className="w-10 h-10 rounded-xl bg-[#f3e8ff] text-[#6d28d9] font-mono font-bold text-base flex items-center justify-center shrink-0">
                    #
                  </span>
                  <input
                    id="deposit-tid-input"
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="w-full min-h-[44px] bg-transparent text-slate-900 font-mono text-sm sm:text-base placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Risk & Pending Verification Note */}
              <div className="rounded-2xl bg-white/75 border border-purple-200/80 px-4 py-3 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-[#6d28d9] shrink-0 mt-0.5" />
                <span>
                  Every deposit request starts as <strong>Pending</strong> until verified by Admin. Projected daily
                  profits ({formatRsDot(selectedPlan.projectedDailyProfit)}/day at {formatProfitRate(selectedPlan)} for{' '}
                  {selectedPlan.durationDays} days) are estimated targets and not guaranteed fixed returns.
                </span>
              </div>

              {/* Submit Deposit Request CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[58px] px-6 rounded-2xl bg-gradient-to-r from-[#a3e635] via-[#7c3aed] to-[#6d28d9] text-white font-display text-lg sm:text-xl font-extrabold shadow-lg hover:brightness-105 disabled:opacity-60 active:scale-[0.99] flex items-center justify-center gap-4 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{submitting ? 'Submitting Request...' : 'Submit Deposit Request'}</span>
                <span className="w-9 h-9 rounded-xl bg-white text-[#5b21b6] flex items-center justify-center shrink-0 shadow-xs">
                  <ArrowRight className="w-5 h-5 stroke-[2.6]" />
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#042b1a] via-[#063822] to-[#031c11] text-white pb-14">
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-30 bg-[#042416]/95 backdrop-blur-md border-b border-emerald-400/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="min-h-[44px] px-3.5 rounded-xl bg-[#083c25] hover:bg-[#0b4d30] border border-emerald-400/30 text-sm font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <NbvShieldEmblem size={34} />
            <span className="font-display text-lg sm:text-xl font-extrabold tracking-wide whitespace-nowrap truncate">
              <span className="text-white">NBV </span>
              <span className="text-[#facc15]">INVESTMENT PLANS</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenDepositHistory}
            className="min-h-[44px] px-3.5 rounded-xl bg-[#083c25] hover:bg-[#0b4d30] border border-[#facc15]/40 text-xs sm:text-sm font-semibold text-[#fde047] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Deposit History</span>
            <span className="sm:hidden">History</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-6 space-y-8">
        {/* Intro Hero + Separate 12% and 3% Referral Commission Display */}
        <div className="rounded-3xl bg-gradient-to-r from-[#073d26] via-[#0b5233] to-[#073822] border-2 border-[#facc15]/55 p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#facc15]">
                OFFICIAL NBV TRADING PACKAGES
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Select Your 90-Day Investment Plan
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/85 mt-1.5 max-w-2xl leading-relaxed">
                Choose from all {activePlansList.length || 20} structured NBV packages (NBV-01 to NBV-20) across four
                tiers. Click <strong>Deposit Now</strong> on any plan to open the deposit screen with your selected plan
                and investment amount automatically filled in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              <div className="rounded-2xl bg-[#042115] border border-[#facc15]/45 px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-emerald-200/75 font-semibold">
                  Level 1 Bonus
                </p>
                <p className="font-display text-xl font-extrabold text-[#facc15] tabular-nums mt-0.5">
                  12%
                </p>
                <p className="text-[10.5px] text-emerald-200/70">Direct Referral</p>
              </div>
              <div className="rounded-2xl bg-[#042115] border border-emerald-400/40 px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-emerald-200/75 font-semibold">
                  Level 2 Bonus
                </p>
                <p className="font-display text-xl font-extrabold text-[#6EE730] tabular-nums mt-0.5">
                  3%
                </p>
                <p className="text-[10.5px] text-emerald-200/70">Second-Tier Referral</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-emerald-300/20 flex items-start gap-2.5 text-xs text-amber-100/90">
            <FileImage className="w-4 h-4 text-[#facc15] shrink-0 mt-0.5" />
            <p>
              <strong>Risk &amp; Verification Disclosure:</strong> Daily profit figures and profit rate percentages
              shown below represent projected trading targets over 90 days. Referral bonuses of <strong>12%</strong>{' '}
              (Level 1) and <strong>3%</strong> (Level 2) are calculated separately on verified deposits. All deposits
              activate only after Admin receipt verification.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 w-full rounded-3xl bg-[#073823]/70 border border-emerald-400/20 animate-pulse"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-3xl bg-red-950/60 border border-red-400/40 p-6 text-center text-sm text-red-100">
            {loadError}
          </div>
        ) : (
          <div className="space-y-10">
            {[
              {
                sectionNumber: 1,
                heading: 'SECTION 1: NBV-01 to NBV-05',
                subtitle: 'Starter & Core Premium Packages · 90 Days Duration',
                items: section1Plans,
              },
              {
                sectionNumber: 2,
                heading: 'SECTION 2: NBV-06 to NBV-10',
                subtitle: 'Growth & Professional Packages · 90 Days Duration',
                items: section2Plans,
              },
              {
                sectionNumber: 3,
                heading: 'SECTION 3: NBV-11 to NBV-15',
                subtitle: 'Executive & Institutional Packages · 90 Days Duration',
                items: section3Plans,
              },
              {
                sectionNumber: 4,
                heading: 'SECTION 4: NBV 16 to NBV 20',
                subtitle: 'Elite High-Yield Packages · 12.5% – 12.53% Daily Profit Rate · 90 Days Duration',
                items: section4Plans,
              },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <section key={group.sectionNumber} className="space-y-4">
                  {/* Section Header Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#08442a] to-[#052919] border border-[#facc15]/50">
                    <div>
                      <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#facc15] tracking-wide">
                        {group.heading}
                      </h2>
                      <p className="text-xs text-emerald-100/80">{group.subtitle}</p>
                    </div>
                    <span className="text-xs font-bold text-white/90 tabular-nums">
                      {group.items.length} Packages Available
                    </span>
                  </div>

                  {/* Full-Width Large Package Cards (1 per row) */}
                  <div className="space-y-4">
                    {group.items.map((plan) => (
                      <article
                        key={plan.id}
                        className="w-full rounded-3xl bg-gradient-to-r from-[#effde4] via-[#ffffff] to-[#effde4] border-2 border-[#46c93a] shadow-[0_8px_24px_rgba(0,0,0,0.32)] p-3.5 sm:p-4 transition-transform hover:scale-[1.002]"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                          {/* Zone 1: Dark Green + Gold Coins Package Title Box */}
                          <div className="xl:w-[216px] shrink-0 rounded-2xl bg-gradient-to-r from-[#1c8828] via-[#093d23] to-[#052616] border-2 border-[#76f53b] px-3.5 py-3 flex items-center gap-3 shadow-md">
                            <PlanCoinsLeafBadgeIcon />
                            <div className="min-w-0">
                              <h3 className="font-display text-2xl font-extrabold text-white tracking-tight leading-none whitespace-nowrap">
                                {formatPlanDisplayTitle(plan)}
                              </h3>
                              <p className="text-xs font-extrabold text-[#facc15] mt-1 truncate">
                                {plan.name}
                              </p>
                            </div>
                          </div>

                          {/* Zones 2–6: 5 Clear Metric Boxes (Investment, Daily Profit, Profit Rate, Duration, Separate 12% & 3%) */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 flex-1">
                            {/* 1. Investment Amount */}
                            <div className="rounded-2xl bg-[#eefbf0] border border-[#bbf7d0] px-3 py-2.5 flex items-center gap-2.5">
                              <CashStackMiniIcon />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                  Investment
                                </p>
                                <p className="font-display text-base sm:text-lg font-extrabold text-[#0b6e29] tabular-nums leading-tight mt-0.5 whitespace-nowrap">
                                  {formatRsDot(plan.investmentAmount)}
                                </p>
                              </div>
                            </div>

                            {/* 2. Daily Profit */}
                            <div className="rounded-2xl bg-[#fff7df] border border-[#fde68a] px-3 py-2.5 flex items-center gap-2.5">
                              <GoldChartMiniIcon />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                  Daily Profit
                                </p>
                                <p className="font-display text-base sm:text-lg font-extrabold text-[#c26a09] tabular-nums leading-tight mt-0.5 whitespace-nowrap">
                                  {formatRsDot(plan.projectedDailyProfit)}
                                </p>
                              </div>
                            </div>

                            {/* 3. Profit Rate (%) */}
                            <div className="rounded-2xl bg-[#f0fdfa] border border-[#99f6e4] px-3 py-2.5 flex items-center gap-2.5">
                              <ProfitRateMiniIcon />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                  Profit Rate
                                </p>
                                <p className="font-display text-base sm:text-lg font-extrabold text-[#0f766e] tabular-nums leading-tight mt-0.5 whitespace-nowrap">
                                  {formatProfitRate(plan)}
                                </p>
                              </div>
                            </div>

                            {/* 4. Duration */}
                            <div className="rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] px-3 py-2.5 flex items-center gap-2.5">
                              <BlueCalendarMiniIcon />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                  Duration
                                </p>
                                <p className="font-display text-base sm:text-lg font-extrabold text-[#1d4ed8] tabular-nums leading-tight mt-0.5 whitespace-nowrap">
                                  {plan.durationDays} Days
                                </p>
                              </div>
                            </div>

                            {/* 5. Separate 12% and 3% Referral Bonus Rates */}
                            <div className="col-span-2 sm:col-span-1 rounded-2xl bg-[#f8f0ff] border border-[#e9d5ff] px-3 py-2.5 flex items-center gap-2.5">
                              <PurpleReferMiniIcon />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                  Refer Bonus
                                </p>
                                <p className="text-xs font-extrabold text-[#6d28d9] tabular-nums leading-snug mt-0.5 whitespace-nowrap">
                                  Level 1: {plan.level1BonusPercent}%
                                </p>
                                <p className="text-xs font-extrabold text-[#6d28d9] tabular-nums leading-snug whitespace-nowrap">
                                  Level 2: {plan.level2BonusPercent}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Zone 7: Clickable "Deposit Now" Button on Every Plan */}
                          <button
                            type="button"
                            onClick={() => handleSelectPlan(plan)}
                            className="xl:w-[186px] shrink-0 min-h-[52px] px-5 py-3 rounded-2xl bg-gradient-to-b from-[#35c924] via-[#178a14] to-[#0b5c0a] border-2 border-[#86efac] shadow-md hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                          >
                            <span className="font-display text-base sm:text-lg font-extrabold text-white whitespace-nowrap">
                              Deposit Now
                            </span>
                            <span className="w-6 h-6 rounded-lg bg-white text-[#0f6d13] flex items-center justify-center shrink-0">
                              <ChevronRight className="w-4 h-4 stroke-[3]" />
                            </span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
