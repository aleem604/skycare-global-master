import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {CompanyCase} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CompanyCaseRepository extends DefaultCrudRepository<
  CompanyCase,
  typeof CompanyCase.prototype.caseID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(CompanyCase, dataSource);
  }
}
