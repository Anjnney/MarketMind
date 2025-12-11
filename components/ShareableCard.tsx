import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Share2 } from 'lucide-react';

interface ShareableCardProps {
  symbol: string;
  price: number | string;
  currency: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence?: number;
}

const ShareableCard: React.FC<ShareableCardProps> = ({ symbol, price, currency, sentiment, confidence = 85 }) => {
  const isBullish = sentiment === 'bullish';
  const isBearish = sentiment === 'bearish';
  
  const bgGradient = isBullish 
    ? 'from-emerald-950 to-gray-950' 
    : isBearish 
      ? 'from-red-950 to-gray-950' 
      : 'from-indigo-950 to-gray-950';
      
  const accentColor = isBullish ? 'text-emerald-400' : isBearish ? 'text-red-400' : 'text-indigo-400';
  const borderColor = isBullish ? 'border-emerald-500/30' : isBearish ? 'border-red-500/30' : 'border-indigo-500/30';
  const glowColor = isBullish ? 'shadow-emerald-900/20' : isBearish ? 'shadow-red-900/20' : 'shadow-indigo-900/20';

  return (
    <div className={`relative w-[560px] h-[280px] rounded-xl border ${borderColor} bg-gradient-to-br ${bgGradient} p-8 flex flex-col justify-between overflow-hidden shadow-2xl ${glowColor}`}>
      {/* Background Ambient Effects */}
      <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-10 -translate-y-10">
         <Activity className="w-64 h-64 text-white" />
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${isBullish ? 'from-emerald-500 to-transparent' : isBearish ? 'from-red-500 to-transparent' : 'from-indigo-500 to-transparent'}`}></div>

      {/* Header Section */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <div className="flex items-baseline space-x-3">
             <h1 className="text-5xl font-bold text-white tracking-tight">{symbol}</h1>
             <span className="text-xs text-gray-500 font-mono bg-gray-900 px-2 py-1 rounded border border-gray-800">
                {currency}
             </span>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-3xl text-gray-200 font-medium tracking-tight">
              {currency === 'INR' || currency === '₹' ? '₹' : '$'}{typeof price === 'number' ? price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : price}
            </span>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-900/80 backdrop-blur-sm border ${borderColor} shadow-lg`}>
           {isBullish && <TrendingUp className={`w-6 h-6 ${accentColor}`} />}
           {isBearish && <TrendingDown className={`w-6 h-6 ${accentColor}`} />}
           {!isBullish && !isBearish && <Minus className={`w-6 h-6 ${accentColor}`} />}
           <span className={`text-xl font-bold uppercase ${accentColor} tracking-wide`}>{sentiment}</span>
        </div>
      </div>

      {/* Footer Section */}
      <div className="relative z-10">
        <div className="flex justify-between items-end">
           <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 font-semibold">AI Confidence Score</p>
              <div className="flex items-center space-x-3">
                <div className="h-2.5 w-40 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700">
                   <div 
                      className={`h-full transition-all duration-1000 ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-red-500' : 'bg-indigo-500'}`} 
                      style={{width: `${confidence}%`}}
                   ></div>
                </div>
                <span className="text-white font-mono font-bold">{confidence}%</span>
              </div>
           </div>
           
           <div className="text-right">
              <div className="flex items-center justify-end text-white font-bold text-lg">
                <div className={`p-1.5 rounded mr-2 ${isBullish ? 'bg-emerald-500/20' : isBearish ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>
                   <Activity className={`w-4 h-4 ${accentColor}`} />
                </div>
                MarketMind
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 opacity-70">AI Financial Terminal</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ShareableCard;