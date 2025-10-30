'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, User } from '@/types/user'; // Assuming User type includes 'role'

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Fetch the authenticated user data to get their role
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include', // Important to send the cookie
        });

        if (response.ok) {
          const data: { user: User } = await response.json();

          if (data.user && data.user.role) {
            const user = data.user;

            // --- Redirect based on role ---
            if (user.role === 'admin') {
              // If the user is an admin, redirect to the admin dashboard
              router.push('/admin/dashboard');
            } else if (user.role === 'artist' || user.role === 'customer') {
              // For artists and customers, check for profile completion

              let isAdditionalInfoRequired = false;

              if (user.role === 'customer') {
                  // Check required fields for customer profile completion - simplified
                  if (!user.phone || !user.age || !user.height || !user.color) {
                      isAdditionalInfoRequired = true;
                  }
              } else if (user.role === 'artist') {
                  // Check required fields for artist profile completion - removed optional fields
                  if (!user.bio || !user.specialties || !user.phone) {
                      isAdditionalInfoRequired = true;
                  }
              }

              if (isAdditionalInfoRequired) {
                  // Redirect to profile completion page if info is missing
                  if (user.role === 'customer') {
                       router.push('/profile/customer');
                  } else if (user.role === 'artist') {
                       router.push('/profile/artist');
                  } else {
                      // Fallback, though should be covered by role check
                      router.push('/login');
                  }
              } else {
                  // Redirect to respective dashboards if profile is complete
                  if (user.role === 'artist') {
                      router.push('/artist'); // Assuming this is the artist dashboard route
                  } else if (user.role === 'customer') {
                      router.push('/customer'); // Assuming this is the customer dashboard route
                  } else {
                       // Fallback
                       router.push('/login');
                  }
              }
            } else {
                // Handle unexpected roles
                console.warn(`User logged in with unexpected role: ${user.role}`);
                router.push('/login?error=invalid_role');
            }
          } else {
            // User data or role is missing in the response
            console.error('User data or role missing from /auth/me response');
            router.push('/login?error=user_data_missing');
          }
        } else {
          // API response was not OK (e.g., 401, 403)
          console.error('Failed to fetch user data after callback:', response.status);
          router.push('/login?error=auth_fetch_failed');
        }
      } catch (error) {
        console.error('Error during auth callback processing:', error);
        router.push('/login?error=callback_processing_failed');
      }
    };

    // Small delay to ensure cookie is set
    const timer = setTimeout(() => {
      handleAuthCallback();
    }, 500); // Reduced timeout slightly, adjust if needed

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-300">
      <p className="text-lg mb-4">Verifying authentication...</p>
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-600"></div>
    </div>
  );
}