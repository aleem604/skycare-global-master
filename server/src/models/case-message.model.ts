import {Entity, model, property} from '@loopback/repository';

@model()
export class CaseMessage extends Entity {

  @property({ type: 'string', required: true, id: true })         messageID: string;

  @property({ type: 'string', required: true })                   caseID: string;
  @property({ type: 'string', required: true })                   senderID: string;
  @property({ type: 'date',   required: true })                   sendDate: string;
  @property({ type: 'string', required: true })                   message: string;

  constructor(data?: Partial<CaseMessage>) {
    super(data);
  }
}
