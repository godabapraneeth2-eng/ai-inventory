"""
Integration tests — Phase S
Tests full HTTP request/response cycles against the running FastAPI app.
Uses in-memory SQLite (from conftest.py) — no real network calls.
"""
import pytest


# ── Health check ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


# ── Returns API ────────────────────────────────────────────────────────────────

class TestReturnsAPI:

    @pytest.mark.asyncio
    async def test_list_returns_empty_initially(self, client):
        r = await client.get("/api/v1/returns/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    @pytest.mark.asyncio
    async def test_create_return_defective(self, client):
        r = await client.post("/api/v1/returns/", json={
            "order_id": "ORD-INT-001",
            "customer_id": "cust-int-1",
            "reason": "The product arrived with a cracked screen",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["status"] in ("approved", "pending_manager_review")
        assert body["confidence"] > 0

    @pytest.mark.asyncio
    async def test_create_return_stores_policy(self, client):
        r = await client.post("/api/v1/returns/", json={
            "order_id": "ORD-INT-002",
            "customer_id": "cust-int-2",
            "reason": "Wrong item shipped",
        })
        assert r.status_code == 200
        body = r.json()
        assert body.get("policy_reference") is not None


# ── Quality Inspection API ─────────────────────────────────────────────────────

class TestQualityAPI:

    @pytest.mark.asyncio
    async def test_inspect_endpoint(self, client):
        r = await client.post("/api/v1/quality/inspect", json={
            "order_id": "ORD-QI-001",
            "sku": "SKU-001",
            "expected_quantity": 2,
        })
        assert r.status_code == 200
        body = r.json()
        assert body["result"] in ("passed", "warning", "failed")
        assert "issues" in body
        assert "explainability" in body

    @pytest.mark.asyncio
    async def test_list_inspections(self, client):
        # First create one
        await client.post("/api/v1/quality/inspect", json={
            "order_id": "ORD-QI-002",
            "sku": "SKU-002",
            "expected_quantity": 1,
        })
        r = await client.get("/api/v1/quality/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ── Fraud API ──────────────────────────────────────────────────────────────────

class TestFraudAPI:

    @pytest.mark.asyncio
    async def test_list_fraud_alerts(self, client):
        r = await client.get("/api/v1/fraud/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    @pytest.mark.asyncio
    async def test_scan_customer(self, client):
        r = await client.post("/api/v1/fraud/scan", json={
            "customer_id": "CUST-INT-001",
            "order_value": 2500.0,
            "customer_name": "Integration Test Customer",
        })
        assert r.status_code == 200
        body = r.json()
        assert "fraud_score" in body
        assert 0 <= body["fraud_score"] <= 100


# ── Observability API ──────────────────────────────────────────────────────────

class TestObservabilityAPI:

    @pytest.mark.asyncio
    async def test_stats_endpoint(self, client):
        r = await client.get("/api/v1/observability/stats")
        assert r.status_code == 200
        body = r.json()
        assert "total_executions" in body
        assert "success_rate" in body

    @pytest.mark.asyncio
    async def test_logs_endpoint(self, client):
        r = await client.get("/api/v1/observability/logs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    @pytest.mark.asyncio
    async def test_logs_agent_filter(self, client):
        r = await client.get("/api/v1/observability/logs?agent=FraudAgent")
        assert r.status_code == 200

    @pytest.mark.asyncio
    async def test_replay_unknown_id_returns_404(self, client):
        r = await client.get("/api/v1/observability/replay/99999999")
        assert r.status_code == 404

    @pytest.mark.asyncio
    async def test_manual_replay_invalid_agent_returns_422(self, client):
        r = await client.post("/api/v1/observability/replay", json={
            "agent_name": "NonExistentAgent",
            "action": "test",
            "input_data": {},
        })
        assert r.status_code == 422


# ── Sentiment API ──────────────────────────────────────────────────────────────

class TestSentimentAPI:

    @pytest.mark.asyncio
    async def test_analyze_sentiment(self, client):
        r = await client.post("/api/v1/sentiment/analyze", json={
            "text": "My package has been delayed for the third time. I am very frustrated!"
        })
        assert r.status_code == 200
        body = r.json()
        assert "sentiment" in body
        assert "priority" in body
        assert "confidence" in body

    @pytest.mark.asyncio
    async def test_sentiment_priority_values(self, client):
        r = await client.post("/api/v1/sentiment/analyze", json={
            "text": "URGENT! Need help NOW!"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["priority"] in ("critical", "high", "medium", "low")


# ── Procurement API ────────────────────────────────────────────────────────────

class TestProcurementAPI:

    @pytest.mark.asyncio
    async def test_list_purchase_orders(self, client):
        r = await client.get("/api/v1/procurement/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    @pytest.mark.asyncio
    async def test_generate_pos(self, client):
        r = await client.post("/api/v1/procurement/generate")
        assert r.status_code == 200


# ── Approvals API ──────────────────────────────────────────────────────────────

class TestApprovalsAPI:

    @pytest.mark.asyncio
    async def test_list_approvals(self, client):
        r = await client.get("/api/v1/approvals/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ── Shipping API ───────────────────────────────────────────────────────────────

class TestShippingAPI:

    @pytest.mark.asyncio
    async def test_list_shipping_predictions(self, client):
        r = await client.get("/api/v1/shipping/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
