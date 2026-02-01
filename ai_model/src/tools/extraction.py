"""
Task Extraction Tools.

These tools are designed to be used by the Operia agent for extracting
tasks from various sources. They can be registered as agent tools for
function calling.
"""

import structlog
from typing import Annotated, Optional

from ..models import ExtractionResult, TaskSource

logger = structlog.get_logger()


async def extract_from_notion(
    page_id: Annotated[str, "The Notion page ID to extract tasks from"],
    include_subpages: Annotated[bool, "Whether to include subpages"] = False,
) -> dict:
    """
    Extract tasks from a Notion page.
    
    This tool fetches a Notion page and extracts actionable tasks,
    which are then sent to the AI for proposal generation.
    """
    from ..services.notion import get_notion_service
    
    logger.info("Extracting tasks from Notion", page_id=page_id)
    
    try:
        service = await get_notion_service()
        page = await service.get_page(page_id)
        
        if not page:
            return {
                "success": False,
                "error": "Page not found or Notion not configured",
                "source": "notion",
            }
        
        tasks = await service.extract_tasks_from_page(page)
        
        return {
            "success": True,
            "source": "notion",
            "page_id": page_id,
            "page_title": page.title,
            "tasks_found": len(tasks),
            "content_for_analysis": page.content,
            "tasks": [t.model_dump() for t in tasks],
        }
        
    except Exception as e:
        logger.error("Notion extraction failed", error=str(e))
        return {
            "success": False,
            "error": str(e),
            "source": "notion",
        }


async def extract_from_slack(
    channel_id: Annotated[str, "The Slack channel ID to extract tasks from"],
    message_limit: Annotated[int, "Maximum number of messages to analyze"] = 50,
    include_threads: Annotated[bool, "Whether to include thread replies"] = True,
) -> dict:
    """
    Extract tasks from Slack messages in a channel.
    
    This tool fetches recent messages from a Slack channel and identifies
    action items and tasks.
    """
    from ..services.slack import get_slack_service
    
    logger.info("Extracting tasks from Slack", channel_id=channel_id)
    
    try:
        service = await get_slack_service()
        messages = await service.get_channel_messages(
            channel_id=channel_id,
            limit=message_limit,
        )
        
        if not messages:
            return {
                "success": False,
                "error": "No messages found or Slack not configured",
                "source": "slack",
            }
        
        tasks = service.extract_tasks_from_messages(messages)
        
        # Combine messages for AI analysis
        combined_text = "\n\n".join([
            f"[{msg.user_name or msg.user_id}]: {msg.text}"
            for msg in messages
        ])
        
        return {
            "success": True,
            "source": "slack",
            "channel_id": channel_id,
            "messages_analyzed": len(messages),
            "tasks_found": len(tasks),
            "content_for_analysis": combined_text,
            "tasks": [t.model_dump() for t in tasks],
        }
        
    except Exception as e:
        logger.error("Slack extraction failed", error=str(e))
        return {
            "success": False,
            "error": str(e),
            "source": "slack",
        }


async def extract_from_github(
    repo_name: Annotated[str, "Repository name in owner/repo format"],
    issue_state: Annotated[str, "Issue state: 'open', 'closed', or 'all'"] = "open",
    labels: Annotated[Optional[list[str]], "Filter by labels"] = None,
    limit: Annotated[int, "Maximum number of issues to analyze"] = 50,
) -> dict:
    """
    Extract tasks from GitHub issues.
    
    This tool fetches issues from a GitHub repository and converts them
    to actionable tasks.
    """
    from ..services.github import get_github_service
    
    logger.info("Extracting tasks from GitHub", repo=repo_name)
    
    try:
        service = await get_github_service()
        issues = await service.get_repo_issues(
            repo_name=repo_name,
            state=issue_state,
            labels=labels,
            limit=limit,
        )
        
        if not issues:
            return {
                "success": False,
                "error": "No issues found or GitHub not configured",
                "source": "github",
            }
        
        tasks = service.extract_tasks_from_issues(issues)
        
        # Combine issues for AI analysis
        combined_text = "\n\n".join([
            f"Issue #{issue.number}: {issue.title}\n{issue.body or ''}"
            for issue in issues
        ])
        
        return {
            "success": True,
            "source": "github",
            "repo_name": repo_name,
            "issues_analyzed": len(issues),
            "tasks_found": len(tasks),
            "content_for_analysis": combined_text,
            "tasks": [t.model_dump() for t in tasks],
        }
        
    except Exception as e:
        logger.error("GitHub extraction failed", error=str(e))
        return {
            "success": False,
            "error": str(e),
            "source": "github",
        }


async def extract_from_text(
    text: Annotated[str, "The text content to analyze for tasks"],
    source_name: Annotated[str, "Name or description of the text source"] = "manual input",
) -> dict:
    """
    Extract tasks from arbitrary text content.
    
    This tool analyzes any text (meeting notes, emails, documents)
    to identify actionable tasks.
    """
    from ..agent import OperiaAgent
    from ..models import TaskSource
    
    logger.info("Extracting tasks from text", source=source_name)
    
    try:
        async with OperiaAgent() as agent:
            result = await agent.extract_from_content(
                content=text,
                source_type=TaskSource.MANUAL,
                source_name=source_name,
            )
        
        return {
            "success": result.success,
            "source": "text",
            "source_name": source_name,
            "proposals_count": result.proposals_count,
            "proposal_batch_id": str(result.proposal_batch_id) if result.proposal_batch_id else None,
            "error": result.error,
        }
        
    except Exception as e:
        logger.error("Text extraction failed", error=str(e))
        return {
            "success": False,
            "error": str(e),
            "source": "text",
        }


# Tool definitions for agent registration
TOOL_DEFINITIONS = [
    {
        "name": "extract_from_notion",
        "description": "Extract tasks from a Notion page. Use when user mentions Notion pages or databases.",
        "function": extract_from_notion,
    },
    {
        "name": "extract_from_slack",
        "description": "Extract tasks from Slack channel messages. Use when user mentions Slack channels or messages.",
        "function": extract_from_slack,
    },
    {
        "name": "extract_from_github",
        "description": "Extract tasks from GitHub issues. Use when user mentions GitHub repositories or issues.",
        "function": extract_from_github,
    },
    {
        "name": "extract_from_text",
        "description": "Extract tasks from any text content like meeting notes, emails, or documents.",
        "function": extract_from_text,
    },
]
