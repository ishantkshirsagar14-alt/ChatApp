import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, UserCheck, Clock } from 'lucide-react';

interface UserCardProps {
  key?: string;
  user: User;
  token: string;
  onFollowStatusChange?: (userId: string, isFollowing: boolean) => void;
}

export default function UserCard({ user, token, onFollowStatusChange }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isRequested, setIsRequested] = useState(user.hasPendingRequest || false);
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async () => {
    setLoading(true);
    
    // Choose endpoint:
    // If following or requested, click triggers /api/follow/unfollow to remove connections or requests.
    // If neither, click triggers /api/follow/request to send a pending follow request.
    const isUnfollowAction = isFollowing || isRequested;
    const apiEndpoint = isUnfollowAction ? '/api/follow/unfollow' : '/api/follow/request';
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: user._id }),
      });

      const data = await response.json();
      if (response.ok) {
        if (isUnfollowAction) {
          setIsFollowing(false);
          setIsRequested(false);
          if (onFollowStatusChange) {
            onFollowStatusChange(user._id, false);
          }
        } else {
          setIsRequested(true);
        }
      } else {
        console.error('Follow request toggle error:', data.error);
        alert(data.error || 'Failed to complete action');
      }
    } catch (error) {
      console.error('Follow toggle catch block:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[#121212] border border-[#262626] rounded-xl hover:border-[#3a3a3a] transition-all duration-150 shadow-md" id={`user-card-${user._id}`}>
      <div className="flex items-center gap-3">
        <div className="relative font-sans">
          <img
            src={user.avatar}
            alt={user.username}
            className="w-12 h-12 rounded-full border border-[#262626] object-cover"
            referrerPolicy="no-referrer"
          />
          {user.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121212] rounded-full" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-[#fafafa] text-sm">@{user.username}</h3>
          <p className="text-xs text-[#a8a8a8] font-medium">Joined User</p>
        </div>
      </div>

      <button
        id={`follow-btn-${user._id}`}
        disabled={loading}
        onClick={handleFollowToggle}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold select-none flex items-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50 ${
          isFollowing
            ? 'bg-[#262626] text-[#fafafa] hover:bg-[#333] border border-[#262626]'
            : isRequested
            ? 'bg-[#1a1a1a] text-[#a8a8a8] hover:text-white border border-[#262626]'
            : 'bg-[#0095f6] text-white hover:bg-[#38b7ff]'
        }`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            <span>Following</span>
          </>
        ) : isRequested ? (
          <>
            <Clock className="w-3.5 h-3.5 text-[#0095f6]" />
            <span>Requested</span>
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Follow</span>
          </>
        )}
      </button>
    </div>
  );
}
