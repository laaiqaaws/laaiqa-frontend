"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/types/user';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from 'lucide-react';
import { toast as sonnerToast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { INDIAN_STATES, validatePhone, validatePinCode, validateAge, validateHeight } from "@/lib/validation";

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
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  color?: string | null;
  ethnicity?: string | null;
  gender?: string | null;
  other?: string | null;
}

// Section mapping
const SECTION_MAP: Record<string, number> = {
  'basic': 1,
  'physical': 2,
  'location': 3,
  'preferences': 4,
};

const SECTION_TITLES: Record<string, string> = {
  'basic': 'Basic Info',
  'physical': 'Physical Details',
  'location': 'Location',
  'preferences': 'Preferences',
};

function CustomerOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const sectionParam = searchParams.get('section');
  const { user: authUser, csrfToken, isLoading: authLoading, refreshUser } = useAuth();
  
  // If section is specified, show only that section (single page mode)
  // Otherwise, show step-by-step wizard
  const isSingleSectionMode = isEditMode && sectionParam && SECTION_MAP[sectionParam];
  const initialStep = sectionParam && SECTION_MAP[sectionParam] ? SECTION_MAP[sectionParam] : 1;
  
  const [step, setStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  // Step 2: Physical Details
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [skinColor, setSkinColor] = useState('');
  const [ethnicity, setEthnicity] = useState('');

  // Step 3: Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Step 4: Preferences
  const [other, setOther] = useState('');

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
        
        if (serverUser.role !== 'customer') {
          if (serverUser.role === 'artist') {
            router.push('/profile/artist');
          } else if (serverUser.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/signup');
          }
          return;
        }
        
        setUserData(serverUser);
        
        // Pre-fill form
        setName(serverUser.name || '');
        setPhone(serverUser.phone || '');
        setAge(serverUser.age?.toString() || '');
        setGender(serverUser.gender || '');
        setHeight(serverUser.height?.toString() || '');
        setWeight(serverUser.weight?.toString() || '');
        setSkinColor(serverUser.color || '');
        setEthnicity(serverUser.ethnicity || '');
        setAddress(serverUser.address || '');
        setCity(serverUser.city || '');
        setState(serverUser.state || '');
        setPincode(serverUser.zipCode || '');
        setOther(serverUser.other || '');
      } catch {
        sonnerToast.error("Error loading data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullUserData();
  }, [authLoading, authUser, router]);

  const handleBack = () => {
    if (isSingleSectionMode) {
      router.back();
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const validateStep1 = (): string | null => {
    if (!name.trim()) return "Please enter your name";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (name.trim().length > 100) return "Name is too long";
    const phoneError = validatePhone(phone);
    if (phoneError) return phoneError;
    const ageError = validateAge(age);
    if (ageError) return ageError;
    return null;
  };

  const validateStep2 = (): string | null => {
    const heightError = validateHeight(height);
    if (heightError) return heightError;
    if (weight && (parseFloat(weight) < 20 || parseFloat(weight) > 300)) return "Please enter a valid weight (20-300 kg)";
    if (!skinColor.trim()) return "Please select your skin color";
    if (!ethnicity.trim()) return "Please enter your ethnicity";
    if (ethnicity.trim().length > 50) return "Ethnicity is too long";
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!address.trim()) return "Please enter your address";
    if (address.trim().length < 5) return "Address is too short";
    if (address.trim().length > 200) return "Address is too long";
    if (!city.trim()) return "Please enter your city";
    if (city.trim().length < 2) return "City name is too short";
    if (city.trim().length > 50) return "City name is too long";
    if (!state) return "Please select your state";
    const pincodeError = validatePinCode(pincode);
    if (pincodeError) return pincodeError;
    return null;
  };

  const validateStep4 = (): string | null => {
    if (other.trim().length > 500) return "Additional info is too long (max 500 characters)";
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const error = validateStep1();
      if (error) { sonnerToast.error(error); return; }
    }
    if (step === 2) {
      const error = validateStep2();
      if (error) { sonnerToast.error(error); return; }
    }
    if (step === 3) {
      const error = validateStep3();
      if (error) { sonnerToast.error(error); return; }
    }
    if (step === 4) {
      const error = validateStep4();
      if (error) { sonnerToast.error(error); return; }
    }
    setStep(step + 1);
  };

  const handleSave = async () => {
    if (!csrfToken) {
      sonnerToast.error("Security token missing. Please refresh.");
      return;
    }

    // Validate current section in single section mode, or all sections in wizard mode
    if (isSingleSectionMode) {
      let error: string | null = null;
      if (step === 1) error = validateStep1();
      else if (step === 2) error = validateStep2();
      else if (step === 3) error = validateStep3();
      else if (step === 4) error = validateStep4();
      if (error) { sonnerToast.error(error); return; }
    } else {
      // Validate all steps before final submit
      const step1Error = validateStep1();
      if (step1Error) { sonnerToast.error(step1Error); return; }
      const step2Error = validateStep2();
      if (step2Error) { sonnerToast.error(step2Error); return; }
      const step3Error = validateStep3();
      if (step3Error) { sonnerToast.error(step3Error); return; }
      const step4Error = validateStep4();
      if (step4Error) { sonnerToast.error(step4Error); return; }
    }

    setIsSaving(true);
    try {
      const dataToSend = {
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age) || null,
        gender: gender || null,
        height: parseFloat(height) || null,
        weight: weight ? parseFloat(weight) : null,
        color: skinColor.trim(),
        ethnicity: ethnicity.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: pincode.trim(),
        country: 'India',
        other: other.trim() || null
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
          router.replace('/customer?view=profile');
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

  const currentSectionTitle = sectionParam ? SECTION_TITLES[sectionParam] || 'Edit Profile' : 'Complete Your Profile';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 px-4 py-4 flex items-center justify-between border-b border-gray-800">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold flex-1 text-center">{currentSectionTitle}</h1>
        <Avatar className="h-8 w-8">
          {userData?.image && <AvatarImage src={userData.image} />}
          <AvatarFallback className="bg-orange-500 text-white text-sm">
            {name?.[0] || 'C'}
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
              <Label className="text-gray-400 text-sm">Full Name*</Label>
              <Input value={name} onChange={e => setName(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="Your full name" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Phone Number* (10 digits)</Label>
              <Input 
                value={phone} 
                onChange={e => {
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
              <Label className="text-gray-400 text-sm">Age* (18+)</Label>
              <Input 
                value={age} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setAge(val);
                }} 
                type="number"
                min={18}
                max={120}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" 
                placeholder="25" 
              />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">E-mail</Label>
              <Input value={userData?.email || ''} disabled
                className="bg-[#1a1a1a] border-gray-700 text-gray-500 mt-1" />
            </div>
          </div>
        )}

        {/* Step 2: Physical Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[#C40F5A] font-medium mb-4">Physical Details</h2>
            <p className="text-gray-500 text-sm mb-4">This helps artists prepare for your service</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-sm">Height (cm)*</Label>
                <Input value={height} onChange={e => setHeight(e.target.value)} type="number"
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="165" />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Weight (kg)</Label>
                <Input value={weight} onChange={e => setWeight(e.target.value)} type="number"
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="60" />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Skin Color/Tone*</Label>
              <Select value={skinColor} onValueChange={setSkinColor}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Select skin tone" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="olive">Olive</SelectItem>
                  <SelectItem value="tan">Tan</SelectItem>
                  <SelectItem value="brown">Brown</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Ethnicity*</Label>
              <Input value={ethnicity} onChange={e => setEthnicity(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="e.g., South Asian, East Asian" />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[#C40F5A] font-medium mb-4">Location</h2>
            
            <div>
              <Label className="text-gray-400 text-sm">Address*</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="Street address" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-sm">City*</Label>
                <Input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
              </div>
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
          </div>
        )}

        {/* Step 4: Additional Info */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-[#C40F5A] font-medium mb-4">Additional Information</h2>
            
            <div>
              <Label className="text-gray-400 text-sm">Any allergies or special requirements?</Label>
              <Textarea value={other} onChange={e => setOther(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1 min-h-[120px]"
                placeholder="e.g., Allergic to certain products, sensitive skin, specific preferences..." />
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 pb-6 flex gap-3 max-w-3xl mx-auto inset-x-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {isSingleSectionMode ? (
          // Single section mode - just Save button
          <Button onClick={handleSave} disabled={isSaving}
            className="flex-1 h-14 bg-[#EE2377] hover:bg-[#C40F5A] text-white">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        ) : (
          // Wizard mode - Back/Next/Complete buttons
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
                {isSaving ? 'Saving...' : 'Complete Profile'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CustomerOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    }>
      <CustomerOnboardingContent />
    </Suspense>
  );
}
