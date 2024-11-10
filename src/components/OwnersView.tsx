'use client';

import { useState, useEffect } from 'react';

interface Owner {
  id: string;
  ['ציון בעלים']: string;
  ['אורך']: number;
  ['רוחב']: number;
  ['הערות בעלים']: string;
  ['חפ']: number;
  ['חתום']: number;
  ['טלפון בעלים']: string;
}

type OwnerUpdateData = {
  ['ציון בעלים']?: string;
  ['אורך']?: number;
  ['רוחב']?: number;
  ['הערות בעלים']?: string;
  ['חפ']?: number;
  ['חתום']?: number;
  ['טלפון בעלים']?: string;
}

export default function OwnersView() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await fetch('https://geomai21-default-rtdb.firebaseio.com/owner/data_owner.json');
      if (!response.ok) throw new Error('Failed to fetch owners data');
      const data = await response.json();
      
      // Convert Firebase object to array
      const ownersArray = Object.entries(data).map(([id, details]: [string, any]) => ({
        id,
        ...details
      }));
      
      setOwners(ownersArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (ownerId: string, updatedData: OwnerUpdateData) => {
    try {
      const response = await fetch(
        `https://geomai21-default-rtdb.firebaseio.com/owner/data_owner/${ownerId}.json`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) throw new Error('Failed to update owner');
      
      await fetchOwners();
      setEditingOwner(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update owner');
    }
  };

  const formatPhoneNumbers = (phones: string | null | undefined) => {
    if (!phones) return 'לא ידוע';
    
    return phones
      .toString()
      .split(',')
      .filter(phone => phone.trim() !== '*nan' && phone.trim() !== 'nan' && phone.trim() !== 'לא ידוע')
      .map(phone => phone.trim())
      .join(', ') || 'לא ידוע';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">טוען נתונים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">שגיאה: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ניהול בעלים</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-md ${
            isEditing 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isEditing ? 'סיום עריכה' : 'מצב עריכה'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-right">ציון בעלים</th>
              <th className="p-3 text-right">אורך</th>
              <th className="p-3 text-right">רוחב</th>
              <th className="p-3 text-right">הערות בעלים</th>
              <th className="p-3 text-right">ח"פ</th>
              <th className="p-3 text-right">חתום</th>
              <th className="p-3 text-right">טלפון בעלים</th>
              {isEditing && <th className="p-3 text-right">פעולות</th>}
            </tr>
          </thead>
          <tbody>
      {owners.map((owner) => (
        <tr key={owner.id} className="border-b">
          <td className="p-3">{owner['ציון בעלים'] || 'לא ידוע'}</td>
          <td className="p-3">{owner['אורך'] || 0}</td>
          <td className="p-3">{owner['רוחב'] || 0}</td>
          <td className="p-3">{owner['הערות בעלים'] || 'לא ידוע'}</td>
          <td className="p-3">{owner['חפ'] || 'לא ידוע'}</td>
          <td className="p-3">{owner['חתום'] ? '✓' : '✗'}</td>
          <td className="p-3">{formatPhoneNumbers(owner['טלפון בעלים'])}</td>
          {isEditing && (
            <td className="p-3">
              <button
                onClick={() => setEditingOwner(owner)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                ערוך
              </button>
            </td>
          )}
        </tr>
      ))}
    </tbody>
        </table>
      </div>

      {editingOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">עריכת בעלים</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedData: OwnerUpdateData = {
                'ציון בעלים': formData.get('name') as string,
                'אורך': Number(formData.get('longitude')),
                'רוחב': Number(formData.get('latitude')),
                'הערות בעלים': formData.get('notes') as string,
                'חפ': Number(formData.get('companyId')),
                'חתום': formData.get('signed') ? 1 : 0,
                'טלפון בעלים': formData.get('phone') as string,
              };
              handleEdit(editingOwner.id, updatedData);
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ציון בעלים</label>
                  <input
                    name="name"
                    defaultValue={editingOwner['ציון בעלים']}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">אורך</label>
                  <input
                    name="longitude"
                    type="number"
                    defaultValue={editingOwner['אורך']}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">רוחב</label>
                  <input
                    name="latitude"
                    type="number"
                    defaultValue={editingOwner['רוחב']}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">הערות בעלים</label>
                  <input
                    name="notes"
                    defaultValue={editingOwner['הערות בעלים']}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ח"פ</label>
                  <input
                    name="companyId"
                    type="number"
                    defaultValue={editingOwner['חפ']}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">טלפון בעלים</label>
                  <input
                    name="phone"
                    defaultValue={editingOwner['טלפון בעלים']}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="signed"
                      defaultChecked={Boolean(editingOwner['חתום'])}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">חתום</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  שמור
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOwner(null)}
                  className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}