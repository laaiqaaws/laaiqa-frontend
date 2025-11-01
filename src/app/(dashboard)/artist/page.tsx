"use client";

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User as AuthUserRaw, API_BASE_URL } from '@/types/user';
import {
  User as UserIcon,
  Settings,
  LogOut,
  Edit3,
  Palette,
  Link as LinkIconOriginal,
  BookOpen,
  Star,
  FilePlus,
  ClipboardCopy,
  CheckCircle,
  Clock,
  CalendarDays,
  Clock4,
  IndianRupee,
  Package,
  FileText,
  Trash2,
  CheckSquare,
  UserRound,
  Weight,
  Ruler,
  Droplet,
  Users,
  Tag,
  Home as HomeIcon,
  Phone,
  UserCog,
  Info,
  Briefcase,
  Map,
  CircleX,
  AlertCircle,
  Bell,
  TriangleAlert,
  Mail,
  LayoutDashboard,
  Filter,
  RefreshCw,
  Zap,
  BookMarked,
  MessageSquareText,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  format,
  parseISO,
  isValid as dateFnsIsValid,
  startOfDay,
  isEqual,
  isBefore,
  compareAsc,
  isWithinInterval,
  startOfToday,
  endOfToday,
  subDays,
  subYears,
  formatDistanceToNow,
} from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast as sonnerToast } from "sonner";
import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';

interface CreateDisputeRequestBody {
  reason: string;
  details: string | null;
}

interface FrontendReview {
    id: string;
    rating: number;
    comment: string | null;
}

interface FrontendDispute {
    id: string;
    initiatorId: string;
    involvedId: string | null;
    reason: string;
    details: string | null;
    status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
    resolution: string | null;
    createdAt: string;
    updatedAt: string;
    initiatorRole: 'artist' | 'customer';
}

interface FrontendDisputeDetail {
     id: string;
     createdAt: string;
     updatedAt: string;
     reason: string;
     details: string | null;
     status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
     initiatorId: string;
     involvedId: string | null;
     quoteId: string;
     resolution: string | null;
     quote: {
         id: string;
         productType: string;
         status: string;
         serviceDate: string | null;
     } | null;
     initiator: {
         id: string;
         name: string | null;
         email: string;
         role: string;
     } | null;
     involved: {
         id: string;
         name: string | null;
         email: string;
         role: string;
     } | null;
}

interface ApiQuoteData {
  id: string;
  createdAt: string;
  updatedAt: string;
  artistId: string;
  customerId: string | null;
  customerName?: string | null;
  customerAge?: number | null;
  customerColor?: string | null;
  customerEthnicity?: string | null;
  customerHeight?: number | null;
  customerWeight?: number | null;
  customerOther?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerZipCode?: string | null;
  customerCountry?: string | null;
  customerPhone?: string | null;
  customerGender?: string | null;
  customerBookingPreferences?: string[] | null;
  customerPreferredArtists?: string[] | null;
  productType: string;
  details: string;
  price: string;
  serviceDate: string;
  serviceTime: string;
  status: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled";
  review?: FrontendReview | null;
  disputes?: FrontendDispute[];
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}

interface FrontendQuote extends ApiQuoteData {
  displayStatus: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled" | "Date Reached (Pending)" | "Overdue (Payment Pending)" | "Overdue (Booked)";
}

interface AuthUser extends AuthUserRaw {
    role: 'artist';
    bio?: string | null;
    specialties?: string | null;
    portfolioLink?: string | null;
    bookingInfo?: string[] | null;
    services?: string[] | null;
    availableLocations?: string[] | null;
    name?: string | null;
    email: string;
    image?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
    color?: string | null;
    ethnicity?: string | null;
    age?: number | null;
    other?: string | null;
    reviewCount?: number | null;
}

interface CommunicationAlert {
    id: string;
    quoteId: string;
    productType: string;
    type: 'SMS' | 'Email';
    action: string;
    recipient: 'Customer' | 'Artist';
    details: string;
    timestamp: string;
}

const QUOTE_BACKGROUND_COLORS = [
  "#CD8FDE",
  "#FACCB2",
  "#F9B6D2",
  "#A2D9CE", "#FFD8A9",
];

