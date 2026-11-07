import React, { useState } from 'react';
import { UserPlus, LogIn, ChevronRight, ShieldCheck, TrendingUp, Globe, Headphones } from 'lucide-react';
import { NbvShieldEmblem } from './NbvVisuals';
import { PWAInstallButton } from './PWAInstallButton';

interface WelcomeScreenProps {
  onGoRegister: () => void;
  onGoLogin: () => void;
}

export function WelcomeScreen({ onGoRegister, onGoLogin }: WelcomeScreenProps) {
  const [posterError, setPosterError] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#042417] via-[#063320] to-[#031a10] flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md lg:max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Visual Hero Poster Column */}
        <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-emerald-400/30 shadow-2xl shadow-black/50 bg-[#e9f8f1] relative">
          {!posterError ? (
            <div className="relative w-full aspect-[1024/1115] overflow-hidden bg-[#dff5ec]">
              <img
                src="/assets/aistudio/file_000000005d908211b8157681093131ec_1ae6e89f.png"
                alt="NBV Trading App Global Market Platform"
                referrerPolicy="no-referrer"
                onError={() => setPosterError(true)}
                className="w-full h-[137%] max-w-none object-cover object-top select-none"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#052c1b] via-[#052c1b]/55 to-transparent" />
            </div>
          ) : (
            <div className="p-8 bg-gradient-to-b from-[#08462b] to-[#042417] text-center flex flex-col items-center justify-center min-h-[360px]">
              <NbvShieldEmblem size={84} />
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white">
                NBV <span className="text-[#6EE730]">TRADING APP</span>
              </h1>
              <p className="mt-2 text-sm text-emerald-100/80 max-w-xs">
                Secure &amp; Trusted Online Global Market Trading Platform
              </p>
            </div>
          )}

          {/* Mobile Action Area seamlessly attached under the poster artwork */}
          <div className="lg:hidden bg-gradient-to-b from-[#052c1b] to-[#042014] px-5 pt-4 pb-6 space-y-3.5">
            <button
              type="button"
              onClick={onGoRegister}
              className="w-full min-h-[58px] px-5 py-3 rounded-full bg-gradient-to-b from-[#29d846] via-[#13a82c] to-[#09751b] border-2 border-[#86efac]/70 shadow-lg shadow-emerald-950/60 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-white">
                <UserPlus className="w-7 h-7 stroke-[2.4]" />
              </span>
              <span className="font-display text-2xl font-bold tracking-wide text-white whitespace-nowrap">
                Register
              </span>
              <span className="w-9 h-9 rounded-full bg-white text-[#0b6b22] flex items-center justify-center shadow-sm">
                <ChevronRight className="w-6 h-6 stroke-[3]" />
              </span>
            </button>

            <button
              type="button"
              onClick={onGoLogin}
              className="w-full min-h-[58px] px-5 py-3 rounded-full bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#ca8a04] border-2 border-[#fef08a]/80 shadow-lg shadow-amber-950/50 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-white">
                <LogIn className="w-7 h-7 stroke-[2.4]" />
              </span>
              <span className="font-display text-2xl font-bold tracking-wide text-[#064e23] whitespace-nowrap">
                Login
              </span>
              <span className="w-9 h-9 rounded-full bg-white text-[#b45309] flex items-center justify-center shadow-sm">
                <ChevronRight className="w-6 h-6 stroke-[3]" />
              </span>
            </button>

            {/* Direct PWA Install App Button on Mobile Welcome */}
            <div className="pt-1">
              <PWAInstallButton variant="welcome" />
            </div>
          </div>
        </div>

        {/* Desktop Companion CTA Column (keeps 1440px desktop balanced and crisp) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center bg-[#062d1c]/90 border border-emerald-400/25 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <NbvShieldEmblem size={50} />
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
                NBV <span className="text-[#6EE730]">TRADING</span>
              </h1>
              <p className="text-xs text-emerald-200/75">Global Online Market Platform</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold text-white leading-tight">
              Built for your next step in global trading.
            </h2>
            <p className="text-sm text-emerald-100/75 leading-relaxed">
              Create your NBV Trading account with your referral code or sign in instantly using your phone number or name.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-emerald-100/90">
            <div className="flex items-center gap-2.5 bg-[#042014] border border-emerald-400/20 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 text-[#facc15] shrink-0" />
              <span>Secure &amp; Trusted</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#042014] border border-emerald-400/20 rounded-xl p-3">
              <TrendingUp className="w-4 h-4 text-[#6EE730] shrink-0" />
              <span>Online Trading</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#042014] border border-emerald-400/20 rounded-xl p-3">
              <Globe className="w-4 h-4 text-[#facc15] shrink-0" />
              <span>Global Market</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#042014] border border-emerald-400/20 rounded-xl p-3">
              <Headphones className="w-4 h-4 text-[#6EE730] shrink-0" />
              <span>24/7 Support</span>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            <button
              type="button"
              onClick={onGoRegister}
              className="w-full min-h-[56px] px-5 py-3 rounded-full bg-gradient-to-b from-[#29d846] via-[#13a82c] to-[#09751b] border-2 border-[#86efac]/70 shadow-lg flex items-center justify-between hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
            >
              <UserPlus className="w-6 h-6 text-white stroke-[2.4]" />
              <span className="font-display text-xl font-bold text-white whitespace-nowrap">
                Register
              </span>
              <span className="w-8 h-8 rounded-full bg-white text-[#0b6b22] flex items-center justify-center">
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </span>
            </button>

            <button
              type="button"
              onClick={onGoLogin}
              className="w-full min-h-[56px] px-5 py-3 rounded-full bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#ca8a04] border-2 border-[#fef08a]/80 shadow-lg flex items-center justify-between hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
            >
              <LogIn className="w-6 h-6 text-white stroke-[2.4]" />
              <span className="font-display text-xl font-bold text-[#064e23] whitespace-nowrap">
                Login
              </span>
              <span className="w-8 h-8 rounded-full bg-white text-[#b45309] flex items-center justify-center">
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </span>
            </button>

            {/* Direct PWA Install App Button on Desktop Welcome */}
            <div className="pt-2">
              <PWAInstallButton variant="welcome" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
