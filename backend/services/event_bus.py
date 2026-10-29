import asyncio
import json
from typing import Callable, Dict, List, Any
from backend.database import AsyncSessionLocal, EventLog

class EventBus:
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, topic: str, callback: Callable):
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        self.subscribers[topic].append(callback)

    async def publish(self, topic: str, data: Any):
        # Log to db
        async with AsyncSessionLocal() as session:
            new_event = EventLog(event_type=topic, payload=data)
            session.add(new_event)
            await session.commit()
            
        # Call handlers
        if topic in self.subscribers:
            for callback in self.subscribers[topic]:
                if asyncio.iscoroutinefunction(callback):
                    await callback(data)
                else:
                    callback(data)

event_bus = EventBus()
