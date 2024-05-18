import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ContentsService } from '../services/contents.service';
import {
  CreateContentDto,
  CreateContentForAllDto,
  MoveContentDto,
  UpdateContentDto,
} from '../dtos/contents.dto';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { TypeContent } from '@prisma/client';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';

@Controller('contents')
@ApiTags('contents readings')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class ContentsController {
  constructor(private service: ContentsService) {}

  @Post('create-same-for-all/text')
  async createSameForAll(@Body() data: CreateContentForAllDto) {
    data.type = TypeContent.TEXT;
    return this.service.createSameForAll(data);
  }

  @Post('add')
  async addContent(@Body() data: CreateContentDto) {
    return this.service.create(data);
  }

  @Patch('move')
  async moveContent(@Body() data: MoveContentDto) {
    return this.service.movePosition(data);
  }

  @Delete('delete/:id')
  async deleteContent(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Patch('update/text/:id')
  async updateContent(@Param('id') id: string, @Body() data: UpdateContentDto) {
    return this.service.update(id, data.content);
  }

  @Get('by-reading/:detailReadingId')
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  @ApiParam({
    name: 'detailReadingId',
    type: 'string',
    description: 'Id de la lectura para un estudiante',
  })
  async getByReading(@Param('detailReadingId') detailReadingId: string) {
    return this.service.getContentsByDetailReadingId(detailReadingId);
  }

  @Get('by-id/:id')
  async getById(@Param('id') id: string) {
    return this.service.getContentById(id);
  }

  @Post('generate-reading/:readingId')
  async generateReading(@Param('readingId') readingId: string) {
    return this.service.createCustomReading(readingId);
  }
}
