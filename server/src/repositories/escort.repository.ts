import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {Escort} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class EscortRepository extends DefaultCrudRepository<
  Escort,
  typeof Escort.prototype.escortID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(Escort, dataSource);
  }
}
