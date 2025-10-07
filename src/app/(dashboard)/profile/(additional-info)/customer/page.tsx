
"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User as AuthUser, API_BASE_URL } from '@/types/user';
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
    ShoppingCart,
    FileText,
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
    Map,
    Clock,
    Bell,
    LogOut,
    Settings,
    LayoutDashboard,
    Heart,
    ChevronLeft,
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


interface CustomerProfileData extends AuthUser {
    height?: number | null;
    weight?: number | null;
    color?: string | null;
    ethnicity?: string | null;
    age?: number | null;
    other?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    phone?: string | null;
    gender?: string | null;
    bookingPreferences?: string[] | null;
    preferredArtists?: string[] | null;
    createdAt: string;
    updatedAt: string;
}

// --- Define "important" fields to check for profile completeness ---
const importantCustomerKeys: Array<keyof CustomerProfileData> = [
     'phone',
     'city',
     'gender',
     'height',
     'weight',
     'color',
     'ethnicity',
     'age',
     'other',
     'address',
     'state',
     'zipCode',
     'country',
];

// --- Helper function to check if profile is incomplete ---
const isProfileIncomplete = (user: CustomerProfileData | null, keysToCheck: Array<keyof CustomerProfileData>): boolean => {
    if (!user) return true;

    for (const key of keysToCheck) {
        const value = user[key];

        if (value == null) {
            return true;
        }

        if (typeof value === 'string' && value.trim() === '') {
             return true;
        }

        if (Array.isArray(value) && value.length === 0) {
             return true;
        }

         if (typeof value === 'number' && (isNaN(value) || value <= 0)) {
              return true;
         }
    }
    return false;
};


