"""
Agent communication tests — Phase S
Tests the end-to-end message flow between agents:
  Orchestrator → ValidationAgent → InventoryAgent → InvoiceAgent → RiskAgent
"""
import pytest


class TestAgentPipeline:
    """Tests full multi-agent workflow for order processing."""

    @pytest.mark.asyncio
    async def test_sentiment_feeds_priority(self):
        """Sentiment output should feed into priority engine with consistent tier."""
        from backend.services.sentiment_service import sentiment_service
        from backend.services.priority_service import priority_service

        sentiment_result = sentiment_service.analyze(
            "I am extremely frustrated with this delayed shipment!"
        )
        priority_result = await priority_service.score(
            order_value=250.0,
            sentiment=sentiment_result["sentiment"],
        )

        # Frustrated/angry sentiment must produce high or critical priority
        assert priority_result["tier"] in ("critical", "high")

    @pytest.mark.asyncio
    async def test_fraud_scan_then_quality_inspect(self):
        """Fraud and quality checks run independently and both succeed."""
        from backend.services.fraud_service import fraud_service
        from backend.services.quality_service import quality_service

        fraud = await fraud_service.scan("COMM-CUST-1", 500.0, customer_name="Alice")
        quality = await quality_service.inspect("COMM-ORD-1", sku="SKU-COMM", expected_quantity=2)

        assert "fraud_score" in fraud
        assert quality["result"] in ("passed", "warning", "failed")

    @pytest.mark.asyncio
    async def test_return_triggers_correct_policy(self):
        """Return service must reference a valid policy for every damage type."""
        from backend.services.return_service import return_service, POLICY_TEXTS

        scenarios = [
            ("cracked screen broken", True),        # high-severity → should reference physical damage policy
            ("wrong item delivered", True),          # wrong product
            ("missing power adapter", True),         # missing accessories
            ("don't need it anymore", False),        # no damage — change of mind
        ]
        for reason, _ in scenarios:
            result = await return_service.process_return(
                order_id=f"TEST-{hash(reason) % 9999}",
                customer_id="comm-cust",
                reason=reason,
            )
            ref = result.get("policy_reference")
            assert ref is not None, f"Missing policy_reference for: {reason}"
            assert ref in POLICY_TEXTS, f"Unknown policy '{ref}' for: {reason}"

    @pytest.mark.asyncio
    async def test_quality_failure_produces_issues_list(self):
        """When quality check fails, issues list must be non-empty."""
        from backend.services.quality_service import quality_service

        # Run multiple inspections — at least one should fail given deterministic hash distribution
        results = []
        for i in range(20):
            r = await quality_service.inspect(f"ORD-COMM-{i}", sku=f"SKU-{i:03d}", expected_quantity=1)
            results.append(r)

        failures = [r for r in results if r["result"] == "failed"]
        if failures:
            for f in failures:
                assert len(f["issues"]) > 0, "Failed inspection has empty issues list"

    @pytest.mark.asyncio
    async def test_event_bus_publish_subscribe(self):
        """Event bus must deliver published events to subscribers."""
        from backend.services.event_bus import event_bus

        received = []

        async def handler(payload: dict):
            received.append(payload)

        event_bus.subscribe("TestEvent", handler)
        await event_bus.publish("TestEvent", {"data": "agent_comms_test"})

        assert len(received) == 1
        assert received[0]["data"] == "agent_comms_test"


class TestRAGPipeline:
    """Tests the RAG retrieval chain."""

    def test_embeddings_produce_valid_vectors(self):
        import math
        from backend.rag.embeddings import embedding_model

        texts = [
            "Customer reports damaged packaging",
            "Invoice total exceeds credit limit",
            "Inventory shortage detected for SKU-001",
            "Fraud alert: multiple refund requests from same IP",
        ]
        for text in texts:
            vec = embedding_model.embed_text(text)
            assert len(vec) == 384
            norm = math.sqrt(sum(x * x for x in vec))
            assert abs(norm - 1.0) < 0.02, f"Unnormalised vector for: {text}"

    def test_vector_store_add_and_search(self):
        from backend.rag.vector_store import VectorStore
        from backend.rag.embeddings import embedding_model

        store = VectorStore()
        doc_text = "Customer John Doe has three pending refund requests"
        embedding = embedding_model.embed_text(doc_text)
        store.add_document("test-doc-1", embedding, doc_text, {"source": "test"})

        query = embedding_model.embed_text("refund requests")
        results = store.search(query, n_results=1)

        assert results is not None
        assert len(results.get("documents", [[]])[0]) >= 1
