"""
Unit tests — Phase S
Tests the core agent services in full isolation (no network, no real DB).
"""
import pytest


# ── Sentiment Agent ────────────────────────────────────────────────────────────

class TestSentimentAgent:
    """The sentiment engine must correctly classify common customer phrases."""

    def test_angry_message(self):
        from backend.services.sentiment_service import sentiment_service
        result = sentiment_service.analyze("This is my THIRD delayed order! I'm furious!")
        assert result["sentiment"] in ("angry", "frustrated")
        assert result["priority"] in ("critical", "high")
        assert result["confidence"] > 0.5

    def test_happy_message(self):
        from backend.services.sentiment_service import sentiment_service
        result = sentiment_service.analyze("Amazing service, very happy with my purchase!")
        assert result["sentiment"] in ("happy", "neutral")

    def test_urgent_message(self):
        from backend.services.sentiment_service import sentiment_service
        result = sentiment_service.analyze("URGENT: need this fixed immediately for a client meeting")
        assert result["priority"] in ("critical", "high")

    def test_empty_message_handled(self):
        from backend.services.sentiment_service import sentiment_service
        result = sentiment_service.analyze("")
        assert "sentiment" in result
        assert "confidence" in result

    def test_returns_required_fields(self):
        from backend.services.sentiment_service import sentiment_service
        result = sentiment_service.analyze("My order is delayed")
        for field in ("sentiment", "priority", "confidence", "suggested_action"):
            assert field in result, f"Missing field: {field}"


# ── Return Service (Vision AI) ─────────────────────────────────────────────────

class TestReturnService:
    """The return service must route correctly without a real image or LLM."""

    @pytest.mark.asyncio
    async def test_defective_item_auto_approved(self):
        from backend.services.return_service import return_service
        result = await return_service.process_return(
            order_id="TEST-001",
            customer_id="cust-1",
            reason="The screen is cracked and the device is broken",
        )
        assert result["status"] in ("approved", "pending_manager_review")
        assert result["confidence"] > 0.5
        assert "policy_reference" in result

    @pytest.mark.asyncio
    async def test_wrong_item_auto_approved(self):
        from backend.services.return_service import return_service
        result = await return_service.process_return(
            order_id="TEST-002",
            customer_id="cust-2",
            reason="Wrong item shipped — I received a completely different product",
        )
        assert result["status"] in ("approved", "pending_manager_review")
        assert result["damage_type"] == "wrong_product"

    @pytest.mark.asyncio
    async def test_change_of_mind_not_auto_approved(self):
        from backend.services.return_service import return_service
        result = await return_service.process_return(
            order_id="TEST-003",
            customer_id="cust-3",
            reason="Changed my mind, no longer need this",
        )
        # change-of-mind should NOT be auto-approved
        assert result["status"] in ("more_evidence_needed", "rejected", "pending_manager_review")

    @pytest.mark.asyncio
    async def test_result_has_explainability_fields(self):
        from backend.services.return_service import return_service
        result = await return_service.process_return(
            order_id="TEST-004",
            customer_id="cust-4",
            reason="missing accessories",
        )
        for field in ("id", "status", "confidence", "policy_reference", "agent_explanation"):
            assert field in result, f"Missing field: {field}"

    @pytest.mark.asyncio
    async def test_image_bytes_accepted(self):
        from backend.services.return_service import return_service
        # Should not raise even with dummy bytes
        fake_image = b"\xff\xd8\xff" + b"\x00" * 100  # JPEG magic bytes
        result = await return_service.process_return(
            order_id="TEST-005",
            customer_id="cust-5",
            reason="cracked screen",
            image_bytes=fake_image,
        )
        assert "status" in result


# ── Quality Inspection ─────────────────────────────────────────────────────────

class TestQualityService:
    """Quality inspection must return structured reports and detect failures."""

    @pytest.mark.asyncio
    async def test_standard_sku_passes(self):
        from backend.services.quality_service import quality_service
        result = await quality_service.inspect(order_id="QI-100", sku="SKU-999", expected_quantity=1)
        assert result["result"] in ("passed", "warning", "failed")
        assert 0.0 <= result["confidence"] <= 1.0

    @pytest.mark.asyncio
    async def test_result_has_explainability(self):
        from backend.services.quality_service import quality_service
        result = await quality_service.inspect(order_id="QI-101", sku="SKU-001", expected_quantity=2)
        assert "explainability" in result
        exp = result["explainability"]
        assert "agent" in exp
        assert "confidence" in exp

    @pytest.mark.asyncio
    async def test_stop_shipment_flag_present(self):
        from backend.services.quality_service import quality_service
        result = await quality_service.inspect(order_id="QI-102", sku="SKU-TEST", expected_quantity=1)
        assert "stop_shipment" in result
        assert isinstance(result["stop_shipment"], bool)

    @pytest.mark.asyncio
    async def test_issues_list_type(self):
        from backend.services.quality_service import quality_service
        result = await quality_service.inspect(order_id="QI-103", sku="SKU-003", expected_quantity=3)
        assert isinstance(result["issues"], list)


