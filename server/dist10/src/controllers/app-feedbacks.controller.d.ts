import { Filter } from '@loopback/repository';
import { AppFeedback } from '../models';
import { AppFeedbackRepository } from '../repositories';
export declare class AppFeedbacksController {
    appFeedbackRepository: AppFeedbackRepository;
    constructor(appFeedbackRepository: AppFeedbackRepository);
    create(appFeedback: AppFeedback): Promise<AppFeedback>;
    find(filter?: Filter): Promise<AppFeedback[]>;
}
