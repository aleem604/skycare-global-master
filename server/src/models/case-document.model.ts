import {Entity, model, property} from '@loopback/repository';

@model()
export class CaseDocument extends Entity {

  @property({ type: 'string', required: true, id: true })   documentID: string;

  @property({ type: 'string', required: true })             caseID: string;
  @property({ type: 'string', required: true })             type: string;
  @property({ type: 'string', required: true })             name: string;
  @property({ type: 'date', required: true })               createDate: string;

  @property({ type: 'string' })                             storageHash?: string;
  @property({ type: 'date' })                               modifyDate?: string;

  constructor(data?: Partial<CaseDocument>) {
    super(data);
  }
}
