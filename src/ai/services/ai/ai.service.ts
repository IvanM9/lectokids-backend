import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GoogleGenerativeAI } = require('@google/generative-ai');
import { ENVIRONMENT } from '@/shared/constants/environment';
import {
  generateAlphabetSoup,
  generateOpenAnswers,
  generateOpenText,
  generateQuiz,
  generateReading2,
  generateYesOrNot,
  getTypeActivities,
} from '@/ai/prompts';
import {
  GenerateQuestionsActivitiesDto,
  GenerateReadingDto,
} from '@/ai/ai.dto';
import { TypeActivity } from '@prisma/client';
@Injectable()
export class AiService {
  genAI = new GoogleGenerativeAI(ENVIRONMENT.API_KEY_AI);

  model = this.genAI.getGenerativeModel({
    // model: 'gemini-pro',
    model: 'gemini-1.5-flash',
  });

  async generateReadingService(params: GenerateReadingDto) {
    const prompt = generateReading2(params);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al generar contenido');
    }
  }

  async generateQuizService(
    params: GenerateQuestionsActivitiesDto,
    type: TypeActivity,
  ) {
    let prompt = '';

    switch (type) {
      case TypeActivity.QUIZ:
        prompt = generateQuiz(params);
        break;
      case TypeActivity.ALPHABET_SOUP:
        prompt = generateAlphabetSoup(params);
        break;
      case TypeActivity.OPEN_TEXT:
        prompt = generateOpenText(params);
        break;
      case TypeActivity.YES_NO:
        prompt = generateYesOrNot(params);
        break;
      case TypeActivity.OPEN_ANSWERS:
        prompt = generateOpenAnswers(params);
      default:
        console.log('Tipo de actividad no permitido');
        break;
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al generar contenido');
    }
  }

  async determineTypeActivities(params: GenerateQuestionsActivitiesDto) {
    const prompt = getTypeActivities(params);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al generar contenido');
    }
  }
}
