class PriorityService:
    async def score(
        self,
        order_value: float = 0.0,
        is_vip: bool = False,
        sentiment: str = "neutral",
        deadline_days: int = 7,
        complaint_count: int = 0,
        payment_risk: float = 0.0,
    ) -> dict:
        """
        Async .score() — the primary public API.
        Returns a score 0–100 and a tier label.
        """
        return self.calculate_priority(
            order_value=order_value,
            is_vip=is_vip,
            deadline_days=deadline_days,
            sentiment=sentiment,
            complaints=complaint_count,
            payment_risk=payment_risk,
        )

    def calculate_priority(
        self,
        order_value: float,
        is_vip: bool,
        deadline_days: int,
        sentiment: str,
        complaints: int,
        payment_risk: float,
    ) -> dict:
        score = 0
        factors = {}

        # 25 pts — order value
        val_score = min(25, (order_value / 1000) * 25)
        score += val_score
        factors["order_value"] = round(val_score, 1)

        # 20 pts — VIP
        vip_score = 20 if is_vip else 0
        score += vip_score
        factors["is_vip"] = vip_score

        # 15 pts — deadline urgency
        dead_score = 15 if deadline_days <= 1 else (8 if deadline_days <= 3 else 0)
        score += dead_score
        factors["deadline"] = dead_score

        # 20 pts — sentiment (angry / urgent automatically boost urgency)
        sent_score = (
            35 if sentiment in ("angry", "urgent")
            else 25 if sentiment == "frustrated"
            else 0
        )
        score += sent_score
        factors["sentiment"] = sent_score

        # 10 pts — complaint history
        comp_score = min(10, complaints * 4)
        score += comp_score
        factors["complaints"] = comp_score

        # 10 pts — payment risk
        risk_score = min(10, payment_risk * 10)
        score += risk_score
        factors["payment_risk"] = round(risk_score, 1)

        score = min(round(score, 1), 100)

        if score >= 60:
            tier = "critical"
        elif score >= 30:
            tier = "high"
        elif score >= 15:
            tier = "medium"
        else:
            tier = "low"

        return {
            "score": score,
            "tier": tier,
            "level": tier,          # backward compat
            "factors": factors,
            "suggested_queue_position": int(100 - score),
        }


priority_service = PriorityService()
