import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, Search, Calendar, Download, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { database } from '@/firebase/config';
import { ref, get, DataSnapshot } from 'firebase/database';

// Define all interfaces
interface VehicleData {
  רישוי: string;
  סוג?: string;
  יצרן?: string;
  תאריך?: string;
  [key: string]: string | undefined;
}

interface DatabaseConfig {
  id: string;
  name: string;
  path: string;
  type: 'firebase' | 'api';
  url?: string;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface ActiveFilters {
  [key: string]: string[];
}

interface SearchValues {
  [key: string]: string;
}

interface AvailableFilters {
  [key: string]: string[];
}

// Database configurations
const DATABASES: DatabaseConfig[] = [
  {
    id: 'vehicles',
    name: 'כלי רכב',
    path: '/data/data',
    type: 'firebase'
  },
  {
    id: 'owners',
    name: 'בעלים',
     path: '/owner/data_owner',
    type: 'firebase'
   
  },
  {
    id: 'recruited',
    name: 'מגוייסים',
    path: '/recruited',
    type: 'firebase'
  }
];

const FiltersView: React.FC = () => {
  // State management
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseConfig>(DATABASES[0]);
  const [data, setData] = useState<VehicleData[]>([]);
  const [filteredData, setFilteredData] = useState<VehicleData[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({});
  const [openPopover, setOpenPopover] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [searchValues, setSearchValues] = useState<SearchValues>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const itemsPerPage = 10;

  // Helper functions for data fetching
  const fetchFirebaseData = async (path: string) => {
    const dbRef = ref(database, path);
    const snapshot: DataSnapshot = await get(dbRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val()) as VehicleData[];
    }
    return [];
  };

  const fetchApiData = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    const jsonData = await response.json();
    return Object.values(jsonData) as VehicleData[];
  };

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let rawData: VehicleData[] = [];

        if (selectedDatabase.type === 'firebase') {
          rawData = await fetchFirebaseData(selectedDatabase.path);
        } 

        setData(rawData);
        setFilteredData(rawData);
        
        // Reset filters when changing database
        setActiveFilters({});
        setDateRange({ from: null, to: null });
        setPage(1);
        
        // Initialize available filters
        const filters: AvailableFilters = {};
        if (rawData.length > 0) {
          Object.keys(rawData[0]).forEach(key => {
            const uniqueValues = [...new Set(rawData.map(item => item[key]))].filter(Boolean) as string[];
            filters[key] = uniqueValues;
          });
        }
        setAvailableFilters(filters);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDatabase]);

  // Filter effect
  useEffect(() => {
    let filtered = [...data];

    // Apply active filters
    Object.entries(activeFilters).forEach(([field, values]) => {
      if (values && values.length > 0) {
        filtered = filtered.filter(item => values.includes(item[field] || ''));
      }
    });

    // Apply date range if present
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        if (!item.תאריך) return false;
        const itemDate = new Date(item.תאריך);
        return dateRange.from && dateRange.to && 
               itemDate >= dateRange.from && 
               itemDate <= dateRange.to;
      });
    }

    setFilteredData(filtered);
    setPage(1); // Reset to first page when filters change
  }, [activeFilters, dateRange, data]);

  // Handler functions
  const handleFilterChange = (field: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const removeFilter = (field: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[field];
    setActiveFilters(newFilters);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = Object.keys(filteredData[0]).join(',');
    const rows = filteredData.map(item => Object.values(item).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDatabase.name}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination calculations
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(startIndex, endIndex);

  // Handle click outside popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openPopover && !(event.target as Element).closest('.popover-container')) {
        setOpenPopover('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopover]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Database Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-bold">בחר מאגר נתונים</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {DATABASES.map((db) => (
            <button
              key={db.id}
              onClick={() => setSelectedDatabase(db)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedDatabase.id === db.id 
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
            >
              {db.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">טוען נתונים...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>שגיאה בטעינת הנתונים: {error}</p>
        </div>
      )}

      {/* Main Filter Card */}
      {!isLoading && !error && data.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-6 w-6" />
                <h2 className="text-xl font-bold">מסננים מתקדמים</h2>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4" />
                ייצוא לאקסל
              </button>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(activeFilters).map(([field, values]) => (
                values.map(value => (
                  <span
                    key={`${field}-${value}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {field}: {value}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-blue-600"
                      onClick={() => {
                        const newValues = activeFilters[field].filter(v => v !== value);
                        if (newValues.length === 0) {
                          removeFilter(field);
                        } else {
                          handleFilterChange(field, newValues);
                        }
                      }}
                    />
                  </span>
                ))
              ))}
              {dateRange.from && dateRange.to && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {`${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-blue-600"
                    onClick={() => setDateRange({ from: null, to: null })}
                  />
                </span>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-2">
              {/* Date Range Picker */}
              <div className="relative popover-container">
                <button
                  onClick={() => setOpenPopover(openPopover === 'date' ? '' : 'date')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>טווח תאריכים</span>
                  </div>
                </button>
                {openPopover === 'date' && (
                  <div className="absolute mt-2 w-72 bg-white rounded-md shadow-lg z-10 p-4">
                    <input
                      type="date"
                      className="w-full mb-2 p-2 border rounded"
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                    />
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                    />
                  </div>
                )}
              </div>

              {/* Field Filters */}
              {Object.entries(availableFilters).map(([field, values]) => (
                <div key={field} className="relative popover-container">
                  <button
                    onClick={() => setOpenPopover(openPopover === field ? '' : field)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <div className="flex items-center gap-2">
                      {field}
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>
                  {openPopover === field && (
                    <div className="absolute mt-2 w-64 bg-white rounded-md shadow-lg z-10">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="חיפוש..."
                            className="w-full pl-8 pr-2 py-2 text-sm border rounded"
                            value={searchValues[field] || ''}
                            onChange={(e) => setSearchValues(prev => ({
                              ...prev,
                              [field]: e.target.value
                            }))}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {values
                          .filter(value => 
                            !searchValues[field] ||
                            value.toString().toLowerCase().includes(searchValues[field].toLowerCase())
                          )
                          .map(value => (
                            <label
                              key={value}
                              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                            className="rounded text-indigo-600"
                            checked={activeFilters[field]?.includes(value)}
                                onChange={(e) => {
                                  const currentValues = activeFilters[field] || [];
                                  if (e.target.checked) {
                                    handleFilterChange(field, [...currentValues, value]);
                                  } else {
                                    handleFilterChange(
                                      field,
                                      currentValues.filter(v => v !== value)
                                    );
                                  }
                                }}
                              />
                              <span className="text-sm">{value}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(data[0] || {}).map(key => (
                      <th
                        key={key}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.length > 0 ? (
                    currentData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.values(item).map((value, valueIdx) => (
                          <td key={valueIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={Object.keys(data[0] || {}).length}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        לא נמצאו תוצאות מתאימות לחיפוש
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="disabled:opacity-50 disabled:cursor-not-allowed p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-700">
                  עמוד {page} מתוך {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="disabled:opacity-50 disabled:cursor-not-allowed p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
              <div className="text-sm text-gray-700">
                סה"כ: {filteredData.length} רשומות
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Data State */}
      {!isLoading && !error && data.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">לא נמצאו נתונים במאגר זה</p>
        </div>
      )}
    </div>
  );
};

export default FiltersView;