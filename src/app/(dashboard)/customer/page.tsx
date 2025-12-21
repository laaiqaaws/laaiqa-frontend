"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/types/user';
import {
  Search, Home, Calendar, User, ChevronRight, LogOut, Heart, Share2, BarChart3
} from "lucide-react";
import BookingsView from "@/components/bookings/BookingsView";
import { BellIcon } from "@/components/icons/bell-filled";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast as sonnerToast } from "sonner";
import { format, parseISO, isValid, differenceInDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

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

// Session storage keys for quotes cache
const QUOTES_CACHE_KEY = 'laaiqa_customer_quotes';
const QUOTES_CACHE_EXPIRY_KEY = 'laaiqa_customer_quotes_expiry';
const QUOTES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pastel colors matching BookingsView - brand colors
const CARD_COLORS = ['bg-[#CD8FDE]', 'bg-[#FACCB2]', 'bg-[#F9B6D2]', 'bg-[#B5EAD7]', 'bg-[#FFDAC1]'];

function CalendarEmptyIcon() {
  return (
    <div className="w-20 h-20 bg-[#F07229] rounded-xl flex flex-col items-center justify-center shadow-lg">
      <div className="flex gap-1 mb-1">
        <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
      </div>
      <span className="text-3xl font-bold text-white">31</span>
    </div>
  );
}

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = nextUseSearchParams();
  const view = searchParams.get('view') || 'home';
  const { user, isLoading: authLoading, logout } = useAuth();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationViewed, setNotificationViewed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Load quotes from cache or fetch
  const loadQuotes = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      try {
        const cachedExpiry = sessionStorage.getItem(QUOTES_CACHE_EXPIRY_KEY);
        if (cachedExpiry && Date.now() < parseInt(cachedExpiry, 10)) {
          const cached = sessionStorage.getItem(QUOTES_CACHE_KEY);
          if (cached) {
            setQuotes(JSON.parse(cached));
            setQuotesLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/quotes/customer`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
        try {
          sessionStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify(data));
          sessionStorage.setItem(QUOTES_CACHE_EXPIRY_KEY, (Date.now() + QUOTES_CACHE_DURATION).toString());
        } catch { /* ignore */ }
      }
    } catch (e) { console.error(e); } finally { setQuotesLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'customer') { 
        router.replace(user.role === 'artist' ? '/artist' : user.role === 'admin' ? '/admin' : '/signup'); 
        return; 
      }
      // Check if profile is complete - if not, redirect to profile completion
      // Only check on initial load, not on every render
      if (user.profileComplete === false) {
        router.replace('/profile/customer');
        return;
      }
      loadQuotes();
    } else if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router, loadQuotes]);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      sessionStorage.removeItem(QUOTES_CACHE_KEY);
      sessionStorage.removeItem(QUOTES_CACHE_EXPIRY_KEY);
      window.location.href = '/login';
    } else { setTimeout(() => sonnerToast.error("Logout failed"), 100); }
  };

  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; };
  const getDaysUntil = (d: string) => { const date = parseISO(d); if (!isValid(date)) return null; const days = differenceInDays(startOfDay(date), startOfDay(new Date())); return days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 0 ? 'Overdue' : `In ${days} Days`; };
  
  // Filter quotes by search query
  const filterBySearch = (quotesToFilter: Quote[]) => {
    if (!searchQuery.trim()) return quotesToFilter;
    const query = searchQuery.toLowerCase();
    return quotesToFilter.filter(q => {
      if (q.productType?.toLowerCase().includes(query)) return true;
      if (q.artistName?.toLowerCase().includes(query)) return true;
      if (q.status?.toLowerCase().includes(query)) return true;
      try { 
        const dateStr = format(parseISO(q.serviceDate), 'dd/MM/yyyy'); 
        if (dateStr.includes(query) || q.serviceDate.includes(query)) return true;
        const dateStr2 = format(parseISO(q.serviceDate), 'dd MMM yyyy');
        if (dateStr2.toLowerCase().includes(query)) return true;
      } catch { /* ignore */ }
      return false;
    });
  };
  
  // Group quotes by status for proper display - apply search filter
  const activeQuotes = filterBySearch(quotes.filter(q => ['Accepted', 'Booked'].includes(q.status))).sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
  const upcomingQuotes = activeQuotes.slice(0, 5);


  if (authLoading || quotesLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div></div>;

  const pv = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="w-full max-w-3xl mx-auto">
      {/* Header - only on home view */}
      {view === 'home' && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">{getGreeting()},</p>
              <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0] || 'Customer'}</h1>
            </div>
            {view === 'home' && (
              <button 
                className="relative p-2 hover:bg-gray-800 rounded-full transition-colors" 
                onClick={() => {
                  // Toggle notification - if open, dismiss all toasts
                  if (notificationOpen) {
                    sonnerToast.dismiss();
                    setNotificationOpen(false);
                    return;
                  }
                  
                  // Mark as viewed and open
                  setNotificationViewed(true);
                  setNotificationOpen(true);
                  
                  const acceptedQuotesList = quotes.filter(q => q.status === 'Accepted');
                  const bookedQuotesList = quotes.filter(q => q.status === 'Booked');
                  const total = acceptedQuotesList.length + bookedQuotesList.length;
                  
                  if (total === 0) {
                    sonnerToast.info('All caught up! ✨', { 
                      description: 'No active bookings at the moment.',
                      onDismiss: () => setNotificationOpen(false),
                      onAutoClose: () => setNotificationOpen(false),
                    });
                  } else {
                    sonnerToast('Booking Summary', {
                      description: (
                        <div className="space-y-1 mt-1 w-full">
                          {acceptedQuotesList.length > 0 && (
                            <div className="flex items-center justify-between py-1.5 border-b border-gray-700/50">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></span>
                                <span className="text-blue-400 font-medium">{acceptedQuotesList.length} Awaiting Pay</span>
                              </div>
                              <span className="text-gray-400 text-xs">₹{acceptedQuotesList[0]?.price}</span>
                            </div>
                          )}
                          {bookedQuotesList.length > 0 && (
                            <div className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></span>
                                <span className="text-green-400 font-medium">{bookedQuotesList.length} Upcoming</span>
                              </div>
                              <span className="text-gray-400 text-xs">{bookedQuotesList[0]?.serviceDate ? format(parseISO(bookedQuotesList[0].serviceDate), 'dd MMM') : ''}</span>
                            </div>
                          )}
                        </div>
                      ),
                      onDismiss: () => setNotificationOpen(false),
                      onAutoClose: () => setNotificationOpen(false),
                    });
                  }
                }}
              >
                <BellIcon className="h-6 w-6 text-white" />
                {!notificationViewed && quotes.filter(q => ['Accepted', 'Booked'].includes(q.status)).length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EE2377] rounded-full animate-pulse"></span>
                )}
              </button>
            )}
          </div>
          <div className="relative mb-6">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search bookings or artists" className="w-full bg-[#1a1a1a] border border-[#333] text-white pl-4 pr-12 h-10 rounded-lg focus:border-[#C40F5A] focus:outline-none transition-colors" />
            <button className="absolute right-[6px] top-[6px] bg-[#C40F5A] w-7 h-7 rounded flex items-center justify-center"><Search className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" variants={pv} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
            <div className="px-4 mb-6">
              <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-semibold">My Bookings</h2>{upcomingQuotes.length > 0 && <Link href="/customer?view=bookings" className="text-white text-sm border-2 border-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">Show All</Link>}</div>
              {upcomingQuotes.length === 0 ? (
                <div className="border border-[#C40F5A]/30 rounded-2xl p-8 text-center"><div className="flex justify-center mb-4"><CalendarEmptyIcon /></div><p className="text-gray-300">Looks Like you dont have any bookings yet.</p></div>
              ) : (
                <div className="space-y-3">
                  {upcomingQuotes[0] && <Link href={`/quote/${upcomingQuotes[0].id}`} className={`${CARD_COLORS[0]} rounded-2xl p-4 block text-black transition-transform active:scale-[0.98]`}><div className="flex gap-2 mb-3 flex-wrap"><span className="bg-black/80 text-white text-xs px-3 py-1 rounded-full font-medium">{getDaysUntil(upcomingQuotes[0].serviceDate)}</span><span className="border border-black/30 text-xs px-3 py-1 rounded-full">{upcomingQuotes[0].status === 'Booked' ? '$ Fully Paid' : '$ Pending'}</span></div><h3 className="font-bold text-xl mb-2">{upcomingQuotes[0].productType}</h3><p className="text-sm opacity-80">{upcomingQuotes[0].artistName || 'Artist'} | {upcomingQuotes[0].serviceTime}</p></Link>}
                  {upcomingQuotes.length > 1 && <div className="grid grid-cols-2 gap-3">{upcomingQuotes.slice(1, 3).map((q, i) => <Link key={q.id} href={`/quote/${q.id}`} className={`${CARD_COLORS[i + 1]} rounded-2xl p-3 block text-black transition-transform active:scale-[0.98]`}><div className="flex gap-1 mb-2 flex-wrap"><span className="bg-black/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">{getDaysUntil(q.serviceDate)}</span><span className="border border-black/30 text-xs px-2 py-0.5 rounded-full">$ {q.status}</span></div><h3 className="font-bold text-sm mb-1 line-clamp-2">{q.productType}</h3><p className="text-xs opacity-80 truncate">{q.artistName || 'Artist'}</p></Link>)}</div>}
                </div>
              )}
            </div>

          </motion.div>
        )}
        {view === 'bookings' && (
          <motion.div key="bookings" variants={pv} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="px-4 pt-4">
            <BookingsView quotes={quotes} userRole="customer" />
          </motion.div>
        )}
        {view === 'analytics' && (
          <motion.div key="analytics" variants={pv} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="px-4 pt-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black rounded-2xl p-4 border border-gray-800"><p className="text-gray-400 text-sm">Total Bookings</p><p className="text-2xl font-bold text-white">{quotes.length}</p></div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800"><p className="text-gray-400 text-sm">This Month</p><p className="text-2xl font-bold text-white">{quotes.filter(q => { const d = parseISO(q.serviceDate); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length}</p></div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800"><p className="text-gray-400 text-sm">Completed</p><p className="text-2xl font-bold text-[#1FC16B]">{quotes.filter(q => q.status === 'Completed').length}</p></div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800"><p className="text-gray-400 text-sm">Active</p><p className="text-2xl font-bold text-[#F07229]">{quotes.filter(q => ['Accepted', 'Booked'].includes(q.status)).length}</p></div>
            </div>
            <div className="bg-black rounded-2xl p-4 border border-gray-800"><h3 className="text-white font-semibold mb-4">Favorite Services</h3><div className="space-y-3">{Object.entries(quotes.reduce((a, q) => { a[q.productType] = (a[q.productType] || 0) + 1; return a; }, {} as Record<string, number>)).slice(0, 5).map(([s, c]) => <div key={s} className="flex justify-between items-center"><span className="text-white">{s}</span><span className="text-[#C40F5A] font-semibold">{c}</span></div>)}{quotes.length === 0 && <p className="text-gray-500 text-center py-4">No bookings yet</p>}</div></div>
          </motion.div>
        )}
        {view === 'profile' && (
          <motion.div key="profile" variants={pv} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="px-4">
            {/* Profile Header - Name left, Avatar right */}
            <div className="flex items-center justify-between py-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user?.name || 'Customer'}</h2>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                {user?.phone && <p className="text-gray-500 text-sm">+91 {user.phone}</p>}
              </div>
              <Avatar className="h-16 w-16">
                {user?.image && user.image.startsWith('http') && <AvatarImage src={user.image} />}
                <AvatarFallback className="bg-[#C40F5A] text-white text-xl">{user?.name?.[0] || 'C'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex justify-around mb-6 py-4"><button className="flex flex-col items-center gap-2 flex-1"><Heart className="h-6 w-6 text-white" /><span className="text-xs text-white">Favorites</span></button><div className="w-px bg-[#C40F5A]/30"></div><button className="flex flex-col items-center gap-2 flex-1"><Calendar className="h-6 w-6 text-white" /><span className="text-xs text-white">My Events</span></button><div className="w-px bg-[#C40F5A]/30"></div><button className="flex flex-col items-center gap-2 flex-1"><Share2 className="h-6 w-6 text-white" /><span className="text-xs text-white">Share Profile</span></button></div>
            <div className="space-y-1">
              <Link href="/profile/customer/settings" className="flex items-center justify-between py-4 border-b border-gray-800 w-full">
                <span className="text-white">Account Settings</span>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </Link>
              {[{ label: 'Payment Methods' }, { label: 'Booking History', href: '/customer?view=bookings' }, { label: 'Disputes', href: '/customer/disputes' }, { label: 'Privacy Policy' }, { label: 'Terms and Conditions' }].map(i => i.href ? <Link key={i.label} href={i.href} className="flex items-center justify-between py-4 border-b border-gray-800"><span className="text-white">{i.label}</span><ChevronRight className="h-5 w-5 text-gray-500" /></Link> : <button key={i.label} onClick={() => sonnerToast.info('Coming soon!')} className="flex items-center justify-between py-4 border-b border-gray-800 w-full text-left"><span className="text-white">{i.label}</span><ChevronRight className="h-5 w-5 text-gray-500" /></button>)}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 mt-6 py-4"><LogOut className="h-5 w-5" /> Logout</button>

          </motion.div>
        )}
      </AnimatePresence>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 h-16 z-30">
        <div className="flex justify-around items-center h-full max-w-3xl mx-auto">
          <Link href="/customer?view=home" className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'home' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <Home className="h-6 w-6" strokeWidth={view === 'home' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Home</span>
            {view === 'home' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
          <Link href="/customer?view=bookings" className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'bookings' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <Calendar className="h-6 w-6" strokeWidth={view === 'bookings' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Bookings</span>
            {view === 'bookings' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
          <Link href="/customer?view=analytics" className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'analytics' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <BarChart3 className="h-6 w-6" strokeWidth={view === 'analytics' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Analytics</span>
            {view === 'analytics' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
          <Link href="/customer?view=profile" className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'profile' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <User className="h-6 w-6" strokeWidth={view === 'profile' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Profile</span>
            {view === 'profile' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div></div>}><CustomerDashboardContent /></Suspense>;
}
