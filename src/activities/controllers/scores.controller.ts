import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ScoresService } from '../services/scores.service';
import { CreateResponseActivityDto } from '../dtos/activities.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';

@Controller('scores')
@ApiTags('scores')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get('get/:activityId')
  async getScoreByActivity(@Param('activityId') activityId: string) {
    return this.scoresService.getScoreByActivity(activityId);
  }

  @Post('save')
  @Role(RoleEnum.STUDENT)
  async saveScore(
    @Body() payload: CreateResponseActivityDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.saveScore(payload, id);
  }
}
