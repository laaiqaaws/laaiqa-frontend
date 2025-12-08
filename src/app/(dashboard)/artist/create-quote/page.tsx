"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/types/user';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { toast as sonnerToast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";

const EVENT_TYPES = [
  'Bridal Makeup',
  'Engagement Makeup', 
  'Reception Makeup',
  'Party Makeup',
  'Photoshoot Makeup',
  'Pre-wedding Makeup',
  'Fashion Makeup',
  'Mehndi/Henna',
  'Hair Styling',
  'Saree Draping',
  'Other'
];

const VENUE_TYPES = [
  'Client Location',
  'My Studio',
  'Hotel/Resort',
  'Wedding Venue',
  'Outdoor Location',
  'Other'
];

const MAKEUP_TYPES = [
  'Natural',
  'Glam',
  'HD',
  'Matte',
  'Dewy',
  'Airbrush',
  'Other'
];

const PAYMENT_TYPES = [
  'Full Amount',
  'Advance Amount',
  'Token Amount'
];

export default function CreateQuotePage() {
  const router = useRouter();
  const { user, csrfToken, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic Booking Info
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientGender, setClientGender] = useState('');
  const [clientDob, setClientDob] = useState<Date | undefined>();
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Event & Schedule
  const [eventType, setEventType] = useState('');
  const [otherEventType, setOtherEventType] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Location & Venue
  const [venueType, setVenueType] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Services Requested
  const [makeupType, setMakeupType] = useState('');
  const [numberOfLooks, setNumberOfLooks] = useState('1');
  const [packageType, setPackageType] = useState('');
  const [extraAddons, setExtraAddons] = useState(false);
  const [serviceDetails, setServiceDetails] = useState('');

  // Payment Details
  const [paymentType, setPaymentType] = useState('Full Amount');
  const [totalPrice, setTotalPrice] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'artist') {
        router.push('/');
      }
    }
  }, [authLoading, user, router]);

  const handleSubmit = async () => {
    // Validation
    if (!eventType) {
      sonnerToast.error("Please select an event type");
      return;
    }
    if (!eventDate) {
      sonnerToast.error("Please select an event date");
      return;
    }
    if (!startTime) {
      sonnerToast.error("Please enter a start time");
      return;
    }
    if (!totalPrice || parseFloat(totalPrice) <= 0) {
      sonnerToast.error("Please enter a valid price");
      return;
    }
    if (!csrfToken) {
      sonnerToast.error("Security token missing. Please refresh.");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalEventType = eventType === 'Other' ? otherEventType : eventType;
      
      // Build details string
      const detailsParts = [];
      if (clientFirstName || clientLastName) {
        detailsParts.push(`Client: ${clientFirstName} ${clientLastName}`.trim());
      }
      if (clientPhone) detailsParts.push(`Phone: ${clientPhone}`);
      if (venueType) detailsParts.push(`Venue: ${venueType}`);
      if (addressLine1) {
        const fullAddress = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(', ');
        detailsParts.push(`Address: ${fullAddress}`);
      }
      if (makeupType) detailsParts.push(`Makeup: ${makeupType}`);
      if (numberOfLooks !== '1') detailsParts.push(`Looks: ${numberOfLooks}`);
      if (serviceDetails) detailsParts.push(`Notes: ${serviceDetails}`);

      const payload = {
        productType: finalEventType,
        details: detailsParts.join(' | ') || 'Booking details pending',
        price: parseFloat(totalPrice),
        serviceDate: format(eventDate, 'yyyy-MM-dd'),
        serviceTime: startTime,
      };

      const response = await fetch(`${API_BASE_URL}/api/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Invalidate quotes cache so dashboard fetches fresh data
        sessionStorage.removeItem('laaiqa_artist_quotes');
        sessionStorage.removeItem('laaiqa_artist_quotes_expiry');
        sonnerToast.success("Booking created successfully!");
        router.push('/artist?view=bookings');
      } else {
        sonnerToast.error(data.message || "Failed to create booking");
      }
    } catch (error) {
      sonnerToast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 px-4 py-4 flex items-center gap-3 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold">Add Booking</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Basic Booking Info */}
        <section>
          <h2 className="text-[#C40F5A] font-semibold mb-4">Basic Booking Info</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Client Name*</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input 
                  value={clientFirstName} 
                  onChange={e => setClientFirstName(e.target.value)}
                  placeholder="First Name"
                  className="bg-[#2a2a2a] border-gray-700 text-white"
                />
                <Input 
                  value={clientLastName} 
                  onChange={e => setClientLastName(e.target.value)}
                  placeholder="Last Name"
                  className="bg-[#2a2a2a] border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-gray-400 text-sm">Gender</Label>
                <Select value={clientGender} onValueChange={setClientGender}>
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-gray-700">
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-1 bg-[#2a2a2a] border-gray-700 text-white justify-start">
                      {clientDob ? format(clientDob, 'dd/MM/yyyy') : <span className="text-gray-500">Select</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#2a2a2a] border-gray-700">
                    <Calendar mode="single" selected={clientDob} onSelect={setClientDob} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Phone Number*</Label>
              <div className="flex gap-2 mt-1">
                <Select defaultValue="+91">
                  <SelectTrigger className="w-20 bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-gray-700">
                    <SelectItem value="+91">+91</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  value={clientPhone} 
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 bg-[#2a2a2a] border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">E-mail</Label>
              <Input 
                value={clientEmail} 
                onChange={e => setClientEmail(e.target.value)}
                placeholder="example@email.com"
                type="email"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
              />
            </div>
          </div>
        </section>

        {/* Event & Schedule */}
        <section>
          <h2 className="text-[#C40F5A] font-semibold mb-4">Event & Schedule</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Event Type*</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Select Function Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventType === 'Other' && (
                <Input 
                  value={otherEventType}
                  onChange={e => setOtherEventType(e.target.value)}
                  placeholder="Specify event type"
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-2"
                />
              )}
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Event Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 bg-[#2a2a2a] border-gray-700 text-white justify-start">
                    {eventDate ? format(eventDate, 'dd/MM/yyyy') : <span className="text-gray-500">Enter Event Date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#2a2a2a] border-gray-700">
                  <Calendar 
                    mode="single" 
                    selected={eventDate} 
                    onSelect={setEventDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Start Time*</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Select value={startTime.split(':')[0] || ''} onValueChange={(h) => setStartTime(`${h}:${startTime.split(':')[1] || '00'}`)}>
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 max-h-[200px]">
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = (i + 1).toString().padStart(2, '0');
                      return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                <Select value={startTime.split(':')[1] || ''} onValueChange={(m) => setStartTime(`${startTime.split(':')[0] || '09'}:${m}`)}>
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 max-h-[200px]">
                    {['00', '15', '30', '45'].map(min => (
                      <SelectItem key={min} value={min}>{min}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={parseInt(startTime.split(':')[0] || '9') >= 12 ? 'PM' : 'AM'} 
                  onValueChange={(period) => {
                    const currentHour = parseInt(startTime.split(':')[0] || '9');
                    let newHour = currentHour;
                    if (period === 'PM' && currentHour < 12) newHour = currentHour + 12;
                    if (period === 'AM' && currentHour >= 12) newHour = currentHour - 12;
                    setStartTime(`${newHour.toString().padStart(2, '0')}:${startTime.split(':')[1] || '00'}`);
                  }}
                >
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">End Time (Optional)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Select value={endTime.split(':')[0] || ''} onValueChange={(h) => setEndTime(`${h}:${endTime.split(':')[1] || '00'}`)}>
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 max-h-[200px]">
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = (i + 1).toString().padStart(2, '0');
                      return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                <Select value={endTime.split(':')[1] || ''} onValueChange={(m) => setEndTime(`${endTime.split(':')[0] || '17'}:${m}`)}>
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 max-h-[200px]">
                    {['00', '15', '30', '45'].map(min => (
                      <SelectItem key={min} value={min}>{min}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={parseInt(endTime.split(':')[0] || '17') >= 12 ? 'PM' : 'AM'} 
                  onValueChange={(period) => {
                    const currentHour = parseInt(endTime.split(':')[0] || '17');
                    let newHour = currentHour;
                    if (period === 'PM' && currentHour < 12) newHour = currentHour + 12;
                    if (period === 'AM' && currentHour >= 12) newHour = currentHour - 12;
                    setEndTime(`${newHour.toString().padStart(2, '0')}:${endTime.split(':')[1] || '00'}`);
                  }}
                >
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Location & Venue */}
        <section>
          <h2 className="text-[#C40F5A] font-semibold mb-4">Location & Venue</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Venue Type*</Label>
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Select Venue Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {VENUE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Venue Address</Label>
              <Input 
                value={addressLine1} 
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="Address Line 1"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
              />
              <Input 
                value={addressLine2} 
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="Address Line 2"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-gray-400 text-sm">State</Label>
                <Input 
                  value={state} 
                  onChange={e => setState(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">City</Label>
                <Input 
                  value={city} 
                  onChange={e => setCity(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Pincode</Label>
              <Input 
                value={pincode} 
                onChange={e => setPincode(e.target.value)}
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
              />
            </div>
          </div>
        </section>

        {/* Services Requested */}
        <section>
          <h2 className="text-[#C40F5A] font-semibold mb-4">Services Requested</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Makeup Type*</Label>
              <Select value={makeupType} onValueChange={setMakeupType}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Select Makeup Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {MAKEUP_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Number of Looks</Label>
              <Input 
                value={numberOfLooks} 
                onChange={e => setNumberOfLooks(e.target.value)}
                placeholder="Ex. 2"
                type="number"
                min="1"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Package</Label>
              <Select value={packageType} onValueChange={setPackageType}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Please Select a Package" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  <SelectItem value="basic">Basic Package</SelectItem>
                  <SelectItem value="standard">Standard Package</SelectItem>
                  <SelectItem value="premium">Premium Package</SelectItem>
                  <SelectItem value="custom">Custom Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label className="text-white">Extra Add-ons</Label>
              <button 
                onClick={() => setExtraAddons(!extraAddons)}
                className={`w-12 h-6 rounded-full transition-colors ${extraAddons ? 'bg-[#C40F5A]' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${extraAddons ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Additional Notes</Label>
              <Textarea 
                value={serviceDetails} 
                onChange={e => setServiceDetails(e.target.value)}
                placeholder="Any special requests or notes..."
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1 min-h-[80px]"
              />
            </div>
          </div>
        </section>

        {/* Payment Details */}
        <section>
          <h2 className="text-[#C40F5A] font-semibold mb-4">Payment Details</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Payment Type*</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {PAYMENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Total Price (₹)*</Label>
              <Input 
                value={totalPrice} 
                onChange={e => setTotalPrice(e.target.value)}
                placeholder="Enter amount"
                type="number"
                min="0"
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
              />
            </div>

            {paymentType !== 'Full Amount' && (
              <div>
                <Label className="text-gray-400 text-sm">Advance Amount (₹)</Label>
                <Input 
                  value={advanceAmount} 
                  onChange={e => setAdvanceAmount(e.target.value)}
                  placeholder="Enter advance amount"
                  type="number"
                  min="0"
                  className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4">
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 bg-[#C40F5A] hover:bg-[#EE2377] text-white font-medium rounded-xl"
        >
          {isSubmitting ? 'Creating...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
