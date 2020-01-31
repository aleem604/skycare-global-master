import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {CasePatientProgress} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CasePatientProgressRepository extends DefaultCrudRepository<
  CasePatientProgress,
  typeof CasePatientProgress.prototype.caseID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(CasePatientProgress, dataSource);
  }
}
