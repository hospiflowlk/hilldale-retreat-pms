import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

export const PinLockScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLocked, unlock, login, user } = useAuth();
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (!isLocked) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await unlock(pin);
      } else {
        await login(username, pin);
      }
      setPin('');
      setError('');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-slate-100 p-3 rounded-full mb-4">
            <Lock className="w-8 h-8 text-slate-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {user ? 'Session Locked' : 'Sign In'}
          </h2>
          {user && <p className="text-slate-500 mt-2">Welcome back, {user.username}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.5em]"
              maxLength={4}
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {user ? 'Unlock' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
