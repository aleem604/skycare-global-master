import { Socket } from 'socket.io';
import { CaseMessage } from '../models';
import { CaseMessageRepository, CompanyCaseRepository, CompanyRepository } from '../repositories';
export declare class CaseMessagesWSController {
    private socket;
    caseMessageRepository: CaseMessageRepository;
    companyCaseRepository: CompanyCaseRepository;
    companyRepository: CompanyRepository;
    constructor(socket: Socket, caseMessageRepository: CaseMessageRepository, companyCaseRepository: CompanyCaseRepository, companyRepository: CompanyRepository);
    connect(socket: Socket): void;
    disconnect(): void;
    logMessage(...args: any[]): void;
    handleCaseMessage(caseMessage: CaseMessage): void;
    sendNewCaseMessageEmail(caseNumber: string, newMessage: CaseMessage, emailAddresses: string[]): void;
}
