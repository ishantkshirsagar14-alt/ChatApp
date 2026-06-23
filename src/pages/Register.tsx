import React, { useState } from 'react';
import { MessageCircle, Lock, User as UserIcon, Mail } from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: (token: string, user: any) => void;
  onNavigateToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onNavigateToLogin }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      setError('Please fill in all requested fields.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          email: trimmedEmail,
          password: password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Network registration failed.');
      }

      onRegisterSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center py-12 px-6 text-[#fafafa]">
      <div className="w-full max-w-md bg-black border border-[#262626] rounded-xl shadow-2xl overflow-hidden p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-500/10">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#fafafa] font-sans">IKChatMeet</h1>
          <p className="text-sm text-[#a8a8a8] mt-1 text-center">Create an account to explore real-time messaging</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/20 border border-red-900 rounded-lg text-xs text-red-400 mb-6 font-medium animate-pulse" id="register-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="reg-username"
                type="text"
                placeholder="choose_username"
                autoComplete="off"
                required
                className="w-full bg-[#121212] text-[#fafafa] pl-10 pr-4 py-2.5 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition duration-150 placeholder-neutral-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="reg-email"
                type="email"
                placeholder="name@domain.com"
                autoComplete="off"
                required
                className="w-full bg-[#121212] text-[#fafafa] pl-10 pr-4 py-2.5 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition duration-150 placeholder-neutral-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="reg-password"
                type="password"
                placeholder="password (min 6 keys)"
                required
                className="w-full bg-[#121212] text-[#fafafa] pl-10 pr-4 py-2.5 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition duration-150 placeholder-neutral-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="reg-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[#fafafa] border border-transparent text-black py-2.5 rounded-lg text-sm font-semibold hover:bg-[#e4e4e4] active:bg-[#fafafa] transition duration-150 flex justify-center items-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin"></span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>
      </div>

      <div className="w-full max-w-md bg-black border border-[#262626] rounded-xl p-4 mt-4 text-center">
        <p className="text-sm text-[#a8a8a8]">
          Have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-white font-semibold hover:underline cursor-pointer"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
