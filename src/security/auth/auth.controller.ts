import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '@/security/auth/auth.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DetailLoginDto, LoginDto } from './dtos/LoginDto';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '../jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '../jwt-strategy/roles.guard';
import { Role } from '../jwt-strategy/roles.decorator';
import { RoleEnum } from '../jwt-strategy/role.enum';
import { isString } from 'class-validator';

@Controller('auth')
@UseInterceptors(ResponseHttpInterceptor)
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async login(@Headers() payload: LoginDto, @Body() details: DetailLoginDto) {
    if (!isString(payload.user) || !isString(payload.password)) {
      throw new UnauthorizedException(
        'Debe ingresar un usuario y una contraseña',
      );
    }

    const token = await this.authService.login(payload, details);
    return { data: token, message: 'Bienvenido' };
  }

  @Get('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN, RoleEnum.STUDENT, RoleEnum.TEACHER)
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }
}
