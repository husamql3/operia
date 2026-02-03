import { MOCK_DATA } from '../global.constants';

export const NotionExamples = {
  initiateOAuth: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Notion OAuth authorization URL generated',
        data: {
          authUrl:
            'https://api.notion.com/v1/oauth/authorize?client_id=xxx&redirect_uri=http://localhost:3000/api/integrations/notion/callback&response_type=code&owner=user&state=abc123def456',
          state: 'abc123def456',
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },

  callback: {
    response: {
      success: {
        code: 302,
        message: 'Redirecting to frontend with integration data',
        redirectUrl: 'http://localhost:5173?notion_success=true',
      },
      error: {
        code: 302,
        message: 'Redirecting to frontend with error',
        redirectUrl: 'http://localhost:5173?notion_error=Authorization%20failed',
      },
    },
  },

  getStatus: {
    response: {
      connected: {
        code: 200,
        success: true,
        message: 'Integration status retrieved',
        data: {
          connected: true,
          workspace: "Jeff's Workspace",
          integration: {
            id: MOCK_DATA.id.user,
            type: 'notion',
            workspaceName: "Jeff's Workspace",
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      notConnected: {
        code: 200,
        success: true,
        message: 'Integration status retrieved',
        data: {
          connected: false,
          workspace: null,
          integration: null,
        },
        timestamp: '2025-11-28T10:00:00.000Z',
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
        data: {
          success: true,
        },
        timestamp: '2025-11-28T10:00:00.000Z',
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
