import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowLeft, Users, Loader2 } from 'lucide-react';
import { User } from '../types';
import UserCard from '../components/UserCard';

interface SearchProps {
  token: string;
  onClose: () => void;
  onFollowStatusChange?: () => void; // Tell parent to reload sidebar contacts
}

export default function Search({ token, onClose, onFollowStatusChange }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch search results from API
  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch search results.');
      }
    } catch (err) {
      console.error('Search network error:', err);
      setError('A connection error occurred while querying profiles.');
    } finally {
      setLoading(false);
    }
  };

  // Perform initial search to show active suggestions or on query change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="flex flex-col h-full bg-black" id="search-view">
      {/* Search Header */}
      <div className="p-4 bg-black border-b border-[#262626] flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#1a1a1a] rounded-lg text-[#a8a8a8] hover:text-[#fafafa] transition cursor-pointer"
          title="Back to chat"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#a8a8a8]">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            id="search-input"
            type="text"
            placeholder="Search username..."
            autoComplete="off"
            className="w-full bg-[#121212] text-[#fafafa] pl-9 pr-4 py-2 rounded-lg border border-[#262626] text-sm focus:bg-[#1a1a1a] focus:outline-none focus:border-neutral-700 transition duration-150 font-medium placeholder-neutral-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results Workspace */}
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-full w-full bg-black">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#a8a8a8]">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-2" />
            <p className="text-xs font-medium">Querying profiles...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/20 border border-red-900 rounded-lg text-xs font-semibold text-red-400 text-center">
            {error}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-center text-neutral-400 mb-4 shadow-lg">
              <Users className="w-6 h-6 text-neutral-300" />
            </div>
            <h3 className="font-semibold text-[#fafafa] text-sm">No Results Found</h3>
            <p className="text-xs text-[#a8a8a8] leading-relaxed max-w-xs mt-1">
              {query ? `We couldn't find matches for "${query}".` : "Type a friend's username in the input above to find them."}
            </p>
          </div>
        ) : (
          <div className="space-y-3" id="search-results">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#a8a8a8] mb-2 px-1">
              Explorer Results
            </h4>
            {results.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                token={token}
                onFollowStatusChange={onFollowStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
