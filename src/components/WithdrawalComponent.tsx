import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Landmark,
} from 'lucide-react';
import type { UserProfile, WithdrawalRequestItem } from '../types';

interface WithdrawalComponentProps {
  user: UserProfile;
  authToken: string;
  onBackToDashboard: () => void;
  onOpenWithdrawHistory: () => void;
  onWithdrawalSubmitted: () => Promise<void>;
}

type PaymentGatewayOption = 'EasyPaisa' | 'JazzCash' | 'Bank Transfer';

function formatRsAmount(amount: number): string {
  return `Rs ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function HeroWalletOutlineIcon() {
  return (
    <svg
      width="62"
      height="62"
      viewBox="0 0 64 64"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M14 16H46C48.2091 16 50 17.7909 50 20V22H18C14.6863 22 12 19.3137 12 16C12 16 12.8 16 14 16Z"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="12"
        y="20"
        width="42"
        height="30"
        rx="5"
        stroke="white"
        strokeWidth="4"
      />
      <rect
        x="39"
        y="30"
        width="15"
        height="10"
        rx="3"
        fill="#6D28D9"
        stroke="white"
        strokeWidth="3.5"
      />
      <circle cx="44.5" cy="35" r="2" fill="white" />
    </svg>
  );
}

function MethodBrandBadge({ method }: { method: PaymentGatewayOption }) {
  if (method === 'EasyPaisa') {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] border border-emerald-200 flex flex-col items-center justify-center shrink-0">
        <span className="font-display text-xl font-extrabold text-[#15803d] leading-none">
          e
        </span>
        <span className="text-[9px] font-bold text-slate-800 tracking-tight mt-0.5">
          easypaisa
        </span>
      </div>
    );
  }
  if (method === 'JazzCash') {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] border border-red-200 flex flex-col items-center justify-center shrink-0">
        <span className="font-display text-base font-extrabold text-[#b91c1c] leading-none">
          JC
        </span>
        <span className="text-[9px] font-bold text-[#991b1b] tracking-tight mt-1">
          JazzCash
        </span>
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-2xl bg-[#eef2ff] border border-indigo-200 flex flex-col items-center justify-center shrink-0 text-[#4338ca]">
      <Landmark className="w-5 h-5" />
      <span className="text-[9px] font-bold text-slate-800 tracking-tight mt-0.5">
        Bank
      </span>
    </div>
  );
}

export function WithdrawalComponent({
  user,
  authToken,
  onBackToDashboard,
  onOpenWithdrawHistory,
  onWithdrawalSubmitted,
}: WithdrawalComponentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentGatewayOption>('EasyPaisa');
  const [showMethodSelector, setShowMethodSelector] = useState<boolean>(true);
  const [amountInput, setAmountInput] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<WithdrawalRequestItem | null>(null);

  // Ensure the customer's own fresh balance is synced on page open
  useEffect(() => {
    void onWithdrawalSubmitted();
  }, [onWithdrawalSubmitted]);

  const remainingAvailableToRequest = Math.max(
    0,
    Number((user.balance - user.pendingWithdrawals).toFixed(2))
  );

  function handleSelectMax() {
    setErrorMsg(null);
    if (remainingAvailableToRequest <= 0) {
      setAmountInput('0');
      return;
    }
    setAmountInput(String(remainingAvailableToRequest));
  }

  async function handleSubmitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = Number(amountInput);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }
    if (numericAmount < 69) {
      setErrorMsg('Minimum withdrawal amount is Rs 69.00.');
      return;
    }
    if (numericAmount > 2000000) {
      setErrorMsg('Maximum withdrawal amount is Rs 2,000,000.00.');
      return;
    }
    if (numericAmount > user.balance) {
      setErrorMsg(
        `Insufficient available balance. Your available balance is ${formatRsAmount(user.balance)}.`
      );
      return;
    }
    if (numericAmount > remainingAvailableToRequest) {
      setErrorMsg(
        `You already have ${formatRsAmount(user.pendingWithdrawals)} pending Admin review. Remaining balance available to request is ${formatRsAmount(remainingAvailableToRequest)}.`
      );
      return;
    }
    if (accountNumber.trim().length < 5) {
      setErrorMsg(`Please enter a valid ${selectedMethod} account number.`);
      return;
    }
    if (accountHolderName.trim().length < 2) {
      setErrorMsg('Please enter the Account Holder Name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: numericAmount,
          method: selectedMethod,
          accountNumber: accountNumber.trim(),
          accountTitle: accountHolderName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not submit withdrawal request.');
        setSubmitting(false);
        return;
      }

      setSubmittedRequest(data.withdrawal);
      setAmountInput('');
      await onWithdrawalSubmitted();
    } catch {
      setErrorMsg('Network error while submitting withdrawal request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const accountNumberLabel =
    selectedMethod === 'EasyPaisa'
      ? 'EasyPaisa Account Number'
      : selectedMethod === 'JazzCash'
        ? 'JazzCash Account Number'
        : 'Bank Account Number / IBAN';

  const accountNumberPlaceholder =
    selectedMethod === 'EasyPaisa'
      ? 'Enter EasyPaisa Number'
      : selectedMethod === 'JazzCash'
        ? 'Enter JazzCash Number'
        : 'Enter Bank Account Number or IBAN';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#c4b5fd] via-[#bae6fd] to-[#ecfccb] text-slate-900 pb-12">
      <div className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Top Bar Escape Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="min-h-[42px] px-3.5 rounded-2xl bg-white/85 hover:bg-white text-[#4c1d95] text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={onOpenWithdrawHistory}
            className="min-h-[42px] px-3.5 rounded-2xl bg-white/85 hover:bg-white text-[#4c1d95] text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <History className="w-4 h-4" />
            <span>Withdraw History</span>
          </button>
        </div>

        {/* 1. Available Balance Card (Customer's Own Verified Balance Only) */}
        <section className="rounded-3xl bg-gradient-to-r from-[#b8eb63] via-[#8b5cf6] to-[#6d28d9] p-6 shadow-lg border border-white/45 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-medium text-white/95">
              Available Balance
            </p>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight mt-1.5">
              {formatRsAmount(user.balance)}
            </p>
            {user.pendingWithdrawals > 0 && (
              <p className="text-xs font-semibold text-white/90 mt-1.5 tabular-nums">
                Pending Admin Review: {formatRsAmount(user.pendingWithdrawals)}
              </p>
            )}
          </div>

          <HeroWalletOutlineIcon />
        </section>

        {submittedRequest ? (
          /* Confirmation Message Card After Submitting Withdrawal Request */
          <section className="rounded-3xl bg-white/95 border border-purple-200 p-6 sm:p-7 text-center space-y-5 shadow-md">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 stroke-[2.3]" />
            </div>

            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                <span>Status: Pending Admin Review</span>
              </p>
              <h1 className="font-display text-2xl font-extrabold text-slate-900">
                Withdrawal Request Submitted Successfully
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your withdrawal request of{' '}
                <strong className="text-slate-900 tabular-nums">
                  {formatRsAmount(submittedRequest.amount)}
                </strong>{' '}
                via <strong>{submittedRequest.method}</strong> has been saved and queued for Admin
                review. Your wallet balance will only be deducted once authorized by Admin.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left text-xs sm:text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-bold text-slate-900">{user.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Requested Amount</span>
                <span className="font-extrabold text-[#6d28d9] tabular-nums">
                  {formatRsAmount(submittedRequest.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-900">{submittedRequest.method}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {submittedRequest.accountNumber}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Account Holder Name</span>
                <span className="font-bold text-slate-900">{submittedRequest.accountTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200">
                <span className="text-slate-500">Request Status</span>
                <span className="font-extrabold text-amber-600">Pending (Awaiting Admin)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmittedRequest(null);
                  setErrorMsg(null);
                }}
                className="flex-1 min-h-[50px] rounded-2xl bg-gradient-to-r from-[#a3e635] via-[#7c3aed] to-[#6d28d9] text-white font-display font-bold text-sm sm:text-base shadow-md hover:brightness-105 transition-all cursor-pointer"
              >
                New Withdrawal Request
              </button>
              <button
                type="button"
                onClick={onOpenWithdrawHistory}
                className="flex-1 min-h-[50px] rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-sm sm:text-base transition-colors cursor-pointer"
              >
                Withdraw History
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
            {/* 2. Payment Method Selection Card (EasyPaisa, JazzCash, Bank Transfer) */}
            <section className="rounded-3xl bg-white/95 p-5 shadow-sm border border-white/90 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <MethodBrandBadge method={selectedMethod} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-wider uppercase text-[#6d28d9]">
                      WITHDRAW VIA
                    </p>
                    <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">
                      {selectedMethod}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Enter your withdrawal details below.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMethodSelector((prev) => !prev)}
                  className="min-h-[40px] px-2 text-xs sm:text-sm font-semibold text-[#6d28d9] hover:text-[#4c1d95] underline cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Change Method
                </button>
              </div>

              {showMethodSelector && (
                <div
                  role="radiogroup"
                  aria-label="Select withdrawal payment method"
                  className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100"
                >
                  {(['EasyPaisa', 'JazzCash', 'Bank Transfer'] as const).map((option) => {
                    const isSelected = selectedMethod === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          setSelectedMethod(option);
                          setErrorMsg(null);
                        }}
                        className={`min-h-[44px] px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#6d28d9] text-white shadow-xs'
                            : 'bg-[#f5f3ff] text-slate-700 hover:bg-[#ede9fe]'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-red-700 font-medium"
              >
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Enter Withdrawal Details — Amount */}
            <section className="space-y-2.5">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                2. Enter Withdrawal Details
              </h2>

              <label
                htmlFor="withdraw-amount-input"
                className="block text-sm sm:text-base font-medium text-slate-700"
              >
                Withdraw Amount (Rs)
              </label>

              <div className="rounded-2xl bg-white/95 px-3.5 py-2.5 flex items-center gap-3 shadow-sm border border-white/90 focus-within:border-[#7c3aed]">
                <span className="w-11 h-11 rounded-full bg-[#f3e8ff] text-[#6d28d9] font-display font-extrabold text-base flex items-center justify-center shrink-0">
                  Rs
                </span>

                <input
                  id="withdraw-amount-input"
                  type="number"
                  min={69}
                  max={2000000}
                  step="any"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={`Available: ${formatRsAmount(remainingAvailableToRequest)}`}
                  className="w-full min-h-[44px] bg-transparent text-slate-900 font-display font-bold text-base sm:text-lg tabular-nums placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleSelectMax}
                  className="min-h-[38px] px-3.5 rounded-xl bg-[#f3e8ff] hover:bg-[#ede9fe] text-[#6d28d9] text-xs font-extrabold uppercase tracking-wide transition-colors cursor-pointer shrink-0"
                >
                  MAX
                </button>
              </div>

              <div className="space-y-1 pt-0.5">
                <p className="text-xs sm:text-sm font-extrabold text-[#047857] tabular-nums">
                  Available Balance: {formatRsAmount(remainingAvailableToRequest)}
                </p>
                <p className="text-xs sm:text-sm text-slate-700 tabular-nums">
                  Min Rs 69.00 · Max Rs 2,000,000.00 · Charge Rs 0.00 + 0%
                </p>
              </div>
            </section>

            {/* 3. Account Details (Account Number + Account Holder Name) */}
            <section className="space-y-4 pt-1">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                Account Details
              </h2>

              <div className="space-y-2">
                <label
                  htmlFor="withdraw-account-number"
                  className="block text-sm sm:text-base font-medium text-slate-800"
                >
                  {accountNumberLabel} <span className="text-[#6d28d9] font-bold">*</span>
                </label>

                <div className="rounded-2xl bg-white/95 px-3.5 py-2.5 flex items-center gap-3 shadow-sm border border-white/90 focus-within:border-[#7c3aed]">
                  <span
                    aria-hidden="true"
                    className="w-11 h-11 rounded-2xl bg-[#f3e8ff] flex items-center justify-center shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#6d28d9]" />
                  </span>
                  <input
                    id="withdraw-account-number"
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={accountNumberPlaceholder}
                    className="w-full min-h-[44px] bg-transparent text-slate-900 font-mono text-sm sm:text-base tabular-nums placeholder:font-sans placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="withdraw-account-holder"
                  className="block text-sm sm:text-base font-medium text-slate-800"
                >
                  Account Holder Name <span className="text-[#6d28d9] font-bold">*</span>
                </label>

                <div className="rounded-2xl bg-white/95 px-3.5 py-2.5 flex items-center gap-3 shadow-sm border border-white/90 focus-within:border-[#7c3aed]">
                  <span
                    aria-hidden="true"
                    className="w-11 h-11 rounded-2xl bg-[#f3e8ff] flex items-center justify-center shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#6d28d9]" />
                  </span>
                  <input
                    id="withdraw-account-holder"
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Enter Account Holder Name"
                    className="w-full min-h-[44px] bg-transparent text-slate-900 text-sm sm:text-base font-medium placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* 4. SUBMIT WITHDRAWAL REQUEST Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[58px] px-6 rounded-2xl bg-gradient-to-r from-[#a3e635] via-[#7c3aed] to-[#6d28d9] text-white font-display text-lg sm:text-xl font-extrabold shadow-lg hover:brightness-105 disabled:opacity-60 active:scale-[0.99] flex items-center justify-center gap-4 transition-all cursor-pointer"
            >
              <span>{submitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}</span>
              <span className="w-9 h-9 rounded-full bg-white text-[#5b21b6] flex items-center justify-center shrink-0 shadow-xs">
                <ArrowRight className="w-5 h-5 stroke-[2.6]" />
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
