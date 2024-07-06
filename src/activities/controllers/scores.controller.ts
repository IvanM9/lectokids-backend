import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ScoresService } from '../services/scores.service';
import {
  CreateResponseActivityDto,
  CreateSaveScoreDto,
} from '../dtos/activities.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';
import { Response } from 'express';

@Controller('scores')
@ApiTags('scores')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get('by-activity/:activityId')
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  async getScoreByActivity(@Param('activityId') activityId: string) {
    return this.scoresService.getScoreByActivity(activityId);
  }

  @Post('save-score-question')
  @ApiOperation({
    summary:
      'Generar y guardar la calificación de una activiadad de preguntas y respuestas',
  })
  @Role(RoleEnum.STUDENT)
  async saveScore(
    @Body() payload: CreateResponseActivityDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.saveQuestionScore(payload, id);
  }

  @Post('save-score')
  @ApiOperation({ summary: 'Guardar la calificación de una actividad' })
  @Role(RoleEnum.STUDENT)
  async saveScoreActivity(
    @Body() payload: CreateSaveScoreDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.saveScore(payload, id);
  }

  @Get('by-detailReading/:detailReadingId')
  @ApiOperation({ summary: 'Obtener todas las calificaciones por actividad' })
  @Role(RoleEnum.STUDENT)
  async getScoresByDetailReading(
    @Param('detailReadingId') detailReadingId: string,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.getScoreByDetailReading(detailReadingId, id);
  }

  @Get('by-reading/:readingId')
  @ApiOperation({ summary: 'Obtener todas las calificaciones por lectura' })
  @Role(RoleEnum.TEACHER)
  async getScoresByReading(@Param('readingId') readingId: string) {
    return this.scoresService.getScoreByReading(readingId);
  }

  @Get('my-scores')
  @ApiOperation({ summary: 'Obtener todas las calificaciones del estudiante' })
  @Role(RoleEnum.STUDENT)
  async getMyScores(@CurrentUser() { id }: InfoUserInterface) {
    return this.scoresService.getScoreByCourses(id);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Obtener todas las calificaciones por curso' })
  @Role(RoleEnum.TEACHER)
  async getScoresByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.getAllScoreByCourse(id, courseId);
  }

  @Get('by-course/:courseId/pdf')
  @ApiOperation({
    summary: 'Obtener el PDF de todas las calificaciones por curso',
  })
  @Role(RoleEnum.TEACHER)
  async getPDFScoresByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() { id }: InfoUserInterface,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.scoresService.getPDFScoreByCourse(
      id,
      courseId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.send(pdfBuffer);
  }
}
