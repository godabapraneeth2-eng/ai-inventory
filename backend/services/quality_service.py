"""
Phase G — Quality Inspection Agent.
Verifies: correct product, correct quantity, packaging quality, seal integrity.
Supports both simulated (hash-based) and real Gemini Vision inspection.
"""
from __future__ import annotations
import datetime
import hashlib
import json
import re
from typing import Optional

from backend.database import AsyncSessionLocal, QualityInspection as QualityInspectionModel


# ── Inspection categories ──────────────────────────────────────────────────────

INSPECTION_RULES = {
    "high_risk_skus": ["SKU-001", "SKU-004"],  # expensive items — stricter check
    "seal_required_categories": ["electronics", "software", "health"],
    "weight_tolerance_pct": 5.0,   # allow 5% variance before flagging
}


# ── Gemini Vision quality check ────────────────────────────────────────────────

async def vision_inspect(image_bytes: bytes, expected_sku: str, expected_qty: int) -> dict:
    """Use Gemini Vision to verify packed item against order."""
    from backend.config import settings
    if not settings.GEMINI_API_KEY or not image_bytes:
        return _simulated_inspection(expected_sku, expected_qty)

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            "You are a warehouse quality inspection AI. "
            f"The expected item is SKU '{expected_sku}', quantity {expected_qty}. "
            "Inspect this image of a packed warehouse item and respond ONLY with a JSON object: "
            "{ 'product_correct': bool, 'quantity_correct': bool, 'packaging_quality': 'good'|'acceptable'|'poor', "
            "'seal_integrity': bool, 'issues': [list of strings], 'confidence': float 0-1, "
            "'stop_shipment': bool, 'reason': string }. "
            "If packaging is damaged, seal is broken, or product looks wrong — set stop_shipment to true."
        )
        img_part = {"mime_type": "image/jpeg", "data": image_bytes}
        response = model.generate_content([prompt, img_part])
        text = response.text.strip()
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            result["analysis_method"] = "gemini_vision"
            return result
    except Exception:
        pass

    return _simulated_inspection(expected_sku, expected_qty)


def _simulated_inspection(sku: str, qty: int) -> dict:
    """
    Deterministic simulation based on SKU hash.
    Roughly 10% failure rate for standard items, 5% for high-risk SKUs.
    """
    h = int(hashlib.sha256(sku.encode()).hexdigest(), 16)
    failure_threshold = 10 if sku not in INSPECTION_RULES["high_risk_skus"] else 5
    fail = (h % 100) < failure_threshold

    issues = []
    packaging_quality = "good"
    seal_ok = True
    product_ok = True
    qty_ok = True

    if fail:
        # Vary the failure type based on hash
        failure_mode = h % 4
        if failure_mode == 0:
            issues.append("Seal broken — packaging integrity compromised")
            seal_ok = False
            packaging_quality = "poor"
        elif failure_mode == 1:
            issues.append(f"Quantity mismatch: expected {qty}, found {max(1, qty - 1)}")
            qty_ok = False
            packaging_quality = "acceptable"
        elif failure_mode == 2:
            issues.append("Product variant mismatch — wrong colour/model detected")
            product_ok = False
        else:
            issues.append("Packaging dent — minor cosmetic damage to outer box")
            packaging_quality = "acceptable"

    return {
        "product_correct": product_ok,
        "quantity_correct": qty_ok,
        "packaging_quality": packaging_quality,
        "seal_integrity": seal_ok,
        "issues": issues,
        "confidence": 0.97 if not fail else 0.91,
        "stop_shipment": fail and (not seal_ok or not product_ok),
        "reason": issues[0] if issues else "All checks passed",
        "analysis_method": "simulated_inspection",
    }


# ── Main service ───────────────────────────────────────────────────────────────

class QualityService:
    async def inspect(
        self,
        order_id: str,
        sku: str = "UNKNOWN",
        expected_quantity: int = 1,
        image_bytes: Optional[bytes] = None,
    ) -> dict:
        """
        Full quality inspection workflow:
        1. Vision AI check (Gemini or simulation)
        2. Determine overall pass/fail/warning
        3. If stop_shipment → log event
        4. Persist to DB
        5. Return structured report
        """
        vision = await vision_inspect(image_bytes or b"", sku, expected_quantity)

        # Derive result
        stop = vision.get("stop_shipment", False)
        issues = vision.get("issues", [])
        if stop:
            result = "failed"
        elif issues:
            result = "warning"
        else:
            result = "passed"

        # Order number formatting
        order_number = order_id if order_id.startswith("ORD") else f"ORD-{order_id}"

        async with AsyncSessionLocal() as session:
            insp = QualityInspectionModel(
                order_id=order_id,
                order_number=order_number,
                result=result,
                product_correct=vision["product_correct"],
                quantity_correct=vision["quantity_correct"],
                packaging_quality=vision["packaging_quality"],
                seal_integrity=vision["seal_integrity"],
                issues=issues,
                confidence=vision["confidence"],
                inspector_agent="QualityAgent",
            )
            session.add(insp)
            await session.commit()
            await session.refresh(insp)
            insp_id = insp.id

        # Fire stop-shipment event
        if stop:
            try:
                from backend.services.event_bus import event_bus
                await event_bus.publish("ShipmentHeld", {
                    "order_id": order_id,
                    "reason": vision.get("reason", "Quality check failed"),
                    "issues": issues,
                })
            except Exception:
                pass

        return {
            "id": insp_id,
            "order_id": order_id,
            "order_number": order_number,
            "sku": sku,
            "result": result,
            "product_correct": vision["product_correct"],
            "quantity_correct": vision["quantity_correct"],
            "packaging_quality": vision["packaging_quality"],
            "seal_integrity": vision["seal_integrity"],
            "issues": issues,
            "confidence": vision["confidence"],
            "stop_shipment": stop,
            "analysis_method": vision.get("analysis_method"),
            "explainability": {
                "agent": "QualityAgent",
                "policy": "WAREHOUSE_QC_POLICY_V3",
                "rule": vision.get("reason"),
                "confidence": vision["confidence"],
                "evidence": issues or ["All inspection criteria met"],
            },
            "created_at": datetime.datetime.utcnow().isoformat(),
        }

    async def list_inspections(self) -> list[dict]:
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(QualityInspectionModel)
                .order_by(QualityInspectionModel.created_at.desc())
                .limit(50)
            )
            rows = result.scalars().all()
            return [
                {
                    "id": r.id,
                    "order_id": r.order_id,
                    "order_number": r.order_number or f"ORD-{r.order_id}",
                    "result": r.result,
                    "issues": r.issues or [],
                    "confidence": r.confidence or 0.95,
                    "created_at": r.created_at.isoformat() if r.created_at else "",
                }
                for r in rows
            ]


quality_service = QualityService()
