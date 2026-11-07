import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface DailyProfitCardProps {
  user: UserProfile;
  authToken: string;
  onOpenDepositPlans?: () => void;
  onProfitSettled?: (updatedUser: UserProfile) => void;
}

export function DailyProfitCard({
  user,
  authToken,
  onOpenDepositPlans,
  onProfitSettled,
}: DailyProfitCardProps) {
  const totalInvestment = user.totalInvestment ?? 0;
  const hasActivePlan = totalInvestment > 0 || (user.activePlansCount ?? 0) > 0;

  // Calculate remaining seconds to nextProfitAt
  const computeRemainingSeconds = useCallback((): number => {
    const targetIso = user.nextProfitAt;
    if (targetIso) {
      const targetMs = new Date(targetIso).getTime();
      const diffMs = targetMs - Date.now();
      if (diffMs > 0) {
        return Math.floor(diffMs / 1000);
      }
    }
    // Default fallback: 24h cycle
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const fallbackSecs = Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
    return fallbackSecs > 0 ? fallbackSecs : 86400;
  }, [user.nextProfitAt]);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(computeRemainingSeconds);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justCreditedNotice, setJustCreditedNotice] = useState<string | null>(null);

  // Trigger server profit synchronization and settlement
  const handleSyncProfit = useCallback(
    async (isAuto = false) => {
      if (isSyncing) return;
      setIsSyncing(true);
      try {
        const res = await fetch('/api/profit/sync', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user && onProfitSettled) {
            onProfitSettled(data.user);
          }
          if (data.creditedCount > 0) {
            setJustCreditedNotice(
              `Rs ${Number(data.totalDistributed).toLocaleString()} Daily Profit credited to your wallet!`
            );
            setTimeout(() => setJustCreditedNotice(null), 5000);
          }
        }
      } catch (err) {
        console.error('Failed to sync profit:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [authToken, isSyncing, onProfitSettled]
  );

  // Reset seconds whenever user.nextProfitAt changes
  useEffect(() => {
    setRemainingSeconds(computeRemainingSeconds());
  }, [computeRemainingSeconds]);

  // Real-time ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Timer expired! Trigger daily profit sync
          void handleSyncProfit(true);
          // Automatically reset to 24h cycle (86,400 seconds)
          return 86400;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSyncProfit]);

  // Format hours, minutes, seconds
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const padZero = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#083822] via-[#052919] to-[#041c11] border border-emerald-400/40 shadow-xl shadow-black/40 p-4 sm:p-6 space-y-4">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Header: Next Profit & Live Status */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#166534] via-[#22c55e] to-[#4ade80] border border-emerald-300/40 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 shrink-0">
            <Clock className="w-6 h-6 stroke-[2.3] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-black text-white tracking-wide">
                Next Profit
              </h2>
              <span className="text-xs font-semibold text-emerald-300/80 hidden xs:inline">
                (اگلا منافع)
              </span>
            </div>
            <p className="text-xs text-emerald-200/75 mt-0.5">
              Next scheduled credit · Auto 24h cycle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActivePlan ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-400/35 text-[11px] font-bold text-[#86efac]">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping" />
              <span>Active Cycle</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenDepositPlans}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#fde047] to-[#f59e0b] text-[#052e16] text-xs font-extrabold flex items-center gap-1 hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <span>Invest Now</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleSyncProfit(false)}
            disabled={isSyncing}
            title="Sync daily profit"
            aria-label="Sync daily profit"
            className="w-9 h-9 rounded-xl bg-[#042013] hover:bg-[#07331f] border border-emerald-400/30 flex items-center justify-center text-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#facc15]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-Time Live Countdown Timer Boxes */}
      <div className="relative z-10 pt-1">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* Hours Box */}
          <div className="rounded-2xl bg-gradient-to-b from-[#031d12] to-[#02130b] border border-emerald-400/35 p-3 sm:p-4 text-center shadow-inner relative overflow-hidden group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.02]" />
            <span className="font-display text-2xl sm:text-4xl font-black text-[#facc15] tracking-tight tabular-nums block drop-shadow-sm">
              {padZero(hours)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300/80 uppercase tracking-widest mt-1 block">
              Hours
            </span>
            <span className="text-[9px] text-emerald-400/60 block mt-0.5">گھنٹے</span>
          </div>

          {/* Minutes Box */}
          <div className="rounded-2xl bg-gradient-to-b from-[#031d12] to-[#02130b] border border-emerald-400/35 p-3 sm:p-4 text-center shadow-inner relative overflow-hidden group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.02]" />
            <span className="font-display text-2xl sm:text-4xl font-black text-[#facc15] tracking-tight tabular-nums block drop-shadow-sm">
              {padZero(minutes)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300/80 uppercase tracking-widest mt-1 block">
              Minutes
            </span>
            <span className="text-[9px] text-emerald-400/60 block mt-0.5">منٹ</span>
          </div>

          {/* Seconds Box */}
          <div className="rounded-2xl bg-gradient-to-b from-[#031d12] to-[#02130b] border border-emerald-400/35 p-3 sm:p-4 text-center shadow-inner relative overflow-hidden group">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.02]" />
            <span className="font-display text-2xl sm:text-4xl font-black text-[#6EE730] tracking-tight tabular-nums block drop-shadow-sm">
              {padZero(seconds)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300/80 uppercase tracking-widest mt-1 block">
              Seconds
            </span>
            <span className="text-[9px] text-emerald-400/60 block mt-0.5">سیکنڈ</span>
          </div>
        </div>
      </div>

      {justCreditedNotice && (
        <div className="rounded-2xl bg-emerald-900/70 border border-[#6EE730]/60 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-100 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#facc15] shrink-0 animate-bounce" />
          <span>{justCreditedNotice}</span>
        </div>
      )}
    </section>
  );
}
