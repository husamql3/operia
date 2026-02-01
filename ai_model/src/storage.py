"""
Storage Interface for Operia AI Agent.

Provides an abstract interface for backend storage that can be implemented
with any database (PostgreSQL, MongoDB, etc.)
"""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from .models import (
    ApprovedAction,
    DailySummary,
    MemoryItem,
    ProposalBatch,
    Task,
)


class StorageInterface(ABC):
    """
    Abstract storage interface for the Operia agent.
    
    Implement this interface to connect the agent to your backend database.
    """

    # ========================================================================
    # Task Operations
    # ========================================================================

    @abstractmethod
    async def save_task(self, task: Task) -> Task:
        """Save a new task."""
        pass

    @abstractmethod
    async def get_task(self, task_id: UUID) -> Optional[Task]:
        """Get a task by ID."""
        pass

    @abstractmethod
    async def update_task(self, task_id: UUID, updates: dict) -> Optional[Task]:
        """Update a task."""
        pass

    @abstractmethod
    async def delete_task(self, task_id: UUID) -> bool:
        """Delete a task."""
        pass

    @abstractmethod
    async def list_tasks(
        self,
        user_id: str,
        status: Optional[str] = None,
        source: Optional[str] = None,
        limit: int = 100,
    ) -> list[Task]:
        """List tasks for a user."""
        pass

    # ========================================================================
    # Proposal Operations
    # ========================================================================

    @abstractmethod
    async def save_proposal_batch(self, batch: ProposalBatch) -> ProposalBatch:
        """Save a batch of proposals."""
        pass

    @abstractmethod
    async def get_proposal_batch(self, batch_id: UUID) -> Optional[ProposalBatch]:
        """Get a proposal batch by ID."""
        pass

    @abstractmethod
    async def list_proposal_batches(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> list[ProposalBatch]:
        """List proposal batches for a user."""
        pass

    @abstractmethod
    async def update_proposal_status(
        self,
        batch_id: UUID,
        proposal_id: str,
        status: str,
    ) -> bool:
        """Update the status of a specific proposal."""
        pass

    # ========================================================================
    # Approved Action Operations
    # ========================================================================

    @abstractmethod
    async def save_approved_action(self, action: ApprovedAction) -> ApprovedAction:
        """Save an approved action."""
        pass

    @abstractmethod
    async def list_approved_actions(
        self,
        user_id: str,
        limit: int = 100,
    ) -> list[ApprovedAction]:
        """List approved actions for a user."""
        pass

    # ========================================================================
    # Memory Operations
    # ========================================================================

    @abstractmethod
    async def save_memory_item(self, item: MemoryItem) -> MemoryItem:
        """Save a memory item."""
        pass

    @abstractmethod
    async def get_memory_items(
        self,
        user_id: str,
        active_day: Optional[str] = None,
        item_type: Optional[str] = None,
    ) -> list[MemoryItem]:
        """Get memory items for a user."""
        pass

    @abstractmethod
    async def cleanup_expired_memory(self) -> int:
        """Remove expired memory items. Returns count of removed items."""
        pass

    # ========================================================================
    # Daily Summary Operations
    # ========================================================================

    @abstractmethod
    async def save_daily_summary(self, summary: DailySummary) -> DailySummary:
        """Save a daily summary."""
        pass

    @abstractmethod
    async def get_daily_summary(
        self,
        user_id: str,
        date: str,
    ) -> Optional[DailySummary]:
        """Get a daily summary for a specific date."""
        pass


class InMemoryStorage(StorageInterface):
    """
    In-memory storage implementation for testing and development.
    
    This is NOT suitable for production use.
    """

    def __init__(self):
        self._tasks: dict[UUID, Task] = {}
        self._proposal_batches: dict[UUID, ProposalBatch] = {}
        self._approved_actions: dict[UUID, ApprovedAction] = {}
        self._memory_items: dict[UUID, MemoryItem] = {}
        self._daily_summaries: dict[str, DailySummary] = {}

    async def save_task(self, task: Task) -> Task:
        self._tasks[task.id] = task
        return task

    async def get_task(self, task_id: UUID) -> Optional[Task]:
        return self._tasks.get(task_id)

    async def update_task(self, task_id: UUID, updates: dict) -> Optional[Task]:
        if task_id not in self._tasks:
            return None
        task = self._tasks[task_id]
        for key, value in updates.items():
            if hasattr(task, key):
                setattr(task, key, value)
        return task

    async def delete_task(self, task_id: UUID) -> bool:
        if task_id in self._tasks:
            del self._tasks[task_id]
            return True
        return False

    async def list_tasks(
        self,
        user_id: str,
        status: Optional[str] = None,
        source: Optional[str] = None,
        limit: int = 100,
    ) -> list[Task]:
        tasks = list(self._tasks.values())
        if status:
            tasks = [t for t in tasks if t.status.value == status]
        if source:
            tasks = [t for t in tasks if t.source.value == source]
        return tasks[:limit]

    async def save_proposal_batch(self, batch: ProposalBatch) -> ProposalBatch:
        self._proposal_batches[batch.id] = batch
        return batch

    async def get_proposal_batch(self, batch_id: UUID) -> Optional[ProposalBatch]:
        return self._proposal_batches.get(batch_id)

    async def list_proposal_batches(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> list[ProposalBatch]:
        batches = [b for b in self._proposal_batches.values() if b.user_id == user_id]
        if status:
            batches = [b for b in batches if b.status.value == status]
        return batches[:limit]

    async def update_proposal_status(
        self,
        batch_id: UUID,
        proposal_id: str,
        status: str,
    ) -> bool:
        batch = self._proposal_batches.get(batch_id)
        if not batch:
            return False
        # Update individual proposal status would be handled here
        return True

    async def save_approved_action(self, action: ApprovedAction) -> ApprovedAction:
        self._approved_actions[action.id] = action
        return action

    async def list_approved_actions(
        self,
        user_id: str,
        limit: int = 100,
    ) -> list[ApprovedAction]:
        actions = [a for a in self._approved_actions.values() if a.user_id == user_id]
        return actions[:limit]

    async def save_memory_item(self, item: MemoryItem) -> MemoryItem:
        self._memory_items[item.id] = item
        return item

    async def get_memory_items(
        self,
        user_id: str,
        active_day: Optional[str] = None,
        item_type: Optional[str] = None,
    ) -> list[MemoryItem]:
        items = [i for i in self._memory_items.values() if i.user_id == user_id]
        if active_day:
            items = [i for i in items if i.active_day == active_day]
        if item_type:
            items = [i for i in items if i.type.value == item_type]
        return items

    async def cleanup_expired_memory(self) -> int:
        from datetime import datetime
        now = datetime.utcnow()
        expired = [k for k, v in self._memory_items.items() if v.expires_at < now]
        for k in expired:
            del self._memory_items[k]
        return len(expired)

    async def save_daily_summary(self, summary: DailySummary) -> DailySummary:
        key = f"{summary.user_id}:{summary.date}"
        self._daily_summaries[key] = summary
        return summary

    async def get_daily_summary(
        self,
        user_id: str,
        date: str,
    ) -> Optional[DailySummary]:
        key = f"{user_id}:{date}"
        return self._daily_summaries.get(key)
