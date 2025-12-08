"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { API_ENDPOINTS, UI, ROUTES, getDashboardRoute } from "@/lib/config";

const { BACKGROUND_IMAGES, BACKGROUND_INTERVAL } = UI;

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.matchMedia('(max-width: 767px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isMobileView) {
      intervalId = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % BACKGROUND_IMAGES.length);
      }, BACKGROUND_INTERVAL);
    }
    return () => clearInterval(intervalId);
  }, [isMobileView]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH_ME, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const data: { user: User } = await response.json();
          const role = data.user?.role;
          
          if (['artist', 'customer', 'admin'].includes(role)) {
            router.replace(getDashboardRoute(role));
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-black"
      style={{
        backgroundImage: isMobileView ? `url(${BACKGROUND_IMAGES[currentImageIndex]})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 1s ease-in-out',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50 md:opacity-100 z-0"></div>
      
      <div className="relative z-10 text-center max-w-lg">
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Welcome to <span className="text-[#C40F5A]">Laaiqa</span>
        </h1>
        <p className="text-gray-300 text-lg mb-8">
          Connect with professional makeup artists and bring your beauty vision to life.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="h-12 px-8 text-lg bg-[#C40F5A] hover:bg-[#EE2377] text-white rounded-lg"
          >
            <Link href={ROUTES.SIGNUP}>Sign Up</Link>
          </Button>
          
          <Button
            asChild
            className="h-12 px-8 text-lg bg-white hover:bg-gray-100 text-gray-800 rounded-lg"
          >
            <Link href={ROUTES.LOGIN}>Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
