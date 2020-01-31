import { Filter } from '@loopback/repository';
import { CasePatientAssessment } from '../models';
import { CasePatientAssessmentRepository } from '../repositories';
export declare class CasePatientAssessmentsController {
    casePatientAssessmentRepository: CasePatientAssessmentRepository;
    constructor(casePatientAssessmentRepository: CasePatientAssessmentRepository);
    create(companyID: string, caseID: string, casePatientAssessment: CasePatientAssessment): Promise<CasePatientAssessment>;
    find(companyID: string, caseID: string, filter?: Filter): Promise<CasePatientAssessment[]>;
    updateAll(companyID: string, caseID: string, casePatientAssessment: CasePatientAssessment): Promise<boolean>;
}
