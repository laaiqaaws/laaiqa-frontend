"use client";

import { Button } from "@/components/ui/button";
import { API_ENDPOINTS, UI, ROUTES, getDashboardRoute } from '@/lib/config';
import { User } from '@/types/user';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const { BACKGROUND_IMAGES, BACKGROUND_INTERVAL } = UI;

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError) {
      switch (authError) {
        case 'google_auth_failed':
          setError("Google authentication failed. Please try again.");
          break;
        case 'authentication_profile_missing':
          setError("Could not retrieve your profile. Please try again.");
          break;
        default:
          setError("An error occurred. Please try again.");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % BACKGROUND_IMAGES.length);
    }, BACKGROUND_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH_ME, { 
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const data: { user: User } = await response.json();
          const role = data.user?.role;
          if (['artist', 'customer', 'admin'].includes(role)) {
            // Clear any stale session data
            try {
              sessionStorage.removeItem('laaiqa_user');
              sessionStorage.removeItem('laaiqa_session_expiry');
            } catch {
              // Ignore
            }
            router.replace(getDashboardRoute(role));
          } else if (role === 'user') {
            router.replace(ROUTES.SIGNUP);
          }
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    window.location.href = API_ENDPOINTS.AUTH_GOOGLE;
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${BACKGROUND_IMAGES[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a1a]/60 to-[#1a1a1a]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-6 pt-[40vh]">
        {/* Tagline - matching screenshot font */}
        <div className="mb-10">
          <h1 className="text-[2.75rem] font-semibold text-white leading-[1.1]" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Seamless<br />
            Booking for<br />
            <span className="text-[#C40F5A]">Every</span><br />
            Occasion!
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <Button
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
          className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg flex items-center justify-center gap-3 text-sm"
        >
          {isRedirecting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800" />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </Button>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Not yet registered?{' '}
            <Link href="/signup" className="text-[#C40F5A] underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
