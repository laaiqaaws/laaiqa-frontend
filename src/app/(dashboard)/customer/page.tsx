"use client";

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User as AuthUserRaw, API_BASE_URL } from '@/types/user';
import { DateRange } from 'react-day-picker';
import {
    User as UserIcon,
    Settings,
    LogOut,
    Edit3,
    ShoppingCart,
    FileText,
    CheckCircle,
    Clock,
    DollarSign,
    CalendarDays,
    Clock4,
    Package,
    Paintbrush,
    CheckSquare,
    Home as HomeIcon,
    Phone,
    UserCog,
    Info,
    Star,
    CircleX,
    AlertCircle,
    Bell,
    Ruler,
    Weight,
    Droplet,
    Tag,
    Users,
    TriangleAlert,
    Trash2,
    Briefcase,
    Mail,
    LayoutDashboard,
    Filter,
    RefreshCw,
    Send,
    Eye,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

// Use the Rupee symbol for display
const CURRENCY_SYMBOL = '₹';

interface FrontendReview {
    id: string;
    rating: number;
    comment: string | null;
}

interface CreateDisputeRequestBody {
    reason: string;
    details: string | null;
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

interface CustomerQuote {
    id: string;
    createdAt: string;
    updatedAt: string;
    artistId: string;
    artistName?: string | null;
    customerId: string | null;
    customerName?: string | null;
    productType: string;
    details: string;
    price: string | null;
    serviceDate: string;
    serviceTime: string;
    status: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled";
    displayStatus: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled" | "Date Reached (Pending)" | "Overdue (Payment Pending)" | "Overdue (Booked)";
    review?: FrontendReview | null;
    disputes?: FrontendDispute[];
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
}

interface AuthUser extends AuthUserRaw {
    role: 'customer';
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
    bookingPreferences?: string[] | null;
    preferredArtists?: string[] | null;
    disputesInitiated?: FrontendDispute[];
    disputesInvolved?: FrontendDispute[];
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
    "#A2D9CE",
    "#FFD8A9",
];

const initialUserState: AuthUser | null = null;
const initialQuotesState: CustomerQuote[] = [];

interface MobileNavigationItem {
    name: string;
    href: string;
    icon: React.ElementType;
    view: string;
}

export default function CustomerDashboardPage() {
    const [user, setUser] = useState<AuthUser | null>(initialUserState);
    const [userError, setUserError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | '7d' | '30d' | 'year' | 'custom'>('30d');
    const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange | undefined>({
        from: subDays(startOfToday(), 29),
        to: endOfToday(),
    });
    const [isRefreshingData, setIsRefreshingData] = useState(false);

    const [customerQuotes, setCustomerQuotes] = useState<CustomerQuote[]>(initialQuotesState);
    const [quotesError, setQuotesError] = useState<string | null>(null);
    const [quotesLoading, setQuotesLoading] = useState(true);

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

    // Helper function to check if a dispute is active (Open or Under Review)
    const isDisputeActive = (dispute: FrontendDispute) => {
        return dispute.status === 'Open' || dispute.status === 'Under Review';
    };

    const [communicationHistory, setCommunicationHistory] = useState<CommunicationAlert[]>([]);
    const [isCommunicationLoading, setIsCommunicationLoading] = useState(true);

    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [csrfFetchAttempted, setCsrfFetchAttempted] = useState(false);

    const fetchCsrfToken = useCallback(async (): Promise<string | null> => {
        if (csrfToken !== null || csrfFetchAttempted) {
            return csrfToken;
        }

        setCsrfFetchAttempted(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' });
            if (!response.ok) {
                setCsrfToken(null);
                return null;
            }
            const data = await response.json();
            setCsrfToken(data.csrfToken || null);
            return data.csrfToken || null;
        } catch (error) {
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
                        sonnerToast.error("Authentication Required", { description: "Please log in to access your dashboard." });
                        router.push('/login');
                        return;
                    }
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                    setUser(null);
                    setUserError(errorData.message || `Failed to fetch user: ${response.statusText}`);
                    return;
                }

                const data: { user: AuthUser } = await response.json();
                if (data.user.role !== 'customer') {
                    const errorMessage = "Access denied. This dashboard is for customers only.";
                    setUserError(errorMessage);
                    setUser(null);
                    sonnerToast.error("Access Denied", { description: errorMessage });
                    router.push(data.user.role === 'artist' ? '/artist' : '/');
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

    const calculateDisplayStatusForQuote = useCallback(
        (baseQuote: CustomerQuote): CustomerQuote['displayStatus'] => {
            let displayStatus: CustomerQuote['displayStatus'] = baseQuote.status as CustomerQuote['displayStatus'];

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
                    }
                } catch (e) {
                }
            }
            return displayStatus;
        },
        []
    );

    const fetchCustomerQuotes = useCallback(async () => {
        if (!user || user.role !== 'customer') return;
        setQuotesLoading(true);
        setQuotesError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/quotes/customer`, {
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    setQuotesError('Failed to load quotes: Session expired. Please log in again.');
                    setCustomerQuotes([]);
                    return;
                }
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                setQuotesError('Failed to load your quotes: ' + (errorData.message || `HTTP error ${response.status}`));
                setCustomerQuotes([]);
                return;
            }

            const quotesApiData: CustomerQuote[] = await response.json();

            const processedQuotes = quotesApiData.map(quote => ({
                ...quote,
                displayStatus: calculateDisplayStatusForQuote(quote),
                disputes: quote.disputes || [],
            }));

            processedQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setCustomerQuotes(processedQuotes);
            setQuotesError(null);

        } catch (err: any) {
            setQuotesError('Failed to load your quotes: ' + (err.message || "Unknown error"));
            setCustomerQuotes([]);
        } finally {
            setQuotesLoading(false);
        }
    }, [user, calculateDisplayStatusForQuote]);

    const fetchCommunicationHistory = useCallback(() => {
        setIsCommunicationLoading(true);
        const mockAlerts: CommunicationAlert[] = [];
        const now = new Date();

        customerQuotes.slice(0, 10).forEach((quote, index) => {
            const baseTime = new Date(now.getTime() - index * 3600000 * 5);

            if (quote.status === 'Accepted') {
                mockAlerts.push({
                    id: `${quote.id}-accepted-email`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'Quote Accepted',
                    recipient: 'Customer',
                    details: `Email: Your quote for ${quote.productType} was successfully accepted. Next step: Payment.`,
                    timestamp: new Date(baseTime.getTime() - 1000 * 60 * 3).toISOString(),
                });
            }

            if (quote.status === 'Booked' || quote.status === 'Completed') {
                mockAlerts.push({
                    id: `${quote.id}-booked-sms`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'SMS',
                    action: 'Booking Confirmed',
                    recipient: 'Customer',
                    details: `SMS: Your booking for ${quote.productType} (Price: ${CURRENCY_SYMBOL}${quote.price}) is confirmed.`,
                    timestamp: new Date(baseTime.getTime() - 1000 * 60 * 1).toISOString(),
                });
            }

            if (quote.status === 'Completed') {
                mockAlerts.push({
                    id: `${quote.id}-completed-email-c`,
                    quoteId: quote.id,
                    productType: quote.productType,
                    type: 'Email',
                    action: 'Quote Completed',
                    recipient: 'Customer',
                    details: `Email: Quote for ${quote.productType} marked complete. Please leave a review!`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 10).toISOString(),
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
                    details: `Email: Quote for ${quote.productType} was cancelled.`,
                    timestamp: new Date(baseTime.getTime() + 1000 * 60 * 15).toISOString(),
                });
            }

            if (quote.disputes && quote.disputes.length > 0) {
                quote.disputes.forEach(dispute => {
                    if (dispute.initiatorRole === 'artist') {
                        mockAlerts.push({
                            id: `${dispute.id}-opened-email-involved`,
                            quoteId: quote.id,
                            productType: quote.productType,
                            type: 'Email',
                            action: 'Dispute Opened By Artist',
                            recipient: 'Customer',
                            details: `Email: The artist has opened a dispute on quote ${quote.productType}.`,
                            timestamp: new Date(dispute.createdAt).toISOString(),
                        });
                    }
                });
            }
        });

        mockAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setCommunicationHistory(mockAlerts);
        setIsCommunicationLoading(false);
    }, [customerQuotes]);


    useEffect(() => {
        if (user && user.role === 'customer') {
            fetchCustomerQuotes();
        } else {
            setCustomerQuotes([]);
            setQuotesError(null);
            setQuotesLoading(false);
        }
    }, [user, fetchCustomerQuotes]);

    useEffect(() => {
        if (user && customerQuotes.length > 0 && !quotesLoading) {
            fetchCommunicationHistory();
        } else if (user && quotesLoading) {
            setIsCommunicationLoading(true);
        } else {
            setCommunicationHistory([]);
            setIsCommunicationLoading(false);
        }
    }, [user, customerQuotes.length, quotesLoading, fetchCommunicationHistory]);

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
        quotesInPeriod, disputesInPeriod,
        totalSpentInPeriod,
        reviewsLeftInPeriod,
        openDisputesInPeriod,
    } = useMemo(() => {
        const { from, to } = analyticsDateRange || {};
        const isWithinSelectedInterval = (dateString: string | Date) => {
            if (!from || !to) return true;
            const date = parseISO(dateString as string);
            return dateFnsIsValid(date) && isWithinInterval(date, { start: from, end: to });
        };

        const quotesInPeriod = analyticsDateRange === undefined ? customerQuotes : customerQuotes.filter(quote => isWithinSelectedInterval(quote.createdAt));
        const reviewsInPeriod = quotesInPeriod.map(q => q.review).filter((r): r is FrontendReview => !!r);
        const disputesInPeriod = quotesInPeriod.flatMap(q => q.disputes || []).filter(d => isWithinSelectedInterval(d.createdAt));

        const completedQuotesInPeriod = quotesInPeriod.filter(q => q.status === 'Completed');
        const totalSpentInPeriod = completedQuotesInPeriod.reduce((sum, q) => sum + parseFloat(q.price || '0'), 0);

        const reviewsLeftInPeriod = reviewsInPeriod.length;
        const openDisputesInPeriod = disputesInPeriod.filter(d => d.status === 'Open' || d.status === 'Under Review').length;

        return {
            quotesInPeriod, disputesInPeriod,
            totalSpentInPeriod,
            reviewsLeftInPeriod, openDisputesInPeriod,
        };
    }, [customerQuotes, analyticsDateRange]);

    const handleRefreshData = async () => {
        setIsRefreshingData(true);
        sonnerToast.info("Refreshing data...", { duration: 1500 });
        await Promise.all([fetchCustomerQuotes(), fetchCommunicationHistory()]);
        setIsRefreshingData(false);
    };

    const upcomingQuotes = customerQuotes
        .filter(quote =>
            (quote.status === 'Accepted' || quote.status === 'Booked' || quote.displayStatus === 'Date Reached (Pending)' || quote.displayStatus === 'Overdue (Payment Pending)' || quote.displayStatus === 'Overdue (Booked)') &&
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
                setCustomerQuotes([]);
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
        } catch (err: any) {
            sonnerToast.error("Logout Error", {
                description: err.message || "An error occurred during logout.",
            });
        }
    };

    const getInitials = (name?: string | null) => {
        if (!name || name.trim() === "") return "U";
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    };

    const handleMarkAsCompleted = async (quoteId: string) => {
        if (isCompletingQuote === quoteId) return;
        if (!user) {
            sonnerToast.error("Authentication Required", { description: "You must be logged in to mark quotes as completed." });
            return;
        }
        const quoteToComplete = customerQuotes.find(q => q.id === quoteId);
        if (!quoteToComplete || quoteToComplete.status !== 'Booked' || quoteToComplete.customerId !== user.id) {
            sonnerToast.error("Action Not Allowed", { description: "You can only mark your booked quotes as completed." });
            return;
        }

        if (quoteToComplete.disputes && quoteToComplete.disputes.some(isDisputeActive)) {
            sonnerToast.info("Completion Blocked", { description: "Cannot mark quote as completed with active disputes. Please resolve disputes first." });
            return;
        }

        let token = csrfToken;
        if (!token && !csrfFetchAttempted) {
            sonnerToast.info("Attempting to refresh security token...");
            token = await fetchCsrfToken();
        }

        if (!token) {
            sonnerToast.error("Action Failed", { description: "Security token not available. Please refresh the page." });
            return;
        }

        setIsCompletingQuote(quoteId);
        setQuotesError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}/complete`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': token,
                },
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.message || `Failed to mark quote as completed: ${response.statusText}`;
                sonnerToast.error("Completion Failed", { description: errorMsg });
                return;
            }

            const updatedQuoteFromServer: CustomerQuote = responseData.quote;

            setCustomerQuotes(prevQuotes =>
                prevQuotes.map(quote =>
                    quote.id === updatedQuoteFromServer.id
                        ? { ...updatedQuoteFromServer, displayStatus: calculateDisplayStatusForQuote(updatedQuoteFromServer), disputes: updatedQuoteFromServer.disputes || [] }
                        : quote
                )
            );
            fetchCommunicationHistory();

            sonnerToast.success("Quote Completed", {
                description: "The quote has been successfully marked as completed. You can now leave a review.",
                duration: 5000,
            });

        } catch (err: any) {
            sonnerToast.error("Completion Error", {
                description: err.message || 'An error occurred while marking the quote as completed.',
            });
        } finally {
            setIsCompletingQuote(null);
        }
    };

    const handleCancelQuote = async (quoteId: string) => {
        if (!user) {
            sonnerToast.error("Authentication Required", { description: "You must be logged in to cancel quotes." });
            return;
        }
        const quoteToCancel = customerQuotes.find(q => q.id === quoteId);
        if (!quoteToCancel || (quoteToCancel.status !== 'Pending' && quoteToCancel.status !== 'Accepted' && quoteToCancel.status !== 'Booked')) {
            sonnerToast.info("Cancellation Info", { description: "This quote cannot be cancelled in its current status." });
            return;
        }

        const canCancel = (quoteToCancel.customerId !== null && user.id === quoteToCancel.customerId);

        if (!canCancel) {
            sonnerToast.error("Permission Denied", { description: "You are not authorized to cancel this quote." });
            return;
        }

        if (quoteToCancel.disputes && quoteToCancel.disputes.some(isDisputeActive)) {
            sonnerToast.info("Cancellation Blocked", { description: "Cannot cancel quote with active disputes. Please resolve disputes first." });
            return;
        }

        let token = csrfToken;
        if (!token && !csrfFetchAttempted) {
            sonnerToast.info("Attempting to refresh security token...");
            token = await fetchCsrfToken();
        }

        if (!token) {
            sonnerToast.error("Action Failed", { description: "Security token not available. Please refresh the page." });
            return;
        }

        setIsCancellingQuote(quoteId);

        try {
            const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}/cancel`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': token,
                },
            });
            const responseData = await response.json();
            if (!response.ok) {
                const errorMsg = responseData.message || `Failed to cancel quote: ${response.statusText}`;
                sonnerToast.error("Cancellation Failed", { description: errorMsg });
                return;
            }

            const updatedQuoteFromServer: CustomerQuote = responseData.quote;
            setCustomerQuotes(prevQuotes =>
                prevQuotes.map(quote =>
                    quote.id === updatedQuoteFromServer.id
                        ? { ...updatedQuoteFromServer, displayStatus: calculateDisplayStatusForQuote(updatedQuoteFromServer), disputes: updatedQuoteFromServer.disputes || [] }
                        : quote
                )
            );
            fetchCommunicationHistory();
            sonnerToast.success("Quote Cancelled!", { description: "The quote has been cancelled." });
        } catch (err: any) {
            sonnerToast.error("Cancellation Error", { description: err.message || 'An error occurred while cancelling the quote.' });
        } finally {
            setIsCancellingQuote(null);
        }
    };

    const handleOpenRaiseDisputeDialog = (quoteId: string) => {
        const quote = customerQuotes.find(q => q.id === quoteId);
        if (!quote) {
            sonnerToast.error("Error", { description: "Quote not found." });
            return;
        }
        const allowedStatusesForCustomerDispute = ['Pending', 'Accepted', 'Booked', 'Completed'];
        if (!allowedStatusesForCustomerDispute.includes(quote.status)) {
            sonnerToast.info("Action Info", { description: `Disputes can only be raised for quotes that are ${allowedStatusesForCustomerDispute.join(' or ')}.` });
            return;
        }

        if (quote.disputes && quote.disputes.some(isDisputeActive)) {
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
        if (!user || user.role !== 'customer' || !disputeQuoteId) {
            sonnerToast.error("Error", { description: "Invalid request." });
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
                const updatedQuoteWithDispute: CustomerQuote = responseData.quote;
                setCustomerQuotes(prevQuotes =>
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
        const quote = customerQuotes.find(q => q.id === quoteId);
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

            const updatedQuote: CustomerQuote = responseData.quote;
            setCustomerQuotes(prevQuotes =>
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
        const quote = customerQuotes.find(q => q.id === quoteId);
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

            const updatedQuote: CustomerQuote = responseData.quote;
            setCustomerQuotes(prevQuotes =>
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
            try {
                dateToFormat = parseISO(dateInput);
                if (!dateFnsIsValid(dateToFormat)) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                        const parts = dateInput.split('-').map(Number);
                        const potentialDate = new Date(parts[0], parts[1] - 1, parts[2]);
                        if (dateFnsIsValid(potentialDate) && potentialDate.getDate() === parts[2] && potentialDate.getMonth() === parts[1] - 1 && potentialDate.getFullYear() === parts[0]) {
                            dateToFormat = potentialDate;
                        } else {
                            return String(dateInput);
                        }
                    } else {
                        return String(dateInput);
                    }
                }
            } catch (e) {
                return String(dateInput);
            }
        } else if (dateInput instanceof Date) {
            dateToFormat = dateInput;
        } else {
            return 'Invalid Date Input';
        }

        if (!dateFnsIsValid(dateToFormat)) {
            return typeof dateInput === 'string' ? dateInput : 'Invalid Date';
        }

        try {
            return format(dateToFormat, dateFormat);
        } catch (e) {
            return 'Error Formatting Date';
        }
    };

    const getStatusColorClasses = (status: CustomerQuote['displayStatus']) => {
        switch (status) {
            case "Accepted": return "bg-green-700/70 text-green-300 border-green-600/50";
            case "Booked": return "bg-blue-700/70 text-blue-300 border-blue-600/50";
            case "Pending": return "bg-yellow-700/70 text-yellow-300 border-yellow-600/50";
            case "Completed": return "bg-purple-700/70 text-purple-300 border-purple-600/50";
            case "Cancelled": return "bg-neutral-600/70 text-neutral-400 border-neutral-500/50";
            case "Date Reached (Pending)": return "bg-orange-700/70 text-orange-300 border-orange-600/50";
            case "Overdue (Payment Pending)": return "bg-red-700/70 text-red-300 border-red-600/50";
            case "Overdue (Booked)": return "bg-red-700/70 text-red-300 border-red-600/50";
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

    type NavigationItem = {
        name: string;
        href: string;
        icon: React.ElementType;
        view: string;
    };

    const navigationItems: NavigationItem[] = [
        { name: 'Home', href: '/customer', icon: HomeIcon, view: 'home' },
        { name: 'Quotes', href: '/customer?view=quotes', icon: FileText, view: 'quotes' },
        { name: 'Analytics', href: '/customer?view=analytics', icon: LayoutDashboard, view: 'analytics' },
        { name: 'Profile', href: '/profile/customer', icon: UserIcon, view: 'profile' },
    ];

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
                            Your Spending & Activity
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
                                <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#3a3a3a]" align="end">
                                    <Calendar initialFocus mode="range" defaultMonth={analyticsDateRange?.from} selected={analyticsDateRange} onSelect={setAnalyticsDateRange} numberOfMonths={2} />
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
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full bg-[#2a2a2a] rounded-lg" />)}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-pink-500/10 hover:border-pink-700/50 transition-all">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-pink-400" /> Quotes Received</CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-pink-500">{quotesInPeriod.length}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">Total quotes received in this period.</p>
                                </Card>
                                <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-green-500/10 hover:border-green-700/50 transition-all">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-green-400" /> Total Spent</CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-green-500">{CURRENCY_SYMBOL}{totalSpentInPeriod.toFixed(2)}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">From completed quotes in this period.</p>
                                </Card>
                                <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-yellow-500/10 hover:border-yellow-700/50 transition-all">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><Star className="h-4 w-4 text-yellow-400" /> Reviews Left</CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-yellow-500">{reviewsLeftInPeriod}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">Reviews you submitted in this period.</p>
                                </Card>
                                <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-red-500/10 hover:border-red-700/50 transition-all">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2"><TriangleAlert className="h-4 w-4 text-red-400" /> Active Disputes</CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-red-500">{openDisputesInPeriod}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">Open/Under Review disputes in this period.</p>
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
                <CardContent className="px-4 pb-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="flex justify-center mb-3 sm:mb-4">
                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl">
                            <AvatarImage src={user.image || undefined} alt={user.name || user.email || "User Avatar"} />
                            <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="text-center text-sm sm:text-base">
                        <p className="font-semibold text-white">{user.name || 'Your Name'}</p>
                        <p className="text-gray-400">{user.email}</p>
                    </div>
                    <Separator className="my-3 bg-[#2a2a2a]" />
                    <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-500" /> <strong>Phone:</strong> {user.phone || 'N/A'}</div>
                        <div className="flex items-center gap-1"><UserCog className="h-3.5 w-3.5 text-gray-500" /> <strong>Gender:</strong> {user.gender || 'N/A'}</div>
                        {(user.address || user.city || user.state || user.zipCode || user.country) && (
                            <div className="flex items-start gap-1">
                                <HomeIcon className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-0.5" /> <strong>Address:</strong>
                                <span className="text-gray-400 line-clamp-2">
                                    {[user.address, user.city, user.state, user.zipCode, user.country]
                                        .filter(Boolean)
                                        .join(', ') || 'N/A'}
                                </span>
                            </div>
                        )}
                    </div>
                    <Button asChild variant="outline" className="w-full mt-4 h-10 border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white transition-colors">
                        <Link href="/profile/customer">
                            <Edit3 className="mr-2 h-4 w-4" /> Full Profile
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    };

    const renderUpcomingAppointmentsSection = () => {
        if (!user || (quotesError && !customerQuotes.length) && quotesLoading) {
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
                        <p className="text-center text-gray-500 py-6 text-sm">No upcoming appointments found in Accepted/Booked/Date Reached/Overdue status.</p>
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
                                        {quote.artistName && <div className="flex items-center gap-1"><Paintbrush className="h-3.5 w-3.5 text-gray-500" /> <strong>Artist:</strong> {quote.artistName}</div>}
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
                        <Link href="/customer?view=quotes"><FileText className="mr-2 h-4 w-4" /> View All Quotes</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    };

    const renderQuotesSection = () => {
        if (!user) return null;

        const isAnyActionInProgress = !!isCompletingQuote || !!isCancellingQuote || isRaisingDispute || !!isDeletingDispute || isLoadingDisputeDetails || !!isClosingDispute || !!loadingDisputeVewButtonId || isRefreshingData;
        const isSecurityReady = !!csrfToken;

        return (
            <>
                <Card className="mb-6 bg-[#161616] border-[#2a2a2a]">
                    <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                        <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-pink-600">
                            <FileText className="h-5 w-5 text-pink-600" /> Your Quotes List ({customerQuotes.length})
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
                                <p className="text-sm text-gray-400 mt-1">Please try again later or contact support.</p>
                            </div>
                        ) : customerQuotes.length === 0 ? (
                            <p className="text-center text-gray-500 py-10">You have no quotes yet. Accept a quote from an artist to see it here!</p>
                        ) : (
                            <div className="space-y-4">
                                {customerQuotes.map((quote, index) => (
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
                                                className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColorClasses(quote.displayStatus)}`}
                                            >
                                                {(quote.displayStatus === "Accepted" || quote.displayStatus === "Booked") && <CheckCircle className="inline h-3 w-3 mr-1" />}
                                                {quote.displayStatus === "Pending" && <Clock className="inline h-3 w-3 mr-1" />}
                                                {quote.displayStatus === "Completed" && <CheckSquare className="inline h-3 w-3 mr-1" />}
                                                {quote.displayStatus === "Cancelled" && <CircleX className="inline h-3 w-3 mr-1" />}
                                                {(quote.displayStatus === "Date Reached (Pending)" || quote.displayStatus === "Overdue (Payment Pending)" || quote.displayStatus === "Overdue (Booked)") && <AlertCircle className="inline h-3 w-3 mr-1" />}
                                                {quote.displayStatus}
                                            </span>
                                        </div>

                                        {quote.review && (
                                            <div className="mt-3 mb-3 border-t border-b border-yellow-700/50 py-3 text-sm text-gray-400 bg-yellow-900/10 rounded-md p-3">
                                                <h4 className="font-semibold flex items-center gap-1.5 mb-2 text-yellow-300">
                                                    <Star className="h-4 w-4 text-yellow-400" /> Your Review:
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1 text-yellow-400">
                                                        <strong className="text-gray-300">Rating:</strong>
                                                        {renderStars(quote.review.rating)}
                                                    </div>
                                                    {quote.review.comment && (
                                                        <div>
                                                            <strong className="text-gray-300 block mb-0.5">Comment:</strong>
                                                            <p className="text-gray-400 whitespace-pre-wrap break-words">{quote.review.comment}</p>
                                                        </div>
                                                    )}
                                                    {!quote.review.comment && (
                                                        <p className="text-gray-500 italic text-xs">No comment provided.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {quote.artistName && (
                                            <p className="text-sm text-gray-200 mb-1 flex items-center gap-1">
                                                <Paintbrush className="h-4 w-4 text-gray-500" />
                                                From: <strong>{quote.artistName}</strong>
                                            </p>
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

                                        <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap break-words">{quote.details}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4 text-gray-500" />
                                                <strong>Price:</strong> {CURRENCY_SYMBOL}{quote.price || '0.00'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4 text-gray-500" />
                                                <strong>Date:</strong> {formatDateSafely(quote.serviceDate)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock4 className="h-4 w-4 text-gray-500" />
                                                <strong>Time:</strong> {quote.serviceTime || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-1 col-span-1 sm:col-span-2 flex-wrap">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span className="mr-2"><strong>Created:</strong> {formatDateSafely(quote.createdAt)}</span>
                                                <span><strong>Updated:</strong> {formatDateSafely(quote.updatedAt)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            {quote.status === 'Booked' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleMarkAsCompleted(quote.id)}
                                                    disabled={isCompletingQuote === quote.id || !isSecurityReady || isAnyActionInProgress}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                                                    {isCompletingQuote === quote.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                                    ) : (
                                                        <CheckSquare className="mr-2 h-4 w-4" />
                                                    )}
                                                    Mark as Completed
                                                </Button>
                                            )}

                                            {(quote.status === 'Pending' || quote.status === 'Accepted' || quote.status === 'Booked') && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm"
                                                            disabled={isCancellingQuote === quote.id || !isSecurityReady || isAnyActionInProgress}
                                                            className="border-red-500 text-red-500 bg-red-950/50 hover:bg-red-900/50 hover:text-red-400 transition-colors">
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
                                                            <AlertDialogCancel className="border-[#4a4a4a] bg-[#4a4a4a] text-white hover:bg-[#2a2a2a] hover:text-white transition-colors">Go Back</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleCancelQuote(quote.id)} className="bg-red-600 text-white hover:bg-red-700 transition-colors">
                                                                Confirm Cancel
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}

                                            {user && quote.status !== 'Pending' && quote.customerId === user.id && !quote.disputes?.some(isDisputeActive) && (
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
                                            {quote.disputes && quote.disputes.some(isDisputeActive) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled
                                                    className="border-orange-500 text-orange-500 bg-transparent hover:bg-orange-900/30 hover:text-orange-400 transition-colors flex items-center gap-1 opacity-70 cursor-not-allowed"
                                                >
                                                    <TriangleAlert className="h-4 w-4" /> Active Dispute
                                                </Button>
                                            )}

                                            <Button asChild variant="outline" size="sm" className="border-[#4a4a4a] bg-[#2a2a2a]/50 text-gray-400 hover:bg-[#4a4a4a]/70 hover:text-white transition-colors">
                                                <Link href={`/quote/${quote.id}`}>
                                                    View Details
                                                </Link>
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
        if (!user) return null;
        return (
            <>
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Profile</h1>
                    <p className="text-gray-400 text-sm sm:text-base">View and edit your personal information.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
                        <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                            <CardTitle className="text-lg sm:text-xl text-pink-600">Your Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 sm:p-6 space-y-3">
                            <div className="flex justify-center mb-3 sm:mb-4">
                                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl">
                                    <AvatarImage src={user.image || undefined} alt={user.name || user.email || "User Avatar"} />
                                    <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="text-center text-sm sm:text-base">
                                <p className="font-semibold text-white">{user.name || 'Your Name'}</p>
                                <p className="text-gray-400">{user.email}</p>
                            </div>
                            <Button asChild variant="outline" className="w-full mt-4 h-10 border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white transition-colors">
                                <Link href="/profile/customer"><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</Link>
                            </Button>
                            <Separator className="my-4 bg-[#2a2a2a]" />
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-1"><Phone className="h-4 w-4 text-gray-500" /> <strong>Phone:</strong> {user.phone || 'N/A'}</p>
                                <p className="flex items-center gap-1"><UserCog className="h-4 w-4 text-gray-500" /> <strong>Gender:</strong> {user.gender || 'N/A'}</p>
                                {(user.address || user.city || user.state || user.zipCode || user.country) && (
                                    <p className="flex items-start gap-1">
                                        <HomeIcon className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0 mt-0.5" /> <strong>Address:</strong>
                                        <span className="text-gray-400">
                                            {[user.address, user.city, user.state, user.zipCode, user.country]
                                                .filter(Boolean)
                                                .join(', ') || 'N/A'}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300">
                        <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                            <CardTitle className="text-lg sm:text-xl text-pink-600">Additional Details</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 sm:p-6 space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs sm:text-sm">
                                <div className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5 text-gray-500" /><strong>Height:</strong> {user.height ? `${user.height} cm` : 'N/A'}</div>
                                <div className="flex items-center gap-1"><Weight className="h-3.5 w-3.5 text-gray-500" /><strong>Weight:</strong> {user.weight ? `${user.weight} kg` : 'N/A'}</div>
                                <div className="flex items-center gap-1"><Droplet className="h-3.5 w-3.5 text-gray-500" /><strong>Skin Color:</strong> {user.color || 'N/A'}</div>
                                <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-500" /><strong>Ethnicity:</strong> {user.ethnicity || 'N/A'}</div>
                                <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-500" /><strong>Age:</strong> {user.age ? `${user.age} years` : 'N/A'}</div>
                            </div>
                            {(user.other || (Array.isArray(user.bookingPreferences) && user.bookingPreferences.length > 0) ||
                                (Array.isArray(user.preferredArtists) && user.preferredArtists.length > 0)) && (
                                    <>
                                        <Separator className="my-3 bg-[#2a2a2a]" />
                                        <div className="space-y-2 text-xs sm:text-sm">
                                            {user.other && (
                                                <div className="flex items-start gap-1">
                                                    <Tag className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong>Other:</strong> <span className="text-gray-400 whitespace-pre-wrap break-words">{user.other}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {Array.isArray(user.bookingPreferences) && user.bookingPreferences.length > 0 && (
                                                <div className="flex items-start gap-1">
                                                    <Info className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong>Booking Preferences:</strong> <span className="text-gray-400">{user.bookingPreferences.join(', ')}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {Array.isArray(user.preferredArtists) && user.preferredArtists.length > 0 && (
                                                <div className="flex items-start gap-1">
                                                    <Star className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong>Preferred Artists:</strong> <span className="text-gray-400">{user.preferredArtists.join(', ')}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            {!(user.height || user.weight || user.color || user.ethnicity || user.age || user.other || (Array.isArray(user.bookingPreferences) && user.bookingPreferences.length > 0) || (Array.isArray(user.preferredArtists) && user.preferredArtists.length > 0)) && (
                                <p className="text-gray-500 text-sm italic">No additional information or preferences provided yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    const MobileViewContent = () => {
        const searchParams = nextUseSearchParams();
        const mobileView = searchParams.get('view');
        const currentMobileView = mobileView || 'home';

        if (!user) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] bg-black text-gray-400 p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-600 mb-3"></div>
                    <p>Loading user data or redirecting...</p>
                </div>
            );
        }

        switch (currentMobileView) {
            case 'home':
                if (pathname !== '/customer' || (pathname === '/customer' && mobileView && mobileView !== 'home')) {
                    router.replace('/customer');
                    return null;
                }
                return (
                    <>
                        <div className="mb-6 md:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome back, {user?.name || 'Customer'}!</h1>
                            <p className="text-gray-400 text-sm sm:text-base">Overview of your dashboard.</p>
                        </div>
                        {renderProfileSnapshotSection()}
                        {renderUpcomingAppointmentsSection()}
                    </>
                );
            case 'quotes':
                if (pathname !== '/customer') {
                    router.replace('/customer?view=quotes');
                    return null;
                }
                return (
                    <>
                        <div className="mb-4">
                            <h1 className="text-xl font-bold text-white">Your Quotes</h1>
                            <p className="text-gray-400 text-sm">View and manage your quotes.</p>
                        </div>
                        {renderQuotesSection()}
                    </>
                );
            case 'analytics':
                if (pathname !== '/customer') {
                    router.replace('/customer?view=analytics');
                    return null;
                }
                return (
                    <>
                        <div className="mb-4">
                            <h1 className="text-xl font-bold text-white">Your Analytics</h1>
                            <p className="text-gray-400 text-sm">Track your spending and activity.</p>
                        </div>
                        {renderAnalyticsSection()}
                    </>
                );
            case 'profile':
                if (pathname !== '/profile/customer') {
                    router.replace('/profile/customer');
                    return null;
                }
                return (
                    <>
                        {renderFullProfileSection()}
                    </>
                );
            default:
                if (pathname !== '/customer' || mobileView) {
                    router.replace('/customer');
                    return null;
                }
                return (
                    <>
                        <div className="mb-6 md:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome back, {user?.name || 'Customer'}!</h1>
                            <p className="text-gray-400 text-sm sm:text-base">Overview of your dashboard.</p>
                        </div>
                        {renderProfileSnapshotSection()}
                        {renderUpcomingAppointmentsSection()}
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

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-400 p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-600 mb-3"></div>
                <p>Loading user data or redirecting...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
            <header className="bg-black shadow-md sticky top-0 z-50 border-b border-[#2a2a2a]">
                <div className="container mx-auto flex items-center justify-between h-16 px-3 md:px-6">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6 text-pink-600" />
                        <span className="font-bold text-lg md:text-xl text-white">Customer Dashboard</span>
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
                                <Button variant="ghost" className="p-0 rounded-full h-9 w-9 focus-visible:ring-2 focus-visible:ring-pink-600">
                                    <Avatar className="cursor-pointer h-9 w-9">
                                        <AvatarImage src={user.image || undefined} alt={user.name || user.email || "User Avatar"} />
                                        <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-[#161616] text-white border-[#2a2a2a] shadow-xl">
                                <DropdownMenuLabel className="px-2 py-1.5">
                                    <p className="text-sm font-medium truncate text-white">{user.name || "Customer"}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                                <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-pink-600 hover:!bg-gray-700 hover:!text-pink-500 cursor-pointer transition-colors">
                                    <Link href="/profile/customer"><UserIcon className="mr-2 h-4 w-4" />Edit Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-400 focus:bg-red-950 hover:!bg-red-800 hover:!text-red-400 cursor-pointer transition-colors">
                                    <LogOut className="mr-2 h-4 w-4" />Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 text-white">
                {/* Mobile View Content */}
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

                {/* Desktop View Content (Single Column Flow) */}
                <div className="hidden md:block">
                    <div className="mb-6 md:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome back, {user?.name || 'Customer'}!</h1>
                        <p className="text-gray-400 text-sm sm:text-base">Overview of your dashboard.</p>
                    </div>

                    {renderProfileSnapshotSection()}

                    {renderUpcomingAppointmentsSection()}

                    <div className="mt-6 md:mt-8">
                        {renderAnalyticsSection()}
                    </div>

                    <div className="mt-6 md:mt-8">
                        {renderQuotesSection()}
                    </div>
                </div>
            </main>

            <Dialog open={isRaiseDisputeDialogOpen} onOpenChange={(isOpen) => {
                setIsRaiseDisputeDialogOpen(isOpen);
                if (!isOpen) {
                    setDisputeQuoteId(null);
                    resetDisputeForm();
                }
            }}>
                <DialogContent className="sm:max-w-md bg-[#101010] text-white border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
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
                <DialogContent className="sm:max-w-lg bg-[#101010] text-white border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b border-[#2a2a2a] pb-4">
                        <DialogTitle className="text-orange-500 text-xl flex items-center gap-2">
                            <Eye className="h-5 w-5" /> Dispute Details
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

                                <Separator className="bg-[#2a2a2a] my-3" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                                    <div>
                                        <strong className="text-gray-300 block mb-1.5 flex items-center gap-1.5"><UserIcon className="h-4 w-4 text-pink-400" /> Initiated By:</strong>
                                        <div className="pl-2 space-y-0.5 text-gray-400">
                                            <p className="text-gray-200">{viewDisputeDetails.initiator?.name || 'N/A'}</p>
                                            <p className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 opacity-70" /> Role: {viewDisputeDetails.initiator?.role || 'N/A'}</p>
                                            <p className="flex items-start gap-1">
                                                <Mail className="h-3.5 w-3.5 opacity-70 mt-0.5 shrink-0" />
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
                                                <p className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 opacity-70" /> Role: {viewDisputeDetails.involved?.role || 'N/A'}</p>
                                                <p className="flex items-start gap-1">
                                                    <Mail className="h-3.5 w-3.5 opacity-70 mt-0.5 shrink-0" />
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

                                <Separator className="bg-[#2a2a2a] my-3" />

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
                        <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse"></div>
                        <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse"></div>
                        <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse"></div>
                        <div className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse"></div>
                    </div>
                }>
                    <MobileNavigation navigationItems={navigationItems} pathname={pathname} />
                </Suspense>
            </nav>
        </div>
    );
}

const MobileNavigation = ({ navigationItems, pathname: currentPathname }: { navigationItems: MobileNavigationItem[], pathname: string }) => {
    const searchParams = nextUseSearchParams();
    const mobileView = searchParams.get('view');

    let effectiveView = mobileView;
    if (!mobileView && currentPathname === '/customer') {
        effectiveView = 'home';
    } else if (currentPathname === '/profile/customer') {
        effectiveView = 'profile';
    }

    return (
        <ul className="flex justify-around items-center h-full">
            {navigationItems.map((item: MobileNavigationItem) => {
                let isActive = false;

                if (item.view === 'profile') {
                    isActive = currentPathname === '/profile/customer';
                }
                else if (currentPathname === '/customer') {
                    isActive = effectiveView === item.view;
                }
                else {
                    isActive = currentPathname === item.href && item.view === effectiveView;
                }

                return (
                    <li key={item.name} className="flex-1">
                        <Link
                            href={item.href}
                            className={`flex flex-col items-center justify-center text-xs h-full transition-colors duration-150 ease-in-out ${isActive ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.name}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};