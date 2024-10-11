import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LevelsService } from '../services/levels.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { CreateLevelDto } from '../dtos/levels.dto';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';

@Controller('levels')
@ApiTags('levels')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class LevelsController {
  constructor(private levelsService: LevelsService) {}

  @Get(':courseId')
  @ApiQuery({ name: 'status', required: false })
  @Role(RoleEnum.TEACHER, RoleEnum.STUDENT)
  async getAllLevels(
    @Param('courseId') courseId: string,
    @Query('status', OptionalBooleanPipe) status?: boolean,
  ) {
    return {
      data: await this.levelsService.getAllLevels(courseId, status),
    };
  }

  @Post()
  async createLevel(
    @Body() data: CreateLevelDto,
    @CurrentUser() { id }: { id: string },
  ) {
    return await this.levelsService.createLevel(data, id);
  }

  @Patch(':levelId')
  async updateLevel(
    @Param('levelId') levelId: string,
    @Body() data: CreateLevelDto,
    @CurrentUser() { id }: { id: string },
  ) {
    return await this.levelsService.updateLevel(levelId, data, id);
  }

  @Patch(':levelId/status')
  async updateStatus(
    @Param('levelId') levelId: string,
    @CurrentUser() { id }: { id: string },
  ) {
    return await this.levelsService.updateStatusLevel(levelId, id);
  }

  @Get('student/:courseId')
  @Role(RoleEnum.STUDENT)
  async getAllLevelsStudent(
    @Param('courseId') courseId: string,
    @CurrentUser() { id }: { id: string },
  ) {
    return {
      data: await this.levelsService.getContentCourse(courseId, id),
    };
  }
}
