import { ApiProperty, PickType } from '@nestjs/swagger';
import { TypeActivity } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  registerDecorator,
  ValidateNested,
  ValidationOptions,
} from 'class-validator';

export class CreateSortImagesActivityDto {
  @ApiProperty()
  order: number;

  @ApiProperty()
  multimediaId: string;
}

export class CreateAutoGenerateActivitiesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  detailReadingId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseStudentId: string;
}

class CreateAnswerActivityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ always: true })
  answer: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;
}
class QuestionActivity {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ always: true })
  question: string;

  @ApiProperty({ type: [CreateAnswerActivityDto], required: false })
  @IsOptional()
  @Type(() => CreateAnswerActivityDto)
  @ValidateNested({ always: true, each: true })
  answers: CreateAnswerActivityDto[];
}

export class CreateQuestionActivityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  detailReadingId: string;

  @ApiProperty({ type: [QuestionActivity], required: true })
  @Type(() => QuestionActivity)
  @ValidateNested({ each: true })
  questions: QuestionActivity[];

  @ApiProperty({ enum: TypeActivity, required: true })
  @IsEnum(TypeActivity)
  @IsAllowedQuestionsActivities({
    message: 'El tipo de actividad no está permitido',
  })
  typeActivity: TypeActivity;
}

export class UpdateAnswerActivityDto extends CreateAnswerActivityDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  id: string;
}

export class UpdateQuestionsDto extends PickType(QuestionActivity, [
  'question',
]) {
  @ApiProperty({ type: [UpdateAnswerActivityDto], required: false })
  @Type(() => UpdateAnswerActivityDto)
  @ValidateNested({ each: true })
  answers: UpdateAnswerActivityDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  id: string;
}

export class UpdateQuestionActivityDto {
  @ApiProperty({ type: [UpdateQuestionsDto], required: true })
  @Type(() => UpdateQuestionsDto)
  @ValidateNested({ each: true })
  questions: UpdateQuestionsDto[];
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
