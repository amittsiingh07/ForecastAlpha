from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import supabase  # This pulls the client we configured earlier

app = FastAPI(title="ForecastAlpha API")

# CRITICAL: This allows your Next.js frontend (localhost:3000) 
# to talk to this Python backend (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ForecastAlpha Backend Online", "version": "1.0.0"}

# --- CHANNEL 1: LIVE MARKETS ---
@app.get("/api/markets/live")
def get_live_markets(limit: int = 100):
    """Fetches high-volume active markets for the Live tabs"""
    response = supabase.table("markets")\
        .select("*")\
        .eq("is_resolved", False)\
        .order("volume", desc=True)\
        .limit(limit)\
        .execute()
    return response.data

# --- CHANNEL 2: RESOLVED MARKETS ---
@app.get("/api/markets/resolved")
def get_resolved_markets(limit: int = 100):
    """Fetches finished markets sorted by those the crowd got most WRONG (Surprise)"""
    response = supabase.table("markets")\
        .select("*")\
        .eq("is_resolved", True)\
        .order("brier_score", desc=True)\
        .limit(limit)\
        .execute()
    return response.data

# --- CHANNEL 3: THE COMMAND CENTER (GENERAL SUMMARY) ---
@app.get("/api/stats/summary")
def get_general_summary():
    """Aggregates all data to find the 'Alpha' insights for the General tab"""
    res = supabase.table("markets").select("*").execute()
    all_markets = res.data

    if not all_markets:
        return {"error": "No data in system", "system_health": "Waiting for Sync"}

    # 1. Calculate Aggregated Financials
    total_vol = sum(m.get('volume', 0) or 0 for m in all_markets)
    
    # 2. Identify the 'Hottest' Active Market
    active = [m for m in all_markets if not m.get('is_resolved')]
    hottest = max(active, key=lambda x: x.get('volume') or 0, default=None)

    # 3. Identify the 'Biggest Failure' (Highest Brier Score)
    resolved = [m for m in all_markets if m.get('is_resolved')]
    biggest_fail = max(resolved, key=lambda x: x.get('brier_score') or 0, default=None)

    # 4. Platform Distribution
    poly_count = len([m for m in all_markets if m.get('platform') == 'polymarket'])
    mani_count = len([m for m in all_markets if m.get('platform') == 'manifold'])

    return {
        "total_volume": total_vol,
        "market_count": len(all_markets),
        "hottest_market": hottest,
        "biggest_fail": biggest_fail,
        "platform_split": {
            "polymarket": poly_count,
            "manifold": mani_count
        },
        "system_health": "Optimal"
    }

# Keeping this for backward compatibility if you have old frontend code
@app.get("/api/markets")
def get_all_markets():
    response = supabase.table("markets").select("*").execute()
    return response.data
