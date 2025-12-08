"use client";

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

const SETTINGS_SECTIONS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'location', label: 'Location' },
  { id: 'professional', label: 'Professional Information' },
  { id: 'booking', label: 'Booking and Scheduling' },
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
      <div className="w-full max-w-3xl mx-auto">
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
          <div className="mb-4">
            <Avatar className="h-24 w-24">
              {user?.image && user.image.startsWith('http') && <AvatarImage src={user.image} />}
              <AvatarFallback className="bg-[#C40F5A] text-white text-2xl">{user?.name?.[0] || 'A'}</AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-xl font-bold">{user?.name || 'Artist'}</h2>
          {user?.companyName && <p className="text-gray-400 text-sm">{user.companyName}</p>}
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
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </Link>
          ))}
        </div>
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
