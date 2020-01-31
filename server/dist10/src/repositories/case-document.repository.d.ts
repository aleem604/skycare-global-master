import { DefaultCrudRepository } from '@loopback/repository';
import { CaseDocument } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CaseDocumentRepository extends DefaultCrudRepository<CaseDocument, typeof CaseDocument.prototype.documentID> {
    constructor(dataSource: CloudantDataSource);
}
