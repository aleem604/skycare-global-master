import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { OverlayEventDetail } from '@ionic/core';
import { ToastController, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatExpansionModule,
         MatAccordion, 
         MatExpansionPanel, 
         MatExpansionPanelHeader, 
         MatExpansionPanelTitle, 
         MatExpansionPanelDescription,
         MatExpansionPanelActionRow, 
         ThemePalette} from '@angular/material';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

import { AuthService }                                              from '../../auth/auth.service';
import { CaseService }                                              from '../case.service';
import { CompanyCase, Company, CaseDocument, 
         CaseEscortReceipt, CaseStatusChange, CaseMessage, 
         CaseMessagesControllerService, CasePatientAssessment, 
         CasePatientProgress, Escort }                              from '../../apiClient';
import { DocumentsService }                                         from '../../documents/documents.service';
import { SkycareFileViewerComponent }                               from '../../controls/file-viewer/file-viewer.component';
import { CompletedPatientConsentComponent }                         from '../completed-patient-consent/completed-patient-consent.component';
import { CompletedProgressNoteComponent }                           from '../completed-progress-note/completed-progress-note.component';
import { CompletedPatientAssessmentComponent }                      from '../completed-patient-assessment/completed-patient-assessment.component';




@Component({
  selector: 'app-archivedCase-view',
  templateUrl: './archivedCase-view.component.html',
  styleUrls: ['./archivedCase-view.component.scss']
})
export class ArchivedCaseViewComponent implements OnInit {

  public pageTitle : string = 'Archived Case Details';
  public externalAccessID : string = '';
  public caseID : string = '';
  public currentCaseCompanyName : string = '';

  public currentCase : CompanyCase = {} as CompanyCase;
  public caseDocs : any = { 
    medicalNote: [],
    passport: [],
    airlineClearance: [],
    air: [],
    hotel: [],
    ground: [],
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private domAccessor : ElementRef,
    private caseService : CaseService,
    private docsService : DocumentsService,
    private authService: AuthService,
    private toaster : ToastController,
    private alertController : AlertController,
    private modalController : ModalController,) { }


  ngOnInit() {
    // Check for a limitedView with an externalAccessID
    this.route.url.subscribe(
      (segments : UrlSegment[]) => {
        if (segments.findIndex( (value,index,list)=>{ return (value.path == 'limitedViewArchived'); }) > -1) {
          this.route.paramMap.subscribe(params => {
            if (params.keys.indexOf('externalAccessID') == -1) { return; }
            this.externalAccessID = params.get('externalAccessID');
            this.pageTitle = 'Limited Archived Case View';

            this.caseService.getPublicCase(this.externalAccessID).subscribe(
              (retrievedCase:CompanyCase) => {
                this.currentCase = retrievedCase;
                this.caseID = this.currentCase.caseID;
                this.provisionCaseDocuments();
              },
              catchError( async (err:any) => {
                const toast = await this.toaster.create({
                  message: 'Could not find a Case with the specified ExternalAccessID',
                  showCloseButton: true       
                })
                toast.present();
              })
            );
          });
        }
      }
    )

    // Check for an authenticated view with a caseID
    this.route.paramMap.subscribe( async (params) => {
      this.caseID = params.get('caseID');
      this.pageTitle = 'Archived Case Details';

      (await this.caseService.getCase('UNKNOWN', this.caseID)).subscribe(
        (retrievedCases:any[]) => {
          if (retrievedCases.length == 0) { return; }

          this.currentCase = (retrievedCases[0]) as CompanyCase;
          this.provisionCaseDocuments();
        },
        catchError( async (err:any) => {
          const toast = await this.toaster.create({
            message: 'Could not find a Case with the specified CaseID',
            showCloseButton: true       
          })
          toast.present();
        })
      );
    });
  }

  provisionCaseDocuments() : void {
    this.caseDocs = { 
      medicalNote: this.currentCase.documents.filter((v,i,l)=>{return v.type=='medicalNote';}),
      passport: this.currentCase.documents.filter((v,i,l)=>{return v.type=='passport';}),
      airlineClearance: this.currentCase.documents.filter((v,i,l)=>{return v.type=='airlineClearance';}),
      air: this.currentCase.documents.filter((v,i,l)=>{return v.type=='air';}),
      hotel: this.currentCase.documents.filter((v,i,l)=>{return v.type=='hotel';}),
      ground: this.currentCase.documents.filter((v,i,l)=>{return v.type=='ground';}),
    };
  }



  async showUploadedFile(documentID : string, fileType : string) : Promise<void> {
    if (fileType == 'receipt') {
      let receiptIndex : number = this.currentCase.escortReceipts.findIndex( (value, index, list) => { return value.receiptID == documentID; });
      const modal = await this.modalController.create({
        component: SkycareFileViewerComponent,
        componentProps: { 'document' : this.currentCase.escortReceipts[receiptIndex], 'archivedCase' :  this.currentCase.currentStatus == 'ARCHIVED' }
      });
      return await modal.present();
    } else {
      let caseDocumentIndex : number = this.caseDocs[fileType].findIndex( (value, index, list) => { return value.documentID == documentID; });
      const modal = await this.modalController.create({
        component: SkycareFileViewerComponent,
        componentProps: { 'document' : this.caseDocs[fileType][caseDocumentIndex], 'archivedCase' :  this.currentCase.currentStatus == 'ARCHIVED' }
      });
      return await modal.present();
    }
  }



  getEscortName(escortID : string) : string {
    let escortIndex : number = this.currentCase.escorts.findIndex( (v,i,l)=>{ return v.escortID == escortID; });
    if (escortIndex >= 0) {
      return this.currentCase.escorts[escortIndex].name;
    } else {
      return '';
    }
  }
  

  async showSignedConsent() : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: CompletedPatientConsentComponent,
      componentProps: { 'relatedCase': this.currentCase }
    });

    await modal.present();
  }

  async showSignedAssessment() : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: CompletedPatientAssessmentComponent,
      componentProps: { 'relatedCase': this.currentCase }
    });

    await modal.present();   
  }

  async showSignedProgressNotes() : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: CompletedProgressNoteComponent,
      componentProps: { 'relatedCase': this.currentCase }
    });

    await modal.present();
  }

  async showNotEnabled() : Promise<void> {
    let alert = await this.alertController.create({
      header: 'FEATURE NOT ENABLED', 
      message: 'This feature is still under development.', 
      buttons: [
        { text:'OK',                      cssClass: 'primary', handler: (data)=>{ }}
      ]
    });
    alert.present();
  }


}
