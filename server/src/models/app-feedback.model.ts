import {Entity, model, property} from '@loopback/repository';

@model()
export class AppFeedback extends Entity {

  @property({ type: 'string', id: true, required: true })       feedbackID: string;

  @property({ type: 'string', required: true })                 userID: string;
  @property({ type: 'string', required: true })                 username: string;
  @property({ type: 'string', required: true })                 email: string;
  @property({ type: 'date', required: true })                   submittedDate: string;
  @property({ type: 'string', required: true })                 message: string;

  constructor(data?: Partial<AppFeedback>) {
    super(data);
  }
}
