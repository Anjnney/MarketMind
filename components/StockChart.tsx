import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StockChartProps {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  price?: number | null;
  currency?: string;
}

const generateMockData = (points: number, startPrice: number) => {
  const data = [];
  let currentPrice = startPrice;
  // Reduce volatility to make it look more realistic intraday
  const volatility = startPrice * 0.005; // 0.5% volatility
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * volatility * 2;
    currentPrice += change;
    data.push({
      time: `${10 + Math.floor(i / 6)}:${(i % 6) * 10}`,
      price: currentPrice
    });
  }
  return data;
};

const StockChart: React.FC<StockChartProps> = ({ symbol, sentiment, price, currency = 'USD' }) => {
  // Use the provided price, or default to 150 if loading/unavailable
  const startPrice = price || 150;

  // Memoize random data so it doesn't jump on every render, only when symbol or startPrice changes
  const data = useMemo(() => generateMockData(40, startPrice), [symbol, startPrice]);

  const color = sentiment === 'bullish' ? '#10b981' : sentiment === 'bearish' ? '#ef4444' : '#6366f1';
  const gradientId = `colorPrice-${symbol}`;

  return (
    <div className="h-full w-full bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 text-sm font-medium">Intraday Performance (Simulated)</h3>
        <div className="flex items-center space-x-2">
           {price && (
             <span className="text-xl font-bold text-white mr-2">
               {currency === 'INR' || currency === '₹' ? '₹' : '$'}{price.toLocaleString()}
             </span>
           )}
           <span className={`w-2 h-2 rounded-full ${sentiment === 'bullish' ? 'bg-emerald-500' : sentiment === 'bearish' ? 'bg-red-500' : 'bg-indigo-500'}`}></span>
           <span className="text-xs text-gray-500 uppercase">Live</span>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{fill: '#6b7280', fontSize: 10}} 
              axisLine={false}
              tickLine={false}
              interval={5}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{fill: '#6b7280', fontSize: 10}} 
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(val) => `${currency === 'INR' ? '₹' : '$'}${val.toFixed(0)}`}
            />
            <Tooltip 
              contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem'}}
              itemStyle={{color: '#e5e7eb'}}
              formatter={(value: number) => [`${currency === 'INR' ? '₹' : '$'}${value.toFixed(2)}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#${gradientId})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;