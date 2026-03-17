import requests
import json
from app.db import supabase

# --- HUNTER 1: LIVE MANIFOLD MARKETS ---
def fetch_manifold():
    print("🔮 Fetching Active Manifold markets...")
    # Using 'last-bet-time' as it's a stable, supported sort value
    url = "https://api.manifold.markets/v0/markets?limit=100&sort=last-bet-time"
    try:
        res = requests.get(url)
        res.raise_for_status()
        data = res.json()
        
        return [{
            "market_id": f"mf_{m['id']}",
            "question": m['question'],
            "platform": "manifold",
            "probability": m.get('probability', 0.5),
            "volume": float(m.get('volume', 0)),
            "is_resolved": False,
            "outcome": None,
            "display_outcome": None,
            "brier_score": None
        } for m in data if not m.get('isResolved') and m.get('totalLiquidity', 0) > 50]
    except Exception as e:
        print(f"Manifold Error: {e}")
        return []

# --- HUNTER 2: LIVE POLYMARKET MARKETS ---
def fetch_polymarket():
    print("🔵 Fetching Active Polymarket markets...")
    # Increased limit to 100 for more popular coverage
    url = "https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false"
    try:
        res = requests.get(url).json()
        formatted = []
        for e in res:
            m_list = e.get('markets', [{}])
            if not m_list: continue
            m = m_list[0]
            
            # Filtering for quality: only sync markets with significant volume
            if float(e.get('volume', 0)) < 1000: continue

            prices_raw = m.get('outcomePrices', '["0.5", "0.5"]')
            prices = json.loads(prices_raw) if isinstance(prices_raw, str) else prices_raw
            
            formatted.append({
                "market_id": f"poly_{m['id']}",
                "question": e['title'],
                "platform": "polymarket",
                "probability": float(prices[0]) if prices else 0.5,
                "volume": float(e.get('volume', 0)),
                "is_resolved": False,
                "outcome": None,
                "display_outcome": None,
                "brier_score": None
            })
        return formatted
    except Exception as e:
        print(f"Polymarket Error: {e}")
        return []

# --- HUNTER 3: RESOLVED MANIFOLD (The "Past" Data) ---
def fetch_resolved_manifold():
    print("🕵️ Hunting for Resolved Manifold Failures...")
    url = "https://api.manifold.markets/v0/markets?limit=50&sort=updated-time"
    res = requests.get(url).json()
    
    resolved = [] # CRITICAL: Initializing the list inside the function
    
    for m in res:
        if m.get('isResolved') and m.get('totalLiquidity', 0) > 100:
            prob = m.get('probability', 0.5)
            raw_outcome = m.get('resolution')
            
            # NORMALIZATION: Mapping weird IDs to clean labels
            if raw_outcome == "YES":
                clean_label = "YES"
            elif raw_outcome == "NO":
                clean_label = "NO"
            elif raw_outcome == "CANCEL":
                clean_label = "CANCELLED"
            else:
                # Logic to determine winner from internal IDs like 'p6hsph00Up'
                clean_label = "YES" if m.get('resolutionProbability', 0) > 0.5 else "RESOLVED"
            
            # MATH: Brier Score calculation (Closer to 1 = Bigger Crowd Fail)
            actual = 1.0 if clean_label == "YES" else 0.0
            brier = round((prob - actual) ** 2, 4)
            
            resolved.append({
                "market_id": f"mf_{m['id']}",
                "question": m['question'],
                "platform": "manifold",
                "probability": prob,
                "volume": float(m.get('volume', 0)),
                "is_resolved": True,
                "outcome": raw_outcome,         # The 'p6hsph00Up' for the audit trail
                "display_outcome": clean_label, # The 'YES/NO' for the UI
                "brier_score": brier
            })
    return resolved

# --- HUNTER 4: RESOLVED POLYMARKET (The "Past" Data) ---
def fetch_resolved_polymarket():
    print("🕵️ Hunting for Resolved Polymarket events...")
    # 'closed=true' targets the historical data we need
    url = "https://gamma-api.polymarket.com/events?limit=30&closed=true"
    try:
        res = requests.get(url).json()
        resolved = []
        for e in res:
            m_list = e.get('markets', [{}])
            if not m_list: continue
            m = m_list[0]
            
            # Polymarket resolution price (1.0 for YES, 0.0 for NO)
            res_price = m.get('proxyPrice')
            if res_price is None: continue
            
            display_outcome = "YES" if float(res_price) > 0.5 else "NO"
            
            # Since we don't have the pre-resolution probability easily, 
            # we assign 0.5 as a baseline to calculate "Maximum Uncertainty"
            prob = 0.5 
            brier = round((prob - (1.0 if display_outcome == "YES" else 0.0)) ** 2, 4)
            
            resolved.append({
                "market_id": f"poly_res_{m['id']}",
                "question": e['title'],
                "platform": "polymarket",
                "probability": prob,
                "volume": float(e.get('volume', 0)),
                "is_resolved": True,
                "outcome": str(m.get('id')),
                "display_outcome": display_outcome,
                "brier_score": brier
            })
        return resolved
    except Exception as e:
        print(f"Polymarket Resolved Error: {e}")
        return []

# --- THE PROJECT MANAGER: DE-DUPLICATE & SYNC ---
def sync_all():
    live_mf = fetch_manifold()
    live_poly = fetch_polymarket()
    past_mf = fetch_resolved_manifold()
    past_poly = fetch_resolved_polymarket() # NEW LINE
    
    raw_combined = live_mf + live_poly + past_mf + past_poly # ADDED past_poly
    unique_data = {m['market_id']: m for m in raw_combined}
    final_payload = list(unique_data.values())
    
    if final_payload:
        supabase.table("markets").upsert(final_payload, on_conflict="market_id").execute()
        print(f"✅ Full Audit Sync Complete: {len(final_payload)} nodes.")

if __name__ == "__main__":
    sync_all()