"use client";

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User as AuthUserRaw, API_BASE_URL } from '@/types/user';

import {
    LayoutDashboard,
    Users,
    FileText,
    Star,
    Settings,
    LogOut,
    Trash2,
    Info,
    UserCog,
    DollarSignIcon,
    Package,
    CheckSquare,
    AlertCircle,
    UserRound,
    Phone,
    Ruler,
    Weight,
    Droplet,
    Tag,
    Bell,
    Mail,
    MapPin,
    Calendar as CalendarIconLucide,
    Clock,
    PackageCheck,
    PackageX,
    Eye,
    MessageSquareText,
    StarHalf,
    UserMinus,
    TriangleAlert,
    Edit3,
    ChevronRight,
    RefreshCw,
    XCircle,
    ClipboardCheck,
    Sparkles,
    Link as LinkIcon,
    Search,
    Filter,
    Download,
    ArrowRight,
    CreditCard,
    Wallet
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
import { Skeleton } from "@/components/ui/skeleton";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast as sonnerToast } from "sonner";
import { format, parseISO, isValid as dateFnsIsValid, isWithinInterval, startOfToday, endOfToday, subDays, subYears, isAfter, isBefore } from "date-fns";
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from 'react-day-picker';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title as ChartJSTitle, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';

ChartJS.register(ArcElement, Tooltip, Legend, ChartJSTitle, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

interface AdminUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    createdAt: string;
    role: string;
    averageRating?: number | null;
    reviewCount?: number | null;
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
    sex?: string | null;
    other?: string | null;
    bio?: string | null;
    specialties?: string | null;
    portfolioLink?: string | null;
    bookingInfo?: string[] | null;
    services?: string[] | null;
    availableLocations?: string[] | null;
    bookingPreferences?: string[] | null;
    preferredArtists?: string[] | null;
}

interface AdminUserBrief {
    id: string;
    name?: string | null;
    email: string;
    role: string;
}

interface FrontendDisputeQuoteInfo {
    id: string;
    productType: string;
    status: string;
    serviceDate: string;
}

interface FrontendDispute {
    id: string;
    createdAt: string;
    updatedAt: string;
    reason: string;
    status: "Open" | "Under Review" | "Resolved" | "Closed";
    initiatorId: string;
    involvedId: string;
    quoteId: string;
    resolution?: string | null;
    details?: string | null;
    comments?: string[] | null;
    quote?: FrontendDisputeQuoteInfo | null;
    initiator?: AdminUserBrief | null;
    involved?: AdminUserBrief | null;
}

interface AdminQuote {
    id: string;
    createdAt: string;
    updatedAt: string;
    artistId: string | null;
    customerId: string | null;
    productType: string;
    details: string;
    price: string;
    serviceDate: string;
    serviceTime: string;
    status: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled";
    artist: { id: string; name: string | null; email: string } | null;
    customer: { id: string; name: string | null; email: string } | null;
    review: AdminReview | null;
    disputes: FrontendDispute[];
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
}

interface AdminReview {
    id: string;
    createdAt: string;
    updatedAt: string;
    rating: number;
    comment: string | null;
    quoteId: string | null;
    artistId: string | null;
    customerId: string | null;
    quote: { id: string; productType: string; status: string; serviceDate: string } | null;
    artist: { id: string; name: string | null; email: string } | null;
    customer: { id: string; name: string | null; email: string } | null;
}

interface Withdrawal {
    id: string;
    walletId: string;
    bankAccountId: string;
    amount: number;
    netAmount: number;
    fee: number;
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    failureReason?: string | null;
    razorpayPayoutId?: string | null;
    createdAt: string;
    processedAt?: string | null;
    completedAt?: string | null;
    wallet: {
        user: {
            id: string;
            name: string | null;
            email: string;
            phone: string | null;
        };
    };
    bankAccount: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        accountType?: string;
        upiId?: string | null;
    };
}

interface WalletStats {
    totalWallets: number;
    totalBalance: string;
    pendingWithdrawals: number;
    processingWithdrawals: number;
    completedWithdrawals: {
        count: number;
        totalAmount: string;
    };
    recentTransactions: number;
}

interface UpdateDisputePayload {
    resolution?: string | null;
    status?: "Open" | "Under Review" | "Resolved" | "Closed";
}

const QUOTE_BACKGROUND_COLORS = [
    "#CD8FDE", "#FACCB2", "#F9B6D2", "#A2D9CE", "#FFD8A9",
    "#E6B0AA", "#D7BDE2", "#A9CCE3", "#A3E4D7", "#F9E79F",
];

const getQuoteBackgroundColor = (index: number): string => {
    return QUOTE_BACKGROUND_COLORS[index % QUOTE_BACKGROUND_COLORS.length];
};

