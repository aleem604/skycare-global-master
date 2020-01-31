import { Filter } from '@loopback/repository';
import { UserProfile } from '@loopback/authentication';
import { Company } from '../models';
import { CompanyRepository, UserRepository } from '../repositories';
export declare class CompaniesController {
    private user;
    companyRepository: CompanyRepository;
    userRepository: UserRepository;
    constructor(user: UserProfile, companyRepository: CompanyRepository, userRepository: UserRepository);
    find(filter?: Filter): Promise<Company[]>;
    findById(companyID: string): Promise<Company>;
    updateById(companyID: string, company: Company): Promise<boolean>;
}
