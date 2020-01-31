import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {CredentialReset} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CredentialResetRepository extends DefaultCrudRepository<
  CredentialReset,
  typeof CredentialReset.prototype.credentialResetID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(CredentialReset, dataSource);
  }
}
