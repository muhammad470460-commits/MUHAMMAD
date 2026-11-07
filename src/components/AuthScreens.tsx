import React, { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Lock,
  Users,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { NbvShieldEmblem } from './NbvVisuals';
import { PWAInstallButton } from './PWAInstallButton';
import type { UserProfile } from '../types';

interface RegisterScreenProps {
  initialReferenceCode: string;
  checkingSession?: boolean;
  onBack: () => void;
  onClickLogin: (prefillIdentifier?: string) => void;
  onRegisterSuccess: (token: string, user: UserProfile) => void;
}

export function RegisterScreen({
  initialReferenceCode,
  checkingSession = false,
  onBack,
  onClickLogin,
  onRegisterSuccess,
}: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referenceCode, setReferenceCode] = useState(initialReferenceCode);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [duplicateDetected, setDuplicateDetected] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDuplicateDetected(false);
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          referenceCode: referenceCode.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.token || !data.user) {
        if (response.status === 409) {
          setDuplicateDetected(true);
        }
        setError(data.error || 'رجسٹریشن مکمل نہیں ہو سکی، براہ کرم دوبارہ چیک کریں۔');
        setSubmitting(false);
        return;
      }

      // Automatic login immediately after one-time registration
      onRegisterSuccess(data.token, data.user);
    } catch {
      setError('نیٹ ورک کا مسئلہ پیش آیا، دوبارہ کوشش کریں۔');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#042819] via-[#052316] to-[#03170e] flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        {/* Top Bar with Back & Instant Login Button */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3 rounded-xl bg-[#073622] border border-emerald-400/25 text-emerald-100 hover:bg-[#0a462c] flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <NbvShieldEmblem size={34} />
            <span className="font-display text-base sm:text-lg font-extrabold tracking-wide text-white whitespace-nowrap">
              NBV <span className="text-[#6EE730]">TRADING</span>
            </span>
          </div>

          <button
            type="button"
            disabled={checkingSession}
            onClick={() => onClickLogin(phone.trim() || email.trim() || undefined)}
            className="min-h-[44px] px-3.5 rounded-xl bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#ca8a04] border border-[#fef08a]/80 text-[#064e23] font-display text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-sm hover:brightness-105 transition-all cursor-pointer shrink-0 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>{checkingSession ? '...' : 'Login'}</span>
          </button>
        </div>

        {/* One-Time Registration Card */}
        <div className="rounded-3xl bg-gradient-to-b from-[#073b25] to-[#052618] border border-[#2dd483]/35 shadow-2xl shadow-black/50 p-6 sm:p-7">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
            <p className="text-xs text-emerald-200/80 mt-1">
              One-Time Registration — Automatically logs into your Dashboard
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-2xl bg-red-950/70 border border-red-400/40 px-4 py-3 space-y-2.5 text-xs text-red-100"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {duplicateDetected && (
                <button
                  type="button"
                  onClick={() => onClickLogin(phone.trim() || email.trim() || undefined)}
                  className="w-full min-h-[38px] px-3 rounded-xl bg-[#facc15] text-[#052919] font-display text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Open Login Screen</span>
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Full Name (پورا نام)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-[#041f14] border border-emerald-400/30 text-white placeholder:text-emerald-200/40 text-sm focus:outline-none focus:border-[#6EE730] transition-colors"
                />
              </div>
            </div>

            {/* 2. Phone Number */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Phone Number (فون نمبر)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-phone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX XXXXXXX"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-[#041f14] border border-emerald-400/30 text-white placeholder:text-emerald-200/40 text-sm tabular-nums focus:outline-none focus:border-[#6EE730] transition-colors"
                />
              </div>
            </div>

            {/* 3. Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Email (ای میل)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-[#041f14] border border-emerald-400/30 text-white placeholder:text-emerald-200/40 text-sm focus:outline-none focus:border-[#6EE730] transition-colors"
                />
              </div>
            </div>

            {/* 4. Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Password (پاسورڈ)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password (min 4 characters)"
                  className="w-full min-h-[48px] pl-10 pr-12 rounded-xl bg-[#041f14] border border-emerald-400/30 text-white placeholder:text-emerald-200/40 text-sm focus:outline-none focus:border-[#6EE730] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-emerald-200/75 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 5. Reference Code (Optional) */}
            <div>
              <label htmlFor="reg-ref" className="block text-xs font-semibold text-[#facc15] mb-1.5">
                Reference Code — Optional (ریفرنس کوڈ)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#facc15]/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-ref"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="Optional Reference Code"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-[#041f14] border border-[#facc15]/35 text-white placeholder:text-emerald-200/40 text-sm focus:outline-none focus:border-[#facc15] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[54px] mt-2 px-5 py-3 rounded-full bg-gradient-to-b from-[#29d846] via-[#13a82c] to-[#09751b] border-2 border-[#86efac]/70 shadow-lg flex items-center justify-between disabled:opacity-60 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span className="w-8" aria-hidden="true" />
              <span className="font-display text-lg font-bold text-white whitespace-nowrap">
                {submitting ? 'Creating Account & Logging In...' : 'Register'}
              </span>
              <span className="w-8 h-8 rounded-full bg-white text-[#0b6b22] flex items-center justify-center">
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-emerald-400/15 text-center space-y-3">
            <p className="text-xs text-emerald-100/75">Already registered an account?</p>
            <button
              type="button"
              disabled={checkingSession}
              onClick={() => onClickLogin(phone.trim() || email.trim() || undefined)}
              className="w-full min-h-[48px] px-5 py-2.5 rounded-full bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#ca8a04] border-2 border-[#fef08a]/80 shadow-md flex items-center justify-between hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            >
              <span className="w-7" aria-hidden="true" />
              <span className="font-display text-base font-bold text-[#064e23] whitespace-nowrap">
                {checkingSession ? 'Opening Dashboard...' : 'Login'}
              </span>
              <span className="w-7 h-7 rounded-full bg-white text-[#b45309] flex items-center justify-center">
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoginScreenProps {
  prefillIdentifier?: string;
  registrationNotice?: string | null;
  onBack: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess: (token: string, user: UserProfile) => void;
}

export function LoginScreen({
  prefillIdentifier = '',
  registrationNotice = null,
  onBack,
  onSwitchToRegister,
  onLoginSuccess,
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState(prefillIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (prefillIdentifier) {
      setIdentifier(prefillIdentifier);
    } else {
      try {
        const raw = window.localStorage.getItem('nbv_trading_cached_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.phone || parsed.email)) {
            setIdentifier(parsed.phone || parsed.email);
          }
        }
      } catch {
        // Ignore
      }
    }
  }, [prefillIdentifier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.token || !data.user) {
        setError(data.error || 'فون نمبر/ای میل یا پاسورڈ غلط ہے۔');
        setSubmitting(false);
        return;
      }

      onLoginSuccess(data.token, data.user);
    } catch {
      setError('نیٹ ورک کا مسئلہ پیش آیا، دوبارہ کوشش کریں۔');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#042819] via-[#052316] to-[#03170e] flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#073622] border border-emerald-400/25 text-emerald-100 hover:bg-[#0a462c] flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <NbvShieldEmblem size={36} />
            <span className="font-display text-lg font-extrabold tracking-wide text-white whitespace-nowrap">
              NBV <span className="text-[#6EE730]">TRADING</span>
            </span>
          </div>

          <div className="w-[72px]" aria-hidden="true" />
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl bg-gradient-to-b from-[#073b25] to-[#052618] border border-[#2dd483]/35 shadow-2xl shadow-black/50 p-6 sm:p-7">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <NbvShieldEmblem size={56} />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-xs text-emerald-200/75 mt-1">
              Login with your Phone Number, Email, or Name &amp; Password
            </p>
          </div>

          {registrationNotice && !error && (
            <div
              role="status"
              className="mb-5 rounded-2xl bg-emerald-900/60 border border-[#6EE730]/45 px-4 py-3 flex items-start gap-2.5 text-xs text-emerald-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#6EE730] shrink-0 mt-0.5" />
              <span>{registrationNotice}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-2xl bg-red-950/70 border border-red-400/40 px-4 py-3 flex items-start gap-2.5 text-xs text-red-100"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number, Email, OR Name */}
            <div>
              <label htmlFor="login-identifier" className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Phone Number, Email, or Name (فون نمبر، ای میل یا نام)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="03XX XXXXXXX, Email, or Name"
                  className="w-full min-h-[50px] pl-10 pr-4 rounded-xl bg-[#041f14] border border-emerald-400/30 text-white placeholder:text-emerald-200/40 text-sm focus:outline-none focus:border-[#facc15] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-emerald-100 mb-1.5">
                Password (پاسورڈ)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-h-[50px] pl-10 pr-12 rounded-xl bg-[#041f14] border border-emerald-400/30 text-white placeholder:text-emerald-200/40 text-sm focus:outline-none focus:border-[#facc15] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-emerald-200/75 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[54px] mt-2 px-5 py-3 rounded-full bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#ca8a04] border-2 border-[#fef08a]/80 shadow-lg flex items-center justify-between disabled:opacity-60 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span className="w-8" aria-hidden="true" />
              <span className="font-display text-lg font-bold text-[#064e23] whitespace-nowrap">
                {submitting ? 'Logging in...' : 'Login'}
              </span>
              <span className="w-8 h-8 rounded-full bg-white text-[#b45309] flex items-center justify-center">
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </span>
            </button>

            {/* Visible INSTALL APP Button directly on Login page */}
            <div className="pt-2">
              <PWAInstallButton variant="login" />
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-emerald-400/15 text-center">
            <p className="text-xs text-emerald-100/75">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold text-[#6EE730] hover:underline ml-1 cursor-pointer"
              >
                Register Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
