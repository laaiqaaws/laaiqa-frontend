"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/types/user';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, Check } from 'lucide-react';
import { toast as sonnerToast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { INDIAN_STATES, validatePhone, validatePinCode } from "@/lib/validation";

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  bio?: string | null;
  specialties?: string | null;
  services?: string[] | null;
  availableLocations?: string[] | null;
  bookingInfo?: string[] | null;
}

const EXPERIENCE_OPTIONS = [
  '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'
];

// Section mapping
const SECTION_MAP: Record<string, number> = {
  'basic': 1,
  'location': 2,
  'professional': 3,
  'booking': 4,
};

const SECTION_TITLES: Record<string, string> = {
  'basic': 'Basic Info',
  'location': 'Location',
  'professional': 'Professional Information',
  'booking': 'Booking and Scheduling',
};

function ArtistOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const sectionParam = searchParams.get('section');
  const { user: authUser, csrfToken, isLoading: authLoading, refreshUser } = useAuth();
  
  // If section is specified, show only that section (single page mode)
  const isSingleSectionMode = isEditMode && sectionParam && SECTION_MAP[sectionParam];
  const initialStep = sectionParam && SECTION_MAP[sectionParam] ? SECTION_MAP[sectionParam] : 1;
  
  const [step, setStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Step 1: Basic Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Location
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');

  // Step 3: Professional Info
  const [category, setCategory] = useState('Makeup Artist');
  const [experience, setExperience] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [bio, setBio] = useState('');

  // Step 4: Booking & Scheduling
  const [advanceBookingDays, setAdvanceBookingDays] = useState('7');
  const [bookingType, setBookingType] = useState<'approval' | 'instant'>('approval');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['upi']);
  const [allowPartialPayment, setAllowPartialPayment] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!authUser) {
      router.push('/login');
      return;
    }

    const fetchFullUserData = async () => {
      try {
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const data = await userRes.json();
        const serverUser = data.user;
        
        if (serverUser.role !== 'artist') {
          if (serverUser.role === 'customer') {
            router.push('/profile/customer');
          } else if (serverUser.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/signup');
          }
          return;
        }
        
        setUserData(serverUser);
        
        // Pre-fill form with existing data
        if (serverUser.name) {
          const nameParts = serverUser.name.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
        }
        setPhone(serverUser.phone || '');
        setAddressLine1(serverUser.address || '');
        setCity(serverUser.city || '');
        setState(serverUser.state || '');
        setPincode(serverUser.zipCode || '');
        setBio(serverUser.bio || '');
        if (serverUser.services) setSelectedServices(serverUser.services);
        if (serverUser.availableLocations) setAvailableLocations(serverUser.availableLocations);
      } catch {
        sonnerToast.error("Error loading data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullUserData();
  }, [authLoading, authUser, router]);

  const addLocation = () => {
    if (locationInput.trim() && !availableLocations.includes(locationInput.trim())) {
      setAvailableLocations([...availableLocations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const removeLocation = (loc: string) => {
    setAvailableLocations(availableLocations.filter(l => l !== loc));
  };

  const handleBack = () => {
    if (isSingleSectionMode) {
      router.back();
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim()) {
        sonnerToast.error("Please enter your first name");
        return;
      }
      const phoneError = validatePhone(phone);
      if (phoneError) {
        sonnerToast.error(phoneError);
        return;
      }
    }
    if (step === 2) {
      if (!addressLine1.trim()) {
        sonnerToast.error("Please enter your address");
        return;
      }
      if (!city.trim()) {
        sonnerToast.error("Please enter your city");
        return;
      }
      if (!state) {
        sonnerToast.error("Please select your state");
        return;
      }
      const pincodeError = validatePinCode(pincode);
      if (pincodeError) {
        sonnerToast.error(pincodeError);
        return;
      }
    }
    if (step === 3) {
      if (selectedServices.length === 0) {
        sonnerToast.error("Please select at least one service");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSave = async () => {
    if (!csrfToken) {
      sonnerToast.error("Security token missing. Please refresh.");
      return;
    }

    // Validate before saving
    const phoneError = validatePhone(phone);
    if (phoneError) {
      sonnerToast.error(phoneError);
      return;
    }
    const pincodeError = validatePinCode(pincode);
    if (pincodeError) {
      sonnerToast.error(pincodeError);
      return;
    }

    setIsSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const dataToSend = {
        name: fullName,
        companyName: companyName.trim() || null,
        phone: phone.trim(),
        address: addressLine1.trim(),
        addressLine2: addressLine2.trim() || null,
        city: city.trim(),
        state: state.trim(),
        zipCode: pincode.trim(),
        country: 'India',
        category: category,
        experience: experience || null,
        bio: bio.trim() || null,
        specialties: selectedServices.slice(0, 3).join(', '),
        services: selectedServices,
        availableLocations: availableLocations.length > 0 ? availableLocations : [city.trim()],
        advanceBookingDays: parseInt(advanceBookingDays, 10),
        bookingType: bookingType,
        paymentMethods: paymentMethods,
        allowPartialPayment: allowPartialPayment,
        bookingInfo: [] // Keep for backward compatibility
      };

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'CSRF-Token': csrfToken },
        body: JSON.stringify(dataToSend),
        credentials: 'include',
      });

      if (response.ok) {
        // Force refresh auth context to update user data and prevent redirect loops
        await refreshUser(true);
        sonnerToast.success(isSingleSectionMode ? "Section updated!" : "Profile completed!");
        
        // Clear any stale session data
        try {
          sessionStorage.removeItem('laaiqa_user');
          sessionStorage.removeItem('laaiqa_session_expiry');
        } catch {
          // Ignore
        }
        
        // Small delay to ensure state is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 150));
        
        if (isSingleSectionMode) {
          router.back();
        } else {
          // Use replace to prevent back button issues
          router.replace('/artist?view=profile');
        }
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || errorData.message || "Failed to save profile";
        if (errorData.details) {
          const detailErrors = Object.values(errorData.details).join(', ');
          sonnerToast.error(`${errorMsg}: ${detailErrors}`);
        } else {
          sonnerToast.error(errorMsg);
        }
      }
    } catch {
      sonnerToast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  const currentSectionTitle = sectionParam ? SECTION_TITLES[sectionParam] || 'Edit Profile' : 'Vendor Details';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 px-4 py-4 flex items-center justify-between border-b border-gray-800">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold flex-1 text-center">{currentSectionTitle}</h1>
        <Avatar className="h-8 w-8">
          {userData?.image && <AvatarImage src={userData.image} />}
          <AvatarFallback className="bg-orange-500 text-white text-sm">
            {firstName?.[0] || 'A'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Progress Indicator - only show in wizard mode */}
      {!isSingleSectionMode && (
        <div className="px-4 py-3 flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[#C40F5A]' : 'bg-gray-700'}`} />
          ))}
        </div>
      )}

      <div className="px-4 pb-32">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[#C40F5A] font-medium mb-4">Basic Info</h2>
            
            <div>
              <Label className="text-gray-400 text-sm">First Name*</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="First Name" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Last Name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="Last Name" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Company/Studio Name</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="Company Name" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Phone Number* (10 digits)</Label>
              <Input 
                value={phone} 
                onChange={e => {
                  // Only allow digits, max 10
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(val);
                }} 
                type="tel"
                maxLength={10}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" 
                placeholder="9876543210" 
              />
              {phone && phone.length > 0 && phone.length < 10 && (
                <p className="text-orange-400 text-xs mt-1">{10 - phone.length} more digits needed</p>
              )}
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">E-mail</Label>
              <Input value={userData?.email || ''} disabled
                className="bg-[#1a1a1a] border-gray-700 text-gray-500 mt-1" />
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#C40F5A] font-medium mb-4">Location</h2>
            
            <p className="text-gray-400 text-sm mb-2">Enter your location manually</p>
            
            <div>
              <Label className="text-gray-400 text-sm">Address Line 1*</Label>
              <Input value={addressLine1} onChange={e => setAddressLine1(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Address Line 2</Label>
              <Input value={addressLine2} onChange={e => setAddressLine2(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-sm">State*</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-gray-700 max-h-[300px]">
                    {INDIAN_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">City*</Label>
                <Input value={city} onChange={e => setCity(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Pincode* (6 digits)</Label>
              <Input 
                value={pincode} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPincode(val);
                }}
                maxLength={6}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" 
                placeholder="560001"
              />
              {pincode && pincode.length > 0 && pincode.length < 6 && (
                <p className="text-orange-400 text-xs mt-1">{6 - pincode.length} more digits needed</p>
              )}
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Available Locations*</Label>
              <div className="flex gap-2 mt-1">
                <Input value={locationInput} onChange={e => setLocationInput(e.target.value)}
                  className="bg-[#2a2a2a] border-white text-white" placeholder="Type a location and press Enter" 
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLocation();
                    }
                  }} />
                <Button onClick={addLocation} size="sm" className="bg-[#EE2377] hover:bg-[#C40F5A]">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {availableLocations.map(loc => (
                  <span key={loc} className="bg-[#F46CA4] text-white px-4 py-2 rounded-md text-sm flex items-center gap-2">
                    {loc}
                    <button onClick={() => removeLocation(loc)} className="hover:text-[#EE2377] font-bold text-lg">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Professional Info */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[#C40F5A] font-medium mb-4">Professional Information</h2>
            
            <div>
              <Label className="text-gray-400 text-sm">Category*</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  <SelectItem value="Makeup Artist">Makeup Artist</SelectItem>
                  <SelectItem value="Hair Stylist">Hair Stylist</SelectItem>
                  <SelectItem value="Mehndi Artist">Mehndi Artist</SelectItem>
                  <SelectItem value="Photographer">Photographer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Experience</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {EXPERIENCE_OPTIONS.map(exp => (
                    <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Services Offered*</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  value={serviceInput} 
                  onChange={e => setServiceInput(e.target.value)}
                  className="bg-[#2a2a2a] border-white text-white" 
                  placeholder="Type a service and press Enter" 
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (serviceInput.trim() && !selectedServices.includes(serviceInput.trim())) {
                        setSelectedServices([...selectedServices, serviceInput.trim()]);
                        setServiceInput('');
                      }
                    }
                  }} 
                />
                <Button 
                  type="button"
                  onClick={() => {
                    if (serviceInput.trim() && !selectedServices.includes(serviceInput.trim())) {
                      setSelectedServices([...selectedServices, serviceInput.trim()]);
                      setServiceInput('');
                    }
                  }} 
                  size="sm" 
                  className="bg-[#EE2377] hover:bg-[#C40F5A]"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedServices.map(service => (
                  <span key={service} className="bg-[#F46CA4] text-white px-4 py-2 rounded-md text-sm flex items-center gap-2">
                    {service}
                    <button onClick={() => setSelectedServices(selectedServices.filter(s => s !== service))} 
                      className="hover:text-[#EE2377] font-bold text-lg">×</button>
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Bio / About</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1 min-h-[100px]"
                placeholder="Tell customers about yourself and your work..." />
            </div>
          </div>
        )}

        {/* Step 4: Booking & Scheduling */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-[#C40F5A] font-medium mb-4">Booking and Scheduling</h2>
            
            <div>
              <Label className="text-gray-400 text-sm">Advance Booking Requirement*</Label>
              <Select value={advanceBookingDays} onValueChange={setAdvanceBookingDays}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm mb-3 block">Booking Type</Label>
              <RadioGroup value={bookingType} onValueChange={(v) => setBookingType(v as 'approval' | 'instant')}
                className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="approval" id="approval" className="border-[#C40F5A] text-[#C40F5A]" />
                  <Label htmlFor="approval" className="text-white">Approval Needed</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="instant" id="instant" className="border-[#C40F5A] text-[#C40F5A]" />
                  <Label htmlFor="instant" className="text-white">Instant Booking</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm mb-3 block">Payment Information</Label>
              <p className="text-gray-500 text-xs mb-2">Receive payments via</p>
              <div className="space-y-2">
                {['Credit Cards', 'UPI Payment', 'Bank Transfer'].map(method => {
                  const key = method.toLowerCase().replace(' ', '_');
                  const isChecked = paymentMethods.includes(key);
                  return (
                    <button key={method} type="button" onClick={() => {
                      setPaymentMethods(prev => isChecked ? prev.filter(m => m !== key) : [...prev, key]);
                    }} className="flex items-center gap-2 w-full text-left">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-[#C40F5A] border-[#C40F5A]' : 'border-gray-600'
                      }`}>
                        {isChecked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-white">{method}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-white">Allow Partial payment</Label>
              <button onClick={() => setAllowPartialPayment(!allowPartialPayment)}
                className={`w-12 h-6 rounded-full transition-colors ${allowPartialPayment ? 'bg-[#EE2377]' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${allowPartialPayment ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex gap-3">
        {isSingleSectionMode ? (
          // Single section mode - just Save button
          <Button onClick={handleSave} disabled={isSaving}
            className="flex-1 h-14 bg-[#EE2377] hover:bg-[#C40F5A] text-white">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        ) : (
          // Wizard mode - Back/Next/Submit buttons
          <>
            {step > 1 && (
              <Button onClick={handleBack} variant="outline" 
                className="flex-1 h-14 border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white">
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={handleNext} className="flex-1 h-14 bg-[#EE2377] hover:bg-[#C40F5A] text-white">
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}
                className="flex-1 h-14 bg-[#EE2377] hover:bg-[#C40F5A] text-white">
                {isSaving ? 'Saving...' : 'Submit'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ArtistOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    }>
      <ArtistOnboardingContent />
    </Suspense>
  );
}
