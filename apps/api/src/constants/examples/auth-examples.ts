import { MOCK_DATA } from '../global.constants';

export const AuthExamples = {
  signup: {
    request: {
      email: MOCK_DATA.email.user,
      password: 'SecurePass123',
      name: MOCK_DATA.name.user,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            name: MOCK_DATA.name.user,
            createdAt: '2025-11-28T10:00:00.000Z',
            updatedAt: '2025-11-28T10:00:00.000Z',
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      conflict: {
        code: 409,
        success: false,
        message: 'User with this email already exists',
        error: 'ConflictException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
          'password must match /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/ regular expression',
          'name must be longer than or equal to 2 characters',
        ],
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },

  login: {
    request: {
      email: MOCK_DATA.email.user,
      password: 'SecurePass123',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'User logged in successfully',
        data: {
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            name: MOCK_DATA.name.user,
            createdAt: '2025-11-28T10:00:00.000Z',
            updatedAt: '2025-11-28T10:00:00.000Z',
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid credentials',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },

  refreshToken: {
    request: {
      description: 'Refresh token is sent via HTTP-only cookie, no body required',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            name: MOCK_DATA.name.user,
            createdAt: '2025-11-28T10:00:00.000Z',
            updatedAt: '2025-11-28T10:00:00.000Z',
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid token',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['refreshToken must be a string', 'refreshToken should not be empty'],
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },

  logout: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Logout successful',
        data: {
          message: 'Logout successful',
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
      forbidden: {
        code: 403,
        success: false,
        message: 'Forbidden',
        error: 'ForbiddenException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },

  googleAuth: {
    request: {
      description: 'Redirects to Google OAuth consent screen',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'User authenticated successfully',
        data: {
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            name: MOCK_DATA.name.user,
            createdAt: '2025-11-28T10:00:00.000Z',
            updatedAt: '2025-11-28T10:00:00.000Z',
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      error: {
        code: 400,
        success: false,
        message: 'Invalid authorization code',
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },
} as const;
