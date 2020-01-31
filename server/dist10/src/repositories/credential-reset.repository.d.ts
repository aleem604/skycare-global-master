import { DefaultCrudRepository } from '@loopback/repository';
import { CredentialReset } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CredentialResetRepository extends DefaultCrudRepository<CredentialReset, typeof CredentialReset.prototype.credentialResetID> {
    constructor(dataSource: CloudantDataSource);
}
