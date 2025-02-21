/* eslint-disable prettier/prettier */
import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../enums/role.enum';

export const ROLE_KEY = 'roles';
export const Role = (...roles: RoleEnum[]) => SetMetadata(ROLE_KEY, roles);
