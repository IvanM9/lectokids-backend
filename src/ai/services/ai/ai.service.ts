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
  model = this.genAI.getGenerativeModel({
    model: 'gemini-pro',
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
      return response.text();
    } catch (error) {
      throw new InternalServerErrorException('Error al generar contenido');
    }
  }
}
