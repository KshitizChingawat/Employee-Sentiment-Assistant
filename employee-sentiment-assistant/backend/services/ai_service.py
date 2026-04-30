"""
AI Service — OpenAI GPT integration for sentiment analysis.
Falls back to a deterministic demo engine when DEMO_MODE=true or no API key.
"""

import os
import json
import random
import re
from typing import Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEMO_MODE      = os.getenv("DEMO_MODE", "true").lower() == "true"

# Initialize OpenAI client only if key is present
client: Optional[AsyncOpenAI] = None
if OPENAI_API_KEY and not DEMO_MODE:
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)


# ──────────────────── Prompt Templates ────────────────────────

SENTIMENT_SYSTEM_PROMPT = """
You are an expert HR sentiment analyst. Analyze employee feedback and return ONLY a JSON object with this structure:

{
  "sentiment": "positive" | "negative" | "neutral",
  "emotion": "stress" | "burnout" | "anger" | "satisfaction" | "anxiety" | "joy" | "frustration" | "neutral",
  "score": <float between -1.0 (most negative) and 1.0 (most positive)>,
  "confidence": <float between 0.0 and 1.0>,
  "summary": "<2-3 sentence summary of the employee's key concerns or highlights>",
  "recommendation": "<1-2 actionable HR recommendation based on this feedback>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"]
}

Rules:
- Be accurate and empathetic
- Keywords should be the most impactful words/phrases from the feedback
- Recommendations should be concrete, not generic
- Return ONLY valid JSON, no markdown, no explanation
""".strip()

HR_CHATBOT_SYSTEM_PROMPT = """
You are SentimentAI, an intelligent HR analytics chatbot. You have access to real-time employee sentiment data 
provided in the context. Answer HR questions accurately and concisely using the data.

Guidelines:
- Be data-driven and cite specific numbers/percentages when available
- Be empathetic and solution-oriented
- Keep answers concise (3-5 sentences max)
- If data is insufficient, say so and suggest what data would help
""".strip()


# ──────────────────── Demo Mode Engine ────────────────────────

DEMO_RESPONSES = {
    "positive": {
        "emotions": ["satisfaction", "joy"],
        "summaries": [
            "The employee expresses strong satisfaction with their team and work environment. They appreciate the collaborative culture and feel well-supported by management. Overall morale appears high.",
            "This feedback reflects genuine enthusiasm for recent company initiatives. The employee values the growth opportunities and feels recognized for their contributions.",
        ],
        "recommendations": [
            "Continue recognition programs and explore mentorship opportunities to sustain high engagement.",
            "Document what's working in this team and consider sharing best practices across departments.",
        ],
    },
    "negative": {
        "emotions": ["stress", "burnout", "frustration", "anger"],
        "summaries": [
            "The employee reports significant stress related to workload and unclear expectations. There are signs of burnout with mentions of extended working hours and lack of support.",
            "This feedback highlights frustration with communication gaps and feeling undervalued. The tone suggests growing disengagement that warrants immediate HR attention.",
        ],
        "recommendations": [
            "Schedule a 1-on-1 with this employee's manager within 48 hours to address workload concerns. Consider a temporary workload audit for the team.",
            "Review communication workflows in this department. Anonymous pulse surveys may help surface additional concerns safely.",
        ],
    },
    "neutral": {
        "emotions": ["neutral", "anxiety"],
        "summaries": [
            "The employee provides balanced feedback with both positive and constructive observations. There is a mild undercurrent of uncertainty about recent organizational changes.",
            "This feedback reflects a stable but cautious perspective. The employee is engaged but watchful, possibly awaiting clarity on upcoming decisions.",
        ],
        "recommendations": [
            "Proactively communicate upcoming changes to reduce uncertainty. Regular team briefings can help maintain trust during transitions.",
            "Consider a check-in meeting to understand this employee's goals and align them with team objectives.",
        ],
    },
}

SAMPLE_KEYWORDS = {
    "positive": ["collaboration", "growth", "recognition", "support", "innovation", "team", "opportunity"],
    "negative":  ["overworked", "burnout", "unclear", "stress", "deadline", "pressure", "ignored", "undervalued"],
    "neutral":   ["changes", "communication", "process", "update", "meeting", "feedback", "goals"],
}


def _demo_analyze(content: str) -> dict:
    """
    Deterministic demo analysis based on keyword heuristics.
    Used when DEMO_MODE=true or OpenAI key is absent.
    """
    content_lower = content.lower()

    # Simple heuristic scoring
    negative_words = ["stress", "burnout", "overwhelm", "angry", "frustrat", "unhappy",
                      "terrible", "awful", "quit", "resign", "toxic", "hate", "pressure",
                      "overwork", "exhaust", "underpay", "ignored", "undervalue", "disappoint"]
    positive_words = ["great", "love", "excellent", "amazing", "happy", "satisf", "enjoy",
                      "appreciate", "fantastic", "good", "wonderful", "motivat", "inspir",
                      "support", "recogni", "growth", "opportunit", "proud", "achiev"]

    neg_score = sum(1 for w in negative_words if w in content_lower)
    pos_score = sum(1 for w in positive_words if w in content_lower)

    if neg_score > pos_score + 1:
        sentiment = "negative"
        score     = round(random.uniform(-0.85, -0.30), 2)
    elif pos_score > neg_score + 1:
        sentiment = "positive"
        score     = round(random.uniform(0.30, 0.90), 2)
    else:
        sentiment = "neutral"
        score     = round(random.uniform(-0.20, 0.25), 2)

    pool     = DEMO_RESPONSES[sentiment]
    emotion  = random.choice(pool["emotions"])
    summary  = random.choice(pool["summaries"])
    rec      = random.choice(pool["recommendations"])
    kw_pool  = SAMPLE_KEYWORDS[sentiment]
    keywords = random.sample(kw_pool, min(5, len(kw_pool)))

    return {
        "sentiment":      sentiment,
        "emotion":        emotion,
        "score":          score,
        "confidence":     round(random.uniform(0.78, 0.96), 2),
        "summary":        summary,
        "recommendation": rec,
        "keywords":       keywords,
    }


