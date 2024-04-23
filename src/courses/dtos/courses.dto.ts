import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateCoursesDto {
  @ApiProperty()
  @IsString()
  @Length(1, 150)
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty()
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}
