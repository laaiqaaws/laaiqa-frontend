"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/types/user';
import {
  Search, Plus, Home, Calendar, User,
  ChevronRight, LogOut, FileText, Share2, BarChart3, Camera, Image as ImageIcon, Sparkles
} from "lucide-react";
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

const CARD_COLORS = [
  'bg-pink-200', 'bg-orange-200', 'bg-purple-300', 'bg-yellow-200', 'bg-green-200'
];

// Calendar icon component for empty state
function CalendarEmptyIcon() {
  return (
    <div className="w-20 h-20 bg-orange-400 rounded-xl flex flex-col items-center justify-center shadow-lg">
      <div className="flex gap-1 mb-1">
        <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
      </div>
      <span className="text-3xl font-bold text-white">31</span>
    </div>
  );
}

// Calendar view component
function CalendarView({ quotes }: { quotes: Quote[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const bookingsByDate = quotes.reduce((acc, quote) => {
    const dateKey = format(parseISO(quote.serviceDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(quote);
    return acc;
  }, {} as Record<string, Quote[]>);

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    const hasBooking = bookingsByDate[dateKey]?.length > 0;
    const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
    
    days.push(
      <div 
        key={day} 
        className={`h-10 flex items-center justify-center rounded-lg text-sm relative
          ${isToday ? 'bg-[#C40F5A] text-white font-bold' : 'text-gray-300'}
          ${hasBooking && !isToday ? 'bg-[#C40F5A]/20' : ''}
        `}
      >
        {day}
        {hasBooking && (
          <span className="absolute bottom-1 w-1 h-1 bg-[#C40F5A] rounded-full"></span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="text-gray-400 hover:text-white p-2"
        >
          ←
        </button>
        <h3 className="text-white font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="text-gray-400 hover:text-white p-2"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      {Object.keys(bookingsByDate).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Bookings this month:</p>
          <div className="space-y-2">
            {Object.entries(bookingsByDate)
              .filter(([date]) => date.startsWith(format(currentMonth, 'yyyy-MM')))
              .slice(0, 3)
              .map(([date, bookings]) => (
                <div key={date} className="flex items-center gap-2 text-sm">
                  <span className="text-[#C40F5A]">{format(parseISO(date), 'dd')}</span>
                  <span className="text-gray-300">{bookings[0].productType}</span>
                </div>
              ))}
          </div>
        </div>
      )}
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
  const [bookingTab, setBookingTab] = useState<'list' | 'calendar'>('list');

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
        router.push(user.role === 'customer' ? '/customer' : '/');
        return;
      }
      loadQuotes();
    } else if (!authLoading && !user) {
      router.push('/login');
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

  const upcomingQuotes = quotes
    .filter(q => ['Pending', 'Accepted', 'Booked'].includes(q.status))
    .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())
    .slice(0, 5);

  const filteredQuotes = quotes.filter(q => 
    q.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0] || 'Artist'}</h1>
          </div>
          <button 
            className="relative p-2"
            onClick={() => {
              const pendingCount = quotes.filter(q => q.status === 'Pending').length;
              const acceptedCount = quotes.filter(q => q.status === 'Accepted').length;
              const bookedCount = quotes.filter(q => q.status === 'Booked').length;
              
              if (pendingCount === 0 && acceptedCount === 0 && bookedCount === 0) {
                sonnerToast.info('No new notifications');
              } else {
                const messages = [];
                if (pendingCount > 0) messages.push(`${pendingCount} pending quote${pendingCount > 1 ? 's' : ''}`);
                if (acceptedCount > 0) messages.push(`${acceptedCount} accepted (awaiting payment)`);
                if (bookedCount > 0) messages.push(`${bookedCount} booked`);
                sonnerToast.success(`Activity: ${messages.join(', ')}`);
              }
            }}
          >
            <BellIcon className="h-6 w-6 text-white" />
            {quotes.filter(q => ['Pending', 'Accepted', 'Booked'].includes(q.status)).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#C40F5A] rounded-full"></span>
            )}
          </button>
        </div>

        {/* Search Bar - only on home and bookings */}
        {(view === 'home' || view === 'bookings') && (
          <div className="relative mb-6">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search event name or date"
              className="bg-[#1a1a1a] border-[#333] text-white pl-4 pr-12 h-12 rounded-xl focus:border-[#C40F5A] transition-colors"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#C40F5A] p-2 rounded-lg">
              <Search className="h-4 w-4 text-white" />
            </button>
          </div>
        )}
      </div>

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
                  <Link href="/artist?view=bookings" className="text-white text-sm border border-gray-600 px-4 py-1.5 rounded-full hover:bg-gray-800 transition-colors">
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
                    <Button className="bg-[#C40F5A] hover:bg-[#EE2377] px-8 py-3 rounded-xl text-white font-medium transition-all">
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

            {/* Recent Activity */}
            <div className="px-4">
              <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
              <div className="space-y-3">
                {quotes.slice(0, 4).map(quote => (
                  <Link key={quote.id} href={`/quote/${quote.id}`}
                    className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3 transition-colors hover:bg-[#222]">
                    <div className="w-10 h-10 bg-[#C40F5A]/20 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#C40F5A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{quote.productType}</p>
                      <p className="text-gray-400 text-xs">
                        {format(parseISO(quote.serviceDate), 'dd/MM/yyyy')} • ₹{quote.price}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </Link>
                ))}
                {quotes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
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
            className="px-4"
          >
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setBookingTab('list')}
                className={`flex-1 py-2.5 rounded-full font-medium text-sm transition-colors ${bookingTab === 'list' ? 'bg-[#C40F5A] text-white' : 'bg-[#1a1a1a] text-gray-400 border border-gray-700'}`}
              >
                Bookings
              </button>
              <button 
                onClick={() => setBookingTab('calendar')}
                className={`flex-1 py-2.5 rounded-full text-sm transition-colors ${bookingTab === 'calendar' ? 'bg-[#C40F5A] text-white' : 'bg-[#1a1a1a] text-gray-400 border border-gray-700'}`}
              >
                Calendar
              </button>
            </div>

            {bookingTab === 'list' ? (
              filteredQuotes.length === 0 ? (
                <div className="border border-[#C40F5A]/30 rounded-2xl p-8 text-center mt-4">
                  <div className="flex justify-center mb-4">
                    <CalendarEmptyIcon />
                  </div>
                  <p className="text-gray-300 mb-6">Looks Like you dont have any slots booked yet.</p>
                  <Link href="/artist/create-quote">
                    <Button className="bg-[#C40F5A] hover:bg-[#EE2377] px-8 py-3 rounded-xl text-white font-medium">
                      <Plus className="mr-2 h-5 w-5" /> Add First Booking
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuotes.map((quote, idx) => (
                    <Link key={quote.id} href={`/quote/${quote.id}`}
                      className={`${CARD_COLORS[idx % CARD_COLORS.length]} rounded-2xl p-4 block text-black transition-transform active:scale-[0.98]`}>
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <span className="bg-black/80 text-white text-xs px-3 py-1 rounded-full font-medium">
                          {getDaysUntil(quote.serviceDate)}
                        </span>
                        <span className="border border-black/30 text-xs px-3 py-1 rounded-full">
                          $ {quote.status}
                        </span>
                      </div>
                      <p className="text-xs opacity-70 mb-1">Booking # {quote.id.slice(0, 8)}</p>
                      <h3 className="font-bold text-lg">{quote.productType}</h3>
                      <p className="text-sm opacity-80">{quote.customerName || 'Customer'} | {quote.serviceTime}</p>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                <CalendarView quotes={filteredQuotes} />
              </div>
            )}
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
            className="px-4"
          >
            <h2 className="text-xl font-bold mb-6">Analytics</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{quotes.length}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {quotes.filter(q => {
                    const date = parseISO(q.serviceDate);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-500">
                  {quotes.filter(q => q.status === 'Completed').length}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {quotes.filter(q => q.status === 'Pending').length}
                </p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Popular Services</h3>
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
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
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
            {/* Profile Header */}
            <div className="flex flex-col items-center py-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {user?.image && <AvatarImage src={user.image} />}
                  <AvatarFallback className="bg-[#C40F5A] text-white text-2xl">
                    {user?.name?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 bg-[#C40F5A] p-2 rounded-full">
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>
              <h2 className="text-xl font-bold mt-4">{user?.name || 'Artist'}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              {user?.phone && <p className="text-gray-500 text-sm">+91 {user.phone}</p>}
            </div>

            {/* Send Booking Form Button */}
            <Button className="w-full h-14 bg-[#C40F5A] hover:bg-[#EE2377] rounded-2xl mb-4 flex items-center justify-center gap-2 transition-colors">
              <FileText className="h-5 w-5" /> Send Booking Form
            </Button>

            {/* Quick Actions */}
            <div className="flex justify-around mb-6 py-4 border-y border-[#C40F5A]/30">
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
              <Link href="/profile/artist?edit=true"
                className="flex items-center justify-between py-4 border-b border-gray-800 w-full">
                <span className="text-white">Account Settings</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#C40F5A] rounded-full"></span>
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </div>
              </Link>
              {[
                { label: 'Payment Settings', dot: true },
                { label: 'Transactions' },
                { label: 'Disputes' },
                { label: 'Privacy Policy' },
                { label: 'Terms and Conditions' },
              ].map(item => (
                <button key={item.label}
                  onClick={() => sonnerToast.info('Coming soon!')}
                  className="flex items-center justify-between py-4 border-b border-gray-800 w-full text-left">
                  <span className="text-white">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.dot && <span className="w-2 h-2 bg-[#C40F5A] rounded-full"></span>}
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>
                </button>
              ))}
            </div>

            <button onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 mt-6 py-4">
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB - New Booking */}
      {(view === 'home' || view === 'bookings') && quotes.length > 0 && (
        <Link href="/artist/create-quote"
          className="fixed bottom-24 right-4 bg-[#C40F5A] text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:bg-[#EE2377] transition-all active:scale-95 z-20">
          <Plus className="h-5 w-5" /> Add Booking
        </Link>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 h-16 z-30">
        <div className="flex justify-around items-center h-full">
          <Link href="/artist?view=home"
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-[#C40F5A]' : 'text-gray-500'}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/artist?view=bookings"
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'bookings' ? 'text-[#C40F5A]' : 'text-gray-500'}`}>
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Bookings</span>
          </Link>
          <Link href="/artist?view=analytics"
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'analytics' ? 'text-[#C40F5A]' : 'text-gray-500'}`}>
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Analytics</span>
          </Link>
          <Link href="/artist?view=profile"
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'profile' ? 'text-[#C40F5A]' : 'text-gray-500'}`}>
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
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
