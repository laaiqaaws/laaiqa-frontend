"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User as AuthUserRaw, API_BASE_URL } from '@/types/user';
import {
    LayoutDashboard, Users, FileText, Star, Trash2, IndianRupee, CheckSquare, AlertCircle,
    TriangleAlert, RefreshCw, Sparkles, Search, CreditCard, Wallet, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter,
} from "@/components/ui/dialog";
import { toast as sonnerToast } from "sonner";
import { format, parseISO, isValid as dateFnsIsValid, isWithinInterval, startOfToday, endOfToday, subDays, subYears } from "date-fns";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

// Types
interface AdminUser {
    id: string; email: string; name?: string | null; image?: string | null;
    createdAt: string; role: string; averageRating?: number | null; reviewCount?: number | null;
    phone?: string | null; address?: string | null; city?: string | null; state?: string | null;
    zipCode?: string | null; country?: string | null; gender?: string | null; height?: number | null;
    weight?: number | null; color?: string | null; ethnicity?: string | null; age?: number | null;
    sex?: string | null; other?: string | null; bio?: string | null; specialties?: string | null;
    portfolioLink?: string | null; bookingInfo?: string[] | null; services?: string[] | null;
    availableLocations?: string[] | null; bookingPreferences?: string[] | null; preferredArtists?: string[] | null;
    isActive?: boolean;
}

interface AdminUserBrief { id: string; name?: string | null; email: string; role: string; }

interface FrontendDisputeQuoteInfo { id: string; productType: string; status: string; serviceDate: string; }

interface FrontendDispute {
    id: string; createdAt: string; updatedAt: string; reason: string;
    status: "Open" | "Under Review" | "Resolved" | "Closed";
    initiatorId: string; involvedId: string; quoteId: string;
    resolution?: string | null; details?: string | null; comments?: string[] | null;
    quote?: FrontendDisputeQuoteInfo | null;
    initiator?: AdminUserBrief | null; involved?: AdminUserBrief | null;
}

interface AdminQuote {
    id: string; createdAt: string; updatedAt: string; artistId: string | null; customerId: string | null;
    productType: string; details: string; price: string; serviceDate: string; serviceTime: string;
    status: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled";
    artist: { id: string; name: string | null; email: string } | null;
    customer: { id: string; name: string | null; email: string } | null;
    review: AdminReview | null; disputes: FrontendDispute[];
    razorpayOrderId?: string | null; razorpayPaymentId?: string | null;
}

interface AdminReview {
    id: string; createdAt: string; updatedAt: string; rating: number; comment: string | null;
    quoteId: string | null; artistId: string | null; customerId: string | null;
    quote: { id: string; productType: string; status: string; serviceDate: string } | null;
    artist: { id: string; name: string | null; email: string } | null;
    customer: { id: string; name: string | null; email: string } | null;
}

interface Withdrawal {
    id: string; walletId: string; bankAccountId: string; amount: number; netAmount: number; fee: number;
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed'; failureReason?: string | null;
    razorpayPayoutId?: string | null; createdAt: string; processedAt?: string | null; completedAt?: string | null;
    wallet: { user: { id: string; name: string | null; email: string; phone: string | null; }; };
    bankAccount: { bankName: string; accountNumber: string; ifscCode: string; accountType?: string; upiId?: string | null; };
}

interface WalletStats {
    totalWallets: number; totalBalance: string; pendingWithdrawals: number; processingWithdrawals: number;
    completedWithdrawals: { count: number; totalAmount: string; }; recentTransactions: number;
}

type ViewType = 'overview' | 'users' | 'quotes' | 'reviews' | 'disputes' | 'withdrawals';

// Page variants for animations
const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

