import datetime
from backend.database import AsyncSessionLocal, PurchaseOrder

class ProcurementService:
    async def generate_po(self, product_name: str, sku: str, current_stock: int, reorder_point: int) -> dict:
        quantity = max(reorder_point * 2, 100)
        unit_cost = 10.50
        
        async with AsyncSessionLocal() as session:
            po = PurchaseOrder(product_id=sku, quantity=quantity, status="generated")
            session.add(po)
            await session.commit()
            await session.refresh(po)
            po_id = po.id
            
        return {
            "id": po_id,
            "product_name": product_name,
            "sku": sku,
            "quantity": quantity,
            "unit_cost": unit_cost,
            "total_cost": quantity * unit_cost,
            "supplier": "Global Tech Suppliers Inc.",
            "status": "generated",
            "estimated_delivery": (datetime.datetime.utcnow() + datetime.timedelta(days=5)).isoformat(),
            "created_at": datetime.datetime.utcnow().isoformat()
        }

procurement_service = ProcurementService()
