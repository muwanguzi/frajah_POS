import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Post('2fa/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  async generateTwoFactor(@CurrentUser() user: User) {
    return this.authService.generateTwoFactorSecret(user.id);
  }

  @Public()
  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify a 2FA code' })
  async verifyTwoFactor(@Body() body: { userId: string; code: string }) {
    const valid = await this.authService.verifyTwoFactor(body.userId, body.code);
    return { valid };
  }

  @Post('2fa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA after verifying code' })
  async enableTwoFactor(
    @CurrentUser() user: User,
    @Body() body: { code: string },
  ) {
    await this.authService.enableTwoFactor(user.id, body.code);
    return { message: '2FA enabled successfully' };
  }

  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  async disableTwoFactor(@CurrentUser() user: User) {
    await this.authService.disableTwoFactor(user.id);
    return { message: '2FA disabled successfully' };
  }
}
