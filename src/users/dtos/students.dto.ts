import { ApiProperty, OmitType } from '@nestjs/swagger';
// import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  identification: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ type: Date })
  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  interests: string;

  @ApiProperty()
  @IsNumber()
  // @Transform(({ value }) => parseInt(value))
  grade: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  customPrompt: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  problems: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  haveDyslexia?: boolean;
}

export class UpdateStudentDto extends OmitType(CreateStudentDto, [
  'identification',
  'genre',
]) {}

export class ImportFromExcelDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  // @IsNotEmpty()
  file: Express.Multer.File;
}
