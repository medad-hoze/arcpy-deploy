'use client';

import { useState, useEffect } from 'react';
import { database } from '@/firebase/config';
import { ref, get, DataSnapshot } from 'firebase/database';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

interface DataItem {
  [key: string]: any;
}

type FirebaseData = {
  [key: string]: DataItem;
}

export default function StatsView() {
  const [data, setData] = useState<DataItem[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dbRef = ref(database, '/data/data');
      const snapshot: DataSnapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const rawData = snapshot.val() as FirebaseData;
        const dataArray = Object.values(rawData);
        
        if (dataArray.length > 0) {
          const firstItem = dataArray[0];
          const cols = Object.keys(firstItem);
          setColumns(cols);
          setSelectedColumn(cols[0]);
          setData(dataArray);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const processDataForChart = (column: string) => {
    const valueCount: { [key: string]: number } = {};
    
    data.forEach(item => {
      const value = item[column]?.toString() || 'לא ידוע';
      valueCount[value] = (valueCount[value] || 0) + 1;
    });

    const chartData = Object.entries(valueCount).map(([name, value]) => ({
      name,
      value
    }));

    // Sort by value in descending order
    chartData.sort((a, b) => b.value - a.value);

    // If there are more than 8 unique values, use bar chart by default
    if (chartData.length > 8) {
      setChartType('bar');
    }

    setChartData(chartData);
  };

  useEffect(() => {
    if (selectedColumn) {
      processDataForChart(selectedColumn);
    }
  }, [selectedColumn, data]);

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderDataList = () => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="bg-white rounded-lg shadow p-4 h-[400px] overflow-y-auto">
        <table className="w-full text-right">
          <thead className="sticky top-0 bg-white border-b">
            <tr>
              <th className="p-2">ערך</th>
              <th className="p-2">כמות</th>
              <th className="p-2">אחוז</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{item.name}</td>
                <td className="p-2">{item.value}</td>
                <td className="p-2">{((item.value / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">סטטיסטיקה</h2>
        
        <div className="flex gap-4 mb-6">
          {/* Column Select */}
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="w-[180px] p-2 border rounded-md bg-white shadow-sm"
            dir="rtl"
          >
            <option value="">בחר עמודה</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>

          {/* Chart Type Select */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'pie' | 'bar')}
            className="w-[180px] p-2 border rounded-md bg-white shadow-sm"
            dir="rtl"
          >
            <option value="pie">תרשים עוגה</option>
            <option value="bar">תרשים עמודות</option>
          </select>
        </div>

        {chartData.length > 0 && (
          <div className="flex gap-6">
            {/* Chart */}
            <div className="flex-1 border rounded-lg p-4 bg-white">
              {chartType === 'pie' ? renderPieChart() : renderBarChart()}
            </div>
            
            {/* Data List */}
            <div className="w-80">
              {renderDataList()}
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">סיכום נתונים</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">סה"כ רשומות</h3>
            <p className="text-3xl font-bold text-gray-900">{data.length}</p>
          </div>
          
          {selectedColumn && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">ערכים ייחודיים</h3>
              <p className="text-3xl font-bold text-gray-900">{chartData.length}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}