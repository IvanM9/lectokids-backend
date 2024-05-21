import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GoogleGenerativeAI } = require('@google/generative-ai');
import { ENVIRONMENT } from '@/shared/constants/environment';
import { generateReading2 } from '@/ai/prompts';
import { GenerateReadingDto } from '@/ai/ai.dto';
@Injectable()
export class AiService {
  genAI = new GoogleGenerativeAI(ENVIRONMENT.API_KEY_AI);
  // getContentsReadingFunction = {
  //   name: 'getContentsReading',
  //   description: 'Get the contents of a reading for a student',
  //   parameters: {
  //     type: 'ARRAY',
  //     items: {
  //       type: 'object',
  //       properties: {
  //         content: { type: 'string', description: 'Content of the reading' },
  //         page: { type: 'number', description: 'Page number' },
  //       },
  //       required: ['content', 'page'],
  //     },
  //   },
  // };

  model = this.genAI.getGenerativeModel({
    model: 'gemini-pro',
    // model: 'gemini-1.5-pro-latest',
    // tools: {
    //   functionDeclarations: [this.getContentsReadingFunction],
    // },
  });

  async generateReadingService(params: GenerateReadingDto) {
    const prompt = generateReading2(params);

    try {
      // const result = await this.model.generateContent({
      //   contents: [{ role: 'user', parts: [{ text: prompt }] }],
      //   generationConfig: {
      //     responseMimeType: 'application/json',
      //   },
      // });
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      // return response.functionCalls()[0];
      return response.text();
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al generar contenido');
    }
  }
}
