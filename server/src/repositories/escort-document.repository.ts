import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {EscortDocument} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class EscortDocumentRepository extends DefaultCrudRepository<
  EscortDocument,
  typeof EscortDocument.prototype.documentID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(EscortDocument, dataSource);
  }
}
