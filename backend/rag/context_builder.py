class ContextBuilder:
    def build(self, query: str, docs: list, customer_data: dict = None) -> str:
        context = f"Query: {query}\n\nRetrieved Documents:\n"
        for d in docs:
            context += f"- {d}\n"
        if customer_data:
            context += f"\nCustomer Data: {customer_data}\n"
        return context

context_builder = ContextBuilder()
