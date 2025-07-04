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
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleGuard } from '@/security/guards/roles.guard';
import { Role } from '@/security/decorators/roles.decorator';
import { RoleEnum } from '@/security/enums/role.enum';
import { CurrentUser } from '@/security/decorators/auth.decorator';
import { InfoUserInterface } from '@/security/interfaces/info-user.interface';
import { Response } from 'express';

@Controller('scores')
@ApiTags('scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get('by-activity/:activityId')
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  @UseInterceptors(ResponseHttpInterceptor)
  async getScoreByActivity(@Param('activityId') activityId: string) {
    return this.scoresService.getScoreByActivity(activityId);
  }

  @Post('save-score-question')
  @ApiOperation({
    summary:
      'Generar y guardar la calificación de una activiadad de preguntas y respuestas',
  })
  @UseInterceptors(ResponseHttpInterceptor)
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
  @UseInterceptors(ResponseHttpInterceptor)
  async saveScoreActivity(
    @Body() payload: CreateSaveScoreDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.saveScore(payload, id);
  }

  @Get('by-detailReading/:detailReadingId')
  @ApiOperation({ summary: 'Obtener todas las calificaciones por actividad' })
  @Role(RoleEnum.STUDENT)
  @UseInterceptors(ResponseHttpInterceptor)
  async getScoresByDetailReading(
    @Param('detailReadingId') detailReadingId: string,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.getScoreByDetailReading(detailReadingId, id);
  }

  @Get('by-reading/:readingId')
  @ApiOperation({ summary: 'Obtener todas las calificaciones por lectura' })
  @Role(RoleEnum.TEACHER)
  @UseInterceptors(ResponseHttpInterceptor)
  async getScoresByReading(@Param('readingId') readingId: string) {
    return this.scoresService.getScoreByReading(readingId);
  }

  @Get('my-scores')
  @ApiOperation({ summary: 'Obtener todas las calificaciones del estudiante' })
  @Role(RoleEnum.STUDENT)
  @UseInterceptors(ResponseHttpInterceptor)
  async getMyScores(@CurrentUser() { id }: InfoUserInterface) {
    return this.scoresService.getScoreByCourses(id);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Obtener todas las calificaciones por curso' })
  @Role(RoleEnum.TEACHER)
  @UseInterceptors(ResponseHttpInterceptor)
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

  @Get('by-student/:studentId/:courseId')
  @ApiOperation({ summary: 'Obtener todas las calificaciones por estudiante' })
  @Role(RoleEnum.TEACHER)
  @UseInterceptors(ResponseHttpInterceptor)
  async getScoresByStudent(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.scoresService.getScoreByStudent(id, studentId, courseId);
  }

  @Get('by-student/:studentId/:courseId/pdf')
  @ApiOperation({
    summary: 'Obtener el PDF de todas las calificaciones por estudiante',
  })
  @Role(RoleEnum.TEACHER)
  async getPDFScoresByStudent(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
    @CurrentUser() { id }: InfoUserInterface,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.scoresService.getPDFScoreByStudent(
      id,
      studentId,
      courseId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=report-student.pdf',
    );
    res.send(pdfBuffer);
  }
}
