import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnswersActivitiesService } from '../services/answers-activities.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';

@Controller('answers-activities')
@ApiTags('answers-activities')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
export class AnswersActivitiesController {
  constructor(private answersActivitiesService: AnswersActivitiesService) {}

  @Get('by-question/:questionActivityId')
  async getAnswersActivities(
    @Param('questionActivityId') questionActivityId: string,
  ) {
    return await this.answersActivitiesService.getAnswersActivities(
      questionActivityId,
    );
  }

  @Get('by-id/:answerActivityId')
  async getOneAnswerActivity(
    @Param('answerActivityId') answerActivityId: string,
  ) {
    return await this.answersActivitiesService.getOneAnswerActivity(
      answerActivityId,
    );
  }

  @Patch('status/:answerActivityId')
  async updateStatusAnswerActivity(
    @Param('answerActivityId') answerActivityId: string,
  ) {
    return await this.answersActivitiesService.updateStatusAnswerActivity(
      answerActivityId,
    );
  }
}
