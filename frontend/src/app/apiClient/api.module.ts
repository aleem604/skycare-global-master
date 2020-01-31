import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';




import { CaseDocumentsControllerService } from './api/caseDocumentsController.service';

import { CaseEscortReceiptsControllerService } from './api/caseEscortReceiptsController.service';

import { CaseMessagesControllerService } from './api/caseMessagesController.service';

import { CasePatientAssessmentsControllerService } from './api/casePatientAssessmentsController.service';

import { CasePatientProgressesControllerService } from './api/casePatientProgressesController.service';

import { CompanyCasesControllerService } from './api/companyCasesController.service';

import { CompaniesControllerService } from './api/companiesController.service';

import { CompanyUsersControllerService } from './api/companyUsersController.service';

import { EscortDocumentsControllerService } from './api/escortDocumentsController.service';

import { EscortsControllerService } from './api/escortsController.service';

import { UsersControllerService } from './api/usersController.service';



@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: [
    CaseDocumentsControllerService,
    CaseEscortReceiptsControllerService,
    CaseMessagesControllerService,
    CasePatientAssessmentsControllerService,
    CasePatientProgressesControllerService,
    CompanyCasesControllerService,
    CompaniesControllerService,
    CompanyUsersControllerService,
    EscortDocumentsControllerService,
    EscortsControllerService,
    UsersControllerService ]
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
