import { DefaultCrudRepository } from '@loopback/repository';
import { CasePatientProgress } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CasePatientProgressRepository extends DefaultCrudRepository<CasePatientProgress, typeof CasePatientProgress.prototype.caseID> {
    constructor(dataSource: CloudantDataSource);
}
