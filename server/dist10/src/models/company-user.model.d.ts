import { Entity } from '@loopback/repository';
import { User, Company } from '.';
export declare class CompanyUser extends Entity {
    companyUserID: string;
    companyID: string;
    userID: string;
    lastLogin: string;
    user?: User;
    company?: Company;
    constructor(data?: Partial<CompanyUser>);
}