export default function ArtistDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | '7d' | '30d' | 'year' | 'custom'>('30d');
  const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange | undefined>({
      from: subDays(startOfToday(), 29),
      to: endOfToday(),
  });
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const [artistQuotes, setArtistQuotes] = useState<FrontendQuote[]>([]);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [quotesLoading, setQuotesLoading] = useState(true);

  const [isCreateQuoteDialogOpen, setIsCreateQuoteDialogOpen] = useState(false);
  const [newQuoteProductType, setNewQuoteProductType] = useState("");
  const [newQuoteOtherProductType, setNewQuoteOtherProductType] = useState("");
  const [newQuoteDetails, setNewQuoteDetails] = useState("");
  const [newQuotePrice, setNewQuotePrice] = useState<number | string>('');
  const [newQuoteServiceDate, setNewQuoteServiceDate] = useState<Date | undefined>(undefined);
  const [newQuoteServiceTime, setNewQuoteServiceTime] = useState("");
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [createQuoteError, setCreateQuoteError] = useState<string | null>(null);

  const [isDeletingQuote, setIsDeletingQuote] = useState<string | null>(null);
  const [isCompletingQuote, setIsCompletingQuote] = useState<string | null>(null);
  const [isCancellingQuote, setIsCancellingQuote] = useState<string | null>(null);

  const [isRaiseDisputeDialogOpen, setIsRaiseDisputeDialogOpen] = useState(false);
  const [disputeQuoteId, setDisputeQuoteId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [isRaisingDispute, setIsRaisingDispute] = useState(false);
  const [raiseDisputeError, setRaiseDisputeError] = useState<string | null>(null);

  const [isDeletingDispute, setIsDeletingDispute] = useState<string | null>(null);
  const [isClosingDispute, setIsClosingDispute] = useState<string | null>(null);
  const [isViewDisputeDialogOpen, setIsViewDisputeDialogOpen] = useState(false);
  const [viewDisputeDetails, setViewDisputeDetails] = useState<FrontendDisputeDetail | null>(null);
  const [isLoadingDisputeDetails, setIsLoadingDisputeDetails] = useState(false);
  const [loadingDisputeVewButtonId, setLoadingDisputeVewButtonId] = useState<string | null>(null);

  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [csrfFetchAttempted, setCsrfFetchAttempted] = useState(false);

  const [communicationHistory, setCommunicationHistory] = useState<CommunicationAlert[]>([]);
  const [isCommunicationLoading, setIsCommunicationLoading] = useState(true);

  const productTypes = [
      "Bridal Makeup",
      "Bridal Hair Styling",
      "Mehndi/Henna Art",
      "Engagement Makeup",
      "Reception Makeup",
      "Pre-Wedding Shoot Makeup",
      "Trial Session",
      "Other",
    ];

  const calculateDisplayStatusForQuote = useCallback(
    (baseQuote: ApiQuoteData): FrontendQuote['displayStatus'] => {
      let displayStatus: FrontendQuote['displayStatus'] = baseQuote.status as FrontendQuote['displayStatus'];

      if (baseQuote.status === "Pending" || baseQuote.status === "Accepted" || baseQuote.status === "Booked") {
        try {
          const serviceDateObj = parseISO(baseQuote.serviceDate);
          if (dateFnsIsValid(serviceDateObj)) {
            const serviceDateNormalized = startOfDay(serviceDateObj);
            const todayNormalized = startOfDay(new Date());

            if (isEqual(serviceDateNormalized, todayNormalized)) {
                if (baseQuote.status === "Pending") {
                    displayStatus = "Date Reached (Pending)";
                } else {
                    displayStatus = baseQuote.status;
                }
            } else if (isBefore(serviceDateNormalized, todayNormalized)) {
              if (baseQuote.status === "Pending") {
                displayStatus = "Date Reached (Pending)";
              } else if (baseQuote.status === "Accepted") {
                displayStatus = "Overdue (Payment Pending)";
              } else if (baseQuote.status === "Booked") {
                displayStatus = "Overdue (Booked)";
              }
            }
          } else {
              console.warn(`Invalid serviceDate format for quote ID ${baseQuote.id}: ${baseQuote.serviceDate}.`);
          }
        } catch (e) {
          console.error(`Error processing serviceDate for quote ID ${baseQuote.id}:`, e);
        }
      }
      return displayStatus;
    },
    []
  );

  const fetchCsrfToken = useCallback(async (): Promise<string | null> => {
      if (csrfToken !== null || csrfFetchAttempted) {
           if (csrfToken === null && !csrfFetchAttempted) {
           } else {
               return csrfToken;
           }
      }

      setCsrfFetchAttempted(true);
      try {
          const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' });
          if (!response.ok) {
              console.error('Failed to fetch CSRF token:', response.status, response.statusText);
              setCsrfToken(null);
              return null;
          }
          const data = await response.json();
           if (!data.csrfToken) {
                console.warn('CSRF token endpoint returned OK but no token:', data);
           }
           setCsrfToken(data.csrfToken || null);
           return data.csrfToken || null;
      } catch (error) {
          console.error('Fetch CSRF token error:', error);
          setCsrfToken(null);
          return null;
      }
  }, [csrfToken, csrfFetchAttempted]);

  useEffect(() => {
    const fetchUser = async () => {
      setUserError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            sonnerToast.error("Authentication Required", { description: "Please log in to access the artist dashboard." });
            router.push('/login');
            return;
          }
          const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
           setUser(null);
          setUserError(errorData.message || `Failed to fetch user: ${response.statusText}`);
          return;
        }

        const data: { user: AuthUser } = await response.json();

        if (data.user.role !== 'artist') {
           const errorMessage = "Access denied. This dashboard is for artists only.";
           setUserError(errorMessage);
           setUser(null);
           sonnerToast.error("Access Denied", { description: errorMessage });
           router.push(data.user.role === 'customer' ? '/customer' : '/');
           return;
        } else {
          setUser(data.user);
           setUserError(null);
        }
      } catch (err: any) {
        if (!userError) {
            setUser(null);
            setUserError('Failed to load user data: ' + (err.message || "Unknown error"));
         }
      }
    };

    fetchUser();
    fetchCsrfToken();

  }, [router, fetchCsrfToken, userError]);

    const fetchArtistQuotes = useCallback(async () => {
        if (!user || user.role !== 'artist') return;
        setQuotesLoading(true);
        setQuotesError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/quotes/artist`, {
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    setQuotesError('Failed to load quotes: Session expired. Please log in again.');
                    setArtistQuotes([]);
                    return;
                }
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                setQuotesError('Failed to load your quotes: ' + (errorData.message || `HTTP error ${response.status}`));
                setArtistQuotes([]);
                return;
            }

            const quotesApiData: ApiQuoteData[] = await response.json();

            const processedQuotes = quotesApiData.map(quote => ({
                ...quote,
                displayStatus: calculateDisplayStatusForQuote(quote),
                disputes: quote.disputes || [],
            }));

            processedQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setArtistQuotes(processedQuotes);
            setQuotesError(null);

        } catch (err: any) {
            setQuotesError('Failed to load your quotes: ' + (err.message || "Unknown error"));
            setArtistQuotes([]);
        } finally {
            setQuotesLoading(false);
        }
    }, [user, calculateDisplayStatusForQuote]);


  useEffect(() => {
    if (user && user.role === 'artist') {
      fetchArtistQuotes();
    } else {
      setArtistQuotes([]);
      setQuotesError(null);
      setQuotesLoading(false);
    }
  }, [user, fetchArtistQuotes]);

    const fetchCommunicationHistory = useCallback(() => {
        setIsCommunicationLoading(true);
        const mockAlerts: CommunicationAlert[] = [];
        const now = new Date();

        artistQuotes.slice(0, 10).forEach((quote, index) => {
             const baseTime = new Date(now.getTime() - index * 3600000 * 5);
             
             mockAlerts.push({
                 id: `${quote.id}-created-email`,
                 quoteId: quote.id,
                 productType: quote.productType,
                 type: 'Email',
                 action: 'Quote Created',
                 recipient: 'Artist',
                 details: `Your quote for ${quote.productType} (Price: ₹${quote.price}) was successfully created.`,
                 timestamp: new Date(baseTime.getTime() - 1000 * 60 * 3).toISOString(),
             });

             if (quote.status === 'Accepted' || quote.status === 'Booked' || quote.status === 'Completed') {
                mockAlerts.push({
                    id: `${quote.id}-accepted-sms-c`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'SMS',
                    action: 'Quote Accepted',
                    recipient: 'Customer',
                    details: `SMS: Quote for ${quote.productType} accepted (Payment initiated).`,
                    timestamp: new Date(baseTime.getTime() - 1000 * 60 * 2).toISOString(),
                });
                mockAlerts.push({
                    id: `${quote.id}-accepted-sms-a`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'SMS',
                    action: 'Quote Accepted',
                    recipient: 'Artist',
                    details: `SMS: Quote for ${quote.productType} accepted by ${quote.customerName || 'customer'}.`,
                    timestamp: new Date(baseTime.getTime() - 1000 * 60 * 1).toISOString(),
                });
             }

             if (quote.status === 'Booked' || quote.status === 'Completed') {
                 mockAlerts.push({
                    id: `${quote.id}-booked-email-c`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'Quote Booked',
                    recipient: 'Customer',
                    details: `Email: Your booking for ${quote.productType} is confirmed.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 5).toISOString(),
                });
                 mockAlerts.push({
                    id: `${quote.id}-booked-email-a`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'Quote Booked',
                    recipient: 'Artist',
                    details: `Email: ${quote.customerName || 'Customer'} has booked your service.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 6).toISOString(),
                });
             }
             
             if (quote.status === 'Completed') {
                 mockAlerts.push({
                    id: `${quote.id}-completed-sms-c`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'SMS',
                    action: 'Quote Completed',
                    recipient: 'Customer',
                    details: `SMS: Quote for ${quote.productType} marked complete.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 10).toISOString(),
                });
                 mockAlerts.push({
                    id: `${quote.id}-completed-email-a`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'Quote Completed',
                    recipient: 'Artist',
                    details: `Email: You marked ${quote.productType} complete.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 11).toISOString(),
                });
             }
             
             if (quote.status === 'Cancelled') {
                 mockAlerts.push({
                    id: `${quote.id}-cancelled-email-c`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'Quote Cancelled',
                    recipient: 'Customer',
                    details: `Email: Quote for ${quote.productType} was cancelled by the artist.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 15).toISOString(),
                });
                 mockAlerts.push({
                    id: `${quote.id}-cancelled-email-a`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'Quote Cancelled',
                    recipient: 'Artist',
                    details: `Email: You cancelled the quote for ${quote.productType}.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 16).toISOString(),
                });
             }

             if (quote.review) {
                 mockAlerts.push({
                    id: `${quote.id}-review-email-a`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'New Review',
                    recipient: 'Artist',
                    details: `Email: You received a new ${quote.review.rating}/5 review from ${quote.customerName || 'Customer'}.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 20).toISOString(),
                });
             }
             
             if (quote.disputes && quote.disputes.length > 0) {
                 quote.disputes.forEach(dispute => {
                     if (dispute.initiatorId === user?.id && dispute.involvedId) {
                         mockAlerts.push({
                            id: `${dispute.id}-opened-email-involved`,
                            quoteId: quote.id,
                            productType: quote.productType,
                            type: 'Email',
                            action: 'Dispute Opened',
                            recipient: 'Customer',
                            details: `Email: A dispute was opened on quote ${quote.productType}.`,
                            timestamp: new Date(dispute.createdAt).toISOString(),
                        });
                     }
                 });
             }
        });
        
        mockAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setCommunicationHistory(mockAlerts);
        setIsCommunicationLoading(false);
    }, [artistQuotes, user?.id]);

    useEffect(() => {
        if (user && artistQuotes.length > 0 && !quotesLoading) {
            fetchCommunicationHistory();
        } else if (user && quotesLoading) {
             setIsCommunicationLoading(true);
        } else {
             setCommunicationHistory([]);
             setIsCommunicationLoading(false);
        }
    }, [user, artistQuotes.length, quotesLoading, fetchCommunicationHistory]);

    useEffect(() => {
        const today = startOfToday();
        switch (analyticsPeriod) {
            case '7d': setAnalyticsDateRange({ from: subDays(today, 6), to: endOfToday() }); break;
            case '30d': setAnalyticsDateRange({ from: subDays(today, 29), to: endOfToday() }); break;
            case 'year': setAnalyticsDateRange({ from: subYears(today, 1), to: endOfToday() }); break;
            case 'all': setAnalyticsDateRange(undefined); break;
            case 'custom':
                if (!analyticsDateRange?.from || !analyticsDateRange?.to) {
                    setAnalyticsDateRange({ from: subDays(today, 29), to: endOfToday() });
                }
                break;
        }
    }, [analyticsPeriod]);

    const {
        quotesInPeriod, reviewsInPeriod,
        totalRevenueInPeriod, completedQuotesInPeriod, bookedQuotesInPeriod,
        quoteConversionRateInPeriod,
        averageRatingInPeriod,
    } = useMemo(() => {
        const { from, to } = analyticsDateRange || {};
        const isWithinSelectedInterval = (dateString: string | Date) => {
            if (!from || !to) return true;
            const date = parseISO(dateString as string);
            return dateFnsIsValid(date) && isWithinInterval(date, { start: from, end: to });
        };

        const quotesInPeriod = analyticsDateRange === undefined ? artistQuotes : artistQuotes.filter(quote => isWithinSelectedInterval(quote.createdAt));
        const reviewsInPeriod = quotesInPeriod.map(q => q.review).filter((r): r is FrontendReview => !!r);
        
        const completedQuotesInPeriod = quotesInPeriod.filter(q => q.status === 'Completed');
        const bookedQuotesInPeriod = quotesInPeriod.filter(q => q.status === 'Booked');
        
        const totalRevenueInPeriod = completedQuotesInPeriod.reduce((sum, q) => sum + parseFloat(q.price || '0'), 0);
        const acceptedOrBookedQuotes = quotesInPeriod.filter(q => q.status === 'Accepted' || q.status === 'Booked' || q.status === 'Completed');
        const quoteConversionRateInPeriod = acceptedOrBookedQuotes.length > 0 ? (completedQuotesInPeriod.length / acceptedOrBookedQuotes.length) * 100 : 0;

        const ratedReviews = reviewsInPeriod.filter(r => r.rating != null);
        const totalRating = ratedReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRatingInPeriod = ratedReviews.length > 0 ? totalRating / ratedReviews.length : null;

        return {
            quotesInPeriod, reviewsInPeriod,
            totalRevenueInPeriod, completedQuotesInPeriod, bookedQuotesInPeriod,
            quoteConversionRateInPeriod, averageRatingInPeriod,
        };
    }, [artistQuotes, analyticsDateRange]);

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    sonnerToast.info("Refreshing data...", { duration: 1500 });
    await Promise.all([fetchArtistQuotes(), fetchCommunicationHistory()]);
    setIsRefreshingData(false);
  };

  const upcomingQuotes = artistQuotes
    .filter(quote =>
      (quote.status === 'Booked' || quote.displayStatus === 'Date Reached (Pending)' || quote.displayStatus === 'Overdue (Payment Pending)' || quote.displayStatus === 'Overdue (Booked)') &&
      quote.status !== 'Completed' &&
      quote.status !== 'Cancelled'
    )
    .sort((a, b) => {
        const dateA = parseISO(a.serviceDate);
        const dateB = parseISO(b.serviceDate);

         if (!dateFnsIsValid(dateA) && !dateFnsIsValid(dateB)) return 0;
         if (!dateFnsIsValid(dateA)) return 1;
         if (!dateFnsIsValid(dateB)) return -1;


        const dateComparison = compareAsc(dateA, dateB);
        if (dateComparison !== 0) {
            return dateComparison;
        }

         const parseTime = (timeStr: string): number | null => {
             const parts = timeStr.split(':').map(Number);
             if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] >= 0 && parts[0] < 24 && parts[1] >= 0 && parts[1] < 60) {
                 return parts[0] * 60 + parts[1];
             }
             return null;
         };

        const timeA_value = parseTime(a.serviceTime);
        const timeB_value = parseTime(b.serviceTime);

         if (timeA_value === null && timeB_value === null) return 0;
         if (timeA_value === null) return 1;
         if (timeB_value === null) return -1;


        return timeA_value - timeB_value;
    })
    .slice(0, 3);

   const completedQuotesWithReviews = artistQuotes.filter(quote =>
       quote.status === 'Completed' && quote.review && quote.review.rating !== null && quote.review.rating !== undefined
   );

   const totalRating = completedQuotesWithReviews.reduce((sum, quote) => sum + (quote.review?.rating ?? 0), 0);
   const calculatedReviewCount = completedQuotesWithReviews.length;
   const calculatedAverageRating = calculatedReviewCount > 0 ? totalRating / calculatedReviewCount : null;

  const handleLogout = async () => {
      if (!user) {
          sonnerToast.info("Info", { description: "You are not logged in." });
          router.push('/login');
          return;
      }
    try {
       let token = csrfToken;
        if (!token && !csrfFetchAttempted) {
             sonnerToast.info("Attempting to refresh security token...");
             token = await fetchCsrfToken();
        }

       if (!token) {
           sonnerToast.error("Logout Failed", { description: "Security token not available. Please refresh and try again." });
           return;
       }

      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
         headers: {
             'CSRF-Token': token,
         },
      });
      if (response.ok) {
        setUser(null);
        setCsrfToken(null);
        setArtistQuotes([]);
        setQuotesError(null);
        setUserError(null);
        setCsrfFetchAttempted(false);

        sonnerToast.success("Logged Out", { description: "You have been successfully logged out." });
        router.push('/login');
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown logout error" }));
        sonnerToast.error("Logout Failed", {
          description: errorData.message || "Failed to log out. Please try again.",
        });
      }
    } catch (err: any)
    {
      sonnerToast.error("Logout Error", {
        description: err.message || "An error occurred during logout.",
      });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name || name.trim() === "") return "A";
     const parts = name.trim().split(' ');
     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  };

  const resetCreateQuoteForm = () => {
    setNewQuoteProductType("");
    setNewQuoteOtherProductType("");
    setNewQuoteDetails("");
    setNewQuotePrice('');
    setNewQuoteServiceDate(undefined);
    setNewQuoteServiceTime("");
    setCreateQuoteError(null);
  };

  const handleCreateQuoteSubmit = async () => {
    // Reset error state
    setCreateQuoteError(null);
    
    const finalProductType = newQuoteProductType === 'Other' ? newQuoteOtherProductType.trim() : newQuoteProductType;
    const priceAsNumber = parseFloat(String(newQuotePrice));

    // Comprehensive validation with better error messages
    if (!finalProductType) {
      setCreateQuoteError("Product type is required. Please select a service type."); 
      return;
    }
    if (!newQuoteDetails.trim()) {
      setCreateQuoteError("Service details are required. Please describe what you'll provide."); 
      return;
    }
    if (newQuotePrice === '' || newQuotePrice === null || newQuotePrice === undefined) {
      setCreateQuoteError("Price is required. Please enter the service cost."); 
      return;
    }
    if (isNaN(priceAsNumber) || priceAsNumber < 0) {
      setCreateQuoteError("Please enter a valid price (numbers only, no negative values)."); 
      return;
    }
    if (priceAsNumber === 0) {
      setCreateQuoteError("Price must be greater than 0."); 
      return;
    }
    if (!newQuoteServiceDate) {
      setCreateQuoteError("Service date is required. Please select when you'll provide the service."); 
      return;
    }
    if (!newQuoteServiceTime.trim()) {
      setCreateQuoteError("Service time is required. Please specify the time."); 
      return;
    }
    
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newQuoteServiceDate < today) {
      setCreateQuoteError("Service date cannot be in the past. Please select a future date."); 
      return;
    }

     let token = csrfToken;
      if (!token && !csrfFetchAttempted) {
          sonnerToast.info("Attempting to refresh security token...");
          token = await fetchCsrfToken();
      }

    if (!token) {
       setCreateQuoteError("Security token not available. Please refresh the page or try again.");
       sonnerToast.error("Security Error", { description: "Security token not available. Please refresh or ensure you are properly logged in." });
       return;
    }

    setIsCreatingQuote(true);
    setCreateQuoteError(null);

    const quotePayload = {
      productType: finalProductType,
      details: newQuoteDetails.trim(),
      price: priceAsNumber,
      serviceDate: format(newQuoteServiceDate, 'yyyy-MM-dd'),
      serviceTime: newQuoteServiceTime.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': token,
        },
        body: JSON.stringify(quotePayload),
        credentials: 'include',
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.message || `Failed to create quote: ${response.statusText}`;
        setCreateQuoteError(errorMsg);
        sonnerToast.error("Quote Creation Failed", { description: errorMsg });
      } else {
          const createdQuoteApiData: ApiQuoteData = responseData.quote;
          const newFrontendQuote: FrontendQuote = {
            ...createdQuoteApiData,
            displayStatus: calculateDisplayStatusForQuote(createdQuoteApiData),
            disputes: createdQuoteApiData.disputes || [],
          };

          setArtistQuotes((prevQuotes) => [newFrontendQuote, ...prevQuotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          fetchCommunicationHistory();
          resetCreateQuoteForm();
          setIsCreateQuoteDialogOpen(false);

          const frontendQuoteLink = getFrontendQuoteLink(newFrontendQuote.id);
          sonnerToast.success("Quote Created Successfully!", {
            description: (
                <div className="text-sm">
                    Your quote is ready. Share this link: <br />
                    <a
                        href={frontendQuoteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-400 underline break-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {frontendQuoteLink}
                    </a>
                </div>
            ),
            duration: 10000,
            action: {
                label: "Copy Link",
                onClick: () => {
                    navigator.clipboard.writeText(frontendQuoteLink)
                        .then(() => sonnerToast.success("Link copied!"))
                        .catch(() => sonnerToast.error("Failed to copy link"));
                }
            }
          });
      }

    } catch (err: any) {
      const errorMsg = 'An error occurred: ' + (err.message || "Unknown error during quote creation.");
      setCreateQuoteError(errorMsg);
      sonnerToast.error("Quote Creation Error", { description: errorMsg });
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
     if (!user) {
         sonnerToast.error("Permission Denied", { description: "Only artists can delete quotes." });
         return;
     }
     const quoteToDelete = artistQuotes.find(q => q.id === quoteId);
     if (!quoteToDelete) {
         sonnerToast.error("Not Found", { description: "Quote not found." });
         return;
     }

     if (quoteToDelete.status !== 'Pending' || quoteToDelete.customerId !== null) {
         sonnerToast.info("Action Info", { description: "Quotes can only be deleted if they are Pending and have not been accepted by a customer."});
         return;
     }

     if (quoteToDelete.disputes && quoteToDelete.disputes.some(d => d.status !== 'Closed' && d.status !== 'Resolved')) {
         sonnerToast.error("Deletion Failed", { description: "Cannot delete quote with active disputes. Please resolve or delete disputes first." });
         return;
     }

    if (isDeletingQuote === quoteId) return;

     let token = csrfToken;
      if (!token && !csrfFetchAttempted) {
          sonnerToast.info("Attempting to refresh security token...");
          token = await fetchCsrfToken();
      }

    if (!token) {
        sonnerToast.error("Action Failed", { description: "Security token not available. Please refresh." });
        return;
    }

    setIsDeletingQuote(quoteId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'CSRF-Token': token },
      });
      const responseData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));

      if (!response.ok) {
           if (response.status === 409) {
               throw new Error(responseData.message || "Cannot delete quote due to related records (e.g., active disputes not caught by frontend check).");
           }
        throw new Error(responseData.message || `Failed to delete quote: ${response.statusText}`);
      }
      setArtistQuotes((prevQuotes) => prevQuotes.filter(quote => quote.id !== quoteId));
      fetchCommunicationHistory();
      sonnerToast.success("Quote Deleted", { description: "Quote deleted successfully.", duration: 3000 });
    } catch (err: any) {
      sonnerToast.error("Deletion Failed", { description: err.message || 'An error occurred during deletion.' });
    } finally {
      setIsDeletingQuote(null);
    }
  };

  const handleMarkAsCompleted = async (quoteId: string) => {
     if (!user) {
          sonnerToast.error("Authentication Required", { description: "You must be logged in." });
          return;
     }
      const quoteToComplete = artistQuotes.find(q => q.id === quoteId);
      if (!quoteToComplete || quoteToComplete.status !== 'Booked') {
          sonnerToast.info("Action Info", { description: "Only booked quotes can be marked as completed."});
          return;
      }
      if (quoteToComplete.artistId !== user.id) {
           sonnerToast.error("Permission Denied", { description: "You can only complete your own quotes." });
           return;
      }

      if (quoteToComplete.disputes && quoteToComplete.disputes.some(d => d.status !== 'Closed' && d.status !== 'Resolved')) {
        sonnerToast.info("Completion Blocked", { description: "Cannot mark quote as completed with active disputes. Please resolve disputes first." });
        return;
      }

    if (isCompletingQuote === quoteId) return;

     let token = csrfToken;
      if (!token && !csrfFetchAttempted) {
          sonnerToast.info("Attempting to refresh security token...");
          token = await fetchCsrfToken();
      }

    if (!token) {
        sonnerToast.error("Action Failed", { description: "Security token not available. Please refresh." });
        return;
    }

    setIsCompletingQuote(quoteId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to mark quote as completed: ${response.statusText}`);
      }
      const updatedQuoteApiData: ApiQuoteData = responseData.quote;
      setArtistQuotes(prevQuotes =>
        prevQuotes.map(quote =>
          quote.id === updatedQuoteApiData.id
          ? { ...updatedQuoteApiData, displayStatus: calculateDisplayStatusForQuote(updatedQuoteApiData), disputes: updatedQuoteApiData.disputes || [] }
          : quote
        )
      );
      fetchCommunicationHistory();
      sonnerToast.success("Quote Completed", { description: "Quote marked as completed.", duration: 3000 });
    } catch (err: any) {
      sonnerToast.error("Completion Failed", { description: err.message || 'An error occurred.' });
    } finally {
      setIsCompletingQuote(null);
    }
  };

   const handleCancelQuote = async (quoteId: string) => {
       if (!user) {
            sonnerToast.error("Authentication Required", { description: "You must be logged in." });
            return;
       }
       const quoteToCancel = artistQuotes.find(q => q.id === quoteId);
        if (!quoteToCancel || (quoteToCancel.status !== 'Pending' && quoteToCancel.status !== 'Accepted' && quoteToCancel.status !== 'Booked')) {
            sonnerToast.info("Action Info", { description: "This quote cannot be cancelled in its current state."});
            return;
        }
       const canCancel = (user.id === quoteToCancel.artistId);
       if (!canCancel) {
            sonnerToast.error("Permission Denied", { description: "You are not authorized to cancel this quote." });
            return;
       }

       if (quoteToCancel.disputes && quoteToCancel.disputes.some(d => d.status !== 'Closed' && d.status !== 'Resolved')) {
           sonnerToast.info("Cancellation Blocked", { description: "Cannot cancel quote with active disputes. Please resolve disputes first." });
           return;
       }

       let token = csrfToken;
        if (!token && !csrfFetchAttempted) {
            sonnerToast.info("Attempting to refresh security token...");
            token = await fetchCsrfToken();
        }

        if (!token) {
           sonnerToast.error("Action Failed", { description: "Security token not available. Please refresh." });
           return;
       }
       setIsCancellingQuote(quoteId);
       try {
           const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}/cancel`, {
               method: 'POST',
               credentials: 'include',
               headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
           });
           const responseData = await response.json();
           if (!response.ok) {
               throw new Error(responseData.message || `Failed to cancel quote: ${response.statusText}`);
           }
           const updatedQuoteApiData: ApiQuoteData = responseData.quote;
           setArtistQuotes(prevQuotes =>
               prevQuotes.map(quote =>
                   quote.id === updatedQuoteApiData.id
                   ? { ...updatedQuoteApiData, displayStatus: calculateDisplayStatusForQuote(updatedQuoteApiData), disputes: updatedQuoteApiData.disputes || [] }
                   : quote
               )
           );
           fetchCommunicationHistory();
           sonnerToast.success("Quote Cancelled!", { description: "The quote has been cancelled." });
       } catch (err: any) {
           sonnerToast.error("Cancellation Failed", { description: err.message || 'An error occurred.' });
       } finally {
           setIsCancellingQuote(null);
       }
   };

    const handleOpenRaiseDisputeDialog = (quoteId: string) => {
        const quote = artistQuotes.find(q => q.id === quoteId);
        if (!user || !quote) {
            sonnerToast.error("Error", { description: "User or Quote not found." });
            return;
        }
        if (!quote.customerId) {
            sonnerToast.info("Action Info", { description: "Disputes can only be raised for quotes that have been accepted by a customer." });
            return;
        }
        const allowedStatusesForDispute = ['Accepted', 'Booked', 'Completed'];
        if (!allowedStatusesForDispute.includes(quote.status)) {
            sonnerToast.info("Action Info", { description: `Disputes can only be raised for quotes that are ${allowedStatusesForDispute.join(' or ')}.` });
            return;
        }

         if (quote.disputes && quote.disputes.some(d => d.status !== 'Closed' && d.status !== 'Resolved')) {
             sonnerToast.info("Info", { description: "An active dispute already exists for this quote." });
             return;
         }

        setDisputeQuoteId(quoteId);
        setDisputeReason("");
        setDisputeDetails("");
        setRaiseDisputeError(null);
        setIsRaiseDisputeDialogOpen(true);
    };

    const handleRaiseDisputeSubmit = async () => {
        if (!user || user.role !== 'artist' || !disputeQuoteId) {
            sonnerToast.error("Error", { description: "Invalid request. Ensure you are logged in as an artist and a quote is selected." });
            return;
        }

        if (!disputeReason.trim()) {
            setRaiseDisputeError("Reason for dispute is required.");
            return;
        }

        let token = csrfToken;
         if (!token && !csrfFetchAttempted) {
             sonnerToast.info("Attempting to refresh security token...");
             token = await fetchCsrfToken();
         }

        if (!token) {
            setRaiseDisputeError("Security token not available. Please refresh the page or try again.");
            sonnerToast.error("Security Error", { description: "Security token not available. Please refresh or ensure you are properly logged in." });
            return;
        }

        setIsRaisingDispute(true);
        setRaiseDisputeError(null);

        const disputePayload: CreateDisputeRequestBody = {
            reason: disputeReason.trim(),
            details: disputeDetails.trim() || null,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/quotes/${disputeQuoteId}/dispute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': token,
                },
                body: JSON.stringify(disputePayload),
                credentials: 'include',
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.message || `Failed to raise dispute: ${response.statusText}`;
                 setRaiseDisputeError(errorMsg);
                 sonnerToast.error("Dispute Failed", { description: errorMsg });
            } else {
                 const updatedQuoteWithDispute: ApiQuoteData = responseData.quote;
                 setArtistQuotes(prevQuotes =>
                     prevQuotes.map(quote =>
                         quote.id === updatedQuoteWithDispute.id
                         ? { ...updatedQuoteWithDispute, displayStatus: calculateDisplayStatusForQuote(updatedQuoteWithDispute), disputes: updatedQuoteWithDispute.disputes || [] }
                         : quote
                     )
                 );
                 fetchCommunicationHistory();

                 sonnerToast.success("Dispute Raised", { description: "Dispute submitted for review." });
                 setIsRaiseDisputeDialogOpen(false);
                 setDisputeQuoteId(null);
                 resetDisputeForm();
            }

        } catch (err: any) {
            const errorMsg = 'An error occurred: ' + (err.message || "Unknown error during dispute submission.");
            setRaiseDisputeError(errorMsg);
            sonnerToast.error("Dispute Error", { description: errorMsg });
        } finally {
            setIsRaisingDispute(false);
        }
    };

     const resetDisputeForm = () => {
         setDisputeReason("");
         setDisputeDetails("");
         setRaiseDisputeError(null);
     };

     const getDisputeStatusColorClasses = (status: string | undefined) => {
         switch (status) {
             case "Open": return "bg-red-600/20 text-red-400 border-red-600/50";
             case "Under Review": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
             case "Resolved": return "bg-green-600/20 text-green-400 border-green-600/50";
             case "Closed": return "bg-gray-600/20 text-gray-400 border-gray-600/50";
             default: return "bg-zinc-700/30 text-zinc-300 border-zinc-600/50";
         }
     };

     const handleDeleteDispute = async (quoteId: string, disputeId: string) => {
        if (!user) {
            sonnerToast.error("Authentication Required", { description: "You must be logged in." });
            return;
        }
         const quote = artistQuotes.find(q => q.id === quoteId);
         const disputeToDelete = quote?.disputes?.find(d => d.id === disputeId);

        if (!disputeToDelete) {
            sonnerToast.error("Not Found", { description: "Dispute not found." });
            return;
        }

         if (disputeToDelete.initiatorId !== user.id) {
             sonnerToast.error("Permission Denied", { description: "You can only delete disputes you initiated." });
             return;
         }

         const allowedStatusesForDeletion = ['Open', 'Closed'];
         if (!allowedStatusesForDeletion.includes(disputeToDelete.status)) {
             sonnerToast.info("Action Info", { description: `Disputes can only be deleted if they are Open or Closed. This dispute's status is "${disputeToDelete.status}".` });
             return;
         }

        if (isDeletingDispute === disputeId) return;

        let token = csrfToken;
         if (!token && !csrfFetchAttempted) {
             sonnerToast.info("Attempting to refresh security token...");
             token = await fetchCsrfToken();
         }

        if (!token) {
            sonnerToast.error("Action Failed", { description: "Security token not available. Please refresh." });
            return;
        }

        setIsDeletingDispute(disputeId);
        try {
             const response = await fetch(`${API_BASE_URL}/api/quotes/disputes/${disputeId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'CSRF-Token': token },
            });
            const responseData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));

            if (!response.ok) {
                 throw new Error(responseData.message || `Failed to delete dispute: ${response.statusText}`);
            }

             const updatedQuote: ApiQuoteData = responseData.quote;
             setArtistQuotes(prevQuotes =>
                 prevQuotes.map(q =>
                     q.id === updatedQuote.id
                     ? { ...updatedQuote, displayStatus: calculateDisplayStatusForQuote(updatedQuote), disputes: updatedQuote.disputes || [] }
                     : q
                 )
             );
            sonnerToast.success("Dispute Deleted", { description: "Dispute deleted successfully.", duration: 3000 });

        } catch (err: any) {
            sonnerToast.error("Deletion Failed", { description: err.message || 'An error occurred during deletion.' });
        } finally {
            setIsDeletingDispute(null);
        }
     };

      const handleCloseDispute = async (quoteId: string, disputeId: string) => {
          if (!user) {
              sonnerToast.error("Authentication Required", { description: "You must be logged in." });
              return;
          }
           const quote = artistQuotes.find(q => q.id === quoteId);
           const disputeToClose = quote?.disputes?.find(d => d.id === disputeId);

          if (!disputeToClose) {
              sonnerToast.error("Not Found", { description: "Dispute not found." });
              return;
          }

           if (disputeToClose.initiatorId !== user.id) {
               sonnerToast.error("Permission Denied", { description: "You can only close disputes you initiated." });
               return;
           }

            if (disputeToClose.status !== 'Open') {
                 sonnerToast.info("Action Info", { description: `Only 'Open' disputes can be closed by the initiator. This dispute's status is "${disputeToClose.status}".` });
                 return;
            }

           if (isClosingDispute === disputeId) return;

          let token = csrfToken;
           if (!token && !csrfFetchAttempted) {
               sonnerToast.info("Attempting to refresh security token...");
               token = await fetchCsrfToken();
           }

          if (!token) {
              sonnerToast.error("Action Failed", { description: "Security token not available. Please refresh." });
              return;
          }

          setIsClosingDispute(disputeId);
          try {
               const response = await fetch(`${API_BASE_URL}/api/quotes/disputes/${disputeId}/close`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'CSRF-Token': token },
              });
              const responseData = await response.json();

              if (!response.ok) {
                   throw new Error(responseData.message || `Failed to close dispute: ${response.statusText}`);
              }

               const updatedQuote: ApiQuoteData = responseData.quote;
                setArtistQuotes(prevQuotes =>
                     prevQuotes.map(q =>
                         q.id === quoteId
                         ? { ...updatedQuote, displayStatus: calculateDisplayStatusForQuote(updatedQuote), disputes: updatedQuote.disputes || [] }
                         : q
                     )
                 );
              fetchCommunicationHistory();

              sonnerToast.success("Dispute Closed", { description: "Dispute successfully closed." });

          } catch (err: any) {
              sonnerToast.error("Action Failed", { description: err.message || 'An error occurred during dispute closing.' });
          } finally {
              setIsClosingDispute(null);
          }
      };

     const handleViewDisputeDetails = async (disputeId: string) => {
         if (!user) {
             sonnerToast.error("Authentication Required", { description: "You must be logged in." });
             return;
         }
         
         setLoadingDisputeVewButtonId(disputeId);
         setIsLoadingDisputeDetails(true);
         setViewDisputeDetails(null); 
         setIsViewDisputeDialogOpen(true);

         try {
              const response = await fetch(`${API_BASE_URL}/api/quotes/disputes/${disputeId}`, {
                 credentials: 'include',
              });

              if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                 throw new Error(errorData.message || `Failed to fetch dispute details: ${response.statusText}`);
              }

             const disputeDetailData: FrontendDisputeDetail = await response.json();
             setViewDisputeDetails(disputeDetailData);

         } catch (err: any) {
             sonnerToast.error("Error Loading Dispute", { description: err.message || 'Failed to load dispute details.' });
             setIsViewDisputeDialogOpen(false); 
         } finally {
             setIsLoadingDisputeDetails(false);
             setLoadingDisputeVewButtonId(null);
         }
     };

  const formatDateSafely = (dateInput: string | Date | null | undefined, dateFormat: string = "PPP") => {
    if (dateInput === null || dateInput === undefined) return 'N/A';
    let dateToFormat: Date;
    if (typeof dateInput === 'string') {
        try { dateToFormat = parseISO(dateInput); }
        catch (e) {
             if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                 try {
                      const parts = dateInput.split('-').map(Number);
                      const potentialDate = new Date(parts[0], parts[1] - 1, parts[2]);
                      if (dateFnsIsValid(potentialDate) && potentialDate.toISOString().startsWith(dateInput)) {
                         dateToFormat = potentialDate;
                      } else {
                          return String(dateInput);
                      }
                 } catch(e2) {
                     return String(dateInput);
                 }
             } else {
                  return String(dateInput);
             }
        }
    } else if (dateInput instanceof Date) {
        dateToFormat = dateInput;
    } else {
        return 'Invalid Date Input';
    }
    if (!dateFnsIsValid(dateToFormat)) {
        if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            return dateInput;
        }
        return 'Invalid Date';
    }
    try { return format(dateToFormat, dateFormat); }
    catch (e) {
        return 'Error Formatting Date';
    }
  };

  const getFrontendQuoteLink = (quoteId: string) => {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/quote/${quoteId}`;
    }
    return `/quote/${quoteId}`;
  };

  const handleCopyLink = (quoteId: string) => {
    const linkToCopy = getFrontendQuoteLink(quoteId);
    navigator.clipboard.writeText(linkToCopy).then(() => {
      sonnerToast.success("Link Copied", { description: "Quote link copied to clipboard!", duration: 3000 });
    }).catch(() => {
      sonnerToast.error("Copy Failed", { description: "Could not copy link. Please try manually." });
    });
  };

  const navigationItems = [
    { name: 'Home', href: '/artist', icon: HomeIcon, view: 'home' },
    { name: 'Quotes', href: '/artist?view=quotes', icon: FileText, view: 'quotes' },
    { name: 'Analytics', href: '/artist?view=analytics', icon: LayoutDashboard, view: 'analytics' },
    { name: 'Profile', href: '/profile/artist', icon: UserIcon, view: 'profile' },
  ];

  const getStatusColorClasses = (status: FrontendQuote['displayStatus'] | undefined) => {
    switch (status) {
      case "Accepted": return "bg-green-900/70 text-green-300 border-green-700/50";
      case "Pending": return "bg-yellow-900/70 text-yellow-300 border-yellow-700/50";
      case "Booked": return "bg-blue-900/70 text-blue-300 border-blue-700/50";
      case "Completed": return "bg-purple-900/70 text-purple-300 border-purple-700/50";
      case "Cancelled": return "bg-neutral-700/70 text-neutral-400 border-neutral-600/50";
      case "Date Reached (Pending)": return "bg-orange-900/70 text-orange-300 border-orange-700/50";
      case "Overdue (Payment Pending)": return "bg-red-900/70 text-red-300 border-red-900/50";
      case "Overdue (Booked)": return "bg-red-900/70 text-red-300 border-red-900/50";
      default: return "bg-gray-700/70 text-gray-300 border-gray-600/50";
    }
  };

  const getQuoteBackgroundColor = (index: number) => {
    const colorIndex = index % QUOTE_BACKGROUND_COLORS.length;
    return `${QUOTE_BACKGROUND_COLORS[colorIndex]}20`;
  };

  const renderStars = (rating: number | null | undefined, size: "sm" | "md" = "md") => {
      const starClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
      const ratingValue = rating ?? 0;
      return (
          <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                  <Star
                      key={i}
                      className={`${starClass} ${i < ratingValue ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`}
                  />
              ))}
              {rating !== null && rating !== undefined && (
                   <span className={`text-gray-300 ml-1 ${size === "sm" ? 'text-xs' : 'text-sm'}`}>
                       ({rating.toFixed(1)}/5)
                   </span>
              )}
          </div>
      );
  };

    const renderAnalyticsSection = () => {
         const isLoading = quotesLoading || isRefreshingData;
         const hasError = quotesError || userError;
         const isAnyActionInProgress = isRefreshingData;
         
        const periodLabel = analyticsPeriod === 'all' ? 'All Time' :
                            analyticsPeriod === '7d' ? 'Last 7 Days' :
                            analyticsPeriod === '30d' ? 'Last 30 Days' :
                            analyticsPeriod === 'year' ? 'Last Year' :
                            'Custom Range';

         return (
             <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 shadow-lg mt-6 md:mt-8">
                <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center gap-2">
                       <LayoutDashboard className="h-5 w-5 text-pink-500" />
                        <CardTitle className="text-lg sm:text-xl text-pink-500">
                           Your Performance Metrics
                        </CardTitle>
                    </div>
                     <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod as any} disabled={isLoading || !!hasError || isAnyActionInProgress}>
                               <SelectTrigger className="w-full sm:w-[150px] bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-pink-500 focus:border-pink-500 text-xs">
                                   <Filter className="mr-2 h-3.5 w-3.5 text-gray-500" />
                                   <SelectValue placeholder="Select Period" />
                               </SelectTrigger>
                               <SelectContent className="bg-[#181818] border-[#3a3a3a] text-gray-200">
                                   <SelectItem value="all">All Time</SelectItem>
                                   <SelectItem value="7d">Last 7 Days</SelectItem>
                                   <SelectItem value="30d">Last 30 Days</SelectItem>
                                   <SelectItem value="year">Last Year</SelectItem>
                                   <SelectItem value="custom">Custom Range</SelectItem>
                               </SelectContent>
                           </Select>
                         {analyticsPeriod === 'custom' && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="date" variant={"outline"}
                                        className={`justify-start text-left font-normal w-full sm:w-[200px] bg-[#181818] border-[#3a3a3a] text-gray-200 hover:bg-[#1c1c1c] focus:ring-pink-500 focus:border-pink-500 text-xs ${!analyticsDateRange?.from && "text-gray-500"}`}
                                        disabled={isLoading || !!hasError || isAnyActionInProgress}>
                                        <CalendarDays className="mr-2 h-3.5 w-3.5 text-gray-500" />
                                        {analyticsDateRange?.from ? (analyticsDateRange.to ? (<>{format(analyticsDateRange.from, "LLL dd, y")} - {format(analyticsDateRange.to, "LLL dd, y")}</>) : (format(analyticsDateRange.from, "LLL dd, y") + ' - ...')) : (<span>Pick a date range</span>)}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#161616] border-[#2a2a2a] text-gray-200" align="end">
                                     <Calendar initialFocus mode="range" defaultMonth={analyticsDateRange?.from} selected={analyticsDateRange} onSelect={setAnalyticsDateRange} numberOfMonths={2}/>
                                </PopoverContent>
                             </Popover>
                         )}
                         <Button variant="ghost" size="icon" onClick={handleRefreshData} disabled={isLoading || isAnyActionInProgress} className={`h-8 w-8 text-gray-400 hover:bg-gray-800 hover:text-pink-500 transition-colors ${isLoading || isAnyActionInProgress ? 'opacity-50' : ''}`} aria-label="Refresh Data">
                            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-500"></div> : <RefreshCw className="h-4 w-4" />}
                         </Button>
                     </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:p-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full bg-[#2a2a2a] rounded-lg" />)}
                        </div>
                    ) : hasError ? (
                        <div className="text-center text-red-400 py-6 text-sm bg-red-900/20 p-4 rounded-md">
                            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                            <p className="font-semibold">Error loading analytics data.</p>
                            <p className="text-xs italic mt-1">{quotesError || userError}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                             <div className="text-sm text-gray-400 italic text-center">Data shown for: <span className="font-semibold text-gray-300">{periodLabel}</span></div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-sm">
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-pink-500/10 hover:border-pink-700/50 transition-all">
                                     <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-pink-400" /> Quotes Generated</CardTitle>
                                     <CardContent className="p-0 text-3xl font-bold text-pink-500">{quotesInPeriod.length}</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">Total quotes you created in this period.</p>
                                 </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-blue-500/10 hover:border-blue-700/50 transition-all">
                                     <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><BookMarked className="h-4 w-4 text-blue-400" /> Quotes Booked</CardTitle>
                                     <CardContent className="p-0 text-3xl font-bold text-blue-500">{bookedQuotesInPeriod.length}</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">Booked and paid quotes in this period.</p>
                                 </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-purple-500/10 hover:border-purple-700/50 transition-all">
                                     <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><CheckSquare className="h-4 w-4 text-purple-400" /> Quotes Completed</CardTitle>
                                     <CardContent className="p-0 text-3xl font-bold text-purple-500">{completedQuotesInPeriod.length}</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">Quotes marked as finished in this period.</p>
                                 </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-green-500/10 hover:border-green-700/50 transition-all">
                                     <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><IndianRupee className="h-4 w-4 text-green-400" /> Gross Revenue</CardTitle>
                                     <CardContent className="p-0 text-3xl font-bold text-green-500">₹{totalRevenueInPeriod.toFixed(2)}</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">Total price of completed quotes.</p>
                                 </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-pink-500/10 hover:border-pink-700/50 transition-all">
                                     <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-blue-400" /> Conversion Rate</CardTitle>
                                      <CardContent className="p-0 text-3xl font-bold text-blue-500">{quoteConversionRateInPeriod.toFixed(1)}%</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">Booked/Accepted/Completed quotes completed in period.</p>
                                 </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-yellow-500/10 hover:border-yellow-700/50 transition-all">
                                     <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><Star className="h-4 w-4 text-yellow-400" /> Avg. Rating</CardTitle>
                                     <CardContent className="p-0 text-3xl font-bold text-yellow-500">{averageRatingInPeriod != null ? averageRatingInPeriod.toFixed(1) : 'N/A'}</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">From {reviewsInPeriod.length} rated reviews in this period.</p>
                                 </Card>
                             </div>
                         </div>
                    )}
                 </CardContent>
             </Card>
            );
    };

    const renderProfileSnapshotSection = () => {
      if (!user) {
          return (
             <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
              <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                <Skeleton className="h-6 w-2/3 bg-[#2a2a2a]" />
              </CardHeader>
               <CardContent className="px-4 pb-4 sm:p-6 space-y-3 text-sm sm:text-base">
                 <div className="flex justify-center mb-3 sm:mb-4">
                   <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#2a2a2a]" />
                 </div>
                 <div className="text-center space-y-1">
                   <Skeleton className="h-5 w-1/2 bg-[#2a2a2a] mx-auto" />
                   <Skeleton className="h-4 w-2/3 bg-[#2a2a2a] mx-auto" />
                    {userError ? (
                        <p className="h-4 w-1/4 bg-[#2a2a2a] mx-auto mt-3"></p>
                     ) : (
                         <Skeleton className="h-4 w-1/4 bg-[#2a2a2a] mx-auto mt-3" />
                     )}
                 </div>
                  <Separator className="my-4 bg-[#2a2a2a]" />
                  <div className="space-y-2.5 text-xs sm:text-sm">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full bg-[#2a2a2a]" />)}
                  </div>
                   <Skeleton className="w-full h-10 bg-[#2a2a2a] mt-4" />
               </CardContent>
             </Card>
          );
      }

      return (
           <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
            <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
              <CardTitle className="text-lg sm:text-xl text-pink-600">Your Profile Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:p-6 space-y-3 text-sm sm:text-base">
              <div className="flex justify-center mb-3 sm:mb-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl">
                  <AvatarImage src={user.image || undefined} alt={user.name || user.email || "Artist Avatar"} />
                  <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center text-sm sm:text-base">
                 <p className="font-semibold text-white">{user.name || 'Your Name'}</p>
                 <p className="text-gray-400">{user.email}</p>
                  <div className="mt-3 flex flex-col items-center">
                     {quotesError ? (
                         <p className="text-gray-500 text-sm italic text-red-400 mt-2">Error loading reviews.</p>
                     ) : calculatedReviewCount > 0 && calculatedAverageRating !== null ? (
                         <div className="mt-2 flex items-center gap-1 text-yellow-400 text-base sm:text-lg">
                             {renderStars(calculatedAverageRating, "md")}
                              <span className="text-gray-500 text-sm">({calculatedReviewCount} review{calculatedReviewCount !== 1 ? 's' : ''})</span>
                         </div>
                     ) : (
                         <p className="text-gray-500 text-sm italic mt-2">No reviews yet for completed quotes.</p>
                     )}
                  </div>
              </div>
              <Separator className="my-4 bg-[#2a2a2a]" />
               <div className="space-y-2 text-xs sm:text-sm">
                   <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-500" /> <strong>Phone:</strong> {user.phone || 'N/A'}</div>
                   <div className="flex items-start gap-1"><BookOpen className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-1" /> <strong>Bio:</strong> <span className="text-gray-400 line-clamp-3">{user.bio || 'N/A'}</span></div>
                   <div className="flex items-start gap-1"><Star className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-1" /> <strong>Specialties:</strong> <span className="text-gray-400 line-clamp-3">{user.specialties || 'N/A'}</span></div>
               </div>
              <Button asChild variant="outline" className="w-full mt-4 h-10 border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white">
                <Link href="/profile/artist"><Edit3 className="mr-2 h-4 w-4" /> Full Profile</Link>
              </Button>
            </CardContent>
          </Card>
      );
  };

   const renderQuickActionsSection = () => {
       if (!user) {
           return (
               <Card className="bg-[#161616] border-[#2a2a2a] mt-6">
                   <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                       <Skeleton className="h-6 w-1/2 bg-[#2a2a2a]" />
                   </CardHeader>
                   <CardContent className="px-4 pb-4 sm:p-6">
                       <Skeleton className="w-full h-11 bg-[#2a2a2a]" />
                   </CardContent>
               </Card>
           );
       }
       const isSecurityReady = !!csrfToken;
       const isAnyActionInProgress = isCreatingQuote || !!isDeletingQuote || !!isCompletingQuote || !!isCancellingQuote || 
                                  isRaisingDispute || !!isDeletingDispute || isLoadingDisputeDetails || !!isClosingDispute || !!loadingDisputeVewButtonId || isRefreshingData;

       return (
            <Card className="bg-[#161616] border-[#2a2a2a]">
             <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
               <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-pink-600">
                 <FilePlus className="h-5 w-5 text-pink-600" /> Quick Actions
               </CardTitle>
             </CardHeader>
             <CardContent className="px-4 pb-4 sm:p-6">
                 <Button
                     className="w-full bg-pink-600 hover:bg-pink-700 text-white h-11 text-base"
                     disabled={!isSecurityReady || isAnyActionInProgress || isCreatingQuote}
                      onClick={() => setIsCreateQuoteDialogOpen(true)}
                 >
                      {!isSecurityReady ? 'Loading Security...' : (isCreatingQuote ? 'Processing...' : 'Generate Link for New Quote')}
                 </Button>
             </CardContent>
           </Card>
       );
   };

    const renderUpcomingAppointmentsSection = () => {
         if (!user || (quotesError && !artistQuotes.length)) {
             return (
                 <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 mt-6">
                     <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                          {quotesError ? <p className="text-red-400">Error Loading Appointments</p> : <Skeleton className="h-6 w-2/3 bg-[#2a2a2a]" />}
                     </CardHeader>
                     <CardContent className="px-4 pb-4 sm:p-6 space-y-4">
                          {quotesError ? (
                              <div className="text-center text-red-500 py-6 text-sm">
                                  <p>{quotesError}</p>
                              </div>
                          ) : (
                              <>
                                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full bg-[#2a2a2a] rounded-md" />)}
                                   <Skeleton className="w-full h-10 bg-[#2a2a2a] mt-4" />
                              </>
                          )}
                     </CardContent>
                 </Card>
             );
         }

         return (
              <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 mt-6">
                  <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                     <CardTitle className="text-lg sm:text-xl text-pink-600 flex items-center gap-2">
                         <CalendarDays className="h-5 w-5 text-pink-600" /> Upcoming Appointments
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:p-6 space-y-4">
                       {quotesError && <p className="text-center text-red-500 text-sm mb-4">{quotesError}</p>}
                       {upcomingQuotes.length === 0 && !quotesError ? (
                            <p className="text-center text-gray-500 py-6 text-sm">No upcoming appointments found in Booked/Date Reached/Overdue status.</p>
                       ) : (
                            <div className="space-y-3">
                                 {upcomingQuotes.map((quote, index) => (
                                      <div key={quote.id} className="border rounded-md p-3 text-gray-300 border-[#4a4a4a] text-sm"
                                           style={{ backgroundColor: getQuoteBackgroundColor(index) }}>
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                              <strong className="font-medium text-white truncate">{quote.productType}</strong>
                                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColorClasses(quote.displayStatus)}`}>
                                                 {quote.displayStatus}
                                              </span>
                                          </div>
                                          <div className="text-xs text-gray-400 space-y-0.5">
                                               <div className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5 text-gray-500" /> <strong>Customer:</strong> {quote.customerName || 'N/A'}</div>
                                               <div className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-gray-500" /> <strong>Date:</strong> {formatDateSafely(quote.serviceDate)}</div>
                                               <div className="flex items-center gap-1"><Clock4 className="h-3.5 w-3.5 text-gray-500" /> <strong>Time:</strong> {quote.serviceTime || 'N/A'}</div>
                                          </div>
                                           <Button asChild variant="outline" size="sm" className="mt-2 h-7 px-2 text-xs border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white">
                                               <Link href={`/quote/${quote.id}`}><Info className="mr-1 h-3.5 w-3.5" /> Details</Link>
                                           </Button>
                                      </div>
                                  ))}
                            </div>
                       )}
                        <Button asChild variant="outline" className="w-full mt-4 h-10 border-pink-600 bg-pink-700/30 text-pink-500 hover:bg-pink-700/50 hover:text-white">
                            <Link href="/artist?view=quotes"><FileText className="mr-2 h-4 w-4" /> View All Quotes</Link>
                        </Button>
                  </CardContent>
              </Card>
         );
    };

  const renderQuotesSection = () => {
       if (!user) {
           return (
               <>
                   <Card className="mb-6 bg-[#161616] border-[#2a2a2a]">
                     <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                        <Skeleton className="h-6 w-1/2 bg-[#2a2a2a]" />
                     </CardHeader>
                     <CardContent className="px-4 pb-4 sm:p-6 space-y-4">
                          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full bg-[#2a2a2a] rounded-lg" />)}
                     </CardContent>
                  </Card>
               </>
           );
       }

      if (user.role !== 'artist') {
          return null;
      }

      const isSecurityReady = !!csrfToken;
      const isAnyActionInProgress = isCreatingQuote || !!isDeletingQuote || !!isCompletingQuote || !!isCancellingQuote || 
                                  isRaisingDispute || !!isDeletingDispute || isLoadingDisputeDetails || !!isClosingDispute || !!loadingDisputeVewButtonId || isRefreshingData;

      return (
          <>
            <Card className="mb-6 bg-[#161616] border-[#2a2a2a]">
              <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-pink-600">
                  <FileText className="h-5 w-5 text-pink-600" /> Your Quotes List ({artistQuotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:p-6 space-y-4">
                 {quotesLoading ? (
                    <div className="space-y-4">
                       {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full bg-[#2a2a2a] rounded-lg" />)}
                    </div>
                 ) : quotesError ? (
                     <div className="text-center text-red-500 py-10">
                        <p><strong>Error:</strong> {quotesError}</p>
                        <p className="text-sm text-gray-400 mt-1">Please try refreshing or contact support if the issue persists.</p>
                     </div>
                 ) : artistQuotes.length === 0 ? (
                     <p className="text-center text-gray-500 py-10">You haven't created any quotes yet. Click "Generate Link for New Quote" on the Home tab to get started!</p>
                 ) : (
                  <div className="space-y-4">
                    {artistQuotes.map((quote, index) => (
                      <div key={quote.id}
                           className="border rounded-lg p-4 text-gray-300 border-[#4a4a4a] shadow-sm"
                           style={{ backgroundColor: getQuoteBackgroundColor(index) }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                           <div className="flex items-center gap-2 text-lg font-semibold text-white break-all">
                               <Package className="h-5 w-5 text-pink-300" /> {quote.productType}
                           </div>
                          <span
                            title={`Status: ${quote.displayStatus}`}
                            className={`text-xs font-medium px-2 py-1 rounded-full border ${
                               getStatusColorClasses(quote.displayStatus)}`}
                          >
                            {(quote.displayStatus === "Accepted" || quote.displayStatus === "Booked") && <CheckCircle className="inline h-3 w-3 mr-1" />}
                            {quote.displayStatus === "Pending" && <Clock className="inline h-3 w-3 mr-1" />}
                            {quote.displayStatus === "Completed" && <CheckSquare className="inline h-3 w-3 mr-1" />}
                            {quote.displayStatus === "Cancelled" && <CircleX className="inline h-3 w-3 mr-1" />}
                            {(quote.displayStatus === "Overdue (Payment Pending)" || quote.displayStatus === "Overdue (Booked)" || quote.displayStatus === "Date Reached (Pending)") && <AlertCircle className="inline h-3 w-3 mr-1" />}
                            {quote.displayStatus}
                          </span>
                        </div>

                        {quote.review && (
                            <div className="mt-3 mb-3 border-t border-b border-yellow-700/50 py-3 text-sm text-gray-400 bg-yellow-900/10 rounded-md p-3">
                                 <h4 className="font-semibold flex items-center gap-1.5 mb-2 text-yellow-300">
                                     <Star className="h-4 w-4 text-yellow-400" /> Customer Review:
                                 </h4>
                                 <div className="space-y-2">
                                     <div className="flex items-center gap-1 text-yellow-400">
                                          <strong className="text-gray-300">Rating:</strong>
                                          {renderStars(quote.review.rating)}
                                     </div>
                                     {quote.review.comment && (
                                         <div>
                                              <strong className="text-gray-300 block mb-0.5">Comment:</strong>
                                              <p className="text-gray-400 whitespace-pre-wrap">{quote.review.comment}</p>
                                         </div>
                                     )}
                                      {!quote.review.comment && (
                                          <p className="text-gray-500 italic text-xs">No comment provided.</p>
                                      )}
                                 </div>
                             </div>
                        )}

                        {quote.customerId && (
                            <div className="mt-3 mb-3 border-t border-b border-[#4a4a4a] py-3 text-sm text-gray-400">
                                <h4 className="font-semibold flex items-center gap-1.5 mb-1.5 text-pink-300">
                                    <UserRound className="h-4 w-4" /> Customer Details (Accepted By):
                                </h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                                    {quote.customerName && <p className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 text-gray-500" /> <strong>Name:</strong> {quote.customerName}</p>}
                                    {quote.customerPhone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-500" /> <strong>Phone:</strong> {quote.customerPhone}</p>}
                                    {(quote.customerAddress || quote.customerCity || quote.customerState || quote.customerZipCode || quote.customerCountry) && (
                                        <p className="col-span-full flex items-start gap-1.5">
                                            <HomeIcon className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" /> <strong>Address:</strong>
                                            <span>
                                                {[quote.customerAddress, quote.customerCity, quote.customerState, quote.customerZipCode, quote.customerCountry]
                                                    .filter(Boolean).join(', ') || 'N/A'}
                                            </span>
                                        </p>
                                    )}
                                    {quote.customerGender && <p className="flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5 text-gray-500" /> <strong>Gender:</strong> {quote.customerGender}</p>}
                                    {quote.customerHeight !== null && quote.customerHeight !== undefined && <p className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5 text-gray-500" /> <strong>Height:</strong> {quote.customerHeight} cm</p>}
                                    {quote.customerWeight !== null && quote.customerWeight !== undefined && <p className="flex items-center gap-1.5"><Weight className="h-3.5 w-3.5 text-gray-500" /> <strong>Weight:</strong> {quote.customerWeight} kg</p>}
                                    {quote.customerColor && <p className="flex items-center gap-1.5"><Droplet className="h-3.5 w-3.5 text-gray-500" /> <strong>Skin:</strong> {quote.customerColor}</p>}
                                    {quote.customerEthnicity && <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gray-500" /> <strong>Ethnicity:</strong> {quote.customerEthnicity}</p>}
                                    {quote.customerAge !== null && quote.customerAge !== undefined && <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-500" /> <strong>Age:</strong> {quote.customerAge}</p>}
                                    {Array.isArray(quote.customerBookingPreferences) && quote.customerBookingPreferences.length > 0 && (
                                        <p className="col-span-full flex items-start gap-1.5">
                                            <Info className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" /> <strong>Preferences:</strong> {quote.customerBookingPreferences.join(', ')}
                                         </p>
                                    )}
                                 </div>
                            </div>
                        )}

                         {quote.disputes && quote.disputes.length > 0 && (
                              <div className="mt-3 mb-3 border-t border-b border-red-700/50 py-3 text-sm text-gray-400 bg-red-900/10 rounded-md p-3">
                                  <h4 className="font-semibold flex items-center gap-1.5 mb-2 text-red-400">
                                      <TriangleAlert className="h-4 w-4 text-red-400" /> Associated Disputes:
                                  </h4>
                                   <ScrollArea className="max-h-[200px]">
                                       <div className="space-y-2.5 text-xs pr-2">
                                           {quote.disputes.map(dispute => (
                                               <div key={dispute.id} className={`p-2.5 rounded-lg border ${getDisputeStatusColorClasses(dispute.status)}`}>
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <p className="font-semibold text-gray-100 flex items-center gap-1.5 text-sm break-words">
                                                            <TriangleAlert className={`h-4 w-4 ${dispute.status === 'Open' ? 'text-red-400' : dispute.status === 'Under Review' ? 'text-orange-400' : 'text-gray-400'}`} />
                                                            {dispute.reason}
                                                        </p>
                                                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${getDisputeStatusColorClasses(dispute.status)}`}>
                                                            {dispute.status}
                                                        </span>
                                                    </div>
                                                    {dispute.details && <p className="text-gray-300 mt-1 text-xs whitespace-pre-wrap break-words leading-relaxed bg-[#202020]/30 p-1.5 rounded-md">Details: {dispute.details.length > 100 ? dispute.details.substring(0, 97) + "..." : dispute.details}</p>}
                                                    <p className="text-gray-400 text-[10px] mt-1.5 opacity-70">ID: {dispute.id}</p>
                                                     <div className="flex flex-wrap gap-2 mt-2.5">
                                                         <Button
                                                             variant="outline"
                                                             size="sm"
                                                             onClick={() => handleViewDisputeDetails(dispute.id)}
                                                             className="border-gray-500 text-gray-400 bg-transparent hover:bg-gray-800/50 hover:text-white transition-colors flex items-center gap-1 h-7 px-2 text-xs"
                                                             disabled={loadingDisputeVewButtonId === dispute.id || isAnyActionInProgress}
                                                         >
                                                             {loadingDisputeVewButtonId === dispute.id ? <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-gray-400 mr-1"></div> : <Info className="h-3 w-3" />}
                                                              View Details
                                                         </Button>

                                                         {user && dispute.initiatorId === user.id && dispute.status === 'Open' && (
                                                             <AlertDialog>
                                                                  <AlertDialogTrigger asChild>
                                                                      <Button
                                                                          variant="outline"
                                                                          size="sm"
                                                                          disabled={isClosingDispute === dispute.id || !isSecurityReady || isAnyActionInProgress}
                                                                          className="border-orange-500 text-orange-500 bg-transparent hover:bg-orange-900/30 hover:text-orange-400 transition-colors flex items-center gap-1 h-7 px-2 text-xs"
                                                                      >
                                                                          {isClosingDispute === dispute.id ? <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-orange-500 mr-1"></div> : <CircleX className="h-3 w-3" />}
                                                                          Close Dispute
                                                                      </Button>
                                                                  </AlertDialogTrigger>
                                                                  <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a]">
                                                                      <AlertDialogHeader>
                                                                           <AlertDialogTitle className="text-pink-500">Close Dispute?</AlertDialogTitle>
                                                                           <AlertDialogDescription className="text-gray-400">
                                                                                Are you sure you want to close this dispute? This marks it as resolved by you. This action cannot be undone.
                                                                           </AlertDialogDescription>
                                                                      </AlertDialogHeader>
                                                                      <AlertDialogFooter>
                                                                           <AlertDialogCancel className="border-[#4a4a4a] bg-[#4a4a4a] text-white hover:bg-[#2a3a3a] hover:text-white transition-colors">Cancel</AlertDialogCancel>
                                                                           <AlertDialogAction onClick={() => handleCloseDispute(quote.id, dispute.id)} className="bg-orange-600 text-white hover:bg-orange-700 transition-colors">
                                                                                Confirm Close
                                                                           </AlertDialogAction>
                                                                      </AlertDialogFooter>
                                                                  </AlertDialogContent>
                                                              </AlertDialog>
                                                         )}

                                                         {user && dispute.initiatorId === user.id && (dispute.status === 'Open' || dispute.status === 'Closed') && (
                                                             <AlertDialog>
                                                                  <AlertDialogTrigger asChild>
                                                                      <Button
                                                                          variant="destructive"
                                                                          size="sm"
                                                                          disabled={isDeletingDispute === dispute.id || !isSecurityReady || isAnyActionInProgress}
                                                                          className="bg-red-600/80 hover:bg-red-700 text-white transition-colors flex items-center gap-1 h-7 px-2 text-xs"
                                                                      >
                                                                          {isDeletingDispute === dispute.id ? <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-1"></div> : <Trash2 className="h-3 w-3" />}
                                                                          Delete
                                                                      </Button>
                                                                  </AlertDialogTrigger>
                                                                  <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a]">
                                                                      <AlertDialogHeader>
                                                                           <AlertDialogTitle className="text-pink-500">Delete Dispute?</AlertDialogTitle>
                                                                           <AlertDialogDescription className="text-gray-400">
                                                                                Are you sure you want to delete this dispute? This action cannot be undone.
                                                                           </AlertDialogDescription>
                                                                      </AlertDialogHeader>
                                                                      <AlertDialogFooter>
                                                                           <AlertDialogCancel className="border-[#4a4a4a] bg-[#4a4a4a] text-white hover:bg-[#2a3a3a] hover:text-white transition-colors">Cancel</AlertDialogCancel>
                                                                           <AlertDialogAction onClick={() => handleDeleteDispute(quote.id, dispute.id)} className="bg-red-600 text-white hover:bg-red-700 transition-colors">
                                                                                Confirm Delete
                                                                           </AlertDialogAction>
                                                                      </AlertDialogFooter>
                                                                  </AlertDialogContent>
                                                              </AlertDialog>
                                                         )}
                                                     </div>
                                               </div>
                                           ))}
                                       </div>
                                        <ScrollBar orientation="vertical" />
                                   </ScrollArea>
                              </div>
                         )}

                        <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap">{quote.details}</p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
                             <div className="flex items-center gap-1"><IndianRupee className="h-4 w-4 text-gray-500" /><strong>Price:</strong> ₹{quote.price}</div>
                             <div className="flex items-center gap-1"><CalendarDays className="h-4 w-4 text-gray-500" /><strong>Date:</strong> {formatDateSafely(quote.serviceDate)}</div>
                             <div className="flex items-center gap-1"><Clock4 className="h-4 w-4 text-gray-500" /><strong>Time:</strong> {quote.serviceTime || 'N/A'}</div>
                             <div className="flex items-center gap-1 col-span-1 sm:col-span-2 flex-wrap">
                                 <Clock className="h-4 w-4 text-gray-500" />
                                 <span className="mr-2"><strong>Created:</strong> {formatDateSafely(quote.createdAt)}</span>
                                 <span><strong>Updated:</strong> {formatDateSafely(quote.updatedAt)}</span>
                             </div>
                         </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            {(quote.status === 'Pending' || quote.displayStatus === 'Date Reached (Pending)' || quote.displayStatus === 'Overdue (Payment Pending)' || quote.displayStatus === 'Overdue (Booked)') && quote.customerId === null && (
                                 <Button variant="outline" size="sm" onClick={() => handleCopyLink(quote.id)}
                                  disabled={!isSecurityReady || isAnyActionInProgress}
                                  className=" bg-pink-600/20 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white transition-colors">
                                  <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Link
                                 </Button>
                            )}

                             {quote.status === 'Booked' && (
                                  <Button variant="secondary" size="sm" onClick={() => handleMarkAsCompleted(quote.id)}
                                     disabled={isCompletingQuote === quote.id || !isSecurityReady || isAnyActionInProgress}
                                     className="bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                                      {isCompletingQuote === quote.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> : <CheckSquare className="mr-2 h-4 w-4" />}
                                      {isCompletingQuote === quote.id ? 'Completing...' : 'Mark as Completed'}
                                  </Button>
                             )}

                             {quote.status === 'Pending' && quote.customerId === null && (
                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="destructive" size="sm"
                                            disabled={isDeletingQuote === quote.id || !isSecurityReady || isAnyActionInProgress}
                                            className="bg-red-600/80 hover:bg-red-700 text-white transition-colors">
                                              {isDeletingQuote === quote.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> : <Trash2 className="mr-2 h-4 w-4" />}
                                              Delete
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a]">
                                          <AlertDialogHeader>
                                              <AlertDialogTitle className="text-pink-500">Delete Quote?</AlertDialogTitle>
                                              <AlertDialogDescription className="text-gray-400">
                                                  This permanently removes the quote. This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel className="border-[#4a4a4a] bg-[#4a4a4a] text-white hover:bg-[#2a3a3a] hover:text-white transition-colors">Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)} className="bg-red-600 text-white hover:bg-red-700 transition-colors">
                                                   Confirm Delete
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                             )}

                              {(quote.status === 'Pending' || quote.status === 'Accepted' || quote.status === 'Booked') && (
                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="outline" size="sm"
                                            disabled={isCancellingQuote === quote.id || !isSecurityReady || isAnyActionInProgress}
                                            className="border-red-500 text-red-500 bg-transparent hover:bg-red-900/30 hover:text-red-400 transition-colors">
                                              {isCancellingQuote === quote.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500 mr-2"></div> : <CircleX className="mr-2 h-4 w-4" />}
                                              Cancel
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a]">
                                          <AlertDialogHeader>
                                              <AlertDialogTitle className="text-pink-500">Cancel Quote?</AlertDialogTitle>
                                              <AlertDialogDescription className="text-gray-400">
                                                  Are you sure you want to cancel this quote? This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel className="border-[#4a4a4a] bg-[#4a4a4a] text-white hover:bg-[#2a3a3a] hover:text-white transition-colors">Go Back</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleCancelQuote(quote.id)} className="bg-red-600 text-white hover:bg-red-700 transition-colors">
                                                   Confirm Cancel
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              )}

                             {user && (quote.status === 'Accepted' || quote.status === 'Booked' || quote.status === 'Completed') && quote.customerId && !quote.disputes?.some(d => d.status !== 'Closed' && d.status !== 'Resolved') && (
                                 <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => handleOpenRaiseDisputeDialog(quote.id)}
                                     disabled={!isSecurityReady || isAnyActionInProgress}
                                     className="border-red-500 text-red-500 bg-transparent hover:bg-red-900/30 hover:text-red-400 transition-colors flex items-center gap-1"
                                 >
                                     <TriangleAlert className="h-4 w-4" /> Raise Dispute
                                 </Button>
                             )}
                              {quote.disputes && quote.disputes.some(d => d.status !== 'Closed' && d.status !== 'Resolved') && (
                                   <Button
                                       variant="outline"
                                       size="sm"
                                       disabled 
                                       className="border-orange-500 text-orange-500 bg-transparent hover:bg-orange-900/30 hover:text-orange-400 transition-colors flex items-center gap-1 opacity-70 cursor-not-allowed"
                                       title="An active dispute already exists for this quote."
                                   >
                                       <TriangleAlert className="h-4 w-4" /> Active Dispute
                                   </Button>
                               )}

                             <Button asChild variant="outline" size="sm" className="border-[#4a4a4a] bg-[#2a2a2a]/50 text-gray-400 hover:bg-[#4a4a4a]/70 hover:text-white transition-colors">
                                 <Link href={`/quote/${quote.id}`}>View Details</Link>
                             </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                 )}
              </CardContent>
            </Card>
          </>
      );
  };

    const renderFullProfileSection = () => {
        if (!user) {
             return (
                  <>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4">
                           <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
                             <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                               <Skeleton className="h-6 w-2/3 bg-[#2a2a2a]" />
                             </CardHeader>
                              <CardContent className="px-4 pb-4 sm:p-6 space-y-3 text-sm sm:text-base">
                                 <div className="flex justify-center mb-3 sm:mb-4">
                                   <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#2a2a2a]" />
                                 </div>
                                 <div className="text-center space-y-1">
                                   <Skeleton className="h-5 w-1/2 bg-[#2a2a2a] mx-auto" />
                                   <Skeleton className="h-4 w-2/3 bg-[#2a2a2a] mx-auto" />
                                    {userError ? (
                                        <p className="h-4 w-1/4 bg-[#2a2a2a] mx-auto mt-3"></p>
                                     ) : (
                                         <Skeleton className="h-4 w-1/4 bg-[#2a2a2a] mx-auto mt-3" />
                                     )}
                                 </div>
                                  <Separator className="my-4 bg-[#2a2a2a]" />
                                  <div className="space-y-2.5 text-xs sm:text-sm">
                                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full bg-[#2a2a2a]" />)}
                                  </div>
                                   <Skeleton className="w-full h-10 bg-[#2a2a2a] mt-3" />
                               </CardContent>
                           </Card>
                           <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
                                <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                                  <Skeleton className="h-6 w-2/3 bg-[#2a2a2a]" />
                                </CardHeader>
                                <CardContent className="px-4 pb-4 sm:p-6 space-y-3 text-sm sm:text-base">
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                                      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full bg-[#2a2a2a]" />)}
                                    </div>
                                    <Separator className="my-3 bg-[#2a2a2a]" />
                                     <div className="space-y-2.5">
                                         {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full bg-[#2a2a2a]" />)}
                                     </div>
                                </CardContent>
                           </Card>
                       </div>
                        {renderPortfolioSection()}
                 </>
             );
        }

       if (user.role !== 'artist') {
           return null;
       }

       return (
           <>
                 <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Artist Profile</h1>
                    <p className="text-gray-400 text-sm sm:text-base">View and manage your public profile.</p>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 md:mb-8">
                    <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
                        <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                            <CardTitle className="text-lg sm:text-xl text-pink-600">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 sm:p-6 space-y-3 text-sm sm:text-base">
                            <div className="flex justify-center mb-3 sm:mb-4">
                                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl">
                                    <AvatarImage src={user.image || undefined} alt={user.name || user.email || "Artist Avatar"} />
                                    <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="text-center text-sm sm:text-base">
                                <p className="font-semibold text-white">{user.name || 'Your Name'}</p>
                                <p className="text-gray-400">{user.email}</p>
                            </div>
                            <Button asChild variant="outline" className="w-full mt-4 h-10 border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white">
                                <Link href="/profile/artist#basic"><Edit3 className="mr-2 h-4 w-4" /> Edit Basic Info</Link>
                            </Button>
                            <Separator className="my-4 bg-[#2a2a2a]" />
                            <div className="space-y-2 text-xs sm:text-sm">
                                <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-500" /> <strong>Phone:</strong> {user.phone || 'N/A'}</div>
                                 <div className="flex items-start gap-1"><BookOpen className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-1" /> <strong>Bio:</strong> <span className="text-gray-400 whitespace-pre-wrap">{user.bio || 'N/A'}</span></div>
                                 <div className="flex items-start gap-1"><Star className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-1" /> <strong>Specialties:</strong> <span className="text-gray-400 whitespace-pre-wrap">{user.specialties || 'N/A'}</span></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
                         <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                            <CardTitle className="text-lg sm:text-xl text-pink-600">Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 sm:p-6 space-y-3 text-sm sm:text-base">
                             <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs sm:text-sm">
                                <div className="flex items-center gap-1 col-span-full"><Briefcase className="h-3.5 w-3.5 text-gray-500" /><strong>Services:</strong> {(Array.isArray(user.services) && user.services.length > 0) ? user.services.join(', ') : 'N/A'}</div>
                                <div className="flex items-center gap-1 col-span-full"><Map className="h-3.5 w-3.5 text-gray-500" /><strong>Locations:</strong> {(Array.isArray(user.availableLocations) && user.availableLocations.length > 0) ? user.availableLocations.join(', ') : 'N/A'}</div>
                                 <div className="flex items-start gap-1 col-span-full">
                                     <Info className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-0.5" />
                                     <div>
                                         <strong>Booking Info:</strong> <span className="text-gray-400 whitespace-pre-wrap">{(Array.isArray(user.bookingInfo) && user.bookingInfo.length > 0) ? user.bookingInfo.join('\n') : 'N/A'}</span>
                                     </div>
                                 </div>
                                {user.portfolioLink && (
                                    <div className="flex items-start gap-1 col-span-full">
                                         <LinkIconOriginal className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-0.5" />
                                         <div>
                                              <strong>Portfolio Link:</strong>
                                              <a href={user.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline break-all ml-1">
                                                  {user.portfolioLink}
                                              </a>
                                         </div>
                                    </div>
                                )}
                             </div>
                              <Button asChild variant="outline" className="w-full mt-4 h-10 border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white">
                                <Link href="/profile/artist#additional"><Edit3 className="mr-2 h-4 w-4" /> Edit Additional Info</Link>
                              </Button>
                              <Separator className="my-4 bg-[#2a2a2a]" />
                               <div className="space-y-2 text-xs sm:text-sm">
                                   <div className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5 text-gray-500" /><strong>Height:</strong> {user.height ? `${user.height} cm` : 'N/A'}</div>
                                   <div className="flex items-center gap-1"><Weight className="h-3.5 w-3.5 text-gray-500" /><strong>Weight:</strong> {user.weight ? `${user.weight} kg` : 'N/A'}</div>
                                   <div className="flex items-center gap-1"><Droplet className="h-3.5 w-3.5 text-gray-500" /><strong>Skin Color:</strong> {user.color || 'N/A'}</div>
                                   <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-500" /><strong>Ethnicity:</strong> {user.ethnicity || 'N/A'}</div>
                                   <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-500" /><strong>Age:</strong> {user.age ? `${user.age} years` : 'N/A'}</div>
                                    {user.other && (
                                        <div className="flex items-start gap-1 col-span-full">
                                            <Tag className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <strong>Other:</strong> <span className="text-gray-400 whitespace-pre-wrap">{user.other}</span>
                                            </div>
                                        </div>
                                    )}
                               </div>
                              <Button asChild variant="outline" className="w-full mt-4 h-10 border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white">
                                <Link href="/profile/artist#personal"><Edit3 className="mr-2 h-4 w-4" /> Edit Personal Details</Link>
                              </Button>
                        </CardContent>
                    </Card>
                </div>

                {renderPortfolioSection()}
                {renderAnalyticsSection()}
           </>
       );
   };

   const MobileViewContent = () => {
        const searchParams = nextUseSearchParams();
        const mobileView = searchParams.get('view');
        const currentMobileView = mobileView || 'home';

        const validViews = ['home', 'quotes', 'profile', 'analytics'];

        if (!user) {
             return (
                 <>
                      {currentMobileView === 'home' && (
                          <>
                               <div className="mb-6 md:mb-8">
                                   <Skeleton className="h-6 w-3/4 bg-[#2a2a2a] mb-2" />
                                   <Skeleton className="h-4 w-1/2 bg-[#2a2a2a]" />
                                </div>
                              {renderProfileSnapshotSection()}
                              {renderQuickActionsSection()}
                              {renderUpcomingAppointmentsSection()}
                              {renderPortfolioSection()}
                          </>
                      )}
                       {currentMobileView === 'quotes' && (
                           <>
                                <div className="mb-4">
                                   <Skeleton className="h-6 w-1/2 bg-[#2a2a2a] mb-2" />
                                   <Skeleton className="h-4 w-1/3 bg-[#2a2a2a]" />
                                </div>
                                {renderQuickActionsSection()}
                                {renderQuotesSection()}
                           </>
                       )}
                       {currentMobileView === 'analytics' && (
                            <>
                                <div className="mb-4">
                                   <Skeleton className="h-6 w-1/2 bg-[#2a2a2a] mb-2" />
                                   <Skeleton className="h-4 w-1/3 bg-[#2a2a2a]" />
                                </div>
                               {renderAnalyticsSection()}
                            </>
                       )}
                        {currentMobileView === 'profile' && (
                           <>
                                <div className="mb-4">
                                   <h1 className="text-xl font-bold text-white">Your Profile</h1>
                                   <p className="text-gray-400 text-sm">View and manage your public profile.</p>
                                </div>
                               {renderFullProfileSection()}
                           </>
                        )}
                     {(!validViews.includes(currentMobileView)) && (
                            <>
                               <div className="mb-6 md:mb-8">
                                   <Skeleton className="h-6 w-3/4 bg-[#2a2a2a] mb-2" />
                                   <Skeleton className="h-4 w-1/2 bg-[#2a2a2a]" />
                                </div>
                              {renderProfileSnapshotSection()}
                              {renderQuickActionsSection()}
                              {renderUpcomingAppointmentsSection()}
                              {renderPortfolioSection()}
                          </>
                       )}
                 </>
             );
        }

        switch (currentMobileView) {
            case 'home':
                if (pathname !== '/artist' || (pathname === '/artist' && mobileView && mobileView !== 'home') ) { 
                     router.replace('/artist');
                     return null; 
                 }
                return (
                    <>
                         <div className="mb-6 md:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome, {user?.name || 'Artist'}!</h1>
                            <p className="text-gray-400 text-sm sm:text-base">Overview of your dashboard.</p>
                         </div>
                        {renderProfileSnapshotSection()}
                        {renderQuickActionsSection()}
                        {renderUpcomingAppointmentsSection()}
                        {renderPortfolioSection()}
                    </>
                );
            case 'quotes':
                 if (pathname !== '/artist' ) {
                     router.replace('/artist?view=quotes');
                     return null;
                 }
                return (
                     <>
                         <div className="mb-4">
                            <h1 className="text-xl font-bold text-white">Your Quotes</h1>
                            <p className="text-gray-400 text-sm">Create and manage client quotes.</p>
                         </div>
                         {renderQuickActionsSection()}
                         {renderQuotesSection()}
                     </>
                );
            case 'analytics':
                 if (pathname !== '/artist' ) {
                     router.replace('/artist?view=analytics');
                     return null;
                 }
                 return (
                    <>
                        <div className="mb-4">
                           <h1 className="text-xl font-bold text-white">Your Analytics</h1>
                           <p className="text-gray-400 text-sm">Track your performance over time.</p>
                        </div>
                        {renderAnalyticsSection()}
                    </>
                 );
            case 'profile':
                 if (pathname !== '/profile/artist') { 
                     router.replace('/profile/artist'); 
                     return null;
                 }
                return (
                  <>
                       <div className="mb-4">
                           <h1 className="text-xl font-bold text-white">Your Profile</h1>
                           <p className="text-gray-400 text-sm">View and manage your public profile.</p>
                        </div>
                     {renderFullProfileSection()}
                  </>
                );
            default:
                 if (pathname !== '/artist' || mobileView) {
                     router.replace('/artist');
                     return null;
                 }
                 return (
                    <>
                         <div className="mb-6 md:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome, {user?.name || 'Artist'}!</h1>
                            <p className="text-gray-400 text-sm sm:text-base">Overview of your dashboard.</p>
                         </div>
                        {renderProfileSnapshotSection()}
                        {renderQuickActionsSection()}
                        {renderUpcomingAppointmentsSection()}
                        {renderPortfolioSection()}
                    </>
                 );
        }
   };

  if (userError) {
       return (
           <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-4 text-center">
                <UserIcon className="h-16 w-16 text-red-600 mb-4" />
                <p className="text-xl font-semibold mb-2">Access Error</p>
                <p className="text-base mb-6">{userError}</p>
                 {userError.includes("Access denied") || userError.includes("Authentication Required") || userError.includes("Failed to load user data") || userError.includes("Session expired") ? (
                      <Button onClick={() => router.push('/login')} className="bg-pink-600 hover:bg-pink-700 text-white">Go to Login</Button>
                 ) : (
                      <Button onClick={() => window.location.reload()} className="bg-pink-600 hover:bg-pink-700 text-white">Retry</Button>
                 )}
           </div>
       );
   }

    if (!user && !userError) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-400 p-4">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-600 mb-3"></div>
               <p>Loading user data or redirecting...</p>
           </div>
         );
    }

    if (!user) { 
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 text-center">
                <p>An unexpected error occurred. Please try <Button variant="link" onClick={() => router.push('/login')} className="text-pink-500 p-0 h-auto inline">logging in</Button> again or refresh the page.</p>
            </div>
        );
    }

  return (
    <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
      <header className="bg-black shadow-md sticky top-0 z-50 border-b border-[#2a2a2a]">
        <div className="container mx-auto flex items-center justify-between h-16 px-3 md:px-6">
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-pink-600" />
            <span className="font-bold text-lg md:text-xl text-white">Artist Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-gray-800 transition-colors relative"
                        disabled={!user || isCommunicationLoading}
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5 text-pink-600" />
                        {communicationHistory.length > 0 && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-black animate-pulse" />
                        )}
                        <span className="sr-only">Notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 md:w-96 bg-[#161616] text-white border-[#2a2a2a] shadow-xl p-0">
                    <DropdownMenuLabel className="text-pink-500 font-semibold px-4 py-3 border-b border-[#2a2a2a] flex justify-between items-center">
                        Communication History
                        <Button variant="ghost" size="icon" onClick={handleRefreshData} disabled={isCommunicationLoading || isRefreshingData} className="h-6 w-6 text-gray-400 hover:bg-gray-800 hover:text-pink-500 transition-colors" aria-label="Refresh Data">
                            {isCommunicationLoading || isRefreshingData ? <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-pink-500"></div> : <RefreshCw className="h-3 w-3" />}
                        </Button>
                    </DropdownMenuLabel>
                    <ScrollArea className="h-64">
                        {isCommunicationLoading ? (
                            <div className="flex flex-col items-center justify-center p-4 space-y-2">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-[#2a2a2a] rounded-md" />)}
                            </div>
                        ) : communicationHistory.length === 0 ? (
                            <div className="text-center text-gray-500 p-4 text-sm">No recent alerts found.</div>
                        ) : (
                            communicationHistory.map((alert) => (
                                <DropdownMenuItem key={alert.id} asChild className="p-0 hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] cursor-pointer transition-colors">
                                    <Link href={`/quote/${alert.quoteId}`} className="flex items-start gap-3 px-4 py-3 w-full text-xs border-b border-[#2a2a2a]/50">
                                        {alert.type === 'SMS' ? <Send className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" /> : <Mail className="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />}
                                        <div className="flex flex-col">
                                            <p className="font-medium text-white break-words">
                                                {alert.action}
                                                <span className={`ml-1 px-1 py-0.5 rounded-full text-[9px] font-semibold ${alert.type === 'SMS' ? 'bg-blue-900/50 text-blue-300' : 'bg-pink-900/50 text-pink-300'}`}>
                                                    {alert.recipient} {alert.type}
                                                </span>
                                            </p>
                                            <p className="text-gray-400 mt-0.5 leading-tight line-clamp-2">{alert.details}</p>
                                            <span className="text-gray-500 text-[10px] mt-1">{formatDistanceToNow(parseISO(alert.timestamp), { addSuffix: true })}</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            ))
                        )}
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="p-0 rounded-full h-9 w-9 focus-visible:ring-2 focus-visible:ring-pink-600"
                    disabled={!user}
                 >
                    <Avatar className="cursor-pointer h-9 w-9">
                    {user ? (
                         <>
                             <AvatarImage src={user.image || undefined} alt={user.name || user.email || "Artist Avatar"} />
                             <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(user.name)}</AvatarFallback>
                         </>
                    ) : (
                         <AvatarFallback className="bg-gray-800 text-gray-500 border border-gray-700 animate-pulse">A</AvatarFallback>
                    )}
                    </Avatar>
                </Button>
              </DropdownMenuTrigger>
              {user && (
                <DropdownMenuContent align="end" className="w-56 bg-[#161616] text-white border-[#2a2a2a] shadow-xl">
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate text-white">{user.name || "Artist"}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-pink-600 hover:!bg-gray-700 hover:!text-pink-500 cursor-pointer transition-colors">
                    <Link href="/profile/artist"><UserIcon className="mr-2 h-4 w-4" />Edit Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-400 focus:bg-red-950 hover:!bg-red-800 hover:!text-red-400 cursor-pointer transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
               )}
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 text-gray-300">
        <div className="md:hidden">
            <Suspense fallback={
                 <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] bg-black text-gray-400 p-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-600 mb-3"></div>
                    <p>Loading mobile view...</p>
                </div>
            }>
                <MobileViewContent />
            </Suspense>
        </div>

        <div className="hidden md:block">
            <div className="mb-6 md:mb-8">
               <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome, {user?.name || 'Artist'}!</h1>
               <p className="text-gray-400 text-sm sm:text-base">Overview of your dashboard.</p>
            </div>
            {renderProfileSnapshotSection()}
            <div className="mt-6 md:mt-8">
                {renderQuickActionsSection()}
            </div>
            {renderAnalyticsSection()}
            {renderUpcomingAppointmentsSection()}
            <div className="mt-6 md:mt-8">
                 {renderQuotesSection()}
            </div>
            <div className="mt-6 md:mt-8">
                 {renderPortfolioSection()}
            </div>
         </div>
      </main>

        <Dialog open={isCreateQuoteDialogOpen} onOpenChange={(isOpen) => {
           setIsCreateQuoteDialogOpen(isOpen);
           if (!isOpen) resetCreateQuoteForm();
        }}>
          <DialogContent className="sm:max-w-md bg-[#101010] text-white border-[#2a2a2a]">
            <DialogHeader className="border-b border-[#2a2a2a] pb-4">
              <DialogTitle className="text-pink-500 text-xl">Create New Quote</DialogTitle>
              <DialogDescription className="text-gray-400">
                Fill details to create a quote. Share the link for customers to accept.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="productType" className="text-right text-gray-400">Type</Label>
                <Select onValueChange={(value) => {
                    setNewQuoteProductType(value); if (value !== 'Other') setNewQuoteOtherProductType('');
                }} value={newQuoteProductType} disabled={isCreatingQuote}>
                  <SelectTrigger id="productType" className="col-span-3 bg-[#2a2a2a] text-white border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] text-gray-300 border-[#4a4a3a] border py-1">
                     {productTypes.map(type => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-[#3a3a3a] focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-[#383838] hover:text-white"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newQuoteProductType === 'Other' && (
                   <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="otherProductType" className="text-right text-gray-400">Specify</Label>
                       <Input id="otherProductType" value={newQuoteOtherProductType}
                           onChange={(e) => setNewQuoteOtherProductType(e.target.value)}
                           className="col-span-3 bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600"
                           placeholder="e.g., Custom Design" disabled={isCreatingQuote} />
                   </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="details" className="text-right text-gray-400">Details</Label>
                <Textarea id="details" value={newQuoteDetails} onChange={(e) => setNewQuoteDetails(e.target.value)}
                  className="col-span-3 bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600 min-h-[80px]"
                  placeholder="Describe the service or artwork..." disabled={isCreatingQuote} />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right text-gray-400">Price (₹)</Label>
                <Input id="price" type="number" value={newQuotePrice}
                  onChange={(e) => setNewQuotePrice(e.target.value)}
                  className="col-span-3 bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600"
                  placeholder="e.g., 1500" min="0" step="0.01" disabled={isCreatingQuote} />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceDate" className="text-right text-gray-400">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"}
                      className={`col-span-3 justify-start text-left font-normal bg-[#2a2a2a] border-[#4a4a4a] text-white focus:border-pink-600 focus:ring-pink-600 hover:bg-[#383838] hover:text-white ${!newQuoteServiceDate && "text-gray-500"}`}
                      disabled={isCreatingQuote}>
                      <CalendarDays className="mr-2 h-4 w-4 text-pink-600" />
                      {newQuoteServiceDate ? format(newQuoteServiceDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#161616] border-[#4a4a4a]">
                      <Calendar 
                          mode="single" 
                          selected={newQuoteServiceDate} 
                          onSelect={setNewQuoteServiceDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          className="calendar-dark-theme"
                      />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceTime" className="text-right text-gray-400">Time</Label>
                <div className="col-span-3 relative">
                  <Input id="serviceTime" type="time" value={newQuoteServiceTime}
                    onChange={(e) => setNewQuoteServiceTime(e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600 [color-scheme:dark] cursor-pointer" 
                    disabled={isCreatingQuote}
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.showPicker?.();
                    }}
                  />
                </div>
              </div>

              {createQuoteError && (
                  <div className="w-full text-red-500 text-sm text-center p-3 bg-red-900/20 rounded-md border border-red-800/50 mt-2">
                      {createQuoteError}
                  </div>
              )}
            </div>
            <DialogFooter className="border-t border-[#2a2a2a] pt-4">
              <Button variant="ghost" onClick={() => setIsCreateQuoteDialogOpen(false)} className="text-gray-400 hover:bg-[#2a2a2a] hover:text-white" disabled={isCreatingQuote}>Cancel</Button>
              <Button onClick={handleCreateQuoteSubmit} disabled={isCreatingQuote || !csrfToken} className="bg-pink-600 hover:bg-pink-700 text-white">
                  {isCreatingQuote ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> : <FilePlus className="mr-2 h-5 w-5" />}
                  {isCreatingQuote ? 'Creating...' : 'Create Quote'}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRaiseDisputeDialogOpen} onOpenChange={(isOpen) => {
           setIsRaiseDisputeDialogOpen(isOpen);
           if (!isOpen) {
               setDisputeQuoteId(null);
               resetDisputeForm();
           }
        }}>
             <DialogContent className="sm:max-w-md bg-[#101010] text-white border-[#2a2a2a]">
               <DialogHeader className="border-b border-[#2a2a2a] pb-4">
                 <DialogTitle className="text-red-500 text-xl flex items-center gap-2">
                     <TriangleAlert className="h-5 w-5" /> Raise a Dispute
                 </DialogTitle>
                 <DialogDescription className="text-gray-400">
                   Submit a formal dispute regarding this quote (ID: {disputeQuoteId || 'N/A'}).
                 </DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="disputeReason" className="text-right text-gray-400">Reason</Label>
                   <Input id="disputeReason" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                     className="col-span-3 bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-red-600 focus:ring-red-600"
                     placeholder="Brief reason..." disabled={isRaisingDispute} />
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="disputeDetails" className="text-right text-gray-400">Details</Label>
                   <Textarea id="disputeDetails" value={disputeDetails} onChange={(e) => setDisputeDetails(e.target.value)}
                     className="col-span-3 bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-red-600 focus:ring-red-600 min-h-[80px]"
                     placeholder="Provide more details..." disabled={isRaisingDispute} />
                 </div>

                 {raiseDisputeError && (
                     <div className="col-span-4 text-red-500 text-sm text-center p-2 bg-red-900/20 rounded-md border border-red-800/50">{raiseDisputeError}</div>
                 )}
               </div>
               <DialogFooter className="border-t border-[#2a2a2a] pt-4">
                 <DialogClose asChild>
                      <Button variant="ghost" className="text-gray-400 hover:bg-[#2a2a2a] hover:text-white" disabled={isRaisingDispute}>Cancel</Button>
                 </DialogClose>
                 <Button onClick={handleRaiseDisputeSubmit} disabled={isRaisingDispute || !csrfToken || !disputeQuoteId} className="bg-red-600 hover:bg-red-700 text-white">
                     {isRaisingDispute ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> : <TriangleAlert className="mr-2 h-5 w-5" />}
                     {isRaisingDispute ? 'Submitting...' : 'Submit Dispute'}
                   </Button>
               </DialogFooter>
             </DialogContent>
        </Dialog>

        <Dialog open={isViewDisputeDialogOpen} onOpenChange={(isOpen) => {
            setIsViewDisputeDialogOpen(isOpen);
            if (!isOpen && !isLoadingDisputeDetails) setViewDisputeDetails(null);
        }}>
            <DialogContent className="sm:max-w-lg bg-[#101010] text-white border-[#2a2a2a]">
                <DialogHeader className="border-b border-[#2a2a2a] pb-4">
                    <DialogTitle className="text-orange-500 text-xl flex items-center gap-2">
                        <Info className="h-5 w-5" /> Dispute Details
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Comprehensive information about the dispute.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[70vh] -mr-2 pr-3">
                    {isLoadingDisputeDetails ? (
                        <div className="py-10 text-center text-gray-500 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mx-auto mb-4"></div>
                            Loading dispute details...
                        </div>
                    ) : viewDisputeDetails ? (
                        <div className="space-y-5 py-6 text-sm">
                            <div className="space-y-3 p-3 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
                                <div className="flex items-center gap-2">
                                    <strong className="text-gray-400 w-20 shrink-0">Dispute ID:</strong> 
                                    <span className="text-xs text-gray-500 break-all">{viewDisputeDetails.id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong className="text-gray-400 w-20 shrink-0">Status:</strong>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getDisputeStatusColorClasses(viewDisputeDetails.status)}`}>
                                        {viewDisputeDetails.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <strong className="text-gray-300 block mb-1.5 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 text-orange-400" /> Reason:</strong>
                                    <p className="bg-[#1f1f1f] p-2.5 rounded-md border border-[#303030] text-gray-200 text-xs sm:text-sm">{viewDisputeDetails.reason}</p>
                                </div>
                                {viewDisputeDetails.details && (
                                    <div>
                                        <strong className="text-gray-300 block mb-1.5 flex items-center gap-1.5"><Info className="h-4 w-4 text-blue-400" /> Details:</strong>
                                        <p className="whitespace-pre-wrap break-words bg-[#1f1f1f] p-2.5 rounded-md border border-[#303030] text-gray-300 text-xs sm:text-sm leading-relaxed">{viewDisputeDetails.details}</p>
                                </div>
                                )}
                                {viewDisputeDetails.resolution && (
                                    <div>
                                        <strong className="text-gray-300 block mb-1.5 flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> Resolution:</strong>
                                        <p className="whitespace-pre-wrap break-words text-green-300 bg-green-900/30 p-2.5 rounded-md border border-green-700/50 text-xs sm:text-sm leading-relaxed">{viewDisputeDetails.resolution}</p>
                                    </div>
                                )}
                            </div>
                            
                            <Separator className="bg-[#2a2a2a] my-3"/>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                                <div>
                                    <strong className="text-gray-300 block mb-1.5 flex items-center gap-1.5"><UserIcon className="h-4 w-4 text-pink-400" /> Initiated By:</strong>
                                    <div className="pl-2 space-y-0.5 text-gray-400">
                                        <p className="text-gray-200">{viewDisputeDetails.initiator?.name || 'N/A'}</p>
                                        <p className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 opacity-70"/> Role: {viewDisputeDetails.initiator?.role || 'N/A'}</p>
                                        <p className="flex items-start gap-1">
                                            <Mail className="h-3.5 w-3.5 opacity-70 mt-0.5 shrink-0"/>
                                            <span className="break-words">
                                                Email: {viewDisputeDetails.initiator?.email || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {viewDisputeDetails.involved && (
                                    <div>
                                        <strong className="text-gray-300 block mb-1.5 flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-400" /> Involved Party:</strong>
                                        <div className="pl-2 space-y-0.5 text-gray-400">
                                            <p className="text-gray-200">{viewDisputeDetails.involved?.name || 'N/A'}</p>
                                            <p className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 opacity-70"/> Role: {viewDisputeDetails.involved?.role || 'N/A'}</p>
                                            <p className="flex items-start gap-1">
                                                <Mail className="h-3.5 w-3.5 opacity-70 mt-0.5 shrink-0"/>
                                                <span className="break-words">
                                                   Email: {viewDisputeDetails.involved?.email || 'N/A'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {viewDisputeDetails.quote && (
                                <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                    <strong className="text-gray-300 block mb-2 flex items-center gap-1.5"><FileText className="h-4 w-4 text-indigo-400" /> Related Quote:</strong>
                                    <div className="pl-3 space-y-1 text-xs text-gray-400 bg-[#1f1f1f] p-2.5 rounded-md border border-[#303030]">
                                        <p><strong className="text-gray-500">ID:</strong> <span className="text-gray-300">{viewDisputeDetails.quote.id}</span></p>
                                        <p><strong className="text-gray-500">Product:</strong> <span className="text-gray-300">{viewDisputeDetails.quote.productType}</span></p>
                                        <p><strong className="text-gray-500">Status:</strong> <span className="text-gray-300">{viewDisputeDetails.quote.status}</span></p>
                                        {viewDisputeDetails.quote.serviceDate && (
                                            <p><strong className="text-gray-500">Service Date:</strong> <span className="text-gray-300">{formatDateSafely(viewDisputeDetails.quote.serviceDate)}</span></p>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <Separator className="bg-[#2a2a2a] my-3"/>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                                <div>
                                    <strong className="text-gray-300 block mb-1 flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gray-500" /> Created At:</strong>
                                    <p className="text-gray-400 pl-2">{formatDateSafely(viewDisputeDetails.createdAt, "MMM dd, yyyy 'at' p")}</p>
                                </div>
                                <div>
                                    <strong className="text-gray-300 block mb-1 flex items-center gap-1.5"><Clock4 className="h-4 w-4 text-gray-500" /> Last Updated:</strong>
                                    <p className="text-gray-400 pl-2">{formatDateSafely(viewDisputeDetails.updatedAt, "MMM dd, yyyy 'at' p")}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-red-500">Failed to load dispute details. Please try again.</div>
                    )}
                </ScrollArea>
                <DialogFooter className="border-t border-[#2a2a2a] pt-4">
                    <DialogClose asChild>
                        <Button variant="ghost" className="text-gray-400 hover:bg-[#2a2a2a] hover:text-white">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] h-16 md:hidden z-40">
         <Suspense fallback={
             <div className="flex justify-around items-center h-full">
                  <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse mx-1"></div>
                  <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse mx-1"></div>
                  <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse mx-1"></div>
                  <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse mx-1"></div>
             </div>
         }>
           <MobileNavigationComponent navigationItems={navigationItems} pathname={pathname} />
         </Suspense>
      </nav>
    </div>
  );
}

const renderPortfolioSection = () => {
     // Portfolio section removed - non-functional dummy feature
     return null;
}

type MobileNavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  view: string;
};

const MobileNavigationComponent = ({ navigationItems, pathname: currentPathname }: { navigationItems: MobileNavigationItem[], pathname: string }) => {
    const searchParams = nextUseSearchParams();
    const mobileView = searchParams.get('view');
    
    let effectiveView = mobileView;
    if (!mobileView && currentPathname === '/artist') {
        effectiveView = 'home';
    } else if (currentPathname === '/profile/artist') {
        effectiveView = 'profile';
    }

    return (
        <ul className="flex justify-around items-center h-full">
            {navigationItems.map((item: MobileNavigationItem) => {
                let isActive = false;

                if (item.view === 'profile') {
                    isActive = currentPathname === '/profile/artist';
                } 
                else if (currentPathname === '/artist') {
                    isActive = effectiveView === item.view;
                }
                else {
                    isActive = currentPathname === item.href && item.view === effectiveView;
                }
                
                return (
                    <li key={item.name} className="flex-1">
                        <Link
                            href={item.href}
                            className={`flex flex-col items-center justify-center text-xs h-full transition-colors duration-150 ease-in-out ${
                                isActive ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'
                            }`}
                        >
                            <item.icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-500'}`} strokeWidth={isActive ? 2.5 : 2}/>
                            <span>{item.name}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};
