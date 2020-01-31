import { Injectable } from '@angular/core';
import { EscortDocument, 
         EscortDocumentsControllerService, 
         CaseDocument, 
         CaseDocumentsControllerService, 
         CaseEscortReceipt,
         CaseEscortReceiptsControllerService} from '../apiClient';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseService } from '../base.service';
import { NetworkMonitoringService } from '../netmon.service';
import Dexie from 'dexie';




@Injectable({
  providedIn: 'root'
})
export class DocumentsService extends BaseService {


  private DEFAULT_COMPANYID : string = 'UNKNOWN';


  constructor(private escortDocsService : EscortDocumentsControllerService,
              private caseDocsService : CaseDocumentsControllerService,
              private caseEscortReceiptsService : CaseEscortReceiptsControllerService,
              public readonly netmonService : NetworkMonitoringService) { 
    super(netmonService, 'caseDocuments');
  }


  getEscortDocuments(escortID : string) : Observable<EscortDocument[]> {
    return this.escortDocsService.escortsEscortIDDocumentsGet(escortID).pipe(
      map((escortDocs:EscortDocument[]|null|undefined) => {
        if (escortDocs == null || escortDocs == undefined || escortDocs.length == 0){
          return [];
        } else {
          return escortDocs;
        }
      }),
      catchError( (err:any) => {
        console.log(err);
        return throwError(new Error('Failed to retrieve EscortDocuments for the requested Escort. EscortID : ' + escortID));
      })
    );
  }


  getEscortDocumentsFlattened(escortID : string) : Observable<any> {
    return this.getEscortDocuments(escortID).pipe(
      map( (escortDocs:EscortDocument[]) => {
        let escortDocsFlattened : any = {};
        for (let i = 0; i < escortDocs.length; i++) { escortDocsFlattened[escortDocs[i].type] = escortDocs[i]; }
        return escortDocsFlattened;
      })
    )
  }


  updateEscortDocument(escortID : string, documentID : string, changedEscortDoc : EscortDocument) : Observable<EscortDocument> {
    return this.escortDocsService.escortsEscortIDDocumentsDocumentIDPatch(escortID, documentID, changedEscortDoc).pipe(
      map( (data : any) => { return changedEscortDoc; })
    );    
  }


  createEscortDocument(escortID : string, newEscortDoc : EscortDocument) : Observable<EscortDocument> {
    newEscortDoc.documentID = this.createUUID62();
    return this.escortDocsService.escortsEscortIDDocumentsPost(escortID, newEscortDoc);    
  }


  getEscortDocumentFile(escortID : string, documentID : string) : Observable<Blob> {
    return this.escortDocsService.escortsEscortIDDocumentsDocumentIDFileGet(escortID, documentID).pipe(
      map((filedata: any) => {
        return (filedata as Blob); 
      })
    )
  }





  async getCaseDocuments(caseID : string) : Promise<Observable<any[]>> {
    let onlineRequest : ()=>Observable<any> = ()=>{
      return this.caseDocsService.companiesCompanyIDCasesCaseIDDocumentsGet(this.DEFAULT_COMPANYID, caseID).pipe(
        map((caseDocs:CaseDocument[]|null|undefined) => {
          console.log('INFO: Documents for the Case requested in online mode');
          if (caseDocs == null || caseDocs == undefined || caseDocs.length == 0){
            console.log('NO CASEDOCS FOUND');
            return [];
          } else {
            console.log(caseDocs);
            return caseDocs;
          }
        }),
        catchError( (err:any) => {
          console.log(err);
          return throwError(new Error('Failed to retrieve CaseDocuments for the requested Case. CaseID : ' + caseID));
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.caseID == caseID; });
      console.log('INFO: Documents for the Case requested in offline mode');
      console.log(filteredData);
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.documentID; })};

