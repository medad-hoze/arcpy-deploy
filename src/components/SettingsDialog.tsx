'use client';

import React, { useState } from 'react';
import { Settings, Database, Award, UserX, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { database } from '@/firebase/config';
import { ref, get, update } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleDatabaseCheck = async () => {
    try {
      setLoading('database');
      const dbRef = ref(database, '/data/data');
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        setNotification({
          type: 'success',
          message: 'בסיס הנתונים תקין ומכיל ' + Object.keys(snapshot.val()).length + ' רשומות'
        });
      } else {
        setNotification({
          type: 'error',
          message: 'בסיס הנתונים ריק'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'שגיאה בבדיקת בסיס הנתונים'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCancelRetention = async () => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את כל המרותקים?')) return;
    
    try {
      setLoading('retention');
      const dbRef = ref(database, '/data/data');
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const updates: { [key: string]: any } = {};
        Object.entries(snapshot.val()).forEach(([key, value]: [string, any]) => {
          if (value.סטטוס === 'מרותק') {
            updates[`/data/data/${key}/סטטוס`] = 'לא פעיל';
          }
        });
        
        await update(ref(database), updates);
        setNotification({
          type: 'success',
          message: 'כל המרותקים בוטלו בהצלחה'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'שגיאה בביטול המרותקים'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSetScore = async () => {
    try {
      setLoading('score');
      // Add your score setting logic here
      setNotification({
        type: 'success',
        message: 'הציון נקבע בהצלחה'
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'שגיאה בקביעת הציון'
      });
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-bold">הגדרות מערכת</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p>{notification.message}</p>
          </div>
        )}

        {/* Settings Options */}
        <div className="p-4 space-y-3">
          <button
            onClick={handleCancelRetention}
            disabled={loading === 'retention'}
            className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <UserX className="h-6 w-6 text-red-500" />
            <div className="text-right">
              <div className="font-medium">ביטול מרותקים</div>
              <div className="text-sm text-gray-500">ביטול כל המרותקים במערכת</div>
            </div>
            {loading === 'retention' && (
              <div className="mr-auto">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              </div>
            )}
          </button>

          <button
            onClick={handleSetScore}
            disabled={loading === 'score'}
            className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Award className="h-6 w-6 text-yellow-500" />
            <div className="text-right">
              <div className="font-medium">קביעת ציון</div>
              <div className="text-sm text-gray-500">הגדרת ציון למערכת</div>
            </div>
            {loading === 'score' && (
              <div className="mr-auto">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              </div>
            )}
          </button>

          <button
            onClick={handleDatabaseCheck}
            disabled={loading === 'database'}
            className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Database className="h-6 w-6 text-blue-500" />
            <div className="text-right">
              <div className="font-medium">בדיקת בסיס נתונים</div>
              <div className="text-sm text-gray-500">בדיקת תקינות ומספר רשומות</div>
            </div>
            {loading === 'database' && (
              <div className="mr-auto">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;