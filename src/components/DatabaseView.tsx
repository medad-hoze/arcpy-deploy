'use client';
import { useEffect, useState } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '@/firebase/config';
import { Loader2, Search, ChevronUp, ChevronDown, Settings, X, Save, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleData {
  [key: string]: any;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface ColumnConfig {
  key: string;
  visible: boolean;
  priority: number;
}

interface EditingCell {
  rowIndex: number;
  columnKey: string;
  value: string;
}

export default function DatabaseView() {
  // Move useAuth to the top level
  const { user, canEdit } = useAuth();

  const [data, setData] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Priority columns that should always appear first
  const priorityColumns = [
    'דגם',
    'יצרן',
    'קבוצה',
    'סטטוס',
    'אזור',
    'בעלים',
    'טלפון בעלים',
    'מקור'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, '/data/data');
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const dataArray = Array.isArray(rawData) ? rawData : [];
          setData(dataArray);
          
          if (dataArray.length > 0) {
            const allColumns = Array.from(
              new Set(dataArray.flatMap(item => Object.keys(item)))
            );
            
            const configs = allColumns.map(column => ({
              key: column,
              visible: priorityColumns.includes(column),
              priority: priorityColumns.indexOf(column)
            }));
            
            configs.sort((a, b) => {
              if (a.priority === -1 && b.priority === -1) return a.key.localeCompare(b.key, 'he');
              if (a.priority === -1) return 1;
              if (b.priority === -1) return -1;
              return a.priority - b.priority;
            });
            
            setColumnConfigs(configs);
          }
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

  const filterAndSortData = (data: VehicleData[]) => {
    let result = [...data];
    
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    Object.entries(activeFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        result = result.filter(item =>
          item[column]?.toString().toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });
    
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key]?.toString() || '';
        const bVal = b[sortConfig.key]?.toString() || '';
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal, 'he')
          : bVal.localeCompare(aVal, 'he');
      });
    }
    
    return result;
  };

  const handleCellUpdate = async (rowIndex: number, columnKey: string, newValue: string) => {
    if (!user) {
      alert('יש להתחבר כדי לערוך נתונים');
      setEditingCell(null);
      return;
    }

    try {
      setSaveLoading(true);
      
      const item = filteredData[rowIndex];
      const updatedItem = { ...item, [columnKey]: newValue };
      
      const itemRef = ref(database, `/data/data/${rowIndex}`);
      await set(itemRef, updatedItem);

      setData(prevData => {
        const newData = [...prevData];
        const originalIndex = prevData.findIndex(d => 
          Object.entries(d).every(([key, value]) => item[key] === value)
        );
        if (originalIndex !== -1) {
          newData[originalIndex] = updatedItem;
        }
        return newData;
      });

      setEditingCell(null);
    } catch (error: any) {
      console.error('Error updating cell:', error);
      if (error.code === 'PERMISSION_DENIED') {
        alert('אין לך הרשאות לעריכת נתונים');
      } else {
        alert('שגיאה בעדכון הנתונים. אנא נסה שנית');
      }
      setEditingCell(null);
    } finally {
      setSaveLoading(false);
    }
  };

  const renderCell = (item: VehicleData, columnKey: string, rowIndex: number) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === columnKey;
    const value = item[columnKey];

    if (isEditing && canEdit) {
      return (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            className="w-full px-2 py-1 border rounded text-right"
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCellUpdate(rowIndex, columnKey, editingCell.value);
              }
            }}
            onBlur={() => setEditingCell(null)}
          />
          <button
            onClick={() => handleCellUpdate(rowIndex, columnKey, editingCell.value)}
            className="p-1 text-green-600 hover:text-green-800"
            disabled={saveLoading}
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="group flex items-center justify-between">
        {canEdit && (
          <button
            onClick={() => setEditingCell({ rowIndex, columnKey, value: value?.toString() || '' })}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
        <span>
          {value === "לא ידוע" ? (
            <span className="text-gray-400">-</span>
          ) : (
            value?.toString() || '-'
          )}
        </span>
      </div>
    );
  };

  const visibleColumns = columnConfigs.filter(config => config.visible);
  const filteredData = filterAndSortData(data);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="mr-2 text-gray-600">טוען נתונים...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">רשימת כלי רכב</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              ניהול עמודות
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

        {/* Column Manager */}
        {showColumnManager && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {columnConfigs.map((config) => (
                <button
                  key={config.key}
                  onClick={() => setColumnConfigs(prev =>
                    prev.map(c =>
                      c.key === config.key ? { ...c, visible: !c.visible } : c
                    )
                  )}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition-colors ${
                    config.visible
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {config.key}
                  {config.visible ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <span>+</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([column, value]) => (
              <div key={column} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {column}: {value}
                <X
                  className="h-4 w-4 cursor-pointer hover:text-blue-900"
                  onClick={() => {
                    const newFilters = { ...activeFilters };
                    delete newFilters[column];
                    setActiveFilters(newFilters);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {visibleColumns.map((config) => (
                  <th
                    key={config.key}
                    className="group px-6 py-3 text-right text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                    onClick={() => setSortConfig({
                      key: config.key,
                      direction: sortConfig?.key === config.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          onClick={(e) => e.stopPropagation()}
                          placeholder="סנן"
                          className="w-20 px-2 py-1 text-xs border rounded"
                          value={activeFilters[config.key] || ''}
                          onChange={(e) => setActiveFilters(prev => ({
                            ...prev,
                            [config.key]: e.target.value
                          }))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {config.key}
                        {sortConfig?.key === config.key && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {visibleColumns.map((config) => (
                    <td
                      key={config.key}
                      className="px-6 py-4 text-sm text-gray-900"
                    >
                      <div className="text-right">
                        {renderCell(item, config.key, rowIndex)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <div>
          מציג {filteredData.length} מתוך {data.length} רשומות
        </div>
        <div>
          עמודות מוצגות: {visibleColumns.length} מתוך {columnConfigs.length}
        </div>
      </div>
    </div>
  );
}