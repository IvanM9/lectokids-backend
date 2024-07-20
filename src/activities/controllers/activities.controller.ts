import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import {
  AutoGenerateQuestionActivityDto,
  CreateAutoGenerateActivitiesDto,
  CreateQuestionActivityDto,
  GenerateGeneralActivityDto,
  UpdateQuestionActivityDto,
} from '../dtos/activities.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';

@Controller('activities')
@ApiTags('activities')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('by-reading/:detailReadingId')
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  async getActivities(@Param('detailReadingId') detailReadingId: string) {
    return await this.activitiesService.getActivities(detailReadingId);
  }

  @Get('by-id/:id')
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  async getOneActivity(
    @Param('id') id: string,
    @CurrentUser() { role }: InfoUserInterface,
  ) {
    return await this.activitiesService.getOneActivity(id, role);
  }

  @Post('create-questions')
  async createQuestionActivity(@Body() data: CreateQuestionActivityDto) {
    return await this.activitiesService.createQuestionActivity(data);
  }

  @Post('generate-activities')
  async generateActivities(@Body() data: CreateAutoGenerateActivitiesDto) {
    return await this.activitiesService.generateActivities(data);
  }

  @Post('generate-questions')
  async generateQuestionsActivities(
    @Body() data: AutoGenerateQuestionActivityDto,
  ) {
    return await this.activitiesService.generateActivityByType(data);
  }

  @Post('generate-questions/general')
  async generateQuestionsActivitiesGeneral(
    @Body() data: GenerateGeneralActivityDto,
  ) {
    return await this.activitiesService.generateGeneralActivityByType(data);
  }

  @Put('update-questions/:id')
  async updateQuestionActivity(
    @Param('id') id: string,
    @Body() data: UpdateQuestionActivityDto,
  ) {
    return await this.activitiesService.updateQuestionActivity(id, data);
  }

  @Patch('update-status/:activityId')
  async updateStatusActivity(@Param('activityId') id: string) {
    return await this.activitiesService.updateStatusQuestionActivity(id);
  }
}
