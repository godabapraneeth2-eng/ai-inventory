import datetime
from backend.database import AsyncSessionLocal, ShippingPrediction

class ShippingService:
    async def predict_shipping(self, order_id: str, carrier: str, weather: str = None) -> dict:
        delay = 0
        risk = "low"
        weather_impact = None
        
        if weather and weather.lower() in ["storm", "snow", "hurricane"]:
            delay += 3
            risk = "high"
            weather_impact = f"Severe weather: {weather}"
            
        if carrier.lower() == "budget_post":
            delay += 1
            
        async with AsyncSessionLocal() as session:
            pred = ShippingPrediction(order_id=order_id, predicted_delay_days=delay, confidence=0.85)
            session.add(pred)
            await session.commit()
            await session.refresh(pred)
            pred_id = pred.id
            
        return {
            "id": pred_id,
            "order_id": order_id,
            "order_number": f"ORD-{order_id}",
            "carrier": carrier,
            "estimated_delivery": (datetime.datetime.utcnow() + datetime.timedelta(days=3+delay)).isoformat(),
            "predicted_delay_days": delay,
            "delay_risk": risk,
            "confidence": 0.85,
            "weather_impact": weather_impact,
            "route_issues": None,
            "status": "predicted",
            "created_at": datetime.datetime.utcnow().isoformat()
        }

shipping_service = ShippingService()
