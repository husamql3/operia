"""
Configuration management for Operia AI Agent.

Uses pydantic-settings for environment variable loading and validation.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load .env file from the ai_model directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)


class AzureOpenAISettings(BaseModel):
    """Azure OpenAI / Microsoft Foundry configuration."""

    endpoint: str = Field(..., description="Azure OpenAI endpoint URL")
    api_key: Optional[str] = Field(None, description="Azure OpenAI API key (optional if using managed identity)")
    deployment: str = Field(..., description="Model deployment name")
    api_version: str = Field("2024-05-01-preview", description="API version")


class DatabaseSettings(BaseModel):
    """Database configuration for future backend integration."""

    url: str = Field(
        "postgresql+asyncpg://localhost:5432/operia",
        description="Database connection URL"
    )
    pool_size: int = Field(5, description="Connection pool size")
    max_overflow: int = Field(10, description="Max overflow connections")


class IntegrationSettings(BaseModel):
    """Settings for external integrations (Notion, Slack, GitHub)."""

    # Notion
    notion_api_key: Optional[str] = Field(None, description="Notion API key")
    notion_database_id: Optional[str] = Field(None, description="Notion database ID for tasks")

    # Slack
    slack_bot_token: Optional[str] = Field(None, description="Slack bot OAuth token")
    slack_app_token: Optional[str] = Field(None, description="Slack app-level token")
    slack_signing_secret: Optional[str] = Field(None, description="Slack signing secret")

    # GitHub
    github_token: Optional[str] = Field(None, description="GitHub personal access token")
    github_org: Optional[str] = Field(None, description="GitHub organization name")


class AgentSettings(BaseModel):
    """Core agent configuration."""

    name: str = Field("Operia", description="Agent name")
    memory_window_days: int = Field(7, description="Number of days to retain in memory")
    max_proposals_per_batch: int = Field(20, description="Max proposals per extraction")
    temperature: float = Field(0.3, description="LLM temperature for deterministic output")
    max_tokens: int = Field(4000, description="Max tokens for LLM response")


class Settings(BaseSettings):
    """Main application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Environment
    environment: str = Field("development", alias="ENVIRONMENT")
    debug: bool = Field(False, alias="DEBUG")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    # Azure OpenAI - flat structure for reliable env loading
    azure_openai_endpoint: str = Field(..., alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_key: Optional[str] = Field(None, alias="AZURE_OPENAI_API_KEY")
    azure_openai_deployment: str = Field(..., alias="AZURE_OPENAI_DEPLOYMENT")
    azure_openai_api_version: str = Field("2024-05-01-preview", alias="AZURE_OPENAI_API_VERSION")

    # Agent settings
    agent_name: str = Field("Operia", alias="AGENT_NAME")
    agent_memory_window_days: int = Field(7, alias="AGENT_MEMORY_WINDOW_DAYS")
    agent_max_proposals_per_batch: int = Field(20, alias="AGENT_MAX_PROPOSALS_PER_BATCH")
    agent_temperature: float = Field(0.3, alias="AGENT_TEMPERATURE")
    agent_max_tokens: int = Field(4000, alias="AGENT_MAX_TOKENS")

    # Database
    database_url: str = Field("postgresql+asyncpg://localhost:5432/operia", alias="DATABASE_URL")

    # Integrations
    integration_notion_api_key: Optional[str] = Field(None, alias="INTEGRATION_NOTION_API_KEY")
    integration_notion_database_id: Optional[str] = Field(None, alias="INTEGRATION_NOTION_DATABASE_ID")
    integration_slack_bot_token: Optional[str] = Field(None, alias="INTEGRATION_SLACK_BOT_TOKEN")
    integration_slack_app_token: Optional[str] = Field(None, alias="INTEGRATION_SLACK_APP_TOKEN")
    integration_slack_signing_secret: Optional[str] = Field(None, alias="INTEGRATION_SLACK_SIGNING_SECRET")
    integration_github_token: Optional[str] = Field(None, alias="INTEGRATION_GITHUB_TOKEN")
    integration_github_org: Optional[str] = Field(None, alias="INTEGRATION_GITHUB_ORG")

    @property
    def azure_openai(self) -> AzureOpenAISettings:
        """Get Azure OpenAI settings as nested object."""
        return AzureOpenAISettings(
            endpoint=self.azure_openai_endpoint,
            api_key=self.azure_openai_api_key,
            deployment=self.azure_openai_deployment,
            api_version=self.azure_openai_api_version,
        )

    @property
    def agent(self) -> AgentSettings:
        """Get agent settings as nested object."""
        return AgentSettings(
            name=self.agent_name,
            memory_window_days=self.agent_memory_window_days,
            max_proposals_per_batch=self.agent_max_proposals_per_batch,
            temperature=self.agent_temperature,
            max_tokens=self.agent_max_tokens,
        )

    @property
    def database(self) -> DatabaseSettings:
        """Get database settings as nested object."""
        return DatabaseSettings(url=self.database_url)

    @property
    def integrations(self) -> IntegrationSettings:
        """Get integration settings as nested object."""
        return IntegrationSettings(
            notion_api_key=self.integration_notion_api_key,
            notion_database_id=self.integration_notion_database_id,
            slack_bot_token=self.integration_slack_bot_token,
            slack_app_token=self.integration_slack_app_token,
            slack_signing_secret=self.integration_slack_signing_secret,
            github_token=self.integration_github_token,
            github_org=self.integration_github_org,
        )

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
