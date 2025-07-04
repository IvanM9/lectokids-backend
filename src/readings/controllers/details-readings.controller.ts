import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleEnum } from '@/security/enums/role.enum';
import { Role } from '@/security/decorators/roles.decorator';
import { RoleGuard } from '@/security/guards/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Param,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DetailsReadingsService } from '../services/details-readings.service';
import { CreateTimeSpendDto } from '../dtos/readings.dto';
import { CurrentUser } from '@/security/decorators/auth.decorator';
import { InfoUserInterface } from '@/security/interfaces/info-user.interface';
import { Response } from 'express';

@Controller('details-readings')
@ApiTags('details-readings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
export class DetailsReadingsController {
  constructor(private service: DetailsReadingsService) {}

  @Get(':id')
  @UseInterceptors(ResponseHttpInterceptor)
  async getDetailReadingById(@Param('id') id: string) {
    return await this.service.getInfo(id);
  }

  @Post('time-spend')
  @Role(RoleEnum.STUDENT)
  @UseInterceptors(ResponseHttpInterceptor)
  async createTimeSpend(
    @Body() data: CreateTimeSpendDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return await this.service.saveTimeSpentReading(data, id);
  }

  @Get(':id/audio')
  @Role(RoleEnum.STUDENT)
  async getAudio(@Param('id') id: string, @Res() res: Response) {
    throw new NotImplementedException('Generación de audio en mantenimiento');
    // const audio = await this.service.getAudio(id);
    // res.setHeader('Content-Type', 'audio/mp3');
    // res.setHeader('Content-Disposition', `attachment; filename=${audio.name}`);
    // res.send(audio.buffer);
  }
}
