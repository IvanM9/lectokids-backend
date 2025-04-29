import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  generateAlphabetSoup,
  generateAlphabetSoupGeneral,
  generateCrossword,
  generateCrosswordGeneral,
  generateOpenAnswers,
  generateOpenAnswersGeneral,
  generateOpenText,
  generateOpenTextGeneral,
  generateQuiz,
  generateQuizGeneral,
  generateReading,
  generateReading2,
  generateReadingInformation,
  generateRecommendationForQuestionsActivities,
  generateVerificationOpenAnswers,
  generateYesOrNot,
  generateYesOrNotGeneral,
  getTypeActivities,
} from '@/ai/prompts/readings-prompts';
import {
  GenerateGeneralReadingDto,
  GenerateQuestionsActivitiesDto,
  GenerateReadingDto,
  generateRecommendationForQuestionsActivitiesDto,
} from '@/ai/ai.dto';
import { TypeActivity, TypeMultimedia } from '@prisma/client';
import { generatePromptForFrontPage } from '@/ai/prompts/images-prompts';
import { MultimediaService } from '@/multimedia/services/multimedia.service';
import { openai } from '@ai-sdk/openai';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  experimental_generateImage,
  generateObject,
  generateText,
  LanguageModelV1,
  NoImageGeneratedError,
  ImageModel,
} from 'ai';
import { z, Schema } from 'zod';
import { TextProviderAI } from '@/ai/enums/text-providers-ai.enum';
import aiConfig from '@/ai/config/ai.config';
import { ConfigType } from '@nestjs/config';
import { ImageProviderAI } from '@/ai/enums/image-providers-ai.enum';
import googleVertexConfig from '@/ai/config/providers/google-vertex.config';
import { createVertex } from '@ai-sdk/google-vertex';
import { googleVertexSchema } from '@/ai/config/providers/validators/google-vertex.validation';

@Injectable()
export class AiService {
  constructor(
    private readonly logger: Logger,
    private multimedia: MultimediaService,
    @Inject(aiConfig.KEY) private environment: ConfigType<typeof aiConfig>,
    @Inject(googleVertexConfig.KEY)
    private googleVertexEnv: ConfigType<typeof googleVertexConfig>,
  ) {
    switch (this.environment.textProviderAI) {
      case TextProviderAI.google:
        this.textModelAI = google(environment.modelText);
        break;

      case TextProviderAI.openAi:
        this.textModelAI = openai(environment.modelText);
        break;

      default:
        throw new InternalServerErrorException(
          'No hay un modelo de IA para generar texto',
        );
    }

    switch (this.environment.imageProviderAI) {
      case ImageProviderAI.google:
        googleVertexSchema.parse(process.env);

        const vertex = createVertex({
          googleAuthOptions: {
            credentials: {
              client_email: googleVertexEnv.email,
              private_key: googleVertexEnv.privateKey,
            },
          },
          location: googleVertexEnv.location,
          project: googleVertexEnv.project,
        });

        this.imageModelAI = vertex.imageModel(environment.modelImage);
        break;

      case ImageProviderAI.openAi:
        this.imageModelAI = openai.image(environment.modelImage);
        break;

      default:
        throw new InternalServerErrorException(
          'No hay un modelo de IA para generar imagenes',
        );
    }
  }

  textModelAI: LanguageModelV1;
  imageModelAI: ImageModel;

