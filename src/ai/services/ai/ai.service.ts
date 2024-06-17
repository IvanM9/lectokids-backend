import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GoogleGenerativeAI } = require('@google/generative-ai');
import { ENVIRONMENT } from '@/shared/constants/environment';
import {
  generateAlphabetSoup,
  generateCrossword,
  generateOpenAnswers,
  generateOpenText,
  generateQuiz,
  generateReading,
  generateReading2,
  generateRecommendationForQuestionsActivities,
  generateYesOrNot,
  getTypeActivities,
} from '@/ai/prompts';
import {
  GenerateGeneralReadingDto,
  GenerateQuestionsActivitiesDto,
  GenerateReadingDto,
  generateRecommendationForQuestionsActivitiesDto,
} from '@/ai/ai.dto';
import { TypeActivity } from '@prisma/client';
import OpenAI from "openai";
@Injectable()
export class AiService {
  constructor(private readonly logger: Logger) {}

  openai = new OpenAI();
  genAI = new GoogleGenerativeAI(ENVIRONMENT.API_KEY_AI);

  model = this.genAI.getGenerativeModel({
    // model: 'gemini-pro',
    model: 'gemini-1.5-flash',
  });

  private async generateJSON(prompt: string) {
    let exit = false;
    let contents = null;
    let attempts = 5;

    while (!exit && attempts-- > 0) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        contents = JSON.parse(response.text());

        // const completion = await this.openai.chat.completions.create({
        //   messages: [
        //     { role: "user", content: prompt },
        //   ],
        //   model: "gpt-3.5-turbo",
        // TODO: cambiar a json_object cuando se actualice los prompts
        // response_format: { type: "json_object" },
        // });

        // contents = JSON.parse(completion.choices[0].message.content);

        exit = true;
      } catch (err) {
        this.logger.error(err.message, err.stack, AiService.name);
      }
    }

    if (!contents) {
      throw new InternalServerErrorException('No se pudo generar el contenido');
    }

    return contents;
  }

  async generateReadingService(params: GenerateReadingDto) {
    const prompt = generateReading2(params);
    return await this.generateJSON(prompt);
  }

  async generateGeneralReadingService(params: GenerateGeneralReadingDto) {
    const prompt = generateReading(params);
    return await this.generateJSON(prompt);
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
        break;
      case TypeActivity.CROSSWORD:
        prompt = generateCrossword(params);
        break;
      default:
        this.logger.warn(
          `Tipo de actividad no soportado: ${type}`,
          AiService.name,
        );
        break;
    }

    if (!prompt) {
      throw new InternalServerErrorException('Tipo de actividad no soportado');
    }

    return await this.generateJSON(prompt);
  }

  async determineTypeActivities(params: GenerateQuestionsActivitiesDto) {
    const prompt = getTypeActivities(params);
    return await this.generateJSON(prompt);
  }

  async generateRecommendationForQuestionsActivitiesService(
    params: generateRecommendationForQuestionsActivitiesDto,
  ) {
    const prompt = generateRecommendationForQuestionsActivities(params);
    return await this.generateJSON(prompt);
  }
}
