import React, { useEffect, useState, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegisterScreen, LoginScreen } from './components/AuthScreens';
import { DashboardScreen } from './components/DashboardScreen';
import { InvestmentPlansComponent } from './components/InvestmentPlansComponent';
import { WithdrawalComponent } from './components/WithdrawalComponent';
import { AdminPanel } from './components/AdminPanel';
import type { AdminTab } from './components/AdminPanel';
import { NbvShieldEmblem } from './components/NbvVisuals';
import {
  AUTH_TOKEN_KEY,
  clearAuthSession,
  getSyncAuthToken,
  getSyncCachedUser,
  getSyncDeviceHasAccount,
  loadPersistedSessionFromDevice,
  persistAuthSession,
  updateCachedUserProfile,
} from './utils/authSession';
import { useRealtimeSupport } from './utils/useRealtimeSupport';
import type { AppScreen, DashboardSectionModal, UserProfile } from './types';

function extractInitialRouteInfo(): {
  refCode: string;
  openRegister: boolean;
  wantsAdmin: boolean;
} {
  if (typeof window === 'undefined') {
    return { refCode: '', openRegister: false, wantsAdmin: false };
  }
  const pathname = window.location.pathname;
  if (pathname.toLowerCase().startsWith('/admin')) {
    return { refCode: '', openRegister: false, wantsAdmin: true };
  }

  let capturedRef = '';
  let wantsRegister = false;

  // 1. Path-based referral: /register/:code, /join/:code, /invite/:code
  const pathMatch = pathname.match(/^\/(?:register|join|invite)\/([^/?#]+)/i);
  if (pathMatch && pathMatch[1]) {
    capturedRef = decodeURIComponent(pathMatch[1]).trim();
    wantsRegister = true;
  }

  // 2. Query param based: ?ref=CODE, ?reference=CODE, ?code=CODE
  const params = new URLSearchParams(window.location.search);
  const queryRef = params.get('ref') || params.get('reference') || params.get('code') || '';
  if (queryRef) {
    capturedRef = queryRef.trim();
    wantsRegister = true;
  }

  // 3. Direct /register path
  if (pathname.toLowerCase() === '/register' || pathname.toLowerCase().startsWith('/register/')) {
    wantsRegister = true;
  }

  // 4. Persistence across refresh: save to and recover from localStorage/sessionStorage
  if (capturedRef) {
    try {
      localStorage.setItem('nbv_saved_referral_code', capturedRef);
      sessionStorage.setItem('nbv_saved_referral_code', capturedRef);
    } catch {
      // Ignore
    }
  } else {
    try {
      const saved =
        localStorage.getItem('nbv_saved_referral_code') ||
        sessionStorage.getItem('nbv_saved_referral_code') ||
        '';
      if (saved) {
        capturedRef = saved.trim();
      }
    } catch {
      // Ignore
    }
  }

  return {
    refCode: capturedRef,
    openRegister: wantsRegister,
    wantsAdmin: false,
  };
}

class UnauthorizedSessionError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedSessionError';
  }
}

export default function App() {
  const initialRoute = extractInitialRouteInfo();
  const initialSyncToken = getSyncAuthToken();
  const initialSyncUser = getSyncCachedUser();
  const initialHasDeviceAccount = getSyncDeviceHasAccount();

  const [screen, setScreen] = useState<AppScreen>(() => {
    // If opening an invitation or registration link, immediately open register
    if (initialRoute.openRegister && initialRoute.refCode) {
      return 'register';
    }
    if (initialSyncUser) {
      return initialRoute.wantsAdmin && initialSyncUser.role === 'admin' ? 'admin' : 'dashboard';
    }
    if (initialRoute.wantsAdmin) return 'login';
    if (initialRoute.openRegister || !initialHasDeviceAccount) return 'register';
    return 'welcome';
  });
  const [referenceCodeFromUrl] = useState<string>(initialRoute.refCode);
  const [prefillLoginId, setPrefillLoginId] = useState<string>('');
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>(initialSyncToken);
  const [user, setUser] = useState<UserProfile | null>(initialSyncUser);
  const [bootstrapping, setBootstrapping] = useState<boolean>(!initialSyncUser);
  const [checkingLoginSession, setCheckingLoginSession] = useState<boolean>(false);
  const [pendingDashboardModal, setPendingDashboardModal] = useState<DashboardSectionModal>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab | undefined>(undefined);
  const [adminSupportTargetUserId, setAdminSupportTargetUserId] = useState<string | null>(null);

  const {
    notifications,
    unreadNotificationsCount,
    unreadCustomerSupportCount,
    unreadAdminSupportCount,
    liveToast,
    lastIncomingMessage,
    dismissToast,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useRealtimeSupport(authToken, user);

  const fetchCurrentSession = useCallback(async (token?: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      headers,
    });
    if (res.status === 401) {
      throw new UnauthorizedSessionError();
    }
    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }
    const data = await res.json();
    return {
      user: data.user as UserProfile,
      token: (typeof data.token === 'string' && data.token ? data.token : token || '') as string,
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      try {
        const persisted = await loadPersistedSessionFromDevice();
        if (!active) return;

        // Immediately set cached user from device storage so user sees dashboard right away
        if (persisted.cachedUser) {
          setUser(persisted.cachedUser);
          if (persisted.token) setAuthToken(persisted.token);
          setScreen(
            initialRoute.wantsAdmin && persisted.cachedUser.role === 'admin'
              ? 'admin'
              : 'dashboard'
          );
        }

        // Verify with server in background
        try {
          const verified = await fetchCurrentSession(persisted.token || undefined);
          if (!active) return;

          if (verified.token && verified.user) {
            await persistAuthSession(verified.token, verified.user);
            if (!active) return;
            setAuthToken(verified.token);
            setUser(verified.user);
            setScreen(
              initialRoute.wantsAdmin && verified.user.role === 'admin' ? 'admin' : 'dashboard'
            );
            return;
          }
        } catch {
          if (!active) return;
          // Attempt device-session renewal if server returned unauthorized
          if (persisted.cachedUser) {
            try {
              const res = await fetch('/api/auth/device-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  userId: persisted.cachedUser.id,
                  phone: persisted.cachedUser.phone,
                  token: persisted.token,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.token && data.user) {
                  await persistAuthSession(data.token, data.user);
                  if (!active) return;
                  setAuthToken(data.token);
                  setUser(data.user);
                  setScreen(
                    initialRoute.wantsAdmin && data.user.role === 'admin' ? 'admin' : 'dashboard'
                  );
                  return;
                }
              }
            } catch {
              // Maintain local session in memory
            }
          }
        }
      } finally {
        if (active) {
          setBootstrapping(false);
        }
      }
    }

    void bootstrapAuth();
    return () => {
      active = false;
    };
  }, [fetchCurrentSession, initialRoute.openRegister, initialRoute.wantsAdmin]);

  // Synchronize auth state across multiple browser tabs on the same device
  useEffect(() => {
    function handleStorageSync(e: StorageEvent) {
      if (e.key !== AUTH_TOKEN_KEY) return;
      const nextToken = e.newValue || '';
      if (!nextToken) {
        setAuthToken('');
        setUser(null);
        setScreen('login');
      } else {
        void fetchCurrentSession(nextToken)
          .then(({ user: freshUser, token: resolvedToken }) => {
            setAuthToken(resolvedToken);
            setUser(freshUser);
            setScreen('dashboard');
          })
          .catch(() => {
            // Ignore transient sync errors
          });
      }
    }
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [fetchCurrentSession]);

  const handleRefreshProfile = useCallback(async () => {
    const currentToken = authToken || getSyncAuthToken();
    try {
      const { user: freshProfile, token: resolvedToken } = await fetchCurrentSession(
        currentToken || undefined
      );
      if (resolvedToken && resolvedToken !== authToken) {
        setAuthToken(resolvedToken);
      }
      setUser(freshProfile);
      await updateCachedUserProfile(freshProfile);
    } catch (err) {
      if (err instanceof UnauthorizedSessionError) {
        await clearAuthSession();
        setAuthToken('');
        setUser(null);
        setScreen('login');
      }
    }
  }, [authToken, fetchCurrentSession]);

  function handleAuthSuccess(token: string, loggedInUser: UserProfile) {
    try {
      localStorage.removeItem('nbv_saved_referral_code');
      sessionStorage.removeItem('nbv_saved_referral_code');
    } catch {
      // Ignore
    }
    void persistAuthSession(token, loggedInUser);
    setAuthToken(token);
    setUser(loggedInUser);
    setRegistrationNotice(null);
    if (window.location.pathname.toLowerCase().startsWith('/admin') && loggedInUser.role === 'admin') {
      setScreen('admin');
      return;
    }
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    setScreen('dashboard');
  }

  // Clicking Login opens Dashboard directly if user or saved session exists on device;
  // NEVER repeatedly asks for phone number or password on the same device!
  async function handleLoginButtonClick(optionalPrefill?: string) {
    setRegistrationNotice(null);
    if (optionalPrefill) {
      setPrefillLoginId(optionalPrefill);
    }
    if (user) {
      setScreen(initialRoute.wantsAdmin && user.role === 'admin' ? 'admin' : 'dashboard');
      return;
    }

    setCheckingLoginSession(true);
    try {
      const persisted = await loadPersistedSessionFromDevice();

      // If device already registered or logged in, directly restore user and open Dashboard!
      if (persisted.cachedUser) {
        setUser(persisted.cachedUser);
        if (persisted.token) setAuthToken(persisted.token);
        setScreen(
          initialRoute.wantsAdmin && persisted.cachedUser.role === 'admin' ? 'admin' : 'dashboard'
        );
        // Silently renew session token with server
        void fetch('/api/auth/device-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: persisted.cachedUser.id,
            phone: persisted.cachedUser.phone,
            token: persisted.token,
          }),
        }).then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data.token && data.user) {
              await persistAuthSession(data.token, data.user);
              setAuthToken(data.token);
              setUser(data.user);
            }
          }
        }).catch(() => {});
        return;
      }

      // Try checking server session
      const verified = await fetchCurrentSession(persisted.token || undefined);
      if (verified.token && verified.user) {
        await persistAuthSession(verified.token, verified.user);
        setAuthToken(verified.token);
        setUser(verified.user);
        setScreen(
          initialRoute.wantsAdmin && verified.user.role === 'admin' ? 'admin' : 'dashboard'
        );
        return;
      }
    } catch {
      // Proceed to login screen only if device has zero account history
    } finally {
      setCheckingLoginSession(false);
    }

    setScreen('login');
  }

  async function handleLogout() {
    const tokenToRevoke = authToken || getSyncAuthToken();
    await clearAuthSession();
    setAuthToken('');
    setUser(null);
    setScreen('login');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: tokenToRevoke ? { Authorization: `Bearer ${tokenToRevoke}` } : {},
      });
    } catch {
      // Ignore network errors on logout
    }
  }

  const handleOpenAdminSupportThread = useCallback(
    (customerUserId: string) => {
      if (user?.role === 'admin') {
        setAdminInitialTab('support');
        setAdminSupportTargetUserId(customerUserId);
        setScreen('admin');
      }
    },
    [user?.role]
  );

  const clearInitialAdminSupportTarget = useCallback(() => {
    setAdminSupportTargetUserId(null);
  }, []);

  if (bootstrapping) {
    return (
      <div className="min-h-screen w-full bg-[#031a10] flex flex-col items-center justify-center gap-3">
        <NbvShieldEmblem size={60} />
        <p className="font-display text-lg font-bold tracking-wide text-white">
          NBV <span className="text-[#6EE730]">TRADING</span>
        </p>
      </div>
    );
  }

  const liveNotificationBanner =
    liveToast && user && authToken ? (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-1.5rem)] max-w-md rounded-2xl bg-[#05291a]/95 backdrop-blur-md border-2 border-[#facc15]/75 p-3.5 shadow-2xl text-white">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#083c26] border border-[#facc15]/45 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-[#facc15]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                {liveToast.title}
              </p>
              <p className="text-xs text-emerald-100/85 line-clamp-2 mt-0.5">
                {liveToast.body}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {liveToast.type === 'customer_message' && user.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      void markNotificationRead(liveToast.id);
                      dismissToast();
                      handleOpenAdminSupportThread(liveToast.relatedUserId);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#facc15] hover:brightness-105 text-[#042416] text-[11px] font-extrabold cursor-pointer"
                  >
                    Open &amp; Reply
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void markNotificationRead(liveToast.id);
                      dismissToast();
                      setPendingDashboardModal('admin_support');
                      setScreen('dashboard');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#10b956] hover:bg-[#0ea54c] text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    View Reply
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="w-7 h-7 rounded-lg bg-[#083c26] hover:bg-[#0b4f33] flex items-center justify-center text-emerald-100 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ) : null;

  if (screen === 'admin' && user && user.role === 'admin' && authToken) {
    return (
      <>
        {liveNotificationBanner}
        <AdminPanel
          authToken={authToken}
          currentAdmin={user}
          initialTab={adminInitialTab}
          initialSupportUserId={adminSupportTargetUserId}
          onClearInitialSupportTarget={clearInitialAdminSupportTarget}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadAdminSupportCount={unreadAdminSupportCount}
          lastIncomingMessage={lastIncomingMessage}
          onMarkNotificationRead={markNotificationRead}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          onRefreshNotifications={refreshNotifications}
          onExitAdmin={() => {
            setAdminInitialTab(undefined);
            void handleRefreshProfile();
            setScreen('dashboard');
          }}
          onLogout={handleLogout}
          onRefreshUser={handleRefreshProfile}
        />
      </>
    );
  }

  if (screen === 'deposit_plans' && user && authToken) {
    return (
      <>
        {liveNotificationBanner}
        <InvestmentPlansComponent
          authToken={authToken}
          onBackToDashboard={() => {
            void handleRefreshProfile();
            setScreen('dashboard');
          }}
          onOpenDepositHistory={() => {
            void handleRefreshProfile();
            setPendingDashboardModal('deposit_history');
            setScreen('dashboard');
          }}
          onDepositSubmitted={handleRefreshProfile}
        />
      </>
    );
  }

  if (screen === 'withdraw' && user && authToken) {
    return (
      <>
        {liveNotificationBanner}
        <WithdrawalComponent
          user={user}
          authToken={authToken}
          onBackToDashboard={() => {
            void handleRefreshProfile();
            setScreen('dashboard');
          }}
          onOpenWithdrawHistory={() => {
            void handleRefreshProfile();
            setPendingDashboardModal('withdraw_history');
            setScreen('dashboard');
          }}
          onWithdrawalSubmitted={handleRefreshProfile}
        />
      </>
    );
  }

  if (
    (screen === 'dashboard' ||
      screen === 'admin' ||
      screen === 'deposit_plans' ||
      screen === 'withdraw') &&
    user &&
    authToken
  ) {
    return (
      <>
        {liveNotificationBanner}
        <DashboardScreen
          user={user}
          authToken={authToken}
          initialModal={pendingDashboardModal}
          onClearInitialModal={() => setPendingDashboardModal(null)}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadCustomerSupportCount={unreadCustomerSupportCount}
          unreadAdminSupportCount={unreadAdminSupportCount}
          lastIncomingMessage={lastIncomingMessage}
          onMarkNotificationRead={markNotificationRead}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          onRefreshNotifications={refreshNotifications}
          onOpenAdminSupportThread={handleOpenAdminSupportThread}
          onOpenDepositPlans={() => setScreen('deposit_plans')}
          onOpenWithdraw={() => setScreen('withdraw')}
          onOpenAdminPanel={() => {
            if (user.role === 'admin') {
              setAdminInitialTab(undefined);
              setScreen('admin');
            }
          }}
          onLogout={handleLogout}
          onRefreshProfile={handleRefreshProfile}
        />
      </>
    );
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        initialReferenceCode={referenceCodeFromUrl}
        checkingSession={checkingLoginSession}
        onBack={() => setScreen('welcome')}
        onClickLogin={(prefill) => void handleLoginButtonClick(prefill)}
        onRegisterSuccess={handleAuthSuccess}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        prefillIdentifier={prefillLoginId}
        registrationNotice={registrationNotice}
        onBack={() => {
          setRegistrationNotice(null);
          setScreen('welcome');
        }}
        onSwitchToRegister={() => {
          setRegistrationNotice(null);
          setScreen('register');
        }}
        onLoginSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <WelcomeScreen
      onGoRegister={() => {
        setRegistrationNotice(null);
        setScreen('register');
      }}
      onGoLogin={() => void handleLoginButtonClick()}
    />
  );
}
