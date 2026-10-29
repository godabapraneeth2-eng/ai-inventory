"""
Phase F — Return & Refund AI with Vision Analysis (Gemini Vision + image processing).
"""
from __future__ import annotations
import base64
import datetime
import hashlib
import json
import os
import re
from pathlib import Path
from typing import Optional

from backend.config import settings
from backend.database import AsyncSessionLocal, ReturnRequest


# ── Vision analysis constants ──────────────────────────────────────────────────

DAMAGE_PATTERNS = {
    "cracked": {
        "keywords": ["crack", "cracked", "split", "shatter", "broken screen", "fractured"],
        "severity": "high",
        "policy": "POLICY_3.2_PHYSICAL_DAMAGE",
        "auto_approve": True,
    },
    "scratched": {
        "keywords": ["scratch", "scratched", "scuff", "scrape", "mark", "dent"],
        "severity": "medium",
        "policy": "POLICY_3.4_COSMETIC_DAMAGE",
        "auto_approve": False,
    },
    "missing_accessories": {
        "keywords": ["missing", "absent", "not included", "no charger", "no cable", "incomplete"],
        "severity": "medium",
        "policy": "POLICY_4.1_INCOMPLETE_ITEM",
        "auto_approve": True,
    },
    "wrong_product": {
        "keywords": ["wrong", "incorrect", "different", "not what I ordered", "wrong model", "wrong color"],
        "severity": "high",
        "policy": "POLICY_2.1_WRONG_ITEM",
        "auto_approve": True,
    },
    "used_product": {
        "keywords": ["used", "opened", "second hand", "dirty", "worn", "refurbished"],
        "severity": "high",
        "policy": "POLICY_5.1_USED_ITEM",
        "auto_approve": True,
    },
    "no_damage": {
        "keywords": ["change of mind", "don't need", "too expensive", "no longer needed", "gift"],
        "severity": "low",
        "policy": "POLICY_6.0_NO_FAULT",
        "auto_approve": False,
    },
}

POLICY_TEXTS = {
    "POLICY_3.2_PHYSICAL_DAMAGE": "Section 3.2 — Physical damage caused during transit or manufacturing defect. Full refund within 30 days. No restocking fee.",
    "POLICY_3.4_COSMETIC_DAMAGE": "Section 3.4 — Cosmetic damage assessed on a case-by-case basis. Partial refund may apply. Manager approval required.",
    "POLICY_4.1_INCOMPLETE_ITEM": "Section 4.1 — Items shipped without all listed accessories are eligible for a full refund or replacement shipment.",
    "POLICY_2.1_WRONG_ITEM": "Section 2.1 — Incorrect item shipped due to fulfillment error. Full refund plus return shipping covered by the company.",
    "POLICY_5.1_USED_ITEM": "Section 5.1 — Pre-used or opened items delivered as new qualify for full refund and fraud investigation.",
    "POLICY_6.0_NO_FAULT": "Section 6.0 — Change-of-mind returns accepted within 14 days. 15% restocking fee applies. Customer covers return shipping.",
}


# ── Gemini Vision integration ──────────────────────────────────────────────────

async def analyze_image_with_gemini(image_bytes: bytes, reason: str) -> dict:
    """Send image to Gemini Vision for damage analysis."""
    if not settings.GEMINI_API_KEY:
        return _fallback_vision_analysis(reason)

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            "You are a quality inspection AI for an e-commerce company. "
            "Analyze this product image for a return request. "
            f"The customer's stated reason is: '{reason}'. "
            "Respond with a JSON object containing: "
            "'damage_detected' (bool), 'damage_type' (one of: cracked, scratched, "
            "missing_accessories, wrong_product, used_product, no_damage), "
            "'confidence' (float 0-1), 'visual_evidence' (list of strings describing what you see), "
            "'recommendation' (approve/reject/more_evidence). "
            "Be strict and objective."
        )

        img_part = {"mime_type": "image/jpeg", "data": image_bytes}
        response = model.generate_content([prompt, img_part])
        text = response.text.strip()

        # Extract JSON from response
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception:
        pass

    return _fallback_vision_analysis(reason)


def _fallback_vision_analysis(reason: str) -> dict:
    """Rule-based fallback when Gemini Vision is unavailable."""
    reason_lower = reason.lower()
    for damage_type, config in DAMAGE_PATTERNS.items():
        if any(kw in reason_lower for kw in config["keywords"]):
            return {
                "damage_detected": damage_type != "no_damage",
                "damage_type": damage_type,
                "confidence": 0.82,
                "visual_evidence": [f"Customer-reported: {reason}"],
                "recommendation": "approve" if config["auto_approve"] else "more_evidence",
                "analysis_method": "rule_based_fallback",
            }
    return {
        "damage_detected": False,
        "damage_type": "no_damage",
        "confidence": 0.50,
        "visual_evidence": ["No clear damage indicators detected from description"],
        "recommendation": "more_evidence",
        "analysis_method": "rule_based_fallback",
    }


