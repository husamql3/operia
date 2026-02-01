"""
Notion Integration Service.

Provides functionality to extract tasks from Notion pages and databases.
"""

import structlog
from typing import Optional

from ..config import get_settings
from ..models import NotionPage, Task, TaskCreate, TaskPriority, TaskSource

logger = structlog.get_logger()


class NotionService:
    """
    Service for interacting with Notion API.
    
    This service extracts tasks from Notion pages and databases,
    and can sync tasks back to Notion.
    """

    def __init__(self):
        self.settings = get_settings()
        self._client = None

    async def initialize(self):
        """Initialize Notion client."""
        api_key = self.settings.integrations.notion_api_key
        if not api_key:
            logger.warning("Notion API key not configured")
            return False
        
        try:
            # Notion client import (requires: pip install notion-client)
            # from notion_client import AsyncClient
            # self._client = AsyncClient(auth=api_key)
            logger.info("Notion service initialized (stub mode)")
            return True
        except ImportError:
            logger.warning(
                "notion-client not installed",
                hint="Install with: pip install notion-client"
            )
            return False

    async def get_page(self, page_id: str) -> Optional[NotionPage]:
        """
        Retrieve a Notion page by ID.
        
        Args:
            page_id: The Notion page ID
            
        Returns:
            NotionPage object or None
        """
        if not self._client:
            logger.warning("Notion client not initialized")
            return None
        
        try:
            # TODO: Implement actual Notion API call
            # page = await self._client.pages.retrieve(page_id=page_id)
            # blocks = await self._client.blocks.children.list(block_id=page_id)
            
            # Stub implementation
            logger.info("Fetching Notion page", page_id=page_id)
            return None
            
        except Exception as e:
            logger.error("Failed to fetch Notion page", page_id=page_id, error=str(e))
            return None

    async def search_pages(
        self,
        query: str = "",
        database_id: Optional[str] = None,
        limit: int = 10,
    ) -> list[NotionPage]:
        """
        Search Notion pages.
        
        Args:
            query: Search query
            database_id: Optional database ID to search within
            limit: Maximum number of results
            
        Returns:
            List of NotionPage objects
        """
        if not self._client:
            logger.warning("Notion client not initialized")
            return []
        
        try:
            # TODO: Implement actual Notion search
            # results = await self._client.search(query=query)
            
            logger.info("Searching Notion pages", query=query, limit=limit)
            return []
            
        except Exception as e:
            logger.error("Failed to search Notion pages", error=str(e))
            return []

    async def extract_tasks_from_page(self, page: NotionPage) -> list[TaskCreate]:
        """
        Extract task data from a Notion page.
        
        This method parses Notion page content to identify tasks,
        which can then be sent to the AI agent for proposal generation.
        
        Args:
            page: The NotionPage to extract from
            
        Returns:
            List of TaskCreate objects
        """
        tasks: list[TaskCreate] = []
        
        # Parse page content for task indicators
        # Look for checkboxes, todo items, action items, etc.
        
        # Extract properties from Notion page
        properties = page.properties
        
        # Common Notion task properties
        title = page.title
        status = properties.get("Status", {}).get("select", {}).get("name")
        assignee = properties.get("Assignee", {}).get("people", [])
        due_date = properties.get("Due", {}).get("date", {}).get("start")
        priority_raw = properties.get("Priority", {}).get("select", {}).get("name", "medium")
        
        # Map priority
        priority_map = {"high": TaskPriority.HIGH, "medium": TaskPriority.MEDIUM, "low": TaskPriority.LOW}
        priority = priority_map.get(priority_raw.lower(), TaskPriority.MEDIUM)
        
        # Create task
        task = TaskCreate(
            title=title,
            description=page.content[:500] if page.content else None,
            owner=assignee[0]["name"] if assignee else None,
            deadline=due_date,
            priority=priority,
            source=TaskSource.NOTION,
            source_id=page.id,
            source_url=page.url,
        )
        tasks.append(task)
        
        logger.info("Extracted tasks from Notion page", page_id=page.id, task_count=len(tasks))
        return tasks

    async def sync_task_to_notion(self, task: Task) -> bool:
        """
        Sync a task back to Notion.
        
        Creates or updates a Notion page based on the task.
        
        Args:
            task: The task to sync
            
        Returns:
            True if successful
        """
        if not self._client:
            logger.warning("Notion client not initialized")
            return False
        
        database_id = self.settings.integrations.notion_database_id
        if not database_id:
            logger.warning("Notion database ID not configured")
            return False
        
        try:
            # TODO: Implement actual Notion page creation/update
            # properties = {
            #     "Name": {"title": [{"text": {"content": task.title}}]},
            #     "Status": {"select": {"name": task.status.value}},
            #     "Priority": {"select": {"name": task.priority.value}},
            # }
            # await self._client.pages.create(parent={"database_id": database_id}, properties=properties)
            
            logger.info("Task synced to Notion", task_id=str(task.id))
            return True
            
        except Exception as e:
            logger.error("Failed to sync task to Notion", error=str(e))
            return False


# Singleton instance
_notion_service: Optional[NotionService] = None


async def get_notion_service() -> NotionService:
    """Get the Notion service singleton."""
    global _notion_service
    if _notion_service is None:
        _notion_service = NotionService()
        await _notion_service.initialize()
    return _notion_service
