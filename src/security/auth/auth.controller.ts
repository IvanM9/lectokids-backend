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
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/roles.guard';
import { Role } from '../decorators/roles.decorator';
import { RoleEnum } from '../enums/role.enum';
import { isString } from 'class-validator';
import { RefreshAuthGuard } from '../guards/refresh-jwt.guard';

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
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refreshToken(@Req() req) {
    return {
      data: await this.authService.refreshToken(req.user.id),
    };
  }
}
