"use client";

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO, isValid, differenceInDays, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Clock, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Quote {
  id: string;
  productType: string;
  details: string;
  price: string;
  serviceDate: string;
  serviceTime: string;
  status: string;
  customerId?: string | null;
  customerName?: string | null;
  artistName?: string | null;
  createdAt: string;
}

interface BookingsViewProps {
  quotes: Quote[];
  userRole: 'artist' | 'customer';
  createQuoteLink?: string;
}

const CARD_COLORS = ['bg-[#FACCB2]', 'bg-[#F9B6D2]', 'bg-[#CD8FDE]', 'bg-[#A2D9CE]', 'bg-[#FFD8A9]'];

function getDaysUntil(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return '';
  const days = differenceInDays(startOfDay(date), startOfDay(new Date()));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `In ${days} Days`;
}

function getStatusBadge(status: string): { text: string; style: string } {
  switch (status) {
    case 'Booked': return { text: '$ Fully Paid', style: 'border border-black/30' };
    case 'Accepted': return { text: '$ Pending', style: 'border border-black/30' };
    case 'Pending': return { text: '$ Pending', style: 'border border-black/30' };
    case 'Completed': return { text: '✓ Completed', style: 'bg-purple-500/20 text-purple-600' };
    case 'Cancelled': return { text: '✗ Cancelled', style: 'bg-red-500/20 text-red-600' };
    default: return { text: status, style: 'border border-black/30' };
  }
}

function parseDetails(details: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = details.split(' | ');
  parts.forEach(part => {
    const [key, ...valueParts] = part.split(': ');
    if (key && valueParts.length > 0) {
      result[key.trim()] = valueParts.join(': ').trim();
    }
  });
  return result;
}

