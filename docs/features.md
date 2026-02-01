# MVP Core Tasks / Features Checklist

## 1. Authentication

- User signup/login (Google OAuth).
- Landing / Connect screen: Buttons for
  - Connect to Notion (OAuth)
  - Connect to Slack (OAuth with workspace selection)
  - Connect to GitHub (OAuth with repo selection)
  - Connect to Gmail (Google OAuth — scope for emails)
- Store OAuth tokens securely (backend session/DB, encrypted).
- After connect → redirect to main app screen.

## 2. Main App Layout / UI Structure

- Three-section layout:
  - **Left sidebar**: Navigation + service toggles
    - List of connected services (Slack, Notion, GitHub, Gmail)
    - For each service:
      - Toggle (enable/disable sync for that source)
      - "Sync now" button → triggers fetch + AI processing
  - **Center**: Calendar view (monthly, dark theme like your screenshot)
    - Show dates in January/February 2026
    - Display tasks as event-like blocks or dots on relevant days (based on AI-extracted or user-set deadline)
    - Highlight "Today" (Jan 31)
    - Click on date or task → show details or open edit modal
  - **Right sidebar**: "Recommended tasks" / Pending tasks list
    - Grouped or filtered by source (Slack ▼, Notion ▼, GitHub +, Gmail)
    - Each task item shows:
      - Title/summary (from Gemini)
      - Source badge/icon
      - Deadline (if extracted)
      - Priority tag (high/medium/low — color-coded)
      - Two buttons:
        - **Confirm / Add to Calendar** → moves task to calendar + sets date
        - **Edit** → modal to update name, description, deadline, priority

## 3. Data Fetch & Sync Flow (Critical for MVP)

- On "Sync now" click per service (or global sync):
  - Call the service API (with stored OAuth token):
    - Notion: Query selected databases/pages for tasks/to-dos
    - Slack: Fetch recent messages from selected channels (search for task-like keywords or use mentions)
    - GitHub: List open issues/PRs from selected repos
    - Gmail: Fetch recent/unread emails with task potential (e.g., subject/body containing action items)
  - Send raw content (text, titles, bodies) in batch to Gemini 3 API.
- Gemini 3 prompt engineering (make this shine for judges):
  - Input: Raw text from one or multiple items
  - Output: Structured JSON with array of tasks:
    - title (short summary)
    - description
    - estimated_deadline (ISO date or null)
    - priority (high/medium/low)
    - difficulty (easy/medium/hard — optional)
    - category/topic
    - confidence score (0-1)
  - Use Gemini 3 reasoning to detect action items, infer deadlines/urgency from context.

## 4. Task Storage & Management

- Backend DB to store:
  - Processed tasks (with source, original link/reference, Gemini output)
  - User-confirmed calendar events (date, task ID)
- Avoid duplicates: Check existing tasks by content hash or title+source.
- When user clicks "Confirm / Add to Calendar":
  - Update task status to "confirmed"
  - Assign/set date → show on calendar
- Edit button → modal form → save changes (can optionally re-run Gemini on updated text).

## 5. Calendar Visualization

- Use a calendar library (e.g., FullCalendar, react-big-calendar) in dark mode.
- Render:
  - Dots or small pills on days with tasks
  - On hover/click: show list of tasks for that day
  - Visual distinction by source (color/icon) or priority
- "Today" view or highlight on Jan 31.

## 6. Gemini 3 Integration Highlights (Judging priority)

- Show in demo/video:
  - Raw input → Gemini call → structured output
  - Example: Slack message "Hey team, please review the PR by EOW" → Gemini extracts task "Review PR", deadline ~Feb 6, priority high
- Include in ~200-word submission description: How Gemini 3's reasoning enables smart task extraction/prioritization across messy sources.

### Nice-to-Have (Cut if time is tight)

- Automatic webhooks (too complex for 9 days — stick to manual sync)
- Real-time updates
- Drag-and-drop tasks onto calendar dates
- Full Kanban view (you mentioned earlier — can be phase 2)
- Meeting transcripts from Google Meet (harder scope)

Focus ruthlessly: Get connect → sync → Gemini extract → display + confirm flow working end-to-end. That alone can win points for technical execution and impact in a productivity tool.

```mirmaid
graph TD
    User[User] -->|1. OAuth Connect - Notion Slack GH Gmail| Frontend[Frontend App (Connect → Main)]
    Frontend -->|Store tokens| DB[(Backend DB)]

    subgraph "Sync & Processing"
        User -->|2. Toggle + Sync now| Frontend
        Frontend -->|3. API call| Services[External Services\nNotion Slack GitHub Gmail]
        Services -->|4. Raw data| Frontend
        Frontend -->|5. Send to Gemini| Gemini[Gemini 3 API\n(extract summarize prioritize)]
        Gemini -->|6. Structured tasks| Frontend
    end

    Frontend -->|7. Store tasks| DB
    DB -->|8. Query tasks| Frontend

    Frontend -->|9. Show pending + buttons| RightSidebar[Right Sidebar\nRecommended Tasks]
    User -->|10. Confirm task| RightSidebar
    RightSidebar --> Frontend
    Frontend -->|11. Show on calendar| Calendar[Center: Calendar View]

    User -.->|Interact| Calendar
    User -.->|Manual sync| Frontend

    style Gemini fill:#9b59b6,stroke:#fff,stroke-width:2px,color:#fff
    style DB fill:#34495e,stroke:#bdc3c7
    style Services fill:#27ae60,stroke:#fff
```
