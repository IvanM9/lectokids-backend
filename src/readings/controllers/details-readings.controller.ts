import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DetailsReadingsService } from '../services/details-readings.service';

@Controller('details-readings')
@ApiTags('details-readings')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
export class DetailsReadingsController {
  constructor(private service: DetailsReadingsService) {}

  @Get(':id')
  async getDetailReadingById(@Param('id') id: string) {
    return await this.service.getInfo(id);
  }
}
