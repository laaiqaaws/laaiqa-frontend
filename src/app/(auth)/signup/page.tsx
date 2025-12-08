"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { User as UserType } from '@/types/user';
import { API_ENDPOINTS, UI, getDashboardRoute, getProfileRoute } from '@/lib/config';
import { toast as sonnerToast } from "sonner";

const { BACKGROUND_IMAGES, BACKGROUND_INTERVAL } = UI;

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<'artist' | 'customer' | null>(null);
  const [isSettingRole, setIsSettingRole] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'role_required') {
      sonnerToast.info("Please select how you'd like to use Laaiqa");
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
        const response = await fetch(API_ENDPOINTS.AUTH_ME, { credentials: 'include' });
        if (response.ok) {
          const data: { user: UserType } = await response.json();
          if (['artist', 'customer', 'admin'].includes(data.user.role)) {
            router.replace(getDashboardRoute(data.user.role));
            return;
          }
          setAuthenticatedUser(data.user);
          const csrfResponse = await fetch(API_ENDPOINTS.AUTH_CSRF, { credentials: 'include' });
          if (csrfResponse.ok) {
            const csrfData = await csrfResponse.json();
            setCsrfToken(csrfData.csrfToken);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleGoogleSignup = () => {
    setIsRedirecting(true);
    window.location.href = API_ENDPOINTS.AUTH_GOOGLE;
  };

  const handleContinue = async () => {
    if (!selectedRole || !authenticatedUser || !csrfToken) return;
    setIsSettingRole(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH_ROLE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'CSRF-Token': csrfToken },
        body: JSON.stringify({ role: selectedRole }),
        credentials: 'include',
      });
      if (response.ok) {
        // Clear ALL session cache to ensure fresh data after role change
        try {
          sessionStorage.removeItem('laaiqa_user');
          sessionStorage.removeItem('laaiqa_session_expiry');
          sessionStorage.removeItem('laaiqa_csrf');
          // Set flag to force refresh on next auth context load
          sessionStorage.setItem('laaiqa_role_changed', 'true');
        } catch {
          // Ignore session storage errors
        }
        
        // Small delay to ensure cookie is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use replace to prevent back button issues
        router.replace(getProfileRoute(selectedRole));
      } else {
        const errorData = await response.json().catch(() => ({}));
        sonnerToast.error("Failed to set role", { description: errorData.message || "Please try again." });
      }
    } catch {
      sonnerToast.error("Error", { description: "Network error. Please try again." });
    } finally {
      setIsSettingRole(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  // Role Selection Screen (after Google auth)
  if (authenticatedUser) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] px-6 py-12 flex flex-col max-w-3xl mx-auto w-full">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Hey {authenticatedUser.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-400 mb-10">You would like to join us as a......</p>

          <div className="flex gap-4 w-full max-w-sm">
            <button onClick={() => setSelectedRole('artist')}
              className={`flex-1 rounded-2xl p-4 transition-all flex flex-col ${selectedRole === 'artist' ? 'bg-[#2a2a2a] border-2 border-[#C40F5A]' : 'bg-[#2a2a2a] border-2 border-transparent'}`}>
              <div className="aspect-square bg-[#3a3a3a] rounded-xl mb-3" />
              <h3 className="text-white font-semibold mb-1">Vendor</h3>
              <p className="text-gray-400 text-xs leading-relaxed flex-1">You are a service provider, and in need of a platform to organise your work.</p>
              <div className="mt-3 h-6 flex justify-center">{selectedRole === 'artist' && <Check className="h-6 w-6 text-green-500" />}</div>
            </button>

            <button onClick={() => setSelectedRole('customer')}
              className={`flex-1 rounded-2xl p-4 transition-all flex flex-col ${selectedRole === 'customer' ? 'bg-[#2a2a2a] border-2 border-[#C40F5A]' : 'bg-[#2a2a2a] border-2 border-transparent'}`}>
              <div className="aspect-square bg-[#3a3a3a] rounded-xl mb-3" />
              <h3 className="text-white font-semibold mb-1">Customer</h3>
              <p className="text-gray-400 text-xs leading-relaxed flex-1">You have upcoming functions to prepare and need to find best professionals.</p>
              <div className="mt-3 h-6 flex justify-center">{selectedRole === 'customer' && <Check className="h-6 w-6 text-green-500" />}</div>
            </button>
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={handleContinue} disabled={!selectedRole || isSettingRole}
            className="w-full h-14 bg-[#C40F5A] hover:bg-[#EE2377] text-white font-medium rounded-xl flex items-center justify-between px-6">
            <span>Continue</span>
            {isSettingRole ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <span>›</span>}
          </Button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Not sure? visit <a href="https://laaiqa.app" className="text-white underline">www.laaiqa.app</a> to know more
        </p>
      </div>
    );
  }

  // Initial Signup Screen
  return (
    <div className="relative min-h-screen bg-[#1a1a1a] overflow-hidden">
      {/* Background Images with crossfade */}
      {BACKGROUND_IMAGES.map((img, index) => (
        <div 
          key={img}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: index === currentImageIndex ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a1a]/60 to-[#1a1a1a]" />

      <div className="relative z-10 flex flex-col min-h-screen px-6 justify-center pb-20 max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-[2.75rem] font-semibold text-white leading-[1.1]" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Seamless<br />Booking for<br /><span className="text-[#C40F5A]">Every</span><br />Occasion!
          </h1>
        </div>

        <Button onClick={handleGoogleSignup} disabled={isRedirecting}
          className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg flex items-center justify-center gap-3 text-sm">
          {isRedirecting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800" /> : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </>
          )}
        </Button>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">Already have an account? <Link href="/login" className="text-[#C40F5A] underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div></div>}>
      <SignupContent />
    </Suspense>
  );
}
