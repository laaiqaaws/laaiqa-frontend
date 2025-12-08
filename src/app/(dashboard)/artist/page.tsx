"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/types/user';
import {
  Search, Plus, Home, Calendar, User,
  ChevronRight, LogOut, FileText, Share2, BarChart3, Image as ImageIcon, Sparkles
} from "lucide-react";
import BookingsView from "@/components/bookings/BookingsView";
import { BellIcon } from "@/components/icons/bell-filled";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  customerId: string | null;
  customerName?: string | null;
  createdAt: string;
}

// Session storage keys for quotes cache
const QUOTES_CACHE_KEY = 'laaiqa_artist_quotes';
const QUOTES_CACHE_EXPIRY_KEY = 'laaiqa_artist_quotes_expiry';
const QUOTES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pastel colors matching BookingsView - brand colors
const CARD_COLORS = [
  'bg-[#CD8FDE]', 'bg-[#FACCB2]', 'bg-[#F9B6D2]', 'bg-[#B5EAD7]', 'bg-[#FFDAC1]'
];

// Calendar icon component for empty state
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

function ArtistDashboardContent() {
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
    // Try cache first
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
      } catch { /* ignore cache errors */ }
    }

    // Fetch from server
    try {
      const res = await fetch(`${API_BASE_URL}/api/quotes/artist`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
        // Cache the quotes
        try {
          sessionStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify(data));
          sessionStorage.setItem(QUOTES_CACHE_EXPIRY_KEY, (Date.now() + QUOTES_CACHE_DURATION).toString());
        } catch { /* ignore cache errors */ }
      }
    } catch (e) {
      console.error('Error fetching quotes:', e);
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  useEffect(() => {
    // Redirect if not artist
    if (!authLoading && user) {
      if (user.role !== 'artist') {
        router.replace(user.role === 'customer' ? '/customer' : user.role === 'admin' ? '/admin' : '/signup');
        return;
      }
      // Check if profile is complete - if not, redirect to profile completion
      if (user.profileComplete === false) {
        router.replace('/profile/artist');
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
      // Clear quotes cache
      sessionStorage.removeItem(QUOTES_CACHE_KEY);
      sessionStorage.removeItem(QUOTES_CACHE_EXPIRY_KEY);
      window.location.href = '/login';
    } else {
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
    return `In ${days} Days`;
  };

  // Filter quotes by search query
  const filterBySearch = (quotesToFilter: Quote[]) => {
    if (!searchQuery.trim()) return quotesToFilter;
    const query = searchQuery.toLowerCase();
    return quotesToFilter.filter(q => {
      if (q.productType?.toLowerCase().includes(query)) return true;
      if (q.customerName?.toLowerCase().includes(query)) return true;
      if (q.status?.toLowerCase().includes(query)) return true;
      if (q.details?.toLowerCase().includes(query)) return true;
      try {
        const dateStr = format(parseISO(q.serviceDate), 'dd/MM/yyyy');
        if (dateStr.includes(query) || q.serviceDate.includes(query)) return true;
        const dateStr2 = format(parseISO(q.serviceDate), 'dd MMM yyyy');
        if (dateStr2.toLowerCase().includes(query)) return true;
      } catch { /* ignore */ }
      return false;
    });
  };

  // Group quotes by status
  const pendingQuotes = filterBySearch(quotes.filter(q => q.status === 'Pending')).sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
  const activeQuotes = filterBySearch(quotes.filter(q => ['Accepted', 'Booked'].includes(q.status))).sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
  
  const upcomingQuotes = [...pendingQuotes, ...activeQuotes].slice(0, 5);

  if (authLoading || quotesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="w-full max-w-3xl mx-auto">
      {/* Header - only on home view */}
      {view === 'home' && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">{getGreeting()},</p>
              <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0] || 'Artist'}</h1>
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
                  
                  const pendingQuotesList = quotes.filter(q => q.status === 'Pending');
                  const acceptedQuotesList = quotes.filter(q => q.status === 'Accepted');
                  const bookedQuotesList = quotes.filter(q => q.status === 'Booked');
                  const total = pendingQuotesList.length + acceptedQuotesList.length + bookedQuotesList.length;
                  
                  if (total === 0) {
                    sonnerToast.info('All caught up! ✨', {
                      description: 'No pending bookings at the moment.',
                      onDismiss: () => setNotificationOpen(false),
                      onAutoClose: () => setNotificationOpen(false),
                    });
                  } else {
                    sonnerToast('Booking Summary', {
                      description: (
                        <div className="space-y-1 mt-1 w-full">
                          {pendingQuotesList.length > 0 && (
                            <div className="flex items-center justify-between py-1.5 border-b border-gray-700/50">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></span>
                                <span className="text-yellow-400 font-medium">{pendingQuotesList.length} Pending</span>
                              </div>
                              <span className="text-gray-400 text-xs truncate max-w-[120px]">{pendingQuotesList[0]?.productType}</span>
                            </div>
                          )}
                          {acceptedQuotesList.length > 0 && (
                            <div className="flex items-center justify-between py-1.5 border-b border-gray-700/50">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                                <span className="text-blue-400 font-medium">{acceptedQuotesList.length} Awaiting Pay</span>
                              </div>
                              <span className="text-gray-400 text-xs">₹{acceptedQuotesList[0]?.price}</span>
                            </div>
                          )}
                          {bookedQuotesList.length > 0 && (
                            <div className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></span>
                                <span className="text-green-400 font-medium">{bookedQuotesList.length} Confirmed</span>
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
                {!notificationViewed && quotes.filter(q => ['Pending', 'Accepted', 'Booked'].includes(q.status)).length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EE2377] rounded-full animate-pulse"></span>
                )}
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search event name or date"
              className="w-full bg-[#1a1a1a] border border-[#333] text-white pl-4 pr-12 h-12 rounded-xl focus:border-[#C40F5A] focus:outline-none transition-colors"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#C40F5A] p-2 rounded-lg">
              <Search className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Upcoming Bookings */}
            <div className="px-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
                {upcomingQuotes.length > 0 && (
                  <Link href="/artist?view=bookings" className="text-white text-sm border-2 border-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                    Show All
                  </Link>
                )}
              </div>

              {upcomingQuotes.length === 0 ? (
                <div className="border border-[#C40F5A]/30 rounded-2xl p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <CalendarEmptyIcon />
                  </div>
                  <p className="text-gray-300 mb-6">Looks Like you dont have any slots booked yet.</p>
                  <Link href="/artist/create-quote">
                    <Button className="bg-[#EE2377] hover:bg-[#C40F5A] px-10 py-4 h-14 rounded-xl text-white font-medium transition-all">
                      <Plus className="mr-2 h-5 w-5" /> Add First Booking
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Featured Card */}
                  {upcomingQuotes[0] && (
                    <Link href={`/quote/${upcomingQuotes[0].id}`} className={`${CARD_COLORS[0]} rounded-2xl p-4 text-black block transition-transform active:scale-[0.98]`}>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <span className="bg-black/80 text-white text-xs px-3 py-1 rounded-full font-medium">
                          {getDaysUntil(upcomingQuotes[0].serviceDate)}
                        </span>
                        <span className="border border-black/30 text-black text-xs px-3 py-1 rounded-full">
                          {upcomingQuotes[0].status === 'Booked' ? '$ Fully Paid' : '$ ' + upcomingQuotes[0].status}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl mb-2">{upcomingQuotes[0].productType}</h3>
                      <p className="text-sm opacity-80">
                        {upcomingQuotes[0].customerName || 'Customer'} | {upcomingQuotes[0].serviceTime}
                      </p>
                    </Link>
                  )}

                  {/* Smaller Cards */}
                  {upcomingQuotes.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      {upcomingQuotes.slice(1, 3).map((quote, idx) => (
                        <Link key={quote.id} href={`/quote/${quote.id}`} className={`${CARD_COLORS[idx + 1]} rounded-2xl p-3 text-black block transition-transform active:scale-[0.98]`}>
                          <div className="flex gap-1 mb-2 flex-wrap">
                            <span className="bg-black/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              {getDaysUntil(quote.serviceDate)}
                            </span>
                            <span className="border border-black/30 text-xs px-2 py-0.5 rounded-full">
                              $ {quote.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm mb-1 line-clamp-2">{quote.productType}</h3>
                          <p className="text-xs opacity-80 truncate">{quote.customerName || 'Pending'}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </motion.div>
        )}


        {view === 'bookings' && (
          <motion.div
            key="bookings"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="px-4 pt-4"
          >
            <BookingsView quotes={quotes} userRole="artist" createQuoteLink="/artist/create-quote" />
          </motion.div>
        )}

        {view === 'analytics' && (
          <motion.div
            key="analytics"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="px-4 pt-4"
          >
            
            {/* Revenue Card */}
            <div className="bg-gradient-to-r from-[#C40F5A] to-[#EE2377] rounded-2xl p-5 mb-6">
              <p className="text-white/80 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-white">
                ₹{quotes.filter(q => ['Booked', 'Completed'].includes(q.status))
                  .reduce((sum, q) => sum + parseFloat(q.price || '0'), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-white/60 text-xs mt-2">
                From {quotes.filter(q => ['Booked', 'Completed'].includes(q.status)).length} paid bookings
              </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-black rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{quotes.length}</p>
              </div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {quotes.filter(q => {
                    const date = parseISO(q.serviceDate);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs">Completed</p>
                <p className="text-2xl font-bold text-green-500">
                  {quotes.filter(q => q.status === 'Completed').length}
                </p>
              </div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {quotes.filter(q => q.status === 'Pending').length}
                </p>
              </div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs">Booked</p>
                <p className="text-2xl font-bold text-blue-500">
                  {quotes.filter(q => q.status === 'Booked').length}
                </p>
              </div>
              <div className="bg-black rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs">Cancelled</p>
                <p className="text-2xl font-bold text-red-500">
                  {quotes.filter(q => q.status === 'Cancelled').length}
                </p>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-black rounded-2xl p-4 border border-gray-800 mb-6">
              <h3 className="text-white font-semibold mb-4">This Month's Revenue</h3>
              <p className="text-2xl font-bold text-[#C40F5A]">
                ₹{quotes.filter(q => {
                  const date = parseISO(q.serviceDate);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && 
                         date.getFullYear() === now.getFullYear() &&
                         ['Booked', 'Completed'].includes(q.status);
                }).reduce((sum, q) => sum + parseFloat(q.price || '0'), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                vs ₹{quotes.filter(q => {
                  const date = parseISO(q.serviceDate);
                  const now = new Date();
                  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  return date.getMonth() === lastMonth.getMonth() && 
                         date.getFullYear() === lastMonth.getFullYear() &&
                         ['Booked', 'Completed'].includes(q.status);
                }).reduce((sum, q) => sum + parseFloat(q.price || '0'), 0).toLocaleString('en-IN')} last month
              </p>
            </div>

            {/* Conversion Rate */}
            <div className="bg-black rounded-2xl p-4 border border-gray-800 mb-6">
              <h3 className="text-white font-semibold mb-3">Conversion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#C40F5A] to-[#EE2377] rounded-full"
                      style={{ 
                        width: `${quotes.length > 0 
                          ? Math.round((quotes.filter(q => ['Booked', 'Completed'].includes(q.status)).length / quotes.length) * 100) 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <span className="text-white font-bold">
                  {quotes.length > 0 
                    ? Math.round((quotes.filter(q => ['Booked', 'Completed'].includes(q.status)).length / quotes.length) * 100) 
                    : 0}%
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                {quotes.filter(q => ['Booked', 'Completed'].includes(q.status)).length} of {quotes.length} quotes converted
              </p>
            </div>

            {/* Popular Services */}
            <div className="bg-black rounded-2xl p-4 border border-gray-800 mb-6">
              <h3 className="text-white font-semibold mb-4">Popular Services</h3>
              <div className="space-y-3">
                {Object.entries(
                  quotes.reduce((acc, quote) => {
                    acc[quote.productType] = (acc[quote.productType] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([service, count], idx) => (
                  <div key={service} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#C40F5A]/20 text-[#C40F5A] text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-white flex-1 truncate">{service}</span>
                    <span className="text-[#C40F5A] font-semibold">{count}</span>
                  </div>
                ))}
                {quotes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </div>

            {/* Average Booking Value */}
            <div className="bg-black rounded-2xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Average Booking Value</h3>
              <p className="text-2xl font-bold text-white">
                ₹{quotes.length > 0 
                  ? Math.round(quotes.reduce((sum, q) => sum + parseFloat(q.price || '0'), 0) / quotes.length).toLocaleString('en-IN')
                  : 0}
              </p>
              <p className="text-gray-500 text-xs mt-1">Based on all bookings</p>
            </div>
          </motion.div>
        )}

        {view === 'profile' && (
          <motion.div
            key="profile"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="px-4"
          >
            {/* Profile Header - Name left, Avatar right */}
            <div className="flex items-center justify-between py-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user?.name || 'Artist'}</h2>
                {user?.companyName && <p className="text-gray-400 text-sm">{user.companyName}</p>}
                {user?.email && <p className="text-gray-500 text-sm">{user.email}</p>}
              </div>
              <Avatar className="h-16 w-16">
                {user?.image && user.image.startsWith('http') && <AvatarImage src={user.image} />}
                <AvatarFallback className="bg-[#C40F5A] text-white text-xl">
                  {user?.name?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Send Booking Form Button */}
            <Button className="w-full h-16 bg-[#EE2377] hover:bg-[#C40F5A] rounded-2xl mb-4 flex items-center justify-center gap-2 transition-colors">
              <FileText className="h-5 w-5" /> Send Booking Form
            </Button>

            {/* Quick Actions */}
            <div className="flex justify-around mb-6 py-4">
              <button className="flex flex-col items-center gap-2 flex-1">
                <ImageIcon className="h-6 w-6 text-white" />
                <span className="text-xs text-white">My Portfolio</span>
              </button>
              <div className="w-px bg-[#C40F5A]/30"></div>
              <button className="flex flex-col items-center gap-2 flex-1">
                <Sparkles className="h-6 w-6 text-white" />
                <span className="text-xs text-white">Creative Studio</span>
              </button>
              <div className="w-px bg-[#C40F5A]/30"></div>
              <button className="flex flex-col items-center gap-2 flex-1">
                <Share2 className="h-6 w-6 text-white" />
                <span className="text-xs text-white">Share Profile</span>
              </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <Link href="/profile/artist/settings"
                className="flex items-center justify-between py-4 border-b border-gray-800 w-full">
                <span className="text-white">Account Settings</span>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </Link>
              {[
                { label: 'Payment Settings' },
                { label: 'Transactions' },
                { label: 'Disputes', href: '/artist/disputes' },
                { label: 'Privacy Policy' },
                { label: 'Terms and Conditions' },
              ].map(item => (
                item.href ? (
                  <Link key={item.label} href={item.href}
                    className="flex items-center justify-between py-4 border-b border-gray-800 w-full">
                    <span className="text-white">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </Link>
                ) : (
                  <button key={item.label}
                    onClick={() => sonnerToast.info('Coming soon!')}
                    className="flex items-center justify-between py-4 border-b border-gray-800 w-full text-left">
                    <span className="text-white">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </button>
                )
              ))}
            </div>

            <button onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 mt-6 py-4">
              <LogOut className="h-5 w-5" /> Logout
            </button>
            

          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* FAB - New Booking - Only on home page */}
      {view === 'home' && (
        <div className="fixed bottom-24 left-0 right-0 z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto px-4 flex justify-end">
            <Link href="/artist/create-quote"
              className="bg-[#EE2377] text-white px-6 py-4 rounded-xl flex items-center gap-2 shadow-lg hover:bg-[#C40F5A] transition-all active:scale-95 pointer-events-auto">
              <Plus className="h-5 w-5" /> Add Booking
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 h-16 z-30">
        <div className="flex justify-around items-center h-full max-w-3xl mx-auto">
          <Link href="/artist?view=home"
            className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'home' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <Home className="h-6 w-6" strokeWidth={view === 'home' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Home</span>
            {view === 'home' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
          <Link href="/artist?view=bookings"
            className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'bookings' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <Calendar className="h-6 w-6" strokeWidth={view === 'bookings' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Bookings</span>
            {view === 'bookings' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
          <Link href="/artist?view=analytics"
            className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'analytics' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <BarChart3 className="h-6 w-6" strokeWidth={view === 'analytics' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Analytics</span>
            {view === 'analytics' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
          <Link href="/artist?view=profile"
            className={`flex flex-col items-center gap-1 transition-colors relative ${view === 'profile' ? 'text-[#EE2377]' : 'text-gray-500'}`}>
            <User className="h-6 w-6" strokeWidth={view === 'profile' ? 2.5 : 1.5} />
            <span className="text-xs font-medium">Profile</span>
            {view === 'profile' && <span className="absolute -bottom-1 w-8 h-1 bg-[#EE2377] rounded-full"></span>}
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function ArtistDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    }>
      <ArtistDashboardContent />
    </Suspense>
  );
}
