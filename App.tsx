import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Search, 
  Activity, 
  Newspaper, 
  Zap, 
  Brain, 
  LayoutDashboard,
  TrendingUp,
  Globe,
  ArrowRight,
  ShieldAlert,
  Target,
  BarChart3,
  Sparkles,
  Clock,
  MapPin,
  BookOpen,
  Filter,
  Code,
  Download,
  FileCode,
  Terminal,
  Share2,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { getMarketNews, analyzeStock, getForecast, getTopPicks, getLivePrice, generateAppThumbnail } from './services/gemini';
import { getPythonCode, getNotebookCode } from './services/pythonExport';
import { AnalysisMode, AnalysisResult, Forecast, Recommendation } from './types';
import StockChart from './components/StockChart';
import MarkdownRenderer from './components/MarkdownRenderer';
import ShareableCard from './components/ShareableCard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'research' | 'picks' | 'export'>('dashboard');
  const [symbol, setSymbol] = useState('NVDA'); // Default symbol
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);
  const [news, setNews] = useState<{news: string, chunks: any[]}>({ news: '', chunks: [] });
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.QUICK);
  
  // Real-time price state
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('USD');
  
  // Screener State
  const [pickMarket, setPickMarket] = useState<'US' | 'IN'>('US');
  const [pickTimeframe, setPickTimeframe] = useState('1 Month');
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [picks, setPicks] = useState<Recommendation[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<string>('');
  const [isPicking, setIsPicking] = useState(false);
  
  // Card Modal State
  const [showShareCard, setShowShareCard] = useState(false);

  // Marketing Thumbnail State
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // Auto-scroll for streaming content
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load for dashboard news
    const fetchNews = async () => {
      const data = await getMarketNews();
      setNews(data);
    };
    fetchNews();
  }, []);

  const handleAnalyze = async () => {
    if (!symbol) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setForecast(null); // Reset forecast on new analysis
    setLivePrice(null); // Reset price
    setActiveTab('research');

    // Parallel execution: Get Price instantly, then stream analysis
    try {
      // 1. Fire off price fetch (Fast)
      getLivePrice(symbol).then(data => {
        if (data) {
          setLivePrice(data.price);
          setCurrency(data.currency);
        }
      });

      // 2. Fire off heavy analysis (Streamed)
      const result = await analyzeStock(symbol, analysisMode, (streamedText) => {
        setAnalysisResult(prev => ({
          markdown: streamedText,
          sentiment: 'neutral', // Updated at end
          groundingChunks: prev?.groundingChunks || []
        }));
        if(scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleForecast = async () => {
    if (!symbol) return;
    setIsForecasting(true);
    try {
      const data = await getForecast(symbol);
      setForecast(data);
      if(scrollRef.current) {
        // Scroll to forecast section
        setTimeout(() => {
           scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsForecasting(false);
    }
  };

  const handleGetPicks = async () => {
    setIsPicking(true);
    setPicks([]);
    setActiveStrategy('');
    
    // Use custom timeframe if 'Custom' is selected, otherwise use the dropdown value
    const selectedTimeframe = pickTimeframe === 'Custom' ? customTimeframe : pickTimeframe;
    
    // Fallback if custom is empty
    const finalTimeframe = selectedTimeframe.trim() || '1 Month';

    try {
      const { recommendations, strategyUsed } = await getTopPicks(pickMarket, finalTimeframe);
      setPicks(recommendations);
      setActiveStrategy(strategyUsed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPicking(false);
    }
  };
  
  const handleGenerateThumbnail = async () => {
    setIsGeneratingThumbnail(true);
    const url = await generateAppThumbnail();
    setThumbnailUrl(url);
    setIsGeneratingThumbnail(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-20 lg:w-64 border-r border-gray-800 bg-gray-950 flex flex-col justify-between shrink-0 transition-all duration-300">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
            <Activity className="w-8 h-8 text-emerald-500" />
            <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight">MarketMind</span>
          </div>

          <div className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <LayoutDashboard className="w-5 h-5 lg:mr-3" />
              <span className="hidden lg:block font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('research')}
              className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'research' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <Search className="w-5 h-5 lg:mr-3" />
              <span className="hidden lg:block font-medium">Research</span>
            </button>
            <button 
              onClick={() => setActiveTab('picks')}
              className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'picks' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <Target className="w-5 h-5 lg:mr-3" />
              <span className="hidden lg:block font-medium">Screener</span>
            </button>
            <button 
              onClick={() => setActiveTab('export')}
              className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'export' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}
            >
              <Code className="w-5 h-5 lg:mr-3" />
              <span className="hidden lg:block font-medium">API Export</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
           <div className="flex items-center p-3 rounded-lg bg-gray-900/50 border border-gray-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-3"></div>
              <span className="hidden lg:block text-xs text-gray-400 font-mono">Gemini 2.5 Active</span>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Share Card Modal Overlay */}
        {showShareCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl max-w-3xl w-full relative">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-white flex items-center">
                        <Share2 className="w-5 h-5 mr-2 text-emerald-400" />
                        Shareable Market Card
                     </h3>
                     <button onClick={() => setShowShareCard(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                     </button>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative group">
                          {/* The Card Component */}
                          <ShareableCard 
                             symbol={symbol.toUpperCase()} 
                             price={livePrice || 0} 
                             currency={currency} 
                             sentiment={analysisResult?.sentiment || 'neutral'} 
                             confidence={forecast?.confidenceScore || 85}
                          />
                      </div>
                      <p className="text-xs text-gray-500 font-mono">Dimensions: 560 x 280 (Standard Social Card)</p>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                     <button 
                        onClick={() => setShowShareCard(false)}
                        className="mr-3 px-4 py-2 text-gray-300 hover:text-white font-medium"
                     >
                        Close
                     </button>
                     <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-emerald-900/20">
                        <Download className="w-4 h-4 mr-2" />
                        Save Image
                     </button>
                  </div>
               </div>
            </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Market Overview</h1>
              <p className="text-gray-400">Real-time intelligence grounded in global markets.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => setActiveTab('research')}>
                 <div className="flex justify-between items-start mb-4">
                    <Search className="w-8 h-8 text-emerald-400" />
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                 </div>
                 <h3 className="text-lg font-semibold text-white mb-1">Deep Research</h3>
                 <p className="text-sm text-gray-400">Analyze any stock with "Master Investor" persona.</p>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => setActiveTab('picks')}>
                 <div className="flex justify-between items-start mb-4">
                    <Target className="w-8 h-8 text-indigo-400" />
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                 </div>
                 <h3 className="text-lg font-semibold text-white mb-1">AI Screener</h3>
                 <p className="text-sm text-gray-400">Find top picks based on momentum or value strategies.</p>
              </div>

              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                 <div className="flex justify-between items-start mb-4">
                    <Globe className="w-8 h-8 text-blue-400" />
                    <span className="text-xs font-mono bg-blue-900/30 text-blue-300 px-2 py-1 rounded">LIVE</span>
                 </div>
                 <h3 className="text-lg font-semibold text-white mb-1">Global Sentiment</h3>
                 <p className="text-sm text-gray-400">Market is currently leaning <span className="text-emerald-400 font-medium">Bullish</span> on Tech.</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
               <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Newspaper className="w-5 h-5 mr-2 text-gray-400" />
                    Top Market News
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">Powered by Google Search</span>
               </div>
               <div className="p-6">
                 {news.news ? (
                   <MarkdownRenderer content={news.news} />
                 ) : (
                   <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                   </div>
                 )}
               </div>
               {news.chunks && news.chunks.length > 0 && (
                 <div className="bg-gray-950 px-6 py-4 border-t border-gray-800 flex flex-wrap gap-2">
                    {news.chunks.map((chunk, i) => (
                      chunk.web?.uri && (
                        <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-emerald-400 transition-colors flex items-center bg-gray-900 px-2 py-1 rounded border border-gray-800">
                           <Globe className="w-3 h-3 mr-1" />
                           {chunk.web.title?.slice(0, 30)}...
                        </a>
                      )
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Research Tab */}
        {activeTab === 'research' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Header */}
            <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-6xl mx-auto">
                  <div className="relative flex-1 max-w-xl">
                     <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                     <input 
                        type="text" 
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter symbol (e.g. NVDA, RELIANCE, TSLA)..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono tracking-wider"
                     />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                     <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
                        <button 
                          onClick={() => setAnalysisMode(AnalysisMode.QUICK)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${analysisMode === AnalysisMode.QUICK ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Zap className="w-4 h-4 inline mr-1" /> Flash
                        </button>
                        <button 
                          onClick={() => setAnalysisMode(AnalysisMode.DEEP)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${analysisMode === AnalysisMode.DEEP ? 'bg-indigo-900/50 text-indigo-300' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Brain className="w-4 h-4 inline mr-1" /> Deep Pro
                        </button>
                     </div>

                     <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-emerald-900/20"
                     >
                        {isAnalyzing ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Analyzing...</>
                        ) : (
                          'Analyze'
                        )}
                     </button>
                  </div>
               </div>
            </div>

            {/* Analysis Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8" ref={scrollRef}>
               <div className="max-w-6xl mx-auto space-y-8">
                  
                  {/* Top Section: Chart & Price */}
                  {(livePrice || isAnalyzing) && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-2 h-[350px]">
                           <StockChart 
                              symbol={symbol} 
                              price={livePrice} 
                              currency={currency}
                              sentiment={analysisResult?.sentiment || 'neutral'} 
                           />
                        </div>
                        <div className="space-y-4">
                           <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 h-full flex flex-col justify-between">
                              <div>
                                <h3 className="text-gray-400 text-sm font-medium mb-1">AI Verdict</h3>
                                <div className="flex items-center space-x-2 mb-4">
                                   <div className={`text-2xl font-bold uppercase ${analysisResult?.sentiment === 'bullish' ? 'text-emerald-400' : analysisResult?.sentiment === 'bearish' ? 'text-red-400' : 'text-gray-100'}`}>
                                      {analysisResult?.sentiment || 'NEUTRAL'}
                                   </div>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                   Based on real-time analysis of technicals, fundamentals, and recent news flow.
                                </p>
                              </div>
                              
                              <div className="space-y-3 mt-6">
                                 <button 
                                   onClick={handleForecast}
                                   disabled={isForecasting}
                                   className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium transition-all flex items-center justify-center"
                                 >
                                    {isForecasting ? <div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin mr-2"></div> : <Sparkles className="w-4 h-4 mr-2" />}
                                    Generate Forecast
                                 </button>

                                 <button 
                                   onClick={() => setShowShareCard(true)}
                                   className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg font-medium transition-all flex items-center justify-center"
                                 >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Create Share Card
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Markdown Analysis Report */}
                  {analysisResult && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 shadow-2xl">
                       <div className="prose prose-invert max-w-none">
                          <MarkdownRenderer content={analysisResult.markdown} />
                       </div>
                       
                       {/* Sources Footer */}
                       {analysisResult.groundingChunks && analysisResult.groundingChunks.length > 0 && (
                          <div className="mt-8 pt-6 border-t border-gray-800">
                             <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Referenced Sources
                             </h4>
                             <div className="flex flex-wrap gap-3">
                                {analysisResult.groundingChunks.map((chunk, i) => (
                                  chunk.web?.uri && (
                                    <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-emerald-400 bg-gray-950 px-3 py-2 rounded-lg border border-gray-800 transition-colors flex items-center">
                                       {chunk.web.title}
                                    </a>
                                  )
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                  )}

                  {/* Forecast Section */}
                  {forecast && (
                     <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <Target className="w-32 h-32 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center relative z-10">
                           <Target className="w-6 h-6 mr-3 text-indigo-400" />
                           Probabilistic Forecast (3 Months)
                        </h2>
                        
                        <div className="flex items-center mb-8 relative z-10">
                           <div className="mr-4 text-sm text-gray-400">Model Confidence:</div>
                           <div className="h-2 w-32 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{width: `${forecast.confidenceScore}%`}}></div>
                           </div>
                           <span className="ml-3 font-mono text-indigo-400 font-bold">{forecast.confidenceScore}%</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                           {forecast.scenarios.map((scenario, idx) => (
                              <div key={idx} className={`p-6 rounded-xl border ${
                                 scenario.type === 'Bullish' ? 'bg-emerald-950/20 border-emerald-500/30' :
                                 scenario.type === 'Bearish' ? 'bg-red-950/20 border-red-500/30' :
                                 'bg-gray-800/50 border-gray-700'
                              }`}>
                                 <div className="flex justify-between items-center mb-2">
                                    <span className={`text-sm font-bold uppercase tracking-wider ${
                                       scenario.type === 'Bullish' ? 'text-emerald-400' :
                                       scenario.type === 'Bearish' ? 'text-red-400' :
                                       'text-gray-400'
                                    }`}>{scenario.type} Case</span>
                                    <span className="text-xs font-mono bg-gray-950 px-2 py-1 rounded text-gray-500">{scenario.probability}% Prob</span>
                                 </div>
                                 <div className="text-3xl font-bold text-white mb-3 tracking-tight">
                                    {currency === 'INR' ? '₹' : '$'}{scenario.priceTarget}
                                 </div>
                                 <p className="text-sm text-gray-400 leading-relaxed">
                                    {scenario.reasoning}
                                 </p>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Screener Tab */}
        {activeTab === 'picks' && (
           <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-6xl mx-auto">
                 <header className="mb-8">
                   <h1 className="text-3xl font-bold text-white mb-2">AI Stock Screener</h1>
                   <p className="text-gray-400">Find high-potential setups based on your strategy.</p>
                 </header>

                 {/* Filters */}
                 <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                       <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Market</label>
                          <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
                             <button 
                               onClick={() => setPickMarket('US')}
                               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${pickMarket === 'US' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                                US (NYSE/NAS)
                             </button>
                             <button 
                               onClick={() => setPickMarket('IN')}
                               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${pickMarket === 'IN' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                                India (NSE)
                             </button>
                          </div>
                       </div>
                       
                       <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Timeframe</label>
                          <select 
                             value={pickTimeframe} 
                             onChange={(e) => setPickTimeframe(e.target.value)}
                             className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500/50"
                          >
                             <option>Intraday (Day Trade)</option>
                             <option>1 Week (Swing)</option>
                             <option>1 Month (Short Term)</option>
                             <option>6 Months (Position)</option>
                             <option>1 Year+ (Investing)</option>
                             <option>Custom</option>
                          </select>
                       </div>

                       {pickTimeframe === 'Custom' && (
                         <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Horizon</label>
                            <input 
                              type="text" 
                              value={customTimeframe}
                              onChange={(e) => setCustomTimeframe(e.target.value)}
                              placeholder="e.g. 5 Years"
                              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                            />
                         </div>
                       )}

                       <button 
                          onClick={handleGetPicks}
                          disabled={isPicking}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                       >
                          {isPicking ? 'Scanning Markets...' : 'Find Top Picks'}
                       </button>
                    </div>
                 </div>

                 {/* Strategy Badge */}
                 {activeStrategy && (
                    <div className="mb-6 flex items-start space-x-3 p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-lg">
                       <Brain className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                       <div>
                          <h4 className="text-sm font-bold text-indigo-300 mb-1">Active AI Strategy</h4>
                          <p className="text-sm text-gray-400">{activeStrategy}</p>
                       </div>
                    </div>
                 )}

                 {/* Results Grid */}
                 {picks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {picks.map((pick, i) => (
                          <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-emerald-500/30 transition-all group">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                   <div className="flex items-center space-x-2">
                                      <h3 className="text-xl font-bold text-white">{pick.symbol}</h3>
                                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{pick.currency}</span>
                                   </div>
                                   <div className="text-sm text-gray-500 mt-1">{pick.name}</div>
                                </div>
                                <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                                   pick.action === 'Strong Buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                   pick.action === 'Buy' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/20' :
                                   'bg-gray-800 text-gray-400'
                                }`}>
                                   {pick.action}
                                </div>
                             </div>

                             <div className="flex items-baseline space-x-4 mb-4">
                                <div className="text-2xl font-medium text-white">{pick.price}</div>
                                <div className="text-sm text-emerald-400 flex items-center">
                                   <TrendingUp className="w-3 h-3 mr-1" />
                                   {pick.potentialUpside} Upside
                                </div>
                             </div>

                             <div className="space-y-3 mb-6">
                                <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-gray-700 pl-3">
                                   {pick.reasoning}
                                </p>
                             </div>

                             <div className="flex items-center justify-between pt-4 border-t border-gray-800 text-xs">
                                <div className="flex items-center space-x-2">
                                   <span className="text-gray-500">Risk:</span>
                                   <span className={`font-medium ${
                                      pick.riskLevel === 'High' ? 'text-red-400' :
                                      pick.riskLevel === 'Medium' ? 'text-yellow-400' :
                                      'text-emerald-400'
                                   }`}>{pick.riskLevel}</span>
                                </div>
                                <button 
                                   onClick={() => {
                                      setSymbol(pick.symbol);
                                      handleAnalyze();
                                   }}
                                   className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center group-hover:underline"
                                >
                                   Analyze <ArrowRight className="w-3 h-3 ml-1" />
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
           <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                 <header className="mb-8">
                   <h1 className="text-3xl font-bold text-white mb-2">Developer Studio</h1>
                   <p className="text-gray-400">Export code or create hackathon assets.</p>
                 </header>

                 <div className="space-y-8">
                    {/* Hackathon Brand Studio */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden relative">
                       <div className="bg-gray-950 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                             <ImageIcon className="w-5 h-5 text-emerald-400" />
                             <span className="font-bold text-white tracking-wide">Hackathon Brand Studio</span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">Powered by Gemini Imagen</span>
                       </div>
                       
                       <div className="p-6">
                           <div className="flex flex-col md:flex-row items-center gap-6">
                              <div className="flex-1">
                                 <h3 className="text-lg font-semibold text-white mb-2">Project Thumbnail Generator</h3>
                                 <p className="text-sm text-gray-400 mb-4">
                                    Generate a high-quality, futuristic 16:9 banner for your hackathon submission (Devpost/GitHub). 
                                    This uses the <strong>gemini-2.5-flash-image</strong> model.
                                 </p>
                                 <button 
                                   onClick={handleGenerateThumbnail}
                                   disabled={isGeneratingThumbnail}
                                   className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
                                 >
                                    {isGeneratingThumbnail ? (
                                       <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Generating Asset...</>
                                    ) : (
                                       <><Sparkles className="w-4 h-4 mr-2" /> Generate MarketMind Banner</>
                                    )}
                                 </button>
                              </div>

                              <div className="w-full md:w-[400px] aspect-video bg-gray-950 border border-gray-800 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                 {thumbnailUrl ? (
                                    <>
                                       <img src={thumbnailUrl} alt="MarketMind Thumbnail" className="w-full h-full object-cover" />
                                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <a 
                                            href={thumbnailUrl} 
                                            download="marketmind-hackathon-thumb.png"
                                            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-bold flex items-center hover:bg-gray-200"
                                          >
                                             <Download className="w-4 h-4 mr-2" /> Download PNG
                                          </a>
                                       </div>
                                    </>
                                 ) : (
                                    <div className="text-center p-4">
                                       <ImageIcon className="w-12 h-12 text-gray-800 mx-auto mb-2" />
                                       <p className="text-xs text-gray-600">Preview Area (16:9)</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                       </div>
                    </div>

                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                       <div className="bg-gray-950 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                             <FileCode className="w-5 h-5 text-blue-400" />
                             <span className="font-mono text-sm text-gray-300">market_mind.py</span>
                          </div>
                          <button 
                             onClick={() => navigator.clipboard.writeText(getPythonCode())}
                             className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors"
                          >
                             Copy Code
                          </button>
                       </div>
                       <pre className="p-6 text-xs font-mono text-gray-400 overflow-x-auto">
                          {getPythonCode().slice(0, 500)}...
                          <div className="text-emerald-500 mt-2"># ... (Download full file to see rest)</div>
                       </pre>
                    </div>

                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                       <div className="bg-gray-950 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                             <Terminal className="w-5 h-5 text-orange-400" />
                             <span className="font-mono text-sm text-gray-300">Jupyter Notebook (.ipynb)</span>
                          </div>
                          <button 
                             onClick={() => {
                                const blob = new Blob([getNotebookCode()], {type: "application/json"});
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = "market_mind_analysis.ipynb";
                                a.click();
                             }}
                             className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors flex items-center"
                          >
                             <Download className="w-3 h-3 mr-1" />
                             Download Notebook
                          </button>
                       </div>
                       <div className="p-6 text-sm text-gray-400">
                          <p>
                             Download the fully executable Jupyter Notebook. It includes:
                          </p>
                          <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-500">
                             <li>Gemini SDK Setup</li>
                             <li>Grounding Search Functions</li>
                             <li>Master Investor Persona Prompts</li>
                             <li>Structured JSON Extraction Logic</li>
                          </ul>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default App;