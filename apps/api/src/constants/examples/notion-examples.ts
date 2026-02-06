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

  getPages: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Pages retrieved successfully',
        data: {
          pages: {
            '123e4567-e89b-12d3-a456-426614174000': {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'My Page',
              url: 'https://notion.so/My-Page-123e4567e89b12d3a456426614174000',
            },
            '223e4567-e89b-12d3-a456-426614174001': {
              id: '223e4567-e89b-12d3-a456-426614174001',
              title: 'Another Page',
              url: 'https://notion.so/Another-Page-223e4567e89b12d3a456426614174001',
            },
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'No Notion integration found',
        data: {
          pages: {},
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

  sync: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Notion content synced and extracted successfully',
        data: {
          totalPages: 50,
          proposalsCount: 14,
          proposals: [
            {
              id: 'prop_123',
              type: 'task',
              title: 'Update marketing website',
              description: 'Redesign the landing page with new branding guidelines',
              evidence: 'Found in Marketing Tasks page - assigned to Sarah Chen',
              rationale: 'Improve conversion rates and brand consistency',
              whatWillHappen: 'Website will be redesigned and redeployed to production',
              owner: 'Sarah Chen',
              deadline: '2025-12-15T00:00:00.000Z',
              priority: 'high',
            },
            {
              id: 'prop_124',
              type: 'idea',
              title: 'Implement dark mode feature',
              description: 'Add dark mode toggle to improve user experience',
              evidence: 'Found in Product Roadmap - suggested by customers',
              rationale: 'Enhance accessibility and user satisfaction',
              whatWillHappen: 'CSS variables will be added for theme switching',
              owner: 'Alex Rodriguez',
              deadline: '2025-12-31T00:00:00.000Z',
              priority: 'medium',
            },
          ],
          proposalBatchId: 'batch_67890abcdef',
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'No Notion integration found',
        data: null,
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      extractionFailed: {
        code: 500,
        success: false,
        message: 'Failed to extract content from Notion pages',
        data: null,
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },
} as const;
