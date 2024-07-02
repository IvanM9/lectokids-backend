import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DetailsReadingsService } from '../services/details-readings.service';
import { CreateTimeSpendDto } from '../dtos/readings.dto';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';

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

  @Post('time-spend')
  @Role(RoleEnum.STUDENT)
  async createTimeSpend(
    @Body() data: CreateTimeSpendDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return await this.service.saveTimeSpentReading(data, id);
  }
}
