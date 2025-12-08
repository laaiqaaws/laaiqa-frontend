"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/types/user';
import { useAuth } from '@/lib/auth-context';
import { ChevronLeft, AlertTriangle, Clock, CheckCircle, XCircle, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast as sonnerToast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Dispute {
  id: string;
  reason: string;
  details: string | null;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  quoteId: string;
  initiatorId: string;
  involvedId: string | null;
  initiatorRole?: 'artist' | 'customer';
}

interface Quote {
  id: string;
  productType: string;
  status: string;
  serviceDate: string;
  customerName?: string | null;
  disputes?: Dispute[];
}

const STATUS_CONFIG = {
  'Open': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  'Under Review': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: MessageSquare },
  'Resolved': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  'Closed': { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle },
};

export default function ArtistDisputesPage() {
  const router = useRouter();
  const { user, csrfToken, isLoading: authLoading } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closingDisputeId, setClosingDisputeId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const quotesRes = await fetch(`${API_BASE_URL}/api/quotes/artist`, { credentials: 'include' });
      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        setQuotes(quotesData);
        const allDisputes: Dispute[] = [];
        quotesData.forEach((quote: Quote) => {
          if (quote.disputes) {
            quote.disputes.forEach(d => allDisputes.push({ ...d, quoteId: quote.id }));
          }
        });
        setDisputes(allDisputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      sonnerToast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'artist') {
        router.push(user.role === 'customer' ? '/customer' : '/');
        return;
      }
      fetchData();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router, fetchData]);

  const handleCreateDispute = async () => {
    if (!selectedQuoteId || !disputeReason.trim() || !csrfToken) {
      sonnerToast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/quotes/${selectedQuoteId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CSRF-Token': csrfToken },
        body: JSON.stringify({ reason: disputeReason, details: disputeDetails || null }),
        credentials: 'include',
      });

      if (res.ok) {
        sonnerToast.success('Dispute created successfully');
        setShowCreateDialog(false);
        setSelectedQuoteId('');
        setDisputeReason('');
        setDisputeDetails('');
        fetchData();
      } else {
        const data = await res.json();
        sonnerToast.error(data.message || 'Failed to create dispute');
      }
    } catch (error) {
      sonnerToast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDispute = async (disputeId: string) => {
    if (!csrfToken) return;
    
    setClosingDisputeId(disputeId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/quotes/disputes/${disputeId}/close`, {
        method: 'POST',
        headers: { 'CSRF-Token': csrfToken },
        credentials: 'include',
      });

      if (res.ok) {
        sonnerToast.success('Dispute closed');
        fetchData();
      } else {
        const data = await res.json();
        sonnerToast.error(data.message || 'Failed to close dispute');
      }
    } catch (error) {
      sonnerToast.error('Network error');
    } finally {
      setClosingDisputeId(null);
    }
  };

  // Quotes eligible for dispute (has customer assigned, not cancelled)
  const eligibleQuotes = quotes.filter(q => 
    ['Accepted', 'Booked', 'Completed'].includes(q.status) &&
    q.customerName &&
    !q.disputes?.some(d => d.status !== 'Closed')
  );

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C40F5A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="w-full max-w-3xl mx-auto">
      <div className="sticky top-0 bg-black z-10 px-4 py-4 flex items-center gap-3 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold flex-1">My Disputes</h1>
        {eligibleQuotes.length > 0 && (
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="bg-[#C40F5A] hover:bg-[#EE2377]">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        )}
      </div>

      <div className="px-4 py-4">
        {disputes.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">No Disputes</h2>
            <p className="text-gray-500 mb-6">You haven't raised any disputes yet.</p>
            {eligibleQuotes.length > 0 && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-[#C40F5A] hover:bg-[#EE2377]">
                <Plus className="h-4 w-4 mr-2" /> Create Dispute
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map(dispute => {
              const quote = quotes.find(q => q.id === dispute.quoteId);
              const StatusIcon = STATUS_CONFIG[dispute.status]?.icon || Clock;
              const isInitiator = dispute.initiatorId === user?.id;
              const raisedByCustomer = dispute.initiatorRole === 'customer';
              
              return (
                <div key={dispute.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-gray-400">Quote: {quote?.productType || 'Unknown'}</p>
                        {raisedByCustomer && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Raised by Customer
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {quote?.serviceDate ? format(parseISO(quote.serviceDate), 'dd MMM yyyy') : 'N/A'}
                        {quote?.customerName && ` • ${quote.customerName}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${STATUS_CONFIG[dispute.status]?.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {dispute.status}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-white font-medium">{dispute.reason}</p>
                    {dispute.details && <p className="text-gray-400 text-sm mt-1">{dispute.details}</p>}
                  </div>

                  {dispute.resolution && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
                      <p className="text-green-400 text-sm font-medium">Resolution:</p>
                      <p className="text-gray-300 text-sm">{dispute.resolution}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Created {format(parseISO(dispute.createdAt), 'dd MMM yyyy')}</span>
                    {isInitiator && dispute.status === 'Open' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCloseDispute(dispute.id)}
                        disabled={closingDisputeId === dispute.id}
                        className="text-xs h-9 px-3 border-gray-600 text-gray-300 bg-transparent hover:bg-gray-800"
                      >
                        {closingDisputeId === dispute.id ? 'Closing...' : 'Close'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Dispute</DialogTitle>
            <DialogDescription className="text-gray-400">
              Raise a dispute for an issue with a booking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-400">Select Booking*</Label>
              <select 
                value={selectedQuoteId} 
                onChange={e => setSelectedQuoteId(e.target.value)}
                className="w-full mt-1 bg-[#2a2a2a] border border-gray-700 rounded-lg p-3 text-white"
              >
                <option value="">Select a booking</option>
                {eligibleQuotes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.productType} - {q.customerName} - {format(parseISO(q.serviceDate), 'dd MMM')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label className="text-gray-400">Reason*</Label>
              <Textarea 
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="Briefly describe the issue..."
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
              />
            </div>
            
            <div>
              <Label className="text-gray-400">Additional Details</Label>
              <Textarea 
                value={disputeDetails}
                onChange={e => setDisputeDetails(e.target.value)}
                placeholder="Any additional information..."
                className="bg-[#2a2a2a] border-gray-700 text-white mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-600 text-gray-300 bg-transparent hover:bg-gray-800">
              Cancel
            </Button>
            <Button onClick={handleCreateDispute} disabled={isSubmitting} className="bg-[#C40F5A] hover:bg-[#EE2377]">
              {isSubmitting ? 'Creating...' : 'Create Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
