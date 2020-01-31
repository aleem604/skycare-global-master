import { Filter } from '@loopback/repository';
import { CasePatientProgress } from '../models';
import { CasePatientProgressRepository } from '../repositories';
export declare class CasePatientProgressesController {
    casePatientProgressRepository: CasePatientProgressRepository;
    constructor(casePatientProgressRepository: CasePatientProgressRepository);
    create(companyID: string, caseID: string, casePatientProgress: CasePatientProgress): Promise<CasePatientProgress>;
    find(companyID: string, caseID: string, filter?: Filter): Promise<CasePatientProgress[]>;
    update(companyID: string, caseID: string, casePatientProgress: CasePatientProgress): Promise<boolean>;
}
