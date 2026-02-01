"""
GitHub Integration Service.

Provides functionality to extract tasks from GitHub issues and pull requests.
"""

import structlog
from typing import Optional

from ..config import get_settings
from ..models import GitHubIssue, TaskCreate, TaskPriority, TaskSource

logger = structlog.get_logger()


class GitHubService:
    """
    Service for interacting with GitHub API.
    
    This service extracts tasks from GitHub issues, PRs, and project boards.
    """

    def __init__(self):
        self.settings = get_settings()
        self._client = None

    async def initialize(self):
        """Initialize GitHub client."""
        token = self.settings.integrations.github_token
        if not token:
            logger.warning("GitHub token not configured")
            return False
        
        try:
            # GitHub client import (requires: pip install PyGithub)
            # from github import Github
            # self._client = Github(token)
            logger.info("GitHub service initialized (stub mode)")
            return True
        except ImportError:
            logger.warning(
                "PyGithub not installed",
                hint="Install with: pip install PyGithub"
            )
            return False

    async def get_repo_issues(
        self,
        repo_name: str,
        state: str = "open",
        labels: Optional[list[str]] = None,
        limit: int = 50,
    ) -> list[GitHubIssue]:
        """
        Get issues from a repository.
        
        Args:
            repo_name: Repository name (owner/repo format)
            state: Issue state (open, closed, all)
            labels: Filter by labels
            limit: Maximum number of issues
            
        Returns:
            List of GitHubIssue objects
        """
        if not self._client:
            logger.warning("GitHub client not initialized")
            return []
        
        try:
            # TODO: Implement actual GitHub API call
            # repo = self._client.get_repo(repo_name)
            # issues = repo.get_issues(state=state, labels=labels)
            
            logger.info("Fetching GitHub issues", repo=repo_name, state=state, limit=limit)
            return []
            
        except Exception as e:
            logger.error("Failed to fetch GitHub issues", repo=repo_name, error=str(e))
            return []

    async def get_issue(self, repo_name: str, issue_number: int) -> Optional[GitHubIssue]:
        """
        Get a specific issue.
        
        Args:
            repo_name: Repository name
            issue_number: Issue number
            
        Returns:
            GitHubIssue or None
        """
        if not self._client:
            return None
        
        try:
            # TODO: Implement actual GitHub API call
            # repo = self._client.get_repo(repo_name)
            # issue = repo.get_issue(number=issue_number)
            
            logger.info("Fetching GitHub issue", repo=repo_name, issue=issue_number)
            return None
            
        except Exception as e:
            logger.error("Failed to fetch GitHub issue", error=str(e))
            return None

    async def get_assigned_issues(self, username: Optional[str] = None) -> list[GitHubIssue]:
        """
        Get issues assigned to a user.
        
        Args:
            username: GitHub username (defaults to authenticated user)
            
        Returns:
            List of GitHubIssue objects
        """
        if not self._client:
            return []
        
        try:
            # TODO: Implement actual GitHub API call
            # user = self._client.get_user(username) if username else self._client.get_user()
            # issues = user.get_issues()
            
            logger.info("Fetching assigned issues", username=username)
            return []
            
        except Exception as e:
            logger.error("Failed to fetch assigned issues", error=str(e))
            return []

    async def search_issues(
        self,
        query: str,
        repo: Optional[str] = None,
        limit: int = 50,
    ) -> list[GitHubIssue]:
        """
        Search GitHub issues.
        
        Args:
            query: Search query
            repo: Optional repository to search in
            limit: Maximum number of results
            
        Returns:
            List of GitHubIssue objects
        """
        if not self._client:
            return []
        
        try:
            # TODO: Implement actual GitHub search
            # full_query = f"{query} repo:{repo}" if repo else query
            # issues = self._client.search_issues(query=full_query)
            
            logger.info("Searching GitHub issues", query=query, repo=repo, limit=limit)
            return []
            
        except Exception as e:
            logger.error("Failed to search GitHub issues", error=str(e))
            return []

    def extract_tasks_from_issues(self, issues: list[GitHubIssue]) -> list[TaskCreate]:
        """
        Convert GitHub issues to task data.
        
        Args:
            issues: List of GitHub issues
            
        Returns:
            List of TaskCreate objects
        """
        tasks: list[TaskCreate] = []
        
        for issue in issues:
            # Map GitHub labels to priority
            priority = TaskPriority.MEDIUM
            labels_lower = [l.lower() for l in issue.labels]
            
            if "priority: high" in labels_lower or "critical" in labels_lower:
                priority = TaskPriority.HIGH
            elif "priority: low" in labels_lower or "nice to have" in labels_lower:
                priority = TaskPriority.LOW
            
            # Determine owner from assignees
            owner = issue.assignees[0] if issue.assignees else None
            
            task = TaskCreate(
                title=issue.title,
                description=issue.body,
                owner=owner,
                priority=priority,
                source=TaskSource.GITHUB,
                source_id=str(issue.number),
                source_url=issue.url,
                tags=issue.labels,
            )
            tasks.append(task)
        
        logger.info("Extracted tasks from GitHub issues", task_count=len(tasks))
        return tasks

    async def create_issue(
        self,
        repo_name: str,
        title: str,
        body: Optional[str] = None,
        labels: Optional[list[str]] = None,
        assignees: Optional[list[str]] = None,
    ) -> Optional[GitHubIssue]:
        """
        Create a new GitHub issue.
        
        Args:
            repo_name: Repository name
            title: Issue title
            body: Issue body/description
            labels: List of labels
            assignees: List of assignees
            
        Returns:
            Created GitHubIssue or None
        """
        if not self._client:
            logger.warning("GitHub client not initialized")
            return None
        
        try:
            # TODO: Implement actual issue creation
            # repo = self._client.get_repo(repo_name)
            # issue = repo.create_issue(title=title, body=body, labels=labels, assignees=assignees)
            
            logger.info("Creating GitHub issue", repo=repo_name, title=title)
            return None
            
        except Exception as e:
            logger.error("Failed to create GitHub issue", error=str(e))
            return None


# Singleton instance
_github_service: Optional[GitHubService] = None


async def get_github_service() -> GitHubService:
    """Get the GitHub service singleton."""
    global _github_service
    if _github_service is None:
        _github_service = GitHubService()
        await _github_service.initialize()
    return _github_service
