"""Pydantic models for API request/response validation."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

# Chat
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    customer_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    context: str = ""
    sources: list[dict] = []
    sentiment: Optional[str] = None
    confidence: float = 0.0
    grounded: bool = True

# Sentiment  
class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1)

class SentimentResponse(BaseModel):
    sentiment: str  # happy, neutral, frustrated, angry, urgent
    confidence: float
    priority: str  # critical, high, medium, low
    suggested_action: str

# Returns
class ReturnCreateRequest(BaseModel):
    order_id: str
    customer_id: str = ""
    reason: str
    damage_type: Optional[str] = None
    image_path: Optional[str] = None

class ReturnResponse(BaseModel):
    id: int
    order_id: str
    customer_name: str = ""
    reason: str
    status: str
    damage_type: Optional[str] = None
    confidence: float
    refund_amount: float = 0.0
    agent_explanation: Optional[str] = None
    policy_reference: Optional[str] = None
    created_at: str

# Fraud
class FraudAlertResponse(BaseModel):
    id: int
    customer_id: str
    customer_name: str = ""
    fraud_score: float
    fraud_type: str
    risk_level: str
    explanation: str
    evidence: dict = {}
    status: str
    created_at: str

# Procurement
class PurchaseOrderResponse(BaseModel):
    id: int
    product_name: str
    sku: str
    quantity: int
    unit_cost: float
    total_cost: float
    supplier: str
    status: str
    estimated_delivery: str = ""
    created_at: str

# Shipping
class ShippingPredictionResponse(BaseModel):
    id: int
    order_id: str
    order_number: str = ""
    carrier: str
    estimated_delivery: str = ""
    predicted_delay_days: int = 0
    delay_risk: str
    confidence: float
    weather_impact: Optional[str] = None
    route_issues: Optional[str] = None
    status: str
    created_at: str

# Quality
class QualityInspectionResponse(BaseModel):
    id: int
    order_id: str
    order_number: str = ""
    result: str
    product_correct: bool = True
    quantity_correct: bool = True
    packaging_quality: str = "good"
    seal_integrity: bool = True
    issues: list[str] = []
    confidence: float
    explainability: Optional[dict] = None
    created_at: str

# Approvals
class ApprovalResponse(BaseModel):
    id: int
    request_type: str
    entity_id: str
    description: str
    agent_name: str
    confidence: float
    status: str
    reviewed_by: Optional[str] = None
    created_at: str

class ApprovalActionRequest(BaseModel):
    reviewed_by: str = "admin"
    notes: str = ""

# Analytics
class ExecutiveAnalytics(BaseModel):
    total_revenue: float = 0
    total_orders: int = 0
    completed_orders: int = 0
    pending_orders: int = 0
    total_returns: int = 0
    refund_losses: float = 0
    inventory_shortages: int = 0
    high_risk_customers: int = 0
    fraud_alerts: int = 0
    success_rate: float = 0
    avg_processing_time_ms: int = 0
    revenue_trend: list[dict] = []
    order_trend: list[dict] = []
    risk_distribution: dict = {}
    top_products: list[dict] = []

# Events
class EventResponse(BaseModel):
    id: int
    event_type: str
    source_agent: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    payload: dict = {}
    timestamp: str

# Observability
class AgentExecutionResponse(BaseModel):
    id: int
    agent_name: str
    action: str = ""
    status: str
    confidence: Optional[float] = None
    duration_ms: Optional[int] = None
    tokens_used: int = 0
    error_message: Optional[str] = None
    retry_count: int = 0
    created_at: str

# Priority
class PriorityResponse(BaseModel):
    score: float
    level: str  # critical, high, medium, low
    factors: dict
    suggested_queue_position: int = 0
