// components/AuthSidebar.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogOut, User, Lock } from 'lucide-react';

export default function AuthSidebar() {
  const { user, loading, error, login, logout, canEdit } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed top-0 right-0 h-screen w-80 bg-white shadow-lg p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-screen w-80 bg-white shadow-lg p-6 text-right">
      {user ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => logout()}
              className="text-gray-600 hover:text-gray-800"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-500">
                  {canEdit ? 'הרשאת עריכה' : 'צפייה בלבד'}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold">התחברות</h2>
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              דואר אלקטרוני
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-right"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-right"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              'התחבר'
            )}
          </button>
        </form>
      )}
    </div>
  );
}