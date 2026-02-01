"""
Operia AI Agent - Core Implementation

The main AI Operations Copilot agent using Microsoft Agent Framework.
"""

import json
import structlog
from datetime import datetime
from typing import Annotated, Any, Optional

from azure.identity.aio import DefaultAzureCredential

from .config import get_settings
from .models import (
    DailySummary,
    ExtractionResult,
    Proposal,
    ProposalBatch,
    ProposalStatus,
    ProposalType,
    Task,
    TaskPriority,
    TaskSource,
)

logger = structlog.get_logger()

# ============================================================================
# System Prompts
# ============================================================================

SYSTEM_PROMPT = """You are Operia, an AI Operations Copilot. Your role is to analyze various work signals (Notion pages, Slack messages, GitHub issues, meeting transcripts) to help users stay organized.

CRITICAL RULES:
1. You NEVER execute actions autonomously - you only PROPOSE actions
2. Every proposal must include evidence (direct quotes from the source)
3. Every proposal must explain WHY it was suggested
4. Every proposal must clearly state WHAT WILL HAPPEN if approved (always "saved to task list" - no automation)

You extract:
- Decisions made in meetings or discussions
- Action items and tasks
- Owners and deadlines (if mentioned)
- Follow-up requirements
- Potential risks or blockers

Be concise, accurate, and always cite your sources with exact quotes."""


EXTRACTION_PROMPT_TEMPLATE = """Analyze the following content and generate action proposals.

SOURCE TYPE: {source_type}
SOURCE: {source_name}

ENABLED SKILLS:
{skills_list}

{memory_context}

CONTENT TO ANALYZE:
---
{content}
---

Generate a JSON response with the following structure:
{{
  "proposals": [
    {{
      "id": "unique-id-1",
      "type": "create_task" | "draft_followup" | "reminder" | "summary" | "risk_alert",
      "title": "Brief title",
      "description": "Detailed description of the action",
      "evidence": ["Exact quote from content supporting this"],
      "rationale": "Why this action is being proposed",
      "what_will_happen": "If approved, this will be saved to your task list for tracking",
      "owner": "Person responsible (if mentioned)",
      "deadline": "Deadline (if mentioned, in ISO format)",
      "priority": "high" | "medium" | "low"
    }}
  ]
}}

Return ONLY valid JSON. Generate proposals only for items clearly mentioned or implied in the content."""


SUMMARY_PROMPT_TEMPLATE = """Generate a daily summary for {date}.

APPROVED ACTIONS TODAY:
{actions_text}

RECENT CONTEXT:
{context_text}

Generate a concise, professional summary that:
1. Highlights key accomplishments
2. Lists pending items
3. Notes any upcoming deadlines
4. Suggests focus areas for tomorrow

Return a JSON response:
{{
  "summary_text": "The narrative summary in 2-3 paragraphs",
  "highlights": ["Key point 1", "Key point 2"],
  "pending_items": ["Pending item 1", "Pending item 2"],
  "upcoming_deadlines": ["Deadline info 1"],
  "tomorrow_focus": ["Focus area 1"]
}}

Return ONLY valid JSON."""


# ============================================================================
# Agent Skills Configuration
# ============================================================================

DEFAULT_SKILLS = {
    "extract_tasks": True,
    "summarize": True,
    "draft_followups": True,
    "suggest_reminders": True,
    "detect_risks": True,
}


def build_skills_list(skills: dict[str, bool]) -> str:
    """Build a formatted list of enabled skills."""
    skill_descriptions = {
        "extract_tasks": "- Extract all actionable tasks with owners and deadlines if mentioned",
        "summarize": "- Create a brief summary of key decisions and outcomes",
        "draft_followups": "- Draft follow-up messages for any items that need communication",
        "suggest_reminders": "- Suggest reminders for time-sensitive items",
        "detect_risks": "- Identify any blockers, risks, or concerns mentioned",
    }
    return "\n".join(
        desc for key, desc in skill_descriptions.items() if skills.get(key, False)
    )


