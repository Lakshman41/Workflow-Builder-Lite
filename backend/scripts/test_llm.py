#!/usr/bin/env python
"""Quick test for Gemini LLM service. Run from backend/: python scripts/test_llm.py"""
import sys
from pathlib import Path

# So "app" resolves when run as scripts/test_llm.py from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.llm import execute_step, is_available

print("LLM available:", is_available())
out, err = execute_step(
    "Test",
    "Capitalize the first letter of the text.",
    "hello world",
)
print("Output:", repr(out))
print("Error:", err)
