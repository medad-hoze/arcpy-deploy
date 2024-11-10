import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '@/firebase/config';
import { Loader2, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';

type TimeFrame = 'year' | 'month' | 'week' | 'day';

interface StatsData {
  date: string;
  count: number;
}

export default function StatsDashboard() {
  const [data, setData] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [totalCount, setTotalCount] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dbRef = ref(database, '/recruited');
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const dataArray = Array.isArray(rawData) ? rawData : Object.values(rawData);

          // Filter for מגוייס status
          const filteredData = dataArray.filter((item: any) => 
            item['סטטוס'] === 'מגוייס'
          );

          // Create date range based on timeframe
          const now = new Date();
          let startDate = new Date();
          let dateFormat: Intl.DateTimeFormatOptions;
          
          switch (timeFrame) {
            case 'year':
              startDate.setFullYear(startDate.getFullYear() - 4);
              dateFormat = { year: 'numeric' };
              break;
            case 'month':
              startDate.setMonth(startDate.getMonth() - 11);
              dateFormat = { month: '2-digit', year: 'numeric' };
              break;
            case 'week':
              startDate.setDate(startDate.getDate() - 11 * 7);
              dateFormat = { month: '2-digit', day: '2-digit' };
              break;
            case 'day':
              startDate.setDate(startDate.getDate() - 29);
              dateFormat = { month: '2-digit', day: '2-digit' };
              break;
          }

          const groupedData: { [key: string]: number } = {};

          // Initialize all dates with 0
          let currentDate = new Date(startDate);
          while (currentDate <= now) {
            const key = new Intl.DateTimeFormat('he-IL', dateFormat).format(currentDate);
            groupedData[key] = 0;
            
            switch (timeFrame) {
              case 'year':
                currentDate.setFullYear(currentDate.getFullYear() + 1);
                break;
              case 'month':
                currentDate.setMonth(currentDate.getMonth() + 1);
                break;
              case 'week':
                currentDate.setDate(currentDate.getDate() + 7);
                break;
              case 'day':
                currentDate.setDate(currentDate.getDate() + 1);
                break;
            }
          }

          // Count recruits by date
          filteredData.forEach((item: any) => {
            const date = new Date(item['חותמת זמן']);
            if (date >= startDate && date <= now) {
              const key = new Intl.DateTimeFormat('he-IL', dateFormat).format(date);
              groupedData[key] = (groupedData[key] || 0) + 1;
            }
          });

          // Format data for chart
          const formattedData = Object.entries(groupedData)
            .map(([date, count]): StatsData => ({
              date,
              count
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

          // Calculate statistics
          const total = formattedData.reduce((sum, item) => sum + item.count, 0);
          const midPoint = Math.floor(formattedData.length / 2);
          const prevPeriod = formattedData.slice(0, midPoint);
          const currentPeriod = formattedData.slice(midPoint);
          
          const prevTotal = prevPeriod.reduce((sum, item) => sum + item.count, 0);
          const currentTotal = currentPeriod.reduce((sum, item) => sum + item.count, 0);
          
          const change = prevTotal === 0 ? 0 : 
            ((currentTotal - prevTotal) / prevTotal) * 100;

          setTotalCount(total);
          setPercentageChange(change);
          setData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const renderTimeFrameButton = (frame: TimeFrame, label: string) => (
    <button
      onClick={() => setTimeFrame(frame)}
      className={`px-4 py-2 rounded-lg transition-all ${
        timeFrame === frame 
          ? 'bg-blue-500 text-white shadow-lg scale-105' 
          : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border'
      }`}
    >
      {label}
    </button>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-blue-600 font-bold">{payload[0].value} גיוסים</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">סה"כ גיוסים</p>
              <h3 className="text-2xl font-bold mt-1">{totalCount}</h3>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">שינוי</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold">
                  {Math.abs(percentageChange).toFixed(1)}%
                </h3>
                {percentageChange > 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${
              percentageChange > 0 ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          {renderTimeFrameButton('year', 'שנתי')}
          {renderTimeFrameButton('month', 'חודשי')}
          {renderTimeFrameButton('week', 'שבועי')}
          {renderTimeFrameButton('day', 'יומי')}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                angle={45} 
                textAnchor="start" 
                height={60} 
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="none"
                fill="url(#colorCount)"
              />
              <Line 
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}