function AdminDashboardContent() {
    const router = useRouter();
    const searchParams = nextUseSearchParams();
    const view = (searchParams.get('view') || 'overview') as ViewType;

    // Auth state
    const [user, setUser] = useState<AuthUserRaw | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [csrfToken, setCsrfToken] = useState<string | null>(null);

    // Data state
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [quotes, setQuotes] = useState<AdminQuote[]>([]);
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [disputes, setDisputes] = useState<FrontendDispute[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [walletStats, setWalletStats] = useState<WalletStats | null>(null);

    // Loading states
    const [dataLoading, setDataLoading] = useState(true);

    // Filter states
    const [userFilter, setUserFilter] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [quoteFilter, setQuoteFilter] = useState('');
    const [quoteStatusFilter, setQuoteStatusFilter] = useState('all');
    const [reviewFilter, setReviewFilter] = useState('');
    const [disputeFilter, setDisputeFilter] = useState('');
    const [disputeStatusFilter, setDisputeStatusFilter] = useState('all');
    const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('all');

    // Modal states
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<AdminQuote | null>(null);
    const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
    const [selectedDispute, setSelectedDispute] = useState<FrontendDispute | null>(null);
    const [quickResolveDispute, setQuickResolveDispute] = useState<FrontendDispute | null>(null);
    const [quickResolveNotes, setQuickResolveNotes] = useState("");

    // Action states
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Analytics state
    const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | '7d' | '30d' | 'year' | 'custom'>('30d');
    const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange | undefined>({
        from: subDays(startOfToday(), 29), to: endOfToday(),
    });

    // Fetch CSRF token
    const fetchCsrfToken = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setCsrfToken(data.csrfToken);
                return data.csrfToken;
            }
        } catch { /* ignore */ }
        return null;
    }, []);

    // Fetch user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.user.role !== 'admin') {
                        router.replace(data.user.role === 'artist' ? '/artist' : '/customer');
                        return;
                    }
                    setUser(data.user);
                    fetchCsrfToken();
                } else {
                    router.replace('/admin-login');
                }
            } catch {
                router.replace('/admin-login');
            } finally {
                setUserLoading(false);
            }
        };
        fetchUser();
    }, [router, fetchCsrfToken]);

    // Fetch all data
    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setDataLoading(true);
        try {
            const [usersRes, quotesRes, reviewsRes, disputesRes, withdrawalsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/users`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/admin/quotes`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/admin/reviews`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/admin/disputes`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/admin/withdrawals/pending`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/api/admin/wallet/statistics`, { credentials: 'include' }),
            ]);
            if (usersRes.ok) setUsers(await usersRes.json());
            if (quotesRes.ok) setQuotes(await quotesRes.json());
            if (reviewsRes.ok) setReviews(await reviewsRes.json());
            if (disputesRes.ok) setDisputes(await disputesRes.json());
            if (withdrawalsRes.ok) setWithdrawals(await withdrawalsRes.json());
            if (statsRes.ok) setWalletStats(await statsRes.json());
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            setDataLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchAllData();
    }, [user, fetchAllData]);

    // Update analytics date range when period changes
    useEffect(() => {
        const today = startOfToday();
        switch (analyticsPeriod) {
            case '7d': setAnalyticsDateRange({ from: subDays(today, 6), to: endOfToday() }); break;
            case '30d': setAnalyticsDateRange({ from: subDays(today, 29), to: endOfToday() }); break;
            case 'year': setAnalyticsDateRange({ from: subYears(today, 1), to: endOfToday() }); break;
            case 'all': setAnalyticsDateRange(undefined); break;
        }
    }, [analyticsPeriod]);

    // Handlers
    const handleLogout = async () => {
        try {
            const token = csrfToken || await fetchCsrfToken();
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST', credentials: 'include',
                headers: token ? { 'CSRF-Token': token } : {},
            });
        } catch { /* ignore */ }
        window.location.href = '/admin-login';
    };

    const handleRefresh = () => {
        sonnerToast.info("Refreshing...");
        fetchAllData();
    };

    const handleDelete = async (type: 'user' | 'quote' | 'review' | 'dispute', id: string) => {
        const token = csrfToken || await fetchCsrfToken();
        if (!token) { sonnerToast.error("Security token unavailable"); return; }
        
        setActionLoading(`delete-${type}-${id}`);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/${type}s/${id}`, {
                method: 'DELETE', credentials: 'include',
                headers: { 'CSRF-Token': token },
            });
            if (res.ok) {
                sonnerToast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
                if (type === 'user') setUsers(prev => prev.filter(u => u.id !== id));
                if (type === 'quote') setQuotes(prev => prev.filter(q => q.id !== id));
                if (type === 'review') setReviews(prev => prev.filter(r => r.id !== id));
                if (type === 'dispute') setDisputes(prev => prev.filter(d => d.id !== id));
                setSelectedUser(null); setSelectedQuote(null); setSelectedReview(null); setSelectedDispute(null);
            } else {
                const data = await res.json().catch(() => ({}));
                sonnerToast.error(data.message || "Delete failed");
            }
        } catch { sonnerToast.error("Delete failed"); }
        finally { setActionLoading(null); }
    };

    const handleResolveDispute = async (disputeId: string, resolution: string) => {
        const token = csrfToken || await fetchCsrfToken();
        if (!token) { sonnerToast.error("Security token unavailable"); return; }
        
        setActionLoading(`resolve-${disputeId}`);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/disputes/${disputeId}`, {
                method: 'PATCH', credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
                body: JSON.stringify({ status: 'Resolved', resolution }),
            });
            if (res.ok) {
                const updated = await res.json();
                setDisputes(prev => prev.map(d => d.id === disputeId ? updated : d));
                sonnerToast.success("Dispute resolved");
                setQuickResolveDispute(null);
                setQuickResolveNotes("");
                fetchAllData(); // Refresh to sync quote status
            } else {
                sonnerToast.error("Failed to resolve dispute");
            }
        } catch { sonnerToast.error("Failed to resolve dispute"); }
        finally { setActionLoading(null); }
    };

    const handleWithdrawalAction = async (id: string, action: 'approve' | 'complete' | 'fail', reason?: string) => {
        const token = csrfToken || await fetchCsrfToken();
        if (!token) { sonnerToast.error("Security token unavailable"); return; }
        
        setActionLoading(`${action}-${id}`);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${id}/${action}`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
                body: action === 'fail' ? JSON.stringify({ reason }) : undefined,
            });
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(prev => prev.map(w => w.id === id ? data.withdrawal : w));
                sonnerToast.success(`Withdrawal ${action}d`);
            } else {
                sonnerToast.error(`Failed to ${action} withdrawal`);
            }
        } catch { sonnerToast.error(`Failed to ${action} withdrawal`); }
        finally { setActionLoading(null); }
    };

    // Helpers
    const getInitials = (name?: string | null) => {
        if (!name) return "AD";
        const parts = name.trim().split(' ').filter(p => p);
        return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const formatDate = (date: string | null | undefined, fmt = "PPP") => {
        if (!date) return 'N/A';
        const d = parseISO(date);
        return dateFnsIsValid(d) ? format(d, fmt) : 'Invalid';
    };

    const getStatusColor = (status?: string) => {
        const colors: Record<string, string> = {
            'Accepted': 'bg-green-500/20 text-green-400 border-green-500/50',
            'Pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            'Booked': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
            'Completed': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
            'Cancelled': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
            'Open': 'bg-red-500/20 text-red-400 border-red-500/50',
            'Under Review': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
            'Resolved': 'bg-green-500/20 text-green-400 border-green-500/50',
            'Closed': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
            'Processing': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
            'Failed': 'bg-red-500/20 text-red-400 border-red-500/50',
        };
        return colors[status || ''] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    };

    // Filtered data
    const filteredUsers = useMemo(() => {
        let result = users;
        if (userFilter) {
            const q = userFilter.toLowerCase();
            result = result.filter(u => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        if (userRoleFilter !== 'all') result = result.filter(u => u.role === userRoleFilter);
        return result;
    }, [users, userFilter, userRoleFilter]);

    const filteredQuotes = useMemo(() => {
        let result = quotes;
        if (quoteFilter) {
            const q = quoteFilter.toLowerCase();
            result = result.filter(quote => 
                quote.productType.toLowerCase().includes(q) ||
                quote.artist?.name?.toLowerCase().includes(q) ||
                quote.customer?.name?.toLowerCase().includes(q)
            );
        }
        if (quoteStatusFilter !== 'all') result = result.filter(q => q.status === quoteStatusFilter);
        return result;
    }, [quotes, quoteFilter, quoteStatusFilter]);

    const filteredReviews = useMemo(() => {
        if (!reviewFilter) return reviews;
        const q = reviewFilter.toLowerCase();
        return reviews.filter(r => 
            r.artist?.name?.toLowerCase().includes(q) ||
            r.customer?.name?.toLowerCase().includes(q)
        );
    }, [reviews, reviewFilter]);

    const filteredDisputes = useMemo(() => {
        let result = disputes;
        if (disputeFilter) {
            const q = disputeFilter.toLowerCase();
            result = result.filter(d => 
                d.reason.toLowerCase().includes(q) ||
                d.initiator?.name?.toLowerCase().includes(q) ||
                d.involved?.name?.toLowerCase().includes(q)
            );
        }
        if (disputeStatusFilter !== 'all') result = result.filter(d => d.status === disputeStatusFilter);
        return result;
    }, [disputes, disputeFilter, disputeStatusFilter]);

    const filteredWithdrawals = useMemo(() => {
        if (withdrawalStatusFilter === 'all') return withdrawals;
        return withdrawals.filter(w => w.status === withdrawalStatusFilter);
    }, [withdrawals, withdrawalStatusFilter]);

    // Analytics data
    const analyticsData = useMemo(() => {
        const { from, to } = analyticsDateRange || {};
        const inRange = (dateStr: string) => {
            if (!from || !to) return true;
            const d = parseISO(dateStr);
            return dateFnsIsValid(d) && isWithinInterval(d, { start: from, end: to });
        };

        const usersInPeriod = analyticsDateRange ? users.filter(u => inRange(u.createdAt)) : users;
        const quotesInPeriod = analyticsDateRange ? quotes.filter(q => inRange(q.createdAt)) : quotes;
        const reviewsInPeriod = analyticsDateRange ? reviews.filter(r => inRange(r.createdAt)) : reviews;
        const disputesInPeriod = analyticsDateRange ? disputes.filter(d => inRange(d.createdAt)) : disputes;

        const completedQuotes = quotesInPeriod.filter(q => q.status === 'Completed');
        const totalRevenue = completedQuotes.reduce((sum, q) => sum + parseFloat(q.price || '0'), 0);
        const conversionRate = quotesInPeriod.length > 0 ? (completedQuotes.length / quotesInPeriod.length) * 100 : 0;
        const avgRating = reviewsInPeriod.length > 0 
            ? reviewsInPeriod.reduce((sum, r) => sum + r.rating, 0) / reviewsInPeriod.length 
            : null;
        const openDisputes = disputesInPeriod.filter(d => d.status === 'Open' || d.status === 'Under Review').length;

        return { usersInPeriod, quotesInPeriod, reviewsInPeriod, disputesInPeriod, completedQuotes, totalRevenue, conversionRate, avgRating, openDisputes };
    }, [users, quotes, reviews, disputes, analyticsDateRange]);

    // Chart data
    const quoteStatusChart = useMemo(() => ({
        labels: ['Pending', 'Accepted', 'Booked', 'Completed', 'Cancelled'],
        datasets: [{
            data: [
                analyticsData.quotesInPeriod.filter(q => q.status === 'Pending').length,
                analyticsData.quotesInPeriod.filter(q => q.status === 'Accepted').length,
                analyticsData.quotesInPeriod.filter(q => q.status === 'Booked').length,
                analyticsData.completedQuotes.length,
                analyticsData.quotesInPeriod.filter(q => q.status === 'Cancelled').length,
            ],
            backgroundColor: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#6B7280'],
            borderWidth: 0,
        }],
    }), [analyticsData]);

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const, labels: { color: '#9ca3af', font: { size: 11 } } },
        },
        cutout: '60%',
    };

    // Loading state
    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        { name: 'Overview', view: 'overview' as ViewType, icon: LayoutDashboard },
        { name: 'Users', view: 'users' as ViewType, icon: Users },
        { name: 'Quotes', view: 'quotes' as ViewType, icon: FileText },
        { name: 'Reviews', view: 'reviews' as ViewType, icon: Star },
        { name: 'Disputes', view: 'disputes' as ViewType, icon: TriangleAlert },
        { name: 'Withdrawals', view: 'withdrawals' as ViewType, icon: CreditCard },
    ];


    return (
        <div className="min-h-screen bg-black text-white pb-20">
            <div className="w-full max-w-4xl mx-auto lg:px-4">
                {/* Header */}
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">Admin Dashboard</p>
                            <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0] || 'Admin'}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={dataLoading}
                                className="text-gray-400 hover:text-white hover:bg-gray-800">
                                <RefreshCw className={`h-5 w-5 ${dataLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Avatar className="h-10 w-10 cursor-pointer" onClick={handleLogout}>
                                {user?.image && <AvatarImage src={user.image} />}
                                <AvatarFallback className="bg-[#C40F5A] text-white">{getInitials(user?.name)}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={view} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="px-4">
                        {view === 'overview' && <OverviewSection />}
                        {view === 'users' && <UsersSection />}
                        {view === 'quotes' && <QuotesSection />}
                        {view === 'reviews' && <ReviewsSection />}
                        {view === 'disputes' && <DisputesSection />}
                        {view === 'withdrawals' && <WithdrawalsSection />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 h-16 z-30">
                <div className="flex justify-around items-center h-full max-w-4xl mx-auto overflow-x-auto">
                    {navItems.map(item => (
                        <Link key={item.view} href={`/admin?view=${item.view}`}
                            className={`flex flex-col items-center gap-1 px-2 min-w-[60px] transition-colors relative ${view === item.view ? 'text-[#EE2377]' : 'text-gray-500'}`}>
                            <item.icon className="h-5 w-5" strokeWidth={view === item.view ? 2.5 : 1.5} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                            {view === item.view && <span className="absolute -bottom-1 w-6 h-1 bg-[#EE2377] rounded-full"></span>}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Modals */}
            <UserModal />
            <QuoteModal />
            <ReviewModal />
            <DisputeModal />
            <QuickResolveModal />
        </div>
    );

    // Overview Section
    function OverviewSection() {
        const periodLabel = analyticsPeriod === 'all' ? 'All Time' : analyticsPeriod === '7d' ? 'Last 7 Days' : analyticsPeriod === '30d' ? 'Last 30 Days' : 'Last Year';
        
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><LayoutDashboard className="h-5 w-5 text-[#C40F5A]" /> Overview</h2>
                    <Select value={analyticsPeriod} onValueChange={(v) => setAnalyticsPeriod(v as typeof analyticsPeriod)}>
                        <SelectTrigger className="w-[140px] bg-black border-gray-800 text-white text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gray-800 text-white">
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {dataLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 bg-gray-900 rounded-xl" />)}
                    </div>
                ) : (
                    <>
                        <p className="text-gray-500 text-sm text-center">{periodLabel}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard icon={Users} label="New Users" value={analyticsData.usersInPeriod.length} sub={`Total: ${users.length}`} color="text-[#C40F5A]" />
                            <StatCard icon={FileText} label="New Quotes" value={analyticsData.quotesInPeriod.length} sub={`Total: ${quotes.length}`} color="text-[#C40F5A]" />
                            <StatCard icon={Star} label="New Reviews" value={analyticsData.reviewsInPeriod.length} sub={`Total: ${reviews.length}`} color="text-yellow-400" />
                            <StatCard icon={TriangleAlert} label="New Disputes" value={analyticsData.disputesInPeriod.length} sub={`Open: ${analyticsData.openDisputes}`} color="text-red-400" />
                            <StatCard icon={IndianRupee} label="Revenue" value={`₹${analyticsData.totalRevenue.toFixed(0)}`} sub={`${analyticsData.completedQuotes.length} completed`} color="text-green-400" />
                            <StatCard icon={CheckSquare} label="Conversion" value={`${analyticsData.conversionRate.toFixed(1)}%`} sub="Quotes to completed" color="text-blue-400" />
                            <StatCard icon={Star} label="Avg Rating" value={analyticsData.avgRating?.toFixed(1) || 'N/A'} sub={`${analyticsData.reviewsInPeriod.length} reviews`} color="text-yellow-400" />
                            {walletStats && <StatCard icon={Wallet} label="Wallet Balance" value={`₹${walletStats.totalBalance}`} sub={`${walletStats.totalWallets} wallets`} color="text-purple-400" />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-black border border-gray-800 rounded-xl p-4 h-64">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Quote Status</h3>
                                {analyticsData.quotesInPeriod.length > 0 ? (
                                    <Doughnut data={quoteStatusChart} options={chartOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-gray-600">No data</div>
                                )}
                            </div>
                            {walletStats && (
                                <div className="bg-black border border-gray-800 rounded-xl p-4">
                                    <h3 className="text-sm font-medium text-gray-400 mb-3">Withdrawals</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between"><span className="text-gray-400">Pending</span><span className="text-yellow-400 font-semibold">{walletStats.pendingWithdrawals}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">Processing</span><span className="text-blue-400 font-semibold">{walletStats.processingWithdrawals}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">Completed</span><span className="text-green-400 font-semibold">{walletStats.completedWithdrawals.count}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">Total Paid</span><span className="text-green-400 font-semibold">₹{walletStats.completedWithdrawals.totalAmount}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Stat Card Component
    function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub: string; color: string }) {
        return (
            <div className="bg-black border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-xs text-gray-400">{label}</span>
                </div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500">{sub}</p>
            </div>
        );
    }

    // Users Section
    function UsersSection() {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-[#C40F5A]" /> Users ({users.length})</h2>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input placeholder="Search users..." value={userFilter} onChange={e => setUserFilter(e.target.value)}
                            className="bg-black border-gray-800 text-white pl-9 focus:border-[#C40F5A]" />
                    </div>
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                        <SelectTrigger className="w-[120px] bg-black border-gray-800 text-white">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gray-800 text-white">
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="artist">Artist</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {dataLoading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 bg-gray-900 rounded-xl" />)}</div>
                ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No users found</p>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {filteredUsers.map(u => (
                            <div key={u.id} onClick={() => setSelectedUser(u)}
                                className="flex items-center gap-3 bg-black border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors">
                                <Avatar className="h-10 w-10">
                                    {u.image && <AvatarImage src={u.image} />}
                                    <AvatarFallback className="bg-[#C40F5A] text-white text-sm">{getInitials(u.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{u.name || 'No name'}</p>
                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                </div>
                                <Badge variant="outline" className={`text-xs ${u.role === 'admin' ? 'border-purple-500 text-purple-400' : u.role === 'artist' ? 'border-blue-500 text-blue-400' : 'border-green-500 text-green-400'}`}>
                                    {u.role}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Quotes Section
    function QuotesSection() {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-[#C40F5A]" /> Quotes ({quotes.length})</h2>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input placeholder="Search quotes..." value={quoteFilter} onChange={e => setQuoteFilter(e.target.value)}
                            className="bg-black border-gray-800 text-white pl-9 focus:border-[#C40F5A]" />
                    </div>
                    <Select value={quoteStatusFilter} onValueChange={setQuoteStatusFilter}>
                        <SelectTrigger className="w-[130px] bg-black border-gray-800 text-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gray-800 text-white">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Booked">Booked</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {dataLoading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 bg-gray-900 rounded-xl" />)}</div>
                ) : filteredQuotes.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No quotes found</p>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {filteredQuotes.map((q, i) => (
                            <div key={q.id} onClick={() => setSelectedQuote(q)}
                                className="bg-black border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{q.productType}</p>
                                        <p className="text-xs text-gray-400">{q.artist?.name || 'No artist'} → {q.customer?.name || 'No customer'}</p>
                                        <p className="text-xs text-gray-500">{formatDate(q.serviceDate, 'PP')} • {q.serviceTime}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-semibold text-[#C40F5A]">₹{q.price}</p>
                                        <Badge variant="outline" className={`text-xs ${getStatusColor(q.status)}`}>{q.status}</Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Reviews Section
    function ReviewsSection() {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400" /> Reviews ({reviews.length})</h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input placeholder="Search reviews..." value={reviewFilter} onChange={e => setReviewFilter(e.target.value)}
                        className="bg-black border-gray-800 text-white pl-9 focus:border-[#C40F5A]" />
                </div>

                {dataLoading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 bg-gray-900 rounded-xl" />)}</div>
                ) : filteredReviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No reviews found</p>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {filteredReviews.map(r => (
                            <div key={r.id} onClick={() => setSelectedReview(r)}
                                className="bg-black border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                                            ))}
                                            <span className="text-xs text-gray-400 ml-1">({r.rating}/5)</span>
                                        </div>
                                        <p className="text-xs text-gray-400">{r.customer?.name || 'Customer'} → {r.artist?.name || 'Artist'}</p>
                                        {r.comment && <p className="text-xs text-gray-500 truncate mt-1">{r.comment}</p>}
                                    </div>
                                    <p className="text-xs text-gray-500 shrink-0">{formatDate(r.createdAt, 'PP')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Disputes Section
    function DisputesSection() {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><TriangleAlert className="h-5 w-5 text-red-400" /> Disputes ({disputes.length})</h2>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input placeholder="Search disputes..." value={disputeFilter} onChange={e => setDisputeFilter(e.target.value)}
                            className="bg-black border-gray-800 text-white pl-9 focus:border-[#C40F5A]" />
                    </div>
                    <Select value={disputeStatusFilter} onValueChange={setDisputeStatusFilter}>
                        <SelectTrigger className="w-[140px] bg-black border-gray-800 text-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gray-800 text-white">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {dataLoading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 bg-gray-900 rounded-xl" />)}</div>
                ) : filteredDisputes.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No disputes found</p>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {filteredDisputes.map(d => (
                            <div key={d.id} className="bg-black border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedDispute(d)}>
                                        <p className="font-medium truncate">{d.reason}</p>
                                        <p className="text-xs text-gray-400">{d.initiator?.name || 'Initiator'} vs {d.involved?.name || 'Involved'}</p>
                                        <p className="text-xs text-gray-500">{formatDate(d.createdAt, 'PP')}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <Badge variant="outline" className={`text-xs ${getStatusColor(d.status)}`}>{d.status}</Badge>
                                        {(d.status === 'Open' || d.status === 'Under Review') && (
                                            <Button size="sm" variant="outline" onClick={() => { setQuickResolveDispute(d); setQuickResolveNotes(d.resolution || ''); }}
                                                className="h-7 text-xs border-green-600 text-green-400 hover:bg-green-900/30">
                                                <Sparkles className="h-3 w-3 mr-1" /> Resolve
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Withdrawals Section
    function WithdrawalsSection() {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5 text-purple-400" /> Withdrawals ({withdrawals.length})</h2>
                </div>
                <Select value={withdrawalStatusFilter} onValueChange={setWithdrawalStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-black border-gray-800 text-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gray-800 text-white">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                </Select>

                {dataLoading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 bg-gray-900 rounded-xl" />)}</div>
                ) : filteredWithdrawals.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No withdrawals found</p>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {filteredWithdrawals.map(w => (
                            <div key={w.id} className="bg-black border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{w.wallet.user.name || 'User'}</p>
                                        <p className="text-xs text-gray-400">{w.wallet.user.email}</p>
                                        <p className="text-xs text-gray-500">{w.bankAccount.bankName} • ****{w.bankAccount.accountNumber.slice(-4)}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-semibold text-green-400">₹{w.netAmount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">Fee: ₹{w.fee.toFixed(2)}</p>
                                        <Badge variant="outline" className={`text-xs ${getStatusColor(w.status)}`}>{w.status}</Badge>
                                    </div>
                                </div>
                                {(w.status === 'Pending' || w.status === 'Processing') && (
                                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-800">
                                        {w.status === 'Pending' && (
                                            <Button size="sm" variant="outline" onClick={() => handleWithdrawalAction(w.id, 'approve')}
                                                disabled={actionLoading === `approve-${w.id}`}
                                                className="h-7 text-xs border-blue-600 text-blue-400 hover:bg-blue-900/30 flex-1">
                                                {actionLoading === `approve-${w.id}` ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Approve'}
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" onClick={() => handleWithdrawalAction(w.id, 'complete')}
                                            disabled={actionLoading === `complete-${w.id}`}
                                            className="h-7 text-xs border-green-600 text-green-400 hover:bg-green-900/30 flex-1">
                                            {actionLoading === `complete-${w.id}` ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Complete'}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleWithdrawalAction(w.id, 'fail', 'Manual rejection')}
                                            disabled={actionLoading === `fail-${w.id}`}
                                            className="h-7 text-xs border-red-600 text-red-400 hover:bg-red-900/30 flex-1">
                                            {actionLoading === `fail-${w.id}` ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Fail'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // User Modal
    function UserModal() {
        if (!selectedUser) return null;
        return (
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                <DialogContent className="bg-black border-gray-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#C40F5A]">User Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                {selectedUser.image && <AvatarImage src={selectedUser.image} />}
                                <AvatarFallback className="bg-[#C40F5A] text-white text-lg">{getInitials(selectedUser.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-lg">{selectedUser.name || 'No name'}</p>
                                <p className="text-sm text-gray-400">{selectedUser.email}</p>
                                <Badge variant="outline" className={`text-xs mt-1 ${selectedUser.role === 'admin' ? 'border-purple-500 text-purple-400' : selectedUser.role === 'artist' ? 'border-blue-500 text-blue-400' : 'border-green-500 text-green-400'}`}>
                                    {selectedUser.role}
                                </Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {selectedUser.phone && <div><p className="text-gray-500">Phone</p><p>{selectedUser.phone}</p></div>}
                            {selectedUser.city && <div><p className="text-gray-500">City</p><p>{selectedUser.city}</p></div>}
                            <div><p className="text-gray-500">Joined</p><p>{formatDate(selectedUser.createdAt, 'PP')}</p></div>
                            {selectedUser.averageRating && <div><p className="text-gray-500">Rating</p><p>{selectedUser.averageRating.toFixed(1)} ⭐</p></div>}
                        </div>
                        {selectedUser.bio && <div><p className="text-gray-500 text-sm">Bio</p><p className="text-sm">{selectedUser.bio}</p></div>}
                    </div>
                    <DialogFooter className="mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={actionLoading === `delete-user-${selectedUser.id}` || selectedUser.id === user?.id}>
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black border-gray-800 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-400">Delete User?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                        This will permanently delete {selectedUser.name || selectedUser.email} and all their data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete('user', selectedUser.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <DialogClose asChild>
                            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Quote Modal
    function QuoteModal() {
        if (!selectedQuote) return null;
        return (
            <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
                <DialogContent className="bg-black border-gray-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#C40F5A]">{selectedQuote.productType}</DialogTitle>
                        <DialogDescription className="text-gray-400">Quote ID: {selectedQuote.id}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Status</span>
                            <Badge variant="outline" className={getStatusColor(selectedQuote.status)}>{selectedQuote.status}</Badge>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-400">Price</span><span className="font-semibold text-[#C40F5A]">₹{selectedQuote.price}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Date</span><span>{formatDate(selectedQuote.serviceDate, 'PP')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Time</span><span>{selectedQuote.serviceTime}</span></div>
                        <div className="border-t border-gray-800 pt-3">
                            <p className="text-gray-400 mb-1">Artist</p>
                            <p>{selectedQuote.artist?.name || 'Not assigned'}</p>
                            {selectedQuote.artist && <p className="text-xs text-gray-500">{selectedQuote.artist.email}</p>}
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Customer</p>
                            <p>{selectedQuote.customer?.name || 'Unknown'}</p>
                            {selectedQuote.customer && <p className="text-xs text-gray-500">{selectedQuote.customer.email}</p>}
                        </div>
                        {selectedQuote.details && (
                            <div className="border-t border-gray-800 pt-3">
                                <p className="text-gray-400 mb-1">Details</p>
                                <p className="text-xs bg-gray-900 p-2 rounded" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedQuote.details) }} />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={actionLoading === `delete-quote-${selectedQuote.id}`}>
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black border-gray-800 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-400">Delete Quote?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">This will permanently delete this quote and related data.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete('quote', selectedQuote.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <DialogClose asChild>
                            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Review Modal
    function ReviewModal() {
        if (!selectedReview) return null;
        return (
            <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
                <DialogContent className="bg-black border-gray-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-yellow-400 flex items-center gap-2">
                            <Star className="h-5 w-5" /> Review Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-5 w-5 ${i < selectedReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                            ))}
                            <span className="ml-2 text-lg font-semibold">{selectedReview.rating}/5</span>
                        </div>
                        <div className="border-t border-gray-800 pt-3">
                            <p className="text-gray-400 mb-1">From Customer</p>
                            <p>{selectedReview.customer?.name || 'Unknown'}</p>
                            {selectedReview.customer && <p className="text-xs text-gray-500">{selectedReview.customer.email}</p>}
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">To Artist</p>
                            <p>{selectedReview.artist?.name || 'Unknown'}</p>
                            {selectedReview.artist && <p className="text-xs text-gray-500">{selectedReview.artist.email}</p>}
                        </div>
                        {selectedReview.comment && (
                            <div className="border-t border-gray-800 pt-3">
                                <p className="text-gray-400 mb-1">Comment</p>
                                <p className="bg-gray-900 p-2 rounded">{selectedReview.comment}</p>
                            </div>
                        )}
                        <p className="text-xs text-gray-500">Created: {formatDate(selectedReview.createdAt, 'PPp')}</p>
                    </div>
                    <DialogFooter className="mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={actionLoading === `delete-review-${selectedReview.id}`}>
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black border-gray-800 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-400">Delete Review?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">This will permanently delete this review.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete('review', selectedReview.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <DialogClose asChild>
                            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Dispute Modal
    function DisputeModal() {
        if (!selectedDispute) return null;
        return (
            <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
                <DialogContent className="bg-black border-gray-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <TriangleAlert className="h-5 w-5" /> Dispute Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{selectedDispute.reason}</span>
                            <Badge variant="outline" className={getStatusColor(selectedDispute.status)}>{selectedDispute.status}</Badge>
                        </div>
                        <div className="border-t border-gray-800 pt-3">
                            <p className="text-gray-400 mb-1">Initiator</p>
                            <p>{selectedDispute.initiator?.name || 'Unknown'}</p>
                            {selectedDispute.initiator && <p className="text-xs text-gray-500">{selectedDispute.initiator.email} ({selectedDispute.initiator.role})</p>}
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Involved Party</p>
                            <p>{selectedDispute.involved?.name || 'Unknown'}</p>
                            {selectedDispute.involved && <p className="text-xs text-gray-500">{selectedDispute.involved.email} ({selectedDispute.involved.role})</p>}
                        </div>
                        {selectedDispute.details && (
                            <div className="border-t border-gray-800 pt-3">
                                <p className="text-gray-400 mb-1">Details</p>
                                <p className="bg-gray-900 p-2 rounded">{selectedDispute.details}</p>
                            </div>
                        )}
                        {selectedDispute.resolution && (
                            <div className="border-t border-gray-800 pt-3">
                                <p className="text-gray-400 mb-1">Resolution</p>
                                <p className="bg-green-900/20 p-2 rounded border border-green-800">{selectedDispute.resolution}</p>
                            </div>
                        )}
                        <p className="text-xs text-gray-500">Created: {formatDate(selectedDispute.createdAt, 'PPp')}</p>
                    </div>
                    <DialogFooter className="mt-4">
                        {(selectedDispute.status === 'Open' || selectedDispute.status === 'Under Review') && (
                            <Button size="sm" variant="outline" onClick={() => { setQuickResolveDispute(selectedDispute); setQuickResolveNotes(selectedDispute.resolution || ''); setSelectedDispute(null); }}
                                className="border-green-600 text-green-400 hover:bg-green-900/30">
                                <Sparkles className="h-4 w-4 mr-1" /> Resolve
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={actionLoading === `delete-dispute-${selectedDispute.id}`}>
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black border-gray-800 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-400">Delete Dispute?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">This will permanently delete this dispute.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete('dispute', selectedDispute.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <DialogClose asChild>
                            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Quick Resolve Modal
    function QuickResolveModal() {
        if (!quickResolveDispute) return null;
        return (
            <Dialog open={!!quickResolveDispute} onOpenChange={() => { setQuickResolveDispute(null); setQuickResolveNotes(''); }}>
                <DialogContent className="bg-black border-gray-800 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-green-400 flex items-center gap-2">
                            <Sparkles className="h-5 w-5" /> Resolve Dispute
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">{quickResolveDispute.reason}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-gray-400">Resolution Notes</Label>
                            <Textarea value={quickResolveNotes} onChange={e => setQuickResolveNotes(e.target.value)}
                                placeholder="Enter resolution details..."
                                className="bg-gray-900 border-gray-800 text-white mt-1 min-h-[100px]" />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => { setQuickResolveDispute(null); setQuickResolveNotes(''); }}
                            className="border-gray-700 text-white hover:bg-gray-800">Cancel</Button>
                        <Button onClick={() => handleResolveDispute(quickResolveDispute.id, quickResolveNotes)}
                            disabled={actionLoading === `resolve-${quickResolveDispute.id}`}
                            className="bg-green-600 hover:bg-green-700 text-white">
                            {actionLoading === `resolve-${quickResolveDispute.id}` ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
                            Resolve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div></div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}
