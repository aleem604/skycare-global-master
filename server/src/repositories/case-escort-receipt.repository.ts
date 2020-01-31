import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {CaseEscortReceipt} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CaseEscortReceiptRepository extends DefaultCrudRepository<
  CaseEscortReceipt,
  typeof CaseEscortReceipt.prototype.receiptID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(CaseEscortReceipt, dataSource);
  }
}
