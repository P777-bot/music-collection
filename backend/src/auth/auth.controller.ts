import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { AuthGuard, SESSION_COOKIE } from './auth.guard';
import { AuthCredentialsDto, AuthValidationPipe } from './auth.dto';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body(new AuthValidationPipe(true)) credentials: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(credentials);
    this.setSessionCookie(response, session.token);
    return { user: session.user };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(AuthValidationPipe) credentials: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(credentials);
    this.setSessionCookie(response, session.token);
    return { user: session.user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
    return { loggedOut: true };
  }

  private setSessionCookie(response: Response, token: string): void {
    response.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: 8 * 60 * 60 * 1000,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }
}
