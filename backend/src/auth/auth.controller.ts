import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

// POST /auth/register  — W3 实现
// POST /auth/login
// POST /auth/refresh
// POST /auth/logout

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
