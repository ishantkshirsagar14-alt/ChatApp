import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Search, MessageCircle, Bell, Settings } from 'lucide-react';
import NotificationsPopover from './NotificationsPopover';

interface SidebarProps {
  currentUser: User;
  followedUsers: User[];
  activeChatUserId: string | null;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onOpenSearch: () => void;
  token: string;
  onEditProfileClick: () => void;
  onRefreshContacts: () => void;
}

export default function Sidebar({
  currentUser,
  followedUsers,
  activeChatUserId,
  onSelectUser,
  onLogout,
  onOpenSearch,
  token,
  onEditProfileClick,
  onRefreshContacts,
}: SidebarProps) {
  const [incomingCount, setIncomingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchIncomingCount = async () => {
    try {
      const response = await fetch('/api/follow/requests/incoming', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIncomingCount(data.requests?.length || 0);
      }
    } catch (e) {
      console.error('Failed to load notification count:', e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchIncomingCount();
      // Poll every 15s to keep notifications up to date
      const interval = setInterval(fetchIncomingCount, 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Handle refresh and count update
  const handleRefreshAndClose = () => {
    fetchIncomingCount();
    onRefreshContacts();
  };

  return (
    <div className="w-full md:w-80 border-r border-[#262626] bg-black flex flex-col h-full relative">
      {/* Current User Header */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-8 h-8 rounded-full border border-[#262626] object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={onEditProfileClick}
            className="font-bold text-[#fafafa] text-sm tracking-tight truncate hover:underline cursor-pointer text-left focus:outline-none"
            title="Edit Profile"
          >
            @{currentUser.username}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {/* Activity Requests Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-[#a8a8a8] hover:text-[#fafafa] rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer relative"
              title="Follow Requests"
            >
              <Bell className="w-4 h-4" />
              {incomingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>

          <button
            onClick={onEditProfileClick}
            className="p-1.5 text-[#a8a8a8] hover:text-[#fafafa] rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer"
            title="Edit Profile Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSearch}
            className="p-1.5 text-[#a8a8a8] hover:text-[#fafafa] rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer"
            title="Search registered users"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="p-1.5 text-[#a8a8a8] hover:text-red-400 rounded-lg hover:bg-red-950/20 transition cursor-pointer"
            title="Log out session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showNotifications && (
        <NotificationsPopover
          token={token}
          onClose={() => setShowNotifications(false)}
          onRefreshContacts={handleRefreshAndClose}
        />
      )}

      {/* Directory Action Header */}
      <div className="px-4 py-3 border-b border-[#262626] flex justify-between items-center bg-[#050505]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#a8a8a8]">
          Messages
        </span>
        <span className="text-[10px] bg-[#262626] text-[#fafafa] px-1.5 py-0.5 rounded-full font-bold">
          {followedUsers.length}
        </span>
      </div>

      {/* Contact Threads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#262626]">
        {followedUsers.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-10 h-10 bg-[#121212] border border-[#262626] rounded-full flex items-center justify-center text-neutral-400 mx-auto mb-3">
              <MessageCircle className="w-5 h-5 text-neutral-300" />
            </div>
            <p className="text-xs text-[#a8a8a8] leading-relaxed font-sans">
              No threads found.<br />Search users to follow them and start chatting!
            </p>
            <button
              onClick={onOpenSearch}
              className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              <Search className="w-3 h-3" /> Search users
            </button>
          </div>
        ) : (
          followedUsers.map((user) => {
            const isSelected = activeChatUserId === user._id;
            return (
              <button
                id={`thread-item-${user._id}`}
                key={user._id}
                onClick={() => onSelectUser(user)}
                className={`w-full flex items-center gap-3 p-4 text-left transition ${
                  isSelected
                    ? 'bg-[#1a1a1a]'
                    : 'bg-black hover:bg-[#121212]'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-11 h-11 rounded-full border border-[#262626] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-[#fafafa] text-sm truncate">
                      @{user.username}
                    </span>
                  </div>
                  <p className="text-xs text-[#a8a8a8] font-medium truncate">
                    {user.isOnline ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
