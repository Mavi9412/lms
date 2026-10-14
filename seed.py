#!/usr/bin/env python3
"""
Convenience entry point to seed the complete university database from the repository root.
Usage:
    python seed.py
"""
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from seed import seed_complete_university

if __name__ == "__main__":
    seed_complete_university()
