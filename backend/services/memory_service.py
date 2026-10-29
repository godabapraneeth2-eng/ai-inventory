from backend.database import AsyncSessionLocal, CustomerMemory
from sqlalchemy.future import select

class MemoryService:
    async def get_memories(self, customer_id: str) -> list:
        async with AsyncSessionLocal() as session:
            stmt = select(CustomerMemory).where(CustomerMemory.customer_id == customer_id)
            result = await session.execute(stmt)
            memories = result.scalars().all()
            return [{"key": m.memory_key, "value": m.memory_value} for m in memories]

    async def add_memory(self, customer_id: str, key: str, value: dict):
        async with AsyncSessionLocal() as session:
            # Check existing
            stmt = select(CustomerMemory).where(
                CustomerMemory.customer_id == customer_id,
                CustomerMemory.memory_key == key
            )
            result = await session.execute(stmt)
            memory = result.scalars().first()
            if memory:
                memory.memory_value = value
            else:
                memory = CustomerMemory(customer_id=customer_id, memory_key=key, memory_value=value)
                session.add(memory)
            await session.commit()

memory_service = MemoryService()
