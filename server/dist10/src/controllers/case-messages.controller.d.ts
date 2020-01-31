import { Filter } from '@loopback/repository';
import { CaseMessage } from '../models';
import { CaseMessageRepository, CompanyCaseRepository, CompanyRepository } from '../repositories';
import { UserProfile } from '@loopback/authentication';
export declare class CaseMessagesController {
    private user;
    caseMessageRepository: CaseMessageRepository;
    companyCaseRepository: CompanyCaseRepository;
    companyRepository: CompanyRepository;
    constructor(user: UserProfile, caseMessageRepository: CaseMessageRepository, companyCaseRepository: CompanyCaseRepository, companyRepository: CompanyRepository);
    create(companyID: string, caseID: string, caseMessage: CaseMessage): Promise<CaseMessage>;
    find(companyID: string, caseID: string, filter?: Filter): Promise<CaseMessage[]>;
    sendNewCaseMessageEmail(caseNumber: string, newMessage: CaseMessage, emailAddresses: string[]): void;
}