    return await this.getCacheableData(onlineRequest, offlineRequest, keyIndexer, 'caseDocuments');    
  }


  updateCaseDocument(caseID : string, documentID : string, changedCaseDoc : CaseDocument) : Observable<CaseDocument> {
    return this.caseDocsService.companiesCompanyIDCasesCaseIDDocumentsDocumentIDPatch(this.DEFAULT_COMPANYID, caseID, documentID, changedCaseDoc).pipe(
      map( (data : any) => { return changedCaseDoc; })
    );    
  }


  createCaseDocument(caseID : string, newCaseDoc : CaseDocument) : Observable<CaseDocument> {
    newCaseDoc.documentID = this.createUUID62();
    return this.caseDocsService.companiesCompanyIDCasesCaseIDDocumentsPost(this.DEFAULT_COMPANYID, caseID, newCaseDoc);    
  }


  async getCaseDocumentFile(caseID : string, documentID : string, archivedCase : boolean) : Promise<Observable<any>> {
    let onlineRequest : ()=>Observable<any> = ()=>{
      return this.caseDocsService.companiesCompanyIDCasesCaseIDDocumentsDocumentIDFileGet(this.DEFAULT_COMPANYID, caseID, documentID, archivedCase).pipe(
        map((filedata:any) => {
          console.log('INFO: File for the CaseDocument requested in online mode');
          if (filedata == null || filedata == undefined || (filedata as Blob).size == 0){
            console.log('NO CASEDOC FILE FOUND');
            return [];
          } else {
            return {
              documentID: documentID,
              caseID: caseID,
              expirationDate: 0,
              filedata: (filedata as Blob)
            };
          }
        }),
        catchError( (err:any) => {
          console.log(err);
          return throwError(new Error('ERROR: Failed to retrieve a file for the requested CaseDocument. DocumentID : ' + documentID));
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.documentID == documentID; });
      console.log('INFO: File for the CaseDocument requested in offline mode');
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.documentID; })};

    return await this.getCacheableData(onlineRequest, offlineRequest, keyIndexer, 'caseDocumentFiles');
  }


  deleteCaseDocumentFile(caseID : string, documentID : string) : Observable<any> {
    this.deleteDataCacheItem(documentID, 'caseDocuments').then(()=>{
      this.deleteDataCacheItem(documentID, 'caseDocumentFiles').then(()=>{
        console.log('INFO: Removed a CaseDocument from the cache');
      });
    });

    return this.caseDocsService.companiesCompanyIDCasesCaseIDDocumentsDocumentIDFileDelete(this.DEFAULT_COMPANYID, caseID, documentID);
  }



  async cacheCaseDocumentFiles(caseDocuments : CaseDocument[], currentIndex : number = 0) : Promise<void> {
    if (currentIndex >= caseDocuments.length) { return Promise.resolve(); }

    let currentCD : CaseDocument = caseDocuments[currentIndex];

    let onlineRequest : ()=>Observable<any> = ()=>{
      console.log('INFO: Starting to retrieve a CaseDocument file from the remote server');
      return this.caseDocsService.companiesCompanyIDCasesCaseIDDocumentsDocumentIDFileGet(this.DEFAULT_COMPANYID, currentCD.caseID, currentCD.documentID, false).pipe(
        map((filedata:any) => {
          console.log('INFO: File for the CaseDocument requested in online mode');
          if (filedata == null || filedata == undefined || (filedata as Blob).size == 0){
            console.log('NO CASEDOC FILE FOUND');
            return [];
          } else {
            return {
              documentID: currentCD.documentID,
              caseID: currentCD.caseID,
              expirationDate: 0,
              filedata: (filedata as Blob)
            };
          }
        }),
        catchError( (err:any) => {
          console.log(err);
          return throwError(new Error('ERROR: Failed to retrieve a file for the requested CaseDocument. DocumentID : ' + currentCD.documentID));
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.documentID == currentCD.documentID; });
      console.log('INFO: File for the CaseDocument requested in offline mode');
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.documentID; })};

    (await this.getCacheableDataLazy(onlineRequest, offlineRequest, keyIndexer, 'caseDocumentFiles')).subscribe( (caseDocumentFileData)=>{
      this.cacheCaseDocumentFiles(caseDocuments, ++currentIndex);
    }); 
  }



  async getEscortReceiptDocuments(caseID : string) : Promise<Observable<any[]>> {
    let onlineRequest : ()=>Observable<any> = ()=>{
      return this.caseEscortReceiptsService.companiesCompanyIDCasesCaseIDEscortReceiptsGet(this.DEFAULT_COMPANYID, caseID).pipe(
        map((escortReceipts:CaseEscortReceipt[]|null|undefined) => {
          console.log('INFO: Receipts for the Case requested in online mode');
          if (escortReceipts == null || escortReceipts == undefined || escortReceipts.length == 0){
            console.log('NO RECEIPTS FOUND');
            return [];
          } else {
            console.log(escortReceipts);
            return escortReceipts;
          }
        }),
        catchError( (err:any) => {
          console.log(err);
          return throwError(new Error('Failed to retrieve CaseEscortReceipts for the requested Case. CaseID : ' + caseID));
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.caseID == caseID; });
      console.log('INFO: Receipts for the Case requested in offline mode');
      console.log(filteredData);
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.receiptID; })};

    return await this.getCacheableData(onlineRequest, offlineRequest, keyIndexer, 'travelReceipts');    
  }


  createCaseEscortReceipt(caseID : string, newCaseEscortReceipt : CaseEscortReceipt) : Observable<CaseEscortReceipt> {
    newCaseEscortReceipt.receiptID = this.createUUID62();
    return this.caseEscortReceiptsService.companiesCompanyIDCasesCaseIDEscortReceiptsPost(this.DEFAULT_COMPANYID, caseID, newCaseEscortReceipt);    
  }


  updateCaseEscortReceipt(caseID : string, receiptID : string, changedCaseEscortReceipt : CaseEscortReceipt) : Observable<CaseEscortReceipt> {
    return this.caseEscortReceiptsService.companiesCompanyIDCasesCaseIDEscortReceiptsReceiptIDPatch(this.DEFAULT_COMPANYID, caseID, receiptID, changedCaseEscortReceipt).pipe(
      map( (data : any) => { return changedCaseEscortReceipt; })
    );    
  }


  async getCaseEscortReceiptFile(caseID : string, receiptID : string, archivedCase : boolean) : Promise<Observable<any>> {

    let onlineRequest : ()=>Observable<any> = ()=>{
      console.log('INFO: Starting to retrieve a CaseEscortReceipt file from the remote server');
      return this.caseEscortReceiptsService.companiesCompanyIDCasesCaseIDEscortReceiptsReceiptIDFileGet(this.DEFAULT_COMPANYID, caseID, receiptID, archivedCase).pipe(
        map((filedata:any) => {
          console.log('INFO: File for the CaseEscortReceipt requested in online mode');
          if (filedata == null || filedata == undefined || (filedata as Blob).size == 0){
            console.log('NO RECEIPT FILE FOUND');
            return [];
          } else {
            return {
              receiptID: receiptID,
              caseID: caseID,
              expirationDate: 0,
              filedata: (filedata as Blob)
            };
          }
        }),
        catchError( (err:any) => {
          console.log(err);
          return throwError(new Error('ERROR: Failed to retrieve a file for the requested CaseEscortReceipt. ReceiptID : ' + receiptID));
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.receiptID == receiptID; });
      console.log('INFO: File for the CaseEscortReceipt requested in offline mode');
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.receiptID; })};

    return this.getCacheableDataLazy(onlineRequest, offlineRequest, keyIndexer, 'travelReceiptFiles'); 
  }


  async deleteCaseEscortReceiptFile(caseID : string, receiptID : string) : Promise<Observable<any>> {
    await this.deleteDataCacheItem(receiptID, 'travelReceipts');
    await this.deleteDataCacheItem(receiptID, 'travelReceiptFiles');

    return this.caseEscortReceiptsService.companiesCompanyIDCasesCaseIDEscortReceiptsReceiptIDFileDelete(this.DEFAULT_COMPANYID, caseID, receiptID).pipe(
      map( (result:any)=>{ return result; }),
      catchError((err)=>{ 
        if (err.statusText.toLowerCase() == 'unknown error') {
          // The server is offline, so lets proceed as if it succeeded
          return of(null);
        } else {
          console.log('ERROR: Failed to delete a file for a systemic error.');
          console.log(err);
          throwError(err); 
        }
      })
    );
  }


  async cacheCaseEscortReceiptFiles(caseEscortReceipts : CaseEscortReceipt[], currentIndex : number = 0) : Promise<void> {
    if (currentIndex >= caseEscortReceipts.length) { return Promise.resolve(); }

    let currentCER : CaseEscortReceipt = caseEscortReceipts[currentIndex];

    let onlineRequest : ()=>Observable<any> = ()=>{
      console.log('INFO: Starting to retrieve a CaseEscortReceipt file from the remote server');
      return this.caseEscortReceiptsService.companiesCompanyIDCasesCaseIDEscortReceiptsReceiptIDFileGet(this.DEFAULT_COMPANYID, currentCER.caseID, currentCER.receiptID, false).pipe(
        map((filedata:any) => {
          console.log('INFO: File for the CaseEscortReceipt requested in online mode');
          if (filedata == null || filedata == undefined || (filedata as Blob).size == 0){
            console.log('NO RECEIPT FILE FOUND');
            return [];
          } else {
            return {
              receiptID: currentCER.receiptID,
              caseID: currentCER.caseID,
              expirationDate: 0,
              filedata: (filedata as Blob)
            };
          }
        }),
        catchError( (err:any) => {
          console.log(err);
          return throwError(new Error('ERROR: Failed to retrieve a file for the requested CaseEscortReceipt. ReceiptID : ' + currentCER.receiptID));
        })
      );
    };

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.receiptID == currentCER.receiptID; });
      console.log('INFO: File for the CaseEscortReceipt requested in offline mode');
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.receiptID; })};

    (await this.getCacheableDataLazy(onlineRequest, offlineRequest, keyIndexer, 'travelReceiptFiles')).subscribe( (caseEscortReceiptFileData)=>{
      this.cacheCaseEscortReceiptFiles(caseEscortReceipts, ++currentIndex);
    }); 
  }


}
