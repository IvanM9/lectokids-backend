import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './services/ai/ai.service';
import { GenerateContentDto } from './ai.dto';

@Controller('ai')
@ApiTags('ai')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class AiController {
  constructor(private service: AiService) {}

  @Post('generate-image')
  async generateImage(@Body() data: GenerateContentDto) {
    return this.service.generateFrontPage(data.prompt);
  }
}
