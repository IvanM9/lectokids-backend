import { Controller, Patch, Param } from '@nestjs/common';
import { QuestionsActivitiesService } from '../services/questions-activities.service';

@Controller('questions-activities')
export class QuestionsActivitiesController {
    constructor(private service: QuestionsActivitiesService) {}

    @Patch('status/:questionActivityId')
    async updateStatusQuestionActivity(
        @Param('questionActivityId') questionActivityId: string,
    ) {
        return await this.service.updateStatusQuestionActivity(
            questionActivityId,
        );
    }
}
