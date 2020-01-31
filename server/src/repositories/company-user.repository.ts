import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {CompanyUser} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CompanyUserRepository extends DefaultCrudRepository<
  CompanyUser,
  typeof CompanyUser.prototype.companyUserID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(CompanyUser, dataSource);
  }
}
