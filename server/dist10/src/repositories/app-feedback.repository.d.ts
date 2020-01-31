import { DefaultCrudRepository } from '@loopback/repository';
import { AppFeedback } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class AppFeedbackRepository extends DefaultCrudRepository<AppFeedback, typeof AppFeedback.prototype.feedbackID> {
    constructor(dataSource: CloudantDataSource);
}
