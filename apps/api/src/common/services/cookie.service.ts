import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { env } from '@/env';

@Injectable()
export class CookieService {
  setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes // TODO: use env variable
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days // TODO: use env variable
      path: '/',
    });
  }

  clearTokenCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }
}
