import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateStudentDto } from './students.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto extends PickType(CreateStudentDto, [
  'identification',
  'firstName',
  'lastName',
  'birthDate',
  'genre',
]) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPending: boolean;
}
