import React, { useEffect, useState, useRef } from 'react';
import { User, Message } from '../types';
import { socket } from '../socket';
import { MessageCircle, Phone, Video, Info, ArrowLeft, Shield, Timer } from 'lucide-react';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

interface ChatProps {
  currentUser: User;
  activePartner: User | null;
  token: string;
  onBackToSidebar?: () => void;
}

export default function Chat({ currentUser, activePartner, token, onBackToSidebar }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [disappearingMode, setDisappearingMode] = useState<'off' | '24h' | '7d'>('off');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Derive unique Room ID
  const getRoomId = (id1: string, id2: string) => {
    return [id1, id2].sort().join('_');
  };

  const roomId = activePartner ? getRoomId(currentUser._id, activePartner._id) : '';

  // 1. Fetch message history & update online status
  useEffect(() => {
    if (!activePartner || !roomId) return;

    setPartnerOnline(activePartner.isOnline);
    setLoading(true);

    // 1.1 Load offline cached messages first so they are immediately visible
    const cached = localStorage.getItem(`ik_chat_cache_${roomId}`);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached history:', e);
      }
    } else {
      setMessages([]);
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/messages/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          const freshMessages = data.messages || [];
          setMessages(freshMessages);
          // Save fresh fetch to local cache
          localStorage.setItem(`ik_chat_cache_${roomId}`, JSON.stringify(freshMessages));
        } else {
          console.error('Failed to load messages:', data.error);
        }
      } catch (err) {
        console.error('History fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/chat/settings/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.disappearingMode) {
          setDisappearingMode(data.disappearingMode);
        } else {
          setDisappearingMode('off');
        }
      } catch (err) {
        console.error('Failed to load disappearing messages settings:', err);
        setDisappearingMode('off');
      }
    };

    fetchMessages();
    fetchSettings();

    // Join isolated socket room
    socket.emit('join_room', roomId);

  }, [activePartner, roomId, token]);

  // 2. Set up live socket listeners
  useEffect(() => {
    if (!roomId) return;

    // Handle incoming messages
    const handleMessageReceived = (msg: Message) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => {
          // Filter out matching temporary sent replicas
          const filtered = prev.filter((m) => {
            if (m._id.startsWith('temp_') && m.sender === msg.sender && m.text === msg.text) {
              return false;
            }
            return m._id !== msg._id;
          });
          return [...filtered, msg];
        });
      }
    };

    // Handle real-time user presence events
    const handlePresence = (data: { userId: string; isOnline: boolean }) => {
      if (activePartner && data.userId === activePartner._id) {
        setPartnerOnline(data.isOnline);
      }
    };

    // Handle real-time disappearing mode changes
    const handleDisappearingModeChanged = (data: { roomId: string; disappearingMode: 'off' | '24h' | '7d' }) => {
      if (data.roomId === roomId) {
        setDisappearingMode(data.disappearingMode);
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('user_presence', handlePresence);
    socket.on('disappearing_mode_changed', handleDisappearingModeChanged);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('user_presence', handlePresence);
      socket.off('disappearing_mode_changed', handleDisappearingModeChanged);
    };
  }, [roomId, activePartner]);

  // 3. Scroll to bottom on message updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 3.5 Sync messages to client local storage for absolute offline resilience
  useEffect(() => {
    if (roomId && messages.length > 0) {
      localStorage.setItem(`ik_chat_cache_${roomId}`, JSON.stringify(messages));
    }
  }, [messages, roomId]);

  // 3.6 Automatically drain and send offline pending messages upon regaining connection
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const syncPendingMessages = () => {
      if (!socket.connected) return;
      const pendingQueueKey = `ik_chat_pending_${roomId}`;
      try {
        const existingQueue = JSON.parse(localStorage.getItem(pendingQueueKey) || '[]');
        if (existingQueue.length === 0) return;

        console.log(`📡 [OFFLINE_SYNC] Resending ${existingQueue.length} queued offline messages...`);
        existingQueue.forEach((msg: Message) => {
          socket.emit('send_message', {
            roomId,
            senderId: currentUser._id,
            text: msg.text,
          });
        });

        // Drain queue
        localStorage.removeItem(pendingQueueKey);

        // Update UI to signify these are no longer offline-pending
        setMessages((prev) =>
          prev.map((m) => (m._id.startsWith('temp_') ? { ...m, pending: false } : m))
        );
      } catch (e) {
        console.error('Failed to sync offline queue:', e);
      }
    };

    socket.on('connect', syncPendingMessages);
    const fallbackInterval = setInterval(syncPendingMessages, 5000);

    return () => {
      socket.off('connect', syncPendingMessages);
      clearInterval(fallbackInterval);
    };
  }, [roomId, currentUser]);

  // 4. Send message handler
  const handleSendMessage = (text: string) => {
    if (!roomId || !text.trim()) return;

    let expiresAt: string | null = null;
    if (disappearingMode === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (disappearingMode === '7d') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const tempMessage: Message = {
      _id: 'temp_' + Date.now() + Math.random().toString(36).substring(2, 6),
      roomId,
      sender: currentUser._id,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      expiresAt,
      pending: !socket.connected,
    };

    // Optimistically render instantly in UI viewport to eliminate lagging / offline gap
    setMessages((prev) => [...prev, tempMessage]);

    if (socket.connected) {
      socket.emit('send_message', {
        roomId,
        senderId: currentUser._id,
        text: text.trim(),
      });
    } else {
      // Keep on offline queue
      const pendingQueueKey = `ik_chat_pending_${roomId}`;
      try {
        const existingQueue = JSON.parse(localStorage.getItem(pendingQueueKey) || '[]');
        existingQueue.push(tempMessage);
        localStorage.setItem(pendingQueueKey, JSON.stringify(existingQueue));
      } catch (e) {
        console.error('Failed to write to queue:', e);
      }
    }
  };

  const handleModeChange = async (mode: 'off' | '24h' | '7d') => {
    setDisappearingMode(mode);
    socket.emit('change_disappearing_mode', { roomId, disappearingMode: mode });
    try {
      await fetch(`/api/chat/settings/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ disappearingMode: mode }),
      });
    } catch (err) {
      console.error('Failed to update disappearing messages setting:', err);
    }
  };

  // Render empty state if no chat partner selected
  if (!activePartner) {
    return (
      <div className="flex-1 bg-black flex flex-col justify-center items-center p-8 text-center h-full">
        <div className="w-20 h-20 bg-[#050505] border border-[#262626] rounded-full flex items-center justify-center text-[#fafafa] mb-5 shadow-inner">
          <MessageCircle className="w-10 h-10 text-[#fafafa]" />
        </div>
        <h2 className="text-xl font-bold text-[#fafafa] font-sans tracking-tight">Your Messages</h2>
        <p className="text-sm text-[#a8a8a8] mt-1 max-w-xs leading-relaxed">
          Send private photos and messages to a friend or group. Select a contact on the left to start a thread!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black flex flex-col h-full overflow-hidden" id={`chat-workspace-${activePartner._id}`}>
      {/* Thread Header */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-black z-10">
        <div className="flex items-center gap-3">
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="md:hidden p-1.5 hover:bg-[#1a1a1a] rounded-lg text-[#a8a8a8] hover:text-[#fafafa] transition cursor-pointer"
              title="Return to thread directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <img
              src={activePartner.avatar}
              alt={activePartner.username}
              className="w-10 h-10 rounded-full border border-[#262626] object-cover"
              referrerPolicy="no-referrer"
            />
            {partnerOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
            )}
          </div>

          <div>
            <h3 className="font-bold text-[#fafafa] text-sm leading-tight hover:underline cursor-pointer">
              @{activePartner.username}
            </h3>
            <span className="text-[10px] uppercase font-bold text-[#a8a8a8] tracking-wider">
              {partnerOnline ? 'Active now' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-[#a8a8a8] hover:text-[#fafafa] rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer" title="Initiate Voice Call (Unavailable)">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 text-[#a8a8a8] hover:text-[#fafafa] rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer" title="Initiate Video Call (Unavailable)">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 text-[#a8a8a8] hover:text-[#fafafa] rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer" title="Thread Info">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Disappearing Messages Active Banner */}
      {disappearingMode !== 'off' && (
        <div className="bg-[#0c1a24] border-b border-[#213743]/50 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-blue-400 font-sans tracking-tight">
          <Timer className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>
            Disappearing messages: <strong className="font-bold uppercase tracking-wide text-[10px]">{disappearingMode === '24h' ? '24 Hours' : '7 Days'}</strong>
          </span>
        </div>
      )}

      {/* Message Flow Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-[#050505]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#a8a8a8] py-10">
            <span className="inline-block w-6 h-6 border-2 border-neutral-800 border-t-white rounded-full animate-spin mb-2"></span>
            <p className="text-xs font-semibold">Synchronizing dispatch...</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-full justify-end">
            {/* Conversation Introduction */}
            <div className="flex flex-col items-center text-center py-8 mb-6 border border-[#262626] bg-[#0c0c0c] rounded-xl p-5 shadow-lg max-w-sm mx-auto w-full">
              <img
                src={activePartner.avatar}
                alt={activePartner.username}
                className="w-16 h-16 rounded-full border border-[#262626] object-cover mb-3"
                referrerPolicy="no-referrer"
              />
              <h4 className="font-bold text-[#fafafa] text-sm">@{activePartner.username}</h4>
              <p className="text-xs text-[#a8a8a8] font-medium mt-0.5">IKChatMeet contact</p>
              <div className="flex items-center gap-1 mt-3 px-2 py-1 bg-[#1a1a1a] rounded-full text-[10px] text-[#a8a8a8] font-semibold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" /> End-to-End Encryption
              </div>
            </div>

            {/* Bubble Stream */}
            <div className="flex flex-col">
              {messages.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-6 italic">
                  No messages yet. Say hello to @{activePartner.username}!
                </p>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isSent={msg.sender === currentUser._id}
                    senderName={msg.sender === currentUser._id ? currentUser.username : activePartner.username}
                  />
                ))
              )}
              <div ref={messageEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input Tray */}
      <ChatInput
        onSendMessage={handleSendMessage}
        placeholder={`Message @${activePartner.username}...`}
        disappearingMode={disappearingMode}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
