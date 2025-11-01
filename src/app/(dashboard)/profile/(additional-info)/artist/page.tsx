"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User as AuthUser, API_BASE_URL } from '@/types/user';
import { validateProfileCompletion, getMissingFieldNames } from '@/lib/profileValidation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Terminal,
    User as UserIcon,
    Edit3,
    Palette,
    Link as LinkIcon,
    BookOpen,
    Star,
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
    Clock,
    FileText,
    Bell,
    LogOut,
    Settings,
    LayoutDashboard,
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast as sonnerToast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

import {
  format,
  parseISO,
  isValid as dateFnsIsValid,
  startOfDay,
  isEqual,
  isBefore,
} from "date-fns";


interface ArtistProfileData extends AuthUser {
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
    createdAt: string;
    updatedAt: string;
}

interface FrontendReview {
    id: string;
    rating: number;
    comment: string | null;
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
  status: "Pending" | "Accepted" | "Completed" | "Cancelled";
  review?: FrontendReview | null;
}

interface FrontendQuote extends ApiQuoteData {
  displayStatus: "Pending" | "Accepted" | "Completed" | "Cancelled" | "Date Reached" | "Overdue";
  review?: FrontendReview | null;
}


const isProfileIncomplete = (user: ArtistProfileData | null): boolean => {
    if (!user) return true;
    const validation = validateProfileCompletion(user);
    return !validation.isComplete;
};


