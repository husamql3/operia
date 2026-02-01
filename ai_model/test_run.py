#!/usr/bin/env python3
"""Quick test script for the Operia agent."""

import asyncio
from src.config import get_settings
from src.agent import OperiaAgent
from src.storage import InMemoryStorage
from src.models import TaskSource


async def test():
    print("=== Operia AI Agent Demo ===")
    settings = get_settings()
    print(f"Endpoint: {settings.azure_openai.endpoint}")
    print(f"Deployment: {settings.azure_openai.deployment}")
    print()
    
    storage = InMemoryStorage()
    
    sample = """Team Meeting - Sprint Planning
    Alice: We need to finish the user authentication feature by Friday.
    Bob: I can take the backend API work.
    Charlie: I will handle the frontend components.
    Diana: There is a potential risk - we have not finalized the security review yet.
    """
    
    print("Processing sample meeting transcript...")
    print()
    
    async with OperiaAgent(storage=storage) as agent:
        result = await agent.extract_from_content(
            content=sample,
            source_type=TaskSource.MEETING_TRANSCRIPT,
            source_name="Sprint Planning Meeting",
            user_id="demo-user",
        )
        
        print(f"Success: {result.success}")
        print(f"Proposals extracted: {result.proposals_count}")
        if result.error:
            print(f"Error: {result.error}")
        if result.proposal_batch_id:
            print(f"Batch ID: {result.proposal_batch_id}")


if __name__ == "__main__":
    asyncio.run(test())
