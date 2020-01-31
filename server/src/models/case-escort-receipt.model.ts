import {Entity, model, property} from '@loopback/repository';

@model()
export class CaseEscortReceipt extends Entity {

  @property({ type: 'string', required: true, id: true })     receiptID: string;
  @property({ type: 'string', required: true })               caseID: string;
  @property({ type: 'string', required: true })               escortID: string;
  @property({ type: 'string', required: true })               name: string;
  @property({ type: 'date',   required: true })               createDate: string;

  @property({ type: 'string' })                               alternateName?: string;
  @property({ type: 'string' })                               storageHash?: string;
  @property({ type: 'string' })                               currencyType?: string;
  @property({ type: 'number' })                               amount?: number;
  @property({ type: 'date' })                                 receiptDate?: string;
  @property({ type: 'number' })                               usdAmount?: number;

  constructor(data?: Partial<CaseEscortReceipt>) {
    super(data);
  }

}
