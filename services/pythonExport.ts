export const getPythonCode = () => `import os
import json
import time
from google import genai
from google.genai import types

# -----------------------------------------------------------------------------
# MARKETMIND: AI FINANCIAL INTELLIGENCE TERMINAL (PYTHON EDITION)
# Powered by Google Gemini 2.5 & 3.0
# -----------------------------------------------------------------------------

# CONFIGURATION
# Make sure to set your API key in your environment variables
# export GOOGLE_API_KEY="your_api_key_here"
API_KEY = os.environ.get("GOOGLE_API_KEY")

if not API_KEY:
    print("⚠️  WARNING: GOOGLE_API_KEY not found in environment variables.")
    print("Attempting to use direct key (for testing only)...")
    # API_KEY = "Paste key here for quick test" 

if not API_KEY:
    raise ValueError("Please set the GOOGLE_API_KEY environment variable.")

client = genai.Client(api_key=API_KEY)

# -----------------------------------------------------------------------------
# CORE ENGINE: GROUNDED ANALYSIS & REASONING
# -----------------------------------------------------------------------------

def get_live_price(symbol: str):
    """
    Fetches real-time price using Gemini Search Grounding.
    Returns specific exchange data to avoid ADR/Local confusion.
    """
    print(f"\\n🔎  Fetching real-time data for {symbol}...")
    
    prompt = f"""Find the current real-time price of stock symbol "{symbol}". 
    Return a JSON object with:
    - price (number)
    - currency (string, e.g., USD, INR, EUR)
    - exchange (string, e.g., NYSE, NSE, NASDAQ)
    
    If the symbol exists on multiple exchanges (like ICICI Bank on NSE vs IBN on NYSE), 
    choose the primary domestic exchange unless the symbol explicitly implies the ADR."""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type='application/json',
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "price": {"type": "NUMBER"},
                        "currency": {"type": "STRING"},
                        "exchange": {"type": "STRING"}
                    },
                    "required": ["price", "currency", "exchange"]
                }
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"❌ Error fetching price: {e}")
        return None

def analyze_stock_deep(symbol: str):
    """
    Conducts a 'Master Investor' analysis using the Deep Value persona.
    Mimics the logic of a 70-year veteran investor.
    """
    price_data = get_live_price(symbol)
    price_str = f"{price_data['currency']} {price_data['price']} on {price_data['exchange']}" if price_data else "Market Price"
    
    print(f"🧠  Conducting Deep Value Analysis for {symbol} ({price_str})...")
    print("    This uses Gemini Thinking capability (if available) + Search Grounding.")

    system_instruction = """You are a legendary "Master Investor" with 70+ years of experience. 
    You do not write generic reports; you write definitive, data-dense "Business Owner" breakdowns.

    MANDATORY DATA POINTS TO FIND:
    - Live Price, Market Cap, P/E Ratio.
    - For Banks: CASA Ratio, Net Interest Margin (NIM), Net NPA, PCR.
    - For Tech: Retention Rates, CAC/LTV.
    - Valuation: Compare Current P/E vs 5-Year Median P/E.

    STRUCTURE:
    ### Executive Summary: The 30-Second Snapshot
    ### I. The Business & The Moat (The Engine)
    ### II. The Management (The Jockey)
    ### III. The Financial Microscope (Deep Dive)
    ### IV. Valuation & Targets (The Price)
    ### V. Predictions & Future Outlook (12-24 Months)
    ### VI. Final Verdict (Buy/Sell/Wait)"""

    prompt = f"""Conduct a rigorous, data-heavy "Master Investor" analysis of {symbol}. 
    Context Price: {price_str}.
    Get every single detail. Find specific latest quarterly numbers."""

    # Use gemini-3-pro-preview for complex reasoning if you have access, otherwise gemini-2.5-flash
    model_name = 'gemini-2.5-flash' 
    
    # Configuration for Thinking (only works on supported models like gemini-2.5-flash-thinking)
    # config = types.GenerateContentConfig(
    #     tools=[types.Tool(google_search=types.GoogleSearch())],
    #     system_instruction=system_instruction,
    #     thinking_config=types.ThinkingConfig(thinking_budget=2048) 
    # )
    
    # Standard Config
    config = types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
        system_instruction=system_instruction
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=config
    )
    
    return response.text, response.candidates[0].grounding_metadata.grounding_chunks

def get_forecast(symbol: str):
    """
    Generates a 3-scenario probabilistic forecast using structured JSON output.
    """
    print(f"🔮  Generating probabilistic forecast for {symbol}...")
    
    prompt = f"""Generate a 3-month price forecast for {symbol}.
    Create 3 distinct scenarios: Bearish, Base, and Bullish.
    Assign a probability to each (must sum to 100%).
    Provide a specific price target for each.
    Estimate an overall confidence score (0-100)."""
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            response_mime_type='application/json',
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "symbol": {"type": "STRING"},
                    "confidenceScore": {"type": "NUMBER"},
                    "scenarios": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "type": {"type": "STRING"},
                                "priceTarget": {"type": "NUMBER"},
                                "probability": {"type": "NUMBER"},
                                "reasoning": {"type": "STRING"}
                            }
                        }
                    }
                }
            }
        )
    )
    return json.loads(response.text)

# -----------------------------------------------------------------------------
# MAIN EXECUTION
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    target_stock = input("Enter stock symbol (e.g., NVDA, ICICIBANK): ") or "NVDA"
    
    # 1. Run Analysis
    analysis, sources = analyze_stock_deep(target_stock)
    
    print("\\n" + "="*80)
    print(f"REPORT: {target_stock}")
    print("="*80 + "\\n")
    print(analysis)
    
    print("\\n" + "-"*40)
    print("SOURCES USED:")
    if sources:
        for chunk in sources:
            if chunk.web:
                print(f"- {chunk.web.title}: {chunk.web.uri}")
    
    # 2. Run Forecast
    forecast = get_forecast(target_stock)
    print("\\n" + "="*80)
    print(f"AI FORECAST MODEL (Confidence: {forecast['confidenceScore']}%)")
    print("="*80)
    
    for scenario in forecast['scenarios']:
        print(f"\\n[{scenario['type'].upper()}] - {scenario['probability']}% Probability")
        print(f"Target: {scenario['priceTarget']}")
        print(f"Thesis: {scenario['reasoning']}")
`;

