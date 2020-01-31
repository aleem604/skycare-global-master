import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {Company} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CompanyRepository extends DefaultCrudRepository<
  Company,
  typeof Company.prototype.companyID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(Company, dataSource);
  }
}