export default function CustomerProfilePage() {
    const [userData, setUserData] = useState<CustomerProfileData | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialError, setInitialError] = useState('');
    const [incompleteProfileMessage, setIncompleteProfileMessage] = useState<string | null>(null);


    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [color, setColor] = useState('');
    const [ethnicity, setEthnicity] = useState('');
    const [age, setAge] = useState('');
    const [other, setOther] = useState('');

    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<string>('');

    const [bookingPreferencesInput, setBookingPreferencesInput] = useState('');
    const [preferredArtistsInput, setPreferredArtistsInput] = useState('');


    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [csrfFetchAttempted, setCsrfFetchAttempted] = useState(false);


    const router = useRouter();
    const pathname = usePathname();


    const populateFormStates = useCallback((data: CustomerProfileData | null) => {
        if (data) {
            setHeight(data.height?.toString() ?? '');
            setWeight(data.weight?.toString() ?? '');
            setColor(data.color ?? '');
            setEthnicity(data.ethnicity ?? '');
            setAge(data.age?.toString() ?? '');
            setOther(data.other ?? '');

            setAddress(data.address ?? '');
            setCity(data.city ?? '');
            setState(data.state ?? '');
            setZipCode(data.zipCode ?? '');
            setCountry(data.country ?? '');
            setPhone(data.phone ?? '');
            setGender(data.gender ?? '');

            setBookingPreferencesInput(Array.isArray(data.bookingPreferences) ? data.bookingPreferences.join(', ') : '');
            setPreferredArtistsInput(Array.isArray(data.preferredArtists) ? data.preferredArtists.join(', ') : '');

        } else {
             setHeight(''); setWeight(''); setColor(''); setEthnicity(''); setAge(''); setOther('');
             setAddress(''); setCity(''); setState(''); setZipCode(''); setCountry(''); setPhone(''); setGender('');
             setBookingPreferencesInput(''); setPreferredArtistsInput('');
        }
    }, []);


    // --- Function to fetch CSRF Token ---
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
              setCsrfToken(data.csrfToken || null);
              return data.csrfToken || null;
         } catch (error) {
             setCsrfToken(null);
             return null;
         }
     }, [csrfToken, csrfFetchAttempted]);


    // --- Effect 1: Fetch User Data on Mount ---
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

                const data: { user: CustomerProfileData } = await response.json();

                if (data.user.role !== 'customer') {
                     const errorMessage = "Access denied. This page is for customers only.";
                     setUserData(null);
                     setInitialError(errorMessage);
                     sonnerToast.error("Access Denied", { description: errorMessage });
                     router.push(data.user.role === 'artist' ? '/artist' : '/');
                     setIsInitialLoading(false);
                     return;
                }

                setUserData(data.user);

                const needsEditing = isProfileIncomplete(data.user, importantCustomerKeys);
                setIsEditing(needsEditing);

                if (needsEditing) {
                    setIncompleteProfileMessage("Please complete your profile details below. Artists may use this information for bookings.");
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

    }, [router, populateFormStates, importantCustomerKeys]);


     // --- Effect 2: Initial Fetch of CSRF Token ---
     useEffect(() => {
         if (!isInitialLoading && !initialError) {
            fetchCsrfToken();
         }
     }, [isInitialLoading, initialError, fetchCsrfToken]);


    // --- Handle Logout ---
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


    // --- Handle Edit/Cancel/Save Actions ---
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
            const needsEditing = isProfileIncomplete(userData, importantCustomerKeys);
            if (needsEditing) {
                setIncompleteProfileMessage("Please complete your profile details below. Artists may use this information for bookings.");
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

        const parsedHeight = height === '' ? null : parseFloat(height);
        const parsedWeight = weight === '' ? null : parseFloat(weight);
        const parsedAge = age === '' ? null : parseInt(age, 10);

        if (height !== '' && (isNaN(parsedHeight as any) || parsedHeight! < 0)) {
            setActionError('Please enter a valid non-negative number for Height.');
            setIsSaving(false);
            return;
        }
        if (weight !== '' && (isNaN(parsedWeight as any) || parsedWeight! < 0)) {
            setActionError('Please enter a valid non-negative number for Weight.');
            setIsSaving(false);
            return;
        }
        if (age !== '' && (isNaN(parsedAge as any) || parsedAge! < 0)) {
            setActionError('Please enter a valid non-negative whole number for Age.');
            setIsSaving(false);
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

        const bookingPreferencesArray = bookingPreferencesInput.split(',').map(item => item.trim()).filter(item => item !== '');
        const preferredArtistsArray = preferredArtistsInput.split(',').map(item => item.trim()).filter(item => item !== '');


        const dataToSend = {
            height: parsedHeight,
            weight: parsedWeight,
            color: color || null,
            ethnicity: ethnicity || null,
            age: parsedAge,
            other: other || null,

            address: address || null,
            city: city || null,
            state: state || null,
            zipCode: zipCode || null,
            country: country || null,
            phone: phone || null,
            gender: gender === '' ? null : gender,

            bookingPreferences: bookingPreferencesArray.length > 0 ? bookingPreferencesArray : null,
            preferredArtists: preferredArtistsArray.length > 0 ? preferredArtistsArray : null,
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
                    ...(userData as CustomerProfileData),
                    ...dataToSend,
                    bookingPreferences: bookingPreferencesArray,
                    preferredArtists: preferredArtistsArray,
                     gender: gender === '' ? null : gender,
                    ...(responseData.user || {}),
                } as CustomerProfileData;


                setUserData(updatedUser);

                const needsEditingAfterSave = isProfileIncomplete(updatedUser, importantCustomerKeys);
                if (!needsEditingAfterSave) {
                   setIncompleteProfileMessage(null);
                }


                setIsEditing(false);

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
        if (!name || name.trim() === "") return "C";
        const parts = name.trim().split(' ');
         if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
      };


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
                     ) :
                          <Button onClick={() => window.location.reload()} className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white">
                             Retry Loading
                         </Button>
                    }
                 </Card>
             </div>
         );
    }

     if (isInitialLoading && !userData && !initialError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
                 <p className="text-lg text-gray-400">Loading profile...</p>
            </div>
        );
     }


     if (userData && userData.role !== 'customer') {
         return (
              <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-4 text-center">
                   <UserIcon className="h-16 w-16 text-red-600 mb-4" />
                   <p className="text-xl font-semibold mb-2">Access Denied</p>
                   <p className="text-base mb-6">This page is only accessible to customers.</p>
                   <Button onClick={() => router.push('/login')} className="bg-pink-600 hover:bg-pink-700 text-white">Go to Login</Button>
              </div>
          );
     }


    return (
        <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
            <header className="bg-black shadow-md sticky top-0 z-50 border-b border-[#2a2a2a]">
                <div className="container mx-auto flex items-center justify-between h-16 px-3 md:px-6">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-6 w-6 text-pink-600" />
                    <span className="font-bold text-lg md:text-xl text-white">Customer Profile</span>
                  </div>
                   <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-gray-800 transition-colors" aria-label="Notifications"
                             disabled={!userData}
                        >
                          <Bell className="h-5 w-5 text-pink-600" />
                          <span className="sr-only">Notifications</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" className="p-0 rounded-full h-9 w-9 focus-visible:ring-2 focus-visible:ring-pink-600"
                                disabled={!userData}
                             >
                                <Avatar className="cursor-pointer h-9 w-9">
                                {userData ? (
                                     <>
                                         <AvatarImage src={userData.image || undefined} alt={userData.name || userData.email || "Customer Avatar"} />
                                         <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(userData.name)}</AvatarFallback>
                                     </>
                                ) : (
                                     <AvatarFallback className="bg-gray-800 text-gray-500 border border-gray-700 animate-pulse">C</AvatarFallback>
                                )}
                                </Avatar>
                            </Button>
                          </DropdownMenuTrigger>
                          {userData && (
                            <DropdownMenuContent align="end" className="w-56 bg-[#161616] text-white border-[#2a2a2a] shadow-xl">
                              <DropdownMenuLabel className="px-2 py-1.5">
                                <p className="text-sm font-medium truncate text-white">{userData.name || "Customer"}</p>
                                <p className="text-xs text-gray-400 truncate">{userData.email}</p>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                              <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-pink-600 hover:!bg-gray-700 hover:!text-pink-500 cursor-pointer transition-colors">
                                <Link href="/profile/customer"><UserIcon className="mr-2 h-4 w-4" />View Profile</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-pink-600 hover:!bg-gray-700 hover:!text-pink-500 cursor-pointer transition-colors">
                                <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
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
                            <CardTitle className="text-2xl font-bold text-pink-600">Customer Profile</CardTitle>
                            <CardDescription className="text-gray-400">
                                {isEditing ? 'Update your profile details below.' : 'View your profile details and preferences.'}
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
                        {/* Incomplete Profile Message (Visible when in forced edit mode) */}
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

                        {isInitialLoading ? (
                             <div className="space-y-6 animate-pulse">
                                <div className="flex flex-col items-center mb-4">
                                    <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#2a2a2a] mb-3" />
                                    <Skeleton className="h-6 w-40 bg-[#2a2a2a] mb-1" />
                                    <Skeleton className="h-4 w-52 bg-[#2a2a2a]" />
                                </div>
                                 <Separator className="bg-[#2a2a2a]" />
                                 <div className="space-y-3">
                                     <Skeleton className="h-5 w-40 bg-[#2a2a2a]" />
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-full bg-[#2a2a2a]" />)}
                                     </div>
                                 </div>
                                  <Separator className="bg-[#2a2a2a]" />
                                 <div className="space-y-3">
                                     <Skeleton className="h-5 w-40 bg-[#2a2a2a]" />
                                      <div className="space-y-2.5">
                                          <Skeleton className="h-4 w-full bg-[#2a2a2a]" />
                                          <Skeleton className="h-4 w-full bg-[#2a2a2a]" />
                                          <Skeleton className="h-4 w-full bg-[#2a2a2a]" />
                                      </div>
                                 </div>
                             </div>
                        ) : isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">

                                 <div className="flex justify-center mb-3 sm:mb-4">
                                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl">
                                        {userData ? (
                                             <>
                                                <AvatarImage src={userData.image || undefined} alt={userData.name || userData.email || "Customer Avatar"} />
                                                <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(userData.name)}</AvatarFallback>
                                             </>
                                        ) : (
                                             <AvatarFallback className="bg-gray-800 text-gray-500 border border-gray-700 animate-pulse">C</AvatarFallback>
                                        )}
                                      </Avatar>
                                 </div>
                                 <div className="text-center text-sm text-gray-400 mb-6">
                                     <p>Profile picture and basic info (Name, Email) can be updated elsewhere if needed.</p>
                                 </div>

                                 <>
                                     <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-gray-400">Phone Number</Label>
                                        <Input id="phone" type="tel" placeholder="e.g., +1 555 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="address" className="text-gray-400">Address</Label>
                                        <Input id="address" placeholder="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city" className="text-gray-400">City</Label>
                                            <Input id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state" className="text-gray-400">State/Province</Label>
                                            <Input id="state" placeholder="State or Province" value={state} onChange={(e) => setState(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="zipCode" className="text-gray-400">Zip/Postal Code</Label>
                                            <Input id="zipCode" placeholder="Zip or Postal Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="country" className="text-gray-400">Country</Label>
                                            <Input id="country" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender" className="text-gray-400">Gender</Label>
                                         <Select value={gender ?? ''} onValueChange={setGender} disabled={isSaving}>
                                             <SelectTrigger id="gender" className="bg-[#2a2a2a] text-white border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600">
                                                 <SelectValue placeholder="Select gender" />
                                             </SelectTrigger>
                                             <SelectContent className="bg-[#2a2a2a] text-white border-[#4a4a4a]">
                                                 <SelectItem value="male" className="hover:bg-[#4a4a4a] focus:bg-[#3a3a3a]">Male</SelectItem>
                                                 <SelectItem value="female" className="hover:bg-[#4a4a4a] focus:bg-[#3a3a3a]">Female</SelectItem>
                                                 <SelectItem value="non_binary" className="hover:bg-[#4a4a4a] focus:bg-[#3a3a3a]">Non-binary</SelectItem>
                                                 <SelectItem value="prefer_not_to_say" className="hover:bg-[#4a4a4a] focus:bg-[#3a3a3a]">Prefer not to say</SelectItem>
                                                  <SelectItem value="other" className="hover:bg-[#4a4a4a] focus:bg-[#3a3a3a]">Other</SelectItem>
                                                   <SelectItem value="not_specified" className="hover:bg-[#4a4a4a] focus:bg-[#3a3a3a] text-gray-500 italic">Not specified</SelectItem>
                                             </SelectContent>
                                         </Select>
                                     </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="height" className="text-gray-400">Height (cm)</Label>
                                            <Input id="height" type="number" placeholder="e.g., 170" value={height} onChange={(e) => setHeight(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="weight" className="text-gray-400">Weight (kg)</Label>
                                            <Input id="weight" type="number" placeholder="e.g., 65" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="color" className="text-gray-400">Skin Color</Label>
                                        <Input id="color" placeholder="e.g., Fair, Brown" value={color} onChange={(e) => setColor(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ethnicity" className="text-gray-400">Ethnicity</Label>
                                        <Input id="ethnicity" placeholder="e.g., Asian, Caucasian" value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="age" className="text-gray-400">Age</Label>
                                        <Input id="age" type="number" placeholder="e.g., 25" value={age} onChange={(e) => setAge(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600" disabled={isSaving}/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="other" className="text-gray-400">Other Details</Label>
                                        <Textarea id="other" placeholder="Any other relevant details about yourself (e.g., allergies, specific needs)" value={other} onChange={(e) => setOther(e.target.value)} className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600 min-h-[100px]" disabled={isSaving}/>
                                    </div>


                                    <Separator className="my-6 bg-[#2a2a2a]" />

                                    <div className="space-y-2">
                                         <Label htmlFor="bookingPreferences" className="text-gray-400">Booking Preferences (Optional - Separate with commas)</Label>
                                         <Input
                                            id="bookingPreferences"
                                            placeholder="e.g., Prefers evening appointments, Sensitive skin"
                                            value={bookingPreferencesInput}
                                            onChange={(e) => setBookingPreferencesInput(e.target.value)}
                                            className="bg-[#2a2a2a] text-white placeholder-gray-500 border-[#4a4a4a] focus:border-pink-600 focus:ring-pink-600"
                                             disabled={isSaving}
                                         />
                                     </div>
                                     <div className="space-y-2">
                                         <Label htmlFor="preferredArtists" className="text-gray-400">Preferred Artists (Optional - Separate with commas)</Label>
                                          <Input
                                             id="preferredArtists"
                                             placeholder="e.g., Artist Name 1, Artist Name 2"
                                             value={preferredArtistsInput}
                                             onChange={(e) => setPreferredArtistsInput(e.target.value)}
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
                                 {userData && (
                                     <>
                                         <div className="flex flex-col items-center mb-4 text-center">
                                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl mb-3">
                                                 <AvatarImage src={userData.image || undefined} alt={userData.name || userData.email || "Customer Avatar"} />
                                                 <AvatarFallback className="bg-gray-800 text-pink-600 border border-pink-600">{getInitials(userData.name)}</AvatarFallback>
                                            </Avatar>
                                            <h2 className="text-xl sm:text-2xl font-bold text-white">{userData.name || 'Customer'}</h2>
                                            <p className="text-gray-400 text-sm sm:text-base break-all">{userData.email}</p>
                                        </div>

                                         <Separator className="bg-[#2a2a2a]" />

                                         <div className="space-y-3 text-sm sm:text-base">
                                             <h3 className="text-lg font-semibold text-pink-500 flex items-center gap-2">
                                                 <UserIcon className="h-5 w-5" /> Personal Details
                                             </h3>
                                               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-gray-300 text-sm">
                                                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /> <strong>Phone:</strong> <span className="text-gray-400">{userData.phone || 'N/A'}</span></div>
                                                   <div className="flex items-center gap-2"><UserCog className="h-4 w-4 text-gray-500" /> <strong>Gender:</strong> <span className="text-gray-400">{userData.gender || 'N/A'}</span></div>
                                                   <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-gray-500" /> <strong>Height:</strong> <span className="text-gray-400">{userData.height ? `${userData.height} cm` : 'N/A'}</span></div>
                                                   <div className="flex items-center gap-2"><Weight className="h-4 w-4 text-gray-500" /> <strong>Weight:</strong> <span className="text-gray-400">{userData.weight ? `${userData.weight} kg` : 'N/A'}</span></div>
                                                   <div className="flex items-center gap-2"><Droplet className="h-4 w-4 text-gray-500" /> <strong>Skin Color:</strong> <span className="text-gray-400">{userData.color || 'N/A'}</span></div>
                                                   <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-500" /> <strong>Ethnicity:</strong> <span className="text-gray-400">{userData.ethnicity || 'N/A'}</span></div>
                                                   <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-500" /> <strong>Age:</strong> <span className="text-gray-400">{userData.age ? `${userData.age} years` : 'N/A'}</span></div>
                                                    {(userData.address || userData.city || userData.state || userData.zipCode || userData.country) ? (
                                                        <div className="flex items-start gap-2 col-span-full text-gray-300 text-sm">
                                                             <HomeIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /> <div><strong>Address:</strong> <span className="text-gray-400">
                                                                {[userData.address, userData.city, userData.state, userData.zipCode, userData.country]
                                                                     .filter(Boolean).join(', ') || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                         <div className="flex items-start gap-2 col-span-full text-gray-300 text-sm">
                                                               <HomeIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /> <div><strong>Address:</strong> <span className="text-gray-400">N/A</span></div>
                                                         </div>
                                                    )}
                                                    {userData.other ? (
                                                          <div className="flex items-start gap-2 col-span-full text-gray-300 text-sm">
                                                              <Tag className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /> <div><strong>Other Info:</strong> <span className="text-gray-400 whitespace-pre-wrap">{userData.other}</span></div>
                                                          </div>
                                                    ) : (
                                                         <div className="flex items-start gap-2 col-span-full text-gray-300 text-sm">
                                                               <Tag className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /> <div><strong>Other Info:</strong> <span className="text-gray-400">N/A</span></div>
                                                         </div>
                                                    )}
                                               </div>
                                         </div>

                                        {(Array.isArray(userData.bookingPreferences) && userData.bookingPreferences.length > 0) || (Array.isArray(userData.preferredArtists) && userData.preferredArtists.length > 0) ? (
                                             <>
                                                <Separator className="bg-[#2a2a2a]" />
                                                <div className="space-y-3 text-sm sm:text-base">
                                                    <h3 className="text-lg font-semibold text-pink-500 flex items-center gap-2">
                                                        <Info className="h-5 w-5" /> Preferences
                                                    </h3>
                                                        <div className="space-y-2.5 text-gray-300 text-sm">
                                                             {Array.isArray(userData.bookingPreferences) && userData.bookingPreferences.length > 0 && (<div className="flex items-start gap-2"><FileText className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /><div><strong>Booking Preferences:</strong> <span className="text-gray-400">{userData.bookingPreferences.join(', ')}</span></div></div>)}
                                                             {Array.isArray(userData.preferredArtists) && userData.preferredArtists.length > 0 && (<div className="flex items-start gap-2"><Heart className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /><div><strong>Preferred Artists:</strong> <span className="text-gray-400">{userData.preferredArtists.join(', ')}</span></div></div>)}
                                                        </div>
                                                </div>
                                            </>
                                         ) : (
                                            <>
                                                <Separator className="bg-[#2a2a2a]" />
                                                <div className="space-y-3 text-sm sm:text-base">
                                                     <h3 className="text-lg font-semibold text-pink-500 flex items-center gap-2">
                                                         <Info className="h-5 w-5" /> Preferences
                                                     </h3>
                                                    <p className="text-gray-500 italic text-sm">No preferences or preferred artists added yet.</p>
                                                </div>
                                            </>
                                         )}
                                     </>
                                 )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="text-sm text-gray-500 border-t border-[#2a2a2a] pt-4 md:flex hidden justify-end">
                        <Button asChild variant="link" className="p-0 h-auto text-pink-600 hover:text-pink-700">
                             <Link href="/customer"><LayoutDashboard className="h-4 w-4 mr-2" /> Go to Dashboard</Link>
                        </Button>
                     </CardFooter>
                </Card>
            </main>

             {userData && (
                 <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] h-16 md:hidden z-40">
                    <Suspense fallback={
                         <div className="flex justify-around items-center h-full">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-1/4 bg-[#2a2a2a] rounded-md animate-pulse mx-1" />)}
                         </div>
                    }>
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

// Updated navigation items to match Customer Dashboard structure
const customerNavigationItems: MobileNavigationItem[] = [
  { name: 'Home', href: '/customer', icon: HomeIcon, view: 'home' },
  { name: 'Quotes', href: '/customer?view=quotes', icon: FileText, view: 'quotes' },
  { name: 'Analytics', href: '/customer?view=analytics', icon: LayoutDashboard, view: 'analytics' },
  { name: 'Profile', href: '/profile/customer', icon: UserIcon, view: 'profile' },
];


const MobileNavigationComponent = ({ pathname }: { pathname: string }) => {
    const searchParams = nextUseSearchParams();
    const mobileView = pathname === '/customer' ? searchParams.get('view') : null;

    // Determine the active view based on pathname precedence
    let effectiveView = 'home'; // Default view if on /customer
    if (pathname === '/profile/customer') {
        effectiveView = 'profile';
    } else if (pathname === '/customer') {
        effectiveView = mobileView || 'home';
    }


    return (
        <ul className="flex justify-around items-center h-full">
            {customerNavigationItems.map((item: MobileNavigationItem) => {
                let isActive = false;
                const itemIsProfile = item.href === '/profile/customer';

                if (itemIsProfile) {
                    isActive = pathname === '/profile/customer';
                } else if (item.href === '/customer') {
                    // Check if on /customer and the view matches the item's view
                    isActive = pathname === '/customer' && item.view === effectiveView;
                }

                return (
                    <li key={item.name} className="flex-1">
                        <Link
                            href={item.href}
                            className={`flex flex-col items-center justify-center text-xs h-full transition-colors duration-150 ease-in-out ${
                                isActive ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'
                            }`}
                        >
                            {/* Use strokeWidth 2.5 for active, 2 for inactive, for lucide-react icons */}
                            <item.icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-pink-600' : 'text-gray-500'}`} strokeWidth={isActive ? 2.5 : 2}/>
                            <span>{item.name}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};