import { DefaultCrudRepository } from '@loopback/repository';
import { EscortDocument } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class EscortDocumentRepository extends DefaultCrudRepository<EscortDocument, typeof EscortDocument.prototype.documentID> {
    constructor(dataSource: CloudantDataSource);
}
