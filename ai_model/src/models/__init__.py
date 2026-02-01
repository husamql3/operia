"""
Pydantic models for Operia AI Agent.

These models define the core data structures used throughout the agent.
"""

from datetime import datetime
from enum import Enum
from typing import Annotated, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# ============================================================================
# Enums
# ============================================================================


class TaskPriority(str, Enum):
    """Task priority levels."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskStatus(str, Enum):
    """Task status values."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProposalType(str, Enum):
    """Types of action proposals the agent can generate."""

    CREATE_TASK = "create_task"
    DRAFT_FOLLOWUP = "draft_followup"
    REMINDER = "reminder"
    SUMMARY = "summary"
    RISK_ALERT = "risk_alert"


class ProposalStatus(str, Enum):
    """Status of action proposals."""

    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    EDITED = "edited"


class TaskSource(str, Enum):
    """Source of task extraction."""

    NOTION = "notion"
    SLACK = "slack"
    GITHUB = "github"
    MEETING_TRANSCRIPT = "meeting_transcript"
    MANUAL = "manual"


# ============================================================================
# Base Models
# ============================================================================


class TimestampMixin(BaseModel):
    """Mixin for models with timestamps."""

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# ============================================================================
# Task Models
# ============================================================================


class Task(TimestampMixin):
    """Represents an actionable task."""

    id: UUID = Field(default_factory=uuid4)
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    source: TaskSource = TaskSource.MANUAL
    source_id: Optional[str] = Field(None, description="ID in the source system")
    source_url: Optional[str] = Field(None, description="URL to the source item")
    tags: list[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    source: TaskSource = TaskSource.MANUAL
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    """Schema for updating a task."""

    title: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    tags: Optional[list[str]] = None


# ============================================================================
# Proposal Models
# ============================================================================


class Proposal(BaseModel):
    """Represents a single action proposal from the agent."""

    id: str = Field(default_factory=lambda: str(uuid4())[:8])
    type: ProposalType
    title: str
    description: str
    evidence: list[str] = Field(
        default_factory=list,
        description="Direct quotes from the source supporting this proposal"
    )
    rationale: str = Field(..., description="Why this action is being proposed")
    what_will_happen: str = Field(
        ..., 
        description="Explicit description of what happens if approved"
    )
    owner: Optional[str] = None
    deadline: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM


class ProposalBatch(TimestampMixin):
    """A batch of proposals generated from a single source."""

    id: UUID = Field(default_factory=uuid4)
    user_id: str
    source_type: TaskSource
    source_id: Optional[str] = None
    proposals: list[Proposal] = Field(default_factory=list)
    status: ProposalStatus = ProposalStatus.PROPOSED
    enabled_skills: dict[str, bool] = Field(default_factory=dict)
    model_info: str = ""
    prompt_version: str = "1.0.0"


class ApprovedAction(TimestampMixin):
    """An action that has been approved by the user."""

    id: UUID = Field(default_factory=uuid4)
    user_id: str
    proposal_batch_id: UUID
    proposal_id: str
    decision: ProposalStatus
    final_action: Task
    decision_notes: Optional[str] = None


# ============================================================================
# Memory Models
# ============================================================================


class MemoryItemType(str, Enum):
    """Types of items stored in short-term memory."""

    TASK = "task"
    DECISION = "decision"
    CONTEXT = "context"
    REMINDER = "reminder"


class MemoryItem(TimestampMixin):
    """A memory item for contextual awareness (7-day rolling window)."""

    id: UUID = Field(default_factory=uuid4)
    user_id: str
    type: MemoryItemType
    payload: dict
    active_day: str = Field(..., description="YYYY-MM-DD format")
    expires_at: datetime


# ============================================================================
# Integration Source Models
# ============================================================================


class NotionPage(BaseModel):
    """Represents a Notion page for task extraction."""

    id: str
    title: str
    url: str
    content: str
    properties: dict = Field(default_factory=dict)
    last_edited_time: Optional[datetime] = None


class SlackMessage(BaseModel):
    """Represents a Slack message for task extraction."""

    id: str
    channel_id: str
    channel_name: Optional[str] = None
    user_id: str
    user_name: Optional[str] = None
    text: str
    timestamp: datetime
    thread_ts: Optional[str] = None
    reactions: list[dict] = Field(default_factory=list)


class GitHubIssue(BaseModel):
    """Represents a GitHub issue for task extraction."""

    id: int
    number: int
    title: str
    body: Optional[str] = None
    url: str
    state: str
    labels: list[str] = Field(default_factory=list)
    assignees: list[str] = Field(default_factory=list)
    milestone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class MeetingTranscript(BaseModel):
    """Represents a meeting transcript (future feature)."""

    id: UUID = Field(default_factory=uuid4)
    title: Optional[str] = None
    raw_text: str
    source: str = "upload"
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Daily Summary Models
# ============================================================================


class DailySummary(TimestampMixin):
    """Daily summary generated by the agent."""

    id: UUID = Field(default_factory=uuid4)
    user_id: str
    date: str = Field(..., description="YYYY-MM-DD format")
    summary_text: str
    highlights: list[str] = Field(default_factory=list)
    pending_items: list[str] = Field(default_factory=list)
    upcoming_deadlines: list[str] = Field(default_factory=list)
    tomorrow_focus: list[str] = Field(default_factory=list)


# ============================================================================
# API Response Models
# ============================================================================


class ExtractionResult(BaseModel):
    """Result of a task extraction operation."""

    success: bool
    source: TaskSource
    proposal_batch_id: Optional[UUID] = None
    proposals_count: int = 0
    error: Optional[str] = None


class AgentResponse(BaseModel):
    """Standard response from the agent."""

    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None
