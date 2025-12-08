'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { API_ENDPOINTS, ROUTES, getDashboardRoute } from '@/lib/config';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await fetch(API_ENDPOINTS.AUTH_ME, {
          credentials: 'include',
        });

        if (!response.ok) {
          setStatus('error');
          setErrorMessage('Failed to verify authentication. Please try logging in again.');
          setTimeout(() => router.push(`${ROUTES.LOGIN}?error=auth_fetch_failed`), 2000);
          return;
        }

        const data: { user: User } = await response.json();

        if (!data.user) {
          setStatus('error');
          setErrorMessage('User data not found. Please try logging in again.');
          setTimeout(() => router.push(`${ROUTES.LOGIN}?error=user_data_missing`), 2000);
          return;
        }

        const user = data.user;

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

        // For artist/customer - always go to dashboard first
        // The dashboard/profile pages will handle incomplete profile detection
        // This prevents redirect loops during onboarding
        router.replace(getDashboardRoute(user.role));

      } catch (error) {
        console.error('Error during auth callback processing:', error);
        setStatus('error');
        setErrorMessage('An error occurred. Please try logging in again.');
        setTimeout(() => router.push(`${ROUTES.LOGIN}?error=callback_processing_failed`), 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-gray-300">
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