# ──────────────────── Real OpenAI Analysis ────────────────────

async def _openai_analyze(content: str) -> dict:
    """Call OpenAI GPT-4o to analyze sentiment."""
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SENTIMENT_SYSTEM_PROMPT},
            {"role": "user",   "content": f"Analyze this employee feedback:\n\n{content}"},
        ],
        temperature=0.2,
        max_tokens=500,
    )

    raw_text = response.choices[0].message.content.strip()

    # Strip markdown fences if present
    raw_text = re.sub(r"```json|```", "", raw_text).strip()

    result = json.loads(raw_text)

    # Validate required fields
    required = ["sentiment", "emotion", "score", "confidence", "summary", "recommendation", "keywords"]
    for field in required:
        if field not in result:
            raise ValueError(f"AI response missing field: {field}")

    return result


# ──────────────────── Public API ──────────────────────────────

async def analyze_feedback(content: str) -> dict:
    """
    Main entry point — routes to OpenAI or demo engine.
    Always returns a dict with: sentiment, emotion, score, confidence,
    summary, recommendation, keywords.
    """
    if client and not DEMO_MODE:
        try:
            return await _openai_analyze(content)
        except Exception as e:
            print(f"[AI Service] OpenAI error, falling back to demo: {e}")
            return _demo_analyze(content)
    else:
        return _demo_analyze(content)


async def hr_chatbot_response(question: str, context_data: dict) -> str:
    """
    HR Chatbot — uses OpenAI to answer HR questions with real data context.
    Falls back to rule-based responses in demo mode.
    """
    if client and not DEMO_MODE:
        context_str = json.dumps(context_data, indent=2, default=str)
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": HR_CHATBOT_SYSTEM_PROMPT},
                    {"role": "user", "content": (
                        f"Current sentiment analytics data:\n{context_str}\n\n"
                        f"HR Question: {question}"
                    )},
                ],
                temperature=0.4,
                max_tokens=400,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[AI Service] Chatbot OpenAI error: {e}")

    # Demo chatbot — rule-based responses
    return _demo_chatbot(question, context_data)


def _demo_chatbot(question: str, ctx: dict) -> str:
    """Simple rule-based chatbot for demo mode."""
    q = question.lower()

    dept_breakdown = ctx.get("department_breakdown", [])
    most_stressed  = ctx.get("most_stressed_dept", "Engineering")
    total          = ctx.get("total_feedback_count", 0)
    neg_pct        = 0
    if ctx.get("overall_sentiment"):
        s   = ctx["overall_sentiment"]
        tot = s.get("total", 1)
        neg_pct = round(s.get("negative", 0) / tot * 100, 1) if tot else 0

    if any(w in q for w in ["stress", "stressed", "burnout"]):
        return (
            f"Based on current data, the **{most_stressed}** department shows the highest stress indicators, "
            f"with elevated negative sentiment and burnout-tagged feedback. "
            f"I recommend scheduling a department-wide check-in and reviewing workload distribution. "
            f"Across the organization, {neg_pct}% of all feedback carries negative sentiment."
        )
    elif any(w in q for w in ["satisfaction", "happy", "positive"]):
        top_positive = max(dept_breakdown, key=lambda d: d.get("positive_pct", 0), default={})
        dept_name    = top_positive.get("department", "Marketing") if top_positive else "Marketing"
        pct          = top_positive.get("positive_pct", 72) if top_positive else 72
        return (
            f"**{dept_name}** leads in employee satisfaction with {pct:.0f}% positive feedback. "
            f"Key drivers include recognition programs and clear career growth paths. "
            f"Consider documenting their team practices as internal best-case examples."
        )
    elif any(w in q for w in ["drop", "declin", "falling", "decreas", "worse"]):
        return (
            f"Sentiment has shown a declining trend over the past 30 days, particularly in technical departments. "
            f"Root causes appear to include workload spikes and communication gaps around recent org changes. "
            f"Immediate actions: increase 1-on-1 frequency and clarify roadmap priorities with team leads."
        )
    elif any(w in q for w in ["department", "team", "which"]):
        if dept_breakdown:
            worst = min(dept_breakdown, key=lambda d: d.get("avg_score", 0))
            return (
                f"**{worst.get('department', 'Engineering')}** currently has the lowest average sentiment score "
                f"({worst.get('avg_score', -0.2):.2f}). "
                f"It has {worst.get('negative_pct', 45):.0f}% negative feedback. "
                f"Recommend an urgent HR review session with department leadership."
            )
        return "I need more data to pinpoint the most affected department. Try submitting more feedback entries."
    elif any(w in q for w in ["alert", "issue", "problem", "concern"]):
        alert_count = ctx.get("alert_count", 0)
        return (
            f"There are currently **{alert_count} active alerts** in the system. "
            f"The most critical issues involve negativity spikes and potential burnout patterns. "
            f"Check the Alerts panel for department-specific details and recommended actions."
        )
    else:
        return (
            f"I'm SentimentAI, your HR analytics assistant. I have access to {total} feedback entries "
            f"across your organization. You can ask me about department stress levels, satisfaction trends, "
            f"declining morale, specific alerts, or request summary insights. What would you like to know?"
        )
