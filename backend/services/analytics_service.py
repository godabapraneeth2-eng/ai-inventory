from backend.database import get_supabase_client

class AnalyticsService:
    async def get_dashboard(self) -> dict:
        # Mock analytics based on local and supabase data
        return {
            "total_revenue": 1250400.50,
            "total_orders": 8432,
            "completed_orders": 8000,
            "pending_orders": 432,
            "total_returns": 156,
            "refund_losses": 15600.0,
            "inventory_shortages": 12,
            "high_risk_customers": 45,
            "fraud_alerts": 8,
            "success_rate": 98.2,
            "avg_processing_time_ms": 240,
            "revenue_trend": [{"date": "2023-01", "value": 100000}, {"date": "2023-02", "value": 120000}],
            "order_trend": [{"date": "2023-01", "value": 1000}, {"date": "2023-02", "value": 1200}],
            "risk_distribution": {"low": 8000, "medium": 387, "high": 45},
            "top_products": [{"name": "Product A", "sales": 500}, {"name": "Product B", "sales": 300}]
        }

analytics_service = AnalyticsService()
