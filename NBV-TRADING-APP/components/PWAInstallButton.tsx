import React from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { NbvShieldEmblem } from './NbvVisuals';

interface PWAInstallButtonProps {
  variant?: 'login' | 'welcome' | 'modal_card' | 'compact';
  className?: string;
  onInstalled?: () => void;
}

export function PWAInstallButton({
  variant = 'login',
  className = '',
  onInstalled,
}: PWAInstallButtonProps) {
  const {
    isInstallable,
    isInstalled,
    isAndroid,
    isIOS,
    showInstallGuide,
    setShowInstallGuide,
    installStatus,
    triggerInstall,
  } = usePWAInstall();

  async function handleClick() {
    const result = await triggerInstall();
    if (result.success && onInstalled) {
      onInstalled();
    }
  }

  // If already running inside installed standalone PWA
  if (isInstalled && variant !== 'modal_card') {
    return (
      <div
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 text-[#6EE730]" />
        <span>NBV Trading App Installed</span>
      </div>
    );
  }

  return (
    <>
      {/* 1. LOGIN SCREEN VARIANT — Prominent, beautiful, and click-to-install */}
      {variant === 'login' && (
        <div className={`space-y-2 ${className}`}>
          <button
            type="button"
            onClick={handleClick}
            className="w-full min-h-[52px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0d5434] via-[#106b42] to-[#0d5434] hover:from-[#127749] hover:to-[#0f643e] border-2 border-[#facc15]/80 shadow-xl shadow-emerald-950/50 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#facc15] text-[#042416] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div className="text-left">
                <div className="font-display text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
                  <span>INSTALL NBV APP</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/40">
                    PWA
                  </span>
                </div>
                <div className="text-[11px] text-emerald-200/80">
                  Direct install to mobile home screen
                </div>
              </div>
            </div>

            <span className="w-7 h-7 rounded-full bg-white/10 border border-white/20 text-[#facc15] flex items-center justify-center group-hover:bg-[#facc15] group-hover:text-[#042416] transition-colors">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}

      {/* 2. WELCOME SCREEN VARIANT */}
      {variant === 'welcome' && (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full min-h-[52px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0d5434] via-[#106b42] to-[#0d5434] hover:from-[#127749] hover:to-[#0f643e] border-2 border-[#facc15]/80 shadow-xl flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group ${className}`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#facc15] text-[#042416] flex items-center justify-center shadow-md">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div className="text-left">
              <div className="font-display text-sm font-extrabold text-white tracking-wide">
                INSTALL NBV APP
              </div>
              <div className="text-[11px] text-emerald-200/80">
                Install directly on Android &amp; iPhone
              </div>
            </div>
          </div>
          <span className="w-7 h-7 rounded-full bg-white/10 text-[#facc15] flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      )}

      {/* 3. MODAL CARD VARIANT (matching uploaded user screenshot style) */}
      {variant === 'modal_card' && (
        <div
          className={`rounded-3xl bg-gradient-to-b from-[#063a23] via-[#042d1b] to-[#031d11] border border-emerald-400/30 p-6 text-center space-y-4 shadow-2xl relative overflow-hidden ${className}`}
        >
          {/* Subtle glow background */}
          <div className="absolute top-0 inset-x-0 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-[#031d11] border border-emerald-400/30 shadow-inner">
              <NbvShieldEmblem size={56} />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#6EE730]">
              NBV TRADING · ANDROID &amp; IOS APP
            </span>
            <h3 className="font-display text-2xl font-black text-white leading-tight">
              Your account. Always with you.
            </h3>
            <p className="text-xs text-emerald-100/75 max-w-sm mx-auto leading-relaxed">
              Check your plans, follow your team, and receive instant deposit and withdrawal alerts
              directly from your phone without opening Chrome.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleClick}
              className="w-full min-h-[54px] px-6 py-3 rounded-2xl bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d] hover:brightness-110 border-2 border-[#86efac]/80 text-white font-display text-base font-extrabold shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>{isInstalled ? 'App Installed · Re-Install' : 'Install NBV App Directly'}</span>
            </button>
            <p className="text-[11px] text-emerald-300/70 mt-2">
              Official PWA WebAPK · Instant Home Screen Installation
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2">
            <div className="p-2.5 rounded-xl bg-[#02170d] border border-emerald-400/15">
              <span className="text-[10px] font-bold text-[#facc15] uppercase tracking-wider block">
                FULL-SCREEN
              </span>
              <span className="text-xs text-emerald-100 font-medium">Standalone Native UI</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#02170d] border border-emerald-400/15">
              <span className="text-[10px] font-bold text-[#6EE730] uppercase tracking-wider block">
                FAST ACCESS
              </span>
              <span className="text-xs text-emerald-100 font-medium">1-Tap From Home Screen</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPACT BADGE VARIANT */}
      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          className={`min-h-[36px] px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-400/40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {/* FALLBACK INSTALLATION GUIDANCE MODAL (Triggered if Chrome doesn't immediately fire prompt) */}
      {showInstallGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-sm w-full bg-[#042417] border border-emerald-400/35 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-400/20 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#facc15]" />
                <h4 className="font-bold text-sm text-white">
                  {isIOS ? 'Install on iPhone / Safari' : 'Install on Android / Chrome'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="p-1 rounded-lg bg-[#073622] text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-emerald-100/90 leading-relaxed">
              {isIOS ? (
                <>
                  <p className="font-semibold text-white">Follow these simple steps on iOS Safari:</p>
                  <div className="p-3 rounded-xl bg-[#02170d] border border-emerald-400/20 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#facc15] text-[#042416] font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <span>
                        Tap the <strong>Share</strong> button (square icon with up-arrow) at the bottom
                        of your Safari browser.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#facc15] text-[#042416] font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <span>
                        Scroll down and tap <strong>Add to Home Screen</strong>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#facc15] text-[#042416] font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <span>
                        Tap <strong>Add</strong> in the top-right. NBV Trading App will appear on your
                        home screen!
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">
                    Direct Installation in Google Chrome:
                  </p>
                  <div className="p-3 rounded-xl bg-[#02170d] border border-emerald-400/20 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#facc15] text-[#042416] font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <span>
                        Tap the <strong>three dots (⋮)</strong> in the top-right corner of Google Chrome.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#facc15] text-[#042416] font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <span>
                        Tap <strong>&ldquo;Install app&rdquo;</strong> (or <strong>&ldquo;Add to Home screen&rdquo;</strong>).
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#facc15] text-[#042416] font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <span>
                        Tap <strong>&ldquo;Install&rdquo;</strong> on the prompt. The app installs
                        seamlessly as a native standalone app!
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full min-h-[42px] rounded-xl bg-[#083c27] hover:bg-[#0b5134] border border-emerald-400/30 text-white font-bold text-xs cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
