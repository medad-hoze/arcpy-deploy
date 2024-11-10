'use client';

import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '@/firebase/config';
import { Loader2, Search, Filter, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }
);

interface VehicleData {
  [key: string]: any;
}

interface FilterOptions {
  [key: string]: string[];
}

export default function DatabaseView() {
  const [data, setData] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<VehicleData[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});
  const [showFilters, setShowFilters] = useState(false);
  const [key, setKey] = useState(0);

  // Define the fields we want to filter by
  const filterFields = ['שנתון', 'מקור', 'קבוצה', 'אזור', 'דגם', 'יצרן', 'תקין'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, '/data/data');
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const dataArray = Array.isArray(rawData) ? rawData : [];
          setData(dataArray);

          // Extract unique values for each filter field
          const options: FilterOptions = {};
          filterFields.forEach(field => {
            const uniqueValues = Array.from(new Set(
              dataArray.map(item => item[field]?.toString() || '')
            )).filter(Boolean).sort();
            options[field] = uniqueValues;
          });
          setFilterOptions(options);

          filterData(dataArray, searchTerm, {});
        }
      } catch (err) {
        console.error('Database error:', err);
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterData = (dataToFilter: VehicleData[], search: string, filters: {[key: string]: string}) => {
    let result = dataToFilter.filter(item => 
      (item['מקור'] != 'אורך' && item['רוחב'] != '32.06') &&
      item['אורך'] && 
      item['רוחב']
    );

    // Apply search term
    if (search) {
      result = result.filter(item =>
        Object.entries(item).some(([key, value]) =>
          value?.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Apply all active filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(item => 
          item[field]?.toString() === value
        );
      }
    });

    setFilteredData(result);
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    filterData(data, searchTerm, activeFilters);
  }, [searchTerm, activeFilters, data]);

  const clearFilter = (field: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[field];
    setActiveFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="mr-2 text-gray-600">טוען נתונים...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-right">
        שגיאה: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">מפת כלי רכב</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5" />
              סינון
            </button>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש..."
                className="w-64 pl-4 pr-10 py-2 border rounded-lg text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filterFields.map(field => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{field}</label>
                  <select
                    className="w-full p-2 border rounded-lg text-right"
                    value={activeFilters[field] || ''}
                    onChange={(e) => {
                      const newFilters = { ...activeFilters };
                      if (e.target.value) {
                        newFilters[field] = e.target.value;
                      } else {
                        delete newFilters[field];
                      }
                      setActiveFilters(newFilters);
                    }}
                  >
                    <option value="">הכל</option>
                    {filterOptions[field]?.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([field, value]) => (
              <div key={field} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {field}: {value}
                <X
                  className="h-4 w-4 cursor-pointer hover:text-blue-900"
                  onClick={() => clearFilter(field)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="h-[60vh] border rounded-lg overflow-hidden">
        <MapWithNoSSR key={key} data={filteredData} />
      </div>

      {/* Footer Section */}
      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <div>
          מציג {filteredData.length} מתוך {data.length} רשומות
        </div>
        <div>
          {Object.keys(activeFilters).length === 0 
            ? 'מציג רק נתונים מ: איתורן, פוינטר' 
            : `מסנן לפי ${Object.keys(activeFilters).length} שדות`}
        </div>
      </div>
    </div>
  );
}