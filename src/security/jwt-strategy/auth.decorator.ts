import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';
import { PrismaService } from '@/libs/prisma.service';
import { RoleEnum } from './role.enum';

export const CurrentUser = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext,
  ): Promise<Partial<InfoUserInterface>> => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const db = new PrismaService();

      const currentUser = await db.session
        .findFirstOrThrow({
          where: {
            id: request.user.id,
          },
          select: {
            user: {
              select: {
                id: true,
                status: true,
                role: true,
              },
            },
            isActive: true,
          },
        })
        .catch(() => {
          throw new NotFoundException('Usuario no encontrado');
        });

      if (!currentUser.isActive)
        throw new UnauthorizedException('La sesión ha caducado');

      if (!currentUser.user.status) {
        throw new UnauthorizedException('Usuario desactivado');
      }

      return {
        id: currentUser.user.id,
        role: currentUser.user.role as RoleEnum,
      };
    } catch (error) {
      throw new ForbiddenException();
    }
  },
);
