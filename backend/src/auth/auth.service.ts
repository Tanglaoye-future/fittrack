import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';
import { RegisterDto, LoginDto, LoginResponseDto } from './dto/auth.dto';

/**
 * 认证服务
 * 处理用户注册、登录、token 管理等
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    const { email, username, password, gender, age, height, fitness_goal } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('该邮箱已被注册');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new BadRequestException('该用户名已被使用');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        gender: gender as any,
        age,
        height: height ? new Decimal(height) : undefined,
        fitness_goal: fitness_goal as any,
      },
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
      },
    });

    this.logger.log(`新用户注册: ${email}`);

    // 生成 tokens
    const { access_token, refresh_token } = await this.generateTokens(user.id, user.email);

    return {
      message: '注册成功',
      access_token,
      refresh_token,
      user,
    };
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    this.logger.log(`用户登录: ${user.email}`);

    // 生成 tokens
    const { access_token, refresh_token } = await this.generateTokens(user.id, user.email);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  /**
   * 刷新 token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const { access_token, refresh_token } = await this.generateTokens(
        payload.sub,
        payload.email,
      );

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 生成 JWT tokens
   */
  private async generateTokens(userId: string, email: string) {
    const jwtExpire = this.configService.get('JWT_EXPIRE') || '7d';
    const jwtRefreshExpire = this.configService.get('JWT_REFRESH_EXPIRE') || '30d';

    const access_token = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: jwtExpire,
      },
    );

    const refresh_token = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: jwtRefreshExpire,
      },
    );

    return { access_token, refresh_token };
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        gender: true,
        age: true,
        height: true,
        fitness_goal: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }
}

// 由于 Prisma 的 Decimal 类型
import { Decimal } from '@prisma/client/runtime/library';
