import { Count, Filter, Where } from '@loopback/repository';
import { CompanyUser } from '../models';
import { CompanyUserRepository, UserRepository, CompanyRepository } from '../repositories';
export declare class CompanyUsersController {
    companyUserRepository: CompanyUserRepository;
    companyRepository: CompanyRepository;
    userRepository: UserRepository;
    constructor(companyUserRepository: CompanyUserRepository, companyRepository: CompanyRepository, userRepository: UserRepository);
    create(companyUser: CompanyUser): Promise<CompanyUser>;
    count(where?: Where): Promise<Count>;
    find(filter?: Filter): Promise<CompanyUser[]>;
    updateAll(companyUser: CompanyUser, where?: Where): Promise<Count>;
    findById(id: string): Promise<CompanyUser>;
    updateById(id: string, companyUser: CompanyUser): Promise<void>;
    deleteById(id: string): Promise<void>;
}
