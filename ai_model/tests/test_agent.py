"""
Tests for the Operia Agent.
"""

import pytest
from unittest.mock import AsyncMock, patch

from src.agent import OperiaAgent, build_skills_list, DEFAULT_SKILLS
from src.models import TaskSource, ExtractionResult


class TestBuildSkillsList:
    """Tests for the build_skills_list function."""

    def test_all_skills_enabled(self):
        """Test with all skills enabled."""
        result = build_skills_list(DEFAULT_SKILLS)
        assert "Extract all actionable tasks" in result
        assert "Create a brief summary" in result
        assert "Draft follow-up messages" in result
        assert "Suggest reminders" in result
        assert "Identify any blockers" in result

    def test_only_extract_tasks(self):
        """Test with only extract_tasks enabled."""
        skills = {
            "extract_tasks": True,
            "summarize": False,
            "draft_followups": False,
            "suggest_reminders": False,
            "detect_risks": False,
        }
        result = build_skills_list(skills)
        assert "Extract all actionable tasks" in result
        assert "Create a brief summary" not in result

    def test_no_skills_enabled(self):
        """Test with no skills enabled."""
        skills = {k: False for k in DEFAULT_SKILLS}
        result = build_skills_list(skills)
        assert result == ""


class TestOperiaAgent:
    """Tests for the OperiaAgent class."""

    @pytest.fixture
    def mock_settings(self):
        """Create mock settings."""
        with patch("src.agent.get_settings") as mock:
            settings = AsyncMock()
            settings.azure_openai.endpoint = "https://test.openai.azure.com"
            settings.azure_openai.deployment = "gpt-4o"
            settings.azure_openai.api_key = "test-key"
            settings.azure_openai.api_version = "2024-05-01-preview"
            settings.agent.name = "Test Agent"
            settings.agent.temperature = 0.3
            settings.agent.max_tokens = 4000
            mock.return_value = settings
            yield settings

    @pytest.mark.asyncio
    async def test_extract_from_content_success(self, mock_settings):
        """Test successful content extraction."""
        sample_response = """
        {
            "proposals": [
                {
                    "id": "1",
                    "type": "create_task",
                    "title": "Test Task",
                    "description": "A test task",
                    "evidence": ["Test quote"],
                    "rationale": "Test rationale",
                    "what_will_happen": "Saved to task list",
                    "priority": "medium"
                }
            ]
        }
        """
        
        with patch.object(OperiaAgent, "_call_llm_direct", return_value=sample_response):
            agent = OperiaAgent()
            agent._agent = None  # Force fallback to direct LLM call
            
            result = await agent.extract_from_content(
                content="Test meeting notes",
                source_type=TaskSource.MEETING_TRANSCRIPT,
                source_name="Test Meeting",
            )
            
            assert result.success
            assert result.proposals_count == 1
            assert result.source == TaskSource.MEETING_TRANSCRIPT

    @pytest.mark.asyncio
    async def test_extract_from_content_invalid_json(self, mock_settings):
        """Test extraction with invalid JSON response."""
        with patch.object(OperiaAgent, "_call_llm_direct", return_value="not valid json"):
            agent = OperiaAgent()
            agent._agent = None
            
            result = await agent.extract_from_content(
                content="Test content",
                source_type=TaskSource.MANUAL,
            )
            
            assert not result.success
            assert "parse" in result.error.lower()


class TestModels:
    """Tests for Pydantic models."""

    def test_task_creation(self):
        """Test Task model creation."""
        from src.models import Task, TaskPriority, TaskStatus, TaskSource
        
        task = Task(
            title="Test Task",
            description="Test description",
            priority=TaskPriority.HIGH,
        )
        
        assert task.title == "Test Task"
        assert task.priority == TaskPriority.HIGH
        assert task.status == TaskStatus.PENDING
        assert task.source == TaskSource.MANUAL

    def test_proposal_batch_creation(self):
        """Test ProposalBatch model creation."""
        from src.models import ProposalBatch, Proposal, ProposalType, TaskSource
        
        proposal = Proposal(
            type=ProposalType.CREATE_TASK,
            title="Test Proposal",
            description="Test description",
            rationale="Test rationale",
            what_will_happen="Saved to task list",
        )
        
        batch = ProposalBatch(
            user_id="test-user",
            source_type=TaskSource.SLACK,
            proposals=[proposal],
        )
        
        assert len(batch.proposals) == 1
        assert batch.user_id == "test-user"
