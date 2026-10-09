"""Standalone seed runner for MedVerify."""
from __future__ import annotations

import asyncio
import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.seed import main

if __name__ == "__main__":
    asyncio.run(main())
