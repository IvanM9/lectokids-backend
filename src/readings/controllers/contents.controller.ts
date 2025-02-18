import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Sse,
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
import { map, Observable } from 'rxjs';
import { ContentsConsumer } from '../consumers/contents.consumer';

@Controller('contents')
@ApiTags('contents readings')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
export class ContentsController {
  constructor(
    private service: ContentsService,
    private consumer: ContentsConsumer,
  ) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @Post('create-same-for-all/text')
  async createSameForAll(@Body() data: CreateContentForAllDto) {
    data.type = TypeContent.TEXT;
    return this.service.createSameForAll(data);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @Post('add')
  async addContent(@Body() data: CreateContentDto) {
    return this.service.create(data);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @Delete('delete/:id')
  async deleteContent(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @Patch('update/:id')
  async updateContent(@Param('id') id: string, @Body() data: UpdateContentDto) {
    return this.service.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
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

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @Get('by-id/:id')
  async getById(@Param('id') id: string) {
    return this.service.getContentById(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @Post('generate-reading')
  async generateReading(@Body() data: GenerateContentReadingDto) {
    return this.service.createCustomReadingForAll(data);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @Post('generate-reading-by-detailReading/:detailReadingId')
  @ApiOperation({
    summary: 'Generar lectura personalizada',
    description: 'Generar lectura personalizada para detailReading',
  })
  @ApiParam({
    name: 'detailReadingId',
  })
  async generateContentsByDetailReading(
    @Param('detailReadingId') detailReadingId: string,
  ) {
    // TODO: Revisar si afectan los nuevos cambios
    return this.service.generateContentsByDetailReading(detailReadingId);
  }

  @Sse('finished_generation/:process_id')
  async getFinishedGeneration(@Param('process_id') processId: string) {
    console.log('conectadoa sse');

    return new Observable((subscriber) => {
      const onProgressComplete = (data: { processId: string }) => {
        if (data.processId === processId) {
          subscriber.next({ data: 'Generación finalizada' });
        }
      };

      this.consumer.eventEmitter.on('progressComplete', onProgressComplete);

      return () => {
        this.consumer.eventEmitter.removeListener(
          'progressComplete',
          onProgressComplete,
        );
      };
    }).pipe(map((data: any) => ({ type: 'message', data })));
  }
}
