import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ContentsService } from '../services/contents.service';
import { CreateContentForAllDto } from '../dtos/contents.dto';
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

  @Post('create-manual')
  async createSameForAll(@Body() data: CreateContentForAllDto) {
    return this.service.createSameForAll(data);
  }
}
