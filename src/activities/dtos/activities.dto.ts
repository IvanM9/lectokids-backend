import { ApiProperty } from '@nestjs/swagger';
import { TypeActivity } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationOptions,
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
  @IsAllowedQuestionsActivities({
    message: 'El tipo de actividad no está permitido',
  })
  typeActivity: TypeActivity;
}

function IsAllowedQuestionsActivities(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsAllowedActivityType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Aquí puedes especificar los tipos de actividad permitidos
          const allowedTypes = [
            TypeActivity.OPEN_ANSWERS,
            TypeActivity.OPEN_TEXT,
            TypeActivity.YES_NO,
            TypeActivity.QUIZ,
          ];
          return allowedTypes.includes(value);
        },
      },
    });
  };
}
