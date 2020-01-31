import { DefaultCrudRepository } from '@loopback/repository';
import { CaseMessage } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CaseMessageRepository extends DefaultCrudRepository<CaseMessage, typeof CaseMessage.prototype.messageID> {
    constructor(dataSource: CloudantDataSource);
}
