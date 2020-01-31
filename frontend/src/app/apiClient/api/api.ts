


export * from './caseDocumentsController.service';
import { CaseDocumentsControllerService } from './caseDocumentsController.service';




export * from './caseEscortReceiptsController.service';
import { CaseEscortReceiptsControllerService } from './caseEscortReceiptsController.service';




export * from './caseMessagesController.service';
import { CaseMessagesControllerService } from './caseMessagesController.service';




export * from './casePatientProgressesController.service';
import { CasePatientProgressesControllerService } from './casePatientProgressesController.service';




export * from './casePatientAssessmentsController.service';
import { CasePatientAssessmentsControllerService } from './casePatientAssessmentsController.service';




export * from './companyCasesController.service';
import { CompanyCasesControllerService } from './companyCasesController.service';




export * from './companiesController.service';
import { CompaniesControllerService } from './companiesController.service';




export * from './companyUsersController.service';
import { CompanyUsersControllerService } from './companyUsersController.service';




export * from './escortDocumentsController.service';
import { EscortDocumentsControllerService } from './escortDocumentsController.service';




export * from './escortsController.service';
import { EscortsControllerService } from './escortsController.service';




export * from './usersController.service';
import { UsersControllerService } from './usersController.service';



export const APIS = [
    CaseDocumentsControllerService, 
    CaseEscortReceiptsControllerService, 
    CaseMessagesControllerService, 
    
    CasePatientAssessmentsControllerService,
    CasePatientProgressesControllerService,
    
    CompaniesControllerService, 
    CompanyUsersControllerService, 
    CompanyCasesControllerService, 
 
    EscortsControllerService, 
    EscortDocumentsControllerService,

    UsersControllerService
];

