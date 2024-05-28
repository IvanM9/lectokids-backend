import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { TypeContent } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateContentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsString()
  detailReadingId: string;

  @ApiProperty()
  @IsNumber()
  positionPage: number;

  // @ApiProperty({ enum: TypeContent })
  // @IsEnum(TypeContent)
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

export class UpdateContentDto extends PickType(CreateContentDto, ['content']) {
  @ApiProperty({ enum: TypeContent })
  @IsEnum(TypeContent)
  type: TypeContent;
}
