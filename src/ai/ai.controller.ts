import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleEnum } from '@/security/enums/role.enum';
import { Role } from '@/security/decorators/roles.decorator';
import { RoleGuard } from '@/security/guards/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './services/ai/ai.service';
import { GenerateContentDto } from './ai.dto';
import { Response } from 'express';

@Controller('ai')
@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class AiController {
  constructor(private service: AiService) {}

  // @Post('generate-image')
  // @UseInterceptors(ResponseHttpInterceptor)
  // async generateImage(@Body() { text }: GenerateContentDto) {
  //   return this.service.generateFrontPage(text);
  // }
}