# ── Image processing helpers ────────────────────────────────────────────────────

def compute_image_hash(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()[:16]


def estimate_damage_severity(damage_type: str) -> float:
    """Return a damage severity multiplier 0.0–1.0 used in refund calculation."""
    severity_map = {
        "cracked": 1.00,
        "wrong_product": 1.00,
        "used_product": 1.00,
        "missing_accessories": 0.60,
        "scratched": 0.30,
        "no_damage": 0.00,
    }
    return severity_map.get(damage_type, 0.50)


def determine_decision(
    vision_result: dict,
    confidence_threshold_auto: float = 0.95,
    confidence_threshold_review: float = 0.70,
) -> tuple[str, float]:
    """
    Apply Human-in-the-Loop confidence thresholds to determine final status.
    Returns (status, confidence).
    """
    confidence = vision_result.get("confidence", 0.5)
    recommendation = vision_result.get("recommendation", "more_evidence")
    damage_type = vision_result.get("damage_type", "no_damage")
    config = DAMAGE_PATTERNS.get(damage_type, {})

    if recommendation == "approve" and config.get("auto_approve") and confidence >= confidence_threshold_review:
        if confidence >= confidence_threshold_auto:
            return "approved", confidence
        return "pending_manager_review", confidence
    elif recommendation == "reject" or damage_type == "no_damage" and confidence > 0.80:
        return "rejected", confidence
    return "more_evidence_needed", confidence


# ── Main service ───────────────────────────────────────────────────────────────

class ReturnService:
    async def process_return(
        self,
        order_id: str,
        customer_id: str,
        reason: str,
        damage_type: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        image_filename: Optional[str] = None,
    ) -> dict:
        """
        Full return processing pipeline:
        1. Vision AI analysis (Gemini or fallback)
        2. Policy lookup
        3. HITL confidence routing
        4. Refund calculation
        5. Persist to database
        """
        # ── Vision analysis ──
        if image_bytes:
            vision_result = await analyze_image_with_gemini(image_bytes, reason)
        else:
            vision_result = _fallback_vision_analysis(reason)

        detected_damage_type = vision_result.get("damage_type", damage_type or "no_damage")
        visual_evidence = vision_result.get("visual_evidence", [])
        analysis_method = vision_result.get("analysis_method", "gemini_vision")

        # ── Policy lookup ──
        policy_config = DAMAGE_PATTERNS.get(detected_damage_type, DAMAGE_PATTERNS["no_damage"])
        policy_ref = policy_config["policy"]
        policy_text = POLICY_TEXTS.get(policy_ref, "")

        # ── HITL routing ──
        status, confidence = determine_decision(vision_result)

        # ── Refund calculation ──
        severity = estimate_damage_severity(detected_damage_type)
        base_refund = 100.0  # placeholder; in production pull from invoice
        refund_amount = round(base_refund * severity, 2) if status == "approved" else 0.0

        # ── Build explanation ──
        evidence_bullets = "\n".join(f"• {e}" for e in visual_evidence) if visual_evidence else "• Customer-reported issue"
        explanation = (
            f"Vision AI detected: {detected_damage_type.replace('_', ' ')}.\n"
            f"Analysis method: {analysis_method}.\n"
            f"Evidence:\n{evidence_bullets}\n"
            f"Policy applied: {policy_text}"
        )

        # ── Persist ──
        async with AsyncSessionLocal() as session:
            ret_req = ReturnRequest(
                order_id=order_id,
                customer_id=customer_id,
                reason=reason,
                damage_type=detected_damage_type,
                status=status,
                confidence=confidence,
                refund_amount=refund_amount,
                agent_explanation=explanation,
                policy_reference=policy_ref,
            )
            session.add(ret_req)
            await session.commit()
            await session.refresh(ret_req)
            ret_id = ret_req.id

        return {
            "id": ret_id,
            "order_id": order_id,
            "customer_name": customer_id,
            "reason": reason,
            "status": status,
            "damage_type": detected_damage_type,
            "confidence": confidence,
            "refund_amount": refund_amount,
            "agent_explanation": explanation,
            "policy_reference": policy_ref,
            "visual_evidence": visual_evidence,
            "analysis_method": analysis_method,
            "created_at": datetime.datetime.utcnow().isoformat(),
        }

    async def list_returns(self) -> list[dict]:
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(ReturnRequest).order_by(ReturnRequest.created_at.desc()).limit(50)
            )
            rows = result.scalars().all()
            return [
                {
                    "id": r.id,
                    "order_id": r.order_id,
                    "customer_name": r.customer_id or "",
                    "reason": r.reason,
                    "status": r.status,
                    "damage_type": r.damage_type,
                    "confidence": r.confidence or 0.0,
                    "refund_amount": r.refund_amount or 0.0,
                    "agent_explanation": r.agent_explanation,
                    "policy_reference": r.policy_reference,
                    "created_at": r.created_at.isoformat() if r.created_at else "",
                }
                for r in rows
            ]


return_service = ReturnService()
