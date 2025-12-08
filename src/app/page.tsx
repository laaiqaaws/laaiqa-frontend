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
    <div className="relative min-h-screen bg-black overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-6 justify-center pb-20 max-w-3xl mx-auto w-full">
        {/* Tagline - matching login page font */}
        <div className="mb-10">
          <h1 className="text-[2.75rem] font-semibold text-white leading-[1.1]" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Seamless<br />
            Booking for<br />
            <span className="text-[#C40F5A]">Every</span><br />
            Occasion!
          </h1>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            asChild
            className="w-full h-12 bg-[#C40F5A] hover:bg-[#EE2377] text-white font-medium rounded-lg"
          >
            <Link href={ROUTES.SIGNUP}>Sign Up</Link>
          </Button>
          
          <Button
            asChild
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg"
          >
            <Link href={ROUTES.LOGIN}>Login</Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href={ROUTES.LOGIN} className="text-[#C40F5A] underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
