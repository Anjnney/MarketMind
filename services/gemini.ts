import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AnalysisMode, AnalysisResult, GroundingChunk, Forecast, Recommendation } from "../types";

// Initialize the client
// The API key is injected via process.env.API_KEY automatically.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketNews = async (): Promise<{ news: string, chunks: GroundingChunk[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "What are the top 5 most important financial news headlines right now? Format as a concise list.",
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    return {
      news: response.text || "Unable to fetch news.",
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error fetching news:", error);
    return { news: "Error fetching market news.", chunks: [] };
  }
};

export const getLivePrice = async (symbol: string): Promise<{ price: number, currency: string, exchange: string } | null> => {
  try {
    const prompt = `Find the current real-time price of stock symbol "${symbol}". 
    Return a JSON object with:
    - price (number)
    - currency (string, e.g., USD, INR, EUR)
    - exchange (string, e.g., NYSE, NSE, NASDAQ)
    
    If the symbol exists on multiple exchanges (like ICICI Bank on NSE vs IBN on NYSE), choose the primary domestic exchange unless the symbol explicitly implies the ADR.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            exchange: { type: Type.STRING }
          },
          required: ["price", "currency", "exchange"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Price fetch error:", error);
    return null;
  }
};

export const analyzeStock = async (
  symbol: string, 
  mode: AnalysisMode,
  onStream?: (text: string) => void
): Promise<AnalysisResult> => {
  const modelName = mode === AnalysisMode.DEEP ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
  
  let systemInstruction;
  let prompt;

  if (mode === AnalysisMode.DEEP) {
    // 70+ Years Experience / Value Investing Persona
    systemInstruction = `You are a legendary "Master Investor" with 70+ years of experience. You do not write generic reports; you write definitive, data-dense "Business Owner" breakdowns.

    Your goal is to provide specific numbers, specific names, and specific dates. Avoid vague phrases like "good performance."

    CRITICAL: Detect the correct Exchange and Currency. 
    - If user asks for "ICICI Bank" (NSE), do NOT quote the "IBN" (NYSE) price. 
    - Quote prices in the local currency.

    MANDATORY DATA POINTS TO FIND & INCLUDE:
    - Live Price, Market Cap, P/E Ratio.
    - For Banks: CASA Ratio, Net Interest Margin (NIM), Net NPA, PCR (Provision Coverage Ratio).
    - For Tech: Retention Rates, CAC/LTV, Cloud Growth % (if applicable).
    - Management Names: Specifically name the CEO and their key strategic shifts.
    - Valuation: Compare Current P/E vs 5-Year Median P/E.

    STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

    ### Executive Summary: The 30-Second Snapshot
    (Bullet points of Price [with Currency], Valuation, and a 1-word Verdict: Buy/Sell/Wait)

    ### I. The Business & The Moat (The Engine)
    - Explain the business model simply.
    - **The Moat:** specifically identify the Cost Advantage (e.g. CASA %), Switching Costs, or Network Effects.
    - **The Shift:** How has the business changed in the last 5 years? (e.g. Corporate to Retail).

    ### II. The Management (The Jockey)
    - **The Leader:** Name them. Are they a "Grower" or a "Consolidator"?
    - **Integrity Check:** Any red flags?
    - **Skin in the Game:** Do they own stock?

    ### III. The Financial Microscope (Deep Dive)
    - Provide a data table or list of key metrics (ROE, ROA, Margins).
    - **The "Owner Earnings" Test:** Is cash flow growing?
    - **Asset Quality:** (Crucial for lenders) - State the Net NPA %.

    ### IV. Valuation & Targets (The Price)
    - **Is it Cheap?** Compare P/E to historical averages.
    - **The "Buffett" Test:** Is it a wonderful business at a fair price?

    ### V. Predictions & Future Outlook (12-24 Months)
    - **Consensus Targets:** Estimate a specific price range for 12 months out based on earnings growth.
    - **The Catalyst:** What specific event could trigger a rally? (e.g. Rate cuts, IPO of subsidiary).
    - **The Risk:** What is the #1 thing that could kill the thesis?

    ### VI. Final Verdict
    (Definitive conclusion for a long-term holder)`;

    prompt = `Conduct a rigorous, data-heavy "Master Investor" analysis of ${symbol}. Get every single detail. finding specific latest quarterly numbers (NPA, Margins, CASA) and Management details. Include a specific Price Prediction section.`;

  } else {
    // Quick Snapshot Persona
    systemInstruction = `You are MarketMind, a senior financial analyst.
    Provide a concise snapshot of price, recent news, and technical stance.
    Always use Google Search to get the latest price and news.`;

    prompt = `Analyze ${symbol}. Provide a structured report including Current Price (approx), Key Catalysts, Risks, and a Verdict (Buy/Sell/Hold).`;
  }

  const config: any = {
    tools: [{ googleSearch: {} }],
  };

  if (mode === AnalysisMode.DEEP) {
    config.thinkingConfig = { thinkingBudget: 4096 }; // Allocate thinking budget for deep analysis
  }

  try {
    // We use streaming for better UX on long analyses
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: prompt,
      config: {
        ...config,
        systemInstruction,
      },
    });

    let fullText = "";
    let finalResponse: GenerateContentResponse | null = null;

    for await (const chunk of result) {
      const text = chunk.text || "";
      fullText += text;
      if (onStream) onStream(fullText);
      finalResponse = chunk; // Keep reference to last chunk for metadata
    }

    // Determine sentiment based on text analysis
    const lowerText = fullText.toLowerCase();
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (lowerText.includes('invest') || lowerText.includes('buy') || lowerText.includes('bullish')) sentiment = 'bullish';
    else if (lowerText.includes('pass') || lowerText.includes('sell') || lowerText.includes('bearish')) sentiment = 'bearish';

    return {
      markdown: fullText,
      groundingChunks: finalResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      sentiment
    };

  } catch (error) {
    console.error("Analysis error:", error);
    return {
      markdown: "Failed to generate analysis. Please try again.",
      sentiment: 'neutral'
    };
  }
};

export const getForecast = async (symbol: string): Promise<Forecast | null> => {
  try {
    // Step 1: Gather real-time context using Flash + Search
    const contextPrompt = `Get the current price, currency, and exchange for ${symbol}.
    CRITICAL: Ensure you identify the correct currency (e.g. INR for Indian stocks, USD for US stocks).
    Do not confuse the US ADR price with the local share price.`;
    
    const contextResp = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    const context = contextResp.text;

    // Step 2: Use Pro model with Thinking to generate forecast scenarios
    const prompt = `Based on this real-time context: 
    "${context}"
    
    Generate a 3-month price forecast for ${symbol}.
    Create 3 distinct scenarios: Bearish, Base, and Bullish.
    Assign a probability to each (must sum to 100%).
    Provide a specific price target for each scenario IN THE SAME CURRENCY as the context price.
    Estimate the current price.
    Estimate an overall confidence score (0-100).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            timeframe: { type: Type.STRING },
            currentPrice: { type: Type.NUMBER },
            confidenceScore: { type: Type.NUMBER },
            scenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "One of: Bearish, Base, Bullish" },
                  priceTarget: { type: Type.NUMBER },
                  probability: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ["type", "priceTarget", "probability", "reasoning"]
              }
            }
          },
          required: ["symbol", "scenarios", "confidenceScore"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Forecast;
    }
    return null;

  } catch (error) {
    console.error("Forecast error:", error);
    return null;
  }
};

