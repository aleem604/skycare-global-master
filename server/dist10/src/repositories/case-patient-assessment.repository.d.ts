import { DefaultCrudRepository } from '@loopback/repository';
import { CasePatientAssessment } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CasePatientAssessmentRepository extends DefaultCrudRepository<CasePatientAssessment, typeof CasePatientAssessment.prototype.caseID> {
    constructor(dataSource: CloudantDataSource);
}
