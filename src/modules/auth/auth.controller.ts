import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    const { access_token, refresh_token } = await this.auth.login(user);

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const sameSite = isProd ? 'none' : 'lax';

    res.cookie('user_id', user.id, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Logged in successfully' };
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token || body.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Token de atualização não fornecido' });
    }

    const { access_token, refresh_token } = await this.auth.refreshAccessToken(refreshToken);

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const sameSite = isProd ? 'none' : 'lax';

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Token atualizado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @User() user,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    
    await this.auth.logout(user.userId, refreshToken);

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('user_id', { path: '/' });

    return { message: 'Logout realizado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(
    @User() user,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.userId);

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('user_id', { path: '/' });

    return { message: 'Logout realizado de todos os dispositivos' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@User() user) {
    return user;
  }
}
