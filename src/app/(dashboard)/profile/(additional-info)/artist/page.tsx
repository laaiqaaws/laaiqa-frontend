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

const SERVICE_OPTIONS = [
  'Bridal Makeup', 'Engagement Makeup', 'Reception Makeup', 'Party Makeup',
  'Photoshoot Makeup', 'Pre-wedding Makeup', 'Fashion Makeup', 'HD Makeup',
  'Airbrush Makeup', 'Hair Styling', 'Mehndi/Henna', 'Saree Draping'
];

const EXPERIENCE_OPTIONS = [
  '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'
];

function ArtistOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const { user: authUser, csrfToken, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
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

    // Fetch full user data from server (not cached) to get accurate role
    const fetchFullUserData = async () => {
      try {
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const data = await userRes.json();
        const serverUser = data.user;
        
        // Check role from server response (most accurate)
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
      } catch (error) {
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



  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !phone.trim()) {
        sonnerToast.error("Please fill in required fields");
        return;
      }
    }
    if (step === 2) {
      if (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        sonnerToast.error("Please fill in all address fields");
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

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!csrfToken) {
      sonnerToast.error("Security token missing. Please refresh.");
      return;
    }

    setIsSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const dataToSend = {
        name: fullName,
        phone: phone.trim(),
        address: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: pincode.trim(),
        country: 'India',
        bio: bio.trim() || `Professional ${category} with ${experience} of experience.`,
        specialties: selectedServices.slice(0, 3).join(', '),
        services: selectedServices,
        availableLocations: availableLocations.length > 0 ? availableLocations : [city.trim()],
        bookingInfo: [
          `Advance booking: ${advanceBookingDays} days`,
          `Booking type: ${bookingType === 'approval' ? 'Approval needed' : 'Instant booking'}`,
          `Payment: ${paymentMethods.join(', ')}`,
          allowPartialPayment ? 'Partial payment accepted' : 'Full payment required'
        ]
      };

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'CSRF-Token': csrfToken },
        body: JSON.stringify(dataToSend),
        credentials: 'include',
      });

      if (response.ok) {
        sonnerToast.success(isEditMode ? "Profile updated!" : "Profile completed!");
        router.push('/artist?view=profile');
      } else {
        const errorData = await response.json();
        sonnerToast.error(errorData.message || "Failed to save profile");
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 px-4 py-4 flex items-center justify-between border-b border-gray-800">
        {step > 1 && (
          <button onClick={handleBack} className="p-2 -ml-2">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-lg font-semibold flex-1 text-center">Vendor Details</h1>
        <Avatar className="h-8 w-8">
          {userData?.image && <AvatarImage src={userData.image} />}
          <AvatarFallback className="bg-orange-500 text-white text-sm">
            {firstName?.[0] || 'A'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Progress Indicator */}
      <div className="px-4 py-3 flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[#C40F5A]' : 'bg-gray-700'}`} />
        ))}
      </div>

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
              <Label className="text-gray-400 text-sm">Phone Number*</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="+91 98765 43210" />
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
                <Input value={state} onChange={e => setState(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">City*</Label>
                <Input value={city} onChange={e => setCity(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Pincode*</Label>
              <Input value={pincode} onChange={e => setPincode(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Available Locations</Label>
              <div className="flex gap-2 mt-1">
                <Input value={locationInput} onChange={e => setLocationInput(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white" placeholder="Add location" 
                  onKeyDown={e => e.key === 'Enter' && addLocation()} />
                <Button onClick={addLocation} size="sm" className="bg-[#C40F5A] hover:bg-[#EE2377]">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableLocations.map(loc => (
                  <span key={loc} className="bg-[#C40F5A]/20 text-[#EE2377] px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {loc}
                    <button onClick={() => removeLocation(loc)} className="ml-1 hover:text-[#C40F5A]">×</button>
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
              <Select onValueChange={(value) => {
                if (value && !selectedServices.includes(value)) {
                  setSelectedServices([...selectedServices, value]);
                }
              }}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Search services" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {SERVICE_OPTIONS.filter(s => !selectedServices.includes(s)).map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Selected services as tag chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedServices.map(service => (
                  <span key={service} className="bg-[#C40F5A] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                    {service}
                    <button onClick={() => setSelectedServices(selectedServices.filter(s => s !== service))} 
                      className="hover:text-[#EE2377] font-bold">×</button>
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
                className={`w-12 h-6 rounded-full transition-colors ${allowPartialPayment ? 'bg-[#C40F5A]' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${allowPartialPayment ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex gap-3">
        {step > 1 && (
          <Button onClick={handleBack} variant="outline" 
            className="flex-1 h-12 border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white">
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={handleNext} className="flex-1 h-12 bg-[#C40F5A] hover:bg-[#EE2377] text-white">
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSaving}
            className="flex-1 h-12 bg-[#C40F5A] hover:bg-[#EE2377] text-white">
            {isSaving ? 'Saving...' : 'Submit'}
          </Button>
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
