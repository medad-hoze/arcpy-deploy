'use client';

import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '@/firebase/config';
import { Building2, MapPin, Users, ChevronDown, ChevronUp, Clock, Search } from 'lucide-react';
import React, { useCallback } from 'react';


interface RecruitedData {
    [key: string]: any;
  }
  
  interface GroupedData {
    current: RecruitedData[];
    history: { [key: string]: RecruitedData[] };
  }
  
  interface RegionStats {
    total: number;
    תפוס: number;
    מגוייס: number;
  }
  
  interface RegionData {
    count: number;
    data: GroupedData;
    stats: RegionStats;  // Changed from number to RegionStats
  }
  
  interface RegionCounts {
    'מרכז': RegionData;
    'צפון': RegionData;
    'דרום': RegionData;
  }
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RegionTable = ({ data, region }: { data: GroupedData; region: string }) => {
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.current.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig) {
      const aVal = a[sortConfig.key]?.toString() || '';
      const bVal = b[sortConfig.key]?.toString() || '';
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal, 'he')
        : bVal.localeCompare(aVal, 'he');
    }
    return 0;
  });

  const renderTableRows = () => {
    return sortedData.map((item) => {
      // Using קוד רכב as a unique identifier instead of index
      const vehicleId = item['קוד רכב']?.toString() || Math.random().toString();
      
      return (
        <React.Fragment key={vehicleId}>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-right">{item['קוד רכב']}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                item['סטטוס'] === 'פעיל' ? 'bg-green-100 text-green-800' :
                item['סטטוס'] === 'לא פעיל' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {item['סטטוס']}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              {formatDate(item['חותמת זמן'])}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              {data.history[item['קוד רכב']]?.length > 0 && (
                <button
                  onClick={() => setExpandedVehicle(expandedVehicle === item['קוד רכב'] ? null : item['קוד רכב'])}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Clock className="h-4 w-4" />
                  {data.history[item['קוד רכב']].length} רשומות
                </button>
              )}
            </td>
          </tr>
          {expandedVehicle === item['קוד רכב'] && (
            <tr key={`history-${vehicleId}`}>
              <td colSpan={6} className="px-6 py-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium mb-2">היסטוריית רכב {item['קוד רכב']}</h4>
                  <div className="space-y-2">
                    {data.history[item['קוד רכב']].map((historyItem, hIndex) => (
                      <div 
                        key={`${vehicleId}-history-${historyItem['חותמת זמן']}`} 
                        className="bg-white p-3 rounded-lg shadow-sm"
                      >
                        <div className="grid grid-cols-3 gap-4 text-right">
                          <div>
                            <span className="font-medium">תאריך: </span>
                            {formatDate(historyItem['חותמת זמן'])}
                          </div>
                          <div>
                            <span className="font-medium">סטטוס: </span>
                            {historyItem['סטטוס']}
                          </div>
                          <div>
                            <span className="font-medium">תת-סטטוס: </span>
                            {historyItem['תת-סטטוס']}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="mt-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">נתוני {region}</h3>
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש בטבלה..."
            className="w-64 pl-4 pr-10 py-2 border rounded-lg text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['קוד רכב', 'סטטוס', 'חותמת זמן', 'היסטוריה'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => header !== 'היסטוריה' && setSortConfig({
                      key: header,
                      direction: sortConfig?.key === header && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                    })}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {header}
                      {sortConfig?.key === header && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function YazamView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [regionData, setRegionData] = useState<RegionCounts>({
    'מרכז': { 
      count: 0, 
      stats: { total: 0, תפוס: 0, מגוייס: 0 }, 
      data: { current: [], history: {} } 
    },
    'צפון': { 
      count: 0, 
      stats: { total: 0, תפוס: 0, מגוייס: 0 }, 
      data: { current: [], history: {} } 
    },
    'דרום': { 
      count: 0, 
      stats: { total: 0, תפוס: 0, מגוייס: 0 }, 
      data: { current: [], history: {} } 
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, '/recruited');
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const rawData: RecruitedData[] = snapshot.val();
          
          const processedData: { [key: string]: GroupedData } = {
            'מרכז': { current: [], history: {} },
            'צפון': { current: [], history: {} },
            'דרום': { current: [], history: {} }
          };

          // Group by region and קוד רכב, sort by חותמת זמן
          rawData.forEach(item => {
            if (item['יצ"מ'] && item['קוד רכב']) {
              const region = item['יצ"מ'];
              const vehicleCode = item['קוד רכב'];
              
              if (!processedData[region]) {
                processedData[region] = { current: [], history: {} };
              }
              
              if (!processedData[region].history[vehicleCode]) {
                processedData[region].history[vehicleCode] = [];
              }
              
              // Add item to history
              processedData[region].history[vehicleCode].push(item);
            }
          });


          
          // Or even more specific:
          const getRegionStats = (data: RecruitedData[]) => {
            return {
              total: data.length,
              תפוס: data.filter(item => item['סטטוס'] === 'תפוס').length,
              מגוייס: data.filter(item => item['סטטוס'] === 'מגוייס').length
            };
          };

          
          
          // And update how the current items are selected:
          Object.keys(processedData).forEach(region => {
            Object.keys(processedData[region].history).forEach(vehicleCode => {
              const items = processedData[region].history[vehicleCode];
              // Sort by timestamp, most recent first
              items.sort((a, b) => 
                new Date(b['חותמת זמן']).getTime() - new Date(a['חותמת זמן']).getTime()
              );
              
              // Most recent item with status goes to current
              const currentItem = items[0];
              if (currentItem['סטטוס']) {  // Make sure there's a status
                processedData[region].current.push(currentItem);
              }
              // Rest stay in history
              processedData[region].history[vehicleCode] = items.slice(1);
            });
          });
          
          setRegionData({
            'מרכז': { 
              count: processedData['מרכז'].current.length,
              stats: getRegionStats(processedData['מרכז'].current),
              data: processedData['מרכז']
            },
            'צפון': {
              count: processedData['צפון'].current.length,
              stats: getRegionStats(processedData['צפון'].current),
              data: processedData['צפון']
            },
            'דרום': {
              count: processedData['דרום'].current.length,
              stats: getRegionStats(processedData['דרום'].current),
              data: processedData['דרום']
            }
          });
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


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-lg p-8" dir="rtl">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">יחידות צמ"ה</h2>
        </div>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* יצ"מ צפון */}
        <div 
            className={`relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl 
                transition-all duration-300 cursor-pointer transform hover:-translate-y-1
                ${expandedRegion === 'צפון' ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
            onClick={() => setExpandedRegion(expandedRegion === 'צפון' ? null : 'צפון')}
            >
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <div className="p-6">
                <div className="flex justify-between items-start">
                <div className="flex flex-col items-end">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">יצ"מ צפון</h3>
                    <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">כלי רכב פעילים:</span>
                        <span className="text-lg font-semibold text-blue-600">{regionData['צפון'].count}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                        <span className="text-gray-500">תפוס:</span>
                        <span className="font-medium text-orange-600">{regionData['צפון'].stats?.תפוס || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <span className="text-gray-500">מגוייס:</span>
                        <span className="font-medium text-green-600">{regionData['צפון'].stats?.מגוייס || 0}</span>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                </div>
                </div>
            </div>
            </div>
            
        {/* יצ"מ מרכז */}
        <div 
          className={`relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl 
            transition-all duration-300 cursor-pointer transform hover:-translate-y-1
            ${expandedRegion === 'מרכז' ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}
          onClick={() => setExpandedRegion(expandedRegion === 'מרכז' ? null : 'מרכז')}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="p-6">
              <div className="flex justify-between items-start">
              <div className="flex flex-col items-end">
                <h3 className="text-xl font-bold text-gray-800 mb-1">יצ"מ מרכז</h3>
                <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">כלי רכב פעילים:</span>
                        <span className="text-lg font-semibold text-blue-600">{regionData['מרכז'].count}</span>
                    </div>
                     <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                            <span className="text-gray-500">תפוס:</span>
                            <span className="font-medium text-orange-600">{regionData['מרכז'].stats?.תפוס || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                            <span className="text-gray-500">מגוייס:</span>
                            <span className="font-medium text-green-600">{regionData['מרכז'].stats?.מגוייס || 0}</span>
                            </div>
                        </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
  
        {/* יצ"מ דרום */}
        <div 
          className={`relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl 
            transition-all duration-300 cursor-pointer transform hover:-translate-y-1
            ${expandedRegion === 'דרום' ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}
          onClick={() => setExpandedRegion(expandedRegion === 'דרום' ? null : 'דרום')}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="p-6">
              <div className="flex justify-between items-start">
              <div className="flex flex-col items-end">
                <h3 className="text-xl font-bold text-gray-800 mb-1">יצ"מ דרום</h3>
                <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">כלי רכב פעילים:</span>
                        <span className="text-lg font-semibold text-blue-600">{regionData['דרום'].count}</span>
                    </div>
                     <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                            <span className="text-gray-500">תפוס:</span>
                            <span className="font-medium text-orange-600">{regionData['דרום'].stats?.תפוס || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                            <span className="text-gray-500">מגוייס:</span>
                            <span className="font-medium text-green-600">{regionData['דרום'].stats?.מגוייס || 0}</span>
                            </div>
                        </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>



      </div>
  
      {/* Region Tables */}
      {expandedRegion && (
        <div className="mt-8 transition-all duration-300 animate-fade-in">
          <RegionTable 
            data={regionData[expandedRegion as keyof RegionCounts].data} 
            region={expandedRegion} 
          />
        </div>
      )}
    </div>
  )}


//   <div className="mt-8 transition-all duration-300 animate-fade-in">