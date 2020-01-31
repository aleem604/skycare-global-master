import { DefaultCrudRepository } from '@loopback/repository';
import { CompanyCase } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CompanyCaseRepository extends DefaultCrudRepository<CompanyCase, typeof CompanyCase.prototype.caseID> {
    constructor(dataSource: CloudantDataSource);
}
