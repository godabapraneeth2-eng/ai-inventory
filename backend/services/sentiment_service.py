import re


class SentimentService:
    def analyze(self, text: str) -> dict:
        text_lower = text.lower()

        # Keyword detection (ordered strongest → weakest)
        if any(w in text_lower for w in ["furious", "hate", "terrible", "awful", "angry", "disgusted", "outraged", "worst"]):
            sentiment = "angry"
        elif any(w in text_lower for w in ["frustrated", "annoyed", "fed up", "not good", "not great", "bad", "disappointed"]):
            sentiment = "frustrated"
        elif any(w in text_lower for w in ["urgent", "asap", "emergency", "immediately", "critical", "now", "right now"]):
            sentiment = "urgent"
        elif any(w in text_lower for w in ["happy", "great", "good", "awesome", "love", "excellent", "amazing", "thanks", "thank"]):
            sentiment = "happy"
        else:
            sentiment = "neutral"

        # Exclamation / ALL-CAPS escalation
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        exclamation_count = text.count("!")
        if (exclamation_count >= 2 or caps_ratio > 0.25) and sentiment in ("frustrated", "neutral"):
            sentiment = "angry"
        elif exclamation_count >= 1 and sentiment == "neutral" and "delay" in text_lower:
            sentiment = "frustrated"

        # "third", "multiple times" escalators
        if re.search(r'\b(third|3rd|multiple times|again and again)\b', text_lower):
            if sentiment in ("neutral", "happy"):
                sentiment = "frustrated"
            elif sentiment == "frustrated":
                sentiment = "angry"

        priority_map = {
            "urgent": "critical",
            "angry": "critical",
            "frustrated": "high",
            "neutral": "medium",
            "happy": "low",
        }
        action_map = {
            "urgent": "escalate_immediately",
            "angry": "escalate",
            "frustrated": "prioritize_response",
            "neutral": "standard_response",
            "happy": "thank_customer",
        }

        # Confidence: higher when strong keywords present
        confidence = 0.92 if sentiment in ("angry", "urgent", "happy") else 0.75

        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "priority": priority_map[sentiment],
            "suggested_action": action_map[sentiment],
        }

    async def analyze_async(self, text: str) -> dict:
        """Async wrapper — sentiment analysis is CPU-bound so runs synchronously."""
        return self.analyze(text)


sentiment_service = SentimentService()
