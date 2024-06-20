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
  generateVerificationOpenAnswers,
  generateYesOrNot,
  getTypeActivities,
} from '@/ai/prompts/readings-prompts';
import {
  GenerateGeneralReadingDto,
  GenerateQuestionsActivitiesDto,
  GenerateReadingDto,
  generateRecommendationForQuestionsActivitiesDto,
} from '@/ai/ai.dto';
import { TypeActivity, TypeMultimedia } from '@prisma/client';
import OpenAI from 'openai';
import { generatePromptForFrontPage } from '@/ai/prompts/images-prompts';
import { MultimediaService } from '@/multimedia/services/multimedia.service';

@Injectable()
export class AiService {
  constructor(
    private readonly logger: Logger,
    private multimedia: MultimediaService,
  ) {}

  openai = new OpenAI();
  genAI = new GoogleGenerativeAI(ENVIRONMENT.API_KEY_AI);

  model = this.genAI.getGenerativeModel({
    // model: 'gemini-pro',
    model: 'gemini-1.5-flash',
  });

  private async generateJSON(prompt: string) {
    let contents = null;
    let attempts = 5;

    while (!contents && attempts-- > 0) {
      try {
        // const result = await this.model.generateContent(prompt);
        // const response = result.response;
        // contents = JSON.parse(response.text());

        const completion = await this.openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-3.5-turbo',
          response_format: { type: 'json_object' },
        });
        // console.log(completion);
        contents = JSON.parse(completion.choices[0].message.content);
      } catch (err) {
        this.logger.error(err.message, err.stack, AiService.name);
      }
    }

    if (!contents) {
      throw new InternalServerErrorException('No se pudo generar el contenido');
    }

    return contents;
  }

  private async generateText(prompt: string) {
    let textGenerated = null;
    let attempts = 5;
    while (!textGenerated && attempts-- > 0) {
      try {
        const completion = await this.openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-3.5-turbo',
        });

        textGenerated = completion.choices[0].message.content;
      } catch (err) {
        this.logger.error(err.message, err.stack, AiService.name);
      }
    }

    if (!textGenerated) {
      throw new InternalServerErrorException('No se pudo generar el texto');
    }

    return textGenerated;
  }

  private async generateImage(prompt: string, base64: boolean = true) {
    let attempts = 5;
    let imageGenerated = null;
    while (!imageGenerated && attempts-- > 0) {
      try {
        const response = await this.openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          response_format: base64 ? 'b64_json' : 'url',
          quality: 'standard',
        });

        imageGenerated = base64
          ? response.data[0].b64_json
          : response.data[0].url;
      } catch (err) {
        this.logger.error(err.message, err.stack, AiService.name);
      }
    }

    if (!imageGenerated) {
      throw new InternalServerErrorException('No se pudo generar la imagen');
    }

    let imageId = '';
    if (base64) {
      imageId = (
        await this.multimedia.createMultimediaFromBase64(imageGenerated, {
          type: TypeMultimedia.IMAGE,
          description: 'Imagen generada por IA',
        })
      ).data[0].id;
    } else
      imageId = (
        await this.multimedia.uploadUrl({
          url: imageGenerated,
          type: TypeMultimedia.IMAGE,
          description: 'Imagen generada por IA',
        })
      ).data.id;

    return imageId;
  }

  async generateReadingService(params: GenerateReadingDto) {
    const prompt = generateReading2(params);
    return (await this.generateJSON(prompt)).contents;
  }

  async generateGeneralReadingService(params: GenerateGeneralReadingDto) {
    const prompt = generateReading(params);
    return (await this.generateJSON(prompt)).contents;
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

    return (await this.generateJSON(prompt)).questions;
  }

  async determineTypeActivities(params: GenerateQuestionsActivitiesDto) {
    const prompt = getTypeActivities(params);
    return (await this.generateJSON(prompt)).typeActivities;
  }

  async generateRecommendationForQuestionsActivitiesService(
    params: generateRecommendationForQuestionsActivitiesDto,
  ) {
    const prompt = generateRecommendationForQuestionsActivities(params);
    return (await this.generateJSON(prompt)).recommendation;
  }

  async generateVerificationOpenTextOrAnswerService(
    params: generateRecommendationForQuestionsActivitiesDto,
  ) {
    const prompt = generateVerificationOpenAnswers(params);
    return (await this.generateJSON(prompt)).isCorrect == 'true' ? true : false;
  }

  async generateFrontPage(reading: string) {
    const prompt = generatePromptForFrontPage(reading);
    return { data: await this.generateImage(await this.generateText(prompt)) };
  }
}
