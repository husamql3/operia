# Operia AI Agent

**AI Operations Copilot** - Intelligent task extraction and management from multiple sources.

## Overview

Operia is an AI-powered agent that extracts actionable tasks from various work signals:

- **Notion** - Pages and databases
- **Slack** - Channel messages and threads
- **GitHub** - Issues and pull requests
- **Meeting Transcripts** - (Future feature)

The agent analyzes content and generates **proposals** that users can approve, reject, or edit before any action is taken. This human-in-the-loop approach ensures users maintain full control.

## Key Features

- 🤖 **AI-Powered Extraction** - Uses Azure OpenAI / Microsoft Foundry to intelligently identify tasks
- 🔒 **Proposal-First Approach** - Never auto-executes, always proposes first
- 📊 **Evidence-Based** - Every proposal includes quotes from the source
- 🔌 **Multi-Source Integration** - Connect Notion, Slack, GitHub, and more
- 📝 **Memory Context** - 7-day rolling window for contextual awareness
- 📈 **Daily Summaries** - Automated end-of-day wrap-ups

## Architecture

```
ai_model/
├── src/
│   ├── agent.py          # Core AI agent implementation
│   ├── config.py         # Configuration management
│   ├── storage.py        # Backend storage interface
│   ├── main.py           # Entry point
│   ├── models/           # Pydantic data models
│   │   └── __init__.py
│   ├── services/         # Integration services
│   │   ├── notion.py
│   │   ├── slack.py
│   │   └── github.py
│   └── tools/            # Agent tools
│       ├── __init__.py
│       └── extraction.py
├── tests/                # Test files
├── requirements.txt      # Python dependencies
├── pyproject.toml        # Project configuration
└── README.md
```

## Installation

### Prerequisites

- Python 3.11+
- Azure OpenAI or Microsoft Foundry endpoint
- (Optional) Notion, Slack, or GitHub API credentials

### Setup

1. **Clone and navigate to the directory:**
   ```bash
   cd ai_model
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   # Core dependencies
   pip install -r requirements.txt
   
   # IMPORTANT: Install Microsoft Agent Framework (in preview)
   pip install agent-framework-azure-ai --pre
   ```
   
   > ⚠️ The `--pre` flag is required while Agent Framework is in preview.

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure OpenAI credentials
   ```

5. **Run the demo:**
   ```bash
   python -m src.main
   ```

## Configuration

### Required Settings

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint URL |
| `AZURE_OPENAI_DEPLOYMENT` | Model deployment name (e.g., `gpt-4o`) |
| `AZURE_OPENAI_API_KEY` | API key (optional with managed identity) |

### Optional Integrations

Configure these to enable multi-source task extraction:

| Integration | Variables |
|-------------|-----------|
| **Notion** | `INTEGRATION_NOTION_API_KEY`, `INTEGRATION_NOTION_DATABASE_ID` |
| **Slack** | `INTEGRATION_SLACK_BOT_TOKEN`, `INTEGRATION_SLACK_APP_TOKEN` |
| **GitHub** | `INTEGRATION_GITHUB_TOKEN`, `INTEGRATION_GITHUB_ORG` |

## Usage

### Basic Usage

```python
import asyncio
from src.agent import OperiaAgent
from src.models import TaskSource

async def main():
    async with OperiaAgent() as agent:
        result = await agent.extract_from_content(
            content="Meeting notes: Alice will prepare the report by Friday...",
            source_type=TaskSource.MEETING_TRANSCRIPT,
            source_name="Team Standup",
            user_id="user-123",
        )
        
        print(f"Extracted {result.proposals_count} proposals")

asyncio.run(main())
```

### With Storage Backend

```python
from src.storage import InMemoryStorage  # or your custom implementation

storage = InMemoryStorage()
async with OperiaAgent(storage=storage) as agent:
    # Proposals will be automatically saved
    result = await agent.extract_from_content(...)
```

### Using Extraction Tools

```python
from src.tools import extract_from_notion, extract_from_github

# Extract from Notion
result = await extract_from_notion(page_id="abc123")

# Extract from GitHub
result = await extract_from_github(
    repo_name="owner/repo",
    issue_state="open",
    labels=["bug", "priority:high"]
)
```

## Connecting to Your Backend

The agent uses a `StorageInterface` that you can implement to connect to your database:

```python
from src.storage import StorageInterface

class PostgresStorage(StorageInterface):
    async def save_task(self, task):
        # Implement your database logic
        pass
    
    # Implement other methods...
```

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black src/
ruff check src/
mypy src/
```

## Roadmap

- [x] Core agent implementation
- [x] Notion integration (stub)
- [x] Slack integration (stub)
- [x] GitHub integration (stub)
- [ ] Meeting transcript processing
- [ ] PostgreSQL storage implementation
- [ ] REST API endpoints
- [ ] Real-time sync with integrations
- [ ] Webhook handlers

## License

MIT License - see LICENSE file for details.
