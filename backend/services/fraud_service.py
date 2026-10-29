import datetime
from backend.database import AsyncSessionLocal, FraudReport


class FraudService:
    async def scan(
        self,
        customer_id: str,
        order_value: float,
        customer_name: str = "Unknown",
        ip_address: str = None,
        return_count: int = 0,
        history: list = None,
    ) -> dict:
        """
        Primary method: scan a customer for fraud signals.
        Factors: order value, new account, velocity, IP anomalies, return rate.
        """
        score = 0
        risk_factors = []

        # Order value
        if order_value > 5000:
            score += 35
            risk_factors.append(f"High order value: ${order_value:,.2f}")
        elif order_value > 1000:
            score += 15
            risk_factors.append(f"Elevated order value: ${order_value:,.2f}")

        # New account / no history
        if not history:
            score += 20
            risk_factors.append("No order history — new account")
        else:
            # High velocity: > 3 orders in last 7 days
            recent = len([h for h in history if getattr(h, "days_ago", 100) < 7])
            if recent > 3:
                score += 25
                risk_factors.append(f"High velocity: {recent} orders in 7 days")

        # Return rate
        if return_count > 3:
            score += 20
            risk_factors.append(f"High return count: {return_count}")
        elif return_count > 1:
            score += 10
            risk_factors.append(f"Multiple returns: {return_count}")

        # IP anomaly (basic heuristic)
        if ip_address and ip_address.startswith(("10.", "192.168.", "127.")):
            pass  # internal / known — neutral
        elif ip_address:
            score += 5
            risk_factors.append(f"External IP: {ip_address}")

        score = min(score, 100)

        risk_level = "low"
        status = "clear"
        if score > 75:
            risk_level = "high"
            status = "blocked"
        elif score > 50:
            risk_level = "medium"
            status = "review"
        elif score > 25:
            risk_level = "medium"
            status = "flagged"

        async with AsyncSessionLocal() as session:
            report = FraudReport(
                customer_id=customer_id,
                customer_name=customer_name,
                fraud_score=float(score),
                fraud_type="multi_factor",
                risk_level=risk_level,
                explanation=f"Fraud score {score}/100 based on {len(risk_factors)} signal(s).",
                evidence={"risk_factors": risk_factors, "order_value": order_value},
                status=status,
            )
            session.add(report)
            await session.commit()
            await session.refresh(report)
            rep_id = report.id

        return {
            "id": rep_id,
            "customer_id": customer_id,
            "customer_name": customer_name,
            "fraud_score": score,
            "fraud_type": "multi_factor",
            "risk_level": risk_level,
            "explanation": f"Fraud score {score}/100 based on {len(risk_factors)} signal(s).",
            "risk_factors": risk_factors,
            "evidence": {"signals": risk_factors},
            "status": status,
            "created_at": datetime.datetime.utcnow().isoformat(),
        }

    # Backward compat alias used by older routers
    async def analyze_fraud(
        self,
        customer_id: str,
        amount: float,
        history: list = None,
    ) -> dict:
        return await self.scan(customer_id, amount, history=history)


fraud_service = FraudService()
