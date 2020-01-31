import { Filter } from '@loopback/repository';
import { Request, Response } from "express-serve-static-core";
import { UserProfile } from '@loopback/authentication';
import { EscortDocument } from '../models';
import { EscortDocumentRepository, EscortRepository } from '../repositories';
import * as multer from 'multer';
export declare class EscortDocumentsController {
    private user;
    escortRepository: EscortRepository;
    escortDocumentRepository: EscortDocumentRepository;
    private secureDocStorage;
    constructor(user: UserProfile, escortRepository: EscortRepository, escortDocumentRepository: EscortDocumentRepository);
    create(escortID: string, escortDocument: EscortDocument): Promise<EscortDocument>;
    addEscortDocumentToSecureStorage(escortID: string, documentID: string, request: Request, response: Response): Promise<EscortDocument>;
    find(escortID: string, filter?: Filter): Promise<EscortDocument[]>;
    findById(escortID: string, documentID: string): Promise<EscortDocument>;
    getEscortDocumentFromSecureStorage(escortID: string, documentID: string, response: Response): Promise<boolean>;
    updateById(escortID: string, documentID: string, escortDocument: EscortDocument): Promise<void>;
    updateEscortDocumentInSecureStorage(escortID: string, documentID: string, request: Request, response: Response): Promise<EscortDocument>;
    ensureJWTMatchesEscortID(userID: string, escortID: string): Promise<void>;
    provisionUploadHandler(): multer.Instance;
}