export default function ArtistProfilePage() {
    const [userData, setUserData] = useState<ArtistProfileData | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialError, setInitialError] = useState('');
    const [incompleteProfileMessage, setIncompleteProfileMessage] = useState<string | null>(null);

    // Artist-specific fields only
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');
    const [phone, setPhone] = useState('');

    const [bio, setBio] = useState('');
    const [specialties, setSpecialties] = useState('');

    const [bookingInfoInput, setBookingInfoInput] = useState('');
    const [servicesInput, setServicesInput] = useState('');
    const [availableLocationsInput, setAvailableLocationsInput] = useState('');

    const [artistQuotes, setArtistQuotes] = useState<FrontendQuote[]>([] as FrontendQuote[]);
    const [quotesError, setQuotesError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [csrfFetchAttempted, setCsrfFetchAttempted] = useState(false);

    const CURRENCY_SYMBOL = '₹';

    const router = useRouter();
    const pathname = usePathname();

    const populateFormStates = useCallback((data: ArtistProfileData | null) => {
        if (data) {
            setAddress(data.address ?? '');
            setCity(data.city ?? '');
            setState(data.state ?? '');
            setZipCode(data.zipCode ?? '');
            setCountry(data.country ?? '');
            setPhone(data.phone ?? '');

            setBio(data.bio ?? '');
            setSpecialties(data.specialties ?? '');

            setBookingInfoInput(Array.isArray(data.bookingInfo) ? data.bookingInfo.join(', ') : '');
            setServicesInput(Array.isArray(data.services) ? data.services.join(', ') : '');
            setAvailableLocationsInput(Array.isArray(data.availableLocations) ? data.availableLocations.join(', ') : '');
        } else {
             setAddress(''); setCity(''); setState(''); setZipCode(''); setCountry(''); setPhone('');
             setBio(''); setSpecialties('');
             setBookingInfoInput(''); setServicesInput(''); setAvailableLocationsInput('');
        }
    }, []);


    const calculateDisplayStatusForQuote = useCallback(
        (baseQuote: ApiQuoteData): FrontendQuote['displayStatus'] => {
          let displayStatus: FrontendQuote['displayStatus'] = baseQuote.status as FrontendQuote['displayStatus'];

          if (baseQuote.status === "Pending" || baseQuote.status === "Accepted") {
            try {
              const serviceDateObj = parseISO(baseQuote.serviceDate);
              if (dateFnsIsValid(serviceDateObj)) {
                const serviceDateNormalized = startOfDay(serviceDateObj);
                const todayNormalized = startOfDay(new Date());

                if (isEqual(serviceDateNormalized, todayNormalized)) {
                    if (baseQuote.status === "Pending") {
                        displayStatus = "Date Reached";
                    } else {
                         displayStatus = baseQuote.status;
                    }
                } else if (isBefore(serviceDateNormalized, todayNormalized)) {
                  displayStatus = "Overdue";
                }
              }
            } catch (e) {
              displayStatus = baseQuote.status as FrontendQuote['displayStatus'];
            }
          }
          return displayStatus;
        },
        []
      );


    useEffect(() => {
        const fetchUserData = async () => {
            setIsInitialLoading(true);
            setInitialError('');
            setActionError('');
            setSuccessMessage('');
            setIncompleteProfileMessage(null);
            setIsEditing(false);

            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: 'include',
                });

                if (!response.ok) {
                     if (response.status === 401 || response.status === 403) {
                         sonnerToast.error("Authentication Required", { description: "Please log in to access your profile." });
                         router.push('/login');
                         return;
                    }
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                    setUserData(null);
                    setInitialError(errorData.message || 'Failed to fetch your current information.');
                    sonnerToast.error("Fetch Error", { description: errorData.message || 'Failed to load profile data.' });
                    setIsInitialLoading(false);
                    return;
                }

                const data: { user: ArtistProfileData } = await response.json();

                if (data.user.role !== 'artist') {
                     const errorMessage = "Access denied. This page is for artists only.";
                     setUserData(null);
                     setInitialError(errorMessage);
                     sonnerToast.error("Access Denied", { description: errorMessage });
                     router.push(data.user.role === 'customer' ? '/customer' : '/');
                     setIsInitialLoading(false);
                     return;
                }

                setUserData(data.user);

                const needsEditing = isProfileIncomplete(data.user);
                setIsEditing(needsEditing);

                if (needsEditing) {
                    setIncompleteProfileMessage("Please complete your profile details below so customers can learn about your work.");
                } else {
                     setIncompleteProfileMessage(null);
                }

                populateFormStates(data.user);

                setInitialError('');
                setIsInitialLoading(false);

            } catch (err: any) {
                setUserData(null);
                setInitialError('Error fetching your information. Please try again.');
                sonnerToast.error("Network Error", { description: 'Error fetching profile data.' });
                setIsInitialLoading(false);
            }
        };

        fetchUserData();
    }, [router, populateFormStates]);


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
                  setCsrfToken(null);
                  return null;
             }
             const data = await response.json();
              if (!data.csrfToken) {
              }
              setCsrfToken(data.csrfToken || null);
              return data.csrfToken || null;
         } catch (error) {
             setCsrfToken(null);
             return null;
         }
     }, [csrfToken, csrfFetchAttempted]);


     useEffect(() => {
         fetchCsrfToken();
     }, [fetchCsrfToken]);


    useEffect(() => {
        if (userData && userData.role === 'artist') {
          const fetchArtistQuotes = async () => {
            setQuotesError(null);
            try {
              const response = await fetch(`${API_BASE_URL}/api/quotes/artist`, {
                credentials: 'include',
              });

              if (!response.ok) {
                  setQuotesError('Failed to load reviews.');
                  setArtistQuotes([]);
                  return;
              }

              const quotesApiData: ApiQuoteData[] = await response.json();

              const processedQuotes: FrontendQuote[] = quotesApiData.map(quote => ({
                 ...quote,
                 displayStatus: calculateDisplayStatusForQuote(quote),
              }));

              setArtistQuotes(processedQuotes);
              setQuotesError(null);

            } catch (err: any) {
              setQuotesError('Failed to load reviews.');
              setArtistQuotes([]);
            }
          };
          fetchArtistQuotes();
        } else if (!userData && !isInitialLoading && !initialError) {
             setArtistQuotes([]);
             setQuotesError(null);
        }
    }, [userData, calculateDisplayStatusForQuote, isInitialLoading, initialError]);


    const completedQuotesWithReviews = artistQuotes.filter(quote =>
        quote.status === 'Completed' && quote.review && quote.review.rating !== null && quote.review.rating !== undefined
    );

    const totalRating = completedQuotesWithReviews.reduce((sum, quote) => sum + (quote.review?.rating ?? 0), 0);
    const calculatedReviewCount = completedQuotesWithReviews.length;
    const calculatedAverageRating = calculatedReviewCount > 0 ? totalRating / calculatedReviewCount : null;

    const renderStars = useCallback((rating: number | null | undefined, size: "sm" | "md" | "lg" = "md") => {
        const starClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
        const ratingValue = rating ?? 0;
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`${starClass} ${i < ratingValue ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`}
                    />
                ))}
                 {size === "lg" && rating !== null && rating !== undefined && (
                      <span className="text-gray-300 ml-1 text-sm">
                          ({rating.toFixed(1)}/5)
                      </span>
                 )}
            </div>
        );
    }, []);

    const handleLogout = async () => {
      if (!userData) {
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
          setUserData(null);
          setCsrfToken(null);
          setCsrfFetchAttempted(false);
          setArtistQuotes([]);
          setQuotesError(null);
          setInitialError('');
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


    const handleEditClick = () => {
        if(userData) {
           populateFormStates(userData);
           setIsEditing(true);
           setActionError('');
           setSuccessMessage('');
           setIncompleteProfileMessage(null);
        }
    };

    const handleCancelClick = () => {
        if (userData) {
            populateFormStates(userData);
            const needsEditing = isProfileIncomplete(userData);
            if (needsEditing) {
                setIncompleteProfileMessage("Please complete your profile details below so customers can learn about your work.");
            } else {
                setIncompleteProfileMessage(null);
            }
        } else {
            populateFormStates(null);
            setIncompleteProfileMessage("Could not load profile data to revert changes.");
        }
        setIsEditing(false);
        setActionError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');
        setSuccessMessage('');
        setIsSaving(true);

        // Validate required fields before processing
        const requiredFields = {
            bio: bio?.trim(),
            specialties: specialties?.trim(),
            phone: phone?.trim(),
            address: address?.trim(),
            city: city?.trim(),
            state: state?.trim(),
            zipCode: zipCode?.trim(),
            country: country?.trim()
        };

        const missingFields: string[] = [];
        Object.entries(requiredFields).forEach(([field, value]) => {
            if (!value || value === '') {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            const missingFieldNames = getMissingFieldNames(missingFields);
            const errorMessage = `Please fill in the following required fields: ${missingFieldNames.join(', ')}`;
            setActionError(errorMessage);
            setIsSaving(false);
            sonnerToast.error("Required Fields Missing", { 
                description: `Please complete: ${missingFieldNames.join(', ')}`,
                duration: 5000
            });
            return;
        }

         let token = csrfToken;
          if (!token && !csrfFetchAttempted) {
              sonnerToast.info("Attempting to refresh security token...");
              token = await fetchCsrfToken();
          }

        if (!token) {
             setActionError('Security token missing. Please refresh the page or log in again.');
             setIsSaving(false);
             sonnerToast.error("Update Failed", { description: "Security token not available. Try refreshing." });
             return;
        }

        const bookingInfoArray = bookingInfoInput.split(',').map(item => item.trim()).filter(Boolean);
        const servicesArray = servicesInput.split(',').map(item => item.trim()).filter(Boolean);
        const availableLocationsArray = availableLocationsInput.split(',').map(item => item.trim()).filter(Boolean);

        const dataToSend = {
            address: address || null,
            city: city || null,
            state: state || null,
            zipCode: zipCode || null,
            country: country || null,
            phone: phone || null,

            bio: bio || null,
            specialties: specialties || null,

            bookingInfo: bookingInfoArray.length > 0 ? bookingInfoArray : null,
            services: servicesArray.length > 0 ? servicesArray : null,
            availableLocations: availableLocationsArray.length > 0 ? availableLocationsArray : null,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': token,
                },
                body: JSON.stringify(dataToSend),
                credentials: 'include',
            });

            const responseData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));

            if (response.ok) {
                setSuccessMessage('Information updated successfully!');
                sonnerToast.success("Profile Updated", { description: "Your information has been saved." });

                const updatedUser = {
                    ...(userData as ArtistProfileData),
                    ...dataToSend,
                    bookingInfo: bookingInfoArray,
                    services: servicesArray,
                    availableLocations: availableLocationsArray,
                    ...(responseData.user || {}),
                } as ArtistProfileData;

                setUserData(updatedUser);

                const needsEditingAfterSave = isProfileIncomplete(updatedUser);
                if (!needsEditingAfterSave) {
                   setIncompleteProfileMessage(null);
                   // Profile is now complete, redirect to dashboard
                   sonnerToast.success("Profile Complete!", { 
                       description: "Your profile has been completed successfully. Redirecting to dashboard..." 
                   });
                   setTimeout(() => {
                       router.push('/artist');
                   }, 2000);
                } else {
                   setIsEditing(false);
                }

            } else if (response.status === 401 || response.status === 403) {
                 setActionError(responseData.message || 'Authentication required. Please log in again.');
                 sonnerToast.error("Authentication Required", { description: responseData.message || "Please log in again." });
                 router.push('/login');
            }
            else {
                const errorMessage = responseData.message || response.statusText || 'Unknown error';
                setActionError(`Failed to update: ${errorMessage}`);
                sonnerToast.error("Update Failed", { description: `Failed to update: ${errorMessage}` });
            }
        } catch (err: any) {
            setActionError('An unexpected network error occurred. Please try again.');
            sonnerToast.error("Network Error", { description: "An unexpected network error occurred." });
        } finally {
            setIsSaving(false);
        }
    };

     const getInitials = (name?: string | null) => {
        if (!name || name.trim() === "") return "A";
        const parts = name.trim().split(' ');
         if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
      };


    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
                 <p className="text-lg text-gray-400">Loading profile...</p>
            </div>
        );
     }

    if (initialError && !userData) {
         return (
              <div className="flex items-center justify-center min-h-screen bg-black p-4 text-white">
                 <Card className="w-full max-w-lg shadow-lg bg-[#161616] border-[#2a2a2a] text-center p-6">
                     <Alert variant="destructive" className="mb-4 bg-red-900 text-red-200 border-red-700">
                         <Terminal className="h-4 w-4" />
                         <AlertTitle>Error Loading Profile</AlertTitle>
                         <AlertDescription>{initialError || "Could not load profile data."}</AlertDescription>
                     </Alert>
                     {initialError.includes("Authentication") || initialError.includes("log in again") || initialError.includes("Access denied") ? (
                          <Button onClick={() => router.push('/login')} className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white">
                             Go to Login
                         </Button>
                     ) : (
                          <Button onClick={() => window.location.reload()} className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white">
                             Retry Loading
                         </Button>
                     )}
                 </Card>
             </div>
         );
    }

    if (!userData) {
         return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-4 text-center">
                  <UserIcon className="h-16 w-16 text-red-600 mb-4" />
                  <p className="text-xl font-semibold mb-2">User Data Not Found</p>
                  <p className="text-base mb-6">Could not retrieve user profile. Please try logging in again.</p>
                  <Button onClick={() => router.push('/login')} className="bg-pink-600 hover:bg-pink-700 text-white">Go to Login</Button>
             </div>
         );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
            <header className="bg-black shadow-md sticky top-0 z-50 border-b border-[#2a2a2a]">
                <div className="container mx-auto flex items-center justify-between h-16 px-3 md:px-6">
                  <div className="flex items-center gap-2">
                    <Palette className="h-6 w-6 text-pink-600" />
                    <span className="font-bold text-lg md:text-xl text-white">Artist Profile</span>
                  </div>
                   <div className="flex items-center gap-3">
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-gray-800 transition-colors relative"
                                   disabled={!userData}
                                   aria-label="Notifications"
                               >
                                   <Bell className="h-5 w-5 text-pink-600" />
                                   <span className="sr-only">Notifications</span>
                               </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-80 md:w-96 bg-[#161616] text-white border-[#2a2a2a] shadow-xl p-0">
                               <DropdownMenuLabel className="text-pink-500 font-semibold px-4 py-3 border-b border-[#2a2a2a] flex justify-between items-center">
                                   Communication History
                               </DropdownMenuLabel>
                               <div className="text-center text-gray-500 p-4 text-sm">
                                   This feature is managed via the Dashboard notifications.
                               </div>
                           </DropdownMenuContent>
                       </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild disabled={!userData}>
                             <Button variant="ghost" className="p-0 rounded-full h-9 w-9 focus-visible:ring-2 focus-visible:ring-pink-600" asChild>
                                <Avatar className="cursor-pointer h-9 w-9">
                                   {userData?.image ? (
                                        <AvatarImage src={userData.image} alt={userData.name || userData.email || "Artist Avatar"} />
                                    ) : null}
                                    <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">
                                        {userData ? getInitials(userData.name) : 'A'}
                                    </AvatarFallback>
                                </Avatar>
                             </Button>
                          </DropdownMenuTrigger>
                          {userData && (
                            <DropdownMenuContent align="end" className="w-56 bg-[#161616] text-white border-[#2a2a2a] shadow-xl">
                              <DropdownMenuLabel className="px-2 py-1.5">
                                <p className="text-sm font-medium truncate text-white">{userData.name || "Artist"}</p>
                                <p className="text-xs text-gray-400 truncate">{userData.email}</p>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                              <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-pink-600 hover:!bg-gray-700 hover:!text-pink-500 cursor-pointer transition-colors">
                                <Link href="/profile/artist"><UserIcon className="mr-2 h-4 w-4" />View Profile</Link>
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

            <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 text-gray-300 flex justify-center">
                <Card className="w-full max-w-2xl shadow-lg bg-[#161616] border-[#2a2a2a]">
                     <CardHeader className="px-4 py-3 sm:p-6 border-b border-[#2a2a2a] flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-pink-600">Artist Profile</CardTitle>
                            <CardDescription className="text-gray-400">
                                {isEditing ? 'Update your profile details below.' : 'View your profile details and artist information.'}
                            </CardDescription>
                        </div>
                         {!isEditing && (
                             <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={handleEditClick}
                                 className="h-8 px-3 text-xs md:text-sm border-pink-600 bg-pink-700 text-white hover:bg-pink-600 hover:text-white transition-colors"
                                 disabled={!userData || isSaving}
                             >
                                 <Edit3 className="mr-1 h-4 w-4" /> Edit Profile
                             </Button>
                         )}
                     </CardHeader>

                    <CardContent className="px-4 pb-4 sm:p-6">
                        {incompleteProfileMessage && isEditing && (
                            <Alert variant="default" className="mb-4 bg-blue-900 border-blue-700 text-blue-200">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Profile Incomplete</AlertTitle>
                                <AlertDescription>{incompleteProfileMessage}</AlertDescription>
                            </Alert>
                        )}

                        {actionError && (
                            <Alert variant="destructive" className="mb-4 bg-red-900 text-red-200 border-red-700">
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{actionError}</AlertDescription>
                            </Alert>
                        )}
                        {successMessage && (
                             <Alert variant="default" className="mb-4 bg-green-900 border-green-700 text-green-200">
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}


                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">

                                 <div className="flex justify-center mb-3 sm:mb-4">
                                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl">
                                        {userData?.image ? (
                                             <AvatarImage src={userData.image} alt={userData.name || userData.email || "Artist Avatar"} />
                                         ) : null}
                                         <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">
                                             {userData ? getInitials(userData.name) : 'A'}
                                         </AvatarFallback>
                                      </Avatar>
                                 </div>


                                 <>
                                     <div className="space-y-2">
                                        <Label htmlFor="name" className="text-gray-400">
                                            Full Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-400">
                                            Email Address
                                        </Label>
                                        <Input id="email" type="email" value={userData?.email || ''} className="bg-[#100D0F] text-gray-400 border-[#333333] cursor-not-allowed" disabled={true} readOnly />
                                        <p className="text-xs text-gray-500">Email cannot be changed (Google Account)</p>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-gray-400">
                                            Phone Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input id="phone" type="tel" placeholder="e.g., +91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="address" className="text-gray-400">
                                            Address <span className="text-red-500">*</span>
                                        </Label>
                                        <Input id="address" placeholder="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city" className="text-gray-400">
                                                City <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state" className="text-gray-400">
                                                State/Province <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="state" placeholder="State or Province" value={state} onChange={(e) => setState(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="zipCode" className="text-gray-400">
                                                Zip/Postal Code <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="zipCode" placeholder="Zip or Postal Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="country" className="text-gray-400">
                                                Country <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="country" placeholder="India" value={country} onChange={(e) => setCountry(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                    </div>

                                    <Separator className="my-6 bg-[#2a2a2a]" />

                                    <div className="space-y-2">
                                        <Label htmlFor="bio" className="text-gray-400">
                                            Bio <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea id="bio" placeholder="Tell us about yourself as an artist, your style, and your passion..." value={bio} onChange={(e) => setBio(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600 min-h-[100px]" disabled={isSaving}/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="specialties" className="text-gray-400">
                                            Specialties <span className="text-red-500">*</span>
                                        </Label>
                                        <Input id="specialties" placeholder="e.g., Bridal Makeup, Special Effects, Editorial" value={specialties} onChange={(e) => setSpecialties(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>

                                     <div className="space-y-2">
                                         <Label htmlFor="bookingInfo" className="text-gray-400">Booking Information (Optional - Separate with commas)</Label>
                                         <Input
                                            id="bookingInfo"
                                            placeholder="e.g., Min booking 2 hours, Travel fee ₹500"
                                            value={bookingInfoInput}
                                            onChange={(e) => setBookingInfoInput(e.target.value)}
                                            className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600"
                                             disabled={isSaving}
                                         />
                                     </div>
                                     <div className="space-y-2">
                                         <Label htmlFor="services" className="text-gray-400">Services Offered (Optional - Separate with commas)</Label>
                                          <Input
                                             id="services"
                                             placeholder="e.g., Bridal Makeup, Hair Styling, Mehndi Art"
                                             value={servicesInput}
                                             onChange={(e) => setServicesInput(e.target.value)}
                                             className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600"
                                              disabled={isSaving}
                                          />
                                     </div>
                                     <div className="space-y-2">
                                         <Label htmlFor="availableLocations" className="text-gray-400">Available Locations (Optional - Separate with commas)</Label>
                                          <Input
                                             id="availableLocations"
                                             placeholder="e.g., Mumbai, Delhi, Bangalore, Chennai"
                                             value={availableLocationsInput}
                                             onChange={(e) => setAvailableLocationsInput(e.target.value)}
                                             className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600"
                                              disabled={isSaving}
                                          />
                                     </div>

                                    <div className="flex justify-end gap-2 mt-6">
                                        <Button type="button" variant="ghost" onClick={handleCancelClick} className="text-gray-400 hover:bg-[#2a2a2a] hover:text-white" disabled={isSaving}>Cancel</Button>
                                        <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white h-10 px-4 text-base" disabled={isSaving || !csrfToken}>
                                            {isSaving ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                            ) : !csrfToken ? (
                                                 'Loading Security...'
                                            ) : (
                                                'Save Information'
                                            )}
                                        </Button>
                                    </div>
                                 </>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                 <div className="flex flex-col items-center mb-4 text-center">
                                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl mb-3">
                                         {userData?.image ? (
                                             <AvatarImage src={userData.image} alt={userData.name || userData.email || "Artist Avatar"} />
                                         ) : null}
                                         <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(userData.name)}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl sm:text-2xl font-bold text-white">{userData.name || 'Artist'}</h2>
                                    <p className="text-gray-400 text-sm sm:text-base break-all">{userData.email}</p>

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

                                 <Separator className="bg-[#2a2a2a]" />

                                 <div className="space-y-3 text-sm sm:text-base">
                                     <h3 className="text-lg font-semibold text-pink-500 flex items-center gap-2">
                                         <UserIcon className="h-5 w-5" /> Contact Details
                                     </h3>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-gray-300 text-sm">
                                          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /> <strong>Phone:</strong> <span className="text-gray-400">{userData.phone || 'N/A'}</span></div>
                                            {(userData.address || userData.city || userData.state || userData.zipCode || userData.country) ? (
                                                <div className="flex items-start gap-2 col-span-full text-gray-300 text-sm">
                                                     <HomeIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /> <div><strong>Address:</strong> <span className="text-gray-400">
                                                        {[userData.address, userData.city, userData.state, userData.zipCode, userData.country]
                                                             .filter(Boolean).join(', ') || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                      <div className="flex items-center gap-2 col-span-full text-gray-300 text-sm">
                                                           <HomeIcon className="h-4 w-4 text-gray-500" /> <strong>Address:</strong> <span className="text-gray-400">N/A</span>
                                                      </div>
                                                )}
                                       </div>
                                 </div>

                                 {(userData.bio || userData.specialties || (Array.isArray(userData.bookingInfo) && userData.bookingInfo.length > 0) || (Array.isArray(userData.services) && userData.services.length > 0) || (Array.isArray(userData.availableLocations) && userData.availableLocations.length > 0)) && (
                                      <>
                                        <Separator className="bg-[#2a2a2a]" />
                                        <div className="space-y-3 text-sm sm:text-base">
                                            <h3 className="text-lg font-semibold text-pink-500 flex items-center gap-2">
                                                <Briefcase className="h-5 w-5" /> Artist Details
                                            </h3>
                                                <div className="space-y-2.5 text-gray-300 text-sm">
                                                    {userData.bio ? (<div className="flex items-start gap-2"><BookOpen className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /><div><strong>Bio:</strong> <span className="text-gray-400 whitespace-pre-wrap">{userData.bio}</span></div></div>) : (<div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-gray-500" /> <strong>Bio:</strong> <span className="text-gray-400">N/A</span></div>)}
                                                    {userData.specialties ? (<div className="flex items-start gap-2"><Star className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /><div><strong>Specialties:</strong> <span className="text-gray-400">{userData.specialties}</span></div></div>) : (<div className="flex items-center gap-2"><Star className="h-4 w-4 text-gray-500" /> <strong>Specialties:</strong> <span className="text-gray-400">N/A</span></div>)}
                                                    {Array.isArray(userData.bookingInfo) && userData.bookingInfo.length > 0 ? (<div className="flex items-start gap-2"><Info className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /><div><strong>Booking Info:</strong> <span className="text-gray-400">{userData.bookingInfo.join(', ')}</span></div></div>) : (<div className="flex items-center gap-2"><Info className="h-4 w-4 text-gray-500" /> <strong>Booking Info:</strong> <span className="text-gray-400">N/A</span></div>)}
                                                    {Array.isArray(userData.services) && userData.services.length > 0 ? (<div className="flex items-start gap-2"><Briefcase className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /><div><strong>Services:</strong> <span className="text-gray-400">{userData.services.join(', ')}</span></div></div>) : (<div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-gray-500" /> <strong>Services:</strong> <span className="text-gray-400">N/A</span></div>)}
                                                    {Array.isArray(userData.availableLocations) && userData.availableLocations.length > 0 ? (<div className="flex items-start gap-2"><Map className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /><div><strong>Locations:</strong> <span className="text-gray-400">{userData.availableLocations.join(', ')}</span></div></div>) : (<div className="flex items-center gap-2"><Map className="h-4 w-4 text-gray-500" /> <strong>Locations:</strong> <span className="text-gray-400">N/A</span></div>)}
                                                </div>
                                        </div>
                                    </>
                                 )}


                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-pink-500 flex items-center gap-2">
                                      <Palette className="h-5 w-5" /> Portfolio Showcase
                                    </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {[1, 2, 3, 4].map((item) => (
                                              <div key={item} className="flex flex-col group">
                                                <div className="aspect-square bg-[#2a2a2a] rounded-md flex items-center justify-center mb-2 border border-[#4a4a4a] group-hover:border-pink-600 transition-all">
                                                  <Palette className="h-10 w-10 text-gray-600 group-hover:text-pink-600 transition-all" />
                                                </div>
                                                <h3 className="font-medium text-sm text-white truncate">Artwork Example {item}</h3>
                                                <p className="text-xs text-gray-500">Details or link placeholder</p>
                                              </div>
                                            ))}
                                          </div>
                                         <p className="text-xs sm:text-sm text-gray-500 mt-4 text-center italic">
                                                Showcase your best work here.
                                            </p>
                                 </div>
                            </div>
                        )}
                    </CardContent>
                     <CardFooter className="text-sm text-gray-500 border-t border-[#2a2a2a] pt-4 md:flex hidden justify-end">
                        <Button asChild variant="link" className="p-0 h-auto text-pink-600 hover:text-pink-700">
                             <Link href="/artist"><LayoutDashboard className="h-4 w-4 mr-2" /> Go to Dashboard</Link>
                        </Button>
                     </CardFooter>
                </Card>
            </main>

             {userData && (
                 <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] h-16 md:hidden z-40">
                    <Suspense fallback={<div>Loading navigation...</div>}>
                       <MobileNavigationComponent pathname={pathname} />
                    </Suspense>
                 </nav>
             )}
        </div>
    );
}

type MobileNavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  view?: string;
};

const profileNavigationItems: MobileNavigationItem[] = [
  { name: 'Dashboard', href: '/artist', icon: HomeIcon, view: 'home' },
  { name: 'Quotes', href: '/artist?view=quotes', icon: FileText, view: 'quotes' },
  { name: 'Analytics', href: '/artist?view=analytics', icon: LayoutDashboard, view: 'analytics' },
  { name: 'Profile', href: '/profile/artist', icon: UserIcon },
];

const MobileNavigationComponent = ({ pathname }: { pathname: string }) => {
    const searchParams = nextUseSearchParams();
    const mobileView = pathname === '/artist' ? searchParams.get('view') : null;
    const currentMobileView = mobileView || 'home';

    return (
        <ul className="flex justify-around items-center h-full">
            {profileNavigationItems.map((item: MobileNavigationItem) => {
                let isActive = false;

                 if (item.href === '/artist') {
                      isActive = pathname === item.href && (item.view === 'home' ? (currentMobileView === 'home' || !currentMobileView) : currentMobileView === item.view);
                 } else {
                     isActive = pathname === item.href;
                 }


                return (
                    <li key={item.name} className="flex-1">
                        <Link
                            href={item.href}
                            className={`flex flex-col items-center justify-center text-xs h-full transition-colors duration-150 ease-in-out ${
                                isActive ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'
                            }`}
                        >
                            <item.icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-pink-600' : 'text-gray-500'}`} strokeWidth={isActive ? 2.5 : 2}/>
                            <span>{item.name}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};