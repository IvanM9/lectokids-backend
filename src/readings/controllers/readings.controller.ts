import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ReadingsService } from '../services/readings.service';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';
import { CreateReadingDto, UpdateReadingDto } from '../dtos/readings.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';

@Controller('readings')
@ApiTags('readings')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class ReadingsController {
  constructor(private service: ReadingsService) {}

  @Post('create')
  async createReading(
    @Body() data: CreateReadingDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.service.create(data, id);
  }

  @Get()
  @ApiQuery({ name: 'levelId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getReadings(
    @CurrentUser() { id }: InfoUserInterface,
    @Query('levelId') levelId: string,
    @Query('status', OptionalBooleanPipe) status: boolean,
  ) {
    return await this.service.getReadings(id, status, levelId);
  }

  @Get(':id')
  async getReadingById(@Param('id') id: string) {
    return await this.service.getReadingById(id);
  }

  @Patch(':id')
  async updateReading(
    @Param('id') id: string,
    @Body() data: UpdateReadingDto,
    @CurrentUser() user: InfoUserInterface,
  ) {
    return await this.service.updateReading(id, data, user.id);
  }

  @Patch(':id/update-status')
  async updateStatusReading(
    @Param('id') id: string,
    @CurrentUser() user: InfoUserInterface,
  ) {
    return await this.service.updateStatusReading(id, user.id);
  }
}
