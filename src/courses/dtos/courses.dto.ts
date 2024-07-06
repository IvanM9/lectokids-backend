import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateCoursesDto {
  @ApiProperty()
  @IsString()
  @Length(1, 150)
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}
