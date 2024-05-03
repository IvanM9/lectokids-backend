import { ApiProperty } from '@nestjs/swagger';
import { TypeActivity } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSortImagesActivityDto {
  @ApiProperty()
  order: number;

  @ApiProperty()
  multimediaId: string;
}

class CreateAnswerActivityDto {
  @ApiProperty()
  @IsString()
  answer: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionActivityDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsString()
  detailReadingId: string;

  @ApiProperty({ type: [CreateAnswerActivityDto], required: false })
  @IsOptional()
  @IsObject({ each: true })
  answerActivity: CreateAnswerActivityDto[];

  @ApiProperty({ enum: TypeActivity, required: true })
  @IsEnum(TypeActivity)
  typeActivity: TypeActivity;
}
