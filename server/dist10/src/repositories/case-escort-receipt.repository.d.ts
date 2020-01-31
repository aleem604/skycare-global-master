import { DefaultCrudRepository } from '@loopback/repository';
import { CaseEscortReceipt } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CaseEscortReceiptRepository extends DefaultCrudRepository<CaseEscortReceipt, typeof CaseEscortReceipt.prototype.receiptID> {
    constructor(dataSource: CloudantDataSource);
}
