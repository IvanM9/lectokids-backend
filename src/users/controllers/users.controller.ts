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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from '@/users/services/users.service';
import { RoleGuard } from '@/security/guards/roles.guard';
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { Role } from '@/security/decorators/roles.decorator';
import { RoleEnum } from '@/security/enums/role.enum';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { CreateUserDto } from '../dtos/users.dto';
import { CurrentUser } from '@/security/decorators/auth.decorator';
import { InfoUserInterface } from '@/security/interfaces/info-user.interface';
import { GetPagination } from '@/shared/decorators/pagination.decorator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@Controller('users')
@ApiTags('users')
@UseInterceptors(ResponseHttpInterceptor)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('teachers')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ type: PaginationDto })
  async getAllTeachers(
    @GetPagination() pagination: PaginationDto,
  ) {
    return { data: await this.service.getAllTeachers(pagination) };
  }

  @Post('teachers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Crear un profesor', description: 'Crea un nuevo profesor en el sistema. Sólo para administradores' })
  async createTeacher(@Body() data: CreateUserDto) {
    data.isPending = false;
    return { data: await this.service.createTeacher(data) };
  }

  @Post()
  @ApiOperation({ summary: 'Registro de profesor' , description: 'Permite a un profesor registrarse en el sistema. El profesor será creado con estado pendiente.' })
  async createUser(@Body() data: CreateUserDto) {
    data.isPending = true;
    return { data: await this.service.createTeacher(data) };
  }

  @Patch('activate/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  async activateTeacher(@Param('id') id: string) {
    return {
      data: await this.service.activateTeacher(id),
      message: 'Profesor activado',
    };
  }

  @Patch('status/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  async changeStatusTeacher(@Param('id') id: string) {
    return await this.service.updateStatusTeacher(id);
  }

  @Get('information')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  async getInformation(@CurrentUser() { id }: InfoUserInterface) {
    return await this.service.generalInfo(id);
  }
}
