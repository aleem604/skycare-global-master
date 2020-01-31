import { Injectable } from '@angular/core';
import { 
  CompanyCasesControllerService, 
  CompanyCase, 
  CaseStatusChange,
  Filter,
  CaseMessagesControllerService,
  CaseMessage,
  CasePatientAssessment,
  CasePatientProgress,
  CasePatientAssessmentsControllerService,
  CasePatientProgressesControllerService,
  EscortLocation} from '../apiClient';
import { Observable, BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { Buffer } from 'buffer';
import { BaseService } from '../base.service';
import { NetworkMonitoringService } from '../netmon.service';

import * as JWTDecode from 'jwt-decode';
import Dexie from 'dexie';


const ACCESS_TOKEN_KEY : string = 'ACCESS_TOKEN';


@Injectable({
  providedIn: 'root'
})
export class CaseService extends BaseService {

  constructor(
    private caseService : CompanyCasesControllerService,
    private messageService : CaseMessagesControllerService,
    private assessmentService : CasePatientAssessmentsControllerService,
    private progressService : CasePatientProgressesControllerService,
    public readonly netmonService : NetworkMonitoringService
  ) {
    super(netmonService, 'activeCases');
  }

  createCase(companyID : string, newCase : CompanyCase) : Observable<CompanyCase> {
    newCase.caseID = this.createUUID62();
    newCase.currentStatus = 'New Case Created';
    newCase.statusChanges.push({
      oldStatus : '',
      newStatus : 'New Case Created',
      date : (new Date()).toISOString()
    } as CaseStatusChange);
    return this.caseService.companiesCompanyIDCasesPost(companyID, newCase);    
  }

  async getAllActiveCases(companyID?: string) : Promise<Observable<any[]>> {
    let onlineRequest : ()=>Observable<any> = ()=>{
      let caseFilter : string = JSON.stringify({where:{currentStatus:{neq:'ARCHIVED'}}});

      return this.caseService.companyCasesGet(caseFilter, companyID).pipe( 
        map((cases: CompanyCase[]) => {
          console.log('INFO: Data requested in online mode from the server');
          console.log(cases);
          let returnData : CompanyCase[] = cases.filter( (v,i,l) => { return v.invoiceSent != true; })
          console.log(returnData);
          return returnData;
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.currentStatus != 'ARCHIVED' && v.invoiceSent != true; });
      console.log('INFO: Data requested in offline mode from the cache');
      console.log(filteredData);
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.caseID; })};

    return await this.getCacheableData(onlineRequest, offlineRequest, keyIndexer);
  }

  getUnpaidEscortCases() : Observable<CompanyCase[]> {
    return this.caseService.getUnpaidEscortCases();
  }

  getArchivedCases() : Observable<CompanyCase[]> {
    return this.caseService.getArchivedCases();
  }

  markEscortPaid(caseID : string, escortID : string) : Observable<boolean> {
    return this.caseService.markCaseEscortPaid(caseID, escortID);
  }

  getCaseReceivables() : Observable<CompanyCase[]> {
    return this.caseService.getCaseReceivables();
  }

  markCasePaid(caseID : string) : Observable<boolean> {
    return this.caseService.markCasePaid(caseID);
  }

  async getCase(companyID : string, caseID : string) : Promise<Observable<any[]>> {

    let onlineRequest : ()=>Observable<any> = ()=>{
      return this.caseService.companiesCompanyIDCasesCaseIDGet(companyID, caseID);
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.caseID == caseID; });
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.caseID; })};

    return await this.getCacheableData(onlineRequest, offlineRequest, keyIndexer);
  }

  getPublicCase(externalAccessID : string) : Observable<CompanyCase> {
    return this.caseService.publicCasesExternalAccessIDGet(externalAccessID, 'response').pipe(
      map((caseResponse:HttpResponse<CompanyCase>) => {

        // Make sure the 'Authorization' header is in the response
        if (caseResponse.headers.has('Authorization')) {
          let authorizationResponse : string = caseResponse.headers.get('Authorization');
          let jwt : string = authorizationResponse.substr(authorizationResponse.indexOf(' ') + 1);
          
          // Store the JWT in localStorage
          localStorage.setItem(ACCESS_TOKEN_KEY, jwt);
        }

        return (caseResponse.body as CompanyCase);
      }),
      catchError((err:any,caught:any) => {
        if (err.status == 401) {
          return of(null);
        } else {
          console.log(err);
          return of(null);
        }
      })
    );
  }

  async getCaseMessages(caseID : string) : Promise<Observable<any[]>> {

    let onlineRequest : ()=>Observable<any> = ()=>{
      return this.messageService.caseMessagesGet(caseID);
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.caseID == caseID; });
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.messageID; })};

    return await this.getCacheableData(onlineRequest, offlineRequest, keyIndexer, 'caseMessages');
  }

  getPatientAssessment(caseID : string) : Observable<CasePatientAssessment> {
    return this.assessmentService.getPatientAssessment(caseID).pipe(
      map( (returnPatientAssessments:CasePatientAssessment[]) => {
        if (returnPatientAssessments.length > 0) {
          return returnPatientAssessments[0];
        } else {
          return null;
        }
      })
    );
  }

  async getPatientProgress(caseID : string) : Promise<Observable<any[]>> {
    let onlineRequest : ()=>Observable<any> = ()=>{
      return this.progressService.getPatientProgress(caseID).pipe(
        map( (returnPatientPrgresses:CasePatientProgress[]) => {
          if (returnPatientPrgresses.length > 0) {
            return returnPatientPrgresses[0];
          } else {
            return null;
          }
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.caseID == caseID; });
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.patientProgressID; })};

    return await this.getCacheableData(onlineRequest, offlineRequest, keyIndexer, 'progressNotes');
  }



  updateCase(companyID : string, caseID : string, modifiedCase : CompanyCase, sendEmailNotice : boolean = false, emailNoticeComments : string = '') : Observable<boolean> {
    return this.caseService.companiesCompanyIDCasesCaseIDPatch(companyID, caseID, modifiedCase, sendEmailNotice, emailNoticeComments).pipe(
      map( (updateResponse : any) => {
        return (updateResponse != undefined && updateResponse != null);
      }),
      catchError((err) => {
        // Error response from the server, indicate that save failed (return false)
        console.log(err);
        return of(false);
      })
    );
  }

  updatePatientAssessment(caseID : string, modifiedAssessment : CasePatientAssessment) : Observable<CasePatientAssessment> {
    if (modifiedAssessment.patientAssessmentID == null || modifiedAssessment.patientAssessmentID == '') {
      modifiedAssessment.patientAssessmentID = this.createUUID62();
      return this.assessmentService.postPatientAssessment(caseID, modifiedAssessment);
    } else {
      return this.assessmentService.patchPatientAssessment(caseID, modifiedAssessment).pipe(
        map( (updateResponse : any) => { return modifiedAssessment; })
      );
    }
  }

  updatePatientProgress(caseID : string, modifiedProgress : CasePatientProgress) : Observable<CasePatientProgress> {
    // Create a generic cache insertion command for online and offline modes
    console.log('Starting a patient progress update');
    let insertCommand : (table:Dexie.Table<any,string>)=>Promise<void> = async (table)=>{ 
      console.log('Running the offline table insert command');
      let ppCount : number = await table.where('patientProgressID').equals(modifiedProgress.patientProgressID).count();
      if (ppCount == 0) {
        console.log('Could not find the progress note in the offline table....adding it');
        await table.add(modifiedProgress); 
      } else {
        console.log('Found the progress note in the offline table....updating it');
        await table.put(modifiedProgress);
      }
    };

    // Attempt to update the server with our changes
    if (modifiedProgress.patientProgressID == null || modifiedProgress.patientProgressID == '') {
      console.log('Patient progress has not been started....starting it');
      modifiedProgress.patientProgressID = this.createUUID62();
      return this.progressService.postPatientProgress(caseID, modifiedProgress).pipe(
        map((pp:CasePatientProgress,i:number)=>{
          console.log('Patient progress update sent to server...got a response');
          this.addDataToCache(insertCommand, 'progressNotes').then(success=>{return;});
          return pp;
        }),
        catchError((err)=>{
          console.log('ERROR: Failed to create a new progress note.', err);
          this.addDataToCache(insertCommand, 'progressNotes').then(success=>{return;});
          return of(modifiedProgress);
        })
      );
    } else {
      console.log('Patient progress has been started....adding to it');
      return this.progressService.patchPatientProgress(caseID, modifiedProgress).pipe(
        map( (updateResponse : any) => { 
          console.log('Patient progress update sent to server...got a response');
          console.log(updateResponse);
          this.addDataToCache(insertCommand, 'progressNotes').then(success=>{return;});
          return modifiedProgress; 
        }),
        catchError((err)=>{
          console.log('ERROR: Failed to update an existing progress note.', err);
          this.addDataToCache(insertCommand, 'progressNotes').then(success=>{return;});
          return of(modifiedProgress);
        })
      );
    }



    /*
    let insertCommand : (table:Dexie.Table<any,string>)=>Promise<void> = async (table)=>{ 
      let ppCount : number = await table.where('patientProgressID').equals(pp.patientProgressID).count();
      if (ppCount == 0) {
        await table.add(pp); 
      }
    };
    this.addDataToCache(insertCommand, 'progressNotes').then(success=>{return;});
    */

  }

  
}
