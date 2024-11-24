import { ENVIRONMENT } from '@/shared/constants/environment';
import { Injectable } from '@nestjs/common';
import { ConfigDto } from '../dtos/config.dto';

@Injectable()
export class AdminService {
    getConfig() {
        return {
            data: {
                modelText: ENVIRONMENT.MODEL_TEXT,
                modelImage: ENVIRONMENT.MODEL_IMAGE,
                bucketName: ENVIRONMENT.BUCKET_NAME,
            }
        }
    }

    updateConfig(config: ConfigDto) {
        if (config.modelText) {
            ENVIRONMENT.MODEL_TEXT = config.modelText;
        }

        if (config.modelImage) {
            ENVIRONMENT.MODEL_IMAGE = config.modelImage;
        }

        if (config.bucketName) {
            ENVIRONMENT.BUCKET_NAME = config.bucketName;
        }

        if (config.apiKey) {
            ENVIRONMENT.API_KEY_OPENAI = config.apiKey;
        }

        if (config.firebaseKey) {
            ENVIRONMENT.FIREBASE_CONFIG = config.firebaseKey;
        }

        return {
            message: 'Config updated successfully',
        }
    }
}
