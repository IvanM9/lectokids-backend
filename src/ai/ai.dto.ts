import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export interface GenerateReadingDto {
  age: number;
  title: string;
  goals: string;
  length: string;
  comprehensionLevel: string;
  interests: string;
  city: string;
  problems: string;
  preferences: string;
  genre: string;
  grade: number;
  customPrompt: string;
}

export interface GenerateGeneralReadingDto {
  title: string;
  goals: string;
  length: string;
  customPrompt: string;
}

export interface GenerateQuestionsActivitiesDto {
  age: number;
  grade: number;
  reading: string;
}

export interface generateRecommendationForQuestionsActivitiesDto {
  reading: string;
  question: string;
  answer: string;
}

export class GenerateContentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;
}
