import { Entity } from '@loopback/repository';
export declare class AppFeedback extends Entity {
    feedbackID: string;
    userID: string;
    username: string;
    email: string;
    submittedDate: string;
    message: string;
    constructor(data?: Partial<AppFeedback>);
}
