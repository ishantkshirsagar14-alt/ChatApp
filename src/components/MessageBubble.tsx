import React from 'react';
import { Message } from '../types';
import { Timer, Clock } from 'lucide-react';

interface MessageBubbleProps {
  key?: string;
  message: Message;
  isSent: boolean;
  senderName: string;
}

export default function MessageBubble({ message, isSent, senderName }: MessageBubbleProps) {
  // Format to standard localized readable time (hour:minute)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      className={`flex flex-col max-w-[75%] ${isSent ? 'self-end items-end' : 'self-start items-start'} space-y-1 mb-2`}
      id={`msg-bubble-${message._id}`}
    >
      <div
        className={`px-4 py-2.5 rounded-2xl text-sm ${
          isSent
            ? `${message.pending ? 'bg-[#333] opacity-75' : 'bg-gradient-to-tr from-[#405de6] to-[#833ab4]'} text-white rounded-br-sm shadow-md`
            : 'bg-[#262626] text-[#fafafa] rounded-bl-sm border border-[#262626] shadow-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
      </div>
      <span className="text-[10px] text-[#a8a8a8] font-mono font-medium px-1 flex items-center gap-1">
        {message.expiresAt && (
          <Timer className="w-3.5 h-3.5 text-blue-400 animate-pulse" title="Disappearing message active" />
        )}
        {message.pending && (
          <Clock className="w-3 h-3 text-amber-500 animate-pulse" title="Sending offline..." />
        )}
        <span>{message.pending ? 'Sending...' : formatTime(message.timestamp)}</span>
      </span>
    </div>
  );
}
