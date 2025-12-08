"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User as AuthUser, API_BASE_URL } from '@/types/user';
import { useAuth } from '@/lib/auth-context';

import {
  FileText,
  CheckCircle,
  Clock,
  IndianRupee,
  CalendarDays,
  Clock4,
  Package,
  ArrowLeft,
  Paintbrush,
  CheckSquare,
  UserCircle2,
  AlertCircle,
  CircleX,
  Star,
  Edit,
  Trash2,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  format,
  parseISO,
  isValid as dateFnsIsValid,
  startOfDay,
  isEqual,
  isBefore
} from "date-fns";
import { toast as sonnerToast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FrontendReview {
    id: string;
    rating: number;
    comment: string | null;
}

interface QuotePageData {
  id: string;
  artistId: string;
  artistName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  // Customer profile attributes (from User relation)
  customerSex?: string | null;
  customerAge?: number | null;
  customerColor?: string | null;
  customerEthnicity?: string | null;
  customerHeight?: number | null;
  customerWeight?: number | null;
  customerOther?: string | null;
  // Quote-specific client info (manually entered by artist)
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientGender?: string | null;
  clientDob?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  // Location & Venue
  venueType?: string | null;
  venueAddress?: string | null;
  venueAddress2?: string | null;
  venueCity?: string | null;
  venueState?: string | null;
  venuePincode?: string | null;
  // Services
  makeupType?: string | null;
  numberOfLooks?: number | null;
  packageType?: string | null;
  extraAddons?: boolean | null;
  serviceNotes?: string | null;
  // Payment
  paymentType?: string | null;
  advanceAmount?: string | null;
  // Core fields
  productType: string;
  details?: string | null;
  price: string;
  serviceDate: string;
  serviceTime: string;
  status: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled";
  review?: FrontendReview | null;
}

interface QuoteWithDisplayStatus extends QuotePageData {
  calculatedDisplayStatus: "Pending" | "Accepted" | "Booked" | "Completed" | "Cancelled" | "Date Reached" | "Overdue" | "Payment Pending";
}

type QuoteErrorType = 'not-found' | 'permission-denied' | 'auth-required' | 'generic-error' | null;

export default function IndividualQuotePage() {
  const router = useRouter();
  const params = useParams();

  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteWithDisplayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteErrorType, setQuoteErrorType] = useState<QuoteErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);

  const [isAccepting, setIsAccepting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  // Use auth context instead of fetching user
  const { user: authUser, csrfToken, isLoading: isUserLoading } = useAuth();
  const currentUser = authUser as AuthUser | null;

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const calculateDisplayStatus = (
    baseQuote: QuotePageData
  ): QuoteWithDisplayStatus['calculatedDisplayStatus'] => {
    let displayStatus: QuoteWithDisplayStatus['calculatedDisplayStatus'] = baseQuote.status as QuoteWithDisplayStatus['calculatedDisplayStatus'];

    if (baseQuote.status === "Accepted") {
      return "Payment Pending";
    }

    if (!["Completed", "Cancelled", "Accepted"].includes(baseQuote.status)) {
      try {
        const serviceDateObj = parseISO(baseQuote.serviceDate);
        if (dateFnsIsValid(serviceDateObj)) {
          const serviceDateNormalized = startOfDay(serviceDateObj);
          const todayNormalized = startOfDay(new Date());

          if (isEqual(serviceDateNormalized, todayNormalized)) {
            displayStatus = "Date Reached";
          } else if (isBefore(serviceDateNormalized, todayNormalized)) {
            displayStatus = "Overdue";
          }
        }
      } catch (e) {
        console.error("Error processing serviceDate for display status:", e);
      }
    }
    return displayStatus;
  };



  useEffect(() => {
    if (params && typeof params.id === 'string' && params.id) {
      setQuoteId(params.id);
    } else if (params && Array.isArray(params.id) && params.id.length > 0 && typeof params.id[0] === 'string') {
      setQuoteId(params.id[0]);
    } else {
      setQuoteErrorType("not-found");
      setErrorMessage("Quote ID not found in URL.");
      setLoading(false);
    }
  }, [params]);

  const fetchQuoteDetails = useCallback(async () => {
    if (!quoteId) return;

    setLoading(true);
    setQuoteErrorType(null);
    setErrorMessage(null);
    setActionError(null);
    setReviewActionError(null);
    setQuote(null);
    setIsEditingReview(false);
    setReviewRating(null);
    setReviewComment('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}`, {
         credentials: 'include',
      });

      if (!response.ok) {
          if (response.status === 401) {
               setQuoteErrorType("auth-required");
               setErrorMessage("You need to log in to view this quote.");
          } else if (response.status === 403) {
               setQuoteErrorType("permission-denied");
               setErrorMessage("Access denied: You do not have permission to view the full details of this quote. You may need to log in with the account associated with this quote (as the artist or customer).");
          } else if (response.status === 404) {
               setQuoteErrorType("not-found");
               setErrorMessage("The quote you are looking for could not be found.");
          } else {
              const errorData = await response.json().catch(() => ({ message: "Failed to parse error response." }));
              setQuoteErrorType("generic-error");
              setErrorMessage(errorData.message || `Failed to fetch quote: ${response.statusText}`);
          }
          setLoading(false);
          return;
      }

      const data: QuotePageData = await response.json();
      const displayStatus = calculateDisplayStatus(data);
      setQuote({ ...data, calculatedDisplayStatus: displayStatus });

      if (data.review) {
          setReviewRating(data.review.rating);
          setReviewComment(data.review.comment || '');
      }

    } catch (err: any) {
      console.error('Fetch quote error:', err);
      setQuoteErrorType("generic-error");
      setErrorMessage('An unexpected error occurred while loading quote details.');
    } finally {
       setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    if (quoteId && !isUserLoading) {
        fetchQuoteDetails();
    } else if (!quoteId && !isUserLoading) {
         setQuoteErrorType("not-found");
         setErrorMessage("Quote ID not found in URL.");
         setLoading(false);
    }
  }, [quoteId, isUserLoading, fetchQuoteDetails]);

  // Use csrfToken from auth context
  const getCsrfToken = (): string | null => {
      if (!csrfToken) {
          sonnerToast.error("Security Error", { description: "Security token not available. Please refresh." });
          return null;
      }
      return csrfToken;
  };

  const updateQuoteStateAfterAction = (updatedQuoteData: QuotePageData) => {
    const newDisplayStatus = calculateDisplayStatus(updatedQuoteData);
    setQuote({ ...updatedQuoteData, calculatedDisplayStatus: newDisplayStatus });
     if (updatedQuoteData.review) {
         setReviewRating(updatedQuoteData.review.rating);
         setReviewComment(updatedQuoteData.review.comment || '');
         setIsEditingReview(false);
     } else {
         setReviewRating(null);
         setReviewComment('');
         setIsEditingReview(false);
     }
  };

  const handleAcceptQuote = async () => {
    if (!currentUser || currentUser.role !== 'customer') {
        sonnerToast.error("Permission Denied", { description: "Only logged-in customers can accept quotes." });
        return;
    }
    if (!quote || quote.status !== 'Pending' || disableActions) return;

    setIsAccepting(true);
    setActionError(null);

    const token = getCsrfToken();
    if (!token) {
        setIsAccepting(false);
        return;
    }

    try {
      // Step 1: Accept quote and create Razorpay order
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quote.id}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
      });
      const responseData = await response.json();
      if (!response.ok) {
        const errorMsg = responseData.message || `Failed to accept quote: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      // Update quote state to "Accepted"
      updateQuoteStateAfterAction(responseData.quote);

      // Step 2: Open Razorpay payment modal
      const options = {
        key: responseData.key_id,
        amount: responseData.amount,
        currency: responseData.currency,
        name: 'Quote Payment',
        description: `Payment for ${quote.productType}`,
        order_id: responseData.razorpayOrderId,
        handler: async function (razorpayResponse: any) {
          // Step 3: Capture payment on backend
          try {
            const captureResponse = await fetch(`${API_BASE_URL}/api/quotes/${quote.id}/capture-payment`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
              body: JSON.stringify({
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }),
            });
            const captureData = await captureResponse.json();
            
            if (!captureResponse.ok) {
              throw new Error(captureData.message || 'Payment verification failed');
            }

            updateQuoteStateAfterAction(captureData.quote);
            sonnerToast.success("Payment Successful!", { description: "Quote has been booked." });
          } catch (err: any) {
            console.error('Payment capture error:', err);
            setActionError(err.message || 'Payment verification failed.');
            sonnerToast.error("Payment Verification Failed", { description: err.message || "Please contact support." });
          } finally {
            setIsAccepting(false);
          }
        },
        modal: {
          ondismiss: async function () {
            // Call backend to revert quote status when payment is cancelled
            try {
              const cancelResponse = await fetch(`${API_BASE_URL}/api/quotes/${quote.id}/cancel-payment`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
              });
              
              if (cancelResponse.ok) {
                const cancelData = await cancelResponse.json();
                updateQuoteStateAfterAction(cancelData.quote);
                sonnerToast.info("Payment Cancelled", { description: "Quote reverted to pending status. You can try again when ready." });
              } else {
                console.error('Failed to cancel payment on backend');
                sonnerToast.warning("Payment Cancelled", { description: "Payment was cancelled but there may be a status inconsistency. Please refresh the page." });
              }
            } catch (err) {
              console.error('Error cancelling payment:', err);
              sonnerToast.warning("Payment Cancelled", { description: "Payment was cancelled but there may be a status inconsistency. Please refresh the page." });
            }
            setIsAccepting(false);
          }
        },
        prefill: {
          name: currentUser.name || '',
          email: currentUser.email || '',
        },
        theme: {
          color: '#db2777'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (err: any) {
      console.error('Accept quote error:', err);
      setActionError(err.message || 'An error occurred while accepting the quote.');
      sonnerToast.error("Acceptance Failed", { description: err.message || "Please try again." });
      setIsAccepting(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!currentUser) {
         sonnerToast.error("Permission Denied", { description: "You must be logged in to mark quotes as completed." });
         return;
    }
    if (!quote || quote.status !== 'Booked' || disableActions) return;

    if (currentUser.id !== quote.artistId && (quote.customerId === null || currentUser.id !== quote.customerId)) {
        sonnerToast.error("Permission Denied", { description: "You are not authorized to mark this quote as completed." });
        return;
    }

    setIsCompleting(true);
    setActionError(null);

    const token = getCsrfToken();
     if (!token) {
         setIsCompleting(false);
         return;
     }

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quote.id}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
      });
      const responseData = await response.json();
      if (!response.ok) {
        const errorMsg = responseData.message || `Failed to mark as completed: ${response.statusText}`;
        throw new Error(errorMsg);
      }
      updateQuoteStateAfterAction(responseData.quote);
      sonnerToast.success("Quote Completed!", { description: "This service is now marked as complete." });
    } catch (err: any) {
      console.error('Complete quote error:', err);
      setActionError(err.message || 'An error occurred while marking the quote as completed.');
      sonnerToast.error("Completion Failed", { description: err.message || "Please try again." });
    } finally {
      setIsCompleting(false);
    }
  };

   const handleCancelQuote = async () => {
       if (!currentUser) {
            sonnerToast.error("Permission Denied", { description: "You must be logged in to cancel quotes." });
            return;
       }
       if (!quote || (quote.status !== 'Pending' && quote.status !== 'Accepted' && quote.status !== 'Booked') || disableActions) return;

       const canCancel = (currentUser.id === quote.artistId) || 
                        ((quote.status === 'Accepted' || quote.status === 'Booked') && quote.customerId !== null && currentUser.id === quote.customerId);
       if (!canCancel) {
            sonnerToast.error("Permission Denied", { description: "You are not authorized to cancel this quote." });
            return;
       }

       setIsCancelling(true);
       setActionError(null);

       const token = getCsrfToken();
        if (!token) {
            setIsCancelling(false);
            return;
        }

        try {
           const response = await fetch(`${API_BASE_URL}/api/quotes/${quote.id}/cancel`, {
               method: 'POST',
               credentials: 'include',
               headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
           });
           const responseData = await response.json();
           if (!response.ok) {
               const errorMsg = responseData.message || `Failed to cancel quote: ${response.statusText}`;
               throw new Error(errorMsg);
           }
           updateQuoteStateAfterAction(responseData.quote);
           sonnerToast.success("Quote Cancelled!", { description: "The quote has been cancelled." });
       } catch (err: any) {
           console.error('Cancel quote error:', err);
           setActionError(err.message || 'An error occurred while cancelling the quote.');
           sonnerToast.error("Cancellation Failed", { description: err.message || "Please try again." });
       } finally {
           setIsCancelling(false);
       }
   };

   const handleReviewSubmit = async () => {
       if (!currentUser || currentUser.role !== 'customer' || !quote || quote.status !== 'Completed' || disableActions) {
            sonnerToast.error("Action Not Allowed", { description: "You cannot submit a review at this time." });
            return;
       }
       if (quote.customerId !== currentUser.id) {
           sonnerToast.error("Permission Denied", { description: "You can only review quotes you accepted." });
           return;
       }

       if (reviewRating === null || reviewRating < 1 || reviewRating > 5) {
           setReviewActionError("Please select a rating before submitting or updating.");
           return;
       }

       setIsSubmittingReview(true);
       setReviewActionError(null);

       const token = getCsrfToken();
       if (!token) {
           setIsSubmittingReview(false);
           return;
       }

       const reviewData = {
            rating: reviewRating,
            comment: reviewComment,
       };

        const method = quote.review ? 'PUT' : 'POST';
        const url = `${API_BASE_URL}/api/quotes/${quote.id}/review`;

       try {
            const response = await fetch(url, {
               method: method,
               credentials: 'include',
               headers: { 'Content-Type': 'application/json', 'CSRF-Token': token },
               body: JSON.stringify(reviewData),
            });
            const responseData = await response.json();
            if (!response.ok) {
               const errorMsg = responseData.message || `Failed to ${method === 'POST' ? 'add' : 'update'} review: ${response.statusText}`;
               throw new Error(errorMsg);
            }
            updateQuoteStateAfterAction(responseData.quote);
            sonnerToast.success(`${method === 'POST' ? 'Review Added' : 'Review Updated'}`, { description: `Your review has been successfully ${method === 'POST' ? 'added' : 'updated'}.` });
       } catch (err: any) {
           console.error('Review submit error:', err);
           setReviewActionError(err.message || `An error occurred while ${method === 'POST' ? 'adding' : 'updating'} the review.`);
           sonnerToast.error(`${method === 'POST' ? 'Review Failed' : 'Update Failed'}`, { description: err.message || "Please try again." });
       } finally {
           setIsSubmittingReview(false);
       }
   };

    const handleReviewDelete = async () => {
        if (!currentUser || currentUser.role !== 'customer' || !quote || !quote.review || disableActions) {
             sonnerToast.error("Action Not Allowed", { description: "You cannot delete a review at this time." });
             return;
        }
        if (quote.customerId !== currentUser.id) {
            sonnerToast.error("Permission Denied", { description: "You can only delete reviews you wrote." });
            return;
        }

        setIsDeletingReview(true);
        setReviewActionError(null);

        const token = getCsrfToken();
        if (!token) {
            setIsDeletingReview(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/quotes/${quote.id}/review`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'CSRF-Token': token },
            });
            const responseData = await response.json();
            if (!response.ok) {
                const errorMsg = responseData.message || `Failed to delete review: ${response.statusText}`;
                throw new Error(errorMsg);
            }
            updateQuoteStateAfterAction(responseData.quote);
            sonnerToast.success("Review Deleted!", { description: "Your review has been removed." });

        } catch (err: any) {
            console.error('Review delete error:', err);
            setReviewActionError(err.message || 'An error occurred while deleting the review.');
             sonnerToast.error("Deletion Failed", { description: err.message || "Please try again." });
        } finally {
            setIsDeletingReview(false);
        }
    };

  const formatDateSafely = (dateString: string | null | undefined, dateFormat: string = "PPP") => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (dateFnsIsValid(date)) {
        return format(date, dateFormat);
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColorClasses = (status: QuoteWithDisplayStatus['calculatedDisplayStatus'] | undefined) => {
    switch (status) {
      case "Booked": return "bg-green-900/70 text-green-300 border-green-700/50";
      case "Accepted": 
      case "Payment Pending": return "bg-yellow-900/70 text-yellow-300 border-yellow-700/50";
      case "Pending": return "bg-blue-900/70 text-blue-300 border-blue-700/50";
      case "Completed": return "bg-purple-900/70 text-purple-300 border-purple-500";
      case "Cancelled": return "bg-neutral-700/70 text-neutral-400 border-neutral-600/50";
      case "Date Reached": return "bg-[#F5DE78]/20 text-[#F5DE78] border-[#F5DE78]/30";
      case "Overdue": return "bg-[#D00416]/20 text-[#D00416] border-[#D00416]/30";
      default: return "bg-[#3A3438]/70 text-[#A0A0A0] border-[#2A2428]";
    }
  };

   const canViewCustomerDetails = currentUser && quote && (
       currentUser.id === quote.artistId || (quote.customerId !== null && currentUser.id === quote.customerId)
   );

  const getDashboardLink = () => {
    if (currentUser?.role === 'artist') return '/artist';
    if (currentUser?.role === 'customer') return '/customer';
    return '/';
  };

  const isAcceptingCustomer = currentUser && currentUser.role === 'customer' && quote && quote.customerId === currentUser.id;

  const disableActions = isAccepting || isCompleting || isCancelling || isSubmittingReview || isDeletingReview;

  const canReview = isAcceptingCustomer && quote?.status === 'Completed';
  const hasReview = !!quote?.review;

  if (loading || isUserLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
        <div className="w-full max-w-md">
            <Skeleton className="h-10 w-3/4 mb-6 bg-[#2A2428]" />
            <Skeleton className="h-6 w-1/2 mb-3 bg-[#2A2428]" />
            <Skeleton className="h-4 w-full mb-2 bg-[#2A2428]" />
            <Skeleton className="h-4 w-full mb-2 bg-[#2A2428]" />
            <Skeleton className="h-4 w-3/4 mb-6 bg-[#2A2428]" />
            <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C40F5A]"></div>
            </div>
            <Skeleton className="h-10 w-full mb-3 bg-[#2A2428]" />
            <Skeleton className="h-10 w-full bg-[#2A2428]" />
        </div>
        <p className="mt-4 text-[#A0A0A0]">Loading Quote Details...</p>
      </div>
    );
  }

  if (quoteErrorType) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6 text-center">
        <Card className="w-full max-w-md bg-[#1a1a1a] border-gray-800 p-6">
            {quoteErrorType === 'not-found' && <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
            {(quoteErrorType === 'permission-denied' || quoteErrorType === 'auth-required' || quoteErrorType === 'generic-error') && <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />}
            <CardTitle className={`text-2xl mb-2 ${quoteErrorType === 'not-found' ? 'text-white' : 'text-red-500'}`}>
                {quoteErrorType === 'not-found' && 'Quote Not Found'}
                {quoteErrorType === 'permission-denied' && 'Access Denied'}
                {quoteErrorType === 'auth-required' && 'Authentication Required'}
                {quoteErrorType === 'generic-error' && 'Error Loading Quote'}
            </CardTitle>
             <CardDescription className={`mb-6 ${quoteErrorType === 'not-found' ? 'text-gray-400' : 'text-red-400'}`}>
                 {errorMessage}
             </CardDescription>
            {quoteErrorType === 'auth-required' && (
                 <Button onClick={() => router.push('/login')} className="w-full mt-3 bg-[#C40F5A] hover:bg-[#EE2377] text-white transition-colors">
                    Login
                 </Button>
             )}
             {quoteErrorType !== 'auth-required' && (
                 <Button onClick={() => router.back()} className="w-full bg-[#C40F5A] hover:bg-[#EE2377] text-white transition-colors">
                     <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                 </Button>
             )}
             {currentUser && (
                 <Button onClick={() => router.push(getDashboardLink())} className="w-full mt-3 bg-[#C40F5A]/80 hover:bg-[#C40F5A] text-white transition-colors">
                    Go to My Dashboard
                 </Button>
             )}
             {quoteErrorType === 'auth-required' && !currentUser && (
                  <Button onClick={() => router.push('/signup')} className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                      Sign Up
                  </Button>
             )}
        </Card>
      </div>
     );
  }

  if (!quote) {
       console.error("Quote state is null but no errorType is set.");
       return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6 text-center">
            <Card className="w-full max-w-md bg-[#1a1a1a] text-gray-400 border-gray-800 p-6">
                <FileText className="h-12 w-12 text-[#A0A0A0] mx-auto mb-4" />
                <CardTitle className="text-2xl mb-2 text-[#E5E5E5]">Quote Unavailable</CardTitle>
                <CardDescription className="text-[#A0A0A0] mb-6">The quote details could not be loaded.</CardDescription>
                 <Button onClick={() => router.push(getDashboardLink())} className="w-full bg-[#C40F5A] hover:bg-[#A00D4A] text-white transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
                </Button>
            </Card>
        </div>
      );
  }

  const displayStatusString = quote.calculatedDisplayStatus;
  const canCancel = currentUser && quote && (
      currentUser.id === quote.artistId
      || (quote.customerId !== null && currentUser.id === quote.customerId && (quote.status === 'Accepted' || quote.status === 'Booked'))
  );
  const showCancelButton = (quote.status === 'Pending' || quote.status === 'Accepted' || quote.status === 'Booked') && canCancel;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg mx-auto bg-[#1a1a1a] text-white border-gray-800 shadow-xl">
        <CardHeader className="px-4 py-4 sm:px-6 sm:py-5 border-b border-[#2A2428]">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2.5 text-[#C40F5A]">
                <FileText className="h-6 w-6" /> Quote Details
            </CardTitle>
            <span title={`Status: ${displayStatusString}`}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColorClasses(displayStatusString)}`}
            >
                {(displayStatusString === "Booked" || displayStatusString === "Date Reached") && <CheckCircle className="inline h-3.5 w-3.5 mr-1.5" />}
                {(displayStatusString === "Accepted" || displayStatusString === "Payment Pending") && <Clock className="inline h-3.5 w-3.5 mr-1.5" />}
                {displayStatusString === "Pending" && <Clock className="inline h-3.5 w-3.5 mr-1.5" />}
                {displayStatusString === "Completed" && <CheckSquare className="inline h-3.5 w-3.5 mr-1.5" />}
                {displayStatusString === "Cancelled" && <CircleX className="inline h-3.5 w-3.5 mr-1.5" />}
                {displayStatusString === "Overdue" && <AlertCircle className="inline h-3.5 w-3.5 mr-1.5" />}
                {displayStatusString}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-[#F46CA4]">
              <Package className="h-5 w-5 text-[#C40F5A] flex-shrink-0" />
              <span className="break-all">{quote.productType}</span>
          </div>

          {quote.artistName && (
              <div className="flex items-center gap-2 text-[#E5E5E5] text-sm">
                  <Paintbrush className="h-4 w-4 text-[#A0A0A0] flex-shrink-0" />
                  Artist: <strong className="text-white">{quote.artistName}</strong>
              </div>
          )}
           {canViewCustomerDetails && quote.customerName && (
               <div className="flex items-center gap-2 text-[#E5E5E5] text-sm">
                   <UserCircle2 className="h-4 w-4 text-[#A0A0A0] flex-shrink-0" />
                   For Customer: <strong className="text-white">{quote.customerName}</strong>
               </div>
           )}

           <Separator className="bg-[#2A2428]" />

          <div className="space-y-4 text-sm">
             {/* Client Info Section - from quote (manually entered by artist) */}
             {canViewCustomerDetails && (quote.clientFirstName || quote.clientLastName || quote.clientPhone || quote.clientEmail || quote.clientGender) && (
               <div className="bg-[#2a2a2a] rounded-lg p-3">
                 <strong className="text-[#C40F5A] block mb-2">Client Info</strong>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[#A0A0A0]">
                   {(quote.clientFirstName || quote.clientLastName) && (
                     <div><strong className="text-gray-400">Name:</strong> <span className="text-white">{[quote.clientFirstName, quote.clientLastName].filter(Boolean).join(' ')}</span></div>
                   )}
                   {quote.clientGender && <div><strong className="text-gray-400">Gender:</strong> <span className="text-white">{quote.clientGender}</span></div>}
                   {quote.clientDob && <div><strong className="text-gray-400">DOB:</strong> <span className="text-white">{formatDateSafely(quote.clientDob, 'dd MMM yyyy')}</span></div>}
                   {quote.clientPhone && <div><strong className="text-gray-400">Phone:</strong> <span className="text-white">{quote.clientPhone}</span></div>}
                   {quote.clientEmail && <div className="col-span-1 sm:col-span-2"><strong className="text-gray-400">Email:</strong> <span className="text-white">{quote.clientEmail}</span></div>}
                 </div>
               </div>
             )}

             {/* Customer Profile Attributes - from User (synced when customer accepts) */}
             {canViewCustomerDetails && quote.customerId && (quote.customerAge || quote.customerHeight || quote.customerWeight || quote.customerEthnicity || quote.customerColor) && (
               <div className="bg-[#2a2a2a] rounded-lg p-3">
                 <strong className="text-[#C40F5A] block mb-2">Customer Profile</strong>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[#A0A0A0]">
                   {quote.customerAge !== null && quote.customerAge !== undefined && <div><strong className="text-gray-400">Age:</strong> <span className="text-white">{quote.customerAge}</span></div>}
                   {quote.customerHeight !== null && quote.customerHeight !== undefined && <div><strong className="text-gray-400">Height:</strong> <span className="text-white">{quote.customerHeight} cm</span></div>}
                   {quote.customerWeight !== null && quote.customerWeight !== undefined && <div><strong className="text-gray-400">Weight:</strong> <span className="text-white">{quote.customerWeight} kg</span></div>}
                   {quote.customerColor && <div><strong className="text-gray-400">Skin Tone:</strong> <span className="text-white">{quote.customerColor}</span></div>}
                   {quote.customerEthnicity && <div><strong className="text-gray-400">Ethnicity:</strong> <span className="text-white">{quote.customerEthnicity}</span></div>}
                   {quote.customerOther && <div className="col-span-2 sm:col-span-3"><strong className="text-gray-400">Other:</strong> <span className="text-white">{quote.customerOther}</span></div>}
                 </div>
               </div>
             )}

             {/* Location & Venue */}
             {(quote.venueType || quote.venueAddress || quote.venueCity) && (
               <div className="bg-[#2a2a2a] rounded-lg p-3">
                 <strong className="text-[#C40F5A] block mb-2">Location & Venue</strong>
                 <div className="space-y-1 text-[#A0A0A0]">
                   {quote.venueType && <div><strong className="text-gray-400">Venue:</strong> <span className="text-white">{quote.venueType}</span></div>}
                   {quote.venueAddress && <div><strong className="text-gray-400">Address:</strong> <span className="text-white">{quote.venueAddress}{quote.venueAddress2 ? `, ${quote.venueAddress2}` : ''}</span></div>}
                   {(quote.venueCity || quote.venueState || quote.venuePincode) && (
                     <div><strong className="text-gray-400">Location:</strong> <span className="text-white">{[quote.venueCity, quote.venueState, quote.venuePincode].filter(Boolean).join(', ')}</span></div>
                   )}
                 </div>
               </div>
             )}

             {/* Services */}
             {(quote.makeupType || quote.packageType || quote.numberOfLooks || quote.serviceNotes) && (
               <div className="bg-[#2a2a2a] rounded-lg p-3">
                 <strong className="text-[#C40F5A] block mb-2">Services</strong>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[#A0A0A0]">
                   {quote.makeupType && <div><strong className="text-gray-400">Makeup:</strong> <span className="text-white">{quote.makeupType}</span></div>}
                   {quote.packageType && <div><strong className="text-gray-400">Package:</strong> <span className="text-white">{quote.packageType}</span></div>}
                   {quote.numberOfLooks && <div><strong className="text-gray-400">Looks:</strong> <span className="text-white">{quote.numberOfLooks}</span></div>}
                   {quote.extraAddons && <div><strong className="text-gray-400">Add-ons:</strong> <span className="text-white">Yes</span></div>}
                   {quote.serviceNotes && <div className="col-span-1 sm:col-span-2"><strong className="text-gray-400">Notes:</strong> <span className="text-white">{quote.serviceNotes}</span></div>}
                 </div>
               </div>
             )}

             {/* Legacy details field */}
             {quote.details && (
               <div>
                 <strong className="text-[#E5E5E5] block mb-0.5">Details:</strong>
                 <p className="text-[#A0A0A0] whitespace-pre-wrap">{quote.details}</p>
               </div>
             )}

             {/* Schedule & Payment */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1">
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-[#A0A0A0] flex-shrink-0" />
                    <strong className="text-[#E5E5E5]">Date:</strong> <span className="text-white">{formatDateSafely(quote.serviceDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock4 className="h-4 w-4 text-[#A0A0A0] flex-shrink-0" />
                    <strong className="text-[#E5E5E5]">Time:</strong> <span className="text-white">{quote.serviceTime || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-[#A0A0A0] flex-shrink-0" />
                    <strong className="text-[#E5E5E5]">Total:</strong> <span className="text-white font-semibold">₹{quote.price}</span>
                </div>
                {quote.advanceAmount && (
                  <div className="flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-[#A0A0A0] flex-shrink-0" />
                    <strong className="text-[#E5E5E5]">Advance:</strong> <span className="text-white">₹{quote.advanceAmount}</span>
                  </div>
                )}
                {quote.paymentType && (
                  <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                    <strong className="text-[#E5E5E5]">Payment Type:</strong> <span className="text-white">{quote.paymentType}</span>
                  </div>
                )}
             </div>
          </div>

           {actionError && (
                <Alert variant="destructive" className="mb-4 bg-[#D00416]/20 text-[#D00416] border-[#D00416]/30">
                    <AlertCircle className="h-4 w-4 text-[#D00416]" />
                    <AlertTitle className="font-semibold text-[#D00416]">Action Failed</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
           )}

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-5 pt-4 border-t border-[#2A2428]">
              {quote.status === "Pending" && currentUser?.role === 'customer' && (
                <Button
                    onClick={handleAcceptQuote}
                    className="w-full sm:flex-1 bg-[#C40F5A] hover:bg-[#A00D4A] text-white h-11 text-base transition-colors"
                    disabled={disableActions}
                >
                    {isAccepting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> : <CheckCircle className="mr-2 h-5 w-5" />}
                    {isAccepting ? 'Processing...' : 'Accept & Pay'}
                </Button>
              )}

              {quote.status === 'Booked' && currentUser && (currentUser.id === quote.artistId || (quote.customerId !== null && currentUser.id === quote.customerId)) && (
                   <Button
                      variant="secondary"
                      onClick={handleMarkAsCompleted}
                      disabled={disableActions}
                      className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 text-base border-blue-500 transition-colors"
                   >
                       {isCompleting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> : <CheckSquare className="mr-2 h-5 w-5" />}
                       {isCompleting ? 'Completing...' : 'Mark as Completed'}
                   </Button>
              )}

              {showCancelButton && (
                   <Button
                      variant="destructive"
                      onClick={handleCancelQuote}
                      disabled={disableActions}
                      className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white h-11 text-base border-red-500 transition-colors"
                   >
                       {isCancelling ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> : <CircleX className="mr-2 h-5 w-5" />}
                       {isCancelling ? 'Cancelling...' : 'Cancel Quote'}
                   </Button>
              )}

               {(!showCancelButton &&
                   (quote.status === "Completed" || quote.status === "Cancelled" ||
                    (quote.status === "Pending" && (!currentUser || currentUser.role !== 'customer')) ||
                    (quote.status === "Accepted" && currentUser && currentUser.id !== quote.artistId && (quote.customerId === null || currentUser.id !== quote.customerId)) ||
                    (quote.status === "Booked" && currentUser && currentUser.id !== quote.artistId && (quote.customerId === null || currentUser.id !== quote.customerId))))
               && (
                  <Button disabled className={`w-full sm:flex-1 h-11 text-base border ${getStatusColorClasses(displayStatusString)}`} variant="outline">
                      {(displayStatusString === 'Completed' || displayStatusString === 'Booked' || displayStatusString === "Date Reached") && <CheckSquare className="mr-2 h-5 w-5" />}
                      {displayStatusString === 'Cancelled' && <CircleX className="mr-2 h-5 w-5" />}
                      {(displayStatusString === 'Pending' || displayStatusString === 'Payment Pending' || displayStatusString === 'Accepted') && <Clock className="mr-2 h-5 w-5" />}
                      {displayStatusString === 'Overdue' && <AlertCircle className="mr-2 h-5 w-5" />}
                      Status: {displayStatusString}
                  </Button>
              )}
            </div>
        </CardContent>

        {canReview && (
             <>
                 <Separator className="bg-[#2a2a2a]" />
                 <CardContent className="px-4 py-4 sm:p-6 space-y-4">
                     <CardTitle className="text-lg flex items-center gap-2 text-yellow-500">
                         <Star className="h-5 w-5" /> Your Review
                     </CardTitle>

                     {reviewActionError && (
                         <Alert variant="destructive" className="bg-red-900/30 text-red-300 border-red-700/50">
                             <AlertCircle className="h-4 w-4 text-red-400" />
                             <AlertTitle className="font-semibold text-red-400">Review Action Failed</AlertTitle>
                             <AlertDescription>{reviewActionError}</AlertDescription>
                         </Alert>
                     )}

                     {hasReview && !isEditingReview ? (
                         <>
                             <div className="space-y-3">
                                  <div className="flex items-center gap-1 text-yellow-400">
                                      <strong className="text-gray-300">Rating:</strong>
                                       {[...Array(5)].map((_, i) => (
                                           <Star
                                               key={i}
                                               className={`h-5 w-5 ${i < (quote.review?.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`}
                                           />
                                       ))}
                                       <span className="text-gray-300 ml-2">({quote.review?.rating}/5)</span>
                                  </div>
                                  {quote.review?.comment && (
                                      <div>
                                           <strong className="text-gray-300 block mb-0.5">Comment:</strong>
                                           <p className="text-gray-400 whitespace-pre-wrap">{quote.review.comment}</p>
                                      </div>
                                  )}
                                   {!quote.review?.comment && (
                                       <p className="text-gray-500 italic text-sm">No comment provided.</p>
                                   )}
                             </div>
                              <div className="flex gap-3 mt-4 justify-end">
                                  <Button
                                       variant="secondary"
                                       size="sm"
                                       onClick={() => setIsEditingReview(true)}
                                       disabled={disableActions}
                                       className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 transition-colors"
                                  >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                  </Button>
                                   <Button
                                       variant="destructive"
                                       size="sm"
                                       onClick={handleReviewDelete}
                                       disabled={disableActions}
                                        className="bg-red-600 hover:bg-red-700 text-white border-red-500 transition-colors"
                                  >
                                      {isDeletingReview ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> : <Trash2 className="mr-2 h-4 w-4" />}
                                      {isDeletingReview ? 'Deleting...' : 'Delete'}
                                  </Button>
                              </div>
                         </>
                     ) : (
                         <>
                             <div className="space-y-3">
                                  <div>
                                       <Label htmlFor="rating" className="text-gray-300 block mb-1">Rating:</Label>
                                        <RadioGroup
                                             id="rating"
                                             value={reviewRating?.toString() ?? undefined}
                                             onValueChange={(value) => setReviewRating(parseInt(value, 10))}
                                             className="flex gap-4"
                                             disabled={disableActions}
                                         >
                                             {[1, 2, 3, 4, 5].map((value) => (
                                                 <div key={value} className="flex items-center space-x-2 cursor-pointer">
                                                     <RadioGroupItem value={value.toString()} id={`rating-${value}`} className="border-gray-500 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed" />
                                                     <Label htmlFor={`rating-${value}`} className="text-gray-400 text-sm cursor-pointer">{value}</Label>
                                                 </div>
                                             ))}
                                         </RadioGroup>
                                  </div>
                                  <div>
                                      <Label htmlFor="comment" className="text-gray-300 block mb-1">Comment (Optional):</Label>
                                      <Textarea
                                          id="comment"
                                          value={reviewComment}
                                          onChange={(e) => setReviewComment(e.target.value)}
                                          placeholder={hasReview ? "Update your comment..." : "Add a comment about your experience..."}
                                          rows={3}
                                          disabled={disableActions}
                                          className="bg-[#2a2a2a] text-gray-100 border-[#3a3a3a] focus-visible:ring-2 focus-visible:ring-[#C40F5A] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                  </div>
                             </div>
                              <div className="flex gap-3 justify-end mt-4">
                                   {hasReview && isEditingReview && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setReviewRating(quote.review?.rating ?? null);
                                                setReviewComment(quote.review?.comment || '');
                                                setIsEditingReview(false);
                                                setReviewActionError(null);
                                            }}
                                             disabled={isSubmittingReview || isDeletingReview}
                                             className="border-gray-500 text-gray-300 hover:bg-gray-700/30 transition-colors"
                                        >
                                            Cancel
                                        </Button>
                                   )}
                                  <Button
                                       onClick={handleReviewSubmit}
                                       disabled={disableActions || reviewRating === null || reviewRating < 1 || reviewRating > 5}
                                       className={`h-10 text-sm ${hasReview ? 'bg-green-600 hover:bg-green-700 border-green-500' : 'bg-[#C40F5A] hover:bg-[#EE2377] border-[#C40F5A]'} text-white transition-colors`}
                                  >
                                      {isSubmittingReview ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> : <Send className="mr-2 h-4 w-4" />}
                                      {isSubmittingReview ? (hasReview ? 'Updating...' : 'Submitting...') : (hasReview ? 'Update Review' : 'Submit Review')}
                                  </Button>
                              </div>
                         </>
                     )}

                 </CardContent>
             </>
        )}

        <CardFooter className="px-4 py-3 sm:p-4 border-t border-[#2a2a2a]">
           <Button variant="ghost" className="w-full bg-transparent text-[#C40F5A] hover:text-[#EE2377] hover:bg-[#C40F5A]/10 transition-colors" asChild>
               <Link href={getDashboardLink()}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}