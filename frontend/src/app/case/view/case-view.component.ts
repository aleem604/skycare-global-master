import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { OverlayEventDetail } from '@ionic/core';
import { ToastController, AlertController, ModalController, LoadingController, Platform } from '@ionic/angular';
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
import Dexie from 'dexie';

import * as socketIO from 'socket.io-client';

import { AuthService }                                              from '../../auth/auth.service';
import { CaseService }                                              from '../case.service';
import { CompanyCase, Company, CaseDocument, 
         CaseEscortReceipt, CaseStatusChange, CaseMessage, 
         CaseMessagesControllerService, CasePatientAssessment, 
         CasePatientProgress, Escort, EscortLocation }                              from '../../apiClient';
import { DocumentsService }                                         from '../../documents/documents.service';
import { SkycareFileViewerComponent }                               from '../../controls/file-viewer/file-viewer.component';
import { SkycareFileUploaderComponent }                             from '../../controls/file-uploader/file-uploader.component';
import { FileUploadedValidator }                                    from '../../validators/fileUploaded.validator';
import { PatientAssessmentComponent }                               from '../patient-assessment/patient-assessment.component';
import { StatusChangeComponent }                                    from '../status-change/status-change.component';
import { PatientProgressComponent }                                 from '../patient-progress/patient-progress.component';
import { FinalizePatientProgressComponent }                         from '../finalize-patient-progress/finalize-patient-progress.component';
import { PatientConsentComponent }                                  from '../patient-consent/patient-consent.component';
import { CompletedPatientConsentComponent }                         from '../completed-patient-consent/completed-patient-consent.component';
import { CompletedProgressNoteComponent }                           from '../completed-progress-note/completed-progress-note.component';
import { CompletedPatientAssessmentComponent }                      from '../completed-patient-assessment/completed-patient-assessment.component';
import { AddTravelReceiptComponent } from '../add-travel-receipt/add-travel-receipt.component';
import { MapTrackingComponent } from '../map-tracking/map-tracking.component';
import { GPSPoint, DataService } from '../../controls/data.service';
import { EscortService } from '../../escort/escort.service';

import { environment } from '../../../environments/environment';

const CASE_MESSAGES_WS_URL : string = environment.websocketURL;


@Component({
  selector: 'app-case-view',
  templateUrl: './case-view.component.html',
  styleUrls: ['./case-view.component.scss']
})
export class CaseViewComponent implements OnInit {

  public pageTitle : string = 'Case Details';
  public externalAccessID : string = '';
  public caseID : string = '';
  public currentCaseCompanyName : string = '';
  public currentUserIsAdmin : boolean = false;
  public loading : any;
  public trackingStage : string = '';
  public noTrackingData : boolean = true;
  public mapLinkDisabled : boolean = true;
  public currentlyOnline : boolean = true;

  public currentRole : string = 'admin';

  public currentCase : CompanyCase = {} as CompanyCase;
  public caseDocs : any = {
    medicalNote: []
  };
  public nonFinalizedPatientAssessment : CasePatientAssessment;
  public nonFinalizedPatientProgress : CasePatientProgress;


  public socket : any = {};
  public countMessagesAsUnread : boolean = true;
  public unreadMessages : number = 0;
  public messages : CaseMessage[] = [];
  public newMessageText : string = '';

  public escortReceipts : CaseEscortReceipt[] = [];

  public travelReceiptsForm: FormGroup;
  @ViewChild('travelReceiptsIcon')              public travelReceiptsIcon : MatIcon;
  @ViewChild('travelReceiptFileControl')        public travelReceiptFileControl : SkycareFileUploaderComponent;

  @ViewChild('messagesPanel')                   public messagesPanel : MatExpansionPanel;
  @ViewChild('newMessageTextbox')               public newMessageTextbox : any;
  
  @ViewChild('accordion')                       public accordion : ElementRef;

  public validationMessages : any = {
    'receipt': [
      { type: 'required', message: 'Travel receipt file is required.' },
      { type: 'not-uploaded', message: 'Travel receipt file has not been uploaded.' },
    ]
  };





  constructor(
    private platform: Platform,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private domAccessor : ElementRef,
    private caseService : CaseService,
    private docsService : DocumentsService,
    private authService: AuthService,
    private dataService : DataService,
    private escortService : EscortService,
    private toaster : ToastController,
    private loader : LoadingController,
    private alertController : AlertController,
    private modalController : ModalController,) {

      this.listenForConnectionChanges();
  }