export const getNotebookCode = () => {
    const pythonCode = getPythonCode();
    
    // Convert Python script into Notebook cells
    const cells = [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# MarketMind AI: Financial Intelligence Terminal\n",
                "\n",
                "This notebook implements the core logic of MarketMind using the Google GenAI SDK.\n",
                "It features:\n",
                "- **Real-time Price Fetching** using Google Search Grounding.\n",
                "- **Deep Value Analysis** using a 'Master Investor' persona.\n",
                "- **Probabilistic Forecasting** using JSON Schema generation."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": null,
            "metadata": {},
            "outputs": [],
            "source": [
                "!pip install -q -U google-genai"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": null,
            "metadata": {},
            "outputs": [],
            "source": [
                "import os\n",
                "import json\n",
                "from google import genai\n",
                "from google.genai import types\n",
                "\n",
                "# Setup API Key\n",
                "# Recommend using Colab Secrets or environment variables\n",
                "API_KEY = os.environ.get(\"GOOGLE_API_KEY\") or \"YOUR_API_KEY_HERE\"\n",
                "\n",
                "client = genai.Client(api_key=API_KEY)\n",
                "print(\"Client Initialized\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 1. Grounded Price Fetcher\n",
                "Fetches the exact real-time price and exchange data to anchor the analysis."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": null,
            "metadata": {},
            "outputs": [],
            "source": [
                // Extracting the get_live_price function from the main script string
                getPythonCode().split('def get_live_price')[1].split('def analyze_stock_deep')[0].trim().replace(/^/gm, 'def get_live_price')
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 2. Deep Analysis Engine\n",
                "The core reasoning engine that adopts the 'Business Owner' persona."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": null,
            "metadata": {},
            "outputs": [],
            "source": [
                getPythonCode().split('def analyze_stock_deep')[1].split('def get_forecast')[0].trim().replace(/^/gm, 'def analyze_stock_deep')
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 3. Forecasting Engine\n",
                "Generates structured JSON predictions."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": null,
            "metadata": {},
            "outputs": [],
            "source": [
                getPythonCode().split('def get_forecast')[1].split('if __name__')[0].trim().replace(/^/gm, 'def get_forecast')
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 4. Run Analysis\n",
                "Enter a symbol below to run the full pipeline."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": null,
            "metadata": {},
            "outputs": [],
            "source": [
                "symbol = \"ICICIBANK\" # @param {type:\"string\"}\n",
                "\n",
                "# 1. Get Context\n",
                "price = get_live_price(symbol)\n",
                "print(f\"Live Data: {json.dumps(price, indent=2)}\")\n",
                "\n",
                "# 2. Run Deep Analysis\n",
                "analysis, sources = analyze_stock_deep(symbol)\n",
                "print(analysis)\n",
                "\n",
                "# 3. Run Forecast\n",
                "forecast = get_forecast(symbol)\n",
                "print(json.dumps(forecast, indent=2))"
            ]
        }
    ];

    return JSON.stringify({
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {
                    "name": "ipython",
                    "version": 3
                },
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.10.0"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }, null, 2);
}