  activitiesSchema = z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        answers: z
          .array(
            z.object({
              answer: z.string().optional(),
              isCorrect: z.boolean().optional(),
            }),
          )
          .optional(),
      }),
    ),
  });

  generateContentSchema = z.object({
    contents: z.array(
      z.object({
        content: z.string(),
      }),
    ),
  });

  private async generateJSON(
    prompt: string,
    schema: Schema,
    temperature: number = 0,
  ) {
    const contents = (
      await generateObject({
        model: this.textModelAI,
        prompt,
        schema,
        maxRetries: 3,
        temperature,
      })
    ).object;

    return contents;
  }

  private async generateText(prompt: string) {
    let textGenerated = (
      await generateText({
        model: this.textModelAI,
        prompt,
        maxRetries: 3,
      }).catch((error) => {
        this.logger.error(error.message, error.stack, AiService.name);
        throw new InternalServerErrorException('No se pudo generar el texto');
      })
    ).text;

    return textGenerated;
  }

  private async generateImage(prompt: string) {
    const imageGenerated = await experimental_generateImage({
      model: this.imageModelAI,
      prompt,
      size: `${1024}x${1024}`,
      maxRetries: 3,
      n: 1,
    }).catch((error) => {
      if (NoImageGeneratedError.isInstance(error)) {
        console.log('NoImageGeneratedError');
        console.log('Responses:', error.responses);
      }

      this.logger.error(error.message, error, AiService.name);
      throw new InternalServerErrorException('No se pudo generar la imagen');
    });

    const imageId = (
      await this.multimedia.createMultimediaFromBuffer(
        Buffer.from(imageGenerated.image.base64, 'base64'),
        {
          type: TypeMultimedia.IMAGE,
          description: 'Imagen generada por IA',
          fileName: `image_generated_${Date.now()}.webp`,
        },
      )
    ).data[0].id;

    return imageId;
  }

  // async generateSpeechService(text: string) {
  //   const response = await this.openai.audio.speech.create({
  //     model: 'tts-1',
  //     voice: 'alloy',
  //     input: text,
  //   });

  //   const audioId = await this.multimedia.createMultimediaFromBuffer(
  //     Buffer.from(await response.arrayBuffer()),
  //     {
  //       type: TypeMultimedia.AUDIO,
  //       description: 'Audio generado por IA',
  //       fileName: `audio_generated_${Date.now()}.mp3`,
  //     },
  //   );
  //   return audioId.data[0].id;
  // }

  async generateReadingService(params: GenerateReadingDto) {
    const prompt = generateReading2(params);

    return (await this.generateJSON(prompt, this.generateContentSchema, 0.7))
      .contents;
  }

  async generateGeneralReadingService(params: GenerateGeneralReadingDto) {
    const prompt = generateReading(params);

    return (await this.generateJSON(prompt, this.generateContentSchema, 0.7))
      .contents;
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

    return (await this.generateJSON(prompt, this.activitiesSchema)).questions;
  }

  async generateGeneralQuizService(reading: string, type: TypeActivity) {
    let prompt = '';

    switch (type) {
      case TypeActivity.QUIZ:
        prompt = generateQuizGeneral(reading);
        break;
      case TypeActivity.ALPHABET_SOUP:
        prompt = generateAlphabetSoupGeneral(reading);
        break;
      case TypeActivity.OPEN_TEXT:
        prompt = generateOpenTextGeneral(reading);
        break;
      case TypeActivity.YES_NO:
        prompt = generateYesOrNotGeneral(reading);
        break;
      case TypeActivity.OPEN_ANSWERS:
        prompt = generateOpenAnswersGeneral(reading);
        break;
      case TypeActivity.CROSSWORD:
        prompt = generateCrosswordGeneral(reading);
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

    return (await this.generateJSON(prompt, this.activitiesSchema)).questions;
  }

  async determineTypeActivities(params: GenerateQuestionsActivitiesDto) {
    const prompt = getTypeActivities(params);
    const schema = z.object({
      typeActivities: z.array(
        z.object({
          activityType: z.enum(
            Object.values(TypeActivity) as [string, ...string[]],
          ),
        }),
      ),
    });

    return (await this.generateJSON(prompt, schema, 0.6)).typeActivities;
  }

  async generateRecommendationForQuestionsActivitiesService(
    params: generateRecommendationForQuestionsActivitiesDto,
  ) {
    const prompt = generateRecommendationForQuestionsActivities(params);
    const schema = z.object({
      recommendation: z.string(),
    });

    return (await this.generateJSON(prompt, schema)).recommendation;
  }

  async generateVerificationOpenTextOrAnswerService(
    params: generateRecommendationForQuestionsActivitiesDto,
  ) {
    const prompt = generateVerificationOpenAnswers(params);
    const schema = z.object({
      isCorrect: z.boolean(),
      recommendation: z.string(),
    });

    const scoreByAI = await this.generateJSON(prompt, schema);
    return scoreByAI;
  }

  async generateFrontPage(reading: string) {
    const prompt = generatePromptForFrontPage(reading);
    return { data: await this.generateImage(await this.generateText(prompt)) };
  }

  async generateReadingInformationService() {
    const prompt = generateReadingInformation();
    const schema = z.object({
      title: z.string(),
      objectives: z.string(),
    });

    return await this.generateJSON(prompt, schema, 0.9);
  }
}
