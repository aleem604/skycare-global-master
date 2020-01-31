import { Filter } from '@loopback/repository';
import { Request, Response } from "express-serve-static-core";
import { UserProfile } from '@loopback/authentication';
import { CaseDocument } from '../models';
import { CaseDocumentRepository, CompanyCaseRepository } from '../repositories';
import * as multer from 'multer';
export declare class CaseDocumentsController {
    private user;
    caseRepository: CompanyCaseRepository;
    caseDocumentRepository: CaseDocumentRepository;
    private secureDocStorage;
    constructor(user: UserProfile, caseRepository: CompanyCaseRepository, caseDocumentRepository: CaseDocumentRepository);
    create(companyID: string, caseID: string, caseDocument: CaseDocument): Promise<CaseDocument>;
    addCaseDocumentToSecureStorage(companyID: string, caseID: string, documentID: string, request: Request, response: Response): Promise<CaseDocument>;
    find(companyID: string, caseID: string, filter?: Filter): Promise<CaseDocument[]>;
    findById(companyID: string, caseID: string, documentID: string): Promise<CaseDocument>;
    getCaseDocumentFromSecureStorage(companyID: string, caseID: string, documentID: string, archivedCase: boolean | undefined, response: Response): Promise<boolean>;
    updateById(companyID: string, caseID: string, documentID: string, caseDocument: CaseDocument): Promise<void>;
    updateCaseDocumentInSecureStorage(companyID: string, caseID: string, documentID: string, request: Request, response: Response): Promise<CaseDocument>;
    deleteCaseDocumentFromSecureStorage(companyID: string, caseID: string, documentID: string): Promise<void>;
    ensureDocumentMatchesCaseID(caseDocument: CaseDocument, caseID: string): void;
    provisionUploadHandler(): multer.Instance;
}
