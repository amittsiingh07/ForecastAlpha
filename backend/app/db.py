import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# This is the line that creates the 'supabase' variable your main.py is looking for
supabase: Client = create_client(url, key)