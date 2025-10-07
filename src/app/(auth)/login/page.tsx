"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from '@/types/user';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast as sonnerToast } from "sonner";

function LoginErrorDisplay() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError) {
      switch (authError) {
        case 'google_auth_failed':
          setError("Google authentication failed. Please ensure you've granted necessary permissions and try again.");
          break;
        case 'authentication_profile_missing':
          setError("Could not retrieve your profile from Google after authentication. Please try again.");
          break;
        case 'callback_processing_failed':
          setError("There was an issue processing your login after Google authentication. Please try again.");
          break;
        case 'user_not_found_or_inactive':
            setError("Your account was not found or may be inactive. Please sign up or contact support.");
            break;
        default:
          setError("An unknown error occurred during the login process. Please try again.");
      }
    } else {
      setError(null);
    }
  }, [searchParams]);

  if (!error) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-red-900/30 text-red-300 border border-red-700/50 rounded-md text-sm" role="alert">
      {error}
    </div>
  );
}

const BACKGROUND_IMAGES = [
  '/bg1.jpg',
  '/bg2.jpg',
  '/bg3.jpg',
];

const BACKGROUND_INTERVAL = 8000;

export default function LoginPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false); // State to track if it's mobile view

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.matchMedia('(max-width: 767px)').matches);
    };

    // Check initially and add listener for resize
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Cleanup listener
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount


  useEffect(() => {
     let intervalId: NodeJS.Timeout;

    if (isMobileView) {
      intervalId = setInterval(() => {
        setCurrentImageIndex(prevIndex =>
          (prevIndex + 1) % BACKGROUND_IMAGES.length
        );
      }, BACKGROUND_INTERVAL);
    }

    return () => clearInterval(intervalId);
  }, [isMobileView]); // Re-run effect when isMobileView changes


  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 bg-black md:bg-none"
      style={{
        // Conditionally apply background image based on state
        backgroundImage: isMobileView ? `url(${BACKGROUND_IMAGES[currentImageIndex]})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 1s ease-in-out',
        backgroundColor: 'black', // Fallback/Desktop background
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50 md:opacity-100 z-0"></div>
      {/* Removed CardHeader for title as per your request */}
      <Card className="w-full max-w-sm shadow-xl bg-[#161616]/80 border-[#2a2a2a] text-white relative z-10">
        <CardHeader className="space-y-1.5 border-b border-[#2a2a2a] pb-4"> {/* Re-added CardHeader for the title */}
            <CardTitle className="text-2xl font-bold text-center text-pink-600">Login to Laaiqa</CardTitle> {/* Re-added the title */}
            <CardDescription className="text-center text-gray-300 pt-1">
              Continue with your Google account to access your dashboard.
            </CardDescription>
         </CardHeader>
        <CardContent className="py-6">
          <Suspense fallback={<div className="mb-4 h-12 rounded-md bg-[#2a2a2a] animate-pulse"></div>}>
            <LoginErrorDisplay />
          </Suspense>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base bg-[#2a2a2a] border-[#4a4a4a] text-white hover:bg-[#3a3a3a] hover:text-white focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            onClick={handleGoogleLogin}
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
            )}
            {isRedirecting ? 'Redirecting...' : 'Sign in with Google'}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-6 border-t border-[#2a2a2a]">
          <div className="text-center text-sm text-gray-400">
            New to Laaiqa?{" "}
            <Link href="/signup-options" className="font-medium text-pink-600 hover:text-pink-500 hover:underline">
              Create an account
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}