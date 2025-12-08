'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@/types/user';
import { API_ENDPOINTS, ROUTES, getDashboardRoute, getProfileRoute } from '@/lib/config';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing in strict mode
    if (processedRef.current) return;
    processedRef.current = true;

    const handleAuthCallback = async () => {
      try {
        // Small delay to ensure cookie is set after OAuth redirect
        await new Promise(resolve => setTimeout(resolve, 200));

        const response = await fetch(API_ENDPOINTS.AUTH_ME, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          setStatus('error');
          setErrorMessage('Failed to verify authentication. Please try logging in again.');
          setTimeout(() => router.replace(`${ROUTES.LOGIN}?error=auth_fetch_failed`), 2000);
          return;
        }

        const data: { user: User } = await response.json();

        if (!data.user) {
          setStatus('error');
          setErrorMessage('User data not found. Please try logging in again.');
          setTimeout(() => router.replace(`${ROUTES.LOGIN}?error=user_data_missing`), 2000);
          return;
        }

        const user = data.user;

        // Clear any stale session data to ensure fresh state
        try {
          sessionStorage.removeItem('laaiqa_user');
          sessionStorage.removeItem('laaiqa_session_expiry');
        } catch {
          // Ignore session storage errors
        }

        // Check if user has a valid role (not 'user' which is the default)
        if (!user.role || user.role === 'user') {
          // User needs to select a role - redirect to signup
          router.replace(ROUTES.SIGNUP);
          return;
        }

        // Admin goes directly to admin dashboard
        if (user.role === 'admin') {
          router.replace(getDashboardRoute('admin'));
          return;
        }

        // Check for redirect parameter (from protected route access)
        const redirectTo = searchParams.get('redirect');
        if (redirectTo && redirectTo.startsWith('/')) {
          // Validate redirect is appropriate for user's role
          if (
            (user.role === 'artist' && (redirectTo.startsWith('/artist') || redirectTo.startsWith('/profile/artist'))) ||
            (user.role === 'customer' && (redirectTo.startsWith('/customer') || redirectTo.startsWith('/profile/customer')))
          ) {
            router.replace(redirectTo);
            return;
          }
        }

        // Check if profile is complete
        const profileComplete = user.profileComplete;
        
        if (!profileComplete) {
          // Redirect to profile completion page
          router.replace(getProfileRoute(user.role));
          return;
        }

        // Profile is complete - go to dashboard
        router.replace(getDashboardRoute(user.role));

      } catch (error) {
        console.error('Error during auth callback processing:', error);
        setStatus('error');
        setErrorMessage('An error occurred. Please try logging in again.');
        setTimeout(() => router.replace(`${ROUTES.LOGIN}?error=callback_processing_failed`), 2000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-300">
      {status === 'loading' ? (
        <>
          <p className="text-lg mb-4">Verifying authentication...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
        </>
      ) : (
        <>
          <p className="text-lg mb-4 text-red-400">{errorMessage}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </>
      )}
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-300">
        <p className="text-lg mb-4">Loading...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
