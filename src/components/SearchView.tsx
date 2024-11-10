'use client';

import { useState, useEffect } from 'react';
import { database } from '@/firebase/config';
import { ref, get, DataSnapshot } from 'firebase/database';
import { Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Vehicle {
  רישוי: string;
  [key: string]: any;
}

export interface SearchViewProps {
  initialSearchTerm: string;
}

export default function SearchView({ initialSearchTerm }: SearchViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [allData, setAllData] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Add immediate search when component mounts with initialSearchTerm
  useEffect(() => {
    if (initialSearchTerm && allData.length > 0) {
      performSearch(initialSearchTerm);
    }
  }, [initialSearchTerm, allData]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dbRef = ref(database, '/data/data');
      const snapshot: DataSnapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setAllData(data as Vehicle[]);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    }
    setIsLoading(false);
  };

  const performSearch = (term: string) => {
    const trimmedTerm = String(term || '').trim();
    
    if (!trimmedTerm) {
      setSearchResults([]);
      return;
    }

    const results = allData.filter(item => {
      const licenseNumber = String(item.רישוי || '');
      return licenseNumber.includes(trimmedTerm);
    });
    
    setSearchResults(results);
    setExpandedId(null);
  };

  // Handle real-time search input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="הקלד מספר רישוי..."
              className="w-full px-4 py-3 pr-12 text-lg border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              dir="rtl"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              ) : (
                <Search className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>
        </form>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
          {error}
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200"
            >
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedId(expandedId === index ? null : index)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-gray-500">מספר רישוי</div>
                    <div className="font-semibold text-lg">{result.רישוי}</div>
                  </div>
                </div>
                {expandedId === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {expandedId === index && (
                <div className="px-4 pb-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                    {Object.entries(result).map(([key, value]) => {
                      if (key !== 'רישוי' && value) {
                        return (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500">{key}</div>
                            <div className="font-medium">{String(value)}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : searchTerm ? (
        <div className="bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
          לא נמצאו תוצאות עבור "{searchTerm}"
        </div>
      ) : null}
    </div>
  );
}