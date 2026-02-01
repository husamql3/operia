# How to Run the Operia AI Agent

## Prerequisites

- Python 3.11+
- Azure OpenAI or Microsoft Foundry endpoint

## Setup the Environment

1. **Navigate to the ai_model directory:**
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

   > The `--pre` flag is required while Agent Framework is in preview.

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure OpenAI credentials (e.g., AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_KEY)
   ```

## Running the Agent

To run the main agent application:

```bash
python -m src.main
```

## Running the Test

To test the agent and ensure it's working correctly, run the test script:

```bash
python test_run.py
```

### Expected Output

The test should produce output similar to the following:

```
=== Operia AI Agent Demo ===
Endpoint: https://operia-ai.services.ai.azure.com
Deployment: operia-deepseek

Processing sample meeting transcript...

2026-02-01 14:12:13 [info     ] Initializing Operia agent      deployment=operia-deepseek endpoint=https://operia-ai.services.ai.azure.com
2026-02-01 14:12:13 [info     ] Operia agent initialized successfully (using direct API)
2026-02-01 14:12:26 [info     ] Extracted proposals            proposals_count=6 source_type=meeting_transcript
Success: True
Proposals extracted: 6
Batch ID: 7fe7bffb-6cb1-494b-884e-3b29a6d6c221
```

If the output matches, the agent is working correctly :)



