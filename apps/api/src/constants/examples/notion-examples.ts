import { MOCK_DATA } from '../global.constants';

export const NotionExamples = {
  initiateOAuth: {
    response: {
      success: {
        code: 200,
        authUrl:
          'https://api.notion.com/v1/oauth/authorize?client_id=xxx&redirect_uri=http://localhost:3000/api/integrations/notion/callback&response_type=code&owner=user&state=abc123def456',
        state: 'abc123def456',
      },
    },
  },

  callback: {
    response: {
      success: {
        code: 302,
        message: 'Redirecting to frontend with integration data',
        redirectUrl: 'http://localhost:5173?notion=eyJhY2Nlc3NUb2tlbiI6InNlY3JldF9jYzBhNDM2ZWEwZGY0N2Q5OWQyZmQ4MTlhYTc0YTI3YyIsIndvcmtzcGFjZUlkIjoiMzM4ZTEwNTAtZmUyNC00ZGIyLWI2ZWEtZmNkYzZkNTM3MjFlIiwid29ya3NwYWNlTmFtZSI6IkplZmYncyBXb3Jrc3BhY2UiLCJib3RJZCI6IjA1ZTczMGE4LTg1ZTItNDEwYS05YTVkLWMwYjU1YmRmNzU1NiJ9',
      },
      error: {
        code: 302,
        message: 'Redirecting to frontend with error',
        redirectUrl: 'http://localhost:5173?notion_error=Authorization%20failed',
      },
    },
  },

  saveIntegration: {
    request: {
      accessToken: 'secret_cc0a436ea0df47d99d2fd819aa74a27c',
      workspaceId: '338e1050-fe24-4db2-b6ea-fcdc6d537211',
      workspaceName: "Jeff's Workspace",
      botId: '05e730a8-85e2-410a-9a5d-c0b55bdf7556',
    },
    response: {
      success: {
        code: 201,
        success: true,
        workspace: "Jeff's Workspace",
        integration: {
          id: MOCK_DATA.id.user,
          type: 'notion',
          workspaceName: "Jeff's Workspace",
        },
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      badRequest: {
        code: 400,
        success: false,
        message: 'Invalid request data',
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },

  getStatus: {
    response: {
      connected: {
        code: 200,
        connected: true,
        workspace: "Jeff's Workspace",
        integration: {
          id: MOCK_DATA.id.user,
          type: 'notion',
          workspaceName: "Jeff's Workspace",
        },
      },
      notConnected: {
        code: 200,
        connected: false,
        workspace: null,
        integration: null,
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },

  disconnect: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Integration disconnected successfully',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },
};
