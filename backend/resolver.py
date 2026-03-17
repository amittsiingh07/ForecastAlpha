import requests
from app.db import supabase

def resolve_manifold_markets():
    print("🔎 Checking for unresolved Manifold markets...")
    # 1. Get unresolved Manifold markets from our DB
    unresolved = supabase.table("markets").select("*").eq("platform", "manifold").eq("is_resolved", False).execute()
    
    for market in unresolved.data:
        m_id = market['market_id'].replace("mf_", "")
        url = f"https://api.manifold.markets/v0/market/{m_id}"
        
        try:
            res = requests.get(url).json()
            if res.get('isResolved'):
                outcome = res.get('resolution')
                # Calculate 'Surprise' or Error: (Probability - Outcome)
                # Outcome 'YES' = 1, 'NO' = 0
                actual_val = 1 if outcome == "YES" else 0
                prediction_error = abs(market['probability'] - actual_val)
                
                print(f"✅ Market Resolved: {market['question']} -> {outcome}")
                
                # Update Supabase
                supabase.table("markets").update({
                    "is_resolved": True,
                    "outcome": outcome,
                    "surprise_index": round(prediction_error, 4)
                }).eq("market_id", market['market_id']).execute()
        except Exception as e:
            print(f"Error resolving {m_id}: {e}")

def resolve_polymarket_markets():
    print("🔎 Checking for unresolved Polymarket markets...")
    # Polymarket uses the Gamma API. We'll check the 'closed' status.
    unresolved = supabase.table("markets").select("*").eq("platform", "polymarket").eq("is_resolved", False).execute()
    
    for market in unresolved.data:
        poly_id = market['market_id'].replace("poly_", "")
        url = f"https://gamma-api.polymarket.com/markets/{poly_id}"
        
        try:
            res = requests.get(url).json()
            if res.get('closed'):
                # Handle Polymarket resolution logic
                # Usually returns a binary outcome or a specific index
                outcome = "YES" if res.get('status') == "resolved" else "NO"
                
                supabase.table("markets").update({
                    "is_resolved": True,
                    "outcome": outcome
                }).eq("market_id", market['market_id']).execute()
        except Exception as e:
            print(f"Error resolving {poly_id}: {e}")

if __name__ == "__main__":
    resolve_manifold_markets()
    resolve_polymarket_markets()