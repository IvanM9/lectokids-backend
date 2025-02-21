import {
  Controller,
  Patch,
  Param,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { QuestionsActivitiesService } from '../services/questions-activities.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { RoleGuard } from '@/security/guards/roles.guard';
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { Role } from '@/security/decorators/roles.decorator';
import { RoleEnum } from '@/security/enums/role.enum';

@Controller('questions-activities')
@ApiTags('questions-activities')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class QuestionsActivitiesController {
  constructor(private service: QuestionsActivitiesService) {}

  @Patch('status/:questionActivityId')
  async updateStatusQuestionActivity(
    @Param('questionActivityId') questionActivityId: string,
  ) {
    return await this.service.updateStatusQuestionActivity(questionActivityId);
  }
}
