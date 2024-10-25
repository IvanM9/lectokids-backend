import { Body, Controller, Get, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
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
        return this.service.getConfig();
    }

    @Put('config')
    setConfig(@Body() config: ConfigDto) {
        return this.service.updateConfig(config);
    }
}
