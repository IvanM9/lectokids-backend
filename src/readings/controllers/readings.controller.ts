import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ReadingsService } from '../services/readings.service';
import { CurrentUser } from '@/security/decorators/auth.decorator';
import { InfoUserInterface } from '@/security/interfaces/info-user.interface';
import { CreateReadingDto, UpdateReadingDto } from '../dtos/readings.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleGuard } from '@/security/guards/roles.guard';
import { Role } from '@/security/decorators/roles.decorator';
import { RoleEnum } from '@/security/enums/role.enum';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';
import { Response } from 'express';

@Controller('readings')
@ApiTags('readings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class ReadingsController {
  constructor(private service: ReadingsService) {}

  @Post('create')
  @UseInterceptors(ResponseHttpInterceptor)
  async createReading(
    @Body() data: CreateReadingDto,
    @CurrentUser() { id }: InfoUserInterface,
  ) {
    return this.service.create(data, id);
  }

  @Get()
  @ApiQuery({ name: 'levelId', required: false })
  @UseInterceptors(ResponseHttpInterceptor)
  @ApiQuery({ name: 'status', required: false })
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  async getReadings(
    @CurrentUser() { id }: InfoUserInterface,
    @Query('levelId') levelId: string,
    @Query('status', OptionalBooleanPipe) status: boolean,
  ) {
    return await this.service.getReadings(id, status, levelId);
  }

  @Get(':id')
  @UseInterceptors(ResponseHttpInterceptor)
  async getReadingById(@Param('id') id: string) {
    return await this.service.getReadingById(id);
  }

  @Patch(':id')
  @UseInterceptors(ResponseHttpInterceptor)
  async updateReading(
    @Param('id') id: string,
    @Body() data: UpdateReadingDto,
    @CurrentUser() user: InfoUserInterface,
  ) {
    return await this.service.updateReading(id, data, user.id);
  }

  @Patch(':id/update-status')
  @UseInterceptors(ResponseHttpInterceptor)
  async updateStatusReading(
    @Param('id') id: string,
    @CurrentUser() user: InfoUserInterface,
  ) {
    return await this.service.updateStatusReading(id, user.id);
  }

  @Post('generate-information')
  @UseInterceptors(ResponseHttpInterceptor)
  async generateInformation() {
    return await this.service.generateReadingInformation();
  }

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.service.getPDFReading(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reading.pdf');
    res.send(pdfBuffer);
  }
}
