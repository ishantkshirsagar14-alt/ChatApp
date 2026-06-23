import React, { useEffect, useState } from 'react';
import { User } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import Chat from './pages/Chat';
import Search from './pages/Search';
import EditProfileModal from './components/EditProfileModal';
import { socket } from './socket';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // 1. Fetch current user profile on mounting/token change
  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setCurrentUser(data.user);
          // Initial contact sync
          fetchFollowedUsers(token);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  // 2. Manage Socket.io lifecycle on authentication change
  useEffect(() => {
    if (token && currentUser) {
      socket.connect();
      socket.emit('setup', { userId: currentUser._id });

      // Live presence synchronization
      const handlePresence = (data: { userId: string; isOnline: boolean }) => {
        setFollowedUsers((prev) =>
          prev.map((u) => (u._id === data.userId ? { ...u, isOnline: data.isOnline } : u))
        );
        if (activePartner && activePartner._id === data.userId) {
          setActivePartner((prev) => (prev ? { ...prev, isOnline: data.isOnline } : null));
        }
      };

      socket.on('user_presence', handlePresence);

      return () => {
        socket.off('user_presence', handlePresence);
        socket.disconnect();
      };
    }
  }, [token, currentUser, activePartner]);

  // 3. Fetch list of followed users
  const fetchFollowedUsers = async (activeToken: string) => {
    try {
      const response = await fetch('/api/chat/users', {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setFollowedUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching followed contacts:', err);
    }
  };

  const handleLoginSuccess = (newToken: string, user: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    fetchFollowedUsers(newToken);
  };

  const handleRegisterSuccess = (newToken: string, user: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    fetchFollowedUsers(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setActivePartner(null);
    setFollowedUsers([]);
    setShowSearch(false);
    setCurrentPage('login');
    socket.disconnect();
  };

  // Synchronize dynamic lists when follow triggers are updated in Search
  const handleFollowStatusChange = () => {
    if (token) {
      fetchFollowedUsers(token);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center">
        <span className="inline-block w-8 h-8 border-4 border-neutral-800 border-t-white rounded-full animate-spin"></span>
        <p className="mt-4 text-xs font-semibold text-neutral-400 uppercase tracking-widest animate-pulse">
          Starting IKChatMeet, please wait...
        </p>
      </div>
    );
  }

  // Not Authenticated
  if (!currentUser || !token) {
    return currentPage === 'login' ? (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setCurrentPage('register')}
      />
    ) : (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onNavigateToLogin={() => setCurrentPage('login')}
      />
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-black text-[#fafafa] flex items-center justify-center p-0 md:p-6" id="app-root-workspace">
      <div className="w-full max-w-5xl h-screen md:h-[85vh] bg-black border border-[#262626] rounded-none md:rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Responsive Grid Structure */}
        {showSearch ? (
          /* Search explorer panel (takes over chat list workspace) */
          <div className="w-full md:w-80 border-r border-[#262626] h-full flex flex-col bg-black">
            <Search
              token={token}
              onClose={() => setShowSearch(false)}
              onFollowStatusChange={handleFollowStatusChange}
            />
          </div>
        ) : (
          /* Left Sidebar (Thread Directory) */
          <div className={`h-full ${activePartner ? 'hidden md:block' : 'block w-full md:w-80 border-r border-[#262626]'}`}>
            <Sidebar
              currentUser={currentUser}
              followedUsers={followedUsers}
              activeChatUserId={activePartner?._id || null}
              onSelectUser={setActivePartner}
              onLogout={handleLogout}
              onOpenSearch={() => setShowSearch(true)}
              token={token}
              onEditProfileClick={() => setShowEditProfile(true)}
              onRefreshContacts={() => fetchFollowedUsers(token)}
            />
          </div>
        )}

        {/* Right Content Space (Chat Workspace) */}
        <div className={`flex-1 h-full bg-[#050505] ${!activePartner ? 'hidden md:flex' : 'block'}`}>
          <Chat
            currentUser={currentUser}
            activePartner={activePartner}
            token={token}
            onBackToSidebar={() => setActivePartner(null)}
          />
        </div>

        {showEditProfile && (
          <EditProfileModal
            currentUser={currentUser}
            token={token}
            onClose={() => setShowEditProfile(false)}
            onUpdateSuccess={(user) => setCurrentUser(user)}
          />
        )}
      </div>
    </div>
  );
}
