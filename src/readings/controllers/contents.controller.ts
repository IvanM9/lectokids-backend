import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ContentsService } from '../services/contents.service';
import {
  CreateContentDto,
  CreateContentForAllDto,
  GenerateContentReadingDto,
  UpdateContentDto,
} from '../dtos/contents.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { TypeContent } from '@prisma/client';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';

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

  @Delete('delete/:id')
  async deleteContent(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Patch('update/:id')
  async updateContent(@Param('id') id: string, @Body() data: UpdateContentDto) {
    return this.service.update(id, data);
  }

  @Get('by-reading/:detailReadingId')
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  @ApiParam({
    name: 'detailReadingId',
    type: 'string',
    description: 'Id de la lectura para un estudiante',
  })
  @ApiQuery({ name: 'status', type: 'boolean', required: false })
  async getByReading(
    @Param('detailReadingId') detailReadingId: string,
    @Query('status', OptionalBooleanPipe) status: boolean,
  ) {
    return this.service.getContentsByDetailReadingId(detailReadingId, status);
  }

  @Get('by-id/:id')
  async getById(@Param('id') id: string) {
    return this.service.getContentById(id);
  }

  @Post('generate-reading')
  async generateReading(@Body() data: GenerateContentReadingDto) {
    return this.service.createCustomReadingForAll(data);
  }

  @Post('generate-reading-by-detailReading/:detailReadingId')
  @ApiOperation({
    summary: 'Generar lectura personalizada',
    description: 'Generar lectura personalizada para detailReading',
  })
  async generateContentsByDetailReading(
    @Param('detailReadingId') detailReadingId: string,
  ) {
    // TODO: Revisar si afectan los nuevos cambios
    return this.service.generateContentsByDetailReading(detailReadingId);
  }
}
