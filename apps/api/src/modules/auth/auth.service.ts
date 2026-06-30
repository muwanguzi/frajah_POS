import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as qrcode from 'qrcode';
import { authenticator } from 'otplib';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      select: [
        'id',
        'email',
        'passwordHash',
        'role',
        'firstName',
        'lastName',
        'isActive',
        'twoFactorEnabled',
        'branchId',
      ],
    });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'FranahPOS', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    await this.userRepository.update(userId, { twoFactorSecret: secret });
    return { secret, qrCode: qrCodeDataUrl };
  }

  async verifyTwoFactor(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'twoFactorSecret'],
    });
    if (!user?.twoFactorSecret) return false;
    return authenticator.verify({ token: code, secret: user.twoFactorSecret });
  }

  async enableTwoFactor(userId: string, code: string): Promise<void> {
    const valid = await this.verifyTwoFactor(userId, code);
    if (!valid) throw new BadRequestException('Invalid 2FA code');
    await this.userRepository.update(userId, { twoFactorEnabled: true });
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['branch'],
    });
  }
}
