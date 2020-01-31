import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {ReadOnlyUser} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ReadOnlyUserRepository extends DefaultCrudRepository<
  ReadOnlyUser,
  typeof ReadOnlyUser.prototype.externalAccessID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(ReadOnlyUser, dataSource);
  }
}
