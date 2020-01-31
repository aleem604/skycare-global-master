import { DefaultCrudRepository } from '@loopback/repository';
import { CompanyUser } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class CompanyUserRepository extends DefaultCrudRepository<CompanyUser, typeof CompanyUser.prototype.companyUserID> {
    constructor(dataSource: CloudantDataSource);
}
