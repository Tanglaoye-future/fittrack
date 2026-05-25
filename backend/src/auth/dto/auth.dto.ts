import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户注册 DTO
 */
export class RegisterDto {
  @ApiProperty({
    description: '邮箱',
    example: 'user@fitflow.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: '密码（至少6位）',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: '性别',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @ApiProperty({
    description: '年龄',
    example: 28,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiProperty({
    description: '身高（cm）',
    example: 180,
    required: false,
  })
  @IsOptional()
  @IsInt()
  height?: number;

  @ApiProperty({
    description: '初始体重（kg）',
    example: 75,
    required: false,
  })
  @IsOptional()
  fitness_goal?: string;
}

/**
 * 用户登录 DTO
 */
export class LoginDto {
  @ApiProperty({
    description: '邮箱或用户名',
    example: 'user@fitflow.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsString()
  password: string;
}

/**
 * 登录响应 DTO
 */
export class LoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
  })
  access_token: string;

  @ApiProperty({
    description: '刷新令牌',
  })
  refresh_token: string;

  @ApiProperty({
    description: '用户信息',
  })
  user: {
    id: string;
    email: string;
    username: string;
  };
}

/**
 * 刷新 Token DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '刷新令牌',
  })
  @IsString()
  refresh_token: string;
}
