import { Controller, Post, Get, Body, UseGuards, Logger, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { SignupDto, LoginDto } from '../dto';
import { env } from '@/env';
import { Public, CurrentUser, RefreshTokenGuard, JwtAuthGuard, GoogleAuthGuard } from '@/common';
import { GoogleUser } from '../services/google-auth.service';
import {
  AuthSignupDecorator,
  AuthLoginDecorator,
  AuthRefreshTokenDecorator,
  AuthLogoutDecorator,
  AuthGoogleDecorator,
  AuthGoogleCallbackDecorator,
} from '../decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Public()
  @Post('signup')
  @AuthSignupDecorator()
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    this.logger.debug(`Signup attempt: ${signupDto.email}`);
    const result = await this.authService.signup(signupDto, res);
    this.logger.log(`User registered: ${result.data.user.id}`);
    return res.status(result.code).json(result);
  }

  @Public()
  @Post('login')
  @AuthLoginDecorator()
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    this.logger.debug(`Login attempt: ${loginDto.email}`);
    const result = await this.authService.login(loginDto, res);
    this.logger.log(`User logged in: ${result.data.user.id}`);
    return res.status(result.code).json(result);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @AuthRefreshTokenDecorator()
  async refreshTokens(@CurrentUser('sub') userId: string, @Res() res: Response) {
    this.logger.debug(`Token refresh: ${userId}`);
    const result = await this.authService.refreshTokens(userId, res);
    return res.status(result.code).json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @AuthLogoutDecorator()
  logout(@Res() res: Response) {
    this.logger.debug('User logout');
    const result = this.authService.logout(res);
    return res.status(result.code).json(result);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @AuthGoogleCallbackDecorator()
  async googleAuthCallback(@Req() req: Request & { user: GoogleUser }, @Res() res: Response) {
    this.logger.debug(`Google OAuth callback for: ${req.user.email}`);
    const result = await this.googleAuthService.handleGoogleAuth(req.user, res);
    this.logger.log(`User authenticated via Google: ${result.data.user.id}`);

    const userParam = encodeURIComponent(JSON.stringify(result.data.user));
    return res.redirect(`${env.CLIENT_URL}?google_auth=success&user=${userParam}`);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @AuthGoogleDecorator()
  googleAuth() {}
}