export default function AdminDashboardPage() {
    const [user, setUser] = useState<AuthUserRaw | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const [users, setUsersData] = useState<AdminUser[]>([]);
    const [quotes, setQuotesData] = useState<AdminQuote[]>([]);
    const [reviews, setReviewsData] = useState<AdminReview[]>([]);
    const [disputes, setDisputesData] = useState<FrontendDispute[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [walletStats, setWalletStats] = useState<WalletStats | null>(null);

    const [usersLoading, setUsersLoading] = useState(true);
    const [quotesLoading, setQuotesLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [disputesLoading, setDisputesLoading] = useState(true);
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
    const [walletStatsLoading, setWalletStatsLoading] = useState(true);

    const [usersError, setUsersErrorData] = useState<string | null>(null);
    const [quotesError, setQuotesErrorData] = useState<string | null>(null);
    const [reviewsError, setReviewsErrorData] = useState<string | null>(null);
    const [disputesError, setDisputesErrorData] = useState<string | null>(null);
    const [withdrawalsError, setWithdrawalsError] = useState<string | null>(null);
    const [walletStatsError, setWalletStatsError] = useState<string | null>(null);

    const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
    const [isDeletingQuote, setIsDeletingQuote] = useState<string | null>(null);
    const [isDeletingReview, setIsDeletingReview] = useState<string | null>(null);
    const [isDeletingDispute, setIsDeletingDispute] = useState<string | null>(null);
    const [isSubmittingDisputeUpdate, setIsSubmittingDisputeUpdate] = useState(false);
    const [isQuickResolving, setIsQuickResolving] = useState(false);
    const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState<string | null>(null);
    const [isCompletingWithdrawal, setIsCompletingWithdrawal] = useState<string | null>(null);
    const [isFailingWithdrawal, setIsFailingWithdrawal] = useState<string | null>(null);

    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [viewingQuoteId, setViewingQuoteId] = useState<string | null>(null);
    const [viewingReviewId, setViewingReviewId] = useState<string | null>(null);
    const [viewingDisputeId, setViewingDisputeId] = useState<string | null>(null);

    const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
    const [viewingQuote, setViewingQuote] = useState<AdminQuote | null>(null);
    const [viewingReview, setViewingReview] = useState<AdminReview | null>(null);
    const [viewingDispute, setViewingDispute] = useState<FrontendDispute | null>(null);

    const [viewingUserLoading, setViewingUserLoading] = useState(false);
    const [viewingQuoteLoading, setViewingQuoteLoading] = useState(false);
    const [viewingReviewLoading, setViewingReviewLoading] = useState(false);
    const [viewingDisputeLoading, setViewingDisputeLoading] = useState(false);

    const [viewingUserError, setViewingUserErrorData] = useState<string | null>(null);
    const [viewingQuoteError, setViewingQuoteErrorData] = useState<string | null>(null);
    const [viewingReviewError, setViewingReviewErrorData] = useState<string | null>(null);
    const [viewingDisputeError, setViewingDisputeErrorData] = useState<string | null>(null);

    const [resolutionInput, setResolutionInput] = useState('');
    const [disputeStatusInput, setDisputeStatusInput] = useState<FrontendDispute['status']>('Open');
    const [quickResolveDisputeId, setQuickResolveDisputeId] = useState<string | null>(null);
    const [quickResolveNotes, setQuickResolveNotes] = useState("");
    const [withdrawalFailureReason, setWithdrawalFailureReason] = useState("");
    const [razorpayPayoutId, setRazorpayPayoutId] = useState("");

    const userSearchInputRef = useRef<HTMLInputElement>(null);
    const quoteSearchInputRef = useRef<HTMLInputElement>(null);
    const reviewSearchInputRef = useRef<HTMLInputElement>(null);
    const disputeSearchInputRef = useRef<HTMLInputElement>(null);
    const withdrawalSearchInputRef = useRef<HTMLInputElement>(null);

    const [userFilterGeneral, setUserFilterGeneral] = useState('');
    const [userFilterRole, setUserFilterRole] = useState('all');
    const [quoteFilterGeneral, setQuoteFilterGeneral] = useState('');
    const [quoteFilterStatus, setQuoteFilterStatus] = useState('all');
    const [reviewFilterGeneral, setReviewFilterGeneral] = useState('');
    const [reviewFilterRating, setReviewFilterRating] = useState('all');
    const [disputeFilterGeneral, setDisputeFilterGeneral] = useState('');
    const [disputeFilterStatus, setDisputeFilterStatus] = useState('all');
    const [withdrawalFilterStatus, setWithdrawalFilterStatus] = useState('all');

    const analyticsRef = useRef<HTMLDivElement>(null);
    const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | '7d' | '30d' | 'year' | 'custom'>('30d');
    const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange | undefined>({
        from: subDays(startOfToday(), 29),
        to: endOfToday(),
    });
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [csrfFetchAttempted, setCsrfFetchAttempted] = useState(false);

    const uniqueUserRoles = useMemo(() =>
        Array.from(new Set(users.map(u => u.role))).sort()
    , [users]);

    const uniqueQuoteStatuses = useMemo(() =>
        Array.from(new Set(quotes.map(q => q.status))).sort()
    , [quotes]);

    const uniqueDisputeStatuses = useMemo(() =>
        Array.from(new Set(disputes.map(d => d.status))).sort()
    , [disputes]);

    const uniqueWithdrawalStatuses = useMemo(() =>
        Array.from(new Set(withdrawals.map(w => w.status))).sort()
    , [withdrawals]);

    const filteredUsers = useMemo(() => {
        let filtered = users;
        if (userFilterGeneral) {
            const lowerCaseFilter = userFilterGeneral.toLowerCase();
            filtered = filtered.filter(user =>
                (user.name?.toLowerCase() || '').includes(lowerCaseFilter) ||
                user.email.toLowerCase().includes(lowerCaseFilter) ||
                user.id.toLowerCase().includes(lowerCaseFilter)
            );
        }
        if (userFilterRole && userFilterRole !== "all") {
            filtered = filtered.filter(user => user.role === userFilterRole);
        }
        return filtered;
    }, [users, userFilterGeneral, userFilterRole]);

    const filteredQuotes = useMemo(() => {
        let filtered = quotes;
        if (quoteFilterGeneral) {
            const lowerCaseFilter = quoteFilterGeneral.toLowerCase();
            filtered = filtered.filter(quote =>
                quote.id.toLowerCase().includes(lowerCaseFilter) ||
                quote.productType.toLowerCase().includes(lowerCaseFilter) ||
                (quote.artist?.name?.toLowerCase() || '').includes(lowerCaseFilter) ||
                (quote.artist?.email?.toLowerCase() || '').includes(lowerCaseFilter) ||
                 (quote.customer?.name?.toLowerCase() || '').includes(lowerCaseFilter) ||
                 (quote.customer?.email?.toLowerCase() || '').includes(lowerCaseFilter)
            );
        }
        if (quoteFilterStatus && quoteFilterStatus !== "all") {
            filtered = filtered.filter(quote => quote.status === quoteFilterStatus);
        }
        return filtered;
    }, [quotes, quoteFilterGeneral, quoteFilterStatus]);

     const filteredReviews = useMemo(() => {
         let filtered = reviews;
         if (reviewFilterGeneral) {
              const lowerCaseFilter = reviewFilterGeneral.toLowerCase();
              filtered = filtered.filter(review =>
                 review.id.toLowerCase().includes(lowerCaseFilter) ||
                 (review.artist?.name?.toLowerCase() || '').includes(lowerCaseFilter) ||
                 (review.artist?.email?.toLowerCase() || '').includes(lowerCaseFilter) ||
                 (review.customer?.name?.toLowerCase() || '').includes(lowerCaseFilter) ||
                 (review.customer?.email?.toLowerCase() || '').includes(lowerCaseFilter)
              );
         }
         if (reviewFilterRating && reviewFilterRating !== "all") {
             const rating = parseInt(reviewFilterRating, 10);
              if (!isNaN(rating)) {
                   filtered = filtered.filter(review => review.rating === rating);
              }
         }
         return filtered;
     }, [reviews, reviewFilterGeneral, reviewFilterRating]);

    const filteredDisputes = useMemo(() => {
         let filtered = disputes;
         if (disputeFilterGeneral) {
             const lowerCaseFilter = disputeFilterGeneral.toLowerCase();
             filtered = filtered.filter(dispute =>
                 dispute.id.toLowerCase().includes(lowerCaseFilter) ||
                 (dispute.reason || '').toLowerCase().includes(lowerCaseFilter) ||
                 (dispute.details || '').toLowerCase().includes(lowerCaseFilter) ||
                 (dispute.initiator?.name?.toLowerCase() || '').includes(lowerCaseFilter) ||
                 (dispute.initiator?.email?.toLowerCase() || '').includes(lowerCaseFilter) ||
                 dispute.initiatorId.toLowerCase().includes(lowerCaseFilter) ||
                  (dispute.involved?.name?.toLowerCase() || '').includes(lowerCaseFilter) ||
                  (dispute.involved?.email?.toLowerCase() || '').includes(lowerCaseFilter) ||
                  dispute.involvedId.toLowerCase().includes(lowerCaseFilter) ||
                   dispute.quoteId.toLowerCase().includes(lowerCaseFilter) ||
                   (dispute.quote?.productType.toLowerCase() || '').includes(lowerCaseFilter)
             );
         }
         if (disputeFilterStatus && disputeFilterStatus !== "all") {
             filtered = filtered.filter(dispute => dispute.status === disputeFilterStatus);
         }
         return filtered;
    }, [disputes, disputeFilterGeneral, disputeFilterStatus]);

    const filteredWithdrawals = useMemo(() => {
        let filtered = withdrawals;
        if (withdrawalFilterStatus && withdrawalFilterStatus !== "all") {
            filtered = filtered.filter(withdrawal => withdrawal.status === withdrawalFilterStatus);
        }
        return filtered;
    }, [withdrawals, withdrawalFilterStatus]);

    const isCriticalActionInProgress = useMemo(() => {
        return !!isDeletingUser || !!isDeletingQuote || !!isDeletingReview || !!isDeletingDispute ||
               isSubmittingDisputeUpdate || isQuickResolving || isGeneratingPDF ||
               !!isProcessingWithdrawal || !!isCompletingWithdrawal || !!isFailingWithdrawal;
    }, [
        isDeletingUser, isDeletingQuote, isDeletingReview, isDeletingDispute,
        isSubmittingDisputeUpdate, isQuickResolving, isGeneratingPDF,
        isProcessingWithdrawal, isCompletingWithdrawal, isFailingWithdrawal
    ]);

    const isBackgroundLoading = useMemo(() => {
        return usersLoading || quotesLoading || reviewsLoading || disputesLoading || 
               withdrawalsLoading || walletStatsLoading;
    }, [usersLoading, quotesLoading, reviewsLoading, disputesLoading, withdrawalsLoading, walletStatsLoading]);

    const isModalLoading = useMemo(() => {
        return viewingUserLoading || viewingQuoteLoading || viewingReviewLoading || viewingDisputeLoading;
    }, [viewingUserLoading, viewingQuoteLoading, viewingReviewLoading, viewingDisputeLoading]);

    const isAnyActionInProgress = isCriticalActionInProgress;

    const isCsrfActionDisabled = !csrfToken && csrfFetchAttempted && (!user || user.role !== 'admin');

    const fetchCsrfToken = useCallback(async (): Promise<string | null> => {
        if (csrfToken) return csrfToken;
        if (csrfFetchAttempted && !csrfToken) return null;

        setCsrfFetchAttempted(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' });
            if (!response.ok) {
                console.error("Failed to fetch CSRF token:", response.status, response.statusText);
                setCsrfToken(null);
                return null;
            }
            const data = await response.json();
            if (!data.csrfToken) {
                 console.error("CSRF token not found in response body.");
                 setCsrfToken(null);
                 return null;
            }
            setCsrfToken(data.csrfToken);
            return data.csrfToken;
        } catch (error) {
            console.error("Error fetching CSRF token:", error);
            setCsrfToken(null);
            return null;
        }
    }, [csrfToken, csrfFetchAttempted]);

    useEffect(() => {
      fetchCsrfToken();
    }, [fetchCsrfToken]);

    useEffect(() => {
        const fetchUserData = async () => {
            setUserLoading(true);
            setUserError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
                if (!response.ok) {
                    const errorStatus = response.status;
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${errorStatus}` }));
                    const specificErrorMessage = errorData.message || `Failed to fetch user: ${response.statusText}`;
                    setUser(null);
                    if (errorStatus === 401 || errorStatus === 403) {
                         if (pathname.startsWith('/admin')) {
                              setUserError("Authentication required or access denied.");
                              sonnerToast.error("Access Denied", { description: "Please log in with an admin account." });
                              router.push('/admin-login');
                         } else {
                             setUserError(specificErrorMessage);
                         }
                    } else {
                         setUserError(specificErrorMessage);
                         sonnerToast.error("Error Loading User", { description: specificErrorMessage });
                    }
                    return;
                }
                const data: { user: AuthUserRaw } = await response.json();
                if (data.user.role !== 'admin') {
                    const errMsg = "Access denied. Administrators only.";
                    setUserError(errMsg); setUser(null);
                    sonnerToast.error("Access Denied", { description: errMsg });
                    if (data.user.role === 'artist') router.push('/artist');
                    else if (data.user.role === 'customer') router.push('/customer');
                    else router.push('/');
                    return;
                }
                setUser(data.user); setUserError(null);
            } catch (err: any) {
                const errMsg = 'Failed to load user data: ' + (err.message || "Unknown error");
                if (!user) { setUser(null); setUserError(errMsg); sonnerToast.error("Login Required", { description: "Please log in to access the dashboard." }); router.push('/admin-login'); }
            } finally { setUserLoading(false); }
        };
        if (!user && userLoading) {
           fetchUserData();
        } else if (user && user.role !== 'admin' && !userLoading) {
            const errMsg = "Access denied. Administrators only.";
            setUserError(errMsg); setUser(null);
            sonnerToast.error("Access Denied", { description: errMsg });
             router.push(user.role === 'artist' ? '/artist' : user.role === 'customer' ? '/customer' : '/');
        } else if (user && user.role === 'admin' && userError) {
             setUserError(null);
        }
    }, [router, pathname, user, userLoading, userError]);

    const fetchData = useCallback(async (endpoint: 'users' | 'quotes' | 'reviews' | 'disputes' | 'withdrawals/pending' | 'wallet/statistics', setLoading: (loading: boolean) => void, setData: (data: any) => void, setError: (error: string | null) => void) => {
        if (!user || user.role !== 'admin' || userError) {
             setData([]);
             setLoading(false);
             if (!userError) {
                if (!user) setError("Authentication required.");
                else if (user.role !== 'admin') setError("User is not an admin.");
             }
             return;
        }

        setLoading(true); setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/${endpoint}`, { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                 const errorMsg = errorData.message || `Failed to fetch ${endpoint}: ${response.statusText}`;
                 if (response.status !== 401 && response.status !== 403) {
                      setError(errorMsg);
                      sonnerToast.error(`Error Loading ${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}`, { description: errorMsg });
                 } else {
                      setError("Authentication or permissions error.");
                 }
                throw new Error(errorMsg);
            }
            const data = await response.json(); setData(data);
        } catch (err: any) {
            setData([]);
        } finally { setLoading(false); }
    }, [user, userError]);

    useEffect(() => {
        if (user && user.role === 'admin' && !userError) {
            fetchData('users', setUsersLoading, setUsersData, setUsersErrorData);
            fetchData('quotes', setQuotesLoading, setQuotesData, setQuotesErrorData);
            fetchData('reviews', setReviewsLoading, setReviewsData, setReviewsErrorData);
            fetchData('disputes', setDisputesLoading, setDisputesData, setDisputesErrorData);
            fetchData('withdrawals/pending', setWithdrawalsLoading, setWithdrawals, setWithdrawalsError);
            fetchData('wallet/statistics', setWalletStatsLoading, setWalletStats, setWalletStatsError);
        }
    }, [user, userError, fetchData]);

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

    const handleRefreshData = () => {
         if (user && user.role === 'admin' && !userError) {
            sonnerToast.info("Refreshing Data...", { duration: 1500});
             fetchData('users', setUsersLoading, setUsersData, setUsersErrorData);
             fetchData('quotes', setQuotesLoading, setQuotesData, setQuotesErrorData);
             fetchData('reviews', setReviewsLoading, setReviewsData, setReviewsErrorData);
             fetchData('disputes', setDisputesLoading, setDisputesData, setDisputesErrorData);
            fetchData('withdrawals/pending', setWithdrawalsLoading, setWithdrawals, setWithdrawalsError);
            fetchData('wallet/statistics', setWalletStatsLoading, setWalletStats, setWalletStatsError);
         } else {
             if (userError) {
                 sonnerToast.error("Refresh Failed", { description: `Cannot refresh due to a previous error: ${userError}` });
             } else if (!user) {
                  sonnerToast.warning("Refresh Failed", { description: "User not logged in." });
             } else {
                  sonnerToast.warning("Refresh Failed", { description: "You do not have permission to refresh data." });
             }
         }
    };

     const fetchItemDetails = useCallback(async <T extends AdminUser | AdminQuote | AdminReview | FrontendDispute>(
        itemType: 'users' | 'quotes' | 'reviews' | 'disputes', itemId: string | null,
        setLoading: (loading: boolean) => void, setData: (data: T | null) => void, setError: (error: string | null) => void
     ) => {
         if (!itemId || !user || user.role !== 'admin' || userError) {
             setData(null);
             setLoading(false);
              if (!userError && itemId) setError("Authentication or permissions error.");
             return;
         }

         setLoading(true); setError(null); setData(null);
         try {
             const response = await fetch(`${API_BASE_URL}/api/admin/${itemType}/${itemId}`, { credentials: 'include' });
             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                 const singular = itemType === 'users' ? 'user' : itemType.slice(0, -1);
                 const errorMsg = errorData.message || `Failed to fetch ${singular} details: ${response.statusText}`;
                 if (response.status !== 404) sonnerToast.error(`Error Loading ${singular.charAt(0).toUpperCase() + singular.slice(1)} Details`, { description: errorMsg });
                 throw new Error(errorMsg);
             }
             const data = await response.json(); setData(data as T); setError(null);
         } catch (err: any) {
             setError(`Failed to load details: ` + (err.message || "Unknown error")); setData(null);
         } finally { setLoading(false); }
     }, [user, userError]);

    useEffect(() => {
         if (viewingUserId) fetchItemDetails<AdminUser>('users', viewingUserId, setViewingUserLoading, setViewingUser, setViewingUserErrorData);
         else { setViewingUser(null); setViewingUserErrorData(null); setViewingUserLoading(false); }
    }, [viewingUserId, fetchItemDetails]);

    useEffect(() => {
         if (viewingQuoteId) fetchItemDetails<AdminQuote>('quotes', viewingQuoteId, setViewingQuoteLoading, setViewingQuote, setViewingQuoteErrorData);
         else { setViewingQuote(null); setViewingQuoteErrorData(null); setViewingQuoteLoading(false); }
    }, [viewingQuoteId, fetchItemDetails]);

     useEffect(() => {
         if (viewingReviewId) fetchItemDetails<AdminReview>('reviews', viewingReviewId, setViewingReviewLoading, setViewingReview, setViewingReviewErrorData);
         else { setViewingReview(null); setViewingReviewErrorData(null); setViewingReviewLoading(false); }
     }, [viewingReviewId, fetchItemDetails]);

     useEffect(() => {
         if (viewingDisputeId) {
             fetchItemDetails<FrontendDispute>('disputes', viewingDisputeId, setViewingDisputeLoading, setViewingDispute, setViewingDisputeErrorData);
         } else {
             setViewingDispute(null); setViewingDisputeErrorData(null); setViewingDisputeLoading(false);
             setResolutionInput('');
             setDisputeStatusInput('Open');
         }
     }, [viewingDisputeId, fetchItemDetails]);

     useEffect(() => {
        if (viewingDispute) {
            setResolutionInput(viewingDispute.resolution || '');
            setDisputeStatusInput(viewingDispute.status);
        }
     }, [viewingDispute]);

    const handleLogout = async () => {
        if (!user) { router.push('/admin-login'); return; }
        let token = csrfToken || await fetchCsrfToken();
        if (!token && csrfFetchAttempted) { sonnerToast.error("Logout Failed", { description: "Security token unavailable. Please refresh and try again." }); return; }
        if (!token && !csrfFetchAttempted) {
             token = await fetchCsrfToken();
             if (!token) sonnerToast.warning("Proceeding logout without security token. May fail.", { duration: 3000 });
        }

        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['CSRF-Token'] = token;

            const response = await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include', headers: headers });

            if (response.ok) {
                sonnerToast.success("Logged Out");
            } else {
                const errorData = await response.json().catch(() => ({ message: "Unknown logout error" }));
                 console.error("Logout API failed:", response.status, errorData.message);
                 sonnerToast.error("Logout Failed", { description: errorData.message || "Failed to log out." });
            }
        } catch (err: any) {
            console.error("Logout fetch error:", err);
            sonnerToast.error("Logout Error", { description: err.message || "An error occurred during logout." });
        } finally {
             setUser(null); setCsrfToken(null); setCsrfFetchAttempted(false);
             setUsersData([]); setQuotesData([]); setReviewsData([]); setDisputesData([]);
             setUsersErrorData(null); setQuotesErrorData(null); setReviewsErrorData(null); setDisputesErrorData(null);
             setViewingUserId(null); setViewingQuoteId(null); setViewingReviewId(null); setViewingDisputeId(null);
             router.push('/admin-login');
        }
    };

    const getInitials = (name?: string | null): string => {
      if (!name || name.trim() === "") return "AD";
      const parts = name.trim().split(' ').filter(p => p.length > 0);
      if (parts.length === 0) return "AD";
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase() || "AD";
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const formatDateSafely = (dateInput: string | Date | null | undefined, dateFormat: string = "PPP") => {
        if (!dateInput) return 'N/A';
        let dateToFormat: Date;

        if (typeof dateInput === 'string') {
             const isoDate = parseISO(dateInput);
             if (dateFnsIsValid(isoDate)) {
                  dateToFormat = isoDate;
             } else {
                 const dateObj = new Date(dateInput);
                 if (dateFnsIsValid(dateObj)) {
                     dateToFormat = dateObj;
                 } else {
                     return typeof dateInput === 'string' && dateInput.length > 0 ? dateInput : 'Invalid Date';
                 }
             }
        } else if (dateInput instanceof Date) {
            dateToFormat = dateInput;
        } else {
            return 'Invalid Date Input';
        }

        if (!dateFnsIsValid(dateToFormat)) {
             return typeof dateInput === 'string' && dateInput.length > 0 ? dateInput : 'Invalid Date';
        }

        try {
            return format(dateToFormat, dateFormat);
        } catch (e) {
            console.error("Error formatting date:", e, dateInput);
            return 'Error Formatting';
        }
    };

     const getStatusColorClasses = (status: string | undefined) => {
        switch (status) {
          case "Accepted": return "bg-green-500/20 text-green-300 border-green-500/50";
          case "Pending": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
          case "Booked": return "bg-blue-500/20 text-blue-300 border-blue-500/50";
          case "Completed": return "bg-purple-500/20 text-purple-300 border-purple-500/50";
          case "Cancelled": return "bg-gray-500/20 text-gray-300 border-gray-600/50";
          default: return "bg-zinc-700/30 text-zinc-300 border-zinc-600/50";
        }
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

    const getWithdrawalStatusColorClasses = (status: string | undefined) => {
        switch (status) {
            case "Pending": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
            case "Processing": return "bg-blue-500/20 text-blue-300 border-blue-500/50";
            case "Completed": return "bg-green-500/20 text-green-300 border-green-500/50";
            case "Failed": return "bg-red-500/20 text-red-300 border-red-500/50";
            default: return "bg-zinc-700/30 text-zinc-300 border-zinc-600/50";
        }
    };

     const closeDetailModals = () => {
         setViewingUserId(null);
         setViewingQuoteId(null);
         setViewingReviewId(null);
         setViewingDisputeId(null);
     };

    const performDeleteAction = async (
        actionType: 'User' | 'Quote' | 'Review' | 'Dispute', itemId: string,
        setDeletingState: (id: string | null) => void, apiEndpoint: string, successCallback: () => void
    ) => {
        if (!user || user.role !== 'admin') { sonnerToast.error("Permission Denied"); return; }
        if (actionType === 'User' && user && itemId === user.id) { sonnerToast.error("Action Not Allowed", { description: "Cannot delete your own account." }); return; }
        let token = csrfToken || await fetchCsrfToken();
         if (!token) {
            sonnerToast.error("Action Failed", { description: "Security token unavailable. Please refresh and try again." });
             return;
         }

        setDeletingState(itemId);
        try {
             const headers: HeadersInit = { 'Content-Type': 'application/json' };
             if (token) headers['CSRF-Token'] = token;

            const response = await fetch(apiEndpoint, { method: 'DELETE', credentials: 'include', headers: headers });

            const responseData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            if (!response.ok) {
                 if (response.status === 409) {
                     sonnerToast.error("Deletion Failed", { description: responseData.message || `Cannot delete ${actionType.toLowerCase()} due to related data.` });
                 } else {
                     sonnerToast.error("Deletion Failed", { description: responseData.message || `Failed to delete ${actionType.toLowerCase()}: ${response.statusText}` });
                 }
                 throw new Error(responseData.message || `Failed to delete ${actionType.toLowerCase()}`);
            }

            successCallback();
            sonnerToast.success(`${actionType} Deleted`, { description: `${actionType} (ID: ${itemId}) deleted.`, duration: 3000 });

            if (
                (actionType === 'User' && viewingUserId === itemId) ||
                (actionType === 'Quote' && viewingQuoteId === itemId) ||
                (actionType === 'Review' && viewingReviewId === itemId) ||
                (actionType === 'Dispute' && viewingDisputeId === itemId)
            ) {
                closeDetailModals();
            }

        } catch (err: any) {
            if (!err.message.startsWith('Failed to delete')) {
               sonnerToast.error("Deletion Error", { description: err.message || "An error occurred during deletion." });
            }
        } finally { setDeletingState(null); }
    };

    const handleDeleteUser = (userId: string) => {
        performDeleteAction('User', userId, setIsDeletingUser, `${API_BASE_URL}/api/admin/users/${userId}`, () => {
            setUsersData(prev => prev.filter(u => u.id !== userId));
             setQuotesData(prev => prev.filter(q => q.artistId !== userId && q.customerId !== userId));
             setReviewsData(prev => prev.filter(r => r.artistId !== userId && r.customerId !== userId));
             setDisputesData(prev => prev.filter(d => d.initiatorId !== userId && d.involvedId !== userId));
        });
    };

    const handleDeleteQuote = (quoteId: string) => {
        performDeleteAction('Quote', quoteId, setIsDeletingQuote, `${API_BASE_URL}/api/admin/quotes/${quoteId}`, () => {
            setQuotesData(prev => prev.filter(q => q.id !== quoteId));
             setReviewsData(prev => prev.filter(r => r.quoteId !== quoteId));
             setDisputesData(prev => prev.filter(d => d.quoteId !== quoteId));
        });
    };

    const handleDeleteReview = (reviewId: string) => {
        performDeleteAction('Review', reviewId, setIsDeletingReview, `${API_BASE_URL}/api/admin/reviews/${reviewId}`, () => {
            setReviewsData(prev => prev.filter(r => r.id !== reviewId));
            setQuotesData(prev => prev.map(q => q.review?.id === reviewId ? { ...q, review: null } : q));
        });
    };

    const handleDeleteDispute = (disputeId: string) => {
        performDeleteAction('Dispute', disputeId, setIsDeletingDispute, `${API_BASE_URL}/api/admin/disputes/${disputeId}`, () => {
            setDisputesData(prev => prev.filter(d => d.id !== disputeId));
            setQuotesData(prev => prev.map(q => ({ ...q, disputes: q.disputes.filter(d => d.id !== disputeId) })));
        });
    };

    const handleUpdateDispute = async (disputeId: string, payload: UpdateDisputePayload, isQuickResolve = false) => {
        if (!user || user.role !== 'admin') {
            sonnerToast.error("Permission Denied", { description: "Only admins can update disputes." });
            return;
        }
        let token = csrfToken || await fetchCsrfToken();
         if (!token) {
            sonnerToast.error("Update Failed", { description: "Security token unavailable. Please refresh and try again." });
             return;
         }

        if (isQuickResolve) setIsQuickResolving(true);
        else setIsSubmittingDisputeUpdate(true);

        try {
             const headers: HeadersInit = { 'Content-Type': 'application/json' };
             if (token) headers['CSRF-Token'] = token;

            const response = await fetch(`${API_BASE_URL}/api/admin/disputes/${disputeId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify(payload),
            });

            const responseData: FrontendDispute = await response.json();

            if (!response.ok) {
                 const errorMsg = (responseData as any).message || `Failed to update dispute: ${response.statusText}`;
                 sonnerToast.error("Update Failed", { description: errorMsg });
                 throw new Error(errorMsg);
            }

            if (viewingDispute && viewingDispute.id === disputeId) {
                 setViewingDispute(responseData);
                 setResolutionInput(responseData.resolution || '');
                 setDisputeStatusInput(responseData.status);
            }

            setDisputesData(prevDisputes =>
                prevDisputes.map(d => (d.id === disputeId ? responseData : d))
            );

            // Update quotes list to reflect dispute status change
            setQuotesData(prevQuotes =>
                prevQuotes.map(q => {
                    if (q.disputes && q.disputes.some(d => d.id === disputeId)) {
                        return {
                            ...q,
                            disputes: q.disputes.map(d => d.id === disputeId ? responseData : d)
                        };
                    }
                    return q;
                })
            );

            if (viewingQuote && viewingQuote.disputes.some(d => d.id === disputeId)) {
                setViewingQuote(prevQuote => {
                    if (!prevQuote) return null;
                    return {
                        ...prevQuote,
                        disputes: prevQuote.disputes.map(d => d.id === disputeId ? responseData : d)
                    };
                });
            }

            sonnerToast.success("Dispute Updated", { description: `Dispute (ID: ${disputeId}) updated successfully.` });

            if (isQuickResolve) {
                setQuickResolveDisputeId(null);
                setQuickResolveNotes("");
            }

        } catch (err: any) {
             if (!err.message.startsWith('Failed to update')) {
                sonnerToast.error("Update Error", { description: err.message || "An error occurred during update." });
             }
        } finally {
             if (isQuickResolve) setIsQuickResolving(false);
             else setIsSubmittingDisputeUpdate(false);
        }
    };

    const handleApproveWithdrawal = async (withdrawalId: string) => {
        if (!user || user.role !== 'admin') {
            sonnerToast.error("Permission Denied", { description: "Only admins can approve withdrawals." });
            return;
        }
        let token = csrfToken || await fetchCsrfToken();
        if (!token) {
            sonnerToast.error("Action Failed", { description: "Security token unavailable. Please refresh and try again." });
            return;
        }

        setIsProcessingWithdrawal(withdrawalId);
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['CSRF-Token'] = token;

            const response = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/approve`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.message || `Failed to approve withdrawal: ${response.statusText}`;
                sonnerToast.error("Approval Failed", { description: errorMsg });
                throw new Error(errorMsg);
            }

            setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? responseData.withdrawal : w));
            sonnerToast.success("Withdrawal Approved", { description: `Withdrawal marked as processing.` });

        } catch (err: any) {
            if (!err.message.startsWith('Failed to approve')) {
                sonnerToast.error("Approval Error", { description: err.message || "An error occurred during approval." });
            }
        } finally {
            setIsProcessingWithdrawal(null);
        }
    };

    const handleCompleteWithdrawal = async (withdrawalId: string) => {
        if (!user || user.role !== 'admin') {
            sonnerToast.error("Permission Denied", { description: "Only admins can complete withdrawals." });
            return;
        }
        let token = csrfToken || await fetchCsrfToken();
        if (!token) {
            sonnerToast.error("Action Failed", { description: "Security token unavailable. Please refresh and try again." });
            return;
        }

        setIsCompletingWithdrawal(withdrawalId);
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['CSRF-Token'] = token;

            const response = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/complete`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.message || `Failed to complete withdrawal: ${response.statusText}`;
                sonnerToast.error("Completion Failed", { description: errorMsg });
                throw new Error(errorMsg);
            }

            setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? responseData.withdrawal : w));
            setRazorpayPayoutId("");
            sonnerToast.success("Withdrawal Completed", { description: `Withdrawal marked as completed.` });

        } catch (err: any) {
            if (!err.message.startsWith('Failed to complete')) {
                sonnerToast.error("Completion Error", { description: err.message || "An error occurred during completion." });
            }
        } finally {
            setIsCompletingWithdrawal(null);
        }
    };

    const handleFailWithdrawal = async (withdrawalId: string) => {
        if (!user || user.role !== 'admin') {
            sonnerToast.error("Permission Denied", { description: "Only admins can fail withdrawals." });
            return;
        }
        if (!withdrawalFailureReason.trim()) {
            sonnerToast.error("Reason Required", { description: "Please provide a failure reason." });
            return;
        }

        let token = csrfToken || await fetchCsrfToken();
        if (!token) {
            sonnerToast.error("Action Failed", { description: "Security token unavailable. Please refresh and try again." });
            return;
        }

        setIsFailingWithdrawal(withdrawalId);
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['CSRF-Token'] = token;

            const response = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/fail`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify({ reason: withdrawalFailureReason }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.message || `Failed to mark withdrawal as failed: ${response.statusText}`;
                sonnerToast.error("Action Failed", { description: errorMsg });
                throw new Error(errorMsg);
            }

            setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? responseData.withdrawal : w));
            setWithdrawalFailureReason("");
            sonnerToast.success("Withdrawal Failed", { description: `Withdrawal marked as failed and amount refunded.` });

        } catch (err: any) {
            if (!err.message.startsWith('Failed to mark')) {
                sonnerToast.error("Action Error", { description: err.message || "An error occurred." });
            }
        } finally {
            setIsFailingWithdrawal(null);
        }
    };

    const {
        usersInPeriod, quotesInPeriod, reviewsInPeriod, disputesInPeriod,
        totalRevenueInPeriod, completedQuotesInPeriod,
        quoteConversionRateInPeriod,
        averageRatingInPeriod,
        openDisputesInPeriod,
        userGrowthData, quoteStatusDistributionData, disputeReasonDistributionData,
        quoteProductTypeDistributionData
    } = useMemo(() => {
        const { from, to } = analyticsDateRange || {};
        const isWithinSelectedInterval = (dateString: string | Date) => {
            if (!from || !to) return true;
             let date: Date;
             if (dateString instanceof Date) {
                 date = dateString;
             } else {
                 date = parseISO(dateString);
             }
            return dateFnsIsValid(date) && isWithinInterval(date, { start: from, end: to });
        };

        const usersInPeriod = analyticsDateRange === undefined ? users : users.filter(user => isWithinSelectedInterval(user.createdAt));
        const quotesInPeriod = analyticsDateRange === undefined ? quotes : quotes.filter(quote => isWithinSelectedInterval(quote.createdAt));
        const reviewsInPeriod = analyticsDateRange === undefined ? reviews : reviews.filter(review => isWithinSelectedInterval(review.createdAt));
        const disputesInPeriod = analyticsDateRange === undefined ? disputes : disputes.filter(dispute => isWithinSelectedInterval(dispute.createdAt));

        const completedQuotesInPeriod = quotesInPeriod.filter(q => q.status === 'Completed');
        const totalRevenueInPeriod = completedQuotesInPeriod.reduce((sum, q) => sum + parseFloat(q.price || '0'), 0);
        const quoteConversionRateInPeriod = quotesInPeriod.length > 0 ? (completedQuotesInPeriod.length / quotesInPeriod.length) * 100 : 0;

        const ratedReviews = reviewsInPeriod.filter(r => r.rating != null);
        const totalRating = ratedReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRatingInPeriod = ratedReviews.length > 0 ? totalRating / ratedReviews.length : null;

        const openDisputesInPeriod = disputesInPeriod.filter(d => d.status === 'Open' || d.status === 'Under Review').length;

        const userGrowthData = (() => {
            const periodUsers = analyticsDateRange === undefined ? users : users.filter(user => {
                const createdDate = parseISO(user.createdAt);
                 return dateFnsIsValid(createdDate) && (analyticsDateRange === undefined || isWithinInterval(createdDate, { start: analyticsDateRange.from!, end: analyticsDateRange.to! }));
            }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            if (periodUsers.length === 0) return { labels: [], datasets: [] };

            const startDate = analyticsDateRange?.from ? new Date(analyticsDateRange.from) : parseISO(periodUsers[0].createdAt);
            const endDate = analyticsDateRange?.to ? new Date(analyticsDateRange.to) : endOfToday();

             if (!dateFnsIsValid(startDate) || !dateFnsIsValid(endDate)) return { labels: [], datasets: [] };

            const labels: string[] = [];
             let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
             const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

             while(currentMonth <= endMonth) {
                 labels.push(format(currentMonth, 'MMM yyyy'));
                 currentMonth.setMonth(currentMonth.getMonth() + 1);
             }

            const counts = labels.map(label => {
                 const monthEndDate = new Date(parseISO(`${label}-01`));
                 monthEndDate.setMonth(monthEndDate.getMonth() + 1);
                 monthEndDate.setDate(0);
                 monthEndDate.setHours(23, 59, 59, 999);

                 const usersJoinedUpToMonth = periodUsers.filter(user => {
                      const createdDate = parseISO(user.createdAt);
                      return dateFnsIsValid(createdDate) && isBefore(createdDate, monthEndDate);
                 });
                 return usersJoinedUpToMonth.length;
            });

             const diffInMonths = (endDate.getFullYear() * 12 + endDate.getMonth()) - (startDate.getFullYear() * 12 + startDate.getMonth());
             if (diffInMonths < 6) {
                 const dailyDataPoints: { [key: string]: number } = {};
                 periodUsers.forEach(user => {
                      const dayKey = format(parseISO(user.createdAt), 'yyyy-MM-dd');
                      dailyDataPoints[dayKey] = (dailyDataPoints[dayKey] || 0) + 1;
                 });
                 const dailyLabels = Object.keys(dailyDataPoints).sort();
                  const dailyCounts = dailyLabels.map(day => dailyDataPoints[day]);

                 return {
                      labels: dailyLabels.map(d => format(parseISO(d), 'MMM d')),
                      datasets: [
                           {
                               label: 'New Users',
                               data: dailyCounts,
                               borderColor: '#EC4899',
                               backgroundColor: 'rgba(236, 72, 153, 0.2)',
                               tension: 0.3,
                               pointRadius: 3,
                           },
                      ],
                 };
             }

             return {
                 labels: labels,
                 datasets: [
                     {
                         label: 'Total Users (Cumulative)',
                         data: counts,
                         borderColor: '#EC4899',
                         backgroundColor: 'rgba(236, 72, 153, 0.2)',
                         fill: true,
                         tension: 0.3,
                         pointRadius: 3,
                     },
                 ],
             };
        })();

        const quoteStatusDistributionData = {
            labels: ['Pending', 'Accepted', 'Booked', 'Completed', 'Cancelled'],
            datasets: [
                {
                    label: 'Quote Statuses',
                    data: [
                        quotesInPeriod.filter(q => q.status === 'Pending').length,
                        quotesInPeriod.filter(q => q.status === 'Accepted').length,
                        quotesInPeriod.filter(q => q.status === 'Booked').length,
                        completedQuotesInPeriod.length,
                        quotesInPeriod.filter(q => q.status === 'Cancelled').length,
                    ],
                    backgroundColor: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#6B7280'],
                    borderColor: ['#161616', '#161616', '#161616', '#161616', '#161616'],
                    borderWidth: 2,
                },
            ],
        };

         const disputeReasonDistributionData = (() => {
             const reasons = disputesInPeriod.map(d => d.reason).filter(Boolean) as string[];
             const reasonCounts: { [key: string]: number } = {};
             reasons.forEach(reason => {
                 reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
             });

             const sortedReasons = Object.keys(reasonCounts).sort((a, b) => reasonCounts[b] - reasonCounts[a]);
             const topReasons = sortedReasons.slice(0, 5);
             const otherCount = sortedReasons.slice(5).reduce((sum, reason) => sum + reasonCounts[reason], 0);

             const labels = topReasons;
             const data = topReasons.map(reason => reasonCounts[reason]);
             const backgroundColors = ['#EF4444', '#F97316', '#EAB308', '#A855F7', '#3B82F6'];
             const borderColors = ['#161616', '#161616', '#161616', '#161616', '#161616'];

             if (otherCount > 0) {
                  labels.push('Other');
                  data.push(otherCount);
                  backgroundColors.push('#6B7280');
                  borderColors.push('#161616');
             }

             return {
                 labels: labels,
                 datasets: [
                     {
                         label: 'Number of Disputes',
                         data: data,
                         backgroundColor: backgroundColors,
                         borderColor: borderColors,
                         borderWidth: 1,
                     },
                 ],
             };
         })();

         const quoteProductTypeDistributionData = (() => {
             const productTypes = quotesInPeriod.map(q => q.productType).filter(Boolean) as string[];
             const typeCounts: { [key: string]: number } = {};
             productTypes.forEach(type => {
                 typeCounts[type] = (typeCounts[type] || 0) + 1;
             });

             const sortedTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);
             const labels = sortedTypes;
             const data = sortedTypes.map(type => typeCounts[type]);

             const backgroundColors = labels.map((_, index) => QUOTE_BACKGROUND_COLORS[index % QUOTE_BACKGROUND_COLORS.length]);
             const borderColors = backgroundColors.map(() => '#161616');

             return {
                 labels: labels,
                 datasets: [
                     {
                         label: 'Number of Quotes',
                         data: data,
                         backgroundColor: backgroundColors,
                         borderColor: borderColors,
                         borderWidth: 1,
                     },
                 ],
             };
         })();

        return {
            usersInPeriod, quotesInPeriod, reviewsInPeriod, disputesInPeriod,
            totalRevenueInPeriod, completedQuotesInPeriod,
            quoteConversionRateInPeriod,
            averageRatingInPeriod,
            openDisputesInPeriod,
             userGrowthData, quoteStatusDistributionData, disputeReasonDistributionData,
            quoteProductTypeDistributionData
        };
    }, [users, quotes, reviews, disputes, analyticsDateRange]);

    const chartOptions = (titleText: string) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#e5e7eb',
                    font: { size: 11 },
                    padding: 15,
                },
            },
            title: {
                display: true,
                text: titleText,
                color: '#f3f4f6',
                font: { size: 14, weight: 'bold' as const },
                padding: { top: 10, bottom: 10 }
            },
            tooltip: {
                backgroundColor: 'rgba(20,20,20,0.85)',
                titleColor: '#e5e7eb',
                bodyColor: '#d1d5db',
                borderColor: '#4b5563',
                borderWidth: 1,
                padding: 10,
                 callbacks: {
                      label: function(context: any) {
                          let label = context.dataset.label || '';
                          if (label) {
                              label += ': ';
                          }
                          if (context.parsed.hasOwnProperty('y')) {
                              label += context.formattedValue;
                          } else if (context.parsed !== null) {
                              label += context.formattedValue;
                              const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
                              const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) + '%' : '0%';
                              label += ` (${percentage})`;
                          }
                          return label;
                      },
                      footer: function(tooltipItems: any) {
                           if (titleText === 'Dispute Reason Distribution (Top 5 + Other)' && tooltipItems.length > 0) {
                                const total = disputeReasonDistributionData.datasets[0].data.reduce((acc, val) => acc + val, 0);
                                const currentVal = tooltipItems[0].raw;
                                const percentage = total > 0 ? ((currentVal / total) * 100).toFixed(1) + '%' : '0%';
                                return `Percentage: ${percentage}`;
                           }
                           return '';
                      }
                 }
            }
        },
        cutout: '60%',
         scales: {
             x: {
                  ticks: { color: '#9ca3af' },
                  grid: { color: '#2a2a2a' },
                  title: { display: false }
             },
             y: {
                  ticks: { color: '#9ca3af', beginAtZero: true, },
                  grid: { color: '#2a2a2a' },
                  title: { display: false }
             }
         },
    } as any);

    const handleDownloadPDF = async () => {
        if (!analyticsRef.current) {
            sonnerToast.error("PDF Generation Failed", { description: "Analytics section not found." });
            return;
        }
        setIsGeneratingPDF(true);
        sonnerToast.info("Generating PDF...", { duration: 0 });

        try {
            const canvas = await html2canvas(analyticsRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#161616',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                 orientation: 'portrait',
                 unit: 'pt',
                 format: 'a4',
                 putOnlyUsedFonts: true,
                 compress: true
            });

            const imgWidth = 595.28;
            const pageHeight = 841.89;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`admin_dashboard_analytics_${formatDateSafely(new Date(), 'yyyy-MM-dd')}.pdf`);
            sonnerToast.success("PDF Generated", { description: "Analytics PDF downloaded." });

        } catch (error) {
            console.error("Error generating PDF:", error);
            if ((error as Error).message?.includes('unsupported color function "oklch"')) {
                  sonnerToast.error("PDF Generation Failed", { description: "A color format issue prevented PDF generation." });
             } else {
                sonnerToast.error("PDF Generation Failed", { description: "An unexpected error occurred while generating the PDF." });
             }
        } finally {
            setIsGeneratingPDF(false);
            sonnerToast.dismiss();
        }
    };

    const renderAnalyticsSection = () => {
         const isLoading = usersLoading || quotesLoading || reviewsLoading || disputesLoading || walletStatsLoading;
         const hasError = usersError || quotesError || reviewsError || disputesError || userError || walletStatsError;

        const periodLabel = analyticsPeriod === 'all' ? 'All Time' :
                            analyticsPeriod === '7d' ? 'Last 7 Days' :
                            analyticsPeriod === '30d' ? 'Last 30 Days' :
                            analyticsPeriod === 'year' ? 'Last Year' :
                            analyticsPeriod === 'custom' ?
                                (analyticsDateRange?.from ? format(analyticsDateRange.from, 'MMM d, yyyy') : 'Start Date') + ' - ' + (analyticsDateRange?.to ? format(analyticsDateRange.to, 'MMM d, yyyy') : 'End Date')
                                : 'Select Period';

         return (
             <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 shadow-lg" ref={analyticsRef} data-html2canvas-ignore="false">
                <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center gap-2">
                       <LayoutDashboard className="h-5 w-5 text-pink-500" />
                        <CardTitle className="text-lg sm:text-xl text-pink-500">
                           Overview & Analytics
                        </CardTitle>
                    </div>

                     <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                         <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod as any} disabled={isLoading || !!hasError || isCriticalActionInProgress}>
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
                                     <Button
                                          id="date"
                                         variant={"outline"}
                                         className={`justify-start text-left font-normal w-full sm:w-[200px] bg-[#181818] border-[#3a3a3a] text-gray-200 hover:bg-[#1c1c1c] focus:ring-pink-500 focus:border-pink-500 text-xs ${!analyticsDateRange?.from && "text-gray-500"}`}
                                           disabled={!!isLoading || !!hasError || !!isCriticalActionInProgress}
                                     >
                                         <CalendarIconLucide className="mr-2 h-3.5 w-3.5 text-gray-500" />
                                         {analyticsDateRange?.from ? (
                                             analyticsDateRange.to ? (
                                                 <>
                                                     {format(analyticsDateRange.from, "LLL dd, y")} -{" "}
                                                     {format(analyticsDateRange.to, "LLL dd, y")}
                                                 </>
                                             ) : (
                                                 format(analyticsDateRange.from, "LLL dd, y") + ' - ...'
                                             )
                                         ) : (
                                             <span>Pick a date range</span>
                                         )}
                                     </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#3a3a3a]" align="end">
                                     <Calendar
                                         initialFocus
                                        mode="range"
                                        defaultMonth={analyticsDateRange?.from}
                                        selected={analyticsDateRange}
                                        onSelect={setAnalyticsDateRange}
                                        numberOfMonths={2}
                                     />
                                </PopoverContent>
                             </Popover>
                          )}

                         <Button variant="ghost" size="icon" onClick={handleRefreshData} disabled={isLoading || isCriticalActionInProgress} className={`h-8 w-8 text-gray-400 hover:bg-gray-800 hover:text-pink-500 transition-colors ${isLoading || isCriticalActionInProgress ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label="Refresh Data">
                            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-500"></div> : <RefreshCw className="h-4 w-4" />}
                             <span className="sr-only">Refresh Data</span>
                         </Button>
                     </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:p-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(12)].map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full bg-[#2a2a2a] rounded-lg" />
                            ))}
                        </div>
                    ) : !!hasError ? (
                        <div className="text-center text-red-400 py-6 text-sm bg-red-900/20 p-4 rounded-md">
                            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                            <p className="font-semibold">Error loading analytics data.</p>
                            {usersError && <p className="text-xs italic mt-1">Users: {usersError}</p>}
                            {quotesError && <p className="text-xs italic mt-1">Quotes: {quotesError}</p>}
                            {reviewsError && <p className="text-xs italic mt-1">Reviews: {reviewsError}</p>}
                            {disputesError && <p className="text-xs italic mt-1">Disputes: {disputesError}</p>}
                            {walletStatsError && <p className="text-xs italic mt-1">Wallet Stats: {walletStatsError}</p>}
                             {userError && <p className="text-xs italic mt-1">Authentication: {userError}</p>}
                        </div>
                    ) : (
                        <div className="space-y-8">
                             <div className="text-sm text-gray-400 italic text-center">Data shown for: <span className="font-semibold text-gray-300">{periodLabel}</span></div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-pink-500/10 hover:border-pink-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                       <Users className="h-4 w-4 text-pink-400" /> New Users
                                    </CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-pink-500">{usersInPeriod.length}</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">
                                         Total Users: {users.length}
                                     </p>
                                </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-pink-500/10 hover:border-pink-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4 text-pink-400" /> New Quotes
                                    </CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-pink-500">{quotesInPeriod.length}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Total Quotes: {quotes.length}
                                    </p>
                                </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-pink-500/10 hover:border-pink-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                       <Star className="h-4 w-4 text-pink-400" /> New Reviews
                                    </CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-pink-500">{reviewsInPeriod.length}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">Total Reviews: {reviews.length}</p>
                                </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-red-500/10 hover:border-red-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                       <TriangleAlert className="h-4 w-4 text-red-400" /> New Disputes
                                    </CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-red-500">{disputesInPeriod.length}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Total Disputes: {disputes.length}
                                    </p>
                                </Card>
                                <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-green-500/10 hover:border-green-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                        <DollarSignIcon className="h-4 w-4 text-green-400" /> Total Revenue
                                    </CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-green-500">${totalRevenueInPeriod.toFixed(2)}</CardContent>
                                     <p className="text-xs text-gray-400 mt-1">
                                        From {completedQuotesInPeriod.length} completed quotes.
                                    </p>
                                </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-pink-500/10 hover:border-pink-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                       <CheckSquare className="h-4 w-4 text-blue-400" /> Quote Conversion Rate
                                    </CardTitle>
                                     <CardContent className="p-0 text-3xl font-bold text-blue-500">{quoteConversionRateInPeriod.toFixed(1)}%</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">
                                         {quotesInPeriod.length > 0 ? `${completedQuotesInPeriod.length} Completed / ${quotesInPeriod.length} Total` : 'N/A'}
                                    </p>
                                </Card>
                                <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-yellow-500/10 hover:border-yellow-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                       <Star className="h-4 w-4 text-yellow-400" /> Average Review Rating
                                    </CardTitle>
                                    <CardContent className="p-0 text-3xl font-bold text-yellow-500">{averageRatingInPeriod != null ? averageRatingInPeriod.toFixed(1) : 'N/A'}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">
                                        From {reviewsInPeriod.filter(r => r.rating != null).length} rated reviews.
                                    </p>
                                </Card>
                                 <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-red-500/10 hover:border-red-700/50 transition-all duration-200">
                                    <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                       <AlertCircle className="h-4 w-4 text-red-400" /> Open Disputes
                                    </CardTitle>
                                     <CardContent className="p-0 text-3xl font-bold text-red-500">{openDisputesInPeriod}</CardContent>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Total Disputes: {disputesInPeriod.length}
                                    </p>
                                </Card>
                                {walletStats && (
                                    <>
                                        <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-purple-500/10 hover:border-purple-700/50 transition-all duration-200">
                                            <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                                <Wallet className="h-4 w-4 text-purple-400" /> Total Wallet Balance
                                            </CardTitle>
                                            <CardContent className="p-0 text-3xl font-bold text-purple-500">${walletStats.totalBalance}</CardContent>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Across {walletStats.totalWallets} wallets
                                            </p>
                                        </Card>
                                        <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-yellow-500/10 hover:border-yellow-700/50 transition-all duration-200">
                                            <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                                <CreditCard className="h-4 w-4 text-yellow-400" /> Pending Withdrawals
                                            </CardTitle>
                                            <CardContent className="p-0 text-3xl font-bold text-yellow-500">{walletStats.pendingWithdrawals}</CardContent>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {walletStats.processingWithdrawals} processing
                                            </p>
                                        </Card>
                                        <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-green-500/10 hover:border-green-700/50 transition-all duration-200">
                                            <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                                <CheckSquare className="h-4 w-4 text-green-400" /> Completed Withdrawals
                                            </CardTitle>
                                            <CardContent className="p-0 text-3xl font-bold text-green-500">{walletStats.completedWithdrawals.count}</CardContent>
                                            <p className="text-xs text-gray-400 mt-1">
                                                ${walletStats.completedWithdrawals.totalAmount} total
                                            </p>
                                        </Card>
                                        <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg hover:shadow-blue-500/10 hover:border-blue-700/50 transition-all duration-200">
                                            <CardTitle className="text-md font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                                <RefreshCw className="h-4 w-4 text-blue-400" /> Recent Transactions
                                            </CardTitle>
                                            <CardContent className="p-0 text-3xl font-bold text-blue-500">{walletStats.recentTransactions}</CardContent>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Last 7 days
                                            </p>
                                        </Card>
                                    </>
                                )}
                            </div>

                                 <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[300px]">
                                     <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg flex flex-col">
                                         <CardContent className="p-0 text-sm text-gray-500 flex-grow mt-2">
                                             {userGrowthData.labels.length > 0 ? (
                                                  <Line options={chartOptions('User Growth Over Time')} data={userGrowthData} />
                                             ) : (
                                                  <div className="p-2 border border-dashed border-[#3a3a3a] rounded-md bg-[#1c1c1c] h-full w-full flex items-center justify-center text-gray-500">No user growth data for chart in this period.</div>
                                              )}
                                         </CardContent>
                                     </Card>
                                      <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg flex flex-col">
                                          <CardContent className="p-0 text-sm text-gray-500 flex-grow mt-2 h-full w-full min-h-[280px]">
                                              {quotesInPeriod.length > 0 ? (
                                                 <Doughnut options={chartOptions('Quote Status Distribution')} data={quoteStatusDistributionData} />
                                              ) : (
                                                  <div className="p-2 border border-dashed border-[#3a3a3a] rounded-md bg-[#1c1c1c] h-full w-full flex items-center justify-center text-gray-500">No quote data for status chart in this period.</div>
                                               )}
                                          </CardContent>
                                     </Card>
                                 </div>

                                 <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[300px]">
                                     <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg flex flex-col">
                                         <CardContent className="p-0 text-sm text-gray-500 flex-grow mt-2 h-full w-full min-h-[280px]">
                                             {disputeReasonDistributionData.labels.length > 0 ? (
                                                 <Bar options={chartOptions('Dispute Reason Distribution (Top 5 + Other)')} data={disputeReasonDistributionData} />
                                             ) : (
                                                 <div className="p-2 border border-dashed border-[#3a3a3a] rounded-md bg-[#1c1c1c] h-full w-full flex items-center justify-center text-gray-500">No dispute data for reason chart in this period.</div>
                                             )}
                                         </CardContent>
                                     </Card>
                                      <Card className="bg-[#222222] border-[#3a3a3a] p-4 rounded-lg flex flex-col">
                                          <CardContent className="p-0 text-sm text-gray-500 flex-grow mt-2 h-full w-full min-h-[280px]">
                                              {quoteProductTypeDistributionData.labels.length > 0 ? (
                                                  <Bar options={chartOptions('Quotes by Product Type')} data={quoteProductTypeDistributionData} />
                                              ) : (
                                                   <div className="p-2 border border-dashed border-[#3a3a3a] rounded-md bg-[#1c1c1c] h-full w-full flex items-center justify-center text-gray-500">No quote data for product type chart in this period.</div>
                                              )}
                                          </CardContent>
                                      </Card>
                                 </div>
                             </div>
                     )}
                 </CardContent>
                 </Card>
            );
    };

    const renderUsersSection = () => {
        const isLoading = usersLoading;
        const hasError = usersError || userError;

        return (
             <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 shadow-lg">
                 <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                    <CardTitle className="text-lg sm:text-xl text-pink-500 flex items-center gap-2">
                        <Users className="h-5 w-5 text-pink-500" /> Manage Users ({users.length})
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                          <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                  ref={userSearchInputRef}
                                  placeholder="Filter by name, email, or ID..."
                                  value={userFilterGeneral}
                                  onChange={(e) => {
                                      setUserFilterGeneral(e.target.value);
                                      requestAnimationFrame(() => {
                                        if (userSearchInputRef.current) {
                                          userSearchInputRef.current.focus();
                                        }
                                      });
                                  }}
                                  className="w-full bg-[#181818] border-[#3a3a3a] text-gray-200 pl-9 pr-3 focus:ring-pink-500 focus:border-pink-500 text-sm"
                                  disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                              />
                          </div>
                          <Select
                              value={userFilterRole}
                              onValueChange={setUserFilterRole}
                              disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                          >
                              <SelectTrigger className="w-full sm:w-[180px] bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-pink-500 focus:border-pink-500 text-sm">
                                  <SelectValue placeholder="Filter by role..." />
                              </SelectTrigger>
                              <SelectContent className="bg-[#181818] border-[#3a3a3a] text-gray-200">
                                  <SelectItem value="all">All Roles</SelectItem>
                                  {uniqueUserRoles.map(role => {
                                      if (typeof role !== 'string' || role.length === 0) {
                                          return null;
                                      }
                                      return (
                                          <SelectItem key={role} value={role}>
                                              {role.charAt(0).toUpperCase() + role.slice(1)}
                                          </SelectItem>
                                      );
                                  })}
                              </SelectContent>
                          </Select>
                      </div>

                     {isLoading ? (
                         <div className="space-y-3 px-4 sm:px-0">
                              {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-20 w-full bg-[#2a2a2a] rounded-md" /> ))}
                         </div>
                     ) : !!hasError ? (
                         <div className="text-center text-red-400 py-10 px-4 sm:px-0 bg-red-900/20 p-4 rounded-md">
                             <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                             <p className="font-semibold">Error: {usersError}</p>
                             {userError && <p className="text-sm italic mt-1">Authentication: {userError}</p>}
                         </div>
                     ) : filteredUsers.length === 0 ? (
                          userFilterGeneral || (userFilterRole && userFilterRole !== 'all') ? (
                               <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No users match the current filter criteria.</p>
                          ) : (
                               <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No users found in the system.</p>
                          )
                     ) : (
                        <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] w-full overflow-auto rounded-md">
                             <table className="w-full min-w-[640px] text-sm text-left text-gray-400">
                                 <thead className="text-xs text-gray-300 uppercase bg-[#2a2a2a] sticky top-0 z-10">
                                     <tr>
                                         <th scope="col" className="px-4 py-3 rounded-tl-md">User</th>
                                         <th scope="col" className="px-4 py-3">Role</th>
                                         <th scope="col" className="px-4 py-3">Joined</th>
                                         <th scope="col" className="px-4 py-3">Rating (Artist)</th>
                                         <th scope="col" className="px-4 py-3 text-right rounded-tr-md">Actions</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {filteredUsers.map(userItem => (
                                         <tr key={userItem.id} className="bg-[#161616] border-b border-[#2a2a2a] hover:bg-[#1c1c1c] transition-colors duration-150">
                                             <td className="px-4 py-3 font-medium text-white">
                                                  <div className="flex items-center gap-3">
                                                       <Avatar className="h-9 w-9">
                                                            <AvatarImage src={userItem.image || undefined} alt={userItem.name || userItem.email || "User Avatar"} />
                                                            <AvatarFallback className="bg-pink-700/50 text-pink-200 border border-pink-600">{getInitials(userItem.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">{userItem.name || 'N/A'}</p>
                                                             <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">{userItem.email}</p>
                                                        </div>
                                                  </div>
                                              </td>
                                             <td className="px-4 py-3 capitalize">{userItem.role || 'user'}</td>
                                             <td className="px-4 py-3 text-xs">{formatDateSafely(userItem.createdAt, 'PP')}</td>
                                             <td className="px-4 py-3 text-xs">
                                                  {userItem.role === 'artist' ? (
                                                      userItem.averageRating != null ?
                                                       <span className="flex items-center gap-1 text-yellow-400"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" strokeWidth={1.5}/> {userItem.averageRating.toFixed(1)}/5 <span className="text-gray-500 ml-1">({userItem.reviewCount || 0})</span></span> : <span className="text-gray-500 italic">No reviews</span>
                                                  ) : <span className="text-gray-600 italic">N/A</span>}
                                             </td>
                                             <td className="px-4 py-3 text-right">
                                                 <div className="flex items-center justify-end gap-2">
                                                       <Button variant="outline" size="sm"
                                                          className="border-pink-600/70 bg-[#2a2a2a]/50 text-pink-400 hover:bg-pink-700/30 hover:text-pink-300 transition-colors h-8 px-3 text-xs"
                                                          onClick={() => setViewingUserId(userItem.id)}
                                                          disabled={isCriticalActionInProgress}
                                                          aria-label={`View details for ${userItem.email}`}
                                                       >
                                                           <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                                       </Button>
                                                      </div>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                                <ScrollBar orientation="horizontal" className="h-2.5" />
                         </ScrollArea>
                     )}
                 </CardContent>
             </Card>
        );
    };

    const renderQuotesSection = () => {
         const isLoading = quotesLoading;
         const hasError = quotesError || userError;

        return (
            <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 shadow-lg">
                <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                   <CardTitle className="text-lg sm:text-xl text-pink-500 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-pink-500" /> Manage Quotes ({quotes.length})
                   </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                     <div className="flex flex-col sm:flex-row gap-4 mb-6">
                          <div className="relative flex-1">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                               <Input
                                   ref={quoteSearchInputRef}
                                   placeholder="Filter by ID, Product Type, Artist/Customer name/email..."
                                   value={quoteFilterGeneral}
                                   onChange={(e) => {
                                       setQuoteFilterGeneral(e.target.value);
                                       requestAnimationFrame(() => {
                                         if (quoteSearchInputRef.current) {
                                           quoteSearchInputRef.current.focus();
                                         }
                                       });
                                   }}
                                   className="w-full bg-[#181818] border-[#3a3a3a] text-gray-200 pl-9 pr-3 focus:ring-pink-500 focus:border-pink-500 text-sm"
                                   disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                               />
                           </div>
                           <Select
                                value={quoteFilterStatus}
                                onValueChange={setQuoteFilterStatus}
                                disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                           >
                                <SelectTrigger className="w-full sm:w-[180px] bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-pink-500 focus:border-pink-500 text-sm">
                                    <SelectValue placeholder="Filter by Status..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#181818] border-[#3a3a3a] text-gray-200">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                     {uniqueQuoteStatuses.map(status => {
                                           if (typeof status !== 'string' || status.length === 0) {
                                               return null;
                                          }
                                          return (
                                               <SelectItem key={status} value={status}>{status}</SelectItem>
                                          );
                                     })}
                                </SelectContent>
                           </Select>
                     </div>

                    {isLoading ? (
                         <div className="space-y-3 px-4 sm:px-0">
                              {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-20 w-full bg-[#2a2a2a] rounded-md" /> ))}
                         </div>
                    ) : !!hasError ? (
                        <div className="text-center text-red-400 py-10 px-4 sm:px-0 bg-red-900/20 p-4 rounded-md">
                            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                            <p className="font-semibold">Error loading quote data.</p>
                            {quotesError && <p className="text-sm italic mt-1">{quotesError}</p>}
                            {userError && <p className="text-sm italic mt-1">Authentication: {userError}</p>}
                        </div>
                    ) : filteredQuotes.length === 0 ? (
                         quoteFilterGeneral || (quoteFilterStatus && quoteFilterStatus !== 'all') ? (
                              <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No quotes match the current filter criteria.</p>
                         ) : (
                            <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No quotes found in the system.</p>
                         )
                    ) : (
                        <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] w-full overflow-auto rounded-md">
                             <table className="w-full min-w-[720px] text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-300 uppercase bg-[#2a2a2a] sticky top-0 z-10"><tr>
                                        <th scope="col" className="px-3 py-3 rounded-tl-md">Quote ID</th>
                                        <th scope="col" className="px-3 py-3">Product Type</th>
                                        <th scope="col" className="px-3 py-3">Status</th>
                                        <th scope="col" className="px-3 py-3">Artist</th>
                                        <th scope="col" className="px-3 py-3">Customer</th>
                                        <th scope="col" className="px-3 py-3">Price</th>
                                        <th scope="col" className="px-3 py-3">Service Date</th>
                                        <th scope="col" className="px-3 py-3 text-right rounded-tr-md">Actions</th>
                                    </tr></thead>
                                <tbody>
                                    {filteredQuotes.map((quoteItem, index) => (
                                        <tr key={quoteItem.id} className="border-b border-[#2a2a2a] hover:bg-[#1c1c1c]/70 transition-colors duration-150"
                                          style={{ backgroundColor: index % 2 !== 0 ? getQuoteBackgroundColor(index) + '1A' : undefined }}
                                        >
                                            <td className="px-3 py-3 font-mono text-xs text-gray-200 truncate max-w-[80px] sm:max-w-[100px]" title={quoteItem.id}>{quoteItem.id}</td>
                                            <td className="px-3 py-3 truncate max-w-[120px] sm:max-w-[150px]">{quoteItem.productType}</td>
                                            <td className="px-3 py-3">
                                                 <Badge variant="outline" className={`text-xs font-medium ${getStatusColorClasses(quoteItem.status)}`}>
                                                     {quoteItem.status}
                                                 </Badge>
                                             </td>
                                            <td className="px-3 py-3 text-xs text-gray-400 truncate max-w-[100px] sm:max-w-[150px]" title={quoteItem.artist?.email}>
                                                {quoteItem.artist?.name || quoteItem.artist?.email || <span className="text-gray-600 italic">N/A</span>}
                                             </td>
                                             <td className="px-3 py-3 text-xs text-gray-400 truncate max-w-[100px] sm:max-w-[150px]" title={quoteItem.customer?.email}>
                                                {quoteItem.customer?.name || quoteItem.customer?.email || <span className="text-gray-600 italic">N/A</span>}
                                             </td>
                                             <td className="px-3 py-3">${parseFloat(quoteItem.price).toFixed(2)}</td>
                                             <td className="px-3 py-3 text-xs">{formatDateSafely(quoteItem.serviceDate, 'PP')}</td>
                                            <td className="px-3 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                      <Button variant="outline" size="sm"
                                                         className="border-pink-600/70 bg-[#2a2a2a]/50 text-pink-400 hover:bg-pink-700/30 hover:text-pink-300 transition-colors h-8 px-3 text-xs"
                                                          onClick={() => setViewingQuoteId(quoteItem.id)}
                                                          disabled={isCriticalActionInProgress}
                                                          aria-label={`View details for quote ${quoteItem.id}`}
                                                       >
                                                          <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                                       </Button>
                                                 </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <ScrollBar orientation="horizontal" className="h-2.5" />
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
       );
   };

    const renderReviewsSection = () => {
         const isLoading = reviewsLoading;
         const hasError = reviewsError || userError;

        return (
            <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 shadow-lg">
                <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                   <CardTitle className="text-lg sm:text-xl text-pink-500 flex items-center gap-2">
                      <Star className="h-5 w-5 text-pink-500" /> Manage Reviews ({reviews.length})
                   </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                     <div className="flex flex-col sm:flex-row gap-4 mb-6">
                         <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                  ref={reviewSearchInputRef}
                                  placeholder="Filter by ID, Artist/Customer name/email..."
                                  value={reviewFilterGeneral}
                                  onChange={(e) => {
                                      setReviewFilterGeneral(e.target.value);
                                        requestAnimationFrame(() => {
                                         if (reviewSearchInputRef.current) {
                                           reviewSearchInputRef.current.focus();
                                         }
                                       });
                                  }}
                                  className="w-full bg-[#181818] border-[#3a3a3a] text-gray-200 pl-9 pr-3 focus:ring-pink-500 focus:border-pink-500 text-sm"
                                  disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                              />
                          </div>
                            <Select
                                value={reviewFilterRating}
                                onValueChange={setReviewFilterRating}
                                disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                            >
                                 <SelectTrigger className="w-full sm:w-[180px] bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-pink-500 focus:border-pink-500 text-sm">
                                      <SelectValue placeholder="Filter by Rating..." />
                                  </SelectTrigger>
                                 <SelectContent className="bg-[#181818] border-[#3a3a3a] text-gray-200">
                                      <SelectItem value="all">All Ratings</SelectItem>
                                       {[1, 2, 3, 4, 5].map(rating => (
                                           <SelectItem key={rating} value={rating.toString()}>{rating} Star{rating > 1 ? 's' : ''}</SelectItem>
                                        ))}
                                  </SelectContent>
                            </Select>
                     </div>

                    {isLoading ? (
                           <div className="space-y-3 px-4 sm:px-0">
                                {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-20 w-full bg-[#2a2a2a] rounded-md" /> ))}
                           </div>
                     ) : !!hasError ? (
                         <div className="text-center text-red-400 py-10 px-4 sm:px-0 bg-red-900/20 p-4 rounded-md">
                             <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                             <p className="font-semibold">Error loading review data.</p>
                             {reviewsError && <p className="text-sm italic mt-1">{reviewsError}</p>}
                             {userError && <p className="text-sm italic mt-1">Authentication: {userError}</p>}
                         </div>
                     ) : filteredReviews.length === 0 ? (
                          reviewFilterGeneral || (reviewFilterRating && reviewFilterRating !== 'all') ? (
                                <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No reviews match the current filter criteria.</p>
                          ) : (
                               <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No reviews found in the system.</p>
                          )
                     ) : (
                         <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] w-full overflow-auto rounded-md">
                             <table className="w-full min-w-[720px] text-sm text-left text-gray-400">
                                 <thead className="text-xs text-gray-300 uppercase bg-[#2a2a2a] sticky top-0 z-10"><tr>
                                         <th scope="col" className="px-3 py-3 rounded-tl-md">Review ID</th>
                                         <th scope="col" className="px-3 py-3">Rating</th>
                                         <th scope="col" className="px-3 py-3">Comment</th>
                                         <th scope="col" className="px-3 py-3">Artist</th>
                                         <th scope="col" className="px-3 py-3">Customer</th>
                                         <th scope="col" className="px-3 py-3">Created</th>
                                         <th scope="col" className="px-3 py-3 text-right rounded-tr-md">Actions</th>
                                     </tr></thead>
                                 <tbody>
                                     {filteredReviews.map(reviewItem => (
                                         <tr key={reviewItem.id} className="bg-[#161616] border-b border-[#2a2a2a] hover:bg-[#1c1c1c] transition-colors duration-150">
                                             <td className="px-3 py-3 font-mono text-xs text-gray-200 truncate max-w-[80px] sm:max-w-[100px]" title={reviewItem.id}>{reviewItem.id}</td>
                                             <td className="px-3 py-3 text-yellow-400 font-semibold flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" strokeWidth={1.5}/>{reviewItem.rating}/5</td>
                                             <td className="px-3 py-3 text-gray-400 max-w-xs truncate" title={reviewItem.comment || undefined}>{reviewItem.comment || <span className="text-gray-600 italic">No comment</span>}</td>
                                              <td className="px-3 py-3 text-xs text-gray-400 truncate max-w-[100px] sm:max-w-[150px]" title={reviewItem.artist?.email}>
                                                  {reviewItem.artist ? `${reviewItem.artist.name || reviewItem.artist.email}` : <span className="text-gray-600 italic">N/A</span>}
                                              </td>
                                              <td className="px-3 py-3 text-xs text-gray-400 truncate max-w-[100px] sm:max-w-[150px]" title={reviewItem.customer?.email}>
                                                   {reviewItem.customer?.name || reviewItem.customer?.email || 'N/A'}
                                              </td>
                                            <td className="px-3 py-3 text-xs">{formatDateSafely(reviewItem.createdAt, 'PP')}</td>
                                            <td className="px-3 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                      <Button variant="outline" size="sm"
                                                         className="border-pink-600/70 bg-[#2a2a2a]/50 text-pink-400 hover:bg-pink-700/30 hover:text-pink-300 transition-colors h-8 px-3 text-xs"
                                                         onClick={() => setViewingReviewId(reviewItem.id)}
                                                         disabled={isCriticalActionInProgress}
                                                         aria-label={`View details for review ${reviewItem.id}`}>
                                                          <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                                      </Button>
                                                  </div>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             <ScrollBar orientation="horizontal" className="h-2.5" />
                         </ScrollArea>
                     )}
                 </CardContent>
             </Card>
        );
    };

   const renderDisputesSection = () => {
        const isLoading = disputesLoading;
        const hasError = disputesError || userError;

       return (
           <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 shadow-lg">
               <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                  <CardTitle className="text-lg sm:text-xl text-red-500 flex items-center gap-2">
                     <TriangleAlert className="h-5 w-5 text-red-500" /> Manage Disputes ({disputes.length})
                  </CardTitle>
               </CardHeader>
               <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                     <div className="flex flex-col sm:flex-row gap-4 mb-6">
                         <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                   ref={disputeSearchInputRef}
                                  placeholder="Filter by ID, Reason, Parties, Quote ID, etc..."
                                  value={disputeFilterGeneral}
                                  onChange={(e) => {
                                      setDisputeFilterGeneral(e.target.value);
                                        requestAnimationFrame(() => {
                                         if (disputeSearchInputRef.current) {
                                           disputeSearchInputRef.current.focus();
                                         }
                                       });
                                  }}
                                  className="w-full bg-[#181818] border-[#3a3a3a] text-gray-200 pl-9 pr-3 focus:ring-pink-500 focus:border-pink-500 text-sm"
                                  disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                              />
                          </div>
                           <Select
                                value={disputeFilterStatus}
                                onValueChange={setDisputeFilterStatus}
                                disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                           >
                                <SelectTrigger className="w-full sm:w-[180px] bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-pink-500 focus:border-pink-500 text-sm">
                                    <SelectValue placeholder="Filter by Status..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#181818] border-[#3a3a3a] text-gray-200">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                     {uniqueDisputeStatuses.map(status => {
                                           if (typeof status !== 'string' || status.length === 0) {
                                               return null;
                                          }
                                          return (
                                               <SelectItem key={status} value={status}>{status}</SelectItem>
                                          );
                                     })}
                                </SelectContent>
                           </Select>
                     </div>

                   {isLoading ? (
                         <div className="space-y-3 px-4 sm:px-0">
                              {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-20 w-full bg-[#2a2a2a] rounded-md" /> ))}
                         </div>
                   ) : !!hasError ? (
                       <div className="text-center text-red-400 py-10 px-4 sm:px-0 bg-red-900/20 p-4 rounded-md">
                           <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2"/>
                           <p className="font-semibold">Error loading dispute data.</p>
                           {disputesError && <p className="text-sm italic mt-1">{disputesError}</p>}
                            {userError && <p className="text-sm italic mt-1">Authentication: {userError}</p>}
                       </div>
                   ) : filteredDisputes.length === 0 ? (
                        disputeFilterGeneral || (disputeFilterStatus && disputeFilterStatus !== 'all') ? (
                           <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No disputes match the current filter criteria.</p>
                        ) : (
                            <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No disputes found in the system.</p>
                        )
                   ) : (
                       <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] w-full overflow-auto rounded-md">
                            <table className="w-full min-w-[800px] text-sm text-left text-gray-400">
                               <thead className="text-xs text-gray-300 uppercase bg-[#2a2a2a] sticky top-0 z-10"><tr>
                                       <th scope="col" className="px-3 py-3 rounded-tl-md">Dispute ID</th>
                                       <th scope="col" className="px-3 py-3">Status</th>
                                       <th scope="col" className="px-3 py-3">Reason</th>
                                       <th scope="col" className="px-3 py-3">Initiator</th>
                                       <th scope="col" className="px-3 py-3">Involved Party</th>
                                       <th scope="col" className="px-3 py-3">Quote Info</th>
                                       <th scope="col" className="px-3 py-3">Created</th>
                                       <th scope="col" className="px-3 py-3 text-right rounded-tr-md">Actions</th>
                                   </tr></thead>
                               <tbody>
                                   {filteredDisputes.map(disputeItem => (
                                       <tr key={disputeItem.id} className="bg-[#161616] border-b border-[#2a2a2a] hover:bg-[#1c1c1c] transition-colors duration-150">
                                           <td className="px-3 py-3 font-mono text-xs text-gray-200 truncate max-w-[80px] sm:max-w-[100px]" title={disputeItem.id}>{disputeItem.id}</td>
                                            <td className="px-3 py-3">
                                                <Badge variant="outline" className={`text-xs font-medium ${getDisputeStatusColorClasses(disputeItem.status)}`}>
                                                    <AlertCircle className="h-3.5 w-3.5 mr-1" /> {disputeItem.status}
                                                </Badge>
                                            </td>
                                           <td className="px-3 py-3 text-gray-400 max-w-[150px] sm:max-w-[200px] truncate" title={disputeItem.reason}>{disputeItem.reason}</td>
                                            <td className="px-3 py-3 text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]" title={disputeItem.initiator?.email || disputeItem.initiatorId}>
                                                {disputeItem.initiator?.name || disputeItem.initiator?.email || disputeItem.initiatorId}
                                                {disputeItem.initiator && <span className="text-[10px] text-gray-500 block capitalize">({disputeItem.initiator.role})</span>}
                                            </td>
                                             <td className="px-3 py-3 text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]" title={disputeItem.involved?.email || disputeItem.involvedId}>
                                                {disputeItem.involved?.name || disputeItem.involved?.email || disputeItem.involvedId}
                                                {disputeItem.involved && <span className="text-[10px] text-gray-500 block capitalize">({disputeItem.involved.role})</span>}
                                             </td>
                                            <td className="px-3 py-3 font-mono text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]" title={`Quote ID: ${disputeItem.quoteId} ${disputeItem.quote ? `- ${disputeItem.quote.productType}` : ''}`}>
                                                {disputeItem.quoteId}
                                                {disputeItem.quote && <span className="text-[10px] text-gray-500 block">{disputeItem.quote.productType}</span>}
                                            </td>
                                           <td className="px-3 py-3 text-xs">{formatDateSafely(disputeItem.createdAt, 'PP')}</td>
                                           <td className="px-3 py-3 text-right">
                                               <div className="flex items-center justify-end gap-2">
                                                     <Button variant="outline" size="sm"
                                                        className="border-pink-600/70 bg-[#2a2a2a]/50 text-pink-400 hover:bg-pink-700/30 hover:text-pink-300 transition-colors h-8 px-3 text-xs"
                                                        onClick={() => setViewingDisputeId(disputeItem.id)}
                                                        disabled={isCriticalActionInProgress}
                                                        aria-label={`View details for dispute ${disputeItem.id}`}>
                                                         <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                                     </Button>
                                                      {(disputeItem.status === "Open" || disputeItem.status === "Under Review") && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-green-600/70 bg-green-900/20 text-green-400 hover:bg-green-700/30 hover:text-green-300 transition-colors h-8 px-3 text-xs"
                                                            onClick={() => {
                                                                setQuickResolveDisputeId(disputeItem.id);
                                                                setQuickResolveNotes(disputeItem.resolution || "");
                                                            }}
                                                            disabled={isCriticalActionInProgress || isCsrfActionDisabled}
                                                            aria-label={`Quick resolve dispute ${disputeItem.id}`}
                                                        >
                                                            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Resolve
                                                        </Button>
                                                      )}
                                                </div>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                           <ScrollBar orientation="horizontal" className="h-2.5" />
                       </ScrollArea>
                   )}
               </CardContent>
           </Card>
      );
  };

  const renderWithdrawalsSection = () => {
    const isLoading = withdrawalsLoading;
    const hasError = withdrawalsError || userError;

    return (
        <Card className="bg-[#161616] border-[#2a2a2a] text-gray-300 shadow-lg">
            <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a]">
                <CardTitle className="text-lg sm:text-xl text-purple-500 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-500" /> Manage Withdrawals ({withdrawals.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            ref={withdrawalSearchInputRef}
                            placeholder="Filter by user name, email, or amount..."
                            className="w-full bg-[#181818] border-[#3a3a3a] text-gray-200 pl-9 pr-3 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                        />
                    </div>
                    <Select
                        value={withdrawalFilterStatus}
                        onValueChange={setWithdrawalFilterStatus}
                        disabled={isBackgroundLoading || !!hasError || isCriticalActionInProgress}
                    >
                        <SelectTrigger className="w-full sm:w-[180px] bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-purple-500 focus:border-purple-500 text-sm">
                            <SelectValue placeholder="Filter by Status..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#181818] border-[#3a3a3a] text-gray-200">
                            <SelectItem value="all">All Statuses</SelectItem>
                            {uniqueWithdrawalStatuses.map(status => {
                                if (typeof status !== 'string' || status.length === 0) {
                                    return null;
                                }
                                return (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="space-y-3 px-4 sm:px-0">
                        {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-20 w-full bg-[#2a2a2a] rounded-md" /> ))}
                    </div>
                ) : !!hasError ? (
                    <div className="text-center text-red-400 py-10 px-4 sm:px-0 bg-red-900/20 p-4 rounded-md">
                        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2"/>
                        <p className="font-semibold">Error loading withdrawal data.</p>
                        {withdrawalsError && <p className="text-sm italic mt-1">{withdrawalsError}</p>}
                        {userError && <p className="text-sm italic mt-1">Authentication: {userError}</p>}
                    </div>
                ) : filteredWithdrawals.length === 0 ? (
                    withdrawalFilterStatus && withdrawalFilterStatus !== 'all' ? (
                        <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No withdrawals match the current filter criteria.</p>
                    ) : (
                        <p className="text-center text-gray-500 py-10 px-4 sm:px-0">No pending withdrawals found.</p>
                    )
                ) : (
                    <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] w-full overflow-auto rounded-md">
                        <table className="w-full min-w-[800px] text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-[#2a2a2a] sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-3 py-3 rounded-tl-md">User</th>
                                    <th scope="col" className="px-3 py-3">Amount</th>
                                    <th scope="col" className="px-3 py-3">Fee</th>
                                    <th scope="col" className="px-3 py-3">Net Amount</th>
                                    <th scope="col" className="px-3 py-3">Bank Details</th>
                                    <th scope="col" className="px-3 py-3">Status</th>
                                    <th scope="col" className="px-3 py-3">Created</th>
                                    <th scope="col" className="px-3 py-3 text-right rounded-tr-md">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWithdrawals.map(withdrawal => (
                                    <tr key={withdrawal.id} className="bg-[#161616] border-b border-[#2a2a2a] hover:bg-[#1c1c1c] transition-colors duration-150">
                                        <td className="px-3 py-3">
                                            <div>
                                                <p className="font-semibold text-white">{withdrawal.wallet.user.name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{withdrawal.wallet.user.email}</p>
                                                {withdrawal.wallet.user.phone && (
                                                    <p className="text-xs text-gray-500">{withdrawal.wallet.user.phone}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 font-semibold">${withdrawal.amount.toFixed(2)}</td>
                                        <td className="px-3 py-3 text-gray-400">${withdrawal.fee.toFixed(2)}</td>
                                        <td className="px-3 py-3 font-semibold text-green-400">${withdrawal.netAmount.toFixed(2)}</td>
                                        <td className="px-3 py-3 text-xs">
                                            <p>{withdrawal.bankAccount.bankName}</p>
                                            {withdrawal.bankAccount.accountType === 'UPI' ? (
                                                <p className="text-gray-400">{withdrawal.bankAccount.upiId}</p>
                                            ) : (
                                                <p className="text-gray-400">****{withdrawal.bankAccount.accountNumber.slice(-4)}</p>
                                            )}
                                            {withdrawal.bankAccount.ifscCode && (
                                                <p className="text-gray-500">{withdrawal.bankAccount.ifscCode}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge variant="outline" className={`text-xs font-medium ${getWithdrawalStatusColorClasses(withdrawal.status)}`}>
                                                {withdrawal.status}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-xs">{formatDateSafely(withdrawal.createdAt, 'PP')}</td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {withdrawal.status === 'Pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-600/70 bg-blue-900/20 text-blue-400 hover:bg-blue-700/30 hover:text-blue-300 transition-colors h-8 px-3 text-xs"
                                                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                                        disabled={isProcessingWithdrawal === withdrawal.id || isCriticalActionInProgress}
                                                    >
                                                        {isProcessingWithdrawal === withdrawal.id ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-400 mr-1"></div>
                                                        ) : (
                                                            <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
                                                        )}
                                                        Approve
                                                    </Button>
                                                )}
                                                {(withdrawal.status === 'Pending' || withdrawal.status === 'Processing') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-green-600/70 bg-green-900/20 text-green-400 hover:bg-green-700/30 hover:text-green-300 transition-colors h-8 px-3 text-xs"
                                                        onClick={() => handleCompleteWithdrawal(withdrawal.id)}
                                                        disabled={isCompletingWithdrawal === withdrawal.id || isCriticalActionInProgress}
                                                    >
                                                        {isCompletingWithdrawal === withdrawal.id ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-green-400 mr-1"></div>
                                                        ) : (
                                                            <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                                                        )}
                                                        Complete
                                                    </Button>
                                                )}
                                                {(withdrawal.status === 'Pending' || withdrawal.status === 'Processing') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-600/70 bg-red-900/20 text-red-400 hover:bg-red-700/30 hover:text-red-300 transition-colors h-8 px-3 text-xs"
                                                        onClick={() => {
                                                            setWithdrawalFailureReason("");
                                                            handleFailWithdrawal(withdrawal.id);
                                                        }}
                                                        disabled={isFailingWithdrawal === withdrawal.id || isCriticalActionInProgress}
                                                    >
                                                        {isFailingWithdrawal === withdrawal.id ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-400 mr-1"></div>
                                                        ) : (
                                                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                                        )}
                                                        Fail
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <ScrollBar orientation="horizontal" className="h-2.5" />
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};

    type AdminNavigationItemType = {
        name: string; href: string; icon: React.ElementType;
        view: 'overview' | 'users' | 'quotes' | 'reviews' | 'disputes' | 'withdrawals';
    };

    const adminNavigationItems: AdminNavigationItemType[] = [
      { name: 'Overview', href: '/admin?view=overview', icon: LayoutDashboard, view: 'overview' },
      { name: 'Users', href: '/admin?view=users', icon: Users, view: 'users' },
      { name: 'Quotes', href: '/admin?view=quotes', icon: FileText, view: 'quotes' },
      { name: 'Reviews', href: '/admin?view=reviews', icon: Star, view: 'reviews' },
      { name: 'Disputes', href: '/admin?view=disputes', icon: TriangleAlert, view: 'disputes' },
      { name: 'Withdrawals', href: '/admin?view=withdrawals', icon: CreditCard, view: 'withdrawals' },
    ];

    const MobileViewContent = () => {
         const searchParams = nextUseSearchParams();
         const mobileViewParam = searchParams.get('view');
         const currentMobileView = (mobileViewParam && adminNavigationItems.some(item => item.view === mobileViewParam) ? mobileViewParam : 'overview') as AdminNavigationItemType['view'];

         if (userLoading) {
              return (
                 <div className="flex flex-col items-center justify-center min-h-[calc(100vh-192px)] bg-black text-gray-400 p-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mb-4"></div>
                     <p className="text-lg">Loading Dashboard Content...</p>
                 </div>
              );
         }
         if (userError) {
             return (
                 <div className="text-center text-red-400 py-10 px-4 sm:px-0 bg-red-900/20 p-4 rounded-md">
                     <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                     <p className="font-semibold">Error: {userError}</p>
                     <p className="text-sm text-gray-400 mt-1">Could not load dashboard content.</p>
                 </div>
             );
         }
         if (!user) return null;

         const renderContent = () => {
            switch (currentMobileView) {
                case 'overview':
                    return (
                         <>
                              <div className="mb-4 flex items-center gap-2 text-pink-500 font-semibold text-lg">
                                  <LayoutDashboard className="h-5 w-5" /> Overview
                              </div>
                             {renderAnalyticsSection()}
                         </>
                    );
                case 'users':
                    return (
                        <>
                             <div className="mb-4 flex items-center gap-2 text-pink-500 font-semibold text-lg">
                                  <Users className="h-5 w-5" /> Users
                              </div>
                            {renderUsersSection()}
                        </>
                    );
                case 'quotes':
                     return (
                        <>
                              <div className="mb-4 flex items-center gap-2 text-pink-500 font-semibold text-lg">
                                  <FileText className="h-5 w-5" /> Quotes
                              </div>
                            {renderQuotesSection()}
                        </>
                    );
                case 'reviews':
                     return (
                        <>
                              <div className="mb-4 flex items-center gap-2 text-pink-500 font-semibold text-lg">
                                  <Star className="h-5 w-5" /> Reviews
                              </div>
                            {renderReviewsSection()}
                        </>
                    );
                 case 'disputes':
                     return (
                         <>
                             <div className="mb-4 flex items-center gap-2 text-red-500 font-semibold text-lg">
                                 <TriangleAlert className="h-5 w-5" /> Disputes
                             </div>
                             {renderDisputesSection()}
                         </>
                     );
                case 'withdrawals':
                    return (
                        <>
                            <div className="mb-4 flex items-center gap-2 text-purple-500 font-semibold text-lg">
                                <CreditCard className="h-5 w-5" /> Withdrawals
                            </div>
                            {renderWithdrawalsSection()}
                        </>
                    );
                default:
                    return (
                         <>
                              <div className="mb-4 flex items-center gap-2 text-pink-500 font-semibold text-lg">
                                  <LayoutDashboard className="h-5 w-5" /> Overview
                              </div>
                            {renderAnalyticsSection()}
                        </>
                    );
            }
         };
         return <div className="p-3 sm:p-4">{renderContent()}</div>;
    };

     if (userLoading && !user && !userError) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-300 p-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-pink-600 mb-5"></div>
               <p className="text-2xl">Loading Admin Portal...</p>
               <p className="text-sm text-gray-500">Please wait while we prepare your dashboard.</p>
           </div>
        );
     }

     if (userError && !user) {
         return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-400 p-6 text-center">
                 <UserRound className="h-20 w-20 text-red-500 mb-6" />
                 <p className="text-2xl font-semibold mb-3">Access Error</p>
                 <p className="text-base mb-8 max-w-md">{userError}</p>
                 {userError.toLowerCase().includes("access denied") ||
                  userError.toLowerCase().includes("authentication required") ||
                  userError.toLowerCase().includes("failed to load user data") ||
                  userError.toLowerCase().includes("session expired") ||
                  userError.toLowerCase().includes("failed to fetch user")
                  ? (
                     <Button onClick={() => router.push('/admin-login')} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-base">Go to Login</Button>
                 ) : (
                     <Button onClick={() => window.location.reload()} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-base">Retry</Button>
                 )}
             </div>
         );
     }

     if (!user || user.role !== 'admin') {
          return null;
     }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
            <header className="bg-black shadow-md sticky top-0 z-50 border-b border-[#2a2a2a]">
                <div className="container mx-auto flex items-center justify-between h-16 px-3 md:px-6">
                    <Link href="/admin?view=overview" className="flex items-center gap-2 group">
                        <LayoutDashboard className="h-6 w-6 text-pink-500 group-hover:text-pink-400 transition-colors" />
                        <span className="font-bold text-lg md:text-xl text-gray-100 group-hover:text-white transition-colors">Admin Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="p-1 rounded-full h-10 w-10 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                                    <Avatar className="cursor-pointer h-9 w-9">
                                        <AvatarImage src={user.image || undefined} alt={user.name || user.email || "Admin Avatar"} />
                                        <AvatarFallback className="bg-pink-700/60 text-pink-200 border border-pink-600 font-semibold">{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 bg-[#161616] text-white border-[#333333] shadow-2xl mt-1">
                                <DropdownMenuLabel className="px-3 py-2.5">
                                    <p className="text-sm font-medium truncate text-gray-100">{user.name || "Administrator"}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#333333]" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-400 focus:text-red-300 focus:bg-red-900/50 hover:!bg-red-700/30 hover:!text-red-300 cursor-pointer transition-colors m-1 rounded-sm flex items-center px-2 py-1.5 text-sm"
                                >
                                    <LogOut className="mr-2.5 h-4 w-4" />Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-4 sm:py-6 md:py-8 flex-grow overflow-y-auto">
                 <div className="md:hidden">
                     <Suspense fallback={
                          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-192px)] bg-black text-gray-400 p-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-3"></div>
                             <p>Loading view...</p>
                         </div>
                     }>
                        <MobileViewContent />
                     </Suspense>
                </div>

                 <div className="hidden md:block px-3 sm:px-4">
                      <div className="mb-6 md:mb-8">
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Administrator Dashboard</h1>
                          <p className="text-gray-400 text-sm sm:text-base">Manage system data, users, and platform activity.</p>
                       </div>
                      <div className="mb-8">{renderAnalyticsSection()}</div>
                      <div className="mb-8">{renderUsersSection()}</div>
                      <div className="mb-8">{renderQuotesSection()}</div>
                      <div className="mb-8">{renderReviewsSection()}</div>
                      <div className="mb-8">{renderDisputesSection()}</div>
                      <div className="mb-8">{renderWithdrawalsSection()}</div>
                 </div>
            </main>

            <Dialog open={!!viewingUserId} onOpenChange={(isOpen) => { if (!isOpen) closeDetailModals(); }}>
                 <DialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl max-w-[calc(100vw-32px)] w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                      <DialogHeader className="pb-4 mb-0 border-b border-[#2a2a2a] shrink-0">
                          <DialogTitle className="text-pink-500 flex items-center gap-2 text-xl">
                              <Info className="h-5 w-5" /> User Details
                          </DialogTitle>
                          <DialogDescription className="text-gray-400">
                              Viewing: {viewingUserLoading ? 'Loading...' : (viewingUser?.name || viewingUser?.email || viewingUserId || 'N/A')}
                          </DialogDescription>
                      </DialogHeader>
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-2">
                       {viewingUserLoading ? (
                             <div className="flex flex-col items-center justify-center h-full py-12">
                                 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mb-3"></div>
                                <p className="text-gray-400">Loading user details...</p>
                             </div>
                        ) : viewingUserError ? (
                             <div className="flex flex-col items-center justify-center h-full text-center text-red-400 py-10 bg-red-900/20 p-4 rounded-md">
                                  <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2"/>
                                  <p className="font-semibold">Error: {viewingUserError}</p>
                             </div>
                         ) : viewingUser ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm pb-4">
                                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3 pb-3 border-b border-[#2a2a2a]">
                                    <Avatar className="h-20 w-20 text-3xl shrink-0">
                                        <AvatarImage src={viewingUser.image || undefined} alt={viewingUser.name || "User Avatar"} />
                                        <AvatarFallback className="bg-pink-700/50 text-pink-200 border border-pink-600">{getInitials(viewingUser.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="text-xl font-semibold text-gray-100 truncate max-w-full sm:max-w-sm">{viewingUser.name || 'N/A'}</p>
                                        <p className="text-gray-400 flex items-center gap-1.5"><Mail className="h-4 w-4 text-gray-500" /> <span className="truncate max-w-full sm:max-w-sm">{viewingUser.email}</span></p>
                                        <p className="text-gray-400 flex items-center gap-1.5"><UserCog className="h-4 w-4 text-gray-500" /> {viewingUser.role}</p>
                                                <p className="text-gray-500 flex items-center gap-1.5 text-xs font-mono mt-1"><Info className="h-3.5 w-3.5" /> ID: {viewingUser.id}</p>
                                    </div>
                                </div>
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mb-1"><Info className="h-4 w-4" /> Basic Information</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                                            {[
                                                    { icon: CalendarIconLucide, label: "Created At", value: formatDateSafely(viewingUser.createdAt, 'PPPp') },
                                                    { icon: Phone, label: "Phone", value: viewingUser.phone },
                                                    { icon: UserRound, label: "Gender", value: viewingUser.gender },
                                                    { icon: UserRound, label: "Sex", value: viewingUser.sex },
                                                    { icon: CalendarIconLucide, label: "Age", value: viewingUser.age != null ? `${viewingUser.age} years` : null },
                                                    { icon: Ruler, label: "Height", value: viewingUser.height != null ? `${viewingUser.height} cm` : null },
                                                    { icon: Weight, label: "Weight", value: viewingUser.weight != null ? `${viewingUser.weight} kg` : null },
                                                    { icon: Droplet, label: "Hair/Eye Color", value: viewingUser.color },
                                                    { icon: Users, label: "Ethnicity", value: viewingUser.ethnicity },
                                                    { icon: Tag, label: "Other Identifiers", value: viewingUser.other },
                                                ].map(field => field.value != null && String(field.value).trim() !== '' ? (
                                                    <div key={field.label}>
                                                        <Label className="block text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1"><field.icon className="h-3 w-3" />{field.label}</Label>
                                                        <p className="text-gray-200 break-words leading-tight">{String(field.value)}</p>
                                                    </div>
                                                ) : null)}
                                            </div>
                                        </div>
                                    {viewingUser.bio && (
                                        <div className="md:col-span-2">
                                            <Label className="block text-sm font-semibold text-gray-300 mb-1 flex items-center gap-1.5"><MessageSquareText className="h-4 w-4" />Bio</Label>
                                            <p className="text-gray-200 whitespace-pre-wrap text-xs leading-relaxed bg-[#181818] p-2 rounded-md border border-[#2a2a2a]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewingUser.bio ?? '') }} />
                                        </div>
                                    )}
                                        <div className="sm:col-span-2">
                                            <Label className="block text-sm font-semibold text-gray-300 mb-1 flex items-center gap-1.5"><Info className="h-4 w-4" /> Account Status</Label>
                                            <p className="text-gray-200 text-sm">{user.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
                                        </div>
                                    {viewingUser.role === 'artist' && (
                                        <>
                                            <div className="sm:col-span-2 my-2 border-t border-[#2a2a2a]"></div>
                                            <div className="sm:col-span-2 text-sm font-semibold text-pink-400 flex items-center gap-1.5 mb-1"><UserCog className="h-4 w-4" /> Artist Profile Details</div>
                                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                                                    <div>
                                                        <Label className="block text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1"><StarHalf className="h-3 w-3" />Artist Rating</Label>
                                                        <p className="text-yellow-400 flex items-center gap-1 leading-tight">
                                                            {viewingUser.averageRating != null ? viewingUser.averageRating.toFixed(1) : 'N/A'} / 5
                                                            <span className="text-gray-400 text-xs">({viewingUser.reviewCount || 0} reviews)</span>
                                                        </p>
                                                    </div>
                                                    {viewingUser.specialties && (
                                                        <div><Label className="text-xs text-gray-500 flex items-center gap-1"><Tag className="h-3 w-3" />Specialties</Label><p className="text-gray-200 whitespace-pre-wrap leading-tight">{viewingUser.specialties}</p></div>
                                                    )}
                                                    {viewingUser.portfolioLink && (
                                                        <div className="sm:col-span-2"><Label className="text-xs text-gray-500 flex items-center gap-1"><LinkIcon className="h-3 w-3" />Portfolio</Label><p><Link href={viewingUser.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline break-all text-xs leading-tight">{viewingUser.portfolioLink}</Link></p></div>
                                                    )}
                                                    {Array.isArray(viewingUser.services) && viewingUser.services.length > 0 && (
                                                        <div className="sm:col-span-2"><Label className="text-xs text-gray-500 flex items-center gap-1"><Package className="h-3 w-3" />Services</Label><p className="text-gray-200 text-xs leading-tight">{viewingUser.services.join(', ')}</p></div>
                                                    )}
                                                    {Array.isArray(viewingUser.availableLocations) && viewingUser.availableLocations.length > 0 && (
                                                        <div className="sm:col-span-2"><Label className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />Locations</Label><p className="text-gray-200 text-xs leading-tight">{viewingUser.availableLocations.join(', ')}</p></div>
                                                    )}
                                                    {Array.isArray(viewingUser.bookingInfo) && viewingUser.bookingInfo.length > 0 && (
                                                        <div className="sm:col-span-2"><Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarIconLucide className="h-3 w-3" />Booking Info</Label><p className="text-gray-200 whitespace-pre-wrap text-xs leading-tight">{viewingUser.bookingInfo.join('\n')}</p></div>
                                                    )}
                                                </div>
                                        </>
                                    )}
                                    {viewingUser.role === 'customer' && (
                                        <>
                                            <div className="sm:col-span-2 my-2 border-t border-[#2a2a2a]"></div>
                                            <div className="sm:col-span-2 text-sm font-semibold text-pink-400 flex items-center gap-1.5 mb-1"><UserRound className="h-4 w-4" /> Customer Preferences</div>
                                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                                                    {Array.isArray(viewingUser.bookingPreferences) && viewingUser.bookingPreferences.length > 0 && (
                                                          <div className="sm:col-span-2"><Label className="text-xs text-gray-500 flex items-center gap-1"><Info className="h-3 w-3" />Booking Prefs</Label><p className="text-gray-200 text-xs leading-tight">{viewingUser.bookingPreferences.join(', ')}</p></div>
                                                      )}
                                                      {Array.isArray(viewingUser.preferredArtists) && viewingUser.preferredArtists.length > 0 && (
                                                          <div className="sm:col-span-2"><Label className="text-xs text-gray-500 flex items-center gap-1"><Star className="h-3 w-3" />Preferred Artists (IDs)</Label><p className="text-gray-200 break-words text-xs leading-tight">{viewingUser.preferredArtists.join(', ')}</p></div>
                                                      )}
                                                </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">No user data to display or user not found.</div>
                            )}
                        </div>
                         <DialogFooter className="pt-4 mt-0 border-t border-[#2a2a2a] shrink-0">
                              {viewingUser && user && viewingUser.id !== user.id && viewingUser.role !== 'admin' ? (
                                   <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm"
                                                disabled={isDeletingUser === viewingUser.id || isCsrfActionDisabled || isCriticalActionInProgress}
                                                 className="bg-red-600/80 hover:bg-red-700 text-red-100 transition-colors h-9 px-4 text-xs">
                                                    <UserMinus className="mr-1.5 h-4 w-4" />
                                                   {isDeletingUser === viewingUser.id ? <span className="animate-pulse">Deleting...</span> : 'Delete This User'}
                                               </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-pink-500">Confirm User Deletion</AlertDialogTitle>
                                                <AlertDialogDescription className="text-gray-400">
                                                    Are you sure you want to delete user "<span className="font-semibold text-gray-300">{viewingUser.email}</span>" (ID: {viewingUser.id})?
                                                     This action is permanent and will remove all their associated data (quotes, reviews, disputes, etc.). This cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => { if(viewingUser?.id) handleDeleteUser(viewingUser.id); }} className="bg-red-600 text-white hover:bg-red-700"
                                                 disabled={isDeletingUser === viewingUser?.id}>
                                                     {isDeletingUser === viewingUser?.id ? 'Processing...' : 'Confirm Delete'}
                                                  </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                   </AlertDialog>
                               ) : (
                                   <Button variant="destructive" size="sm" disabled className="bg-red-600/50 text-red-100/50 h-9 px-4 text-xs cursor-not-allowed"
                                     title={viewingUser?.id === user?.id ? "You cannot delete your own account." : (viewingUser?.role === 'admin' ? "Admin accounts cannot be deleted from this interface." : "Cannot delete this user.")}>
                                     <UserMinus className="mr-1.5 h-4 w-4" /> Delete This User
                                   </Button>
                               )}
                               <DialogClose asChild>
                                    <Button variant="outline" className="border-gray-600 bg-gray-700/80 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors h-9 px-4 text-xs" disabled={isCriticalActionInProgress}>Close</Button>
                                </DialogClose>
                           </DialogFooter>
                       </DialogContent>
                  </Dialog>

            <Dialog open={!!viewingQuoteId} onOpenChange={(isOpen) => { if (!isOpen) closeDetailModals(); }}>
                <DialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl max-w-[calc(100vw-32px)] w-full sm:max-w-lg md:max-w-xl overflow-y-auto max-h-90vh">
                    <DialogHeader className="pb-4 mb-0 border-b border-[#2a2a2a] shrink-0">
                        <DialogTitle className="text-pink-500 flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5" /> Quote Details
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Viewing: Quote ID {viewingQuoteLoading ? 'Loading...' : (viewingQuote?.id || viewingQuoteId || 'N/A')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-2">
                    {viewingQuoteLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mb-3"></div>
                           <p className="text-gray-400">Loading quote details...</p>
                        </div>
                    ) : viewingQuoteError ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 py-10 bg-red-900/20 p-4 rounded-md">
                            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2"/>
                            <p className="font-semibold">Error: {viewingQuoteError}</p>
                        </div>
                    ) : viewingQuote ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm pb-4">
                                <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3 pb-3 border-b border-[#2a2a2a]">
                                     <div className="flex items-center gap-2 text-pink-400 shrink-0 text-xl">
                                        <FileText className="h-6 w-6" />
                                        <span className="font-semibold">{viewingQuote.productType}</span>
                                     </div>
                                     <div className="space-y-0.5">
                                        <p className="text-gray-400 flex items-center gap-1.5 text-sm"><CalendarIconLucide className="h-4 w-4 text-gray-500" /> Service Date: {formatDateSafely(viewingQuote.serviceDate)}</p>
                                        <p className="text-gray-400 flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4 text-gray-500" /> Service Time: {viewingQuote.serviceTime || 'N/A'}</p>
                                         <p className="text-gray-500 flex items-center gap-1.5 text-xs font-mono mt-1"><Info className="h-3.5 w-3.5" /> ID: {viewingQuote.id}</p>
                                     </div>
                                </div>
                                   <div>
                                       <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><DollarSignIcon className="h-3.5 w-3.5" />Price</Label>
                                       <p className="text-gray-200 text-base font-semibold">${parseFloat(viewingQuote.price).toFixed(2)}</p>
                                   </div>
                                   <div>
                                        <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" />Status</Label>
                                         <Badge variant="outline" className={`text-xs font-medium ${getStatusColorClasses(viewingQuote.status)}`}>
                                                                  {viewingQuote.status === 'Accepted' && <CheckSquare className="h-4 w-4 mr-1" />}
                                                                  {viewingQuote.status === 'Pending' && <AlertCircle className="h-4 w-4 mr-1" />}
                                                                  {viewingQuote.status === 'Booked' && <PackageCheck className="h-4 w-4 mr-1" />}
                                                                  {viewingQuote.status === 'Completed' && <ClipboardCheck className="h-4 w-4 mr-1" />}
                                                                  {viewingQuote.status === 'Cancelled' && <PackageX className="h-4 w-4 mr-1" />}
                                                                  {viewingQuote.status}
                                                              </Badge>
                                   </div>
                                  <div className="sm:col-span-2">
                                      <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" />Artist</Label>
                                      <p className="text-gray-200">{viewingQuote.artist?.name || viewingQuote.artist?.email || <span className="text-gray-500 italic">Not assigned</span>}</p>
                                       {viewingQuote.artist && <p className="text-xs text-gray-400">{viewingQuote.artist.email}</p>}
                                   </div>
                                  <div className="sm:col-span-2">
                                       <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />Customer</Label>
                                       <p className="text-gray-200">{viewingQuote.customer?.name || viewingQuote.customer?.email || <span className="text-gray-500 italic">Unknown customer</span>}</p>
                                       {viewingQuote.customer && <p className="text-xs text-gray-400">{viewingQuote.customer.email}</p>}
                                    </div>
                                  <div className="sm:col-span-2 mt-2">
                                       <Label className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-1.5"><Info className="h-4 w-4" /> Details</Label>
                                       <p className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed bg-[#181818] p-2 rounded-md border border-[#2a2a2a]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewingQuote.details ?? '') }} />
                                    </div>
                                     {viewingQuote.razorpayOrderId && (
                                         <div className="sm:col-span-2 mt-2">
                                             <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><DollarSignIcon className="h-3.5 w-3.5" />Payment Info</Label>
                                             <p className="text-gray-200 text-xs">Order ID: {viewingQuote.razorpayOrderId}</p>
                                             {viewingQuote.razorpayPaymentId && <p className="text-gray-200 text-xs">Payment ID: {viewingQuote.razorpayPaymentId}</p>}
                                         </div>
                                     )}
                                     {viewingQuote.review && (
                                         <div className="sm:col-span-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                                              <h4 className="font-semibold flex items-center gap-1.5 mb-2 text-yellow-400 text-sm">
                                                  <Star className="h-4 w-4 text-yellow-400" /> Associated Review:
                                              </h4>
                                              <div className="space-y-1.5 text-xs bg-yellow-900/20 p-3 rounded-md border border-yellow-700/40">
                                                  <div className="flex items-center gap-1">
                                                       <strong className="text-gray-300">Rating:</strong>
                                                        <div className="flex items-center gap-0.5 text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-3.5 w-3.5 ${i < viewingQuote.review!.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                                                                />
                                                            ))}
                                                            <span className="text-gray-300 ml-1">({viewingQuote.review.rating.toFixed(1)}/5)</span>
                                                        </div>
                                                  </div>
                                                  {viewingQuote.review.comment ? (
                                                      <div>
                                                           <strong className="text-gray-300 block mb-0.5">Comment:</strong>
                                                           <p className="text-gray-300 whitespace-pre-wrap">{viewingQuote.review.comment}</p>
                                                      </div>
                                                  ) : <p className="text-gray-500 italic">No comment provided.</p>}
                                                    <p className="text-gray-400 flex items-center gap-1"><MessageSquareText className="h-3 w-3" /> Review ID: {viewingQuote.review.id}</p>
                                              </div>
                                        </div>
                                    )}
                                      {viewingQuote.disputes && viewingQuote.disputes.length > 0 && (
                                          <div className="sm:col-span-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                                              <h4 className="font-semibold flex items-center gap-1.5 mb-2 text-red-400 text-sm">
                                                  <TriangleAlert className="h-4 w-4 text-red-400" /> Associated Disputes:
                                              </h4>
                                              <div className="space-y-2 text-xs">
                                                  {viewingQuote.disputes.map(dispute => (
                                                      <div key={dispute.id} className={`bg-red-900/10 p-3 rounded-md border ${getDisputeStatusColorClasses(dispute.status)}`}>
                                                          <div className="flex justify-between items-start">
                                                              <p className="font-semibold text-gray-200 flex items-center gap-1.5">
                                                                  <TriangleAlert className="h-3.5 w-3.5 text-red-400" />
                                                                  {dispute.reason}
                                                              </p>
                                                              <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDisputeStatusColorClasses(dispute.status)}`}>
                                                                  {dispute.status}
                                                              </Badge>
                                                          </div>
                                                          {dispute.initiator && (
                                                              <p className="text-gray-400 text-[11px] mt-1">
                                                                  Initiator: {dispute.initiator.name || dispute.initiator.email} ({dispute.initiator.role})
                                                              </p>
                                                          )}
                                                          {dispute.involved && (
                                                               <p className="text-gray-400 text-[11px] mt-0.5">
                                                                  Involved: {dispute.involved.name || dispute.involved.email} ({dispute.involved.role})
                                                               </p>
                                                          )}
                                                          {dispute.details && <p className="text-gray-300 mt-1 text-xs whitespace-pre-wrap leading-relaxed">Details: {dispute.details}</p>}
                                                           <p className="text-gray-500 text-[11px] mt-1">Dispute ID: {dispute.id}</p>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                </div>
                            ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">No quote data to display or quote not found.</div>
                    )}
                    </div>
                    <DialogFooter className="pt-4 mt-0 border-t border-[#2a2a2a] shrink-0">
                          <AlertDialog>
                             <AlertDialogTrigger asChild>
                                 <Button variant="destructive" size="sm"
                                     disabled={!viewingQuoteId || isDeletingQuote === viewingQuoteId || isCsrfActionDisabled || isCriticalActionInProgress}
                                      className="bg-red-600/80 hover:bg-red-700 text-red-100 transition-colors h-9 px-4 text-xs">
                                       {isDeletingQuote === viewingQuoteId ? <span className="animate-pulse">Deleting...</span> : <><Trash2 className="mr-1.5 h-4 w-4" />Delete Quote</>}
                                   </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl">
                                 <AlertDialogHeader>
                                     <AlertDialogTitle className="text-pink-500">Confirm Quote Deletion</AlertDialogTitle>
                                     <AlertDialogDescription className="text-gray-400">
                                         Are you sure you want to delete quote for "<span className="font-semibold text-gray-300">{viewingQuote?.productType || 'this quote'}</span>" (ID: {viewingQuoteId})? This action is permanent.
                                         Note: This will also delete any associated reviews or disputes.
                                     </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                     <AlertDialogCancel className="border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => { if(viewingQuoteId) handleDeleteQuote(viewingQuoteId); }} className="bg-red-600 text-white hover:bg-red-700"
                                       disabled={isDeletingQuote === viewingQuoteId}>
                                          {isDeletingQuote === viewingQuoteId ? 'Processing...' : 'Confirm Delete'}
                                       </AlertDialogAction>
                                 </AlertDialogFooter>
                             </AlertDialogContent>
                         </AlertDialog>
                         <DialogClose asChild>
                              <Button variant="outline" className="border-gray-600 bg-gray-700/80 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors h-9 px-4 text-xs" disabled={isCriticalActionInProgress}>Close</Button>
                          </DialogClose>
                     </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={!!viewingReviewId} onOpenChange={(isOpen) => { if (!isOpen) closeDetailModals(); }}>
                <DialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl max-w-[calc(100vw-32px)] w-full sm:max-w-lg overflow-y-auto max-h-90vh">
                    <DialogHeader className="pb-4 mb-0 border-b border-[#2a2a2a] shrink-0">
                        <DialogTitle className="text-pink-500 flex items-center gap-2 text-xl">
                            <Star className="h-5 w-5" /> Review Details
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Viewing review ID: {viewingReviewLoading ? 'Loading...' : (viewingReview?.id || viewingReviewId || 'N/A')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-2">
                    {viewingReviewLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mb-3"></div>
                           <p className="text-gray-400">Loading review details...</p>
                        </div>
                    ) : viewingReviewError ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 py-10 bg-red-900/20 p-4 rounded-md">
                            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2"/>
                            <p className="font-semibold">Error: {viewingReviewError}</p>
                        </div>
                    ) : viewingReview ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm pb-4">
                                 <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3 pb-3 border-b border-[#2a2a2a]">
                                      <div className="flex items-center gap-2 text-yellow-400 shrink-0 text-xl">
                                         <Star className="h-6 w-6" />
                                         <span className="font-semibold">{viewingReview.rating}/5</span>
                                      </div>
                                      <div className="space-y-0.5">
                                          <p className="text-gray-400 flex items-center gap-1.5 text-sm"><UserCog className="h-4 w-4 text-gray-500" /> Artist: {viewingReview.artist?.name || viewingReview.artist?.email || 'N/A'}</p>
                                          <p className="text-gray-400 flex items-center gap-1.5 text-sm"><UserRound className="h-4 w-4 text-gray-500" /> Customer: {viewingReview.customer?.name || viewingReview.customer?.email || 'N/A'}</p>
                                           <p className="text-gray-500 flex items-center gap-1.5 text-xs font-mono mt-1"><Info className="h-3.5 w-3.5" /> ID: {viewingReview.id}</p>
                                      </div>
                                 </div>
                                   <div>
                                        <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><CalendarIconLucide className="h-3.5 w-3.5" />Created At</Label>
                                       <p className="text-gray-200">{formatDateSafely(viewingReview.createdAt, 'PPPp')}</p>
                                    </div>
                                    {viewingReview.quote && (
                                         <div>
                                             <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Related Quote</Label>
                                             <p className="text-gray-200">ID: <span className="font-mono">{viewingReview.quote.id}</span></p>
                                              <p className="text-xs text-gray-400">Product: {viewingReview.quote.productType}</p>
                                         </div>
                                     )}
                                  <div className="sm:col-span-2 mt-2">
                                        <Label className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-1.5"><MessageSquareText className="h-4 w-4" />Comment</Label>
                                        <p className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed bg-[#181818] p-2 rounded-md border border-[#2a2a2a]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewingReview.comment ?? '') }} />
                                     </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">No review data to display or review not found.</div>
                            )}
                       </div>
                    <DialogFooter className="pt-4 mt-0 border-t border-[#2a2a2a] shrink-0">
                          <AlertDialog>
                             <AlertDialogTrigger asChild>
                                 <Button variant="destructive" size="sm"
                                     disabled={!viewingReviewId || isDeletingReview === viewingReviewId || isCsrfActionDisabled || isCriticalActionInProgress}
                                      className="bg-red-600/80 hover:bg-red-700 text-red-100 transition-colors h-9 px-4 text-xs">
                                       {isDeletingReview === viewingReviewId ? <span className="animate-pulse">Deleting...</span> : <><Trash2 className="mr-1.5 h-4 w-4" />Delete Review</>}
                                   </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl">
                                 <AlertDialogHeader>
                                     <AlertDialogTitle className="text-pink-500">Confirm Review Deletion</AlertDialogTitle>
                                     <AlertDialogDescription className="text-gray-400">
                                         Are you sure you want to delete review (ID: <span className="font-semibold text-gray-300">{viewingReviewId}</span>)? This action is permanent.
                                     </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                     <AlertDialogCancel className="border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => { if(viewingReviewId) handleDeleteReview(viewingReviewId); }} className="bg-red-600 text-white hover:bg-red-700"
                                       disabled={isDeletingReview === viewingReviewId}>
                                          {isDeletingReview === viewingReviewId ? 'Processing...' : 'Confirm Delete'}
                                       </AlertDialogAction>
                                 </AlertDialogFooter>
                             </AlertDialogContent>
                         </AlertDialog>
                         <DialogClose asChild>
                             <Button variant="outline" className="border-gray-600 bg-gray-700/80 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors h-9 px-4 text-xs" disabled={isCriticalActionInProgress}>Close</Button>
                         </DialogClose>
                    </DialogFooter>
                </DialogContent>
           </Dialog>

            <Dialog open={!!viewingDisputeId} onOpenChange={(isOpen) => { if (!isOpen) closeDetailModals(); }}>
               <DialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl max-w-[calc(100vw-32px)] w-full sm:max-w-lg md:max-w-xl overflow-y-auto max-h-90vh">
                   <DialogHeader className="pb-4 mb-0 border-b border-[#2a2a2a] shrink-0">
                       <DialogTitle className="text-red-500 flex items-center gap-2 text-xl">
                           <TriangleAlert className="h-5 w-5" /> Dispute Details
                       </DialogTitle>
                       <DialogDescription className="text-gray-400">
                           Viewing dispute ID: {viewingDisputeLoading ? 'Loading...' : (viewingDispute?.id || viewingDisputeId || 'N/A')}
                       </DialogDescription>
                   </DialogHeader>
                   <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-2">
                   {viewingDisputeLoading ? (
                       <div className="flex flex-col items-center justify-center h-full py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mb-3"></div>
                          <p className="text-gray-400">Loading dispute details...</p>
                       </div>
                   ) : viewingDisputeError ? (
                       <div className="flex flex-col items-center justify-center h-full text-center text-red-400 py-10 bg-red-900/20 p-4 rounded-md">
                           <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2"/>
                           <p className="font-semibold">Error: {viewingDisputeError}</p>
                       </div>
                   ) : viewingDispute ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm pb-4">
                            <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3 pb-3 border-b border-[#2a2a2a]">
                                <div className="flex items-center gap-2 text-red-400 shrink-0 text-xl">
                                    <TriangleAlert className="h-6 w-6" />
                                    <span className="font-semibold">{viewingDispute.reason}</span>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-gray-400 flex items-center gap-1.5 text-sm">Status:
                                         <Badge variant="outline" className={`ml-1 text-sm font-medium ${getDisputeStatusColorClasses(viewingDispute.status)}`}>
                                              {viewingDispute.status}
                                         </Badge>
                                    </p>
                                    <p className="text-gray-400 flex items-center gap-1.5 text-sm"><CalendarIconLucide className="h-4 w-4 text-gray-500" /> Created: {formatDateSafely(viewingDispute.createdAt, 'PPPp')}</p>
                                    <p className="text-gray-500 flex items-center gap-1.5 text-xs font-mono mt-1"><Info className="h-3.5 w-3.5" /> ID: {viewingDispute.id}</p>
                                </div>
                            </div>
                                  <div className="sm:col-span-2">
                                      <Label className="text-xs font-medium text-gray-500 mb-0.5 flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" />Involved Parties</Label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                                          <div>
                                              <Label className="text-xs font-medium text-gray-500 mb-0.5">Initiator</Label>
                                                {viewingDispute.initiator ? (
                                                    <><p className="text-gray-200 font-semibold">{viewingDispute.initiator.name || <span className="italic text-gray-400">N/A</span>}</p><p className="text-xs text-gray-400">{viewingDispute.initiator.email}</p><p className="text-xs text-gray-500 capitalize">Role: {viewingDispute.initiator.role}</p></>
                                                ) : <p className="text-gray-400 break-words italic">ID: {viewingDispute.initiatorId}</p>}
                                          </div>
                                           <div>
                                              <Label className="text-xs font-medium text-gray-500 mb-0.5">Involved Party</Label>
                                                {viewingDispute.involved ? (
                                                    <><p className="text-gray-200 font-semibold">{viewingDispute.involved.name || <span className="italic text-gray-400">N/A</span>}</p><p className="text-xs text-gray-400">{viewingDispute.involved.email}</p><p className="text-xs text-gray-500 capitalize">Role: {viewingDispute.involved.role}</p></>
                                                ) : <p className="text-gray-400 break-words italic">ID: {viewingDispute.involvedId}</p>}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="sm:col-span-2 mt-2">
                                       <Label className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-1.5"><FileText className="h-4 w-4" />Related Quote</Label>
                                       {viewingDispute.quote ? (
                                           <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                                                <div><Label className="text-xs text-gray-500 mb-0.5">ID</Label><p className="text-gray-200 font-mono">{viewingDispute.quote.id}</p></div>
                                                <div><Label className="text-xs text-gray-500 mb-0.5">Product</Label><p className="text-gray-200">{viewingDispute.quote.productType}</p></div>
                                                <div><Label className="text-xs text-gray-500 mb-0.5">Service Date</Label><p className="text-gray-200">{formatDateSafely(viewingDispute.quote.serviceDate)}</p></div>
                                                <div><Label className="text-xs text-gray-500 mb-0.5">Status</Label>
                                                     <Badge variant="outline" className={`text-xs font-medium ${getStatusColorClasses(viewingDispute.quote.status)}`}>{viewingDispute.quote.status}</Badge>
                                                </div>
                                           </div>
                                       ) : <p className="text-gray-400 break-words italic text-xs">Quote ID: {viewingDispute.quoteId}</p>}
                                   </div>
                                   <div className="sm:col-span-2 mt-2">
                                        <Label className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-1.5"><MessageSquareText className="h-4 w-4" />Reason</Label>
                                        <p className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed bg-[#181818] p-2 rounded-md border border-[#2a2a2a]">{viewingDispute.reason}</p>
                                     </div>
                                     <div className="sm:col-span-2 mt-2">
                                           <Label className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-1.5"><Info className="h-4 w-4" />Additional Details</Label>
                                           <p className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed bg-[#181818] p-2 rounded-md border border-[#2a2a2a]">
                                             {viewingDispute.details || <span className="italic text-gray-500">No additional details provided.</span>}
                                           </p>
                                      </div>
                                     <div className="sm:col-span-2 mt-4 pt-4 border-t border-[#2a2a2a]">
                                        <h4 className="text-md font-semibold text-pink-400 mb-3 flex items-center gap-1.5">
                                            <Edit3 className="h-4 w-4" />
                                            Manage Resolution
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="disputeStatus" className="block text-xs font-medium text-gray-500 mb-1">Dispute Status</Label>
                                                <Select
                                                     value={disputeStatusInput}
                                                     onValueChange={(value: FrontendDispute['status']) => setDisputeStatusInput(value)}
                                                     disabled={isSubmittingDisputeUpdate || isCriticalActionInProgress || isCsrfActionDisabled}
                                                >
                                                     <SelectTrigger className="w-full bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-pink-500 focus:border-pink-500 text-sm">
                                                         <SelectValue placeholder="Select status..." />
                                                     </SelectTrigger>
                                                     <SelectContent className="bg-[#181818] border-[#3a3a3a] text-gray-200">
                                                         {["Open", "Under Review", "Resolved", "Closed"].map(status => (
                                                             <SelectItem key={status} value={status} className="hover:bg-[#2a2a2a]">{status}</SelectItem>
                                                         ))}
                                                    </SelectContent>
                                                 </Select>
                                            </div>
                                            <div>
                                                 <Label htmlFor="resolutionInput" className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                                                     Resolution Notes
                                                      {resolutionInput && (
                                                          <Button variant="ghost" size="sm" onClick={() => setResolutionInput('')} className="h-auto p-0 text-gray-500 hover:text-gray-300 text-xs" disabled={isSubmittingDisputeUpdate || isCriticalActionInProgress || isCsrfActionDisabled}>
                                                              <XCircle className="h-3 w-3 mr-1" /> Clear
                                                          </Button>
                                                      )}
                                                  </Label>
                                                <Textarea
                                                    id="resolutionInput"
                                                    value={resolutionInput}
                                                    onChange={(e) => setResolutionInput(e.target.value)}
                                                    placeholder="Enter resolution details here..."
                                                    className="bg-[#181818] border-[#3a3a3a] text-gray-200 mt-1 min-h-[100px] focus:ring-pink-500 focus:border-pink-500 text-sm"
                                                    disabled={isSubmittingDisputeUpdate || isCriticalActionInProgress || isCsrfActionDisabled}
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                                <Button
                                                    onClick={() => handleUpdateDispute(viewingDispute.id, { resolution: resolutionInput.trim(), status: disputeStatusInput })}
                                                    disabled={
                                                        isSubmittingDisputeUpdate ||
                                                        isCsrfActionDisabled ||
                                                        isCriticalActionInProgress ||
                                                        (resolutionInput.trim() === (viewingDispute.resolution || "") && disputeStatusInput === viewingDispute.status)
                                                    }
                                                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 text-sm w-full sm:flex-1"
                                                    size="sm"
                                                >
                                                    {isSubmittingDisputeUpdate ? (
                                                        <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> Saving...</>
                                                    ) : (
                                                        <><Edit3 className="mr-2 h-4 w-4" /> Update Status & Notes</>
                                                    )}
                                                </Button>
                                                {(viewingDispute.status === 'Open' || viewingDispute.status === 'Under Review') && (
                                                    <Button
                                                        onClick={() => {
                                                            if (!resolutionInput.trim()) {
                                                                sonnerToast.error("Resolution Notes Required", { description: "Please provide resolution notes before marking as resolved."});
                                                                return;
                                                            }
                                                            handleUpdateDispute(viewingDispute.id, {
                                                                resolution: resolutionInput.trim(),
                                                                status: 'Resolved'
                                                            }, true);
                                                        }}
                                                        disabled={
                                                            !resolutionInput.trim() ||
                                                            isSubmittingDisputeUpdate ||
                                                            isQuickResolving ||
                                                            isCsrfActionDisabled ||
                                                            isCriticalActionInProgress
                                                        }
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm w-full sm:flex-1"
                                                        size="sm"
                                                    >
                                                        {isQuickResolving ? (
                                                            <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> Resolving...</>
                                                        ) : (
                                                           <><ClipboardCheck className="mr-2 h-4 w-4" /> Mark as Resolved & Save Notes</>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                             {isCsrfActionDisabled && <p className="text-xs text-red-500 mt-1 italic">Action disabled: Security token issue. Please refresh.</p>}
                                             {(resolutionInput.trim() === (viewingDispute.resolution || "") && disputeStatusInput === viewingDispute.status && !isSubmittingDisputeUpdate) && (
                                                <p className="text-xs text-gray-500 mt-1 italic">No changes to save using "Update Status & Notes".</p>
                                            )}
                                        </div>
                                     </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">No dispute data to display or dispute not found.</div>
                            )}
                        </div>
                   <DialogFooter className="pt-4 mt-0 border-t border-[#2a2a2a] shrink-0">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm"
                                    disabled={!viewingDisputeId || isDeletingDispute === viewingDisputeId || isCsrfActionDisabled || isCriticalActionInProgress}
                                     className="bg-red-600/80 hover:bg-red-700 text-red-100 transition-colors h-9 px-4 text-xs">
                                      {isDeletingDispute === viewingDisputeId ? <span className="animate-pulse">Deleting...</span> : <><Trash2 className="mr-1.5 h-4 w-4" />Delete Dispute</>}
                                  </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-pink-500">Confirm Dispute Deletion</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                        Are you sure you want to delete dispute (ID: <span className="font-semibold text-gray-300">{viewingDisputeId}</span>)? This action is permanent.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => { if(viewingDisputeId) handleDeleteDispute(viewingDisputeId); }} className="bg-red-600 text-white hover:bg-red-700"
                                       disabled={isDeletingDispute === viewingDisputeId}>
                                         {isDeletingDispute === viewingDisputeId ? 'Processing...' : 'Confirm Delete'}
                                      </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                       </AlertDialog>
                       <DialogClose asChild>
                            <Button variant="outline" className="border-gray-600 bg-gray-700/80 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors h-9 px-4 text-xs" disabled={isAnyActionInProgress}>Close</Button>
                        </DialogClose>
                   </DialogFooter>
               </DialogContent>
          </Dialog>

            <Dialog open={!!quickResolveDisputeId} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setQuickResolveDisputeId(null);
                    setQuickResolveNotes("");
                }
            }}>
                <DialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl sm:max-w-md">
                    <DialogHeader className="pb-4 border-b border-[#2a2a2a]">
                        <DialogTitle className="text-green-500 flex items-center gap-2 text-xl">
                            <Sparkles className="h-5 w-5" /> Quick Resolve Dispute
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Provide resolution notes and mark dispute ID: <span className="font-mono text-gray-300">{quickResolveDisputeId}</span> as resolved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="quickResolveNotes" className="block text-sm font-medium text-gray-400 mb-1">
                                Resolution Notes <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="quickResolveNotes"
                                value={quickResolveNotes}
                                onChange={(e) => setQuickResolveNotes(e.target.value)}
                                placeholder="Enter final resolution details here..."
                                className="bg-[#181818] border-[#3a3a3a] text-gray-200 min-h-[100px] focus:ring-green-500 focus:border-green-500 text-sm"
                                disabled={isQuickResolving || isCriticalActionInProgress || isCsrfActionDisabled}
                            />
                            {!quickResolveNotes.trim() && (
                                <p className="text-xs text-red-500 mt-1">Resolution notes are required to resolve a dispute.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-[#2a2a2a]">
                        <DialogClose asChild>
                            <Button variant="ghost" className="text-gray-400 hover:bg-gray-700 hover:text-white" disabled={isQuickResolving || isCriticalActionInProgress}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={() => {
                                if (!quickResolveNotes.trim()) {
                                    sonnerToast.error("Resolution Notes Required", { description: "Please provide resolution notes before marking as resolved."});
                                    return;
                                }
                                if (quickResolveDisputeId) {
                                    handleUpdateDispute(quickResolveDisputeId, {
                                        resolution: quickResolveNotes.trim(),
                                        status: 'Resolved'
                                    }, true);
                                }
                            }}
                            disabled={
                                !quickResolveNotes.trim() ||
                                isQuickResolving ||
                                isCsrfActionDisabled ||
                                isCriticalActionInProgress
                            }
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isQuickResolving ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> Resolving...</>
                            ) : (
                                <><ClipboardCheck className="mr-2 h-4 w-4" /> Confirm & Resolve</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!isCompletingWithdrawal} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setIsCompletingWithdrawal(null);
                }
            }}>
                <DialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl sm:max-w-md">
                    <DialogHeader className="pb-4 border-b border-[#2a2a2a]">
                        <DialogTitle className="text-green-500 flex items-center gap-2 text-xl">
                            <ClipboardCheck className="h-5 w-5" /> Complete Withdrawal
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Complete withdrawal ID: <span className="font-mono text-gray-300">{isCompletingWithdrawal}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="razorpayPayoutId" className="block text-sm font-medium text-gray-400 mb-1">
                                Razorpay Payout ID (Optional)
                            </Label>
                            <Input
                                id="razorpayPayoutId"
                                value={razorpayPayoutId}
                                onChange={(e) => setRazorpayPayoutId(e.target.value)}
                                placeholder="Enter Razorpay payout ID..."
                                className="bg-[#181818] border-[#3a3a3a] text-gray-200 focus:ring-green-500 focus:border-green-500 text-sm"
                                disabled={isCompletingWithdrawal !== null}
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-[#2a2a2a]">
                        <DialogClose asChild>
                            <Button variant="ghost" className="text-gray-400 hover:bg-gray-700 hover:text-white" disabled={isCompletingWithdrawal !== null}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={() => {
                                if (isCompletingWithdrawal) {
                                    handleCompleteWithdrawal(isCompletingWithdrawal);
                                }
                            }}
                            disabled={isCompletingWithdrawal === null}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isCompletingWithdrawal ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> Completing...</>
                            ) : (
                                <><ClipboardCheck className="mr-2 h-4 w-4" /> Confirm Complete</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!isFailingWithdrawal} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setIsFailingWithdrawal(null);
                    setWithdrawalFailureReason("");
                }
            }}>
                <DialogContent className="bg-[#101010] text-white border-[#2a2a2a] shadow-xl sm:max-w-md">
                    <DialogHeader className="pb-4 border-b border-[#2a2a2a]">
                        <DialogTitle className="text-red-500 flex items-center gap-2 text-xl">
                            <XCircle className="h-5 w-5" /> Fail Withdrawal
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Mark withdrawal ID: <span className="font-mono text-gray-300">{isFailingWithdrawal}</span> as failed
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="failureReason" className="block text-sm font-medium text-gray-400 mb-1">
                                Failure Reason <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="failureReason"
                                value={withdrawalFailureReason}
                                onChange={(e) => setWithdrawalFailureReason(e.target.value)}
                                placeholder="Enter reason for failure..."
                                className="bg-[#181818] border-[#3a3a3a] text-gray-200 min-h-[100px] focus:ring-red-500 focus:border-red-500 text-sm"
                                disabled={isFailingWithdrawal !== null}
                            />
                            {!withdrawalFailureReason.trim() && (
                                <p className="text-xs text-red-500 mt-1">Failure reason is required.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-[#2a2a2a]">
                        <DialogClose asChild>
                            <Button variant="ghost" className="text-gray-400 hover:bg-gray-700 hover:text-white" disabled={isFailingWithdrawal !== null}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={() => {
                                if (isFailingWithdrawal) {
                                    handleFailWithdrawal(isFailingWithdrawal);
                                }
                            }}
                            disabled={!withdrawalFailureReason.trim() || isFailingWithdrawal === null}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isFailingWithdrawal ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> Failing...</>
                            ) : (
                                <><XCircle className="mr-2 h-4 w-4" /> Confirm Fail</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <nav className="fixed bottom-0 left-0 right-0 bg-[#101010] border-t border-[#2a2a2a] h-16 md:hidden z-40 shadow-top">
                 <Suspense fallback={
                     <div className="flex justify-around items-center h-full px-2">
                          {[...Array(adminNavigationItems.length)].map((_, i) => <div key={i} className="flex-1 min-w-[70px] h-full flex items-center justify-center"><Skeleton className="h-10 w-10 bg-[#2a2a2a]/50 rounded-full" /></div>)}
                      </div>
                 }>
                    <MobileNavigationComponent navigationItems={adminNavigationItems} currentPathname={pathname} />
                 </Suspense>
            </nav>
            <div className="h-16 md:hidden"></div>
        </div>
    );
}

type AdminNavigationItemComponentType = {
    name: string; href: string; icon: React.ElementType;
    view: 'overview' | 'users' | 'quotes' | 'reviews' | 'disputes' | 'withdrawals';
};

const MobileNavigationComponent = ({ navigationItems, currentPathname }: { navigationItems: AdminNavigationItemComponentType[], currentPathname: string }) => {
    const searchParams = nextUseSearchParams();
    const mobileViewParam = searchParams.get('view');
    const currentMobileView = (mobileViewParam && navigationItems.some(item => item.view === mobileViewParam) ? mobileViewParam : 'overview') as AdminNavigationItemComponentType['view'];

    const isAdminRoot = currentPathname === '/admin' || currentPathname === '/admin/';

    return (
        <ul className="flex justify-around items-center h-full max-w-full overflow-x-auto">
            {navigationItems.map((item) => {
                const isActive = isAdminRoot && currentMobileView === item.view;

                return (
                    <li key={item.name} className="flex-1 min-w-[70px]">
                        <Link
                            href={item.href}
                            className={`flex flex-col items-center justify-center text-xs h-full p-1 transition-all duration-200 ease-in-out group w-full
                                ${isActive ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
                             scroll={false}
                        >
                            <item.icon
                                className={`h-5 w-5 mb-0.5 transition-all duration-200 ease-in-out
                                    ${isActive ? 'text-pink-500 scale-110' : 'text-gray-500 group-hover:text-pink-400'}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`font-medium ${isActive ? 'text-pink-500' : 'group-hover:text-pink-400'}`}>{item.name}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};