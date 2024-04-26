import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '@/users/services/users.service';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';

@Controller('users')
@ApiTags('users')
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('teachers')
  @Role(RoleEnum.ADMIN)
  async getAllTeachers() {
    return { data: await this.service.getAllTeachers() };
  }
}
