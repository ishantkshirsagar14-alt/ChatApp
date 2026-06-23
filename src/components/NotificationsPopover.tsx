import React, { useEffect, useState } from 'react';
import { FollowRequest } from '../types';
import { UserCheck, UserX, X, BellOff, MessageSquare } from 'lucide-react';

interface NotificationsPopoverProps {
  token: string;
  onClose: () => void;
  onRefreshContacts: () => void;
}

export default function NotificationsPopover({
  token,
  onClose,
  onRefreshContacts,
}: NotificationsPopoverProps) {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/follow/requests/incoming', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Fetch requests catch block:', err);
      setError('Connection failure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleAccept = async (requestId: string) => {
    try {
      const response = await fetch('/api/follow/requests/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      if (response.ok) {
        // Remove from list
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        // Refresh contact threat list
        onRefreshContacts();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Accept request error:', error);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const response = await fetch('/api/follow/requests/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Decline request error:', error);
    }
  };

  return (
    <div className="absolute top-16 left-0 right-0 z-40 m-4 p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl shadow-2xl text-[#fafafa] flex flex-col max-h-[350px] animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2.5 mb-2.5">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#a8a8a8]">
          <MessageSquare className="w-4 h-4 text-[#0095f6]" />
          <span>Follow Requests ({requests.length})</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-[#1e1e1e] cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-[#a8a8a8]">
            <span className="inline-block w-4 h-4 border-2 border-neutral-800 border-t-white rounded-full animate-spin mr-2" />
            Loading requests...
          </div>
        ) : error ? (
          <p className="text-xs text-red-400 font-semibold text-center py-4">{error}</p>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BellOff className="w-8 h-8 text-neutral-600 mb-2.5" />
            <p className="text-xs text-[#a8a8a8] leading-relaxed">No pending follow requests present</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="flex items-center justify-between gap-3 bg-[#121212] p-2.5 rounded-lg border border-[#232323]">
              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src={req.sender.avatar} 
                  alt={req.sender.username} 
                  className="w-10 h-10 rounded-full border border-[#262626] object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#fafafa] truncate">@{req.sender.username}</p>
                  <p className="text-[10px] text-[#a8a8a8] mt-0.5 truncate font-medium">Wants to follow you</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAccept(req._id)}
                  className="p-1.5 bg-[#0095f6] hover:bg-[#38b7ff] text-white rounded-md transition cursor-pointer"
                  title="Accept request"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDecline(req._id)}
                  className="p-1.5 bg-[#262626] hover:bg-[#333] border border-[#262626] text-[#fafafa] rounded-md transition cursor-pointer"
                  title="Decline request"
                >
                  <UserX className="w-3.5 h-3.5 text-neutral-400 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
