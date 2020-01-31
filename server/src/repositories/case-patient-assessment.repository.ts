import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {CasePatientAssessment} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CasePatientAssessmentRepository extends DefaultCrudRepository<
  CasePatientAssessment,
  typeof CasePatientAssessment.prototype.caseID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(CasePatientAssessment, dataSource);
  }
}
