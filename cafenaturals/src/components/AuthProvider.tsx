'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { verifyPasscode, getTables, recordLoginSession, sendSessionHeartbeat, recordLogoutSession } from '../actions';

interface AuthUser {
  email: string;
  loginAt?: number;
  sessionId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TAB_SESSION_KEY = 'cafe_tab_session_id';
const MAX_SESSION_DURATION = 3 * 60 * 60 * 1000; // 3 hours in ms
const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes of inactivity in ms

function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let os = 'Windows PC';
  if (ua.includes('Win')) os = 'Windows PC';
  else if (ua.includes('Mac')) os = 'Mac Desktop';
  else if (ua.includes('Android')) os = 'Android Phone';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Linux')) os = 'Linux PC';

  let browser = 'Chrome';
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';

  const screenRes = `${window.screen.width}x${window.screen.height}`;
  return `${os} · ${browser} (${screenRes})`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Track the last activity timestamp
  const lastActivityTimestamp = useRef<number>(Date.now());

  // Determine if this is an admin-only route
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/') ||
                       pathname.startsWith('/tables') || pathname.startsWith('/inventory') ||
                       pathname.startsWith('/history');

  const updateActivity = useCallback(() => {
    lastActivityTimestamp.current = Date.now();
  }, []);

  // Listen for user activity
  useEffect(() => {
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [updateActivity]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('cafe_blossom_auth');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        
        if (!parsed.loginAt) {
          parsed.loginAt = Date.now();
          sessionStorage.setItem('cafe_blossom_auth', JSON.stringify(parsed));
        }

        let activeSessionId = sessionStorage.getItem(TAB_SESSION_KEY) || parsed.sessionId;
        if (activeSessionId) {
          sessionStorage.setItem(TAB_SESSION_KEY, activeSessionId);
          parsed.sessionId = activeSessionId;
        }

        setUser(parsed);

        // If no active session ID exists yet, register one now
        if (!activeSessionId && isAdminRoute) {
          (async () => {
            try {
              const deviceInfo = getDeviceInfo();
              const createdId = await recordLoginSession(deviceInfo, 'Local Staff Device');
              if (createdId) {
                sessionStorage.setItem(TAB_SESSION_KEY, createdId);
                parsed.sessionId = createdId;
                sessionStorage.setItem('cafe_blossom_auth', JSON.stringify(parsed));
                setUser(prev => prev ? { ...prev, sessionId: createdId } : null);
              }
            } catch (err) {
              console.error('Failed to register tab session:', err);
            }
          })();
        }

        // Logged-in user on /login → send to admin dashboard
        if (pathname === '/login') {
          router.push('/admin');
        }
      } catch (e) {
        sessionStorage.removeItem('cafe_blossom_auth');
        sessionStorage.removeItem(TAB_SESSION_KEY);
        setUser(null);
        if (isAdminRoute || pathname === '/login') {
          router.push('/login');
        }
      }
    } else {
      setUser(null);
      if (isAdminRoute) {
        router.push('/login');
      }
    }
    setLoading(false);
  }, [pathname, router, isAdminRoute]);

  // ── Background Heartbeat & Remote Force Logout Check ─────────────────────
  useEffect(() => {
    if (!user || !isAdminRoute) return;

    const checkHeartbeat = async () => {
      const tabSessionId = sessionStorage.getItem(TAB_SESSION_KEY);
      const storedUser = sessionStorage.getItem('cafe_blossom_auth');
      let targetId = tabSessionId;
      if (!targetId && storedUser) {
        try { targetId = JSON.parse(storedUser)?.sessionId; } catch {}
      }
      if (!targetId) return;

      try {
        const res = await sendSessionHeartbeat(targetId);
        if (res?.forceLogout) {
          sessionStorage.removeItem(TAB_SESSION_KEY);
          sessionStorage.removeItem('cafe_blossom_auth');
          setUser(null);
          setShowForceLogoutModal(true);
        }
      } catch (err) {
        console.error('Heartbeat check error:', err);
      }
    };

    checkHeartbeat();
    const interval = setInterval(checkHeartbeat, 15000); // 15s interval
    return () => clearInterval(interval);
  }, [user, isAdminRoute]);

  const logout = useCallback(async () => {
    const tabSessionId = sessionStorage.getItem(TAB_SESSION_KEY);
    const storedUser = sessionStorage.getItem('cafe_blossom_auth');
    let targetId = tabSessionId;
    if (!targetId && storedUser) {
      try { targetId = JSON.parse(storedUser)?.sessionId; } catch {}
    }
    if (targetId) {
      try {
        await recordLogoutSession(targetId);
      } catch (e) {
        // ignore
      }
    }
    sessionStorage.removeItem(TAB_SESSION_KEY);
    sessionStorage.removeItem('cafe_blossom_auth');
    setUser(null);
    router.push('/login');
  }, [router]);

  const isInitialCheck = useRef(true);

  // Session expiry check
  useEffect(() => {
    if (!user || !user.loginAt) return;

    const checkSession = async () => {
      try {
        const now = Date.now();
        const sessionDuration = now - user.loginAt!;
        const inactivityDuration = now - lastActivityTimestamp.current;

        if (sessionDuration >= MAX_SESSION_DURATION) {
          if (isInitialCheck.current || inactivityDuration >= INACTIVITY_THRESHOLD) {
            const tables = await getTables();
            const hasOccupied = tables.some((t: any) => t.status === 'occupied');
            if (!hasOccupied) {
              logout();
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error checking session status:', err);
      } finally {
        isInitialCheck.current = false;
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [user, logout]);

  const login = async (password: string) => {
    const isCorrect = await verifyPasscode(password);
    if (isCorrect) {
      let sessionId = '';
      try {
        const deviceInfo = getDeviceInfo();
        const createdId = await recordLoginSession(deviceInfo, 'Local Staff Device');
        if (createdId) {
          sessionId = createdId;
          sessionStorage.setItem(TAB_SESSION_KEY, createdId);
        }
      } catch (e) {
        console.error('Failed to record login session:', e);
      }

      const loggedInUser = { email: 'staff@cafenaturaleza.com', loginAt: Date.now(), sessionId };
      sessionStorage.setItem('cafe_blossom_auth', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      router.push('/admin');
      return { error: null };
    } else {
      return { error: new Error('Incorrect passcode. Please try again.') };
    }
  };

  // Block admin routes while loading or if unauthenticated
  const blockContent = loading && isAdminRoute;
  const showSpinner = blockContent || (isAdminRoute && !user && !loading && pathname !== '/login');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {showSpinner ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        children
      )}

      {/* ── Custom Popup Modal: Remotely Terminated Session ────────────── */}
      {showForceLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-red-300 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">Session Terminated</h3>
              <p className="text-xs text-gray-600 mt-1 font-sans leading-relaxed">
                Your active staff session was remotely ended by an Administrator.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForceLogoutModal(false);
                router.push('/login');
              }}
              className="w-full py-2.5 rounded-xl bg-[#8B6B4A] hover:bg-[#6D5B4A] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md font-sans"
            >
              Return to Login
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
