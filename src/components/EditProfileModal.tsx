import React, { useState } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Mail, Lock, Camera, Check, Shuffle } from 'lucide-react';

interface EditProfileModalProps {
  currentUser: User;
  token: string;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: User) => void;
}

export default function EditProfileModal({
  currentUser,
  token,
  onClose,
  onUpdateSuccess,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAvatarShuffle = () => {
    // Generate a fresh random adventurer dicebear seed
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(randomSeed)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/me/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
          avatar,
          password: password || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onUpdateSuccess(data.user);
          onClose();
        }, 800);
      } else {
        setError(data.error || 'Failed to update profile details');
      }
    } catch (err) {
      console.error('Update profile catch block:', err);
      setError('A network exception occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-black border border-[#262626] rounded-2xl shadow-2xl overflow-hidden text-[#fafafa] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="p-1 text-[#a8a8a8] hover:text-[#fafafa] rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/20 border border-red-950 text-red-400 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-950/20 border border-green-950 text-green-400 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Profile details synchronized successfully!
            </div>
          )}

          {/* Avatar Picture Circle Selection */}
          <div className="flex flex-col items-center py-2">
            <div className="relative group">
              <img 
                src={avatar} 
                alt="Profile Preview" 
                className="w-24 h-24 rounded-full border-2 border-[#262626] object-cover bg-[#121212] transition group-hover:opacity-85"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={handleAvatarShuffle}
                className="absolute bottom-0 right-0 p-1.5 bg-[#0095f6] hover:bg-[#38b7ff] text-white rounded-full transition shadow-md cursor-pointer"
                title="Shuffle Random Avatar"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-[#a8a8a8] uppercase font-bold tracking-widest mt-3">Profile Picture / DP</p>
          </div>

          {/* Avatar URL Field */}
          <div>
            <label className="block text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider mb-1.5">
              Avatar Image URL / Seed URL
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Camera className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-[#121212] text-[#fafafa] pl-10 pr-4 py-2 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition placeholder-neutral-600 font-mono text-[11px]"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="username"
                className="w-full bg-[#121212] text-[#fafafa] pl-10 pr-4 py-2 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition placeholder-neutral-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="email@example.com"
                className="w-full bg-[#121212] text-[#fafafa] pl-10 pr-4 py-2 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition placeholder-neutral-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider mb-1.5">
              New Password (Optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Leave blank to keep current"
                className="w-full bg-[#121212] text-[#fafafa] pl-10 pr-4 py-2 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition placeholder-neutral-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent hover:bg-[#1a1a1a] border border-[#262626] text-[#fafafa] py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#fafafa] text-black hover:bg-[#e4e4e4] py-2 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
