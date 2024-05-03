import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import { CreateQuestionActivityDto } from '../dtos/activities.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';

@Controller('activities')
@ApiTags('activities')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('by-reading/:detailReadingId')
  async getActivities(@Param('detailReadingId') detailReadingId: string) {
    return await this.activitiesService.getActivities(detailReadingId);
  }

  @Get('by-id/:id')
  async getOneActivity(@Param('id') id: string) {
    return await this.activitiesService.getOneActivity(id);
  }

  @Post('create-question')
  async createQuestionActivity(@Body() data: CreateQuestionActivityDto) {
    return await this.activitiesService.createQuestionActivity(data);
  }
}
