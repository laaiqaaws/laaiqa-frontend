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

function CustomerOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const { user: authUser, csrfToken, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  // Step 2: Physical Details (for makeup services)
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
    
    if (authUser.role !== 'customer') {
      router.push(authUser.role === 'artist' ? '/profile/artist' : '/');
      return;
    }

    // Fetch full user data for form pre-fill
    const fetchFullUserData = async () => {
      try {
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
        if (!userRes.ok) return;

        const data = await userRes.json();
        setUserData(data.user);
        
        // Pre-fill form
        setName(data.user.name || '');
        setPhone(data.user.phone || '');
        setAge(data.user.age?.toString() || '');
        setGender(data.user.gender || '');
        setHeight(data.user.height?.toString() || '');
        setWeight(data.user.weight?.toString() || '');
        setSkinColor(data.user.color || '');
        setEthnicity(data.user.ethnicity || '');
        setAddress(data.user.address || '');
        setCity(data.user.city || '');
        setState(data.user.state || '');
        setPincode(data.user.zipCode || '');
        setOther(data.user.other || '');
      } catch (error) {
        sonnerToast.error("Error loading data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullUserData();
  }, [authLoading, authUser, router]);

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !phone.trim() || !age.trim()) {
        sonnerToast.error("Please fill in required fields");
        return;
      }
    }
    if (step === 2) {
      if (!height.trim() || !skinColor.trim() || !ethnicity.trim()) {
        sonnerToast.error("Please fill in required fields");
        return;
      }
    }
    if (step === 3) {
      if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        sonnerToast.error("Please fill in all address fields");
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
        sonnerToast.success(isEditMode ? "Profile updated!" : "Profile completed!");
        router.push('/customer?view=profile');
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
        <h1 className="text-lg font-semibold flex-1 text-center">Complete Your Profile</h1>
        <Avatar className="h-8 w-8">
          {userData?.image && <AvatarImage src={userData.image} />}
          <AvatarFallback className="bg-orange-500 text-white text-sm">
            {name?.[0] || 'C'}
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
              <Label className="text-gray-400 text-sm">Full Name*</Label>
              <Input value={name} onChange={e => setName(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="Your full name" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Phone Number*</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="+91 98765 43210" />
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Age*</Label>
              <Input value={age} onChange={e => setAge(e.target.value)} type="number"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" placeholder="25" />
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
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">State*</Label>
                <Input value={state} onChange={e => setState(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400 text-sm">Pincode*</Label>
              <Input value={pincode} onChange={e => setPincode(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1" />
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

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex gap-3">
        {step > 1 && (
          <Button onClick={handleBack} variant="outline" 
            className="flex-1 h-12 border-gray-600 text-white hover:bg-gray-800">
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
            {isSaving ? 'Saving...' : 'Complete Profile'}
          </Button>
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