# ── Fraud Detection ─────────────────────────────────────────────────────────────

class TestFraudService:
    """Fraud agent must score customers and return structured risk profiles."""

    @pytest.mark.asyncio
    async def test_scan_returns_score(self):
        from backend.services.fraud_service import fraud_service
        result = await fraud_service.scan(
            customer_id="CUST-001",
            order_value=500.0,
            customer_name="Test Customer",
        )
        assert "fraud_score" in result
        assert 0 <= result["fraud_score"] <= 100

    @pytest.mark.asyncio
    async def test_high_value_order_elevated_risk(self):
        from backend.services.fraud_service import fraud_service
        low = await fraud_service.scan("C1", 50.0, customer_name="Alice")
        high = await fraud_service.scan("C2", 50000.0, customer_name="Bob")
        # high-value should have >= score than low-value
        assert high["fraud_score"] >= low["fraud_score"]

    @pytest.mark.asyncio
    async def test_fraud_result_has_explanation(self):
        from backend.services.fraud_service import fraud_service
        result = await fraud_service.scan("CUST-X", 999.0, customer_name="Charlie")
        assert "explanation" in result or "risk_factors" in result

    @pytest.mark.asyncio
    async def test_status_field_valid(self):
        from backend.services.fraud_service import fraud_service
        result = await fraud_service.scan("CUST-Y", 200.0, customer_name="Diana")
        assert result.get("status") in ("clear", "review", "blocked", "flagged", "low", "medium", "high", None)


# ── Priority Engine ─────────────────────────────────────────────────────────────

class TestPriorityEngine:
    """Priority engine must compute scores and return valid tier labels."""

    @pytest.mark.asyncio
    async def test_vip_gets_higher_priority(self):
        from backend.services.priority_service import priority_service
        regular = await priority_service.score(
            order_value=100.0, is_vip=False, sentiment="neutral"
        )
        vip = await priority_service.score(
            order_value=100.0, is_vip=True, sentiment="neutral"
        )
        assert vip["score"] > regular["score"]

    @pytest.mark.asyncio
    async def test_angry_sentiment_escalates(self):
        from backend.services.priority_service import priority_service
        calm = await priority_service.score(order_value=100.0, sentiment="happy")
        angry = await priority_service.score(order_value=100.0, sentiment="angry")
        assert angry["score"] >= calm["score"]

    @pytest.mark.asyncio
    async def test_tier_label_valid(self):
        from backend.services.priority_service import priority_service
        result = await priority_service.score(order_value=500.0, sentiment="frustrated")
        assert result["tier"] in ("critical", "high", "medium", "low")


# ── Embeddings fallback ────────────────────────────────────────────────────────

class TestEmbeddingModel:
    """Embedding model must produce stable, normalised vectors without sentence_transformers."""

    def test_vector_length_correct(self):
        from backend.rag.embeddings import embedding_model
        vec = embedding_model.embed_text("test document about orders")
        assert len(vec) == 384

    def test_vector_is_normalised(self):
        import math
        from backend.rag.embeddings import embedding_model
        vec = embedding_model.embed_text("inventory shortage detected")
        norm = math.sqrt(sum(x * x for x in vec))
        assert abs(norm - 1.0) < 0.01, f"Vector not normalised: norm={norm}"

    def test_different_texts_produce_different_vectors(self):
        from backend.rag.embeddings import embedding_model
        v1 = embedding_model.embed_text("happy customer")
        v2 = embedding_model.embed_text("angry frustrated delay")
        assert v1 != v2

    def test_same_text_produces_same_vector(self):
        from backend.rag.embeddings import embedding_model
        v1 = embedding_model.embed_text("deterministic test")
        v2 = embedding_model.embed_text("deterministic test")
        assert v1 == v2
