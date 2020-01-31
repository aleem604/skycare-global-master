import { DefaultCrudRepository } from '@loopback/repository';
import { ReadOnlyUser } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class ReadOnlyUserRepository extends DefaultCrudRepository<ReadOnlyUser, typeof ReadOnlyUser.prototype.externalAccessID> {
    constructor(dataSource: CloudantDataSource);
}
