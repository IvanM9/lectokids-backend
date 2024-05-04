import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateMultimediaDto } from '../dtos/multimedia.dto';
import { MultimediaService } from '../services/multimedia.service';

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
}
