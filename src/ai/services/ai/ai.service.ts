import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENVIRONMENT } from '@/shared/constants/environment';
import { generateReading } from '@/ai/prompts';
import { GenerateReadingDto } from '@/ai/ai.dto';
@Injectable()
export class AiService {
  genAI = new GoogleGenerativeAI(ENVIRONMENT.API_KEY_AI);
  model = this.genAI.getGenerativeModel({
    model: 'gemini-pro',
    generationConfig: { maxOutputTokens: 500000 },
  });

  async generateReadingService(params: GenerateReadingDto) {
    const prompt = generateReading(params);

    const result = await this.model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }
}
