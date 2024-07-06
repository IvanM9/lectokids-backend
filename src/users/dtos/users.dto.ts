import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateStudentDto } from './students.dto';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto extends PickType(CreateStudentDto, [
  'identification',
  'firstName',
  'lastName',
  'birthDate',
  'genre',
]) {
  isPending: boolean;

  @ApiProperty({ required: false })
  @IsStrongPassword(
    {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    },
    {
      message:
        'La contraseña debe tener al menos 6 caracteres, 1 letra minúscula, 1 letra mayúscula y 1 número.',
    },
  )
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  user?: string;
}

export class UserIdDto {
  @ApiProperty()
  @IsString()
  id: string;
}
