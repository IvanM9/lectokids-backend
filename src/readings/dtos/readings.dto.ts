import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class StudentsDto {
  @ApiProperty()
  @IsString()
  id: string;
}
export class CreateReadingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  goals: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customPrompt: string;

  @ApiProperty({ type: [StudentsDto] })
  @Type(() => StudentsDto)
  @ValidateNested({ always: true, each: true })
  students: StudentsDto[];

  @ApiProperty()
  @IsNumber()
  @Max(3, { message: 'El número de imágenes debe ser menor o igual a 3' })
  @Min(0, { message: 'El número de imágenes debe ser mayor o igual a 0' })
  numImages: number;
}

export class UpdateReadingDto extends OmitType(CreateReadingDto, [
  'courseId',
  'imageId',
  'levelId',
]) {}

export class CreateTimeSpendDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  detailReadingId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}
