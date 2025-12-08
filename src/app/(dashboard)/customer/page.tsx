"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/types/user';
import {
  Bell, Search, Home, Calendar, User, Clock, ChevronRight, LogOut, FileText, MapPin, Heart, Share2, BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast as sonnerToast } from "sonner";
import { format, parseISO, isValid, differenceInDays, startOfDay } from "date-fns";

interface Quote {
  id: string;
  productType: string;
  details: string;
  price: string;
  serviceDate: string;
  serviceTime: string;
  status: string;
  artistId: string;
  artistName?: string | null;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
}

const CARD_COLORS = [
  'bg-purple-300', 'bg-pink-200', 'bg-yellow-200', 'bg-orange-200', 'bg-green-200'
];

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = nextUseSearchParams();
  const view = searchParams.get('view') || 'home';
  
  const [user, setUser] = useState<UserData | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, quotesRes, csrfRes] = await Promise.all([
          fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/quotes/customer`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' })
        ]);

        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        if (userData.user.role !== 'customer') {
          router.push(userData.user.role === 'artist' ? '/artist' : '/');
          return;
        }
        setUser(userData.user);

        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          setQuotes(quotesData);
        }

        if (csrfRes.ok) {
          const csrfData = await csrfRes.json();
          setCsrfToken(csrfData.csrfToken);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    if (!csrfToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'CSRF-Token': csrfToken }
      });
      if (res.ok) {
        router.push('/login');
      }
    } catch (error) {
      sonnerToast.error("Logout failed");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDaysUntil = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;
    const days = differenceInDays(startOfDay(date), startOfDay(new Date()));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Overdue';
    return `In ${days} days`;
  };

  const upcomingQuotes = quotes
    .filter(q => ['Accepted', 'Booked'].includes(q.status))
    .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())
    .slice(0, 5);

  const filteredQuotes = quotes.filter(q => 
    q.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.artistName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0] || 'Customer'}</h1>
          </div>
          <button className="relative p-2">
            <Bell className="h-6 w-6 text-[#C40F5A]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#C40F5A] rounded-full"></span>
          </button>
        </div>
        <div className="relative mb-6">
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bookings or artists"
            className="bg-[#2a2a2a] border-none text-white pl-4 pr-12 h-12 rounded-xl" />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#C40F5A] p-2 rounded-lg">
            <Search className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {view === 'home' && (
        <>
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">My Bookings</h2>
              <Link href="/customer?view=bookings" className="text-gray-400 text-sm border border-gray-600 px-3 py-1 rounded-full">Show All</Link>
            </div>
            {upcomingQuotes.length === 0 ? (
              <div className="bg-[#2a2a2a] rounded-2xl p-6 text-center">
                <p className="text-gray-400">No upcoming bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingQuotes[0] && (
                  <Link href={`/quote/${upcomingQuotes[0].id}`} className={`${CARD_COLORS[0]} rounded-2xl p-4 block text-black`}>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="bg-black/20 text-xs px-2 py-1 rounded-full">{getDaysUntil(upcomingQuotes[0].serviceDate)}</span>
                      <span className="bg-black/20 text-xs px-2 py-1 rounded-full">{upcomingQuotes[0].status === 'Booked' ? '$ Fully Paid' : '$ Pending'}</span>
                      <span className="bg-black/20 text-xs px-2 py-1 rounded-full flex items-center gap-1"><Clock className="h-3 w-3" /> 2 hrs</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{upcomingQuotes[0].productType}</h3>
                    <p className="text-sm opacity-80 flex items-center gap-1"><MapPin className="h-3 w-3" />{upcomingQuotes[0].artistName || 'Artist'} | {upcomingQuotes[0].serviceTime}</p>
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {upcomingQuotes.slice(1, 3).map((quote, idx) => (
                    <Link key={quote.id} href={`/quote/${quote.id}`} className={`${CARD_COLORS[idx + 1]} rounded-2xl p-3 block text-black`}>
                      <div className="flex gap-1 mb-2 flex-wrap">
                        <span className="bg-black/20 text-xs px-2 py-0.5 rounded-full">{getDaysUntil(quote.serviceDate)}</span>
                        <span className="bg-black/20 text-xs px-2 py-0.5 rounded-full">$ {quote.status}</span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{quote.productType}</h3>
                      <p className="text-xs opacity-80 truncate">{quote.artistName || 'Artist'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-4">
            <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
            <div className="space-y-3">
              {quotes.slice(0, 5).map(quote => (
                <Link key={quote.id} href={`/quote/${quote.id}`} className="flex items-center gap-3 bg-[#2a2a2a] rounded-xl p-3">
                  <div className="w-10 h-10 bg-[#C40F5A]/20 rounded-full flex items-center justify-center"><FileText className="h-5 w-5 text-[#C40F5A]" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{quote.productType}</p>
                    <p className="text-gray-400 text-sm">{quote.artistName} • ₹{quote.price}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </Link>
              ))}
              {quotes.length === 0 && <p className="text-gray-500 text-center py-4">No bookings yet</p>}
            </div>
          </div>
        </>
      )}

      {view === 'bookings' && (
        <div className="px-4">
          <div className="flex gap-2 mb-4">
            <button className="flex-1 bg-[#C40F5A] text-white py-2 rounded-full font-medium text-sm">Bookings</button>
            <button className="flex-1 bg-[#2a2a2a] text-gray-400 py-2 rounded-full text-sm">Calendar</button>
          </div>
          <div className="space-y-3">
            {filteredQuotes.map((quote, idx) => (
              <Link key={quote.id} href={`/quote/${quote.id}`} className={`${CARD_COLORS[idx % CARD_COLORS.length]} rounded-2xl p-4 block text-black`}>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className="bg-black/20 text-xs px-2 py-0.5 rounded-full">{getDaysUntil(quote.serviceDate)}</span>
                  <span className="bg-black/20 text-xs px-2 py-0.5 rounded-full">$ {quote.status}</span>
                  <span className="bg-black/20 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="h-3 w-3" /> 2 hrs</span>
                </div>
                <p className="text-xs opacity-70 mb-1">Booking # {quote.id.slice(0, 8)}</p>
                <h3 className="font-bold">{quote.productType}</h3>
                <p className="text-sm opacity-80">{quote.artistName || 'Artist'} | {quote.serviceTime}</p>
              </Link>
            ))}
            {filteredQuotes.length === 0 && <p className="text-gray-500 text-center py-8">No bookings found</p>}
          </div>
        </div>
      )}

      {view === 'analytics' && (
        <div className="px-4">
          <h2 className="text-xl font-bold mb-6">My Analytics</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#2a2a2a] rounded-2xl p-4">
              <p className="text-gray-400 text-sm">Total Bookings</p>
              <p className="text-2xl font-bold text-white">{quotes.length}</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-2xl p-4">
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">
                {quotes.filter(q => {
                  const date = parseISO(q.serviceDate);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-2xl p-4">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-500">
                {quotes.filter(q => q.status === 'Booked').length}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-2xl p-4">
              <p className="text-gray-400 text-sm">Upcoming</p>
              <p className="text-2xl font-bold text-yellow-500">
                {quotes.filter(q => q.status === 'Accepted').length}
              </p>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-4">Favorite Services</h3>
            <div className="space-y-3">
              {Object.entries(
                quotes.reduce((acc, quote) => {
                  acc[quote.productType] = (acc[quote.productType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).slice(0, 5).map(([service, count]) => (
                <div key={service} className="flex justify-between items-center">
                  <span className="text-white">{service}</span>
                  <span className="text-[#C40F5A] font-semibold">{count}</span>
                </div>
              ))}
              {quotes.length === 0 && (
                <p className="text-gray-500 text-center py-4">No bookings yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'profile' && (
        <div className="px-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.name || 'Customer'}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="bg-[#C40F5A] text-white text-xl">{user?.name?.[0] || 'C'}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex justify-around mb-6 py-4 border-y border-gray-800 mt-4">
            <button className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center"><Heart className="h-5 w-5 text-gray-400" /></div>
              <span className="text-xs text-gray-400">Favorites</span>
            </button>
            <button className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center"><Calendar className="h-5 w-5 text-gray-400" /></div>
              <span className="text-xs text-gray-400">My Events</span>
            </button>
            <button className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center"><Share2 className="h-5 w-5 text-gray-400" /></div>
              <span className="text-xs text-gray-400">Share Profile</span>
            </button>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Account Settings', href: '/profile/customer/settings', dot: true },
              { label: 'Payment Methods', href: '/profile/customer/payment' },
              { label: 'Booking History', href: '/customer?view=bookings' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms and Conditions', href: '/terms' },
            ].map(item => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between py-4 border-b border-gray-800">
                <span className="text-white">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.dot && <span className="w-2 h-2 bg-[#C40F5A] rounded-full"></span>}
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </div>
              </Link>
            ))}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 mt-6 py-4"><LogOut className="h-5 w-5" /> Logout</button>
          <p className="text-center text-gray-600 text-sm mt-8">Release v1.0.0</p>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 h-16">
        <div className="flex justify-around items-center h-full">
          <Link href="/customer?view=home" className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-[#C40F5A]' : 'text-gray-500'}`}><Home className="h-5 w-5" /><span className="text-xs">Home</span></Link>
          <Link href="/customer?view=bookings" className={`flex flex-col items-center gap-1 ${view === 'bookings' ? 'text-[#C40F5A]' : 'text-gray-500'}`}><Calendar className="h-5 w-5" /><span className="text-xs">Bookings</span></Link>
          <Link href="/customer?view=analytics" className={`flex flex-col items-center gap-1 ${view === 'analytics' ? 'text-[#C40F5A]' : 'text-gray-500'}`}><BarChart3 className="h-5 w-5" /><span className="text-xs">Analytics</span></Link>
          <Link href="/customer?view=profile" className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-[#C40F5A]' : 'text-gray-500'}`}><User className="h-5 w-5" /><span className="text-xs">Profile</span></Link>
        </div>
      </nav>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div></div>}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
