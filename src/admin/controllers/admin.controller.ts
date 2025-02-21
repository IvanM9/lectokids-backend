import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleGuard } from '@/security/guards/roles.guard';
import { Role } from '@/security/decorators/roles.decorator';
import { RoleEnum } from '@/security/enums/role.enum';
import { ConfigDto } from '../dtos/config.dto';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';

@Controller('admin')
@ApiTags('admin')
@ApiBearerAuth()
@UseInterceptors(ResponseHttpInterceptor)
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.ADMIN)
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('config')
  getConfig() {
    throw new NotImplementedException();
  }

  @Put('config')
  setConfig(@Body() config: ConfigDto) {
    throw new NotImplementedException();
  }
}
