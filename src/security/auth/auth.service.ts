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
import { compare, hashSync } from 'bcrypt';
import { RoleEnum } from '../enums/role.enum';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { Cron, CronExpression } from '@nestjs/schedule';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { InfoUserInterface } from '../interfaces/info-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private db: PrismaService,
    @Inject(jwtConfig.KEY) private environment: ConfigType<typeof jwtConfig>,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  async login(payload: LoginDto, detail: DetailLoginDto) {
    // Check if the user field is an email or username
    const isEmail = payload.user.includes('@');
    
    const user = await this.db.user
      .findUniqueOrThrow({
        where: isEmail ? { email: payload.user } : { user: payload.user },
        select: {
          id: true,
          user: true,
          email: true,
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

    const tokens = await this.registerSession(
      user.id,
      false,
      detail,
      this.refreshTokenConfig.expiresIn as number,
    );

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
    };
  }

  private async registerSession(
    userId: string,
    failed: boolean,
    detailSession: DetailLoginDto,
    expiresIn: number,
  ) {
    return await this.db.$transaction(async (cnx) => {
      const session = await cnx.session.create({
        data: {
          userId,
          failed,
          ...detailSession,
          expiresDate: new Date(Date.now() + expiresIn * 1000),
        },
        select: {
          id: true,
          user: {
            select: {
              role: true,
            },
          },
        },
      });

      const tokens = await this.generateTokens(
        session.id,
        session.user.role as RoleEnum,
      );

      await cnx.session.update({
        where: { id: session.id },
        data: { hashedRefreshToken: hashSync(tokens.refreshToken, 12) },
      });

      return tokens;
    });
  }

  private async generateTokens(sessionId: string, role: RoleEnum) {
    const payload: InfoUserInterface = { id: sessionId, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, this.refreshTokenConfig),
    ]);
    return {
      accessToken,
      refreshToken,
    };
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

  // @Cron(CronExpression.EVERY_5_MINUTES)
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

  async validateRefreshToken(sessionId: string, refreshToken: string) {
    const session = await this.db.session
      .findUniqueOrThrow({
        where: { id: sessionId },
      })
      .catch(() => {
        throw new NotFoundException('Sesión no encontrada');
      });

    if (!session.hashedRefreshToken)
      throw new UnauthorizedException('Invalid Refresh Token');

    const refreshTokenMatches = await compare(
      refreshToken,
      session.hashedRefreshToken,
    );

    if (!refreshTokenMatches)
      throw new UnauthorizedException('Invalid Refresh Token');

    return { id: sessionId };
  }

  async refreshToken(sessionId: string) {
    const session = await this.db.session
      .findUniqueOrThrow({
        where: {
          id: sessionId,
          failed: false,
        },
        select: {
          user: {
            select: {
              role: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Sesión no encontrada');
      });

    const { accessToken, refreshToken } = await this.generateTokens(
      sessionId,
      session.user.role as RoleEnum,
    );
    const hashedRefreshToken = hashSync(refreshToken, 12);

    await this.db.session.update({
      where: { id: sessionId },
      data: {
        hashedRefreshToken,
      },
    });

    return {
      token: accessToken,
      refreshToken,
    };
  }
}
