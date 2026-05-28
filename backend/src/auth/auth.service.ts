import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException('邮箱或用户名已被注册');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        phone: dto.phone,
        password_hash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        is_athlete: true,
        is_coach: true,
        subscription_tier: true,
        created_at: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const identifier = dto.email.trim();
    const isEmail = identifier.includes('@');
    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { username: identifier },
    });
    if (!user) throw new UnauthorizedException('邮箱或密码错误');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('邮箱或密码错误');

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
        is_athlete: user.is_athlete,
        is_coach: user.is_coach,
        subscription_tier: user.subscription_tier,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('用户不存在');
      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('refresh_token 无效或已过期');
    }
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        gender: true,
        birth_date: true,
        height_cm: true,
        is_athlete: true,
        is_coach: true,
        subscription_tier: true,
        timezone: true,
        unit_system: true,
        language: true,
      },
    });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRE', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRE', '30d'),
      }),
    ]);
    return { access_token, refresh_token };
  }
}
