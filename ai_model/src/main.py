"""
Main entry point for Operia AI Agent.

This module provides the main function to run the agent.
"""

import asyncio
import structlog
from .config import get_settings
from .agent import OperiaAgent
from .storage import InMemoryStorage
from .models import TaskSource

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


async def demo_extraction():
    """
    Demo function showing how to use the Operia agent.
    """
    settings = get_settings()
    logger.info(
        "Starting Operia AI Agent",
        environment=settings.environment,
        model=settings.azure_openai.deployment,
    )

    # Create storage (use InMemoryStorage for demo, replace with real implementation)
    storage = InMemoryStorage()

    # Sample meeting transcript for demo
    sample_transcript = """
    Team Meeting - Sprint Planning
    Date: 2026-02-01
    Attendees: Alice, Bob, Charlie, Diana

    Alice: Let's discuss the priorities for this sprint. We need to finish the 
    user authentication feature by Friday.

    Bob: I can take the backend API work. I'll need to set up the OAuth2 flow 
    and integrate with our identity provider.

    Charlie: I'll handle the frontend components. We need login, logout, and 
    password reset flows. I should have mockups by Wednesday.

    Diana: There's a potential risk here - we haven't finalized the security 
    review yet. We should block on that before going to production.

    Alice: Good point. Charlie, can you also create a task to schedule the 
    security review with the InfoSec team?

    Charlie: Sure, I'll reach out to them today.

    Alice: Also, don't forget we have the client demo next Thursday. We need 
    to prepare a slide deck. Bob, can you own that?

    Bob: Yes, I'll start on the slides Monday and share a draft by Wednesday.

    Summary of decisions:
    1. Sprint goal: Complete user authentication
    2. Security review required before production
    3. Client demo preparation assigned to Bob
    """

    async with OperiaAgent(storage=storage) as agent:
        # Extract tasks from the meeting transcript
        result = await agent.extract_from_content(
            content=sample_transcript,
            source_type=TaskSource.MEETING_TRANSCRIPT,
            source_name="Sprint Planning Meeting",
            user_id="demo-user",
        )

        if result.success:
            logger.info(
                "Extraction successful",
                proposals_count=result.proposals_count,
                batch_id=str(result.proposal_batch_id),
            )
            
            # In a real app, you would:
            # 1. Return proposals to the user for review
            # 2. Let user approve/reject/edit proposals
            # 3. Save approved actions to the backend
            # 4. Sync to external tools (Notion, Slack, GitHub)
        else:
            logger.error("Extraction failed", error=result.error)


async def main():
    """Main entry point."""
    await demo_extraction()


if __name__ == "__main__":
    asyncio.run(main())
