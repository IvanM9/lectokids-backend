import {
  Body,
  Controller,
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
} from '../dtos/contents.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';

@Controller('contents')
@ApiTags('contents readings')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
export class ContentsController {
  constructor(private service: ContentsService) {}

  @Post('create-same-for-all')
  async createSameForAll(@Body() data: CreateContentForAllDto) {
    return this.service.createSameForAll(data);
  }

  @Post('add-content')
  async addContent(@Body() data: CreateContentDto) {
    return this.service.create(data);
  }

  @Patch('move-content')
  async moveContent(@Body() data: MoveContentDto) {
    return this.service.movePosition(data);
  }
}
