import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/security/auth/dtos/LoginDto';
import { PrismaService } from '@/prisma.service';
import { compare } from 'bcrypt';
import { ENVIRONMENT } from '@/shared/constants/environment';
import { RoleEnum } from '../jwt-strategy/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private db: PrismaService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.db.user
      .findUniqueOrThrow({
        where: { user: payload.user },
      })
      .catch(() => {
        throw new UnauthorizedException('Usuario no encontrado');
      });

    if (!user.status)
      throw new UnauthorizedException('El usuario se encuentra desactivado');

    if (!(await compare(payload.password, user.password))) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    switch (user.role) {
      case RoleEnum.TEACHER:
        await this.validateTeacher(user.id);
        break;
      case RoleEnum.STUDENT:
        await this.validateStudent(user.id);
        break;
      default:
        throw new UnauthorizedException('El usuario no tiene un rol válido');
    }

    return {
      token: this.jwt.sign(
        {
          id: user.id,
          user: user.user,
          role: user.role,
        },
        {
          expiresIn: '5s',
          secret: ENVIRONMENT.JWT_SECRET_KEY,
        },
      ),
      role: user.role,
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

    if (!isPending)
      throw new UnauthorizedException('El usuario no está habilitado');
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
}
