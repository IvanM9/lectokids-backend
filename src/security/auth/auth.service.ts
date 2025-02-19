import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DetailLoginDto, LoginDto } from '@/security/auth/dtos/LoginDto';
import { PrismaService } from '@/libs/prisma.service';
import { compare } from 'bcrypt';
import { RoleEnum } from '../jwt-strategy/role.enum';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private db: PrismaService,
    @Inject(jwtConfig.KEY) private environment: ConfigType<typeof jwtConfig>,
  ) {}

  async login(payload: LoginDto, detail: DetailLoginDto) {
    const user = await this.db.user
      .findUniqueOrThrow({
        where: { user: payload.user },
        select: {
          id: true,
          user: true,
          password: true,
          role: true,
          status: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('Usuario no encontrado');
      });

    if (!user.status)
      throw new UnauthorizedException('El usuario se encuentra desactivado');

    if (!(await compare(payload.password, user.password))) {
      throw new BadRequestException('Contraseña incorrecta');
    }

    switch (user.role) {
      case RoleEnum.TEACHER:
        await this.validateTeacher(user.id);
        break;
      case RoleEnum.STUDENT:
        await this.validateStudent(user.id);
        break;
      case RoleEnum.ADMIN:
        break;
      default:
        throw new UnauthorizedException('El usuario no tiene un rol válido');
    }

    const expiresIn = 60 * 60 * 12;
    const session = await this.registerSession(
      user.id,
      false,
      detail,
      expiresIn,
    );

    return {
      token: this.jwt.sign(
        {
          id: session.id,
          role: user.role,
        },
        {
          expiresIn,
          secret: this.environment.secret,
        },
      ),
      role: user.role,
    };
  }

  private async registerSession(
    userId: string,
    failed: boolean,
    detailSession: DetailLoginDto,
    expiresIn: number,
  ) {
    return await this.db.session.create({
      data: {
        userId,
        failed,
        ...detailSession,
        expiresDate: new Date(Date.now() + expiresIn * 1000),
      },
      select: {
        id: true,
      },
    });
  }

  private async validateTeacher(id: string) {
    const { isPending } = await this.db.teacher
      .findFirstOrThrow({
        where: { user: { id } },
        select: { isPending: true },
      })
      .catch(() => {
        throw new UnauthorizedException('El usuario no es profesor');
      });

    if (isPending)
      throw new BadRequestException('El usuario no está habilitado');
  }

  private async validateStudent(id: string) {
    await this.db.student
      .findFirstOrThrow({
        where: { user: { id } },
      })
      .catch(() => {
        throw new UnauthorizedException('El usuario no es estudiante');
      });
  }

  async logout(sessionId: string) {
    const session = await this.db.session
      .findUniqueOrThrow({
        where: { id: sessionId },
      })
      .catch(() => {
        throw new NotFoundException('La sesión no existe');
      });

    await this.db.session
      .update({
        where: {
          id: sessionId,
        },
        data: {
          lastDate: new Date(),
          isActive: false,
        },
      })
      .catch((e) => {
        throw new InternalServerErrorException(
          'No se pudo registrar el cierre de sesión',
        );
      });

    return {
      message: 'Se ha cerrado la sesión correctamente',
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async automaticLogout() {
    const sessions = await this.db.session.findMany({
      where: {
        expiresDate: {
          lte: new Date(),
        },
        failed: false,
      },
      select: {
        id: true,
      },
    });

    for (const session of sessions) {
      await this.logout(session.id);
    }
  }
}
