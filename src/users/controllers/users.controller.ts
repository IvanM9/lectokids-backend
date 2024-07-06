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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from '@/users/services/users.service';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { CreateUserDto } from '../dtos/users.dto';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';

@Controller('users')
@ApiTags('users')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('teachers')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @Role(RoleEnum.ADMIN)
  async getAllTeachers(
    @Query('status', OptionalBooleanPipe) status: boolean,
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) {
    return { data: await this.service.getAllTeachers(status, search, page) };
  }

  @Post('teachers')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  async createTeacher(@Body() data: CreateUserDto) {
    data.isPending = false;
    return { data: await this.service.createTeacher(data) };
  }

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    data.isPending = true;
    return { data: await this.service.createTeacher(data) };
  }

  @Patch('activate/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  async activateTeacher(@Param('id') id: string) {
    return {
      data: await this.service.activateTeacher(id),
      message: 'Profesor activado',
    };
  }

  @Patch('status/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  async changeStatusTeacher(@Param('id') id: string) {
    return await this.service.updateStatusTeacher(id);
  }
}