// Expandable Booking Card
function BookingCard({ quote, index, isExpanded, onToggle }: { 
  quote: Quote; 
  index: number; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const cardColor = CARD_COLORS[index % CARD_COLORS.length];
  const statusBadge = getStatusBadge(quote.status);
  const parsedDetails = parseDetails(quote.details);
  const isCancelled = quote.status === 'Cancelled';
  const isCompleted = quote.status === 'Completed';

  return (
    <div className="mb-3">
      {/* Card Header - Always visible */}
      <button
        onClick={onToggle}
        className={`w-full text-left rounded-2xl p-4 transition-all ${
          isCancelled ? 'bg-[#1a1a1a] opacity-60' : 
          isCompleted ? 'bg-[#2a2a2a]' : cardColor
        } ${isExpanded ? 'rounded-b-none' : ''}`}
      >
        <div className="flex gap-2 mb-2 flex-wrap">
          <span className="bg-black/80 text-white text-xs px-3 py-1 rounded-full font-medium">
            {getDaysUntil(quote.serviceDate)}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full ${statusBadge.style} ${isCancelled || isCompleted ? 'text-gray-400' : 'text-black'}`}>
            {statusBadge.text}
          </span>
          {quote.serviceTime && (
            <span className={`text-xs px-3 py-1 rounded-full border ${isCancelled || isCompleted ? 'border-gray-600 text-gray-400' : 'border-black/30 text-black'} flex items-center gap-1`}>
              <Clock className="h-3 w-3" /> {quote.serviceTime.includes('-') ? quote.serviceTime.split('-')[0].trim() : quote.serviceTime}
            </span>
          )}
        </div>
        <p className={`text-xs mb-1 ${isCancelled || isCompleted ? 'text-gray-500' : 'opacity-70'}`}>
          Booking # {quote.id.slice(0, 8).toUpperCase()}
        </p>
        <h3 className={`font-bold text-lg ${isCancelled ? 'line-through text-gray-400' : isCompleted ? 'text-white' : 'text-black'}`}>
          {quote.productType}
        </h3>
        <p className={`text-sm ${isCancelled || isCompleted ? 'text-gray-500' : 'opacity-80'}`}>
          {quote.customerName || quote.artistName || 'Customer'} | {quote.serviceTime}
        </p>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-black border border-gray-800 border-t-0 rounded-b-2xl p-4 space-y-4">
              {/* Basic Booking Info */}
              {(parsedDetails['Client'] || quote.customerName) && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Basic Booking Info</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-32">Client Name</span>
                      <span className="text-gray-300">: {parsedDetails['Client'] || quote.customerName || 'N/A'}</span>
                    </div>
                    {parsedDetails['Phone'] && (
                      <div className="flex">
                        <span className="text-gray-500 w-32">Contact Number</span>
                        <span className="text-gray-300">: {parsedDetails['Phone']}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Event & Schedule */}
              <div>
                <h4 className="text-white font-semibold mb-2">Event & Schedule</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-32">Function Type</span>
                    <span className="text-gray-300">: {quote.productType}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-32">Date</span>
                    <span className="text-gray-300">: {format(parseISO(quote.serviceDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-32">Time</span>
                    <span className="text-gray-300">: {quote.serviceTime}</span>
                  </div>
                </div>
              </div>

              {/* Location & Venue */}
              {(parsedDetails['Venue'] || parsedDetails['Address']) && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Location & Venue</h4>
                  <div className="space-y-1 text-sm">
                    {parsedDetails['Venue'] && (
                      <div className="flex">
                        <span className="text-gray-500 w-32">Venue Type</span>
                        <span className="text-gray-300">: {parsedDetails['Venue']}</span>
                      </div>
                    )}
                    {parsedDetails['Address'] && (
                      <div className="flex">
                        <span className="text-gray-500 w-32">Venue Address</span>
                        <span className="text-gray-300">: {parsedDetails['Address']}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Services Requested */}
              {(parsedDetails['Makeup'] || parsedDetails['Looks'] || parsedDetails['Notes']) && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Services Requested</h4>
                  <div className="space-y-1 text-sm">
                    {parsedDetails['Makeup'] && (
                      <div className="flex">
                        <span className="text-gray-500 w-32">Makeup Type</span>
                        <span className="text-gray-300">: {parsedDetails['Makeup']}</span>
                      </div>
                    )}
                    {parsedDetails['Looks'] && (
                      <div className="flex">
                        <span className="text-gray-500 w-32">Number of Looks</span>
                        <span className="text-gray-300">: {parsedDetails['Looks']}</span>
                      </div>
                    )}
                    {parsedDetails['Notes'] && (
                      <div className="flex">
                        <span className="text-gray-500 w-32">Notes</span>
                        <span className="text-gray-300">: {parsedDetails['Notes']}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <div>
                  <span className="text-gray-500 text-sm">Total Amount</span>
                  <p className="text-white font-bold text-lg">₹{quote.price}</p>
                </div>
                <Link href={`/quote/${quote.id}`}>
                  <Button className="bg-[#C40F5A] hover:bg-[#EE2377] text-white rounded-xl px-6">
                    View Quote <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Calendar Component with Orange Underlines
function CalendarViewNew({ quotes, currentMonth, onMonthChange }: { 
  quotes: Quote[]; 
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // Get bookings by date
  const bookingsByDate = quotes.reduce((acc, quote) => {
    try {
      const dateKey = format(parseISO(quote.serviceDate), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(quote);
    } catch {}
    return acc;
  }, {} as Record<string, Quote[]>);

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#C40F5A] font-semibold text-lg uppercase">
          {format(currentMonth, 'MMMM')}
        </h3>
        <div className="flex items-center gap-4">
          <button onClick={() => onMonthChange(subMonths(currentMonth, 1))} className="text-gray-400 hover:text-white">
            ←
          </button>
          <span className="text-gray-400">{format(currentMonth, 'yyyy')}</span>
          <button onClick={() => onMonthChange(addMonths(currentMonth, 1))} className="text-gray-400 hover:text-white">
            →
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-center text-xs text-gray-500 py-2">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const hasBooking = bookingsByDate[dateKey]?.length > 0;
          const isToday = isSameDay(day, today);

          return (
            <div key={dateKey} className="h-12 flex flex-col items-center justify-center relative">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                isToday ? 'bg-[#C40F5A] text-white font-bold' : 'text-gray-300'
              }`}>
                {format(day, 'd')}
              </span>
              {hasBooking && (
                <div className="absolute bottom-0 w-4 h-0.5 bg-orange-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingsView({ quotes, userRole, createQuoteLink = '/artist/create-quote' }: BookingsViewProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'calendar'>('bookings');
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterMonth, setFilterMonth] = useState<string>('this-month');

  // Filter quotes based on selected month
  const filteredQuotes = quotes.filter(q => {
    if (filterMonth === 'all') return true;
    const quoteDate = parseISO(q.serviceDate);
    const now = new Date();
    if (filterMonth === 'this-month') {
      return quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Sort: Active first, then by date
  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    const statusOrder: Record<string, number> = { 'Booked': 0, 'Accepted': 1, 'Pending': 2, 'Completed': 3, 'Cancelled': 4 };
    const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime();
  });

  const toggleExpand = (quoteId: string) => {
    setExpandedQuoteId(expandedQuoteId === quoteId ? null : quoteId);
  };

  return (
    <div>
      {/* Tab Switcher - Pill Style */}
      <div className="bg-[#2a2a2a] rounded-xl p-1 flex mb-4">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'bookings' 
              ? 'bg-[#C40F5A] text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'calendar' 
              ? 'bg-[#C40F5A] text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Calendar
        </button>
      </div>

      {activeTab === 'bookings' ? (
        <>
          {/* Month Filter */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setFilterMonth(filterMonth === 'this-month' ? 'all' : 'this-month')}
              className="flex items-center gap-2 text-white"
            >
              <span>{filterMonth === 'this-month' ? 'This Month' : 'All Bookings'}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Booking Cards */}
          {sortedQuotes.length === 0 ? (
            <div className="border border-[#C40F5A]/30 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-orange-400 rounded-xl flex flex-col items-center justify-center shadow-lg mx-auto mb-4">
                <div className="flex gap-1 mb-1">
                  <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
                </div>
                <span className="text-3xl font-bold text-white">31</span>
              </div>
              <p className="text-gray-300 mb-6">No bookings found</p>
              {userRole === 'artist' && (
                <Link href={createQuoteLink}>
                  <Button className="bg-[#C40F5A] hover:bg-[#EE2377] px-8 py-3 rounded-xl text-white font-medium">
                    <Plus className="mr-2 h-5 w-5" /> Add First Booking
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div>
              {sortedQuotes.map((quote, index) => (
                <BookingCard
                  key={quote.id}
                  quote={quote}
                  index={index}
                  isExpanded={expandedQuoteId === quote.id}
                  onToggle={() => toggleExpand(quote.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <CalendarViewNew 
          quotes={quotes} 
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* FAB for new booking (artist only) */}
      {userRole === 'artist' && sortedQuotes.length > 0 && (
        <Link
          href={createQuoteLink}
          className="fixed bottom-24 right-4 bg-[#C40F5A] text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:bg-[#EE2377] transition-all active:scale-95 z-20"
        >
          <Plus className="h-5 w-5" /> New Booking
        </Link>
      )}
    </div>
  );
}
