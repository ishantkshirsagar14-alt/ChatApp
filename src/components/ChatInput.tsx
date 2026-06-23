import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, Heart, Timer } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  placeholder?: string;
  disappearingMode: 'off' | '24h' | '7d';
  onModeChange: (mode: 'off' | '24h' | '7d') => void;
}

export default function ChatInput({
  onSendMessage,
  placeholder = 'Message...',
  disappearingMode,
  onModeChange,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerMenuRef = useRef<HTMLDivElement>(null);

  // Close timer menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timerMenuRef.current && !timerMenuRef.current.contains(event.target as Node)) {
        setShowTimerMenu(false);
      }
    };
    if (showTimerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimerMenu]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setText('');

    // Reset textarea height manually after reset
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Dynamically auto-expand up to max height
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-[#262626] bg-black">
      <div className="flex items-center gap-3 bg-transparent border border-[#262626] rounded-full px-4 py-2 hover:border-[#3a3a3a] transition duration-150">
        {/* Disappearing Messages Configure Button */}
        <div className="relative flex items-center" ref={timerMenuRef}>
          <button
            type="button"
            onClick={() => setShowTimerMenu(!showTimerMenu)}
            className={`p-1 rounded-full transition cursor-pointer ${
              disappearingMode !== 'off' ? 'text-blue-500 hover:text-blue-400' : 'text-[#a8a8a8] hover:text-[#fafafa]'
            }`}
            title="Configure Disappearing Messages"
          >
            <Timer className="w-5 h-5" />
          </button>

          {showTimerMenu && (
            <div className="absolute bottom-10 left-0 bg-[#121212] border border-[#262626] rounded-xl py-2 w-48 shadow-2xl z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-[#262626] text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                Disappearing Messages
              </div>
              <button
                type="button"
                onClick={() => {
                  onModeChange('off');
                  setShowTimerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-[#1a1a1a] transition flex justify-between items-center ${
                  disappearingMode === 'off' ? 'text-blue-400 font-bold' : 'text-[#fafafa]'
                }`}
              >
                <span>Off</span>
                {disappearingMode === 'off' && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onModeChange('24h');
                  setShowTimerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-[#1a1a1a] transition flex justify-between items-center ${
                  disappearingMode === '24h' ? 'text-blue-400 font-bold' : 'text-[#fafafa]'
                }`}
              >
                <span>24 Hours</span>
                {disappearingMode === '24h' && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onModeChange('7d');
                  setShowTimerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-[#1a1a1a] transition flex justify-between items-center ${
                  disappearingMode === '7d' ? 'text-blue-400 font-bold' : 'text-[#fafafa]'
                }`}
              >
                <span>7 Days</span>
                {disappearingMode === '7d' && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setText((prev) => prev + '😊')}
          className="text-[#a8a8a8] hover:text-[#fafafa] transition"
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[#fafafa] border-none outline-none resize-none text-sm py-1 max-h-[120px] placeholder-neutral-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {text.trim() ? (
          <button
            id="chat-send-btn"
            type="submit"
            className="text-[#0095f6] hover:text-[#38b7ff] font-bold text-sm tracking-tight px-2 transition cursor-pointer"
          >
            Send
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSendMessage('❤️')}
              className="text-[#a8a8a8] hover:text-red-500 transition"
              title="Send Light Heart"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