  async ngOnInit() {
    this.loading = await this.loader.create({
      message: 'Loading Case...'
    });
    await this.loading.present();
    
    console.log('STAGE: Current Role = "' + this.caseService.getRole() + '"');
    this.currentRole = this.caseService.getRole();
    this.currentUserIsAdmin = (this.currentRole == 'admin');

    console.log('STAGE: Current Profile = "' + this.authService.currentProfile + '"');
    if (this.authService.currentProfile === undefined || this.authService.currentProfile == null) { 
      console.log('STAGE: Attempting to load the current profile');
      (await this.authService.loadProfile()).subscribe((done)=>{console.log('loaded');});
    }
    
    this.setupForms();
    this.loadCaseData();
  }

  setupForms() : void {

    this.travelReceiptsForm = this.formBuilder.group({
      travelReceiptFileControl: new FormControl('', Validators.compose([
        FileUploadedValidator.hasBeenUploaded(),
        FileUploadedValidator.uploadedAtLeastOneFile(()=>{return this.escortReceipts;})
      ]))
    });  

    this.travelReceiptsForm.statusChanges.subscribe(
      (observer:any) => { 
        this.indicateSectionValidity(this.travelReceiptsIcon, this.travelReceiptsForm.invalid, false); 
      }
    );  


    setTimeout( () => { this.formatTextFabButtons(); }, 2000);
  }

  formatTextFabButtons() : void {
    // HACK: Stylizes the fab-buttons that are text-fab so they have proper width
    let textFABs : any[] = this.domAccessor.nativeElement.getElementsByClassName('text-fab');
    for (let i = 0; i < textFABs.length; i++){
      let button : any = textFABs[i].shadowRoot.lastChild;
      button.style.width = '150px'
      button.style.borderRadius = '10px';
    }
  }

  listenForConnectionChanges() : void {
    this.currentlyOnline = this.caseService.netmonService.isOnline;
    this.caseService.connectionChanged.subscribe( (online) => { this.currentlyOnline = online; });
  }

  configureLocationTracking() : void {

    this.noTrackingData = (this.currentCase.escortTracking === undefined || this.currentCase.escortTracking === null || this.currentCase.escortTracking.length == 0);

    this.mapLinkDisabled = (this.currentCase.currentStatus == 'New Case Created' ||
                            this.currentCase.currentStatus == 'Escort on way to origin city' ||
                            this.currentCase.currentStatus == 'Escort in origin city');

    this.determineTrackingStage();
  }

  determineTrackingStage() : string {
    if (this.mapLinkDisabled || this.currentCase.currentStatus == 'Escort performed pre-flight assessment' ||
                                this.currentCase.currentStatus == 'Escort picked up patient on way to airport' || 
                                this.currentCase.currentStatus == 'Airport check-in complete and awaiting departure') {
      this.trackingStage = 'preflight';
    } else if ( this.currentCase.currentStatus == 'Boarded & departed origin city' || 
                this.currentCase.currentStatus == 'Arrived & waiting in connection airport 1' || 
                this.currentCase.currentStatus == 'Boarded & departed connection airport 1' || 
                this.currentCase.currentStatus == 'Arrived & waiting in connection airport 2' || 
                this.currentCase.currentStatus == 'Boarded & departed connection airport 2') {
      this.trackingStage = 'flight';
    } else {
      this.trackingStage = 'postflight';
    }
    return this.trackingStage;
  }

