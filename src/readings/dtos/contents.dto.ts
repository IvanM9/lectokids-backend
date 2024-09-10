import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { TypeContent } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateContentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  imageId?: string;

  @ApiProperty()
  @IsString()
  detailReadingId: string;

  @ApiProperty({ enum: TypeContent })
  @IsEnum(TypeContent)
  type?: TypeContent;
}

export class CreateContentForAllDto extends OmitType(CreateContentDto, [
  'detailReadingId',
]) {
  @ApiProperty()
  @IsString()
  readingId: string;
}

export class MoveContentDto {
  @ApiProperty()
  @IsString()
  contentLectureId: string;

  @ApiProperty()
  @IsNumber()
  positionTo: number;
}

export class UpdateContentDto extends PickType(CreateContentDto, [
  'content',
  'imageId',
]) {
  @ApiProperty({ enum: TypeContent })
  @IsEnum(TypeContent)
  type: TypeContent;
}

export class GenerateContentReadingDto {
  @ApiProperty()
  @IsString()
  readingId: string;

  @ApiProperty()
  @IsBoolean()
  autogenerateActivities: boolean = false;

  @ApiProperty()
  @IsBoolean()
  generateFrontPage: boolean = false;
}
