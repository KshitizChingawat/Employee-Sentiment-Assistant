"""
setup_db.py — run this once to create tables and seed demo data.
Usage: python setup_db.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database.connection import init_db
from backend.seed_data import seed

async def main():
    print("=== SentimentAI Database Setup ===\n")
    print("Step 1: Creating tables...")
    await init_db()
    print("Tables created.\n")
    print("Step 2: Seeding demo data...")
    await seed()
    print("\n✅ Setup complete! You can now run the backend.")

if __name__ == "__main__":
    asyncio.run(main())
