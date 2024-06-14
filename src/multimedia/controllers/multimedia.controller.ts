import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateLinkMultimediaDto, CreateMultimediaDto } from '../dtos/multimedia.dto';
import { MultimediaService } from '../services/multimedia.service';
import { Response } from 'express';

@Controller('multimedia')
@ApiTags('multimedia')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class MultimediaController {
  constructor(private service: MultimediaService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'), ResponseHttpInterceptor)
  @ApiConsumes('multipart/form-data')
  async createMultimedia(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() data: CreateMultimediaDto,
  ) {
    return this.service.createMultimedia(files, data);
  }

  @Delete(':id')
  async deleteMultimedia(@Param('id') id: string) {
    return this.service.deleteMultimedia(id);
  }

  @Get(':id/download')
  async getMultimedia(@Param('id') id: string, @Res() res: Response) {
    const file = await this.service.downloadMultimedia(id);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename= ${file.name}`,
      'x-processed-filename': `${file.name}`,
    });
    res.send(file.buffer);
  }

  @Get(':id/get')
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  async getMultimediaUrl(@Param('id') id: string) {
    return this.service.getMultimedia(id);
  }

  @Post('link')
  async createLinkMultimedia(@Body() data: CreateLinkMultimediaDto) {
    return this.service.uploadUrl(data);
  }
}
