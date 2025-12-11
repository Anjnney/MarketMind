export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  timestamp: string;
}

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  url?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisResult {
  markdown: string;
  groundingChunks?: GroundingChunk[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export enum AnalysisMode {
  QUICK = 'quick', // Flash + Search
  DEEP = 'deep',   // Pro + Thinking + Search
}

export interface Scenario {
  type: 'Bearish' | 'Base' | 'Bullish';
  priceTarget: number;
  probability: number;
  reasoning: string;
}

export interface Forecast {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  scenarios: Scenario[];
  confidenceScore: number;
}

export interface Recommendation {
  symbol: string;
  name: string;
  price: string;
  currency: string;
  action: 'Buy' | 'Watch' | 'Strong Buy';
  reasoning: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  potentialUpside: string;
  sources: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingSources?: GroundingChunk[];
}