import { Filter } from '@loopback/repository';
import { Request, Response } from "express-serve-static-core";
import { UserProfile } from '@loopback/authentication';
import { CaseEscortReceipt } from '../models';
import { CaseEscortReceiptRepository, CompanyCaseRepository } from '../repositories';
import * as multer from 'multer';
export declare class CaseEscortReceiptsController {
    private user;
    caseRepository: CompanyCaseRepository;
    caseEscortReceiptRepository: CaseEscortReceiptRepository;
    private secureDocStorage;
    constructor(user: UserProfile, caseRepository: CompanyCaseRepository, caseEscortReceiptRepository: CaseEscortReceiptRepository);
    create(companyID: string, caseID: string, caseEscortReceipt: CaseEscortReceipt): Promise<CaseEscortReceipt>;
    addCaseEscortReceiptToSecureStorage(companyID: string, caseID: string, receiptID: string, request: Request, response: Response): Promise<CaseEscortReceipt>;
    find(companyID: string, caseID: string, filter?: Filter): Promise<CaseEscortReceipt[]>;
    findById(companyID: string, caseID: string, receiptID: string): Promise<CaseEscortReceipt>;
    getCaseEscortReceiptFromSecureStorage(companyID: string, caseID: string, receiptID: string, archivedCase: boolean | undefined, response: Response): Promise<boolean>;
    updateById(companyID: string, caseID: string, receiptID: string, caseEscortReceipt: CaseEscortReceipt): Promise<void>;
    updateCaseEscortReceiptInSecureStorage(companyID: string, caseID: string, receiptID: string, request: Request, response: Response): Promise<CaseEscortReceipt>;
    deleteCaseEscortReceiptFromSecureStorage(companyID: string, caseID: string, receiptID: string): Promise<void>;
    ensureEscortReceiptMatchesCaseID(caseEscortReceipt: CaseEscortReceipt, caseID: string): void;
    provisionUploadHandler(): multer.Instance;
}
