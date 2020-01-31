import {Entity, model, property} from '@loopback/repository';

@model()
export class Company extends Entity {

  @property({ type: 'string', id: true, required: true })           companyID: string;

  @property({ type: 'string', required: true })                     name: string;
  @property({ type: 'string', required: true })                     emailForInvoices: string;

  @property({ type: 'string' })                                     emailForUpdates1?: string;
  @property({ type: 'string' })                                     emailForUpdates2?: string;
  @property({ type: 'string' })                                     emailForUpdates3?: string;

  

  constructor(data?: Partial<Company>) {
    super(data);
  }
}