# ============================================================================
# Operia Agent Class
# ============================================================================


class OperiaAgent:
    """
    Operia AI Operations Agent.
    
    This agent extracts tasks and proposals from various sources (Notion, Slack,
    GitHub, meeting transcripts) and provides actionable recommendations.
    
    Note: This implementation is ready for backend integration. The agent
    uses an abstract storage interface that can be connected to any database.
    """

    def __init__(
        self,
        storage: Optional[Any] = None,  # Backend storage interface (to be implemented)
    ):
        self.settings = get_settings()
        self.storage = storage
        self._agent = None
        self._credential = None
        self._initialized = False

    async def __aenter__(self):
        """Async context manager entry."""
        await self._initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self._cleanup()

    async def _initialize(self):
        """Initialize the agent with Azure OpenAI."""
        # For now, we use direct HTTP calls to Azure OpenAI
        # The Agent Framework SDK is in active development and API may change
        # This approach is more stable for production use
        
        logger.info(
            "Initializing Operia agent",
            endpoint=self.settings.azure_openai.endpoint,
            deployment=self.settings.azure_openai.deployment,
        )
        
        self._initialized = True
        logger.info("Operia agent initialized successfully (using direct API)")

    async def _cleanup(self):
        """Cleanup resources."""
        if self._credential:
            try:
                await self._credential.close()
            except Exception:
                pass

    def _get_tools(self) -> list:
        """Get the list of tools for the agent."""
        # These tools will be used by the agent for task extraction
        # Currently returning empty list - tools will be added as integrations are implemented
        return []

    async def _call_llm_direct(
        self,
        messages: list[dict[str, str]],
        response_format: Optional[dict] = None,
    ) -> str:
        """
        Direct HTTP call to Azure OpenAI (fallback when SDK not available).
        """
        import aiohttp
        
        settings = self.settings.azure_openai
        url = (
            f"{settings.endpoint}/openai/deployments/{settings.deployment}"
            f"/chat/completions?api-version={settings.api_version}"
        )
        
        headers = {
            "Content-Type": "application/json",
            "api-key": settings.api_key or "",
        }
        
        body = {
            "messages": messages,
            "temperature": self.settings.agent.temperature,
            "max_tokens": self.settings.agent.max_tokens,
        }
        if response_format:
            body["response_format"] = response_format
        
        # Use SSL context that works on macOS (disable verification in dev mode)
        import ssl
        ssl_context = ssl.create_default_context()
        if not self.settings.is_production:
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(url, headers=headers, json=body) as response:
                if not response.ok:
                    error_text = await response.text()
                    raise Exception(f"Azure OpenAI API error: {response.status} - {error_text}")
                
                data = await response.json()
                return data["choices"][0]["message"]["content"]

    async def extract_from_content(
        self,
        content: str,
        source_type: TaskSource,
        source_name: str = "",
        skills: Optional[dict[str, bool]] = None,
        memory_context: str = "",
        user_id: str = "default",
    ) -> ExtractionResult:
        """
        Extract tasks and proposals from content.
        
        Args:
            content: The text content to analyze
            source_type: Type of source (Notion, Slack, GitHub, etc.)
            source_name: Name/identifier of the source
            skills: Dict of enabled skills (extract_tasks, summarize, etc.)
            memory_context: Recent context from memory
            user_id: User identifier for isolation
            
        Returns:
            ExtractionResult with proposals
        """
        skills = skills or DEFAULT_SKILLS
        
        # Build the prompt
        prompt = EXTRACTION_PROMPT_TEMPLATE.format(
            source_type=source_type.value,
            source_name=source_name,
            skills_list=build_skills_list(skills),
            memory_context=f"RECENT CONTEXT:\n{memory_context}\n" if memory_context else "",
            content=content,
        )
        
        try:
            # Call LLM (use agent if available, otherwise direct HTTP)
            if self._agent:
                result = await self._agent.run(prompt)
                response_text = result.text
            else:
                response_text = await self._call_llm_direct(
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                )
            
            # Parse response
            parsed = json.loads(response_text)
            proposals = [
                Proposal(
                    id=p.get("id", ""),
                    type=ProposalType(p.get("type", "create_task")),
                    title=p.get("title", ""),
                    description=p.get("description", ""),
                    evidence=p.get("evidence", []),
                    rationale=p.get("rationale", ""),
                    what_will_happen=p.get("what_will_happen", "Saved to task list"),
                    owner=p.get("owner"),
                    deadline=p.get("deadline"),
                    priority=TaskPriority(p.get("priority", "medium")),
                )
                for p in parsed.get("proposals", [])
            ]
            
            # Create proposal batch
            batch = ProposalBatch(
                user_id=user_id,
                source_type=source_type,
                source_id=source_name,
                proposals=proposals,
                enabled_skills=skills,
                model_info=f"Azure OpenAI {self.settings.azure_openai.deployment}",
            )
            
            # Store if storage is available
            if self.storage:
                await self.storage.save_proposal_batch(batch)
            
            logger.info(
                "Extracted proposals",
                source_type=source_type.value,
                proposals_count=len(proposals),
            )
            
            return ExtractionResult(
                success=True,
                source=source_type,
                proposal_batch_id=batch.id,
                proposals_count=len(proposals),
            )
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse LLM response", error=str(e))
            return ExtractionResult(
                success=False,
                source=source_type,
                error=f"Failed to parse response: {e}",
            )
        except Exception as e:
            logger.error("Extraction failed", error=str(e))
            return ExtractionResult(
                success=False,
                source=source_type,
                error=str(e),
            )

    async def generate_daily_summary(
        self,
        user_id: str,
        date: Optional[str] = None,
        approved_actions: Optional[list[Task]] = None,
        memory_context: str = "",
    ) -> Optional[DailySummary]:
        """
        Generate a daily summary for the user.
        
        Args:
            user_id: User identifier
            date: Date in YYYY-MM-DD format (defaults to today)
            approved_actions: List of approved tasks
            memory_context: Recent context from memory
            
        Returns:
            DailySummary or None if generation fails
        """
        date = date or datetime.utcnow().strftime("%Y-%m-%d")
        approved_actions = approved_actions or []
        
        actions_text = "\n".join(
            f"{i+1}. [{a.source.value}] {a.title}: {a.description or ''}"
            for i, a in enumerate(approved_actions)
        ) or "(No actions approved today)"
        
        prompt = SUMMARY_PROMPT_TEMPLATE.format(
            date=date,
            actions_text=actions_text,
            context_text=memory_context or "(No recent context)",
        )
        
        try:
            if self._agent:
                result = await self._agent.run(prompt)
                response_text = result.text
            else:
                response_text = await self._call_llm_direct(
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                )
            
            parsed = json.loads(response_text)
            
            summary = DailySummary(
                user_id=user_id,
                date=date,
                summary_text=parsed.get("summary_text", ""),
                highlights=parsed.get("highlights", []),
                pending_items=parsed.get("pending_items", []),
                upcoming_deadlines=parsed.get("upcoming_deadlines", []),
                tomorrow_focus=parsed.get("tomorrow_focus", []),
            )
            
            if self.storage:
                await self.storage.save_daily_summary(summary)
            
            return summary
            
        except Exception as e:
            logger.error("Failed to generate daily summary", error=str(e))
            return None


# ============================================================================
# Convenience Functions
# ============================================================================


async def create_agent(storage: Optional[Any] = None) -> OperiaAgent:
    """
    Create and initialize an Operia agent.
    
    Usage:
        async with await create_agent() as agent:
            result = await agent.extract_from_content(...)
    """
    agent = OperiaAgent(storage=storage)
    await agent._initialize()
    return agent