  loadCaseData() : void {
    // Check for a limitedView with an externalAccessID
    this.route.url.subscribe(
      (segments : UrlSegment[]) => {
        if (segments.findIndex( (value,index,list)=>{ return (value.path == 'limitedView'); }) > -1) {
          this.route.paramMap.subscribe(params => {
            if (params.keys.indexOf('externalAccessID') == -1) { return; }
            this.externalAccessID = params.get('externalAccessID');
            this.pageTitle = 'Limited Case View';

            this.caseService.getPublicCase(this.externalAccessID).subscribe(
              async (retrievedCase:CompanyCase) => {
                this.currentCase = retrievedCase;
                this.caseID = this.currentCase.caseID;
                this.configureLocationTracking();
                await this.loadCasePatient();
                await this.loadCaseMessages();
                await this.loadCaseDocs();
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
      if (!params.has('caseID')) { return; }

      this.caseID = params.get('caseID');
      this.pageTitle = 'Case Details';

      (await this.caseService.getCase('UNKNOWN',this.caseID)).subscribe(
        async (retrievedCases:any[]) => {
          if (retrievedCases.length == 0) { return; }
          this.currentCase = (retrievedCases[0]) as CompanyCase;
          this.configureLocationTracking();
          await this.loadCasePatient();
          await this.loadCaseMessages();
          await this.loadCaseDocs();
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

  async loadCaseDocs() : Promise<void> {
    // Get the Case Document data
    (await this.docsService.getCaseDocuments(this.caseID)).subscribe(
      async (retrievedCaseDocs:any[]) => {
        console.log('INFO: Found some documents for the Case');
        console.log(retrievedCaseDocs);
        if (retrievedCaseDocs.length == 0) { return; }
        
        this.caseDocs = { 
          medicalNote: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='medicalNote';}),
          passport: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='passport';}),
          airlineClearance: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='airlineClearance';}),
          air: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='air';}),
          hotel: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='hotel';}),
          ground: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='ground';}),
        };

        await this.docsService.cacheCaseDocumentFiles(retrievedCaseDocs);
      }
    );

    // Get the Escort Receipts for this Case
    (await this.docsService.getEscortReceiptDocuments(this.caseID)).subscribe(
      async (retrievedReceipts : any[]) => {
        console.log('INFO: Found some escort receipts for the Case');
        console.log(retrievedReceipts);
        if (retrievedReceipts.length == 0) { return; }

        this.escortReceipts = retrievedReceipts as CaseEscortReceipt[];
        this.indicateSectionValidity(this.travelReceiptsIcon, false, false); 

        await this.docsService.cacheCaseEscortReceiptFiles(this.escortReceipts);
      }
    );

    await this.loading.dismiss();
  }

  async loadCaseMessages() : Promise<void> {
    this.connectToWS();
    
    (await this.caseService.getCaseMessages(this.caseID)).subscribe(
      (allMessages : any[]) => { 
        if (allMessages.length == 0) { return; }
        this.messages = allMessages as CaseMessage[];

        let storedValue : string = localStorage.getItem('caseMessageReadDates');
        let caseMessageReadDates : any = JSON.parse( (storedValue != null ? storedValue : '{}') );          
        let lastReadDate : string = caseMessageReadDates[this.caseID];

        if (lastReadDate === undefined || lastReadDate == null || lastReadDate == '') {
          // Wait for the messages to be read, and then we will update this stored value
        } else {
          // We have a stored last read date, so lets count how many new messages are unread
          this.unreadMessages = this.messages.filter( (v,i,l) => { return (Date.parse(v.sendDate) > Date.parse(lastReadDate)); }).length;
        }
      }
    );
  }

  async loadCasePatient() : Promise<void> {
    // Retrieve the Patient Assessment if it is not finalized
    if (this.currentCase.patientAssessment === undefined || this.currentCase.patientAssessment == null) {
      this.caseService.getPatientAssessment(this.caseID).subscribe(
        (retrievedAssessment) => {
          if (retrievedAssessment != null) {
            this.nonFinalizedPatientAssessment = retrievedAssessment;
          } else {
            this.nonFinalizedPatientAssessment = {
              patientAssessmentID : '',
              caseID : this.caseID
            };
          }
        }
      )
    }

    // Retrieve the Patient Progress if it is not finalized
    if (this.currentCase.patientProgress === undefined || this.currentCase.patientProgress == null) {
      (await this.caseService.getPatientProgress(this.caseID)).subscribe(
        (retrievedProgress:any[]) => {
          if (retrievedProgress.length == 0) { return; }
          this.nonFinalizedPatientProgress = (retrievedProgress[0]) as CasePatientProgress;
        }
      );
    }
  }

  shouldShowButton(buttonName : string) : boolean {
    switch (this.authService.getRole()) {
      case 'admin':
        return (buttonName == 'editCase' || (buttonName == 'changeStatus' && this.currentCase.currentStatus != 'All case documentation & receipts complete') || buttonName == 'sendMessage' || buttonName == 'appFeedback');
      case 'escort':
        return ( (buttonName == 'changeStatus' && this.currentCase.currentStatus != 'All case documentation & receipts complete') || 
                  (buttonName == 'patientConsent' && this.currentCase.patientConsent === undefined && this.currentlyOnline) || 
                  (buttonName == 'preflightAssess' && this.currentCase.patientAssessment === undefined && this.currentlyOnline) || 
                  (buttonName == 'receivePatient' && this.currentCase.patientProgress === undefined && this.nonFinalizedPatientProgress === undefined && this.currentlyOnline) ||
                  (buttonName == 'progressNote' && this.currentCase.patientProgress === undefined && this.nonFinalizedPatientProgress !== undefined) ||
                  (buttonName == 'transferPatient' && this.currentCase.patientProgress === undefined && this.nonFinalizedPatientProgress !== undefined) ||
                  (buttonName == 'travelReceipt' && this.currentCase.currentStatus != 'All case documentation & receipts complete' && this.currentlyOnline) || 
                  buttonName == 'sendMessage' || buttonName == 'appFeedback')
      case 'client':
        return (buttonName == 'sendMessage' || buttonName == 'appFeedback');
      case 'limited':
        return (buttonName == 'appFeedback');
    }
  }
  

  connectToWS() : void {
    this.socket = socketIO(CASE_MESSAGES_WS_URL + '/messages/' + this.caseID);
    this.socket.on('message', (msg:string)=>{ 
      let messageParts : string[] = msg.split("] ");
      console.log(messageParts[1]);
      let receivedCaseMessage : CaseMessage = JSON.parse(messageParts[1]) as CaseMessage;
      this.messages.push(receivedCaseMessage); 

      if (this.countMessagesAsUnread) { 
        this.unreadMessages++; 
      } else {
        this.updateStoredLastMessageReadDate(receivedCaseMessage.sendDate);
      }

      let insertCommand : (table:Dexie.Table<any,string>)=>Promise<void> = async (table)=>{ 
        let messageCount : number = await table.where('messageID').equals(receivedCaseMessage.messageID).count();
        if (messageCount == 0) {
          await table.add(receivedCaseMessage); 
        }
      };
      this.caseService.addDataToCache(insertCommand, 'caseMessages').then(success=>{return;});
    });
  }


  async showUploadedFile(documentID : string, fileType : string) : Promise<void> {
    if (fileType == 'receipt') {
      let receiptIndex : number = this.escortReceipts.findIndex( (value, index, list) => { return value.receiptID == documentID; });
      const modal = await this.modalController.create({
        component: SkycareFileViewerComponent,
        componentProps: { 'document' : this.escortReceipts[receiptIndex], 'archivedCase' :  this.currentCase.currentStatus == 'ARCHIVED' }
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

  async deleteUploadedFile(event : MouseEvent | TouchEvent, receiptID : string, fileType : string) : Promise<void> {
    event.cancelBubble = true;
    event.preventDefault();

    let receiptIndex : number = this.escortReceipts.findIndex( (value, index, list) => { return value.receiptID == receiptID; });
    let documentName : string = this.escortReceipts[receiptIndex].name;
    
    const alert = await this.alertController.create({
      header: 'Confirm File Delete',
      message: 'Are you sure you want to delete ' + documentName +' ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Okay',
          handler: async (data) => {
            (await this.docsService.deleteCaseEscortReceiptFile(this.caseID, receiptID)).subscribe(
              async () => {
                this.escortReceipts.splice(receiptIndex, 1);
                if (this.escortReceipts.length == 0) {
                  this.indicateSectionValidity(this.travelReceiptsIcon, true, false);
                }
                const toast = await this.toaster.create({
                  message: 'Successfully deleted the file from SecureStorage',
                  duration: 2000       
                })
                await toast.present();
              },
              (err)=>{
                if (err.status == 0) {
                  // The application is offline, so lets pretend it worked correctly and sync when we are back online
                  this.escortReceipts.splice(receiptIndex, 1);
                  if (this.escortReceipts.length == 0) {
                    this.indicateSectionValidity(this.travelReceiptsIcon, true, false);
                  }
                } else {
                  console.log(err);
                  this.toaster.create({
                    message: 'An error occured while deleting the file from SecureStorage',
                    showCloseButton: true       
                  }).then( (toast)=>{ return toast.present(); }).then(()=>{ return; })
                }
              }
            )
          }
        }
      ]
    });

    await alert.present();
  }

  async promptToEditCase(clickEvent : MouseEvent | TouchEvent) : Promise<void> {

    if (this.caseService.getRole() == 'admin') {
      const alert = await this.alertController.create({
        header: 'Edit Case?',
        message: 'This Case doc is missing.  Do you want to add it to the Case?',
        buttons: [
          { text: 'Yes',  cssClass: 'primary',    handler: () => { this.editCase(clickEvent, this.caseID); } },
          { text: 'No',   cssClass: 'secondary',  role: 'cancel' }
        ]
      });

      await alert.present();
    } else {
      const toast = await this.toaster.create({
        message: 'Ask an Admin to add this Case Doc',
        duration: 2000
      });
      await toast.present();
    }
  }

  editCase(clickEvent : MouseEvent | TouchEvent, caseID : string) : void {
    clickEvent.cancelBubble = true;
    this.router.navigate(['/case', 'edit', caseID]);
  }


  indicateSectionValidity(sectionIcon : MatIcon, isInvalid : boolean, required : boolean) : void {
    sectionIcon._elementRef.nativeElement.innerText = (isInvalid) ?   ((required) ? 'error'     : 'warning') : 'check_circle';
    sectionIcon._elementRef.nativeElement.style.color = (isInvalid) ? ((required) ? 'firebrick' : 'orange')  : 'green';
  }



  sendMessage() : void {
    let newCaseMessage : CaseMessage = {
      caseID: this.currentCase.caseID,
      messageID: this.caseService.createUUID62(),
      sendDate: (new Date()).toISOString(),
      senderID: this.caseService.getName(),
      message: this.newMessageText
    }

    this.socket.emit('message', newCaseMessage);
    this.newMessageText = '';

    /*
    let insertCommand : (table:Dexie.Table<any,string>)=>Promise<void> = async (table)=>{ 
      let messageCount : number = await table.where('messageID').equals(newCaseMessage.messageID).count();
      if (messageCount == 0) { 
        await table.add(newCaseMessage); 
      }
    };
    this.caseService.addDataToCache(insertCommand, 'caseMessages').then(success=>{return;});
    */
  }

  showAllMessagesRead() : void {
    this.countMessagesAsUnread = false;
    this.unreadMessages = 0;
    if (this.messages.length > 0) {
      this.messages = this.messages.sort((a : CaseMessage, b : CaseMessage) => {
        let aDate : number = Date.parse(a.sendDate);
        let bDate : number = Date.parse(b.sendDate);
        
        if ( aDate < bDate ) {
          return -1;
        } else if ( aDate > bDate ) {
          return 1;
        } else {
          return 0;
        }
      });
      this.updateStoredLastMessageReadDate(this.messages[this.messages.length-1].sendDate);
    }
  }

  startCountingUnreadMessages() : void {
    this.countMessagesAsUnread = true;
  }

  updateStoredLastMessageReadDate(lastMessageReadDate : string) : void {
    let storedValue : string = localStorage.getItem('caseMessageReadDates');
    let caseMessageReadDates : any = JSON.parse( (storedValue != null ? storedValue : '{}') );
    caseMessageReadDates[this.caseID] = lastMessageReadDate;
    localStorage.setItem('caseMessageReadDates', JSON.stringify(caseMessageReadDates));
  }

  getEscortName(escortID : string) : string {
    let escortIndex : number = this.currentCase.escorts.findIndex( (v,i,l)=>{ return v.escortID == escortID; });
    if (escortIndex >= 0) {
      return this.currentCase.escorts[escortIndex].name;
    } else {
      return '';
    }
  }
  

  async editPreflightAssessment(evt : MouseEvent | TouchEvent) : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: PatientAssessmentComponent,
      componentProps: { 'patientAssessment': this.nonFinalizedPatientAssessment }
    });

    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      if ( detail !== undefined && detail !== null && detail.data !== undefined && detail.data !== null) {
        console.log('The result:', detail.data);

        if (detail.data.finalize == true) {
          this.currentCase.patientAssessment = detail.data.assessment;
          this.caseService.updateCase(this.currentCase.companyID, this.currentCase.caseID, this.currentCase).subscribe(
            (success) => {
              this.nonFinalizedPatientAssessment = null;
              console.log('Finalized the Preflight Assessment');
            }
          )
        } else {
          this.nonFinalizedPatientAssessment = detail.data.assessment;
          this.caseService.updatePatientAssessment(this.caseID, this.nonFinalizedPatientAssessment).subscribe(
            (success) => {
              console.log('Updated the Preflight Assessment');
            }
          )
        }
      }
    });

    await modal.present();
  }


  async startProgressNote(evt : MouseEvent | TouchEvent) : Promise<void> {
    let alert = await this.alertController.create({
      header: 'RECEIVE PATIENT', 
      message: '<div style="text-align: left;">List any personal belongings that you are accepting on behalf of the Patient</div>', 
      inputs: [ { name: 'belongings' } ],      
      buttons: [
        { text:'Cancel', role: 'cancel',  cssClass: 'danger',  handler: (data)=>{  }},
        { text:'Save',                    cssClass: 'primary', handler: (data)=>{ 
          // Create the basic progress note
          this.nonFinalizedPatientProgress = {
            patientProgressID     : '',
            caseID                : this.caseID,
            escort1ID             : 'NOT-IDENTIFIED',
            escort2ID             : '',
            medicalProviderName   : '',
            patientBelongings     : (data.belongings.trim().length > 0),
            patientBelongingsDesc : data.belongings
          };
          
          // Make sure the newly visible FABs are formatted properly
          //setTimeout(()=>{this.formatTextFabButtons();}, 500);          

          // Save the progress note so far
          this.caseService.updatePatientProgress(this.caseID, this.nonFinalizedPatientProgress).subscribe(
            (success) => { console.log('Created the Progress Note'); }
          )
        }}
      ]
    });
    alert.present();
  }

  async editProgressNote(evt : MouseEvent | TouchEvent) : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: PatientProgressComponent,
      componentProps: { 'progress': this.nonFinalizedPatientProgress }
    });

    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      if ( detail !== undefined && detail !== null && detail.data !== undefined && detail.data !== null) {
        console.log('The result:', detail.data);

        this.nonFinalizedPatientProgress = detail.data.progress;
        this.caseService.updatePatientProgress(this.caseID, this.nonFinalizedPatientProgress).subscribe(
          (success) => {
            console.log('Updated the Progress Note');
          }
        )
      }
    });

    await modal.present();
  }

  async finishProgressNote(evt : MouseEvent | TouchEvent) : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: FinalizePatientProgressComponent,
      componentProps: { 'progress': this.nonFinalizedPatientProgress, 'companyCase': this.currentCase }
    });

    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      if ( detail !== undefined && detail !== null && detail.data !== undefined && detail.data !== null) {
        console.log('The result:', detail.data);
        console.log('Finalized the Patient Progress');

        this.currentCase.patientProgress = detail.data.progress;
        this.caseService.updateCase(this.currentCase.companyID, this.currentCase.caseID, this.currentCase).subscribe(
          (success) => {
            this.nonFinalizedPatientProgress = null;
            console.log('Finalized the Patient Progress');
          }
        )
      }
    });

    await modal.present();
  }


  async editConsent(evt : MouseEvent | TouchEvent) : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: PatientConsentComponent,
      componentProps: { 'relatedCase': this.currentCase }
    });

    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      if ( detail !== undefined && detail !== null && detail.data !== undefined && detail.data !== null) {
        console.log('The result:', detail.data);
        this.currentCase.patientConsent = detail.data.consent;
        this.caseService.updateCase(this.currentCase.companyID, this.currentCase.caseID, this.currentCase).subscribe(
          (success) => {
            console.log('Finalized the Patient Consent');
          }
        )
      }
    });

    await modal.present();

  }  

  async editCaseStatus(evt : MouseEvent | TouchEvent) : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: StatusChangeComponent,
      componentProps: { 'currentCase': this.currentCase }
    });

    modal.onDidDismiss().then( async (detail: OverlayEventDetail) => {
      if ( detail !== undefined && detail !== null && detail.data !== undefined && detail.data !== null) {
        this.currentCase = detail.data;

        this.determineTrackingStage();

        if (this.currentCase.currentStatus == 'Escort & patient arrived destination city') { this.trackingStage = 'flight'; } // HACK need to record the flight tracking at the destination city

        if (this.authService.getRole() == 'escort' && this.trackingStage == 'flight') {
          let completedFlightStop : string = '';
          switch (this.currentCase.currentStatus) {
            case 'Boarded & departed origin city':
              completedFlightStop = this.currentCase.originCity.trim();
              break;
            case 'Arrived & waiting in connection airport 1':
              completedFlightStop = this.currentCase.connectionCity1.trim();
              break;
            case 'Arrived & waiting in connection airport 2':
              completedFlightStop = this.currentCase.connectionCity2.trim();
              break;
            case 'Escort & patient arrived destination city':
              completedFlightStop = this.currentCase.destinationCity.trim();
              break;
            default:
              break;
          }

          if (completedFlightStop.trim().length == 3) {
            let airport : GPSPoint = await this.dataService.getGPSCoordinatesForAirport(completedFlightStop);
            this.escortService.trackLocation(airport.latitude, airport.longitude, true);

            if (this.currentCase.currentStatus == 'Escort & patient arrived destination city') { 
              this.trackingStage = 'postflight'; 
              this.escortService.getCurrentLocation();
            }
          }
        }

        this.configureLocationTracking();
      }
    });

    await modal.present();
  }

  async uploadNewEscortReceipt(evt : MouseEvent | TouchEvent) : Promise<void> {
    console.log('INFO: Trying to upload a new Escort Receipt');
    console.log(this.authService.currentProfile);

    const modal : HTMLIonModalElement = await this.modalController.create({
      component: AddTravelReceiptComponent,
      componentProps: { 'escortReceipts': this.escortReceipts, 'caseID': this.caseID, 'escortID': this.authService.currentProfile.escortID }
    });

    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      if ( detail !== undefined && detail !== null && detail.data !== undefined && detail.data !== null) {
        console.log('The result:', detail.data);
        this.escortReceipts.push(detail.data.receipt);
        this.indicateSectionValidity(this.travelReceiptsIcon, false, false);
      }
    });

    await modal.present();
  }




  async showCurrentLocation() : Promise<void> {
    const modal : HTMLIonModalElement = await this.modalController.create({
      component: MapTrackingComponent,
      componentProps: { 'caseID': this.caseID, 'companyID': this.currentCase.companyID }
    });

    await modal.present();
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

  async showAppFeedback(evt : MouseEvent | TouchEvent) : Promise<void> {
    let alert = await this.alertController.create({
      header: 'APP FEEDBACK', 
      message: '<div style="text-align: left;">Please tell us about your experience with the app and any recommendations</div>', 
      inputs: [ { name: 'feedback' } ],      
      buttons: [
        { text:'Cancel', role: 'cancel',  cssClass: 'danger',  handler: (data)=>{  }},
        { text:'Send',                    cssClass: 'primary', handler: (data)=>{ 


          this.authService.submitUserFeedback(data.feedback).subscribe( async (success)=>{
            const toast = await this.toaster.create({
              message: 'Thank you for your feedback',
              duration: 2000,
              showCloseButton: true,
              color: 'primary'
            });
            await toast.present();
          });
        }}
      ]
    });
    alert.present();
  }

  
  showSendMessage() : void {
    this.messagesPanel.open();
    setTimeout( ()=>{
      this.newMessageTextbox.setFocus();
    }, 300);   
  }


  private topLevelNodeName = 'APP-CASE-VIEW';
  showKeyboardOnPhones(evt) {
    if (this.platform.is('ios')) {
      // Scroll the view up to present it above the keyboard
      let topLevelParent = <HTMLElement>(document.getElementsByTagName(this.topLevelNodeName)[0]);

      let iosAvailableScreenHeight = 335; // Pixels viewable on an iPhone 8 when keyboard is present
      let topOffset : number = (evt.target.offsetHeight + evt.target.offsetParent.offsetHeight + evt.target.offsetParent.offsetParent.offsetTop)
      
      topLevelParent.style.top = (iosAvailableScreenHeight - topOffset).toString() + 'px';
    } else {
      (evt.target as HTMLElement).scrollIntoView();
    }
  }


  hideKeyboardOnPhones(evt) {
    if (this.platform.is('ios')) {
      // Scroll the view down as the keyboard hides
      let topLevelParent = <HTMLElement>(document.getElementsByTagName(this.topLevelNodeName)[0]);
      topLevelParent.style.top = '0px';
    }
  }

}
