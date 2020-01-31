import { DefaultCrudRepository } from '@loopback/repository';
import { Company } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CompanyRepository extends DefaultCrudRepository<Company, typeof Company.prototype.companyID> {
    constructor(dataSource: CloudantDataSource);
}
