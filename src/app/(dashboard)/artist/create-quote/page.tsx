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
import { INDIAN_STATES } from "@/lib/validation";

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
  const [timeSlot, setTimeSlot] = useState('');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

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
    if (!timeSlot) {
      sonnerToast.error("Please select a time slot");
      return;
    }
    if (timeSlot === 'Custom' && (!customStartTime || !customEndTime)) {
      sonnerToast.error("Please select both start and end times for custom slot");
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
      
      // Determine final service time
      const finalServiceTime = timeSlot === 'Custom' 
        ? `${customStartTime} - ${customEndTime}`
        : timeSlot;

      const payload = {
        // Event & Schedule
        productType: finalEventType,
        serviceDate: format(eventDate, 'yyyy-MM-dd'),
        serviceTime: finalServiceTime,
        // Client Info
        clientFirstName: clientFirstName.trim() || null,
        clientLastName: clientLastName.trim() || null,
        clientGender: clientGender || null,
        clientDob: clientDob ? format(clientDob, 'yyyy-MM-dd') : null,
        clientPhone: clientPhone.trim() || null,
        clientEmail: clientEmail.trim() || null,
        // Location & Venue
        venueType: venueType || null,
        venueAddress: addressLine1.trim() || null,
        venueAddress2: addressLine2.trim() || null,
        venueCity: city.trim() || null,
        venueState: state || null,
        venuePincode: pincode.trim() || null,
        // Services Requested
        makeupType: makeupType || null,
        numberOfLooks: parseInt(numberOfLooks, 10) || 1,
        packageType: packageType || null,
        extraAddons: extraAddons,
        serviceNotes: serviceDetails.trim() || null,
        // Payment Details
        paymentType: paymentType,
        price: parseFloat(totalPrice),
        advanceAmount: advanceAmount ? parseFloat(advanceAmount) : null,
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
      <div className="w-full max-w-3xl mx-auto">
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
          <h2 className="text-white font-semibold mb-4">Basic Booking Info</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Client Name*</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input 
                  value={clientFirstName} 
                  onChange={e => setClientFirstName(e.target.value)}
                  placeholder="First Name"
                  className="bg-[#2a2a2a] border-white text-white"
                />
                <Input 
                  value={clientLastName} 
                  onChange={e => setClientLastName(e.target.value)}
                  placeholder="Last Name"
                  className="bg-[#2a2a2a] border-white text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-gray-400 text-sm">Gender</Label>
                <Select value={clientGender} onValueChange={setClientGender}>
                  <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-white">
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
                    <Button variant="outline" className="w-full mt-1 bg-[#2a2a2a] border-white text-white justify-start">
                      {clientDob ? format(clientDob, 'dd/MM/yyyy') : <span className="text-gray-500">Select</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#2a2a2a] border-white">
                    <Calendar 
                      mode="single" 
                      selected={clientDob} 
                      onSelect={setClientDob}
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                      defaultMonth={clientDob || new Date(2000, 0)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Phone Number* (10 digits)</Label>
              <Input 
                value={clientPhone} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setClientPhone(val);
                }}
                placeholder="9876543210"
                maxLength={10}
                className="bg-[#2a2a2a] border-white text-white mt-1"
              />
              {clientPhone && clientPhone.length > 0 && clientPhone.length < 10 && (
                <p className="text-orange-400 text-xs mt-1">{10 - clientPhone.length} more digits needed</p>
              )}
            </div>

            <div>
              <Label className="text-gray-400 text-sm">E-mail</Label>
              <Input 
                value={clientEmail} 
                onChange={e => setClientEmail(e.target.value)}
                placeholder="example@email.com"
                type="email"
                className="bg-[#2a2a2a] border-white text-white mt-1"
              />
            </div>
          </div>
        </section>

        {/* Event & Schedule */}
        <section>
          <h2 className="text-white font-semibold mb-4">Event & Schedule</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Event Type*</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                  <SelectValue placeholder="Select Function Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-white">
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
                  className="bg-[#2a2a2a] border-white text-white mt-2"
                />
              )}
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Event Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 bg-[#2a2a2a] border-white text-white justify-start">
                    {eventDate ? format(eventDate, 'dd/MM/yyyy') : <span className="text-gray-500">Enter Event Date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#2a2a2a] border-white">
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
              <Label className="text-gray-400 text-sm">Service Time Slot*</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white max-h-[300px]">
                  <SelectItem value="06:00 - 08:00 AM">6:00 AM - 8:00 AM (Early Morning)</SelectItem>
                  <SelectItem value="08:00 - 10:00 AM">8:00 AM - 10:00 AM (Morning)</SelectItem>
                  <SelectItem value="10:00 - 12:00 PM">10:00 AM - 12:00 PM (Late Morning)</SelectItem>
                  <SelectItem value="12:00 - 02:00 PM">12:00 PM - 2:00 PM (Afternoon)</SelectItem>
                  <SelectItem value="02:00 - 04:00 PM">2:00 PM - 4:00 PM (Mid Afternoon)</SelectItem>
                  <SelectItem value="04:00 - 06:00 PM">4:00 PM - 6:00 PM (Evening)</SelectItem>
                  <SelectItem value="06:00 - 08:00 PM">6:00 PM - 8:00 PM (Late Evening)</SelectItem>
                  <SelectItem value="08:00 - 10:00 PM">8:00 PM - 10:00 PM (Night)</SelectItem>
                  <SelectItem value="Full Day">Full Day Service</SelectItem>
                  <SelectItem value="Custom">Custom Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Time Pickers - Only show when Custom is selected */}
            {timeSlot === 'Custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-400 text-sm">Start Time*</Label>
                  <Select value={customStartTime} onValueChange={setCustomStartTime}>
                    <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white max-h-[250px]">
                      <SelectItem value="5:00 AM">5:00 AM</SelectItem>
                      <SelectItem value="5:30 AM">5:30 AM</SelectItem>
                      <SelectItem value="6:00 AM">6:00 AM</SelectItem>
                      <SelectItem value="6:30 AM">6:30 AM</SelectItem>
                      <SelectItem value="7:00 AM">7:00 AM</SelectItem>
                      <SelectItem value="7:30 AM">7:30 AM</SelectItem>
                      <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                      <SelectItem value="8:30 AM">8:30 AM</SelectItem>
                      <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                      <SelectItem value="9:30 AM">9:30 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                      <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="11:30 AM">11:30 AM</SelectItem>
                      <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                      <SelectItem value="12:30 PM">12:30 PM</SelectItem>
                      <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                      <SelectItem value="1:30 PM">1:30 PM</SelectItem>
                      <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                      <SelectItem value="2:30 PM">2:30 PM</SelectItem>
                      <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                      <SelectItem value="3:30 PM">3:30 PM</SelectItem>
                      <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                      <SelectItem value="4:30 PM">4:30 PM</SelectItem>
                      <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                      <SelectItem value="5:30 PM">5:30 PM</SelectItem>
                      <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                      <SelectItem value="6:30 PM">6:30 PM</SelectItem>
                      <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                      <SelectItem value="7:30 PM">7:30 PM</SelectItem>
                      <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                      <SelectItem value="8:30 PM">8:30 PM</SelectItem>
                      <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                      <SelectItem value="9:30 PM">9:30 PM</SelectItem>
                      <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">End Time*</Label>
                  <Select value={customEndTime} onValueChange={setCustomEndTime}>
                    <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white max-h-[250px]">
                      <SelectItem value="5:00 AM">5:00 AM</SelectItem>
                      <SelectItem value="5:30 AM">5:30 AM</SelectItem>
                      <SelectItem value="6:00 AM">6:00 AM</SelectItem>
                      <SelectItem value="6:30 AM">6:30 AM</SelectItem>
                      <SelectItem value="7:00 AM">7:00 AM</SelectItem>
                      <SelectItem value="7:30 AM">7:30 AM</SelectItem>
                      <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                      <SelectItem value="8:30 AM">8:30 AM</SelectItem>
                      <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                      <SelectItem value="9:30 AM">9:30 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                      <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="11:30 AM">11:30 AM</SelectItem>
                      <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                      <SelectItem value="12:30 PM">12:30 PM</SelectItem>
                      <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                      <SelectItem value="1:30 PM">1:30 PM</SelectItem>
                      <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                      <SelectItem value="2:30 PM">2:30 PM</SelectItem>
                      <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                      <SelectItem value="3:30 PM">3:30 PM</SelectItem>
                      <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                      <SelectItem value="4:30 PM">4:30 PM</SelectItem>
                      <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                      <SelectItem value="5:30 PM">5:30 PM</SelectItem>
                      <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                      <SelectItem value="6:30 PM">6:30 PM</SelectItem>
                      <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                      <SelectItem value="7:30 PM">7:30 PM</SelectItem>
                      <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                      <SelectItem value="8:30 PM">8:30 PM</SelectItem>
                      <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                      <SelectItem value="9:30 PM">9:30 PM</SelectItem>
                      <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                      <SelectItem value="10:30 PM">10:30 PM</SelectItem>
                      <SelectItem value="11:00 PM">11:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Location & Venue */}
        <section>
          <h2 className="text-white font-semibold mb-4">Location & Venue</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Venue Type*</Label>
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                  <SelectValue placeholder="Select Venue Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-white">
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
                className="bg-[#2a2a2a] border-white text-white mt-1"
              />
              <Input 
                value={addressLine2} 
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="Address Line 2"
                className="bg-[#2a2a2a] border-white text-white mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-gray-400 text-sm">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-white max-h-[300px]">
                    {INDIAN_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">City</Label>
                <Input 
                  value={city} 
                  onChange={e => setCity(e.target.value)}
                  className="bg-[#2a2a2a] border-white text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Pincode (6 digits)</Label>
              <Input 
                value={pincode} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPincode(val);
                }}
                maxLength={6}
                placeholder="560001"
                className="bg-[#2a2a2a] border-white text-white mt-1"
              />
            </div>
          </div>
        </section>

        {/* Services Requested */}
        <section>
          <h2 className="text-white font-semibold mb-4">Services Requested</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Makeup Type*</Label>
              <Select value={makeupType} onValueChange={setMakeupType}>
                <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                  <SelectValue placeholder="Select Makeup Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-white">
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
                className="bg-[#2a2a2a] border-white text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Package</Label>
              <Select value={packageType} onValueChange={setPackageType}>
                <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                  <SelectValue placeholder="Please Select a Package" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-white">
                  <SelectItem value="basic">Basic Package</SelectItem>
                  <SelectItem value="standard">Standard Package</SelectItem>
                  <SelectItem value="premium">Premium Package</SelectItem>
                  <SelectItem value="custom">Custom Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label className="text-white text-sm">Extra Add-ons</Label>
              <button 
                onClick={() => setExtraAddons(!extraAddons)}
                className={`rounded-full transition-colors relative ${extraAddons ? 'bg-[#EE2377]' : 'bg-gray-600'}`}
              >
                <div className={`bg-white rounded-full transition-transform ${extraAddons ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Additional Notes - Only show when Extra Add-ons is enabled */}
            {extraAddons && (
              <div>
                <Label className="text-gray-400 text-sm">Additional Notes</Label>
                <Textarea 
                  value={serviceDetails} 
                  onChange={e => setServiceDetails(e.target.value)}
                  placeholder="Any special requests or notes..."
                  className="bg-[#2a2a2a] border-white text-white mt-1 min-h-[80px]"
                />
              </div>
            )}
          </div>
        </section>

        {/* Payment Details */}
        <section>
          <h2 className="text-white font-semibold mb-4">Payment Details</h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-sm">Payment Type*</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger className="bg-[#2a2a2a] border-white text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-white">
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
                className="bg-[#2a2a2a] border-white text-white mt-1"
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
                  className="bg-[#2a2a2a] border-white text-white mt-1"
                />
              </div>
            )}
          </div>
        </section>
      </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 max-w-3xl mx-auto inset-x-0">
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-14 bg-[#EE2377] hover:bg-[#C40F5A] text-white font-medium rounded-xl"
        >
          {isSubmitting ? 'Creating...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
