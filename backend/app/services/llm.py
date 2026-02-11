"""
Gemini LLM service for workflow step execution.
Each step has a natural-language description; the LLM transforms the input text according to that description.
"""
import warnings
from typing import Optional

from app.core.config import settings

# Lazy init: only import and configure when API key is set and we actually call
_gemini_model = None


def _get_model():
    """Return configured Gemini GenerativeModel, or None if no API key."""
    global _gemini_model
    if not settings.gemini_api_key:
        return None
    if _gemini_model is None:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")  # genai + urllib3 deprecation/OpenSSL warnings
            import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_model = genai.GenerativeModel(settings.gemini_model)
    return _gemini_model


def is_available() -> bool:
    """Return True if Gemini is configured (API key set)."""
    return bool(settings.gemini_api_key)


def execute_step(
    step_name: str,
    step_description: str,
    input_text: str,
    step_type: str = "NORMAL",
) -> tuple[str, Optional[str]]:
    """
    Run one workflow step: send input_text to Gemini with the step's description as instruction.
    Returns (output_text, error_message). error_message is None on success.
    """
    model = _get_model()
    if not model:
        return "", "Gemini not configured: set GEMINI_API_KEY in .env"

    if step_type == "START":
        # START typically passes input through or does minimal processing
        prompt = _start_prompt(step_name, step_description, input_text)
    elif step_type == "END":
        prompt = _end_prompt(step_name, step_description, input_text)
    else:
        prompt = _normal_prompt(step_name, step_description, input_text)

    try:
        response = model.generate_content(prompt)
        if not response.text:
            return "", "Gemini returned empty response"
        return response.text.strip(), None
    except Exception as e:
        return "", str(e)


def _start_prompt(step_name: str, step_description: str, input_text: str) -> str:
    return f"""You are executing the first step of a text-processing workflow.

Step name: {step_name}
Step description: {step_description or "Pass the input through."}

Input text from the user:
---
{input_text}
---

Apply only what the step description says. If the description is empty or just "start", return the input text unchanged.
Reply with only the transformed text, no explanation or markdown."""


def _normal_prompt(step_name: str, step_description: str, input_text: str) -> str:
    return f"""You are executing a step in a text-processing workflow.

Step name: {step_name}
Step description: {step_description}

Current text (output from the previous step):
---
{input_text}
---

Do exactly what the step description says to this text. Reply with only the resulting text, no explanation or markdown."""


def _end_prompt(step_name: str, step_description: str, input_text: str) -> str:
    return f"""You are executing the final step of a text-processing workflow.

Step name: {step_name}
Step description: {step_description or "Output the final result."}

Current text (output from the previous step):
---
{input_text}
---

Apply the step description and produce the final output. Reply with only the final text, no explanation or markdown."""
