"use client";

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

const SETTINGS_SECTIONS = [
  { id: 'basic', label: 'Basic Info', dot: true },
  { id: 'location', label: 'Location', dot: true },
  { id: 'professional', label: 'Professional Information', dot: false },
  { id: 'booking', label: 'Booking and Scheduling', dot: false },
];

function AccountSettingsContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect if not authenticated or wrong role
  if (!isLoading && !user) {
    router.replace('/login');
    return null;
  }
  
  if (!isLoading && user && user.role !== 'artist') {
    router.replace(user.role === 'customer' ? '/profile/customer/settings' : user.role === 'admin' ? '/admin' : '/signup');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 px-4 py-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="text-gray-400 text-sm">account settings</span>
        </div>
        <Avatar className="h-8 w-8">
          {user?.image && user.image.startsWith('http') && <AvatarImage src={user.image} />}
          <AvatarFallback className="bg-[#C40F5A] text-white text-sm">{user?.name?.[0] || 'A'}</AvatarFallback>
        </Avatar>
      </div>

      <div className="px-4 py-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24">
              {user?.image && user.image.startsWith('http') && <AvatarImage src={user.image} />}
              <AvatarFallback className="bg-[#C40F5A] text-white text-2xl">{user?.name?.[0] || 'A'}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 bg-[#C40F5A] p-1.5 rounded-full">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold">{user?.name || 'Artist'}</h2>
          <p className="text-gray-400 text-sm">Makeup Studio</p>
          <p className="text-gray-500 text-sm">{user?.email} | +91 {user?.phone || '0000000000'}</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-1">
          {SETTINGS_SECTIONS.map(section => (
            <Link
              key={section.id}
              href={`/profile/artist?edit=true&section=${section.id}`}
              className="flex items-center justify-between py-4 border-b border-gray-800"
            >
              <span className="text-white">{section.label}</span>
              <div className="flex items-center gap-2">
                {section.dot && <span className="w-2 h-2 bg-[#C40F5A] rounded-full"></span>}
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    }>
      <AccountSettingsContent />
    </Suspense>
  );
}
