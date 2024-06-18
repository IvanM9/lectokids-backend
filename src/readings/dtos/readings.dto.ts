import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReadingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  goals: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  length?: string;

  @ApiProperty()
  @IsString()
  levelId: string;

  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsBoolean()
  autogenerate: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  imageId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  customPrompt: string;
}

export class UpdateReadingDto extends OmitType(CreateReadingDto, [
  'courseId',
  'imageId',
  'levelId',
]) {}
