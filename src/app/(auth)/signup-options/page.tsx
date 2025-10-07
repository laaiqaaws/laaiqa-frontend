"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Briefcase } from "lucide-react"; // Icons for visual distinction
import { useEffect, useState } from 'react'; // Import useEffect and useState for background logic

// Define the background image paths
const BACKGROUND_IMAGES = [
  '/bg1.jpg',
  '/bg2.jpg',
  '/bg3.jpg',
  // Add more image paths here if you have them
];

// Time in milliseconds to change background image
const BACKGROUND_INTERVAL = 8000;

export default function SignupOptionsPage() {
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
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black opacity-50 md:opacity-100 z-0"></div>

      <Card className="w-full max-w-md shadow-xl bg-[#161616]/80 border-[#2a2a2a] text-white relative z-10">
        <CardHeader className="space-y-1.5 border-b border-[#2a2a2a] pb-4">
          <CardTitle className="text-2xl font-bold text-center text-pink-600">Join Laaiqa</CardTitle>
          <CardDescription className="text-center text-gray-300 pt-1"> {/* Adjusted color */}
            Choose how you'd like to get started with us.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 py-6">
          <Button
            asChild
            variant="outline"
            className="w-full h-16 text-lg bg-[#2a2a2a] border-[#4a4a4a] text-white hover:bg-[#3a3a3a] hover:text-white focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Link href="/signup-artist">
              <User className="mr-3 h-6 w-6 text-pink-500" />
              Sign up as an Artist
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full h-16 text-lg bg-[#2a2a2a] border-[#4a4a4a] text-white hover:bg-[#3a3a3a] hover:text-white focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Link href="/signup-customer">
              <Briefcase className="mr-3 h-6 w-6 text-pink-500" />
              Sign up as a Customer
            </Link>
          </Button>
        </CardContent>
         <CardFooter className="flex flex-col space-y-2 pt-6 border-t border-[#2a2a2a]">
           <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-pink-600 hover:text-pink-500 hover:underline">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}