export const getTopPicks = async (
  market: 'US' | 'IN', 
  timeframe: string
): Promise<{ recommendations: Recommendation[], strategyUsed: string }> => {
  const tf = timeframe.toLowerCase();
  let strategy = "";

  // Determine strategy based on timeframe
  if (tf.includes('day') || tf.includes('intraday')) {
     strategy = "INTRA-DAY MOMENTUM. Focus on high relative volume, pre-market movers, earnings beats, and immediate volatility.";
  } else if (tf.includes('week')) {
     strategy = "SWING TRADING. Focus on technical breakouts, sector rotation, and short-term news catalysts.";
  } else if (tf.includes('month')) {
     // Check for specific month counts
     if (tf.includes('1') || tf.includes('2') || tf.includes('3')) {
       strategy = "SHORT-TO-MEDIUM TERM TREND. Focus on earnings growth, relative strength (RSI), and moving average crossovers.";
     } else if (tf.includes('4') || tf.includes('5') || tf.includes('6')) {
        strategy = "POSITION TRADING. Focus on macro trends, fundamental growth, and sustained sector leadership.";
     } else {
        // Fallback for generic 'months'
        strategy = "TREND FOLLOWING. Focus on fundamental catalysts and technical trends.";
     }
  } else if (tf.includes('year')) {
     strategy = "LONG TERM VALUE & COMPOUNDING. Focus on undervalued companies with wide moats, high ROIC, and durable competitive advantages (Buffett Style).";
  } else {
     // Default fallback
     strategy = "BALANCED GROWTH & VALUE. Focus on companies with strong fundamentals and technical uptrends.";
  }
  
  const marketContext = market === 'IN' 
    ? "Indian Stock Market (NSE/BSE). Prices in INR." 
    : "US Stock Market (NYSE/NASDAQ). Prices in USD.";

  const prompt = `You are an expert Portfolio Manager.
  Market: ${marketContext}
  Investment Horizon: ${timeframe}
  Selected Strategy: ${strategy}

  Using Google Search, identify 4 of the BEST stocks to buy right now that match this specific strategy and timeframe.
  Get real-time prices.
  Provide a structured JSON response.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.STRING, description: "Current price with currency symbol" },
              currency: { type: Type.STRING },
              action: { type: Type.STRING, enum: ["Buy", "Strong Buy", "Watch"] },
              reasoning: { type: Type.STRING, description: "Why this fits the strategy and timeframe" },
              riskLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              potentialUpside: { type: Type.STRING, description: "Estimated % upside" },
              sources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 1-2 key news sources or websites used to validate this pick" }
            },
            required: ["symbol", "name", "price", "reasoning", "riskLevel", "sources"]
          }
        }
      }
    });

    if (response.text) {
      return {
        recommendations: JSON.parse(response.text) as Recommendation[],
        strategyUsed: strategy
      };
    }
    return { recommendations: [], strategyUsed: strategy };
  } catch (error) {
    console.error("Screener error:", error);
    return { recommendations: [], strategyUsed: strategy };
  }
};

export const generateAppThumbnail = async (): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: "A futuristic, cinematic 3D render of a financial AI assistant interface named 'MarketMind'. Dark mode, glowing emerald green data streams, holographic stock charts, and a central digital brain. Professional, high-tech, 8k resolution, aspect ratio 16:9." }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9'
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (e) {
    console.error("Thumbnail generation error", e);
    return null;
  }
};