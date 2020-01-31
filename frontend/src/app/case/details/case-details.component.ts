import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatExpansionModule,
         MatAccordion, 
         MatExpansionPanel, 
         MatExpansionPanelHeader, 
         MatExpansionPanelTitle, 
         MatExpansionPanelDescription,
         MatExpansionPanelActionRow, 
         ThemePalette,
         MAT_ACCORDION} from '@angular/material';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';

import { AuthService } from '../../auth/auth.service';
import { DocumentsService } from '../../documents/documents.service';
import { SkycareFileUploaderComponent } from '../../controls/file-uploader/file-uploader.component';
import { SkycareFileViewerComponent } from '../../controls/file-viewer/file-viewer.component';
import { FileUploadedValidator } from '../../validators/fileUploaded.validator';
import { DateValidator } from '../../validators/date.validator';
import { CompanyCase, Company, Escort, CompaniesControllerService, EscortsControllerService, CaseDocument, CaseEscort } from '../../apiClient';
import { CaseService } from '../case.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';


@Component({
  selector: 'app-case-details',
  templateUrl: './case-details.component.html',
  styleUrls: ['./case-details.component.scss']
})
export class CaseDetailsComponent implements OnInit {

  public pageTitle : string = 'Create a new Case';
  public saveButtonText : string = 'SAVE CHANGES';

  private loading : any = null;

  public caseID : string = '';
  public caseEscorts : string[] = [];
  private savedCase : CompanyCase = null;
  public editedCase : CompanyCase = {
    caseID: '',
    companyID: '',
    caseNumber: '',
    escorts: [],
    statusChanges: []
  } as CompanyCase;

  public companies : Company[] = [];
  public escorts : Escort[] = [];

  public todayDateString : string = (new Date()).toISOString();
  public firstDayOfTravelDateString : string = '';

  public caseDocs : any = { 
    medicalNote: [],
    passport: [],
    airlineClearance: [],
    air: [],
    hotel: [],
    ground: [],
  };
  public currentMedicalNoteDocument : any = '';
  public currentPassportDocument : any = '';
  public currentAirlineClearanceDocument : any = '';
  public currentAirDocument : any = '';
  public currentHotelDocument : any = '';
  public currentGroundDocument : any = '';

  private somethingWasEdited : boolean = false;
  private documentsHaveChanged : boolean = false;
  public saveButtonDisabled : boolean = false;

  @ViewChild('accordion')                       public accordion : ElementRef;

  public generalForm: FormGroup;
  @ViewChild('generalIcon')                     public generalIcon : MatIcon;

  public travelDetailsForm: FormGroup;
  @ViewChild('travelDetailsIcon')               public travelDetailsIcon : MatIcon;

  public externalAccessForm: FormGroup;
  @ViewChild('externalAccessIcon')              public externalAccessIcon : MatIcon;

  public medicalNotesForm: FormGroup;
  @ViewChild('medicalNotesIcon')                public medicalNotesIcon : MatIcon;
  @ViewChild('medicalNoteFileControl')          public medicalNoteFileControl : SkycareFileUploaderComponent;

  public passportsForm: FormGroup;
  @ViewChild('passportsIcon')                   public passportsIcon : MatIcon;
  @ViewChild('passportFileControl')             public passportFileControl : SkycareFileUploaderComponent;

  public airlineClearancesForm: FormGroup;
  @ViewChild('airlineClearancesIcon')           public airlineClearancesIcon : MatIcon;
  @ViewChild('airlineClearanceFileControl')     public airlineClearanceFileControl : SkycareFileUploaderComponent;

  public airForm: FormGroup;
  @ViewChild('airIcon')                         public airIcon : MatIcon;
  @ViewChild('airFileControl')                  public airFileControl : SkycareFileUploaderComponent;

  public hotelForm: FormGroup;
  @ViewChild('hotelIcon')                       public hotelIcon : MatIcon;
  @ViewChild('hotelFileControl')                public hotelFileControl : SkycareFileUploaderComponent;

  public groundForm: FormGroup;
  @ViewChild('groundIcon')                      public groundIcon : MatIcon;
  @ViewChild('groundFileControl')               public groundFileControl : SkycareFileUploaderComponent;

  public validationMessages : any = {
    'company': [
      { type: 'required', message: 'Client is required.' }
    ],
    'caseNumber': [
      { type: 'required', message: 'Case number is required.' }
    ],
    'patientLastName': [
      { type: 'required', message: 'Last name is required.' }
    ],
    'diagnosis': [
      { type: 'required', message: 'Diagnosis is required.' }
    ],
    'clientQuote': [
      { type: 'required', message: 'Client quote is required.' }
    ],
    'escorts': [
      { type: 'required', message: 'Must choose at least one Escort.' }
    ],
    'escortPayPerDay': [
      { type: 'required', message: 'Escort pay / day is required.' }
    ],
    'originCity': [
      { type: 'required', message: 'Origin city is required.' }
    ],
    'destinationCity': [
      { type: 'required', message: 'Destination city is required.' }
    ],
    'firstDayOfTravel': [
      { type: 'required', message: 'First day of travel is required.' }
    ],
    'numberOfTravelDays': [
      { type: 'required', message: 'Number of travel days is required.' }
    ],
    'medicalNote': [
      { type: 'required', message: 'Medical note file is required.' },
      { type: 'not-uploaded', message: 'Medical note file has not been uploaded.' },
    ],  
    'passport': [
      { type: 'required', message: 'Passport file is required.' },
      { type: 'not-uploaded', message: 'Passport file has not been uploaded.' },
    ],  
    'airlineClearance': [
      { type: 'required', message: 'Airline clearance file is required.' },
      { type: 'not-uploaded', message: 'Airline clearance file has not been uploaded.' },
    ],  
    'air': [
      { type: 'required', message: 'Air file is required.' },
      { type: 'not-uploaded', message: 'Air file has not been uploaded.' },
    ],  
    'hotel': [
      { type: 'required', message: 'Hotel file is required.' },
      { type: 'not-uploaded', message: 'Hotel file has not been uploaded.' },
    ],  
    'ground': [
      { type: 'required', message: 'Ground file is required.' },
      { type: 'not-uploaded', message: 'Ground file has not been uploaded.' },
    ],  
  };




  constructor(private authService: AuthService,
              private docsService: DocumentsService,
              private caseService: CaseService,
              private companyService: CompaniesControllerService,
              private escortService: EscortsControllerService,
              private toastController: ToastController,
              private alertController: AlertController,
              private modalController : ModalController,
              private loadingController : LoadingController,
              private router: Router,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private domAccessor : ElementRef,
              private cdr: ChangeDetectorRef) {

  }



  ngOnInit() {
    this.loadDataFromDatabase();

    this.generalForm = this.formBuilder.group({
      companyControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      caseNumberControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      patientFirstNameControl: new FormControl(''),
      patientLastNameControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      diagnosisControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      quotedPriceControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      escortsControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      payPerDayControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
    });
        
    this.generalForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.generalIcon, this.generalForm.invalid, true); }
    );

    this.travelDetailsForm = this.formBuilder.group({
      originCityControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      destinationCityControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      firstDayOfTravelControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      numberTravelDaysControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      flightNumber1Control: new FormControl(''),
      connectionCity1Control: new FormControl(''),
      flightNumber2Control: new FormControl(''),
      connectionCity2Control: new FormControl(''),
      flightNumber3Control: new FormControl(''),
    });
        
    this.travelDetailsForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.travelDetailsIcon, this.travelDetailsForm.invalid, true); }
    );

    this.externalAccessForm = this.formBuilder.group({
      externalAccessEmail1Control: new FormControl(''),
      externalAccessEmail2Control: new FormControl(''),
      externalAccessEmail3Control: new FormControl('')
    });
        
    this.externalAccessForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.externalAccessIcon, this.externalAccessForm.invalid, true); }
    );

    this.medicalNotesForm = this.formBuilder.group({
      medicalNoteFileControl: new FormControl('', Validators.compose([
        FileUploadedValidator.hasBeenUploaded(),
        FileUploadedValidator.uploadedAtLeastOneFile(()=>{return this.caseDocs.medicalNote;})
      ]))
    });

    this.passportsForm = this.formBuilder.group({
      passportFileControl: new FormControl('', Validators.compose([
        FileUploadedValidator.hasBeenUploaded(),
        FileUploadedValidator.uploadedAtLeastOneFile(()=>{return this.caseDocs.passport;})
      ]))
    });

    this.airlineClearancesForm = this.formBuilder.group({
      airlineClearanceFileControl: new FormControl('', Validators.compose([
        FileUploadedValidator.hasBeenUploaded(),
        FileUploadedValidator.uploadedAtLeastOneFile(()=>{return this.caseDocs.airlineClearance;})
      ]))
    });

    this.airForm = this.formBuilder.group({
      airFileControl: new FormControl('', Validators.compose([
        FileUploadedValidator.hasBeenUploaded(),
        FileUploadedValidator.uploadedAtLeastOneFile(()=>{return this.caseDocs.air;})
      ]))
    });

    this.hotelForm = this.formBuilder.group({
      hotelFileControl: new FormControl('', Validators.compose([
        FileUploadedValidator.hasBeenUploaded(),
        FileUploadedValidator.uploadedAtLeastOneFile(()=>{return this.caseDocs.hotel;})
      ]))
    });

    this.groundForm = this.formBuilder.group({
      groundFileControl: new FormControl('', Validators.compose([
        FileUploadedValidator.hasBeenUploaded(),
        FileUploadedValidator.uploadedAtLeastOneFile(()=>{return this.caseDocs.ground;})
      ]))
    });
  }


  addDocUploadFormValidators() : void {        
    this.medicalNotesForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.medicalNotesIcon, this.medicalNotesForm.invalid, false); }
    );    

    this.passportsForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.passportsIcon, this.passportsForm.invalid, false); }
    );    
          
    this.airlineClearancesForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.airlineClearancesIcon, this.airlineClearancesForm.invalid, false); }
    );    
          
    this.airForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.airIcon, this.airForm.invalid, false); }
    );    
          
    this.hotelForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.hotelIcon, this.hotelForm.invalid, false); }
    );    
          
    this.groundForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.groundIcon, this.groundForm.invalid, false); }
    );  

    setTimeout((() => {
      this.checkDocumentSectionValidity();
    }).bind(this), 500)  
  }


  async loadDataFromDatabase() : Promise<void> {
    this.loading = await this.loadingController.create({
      message: 'Loading Case...'
    });
    await this.loading.present();

    // Get the list of Companies    
    this.companyService.companiesGet().subscribe( 
      (companyList : Company[]) => { 
        this.companies = companyList; 
        
        // Get the list of Escorts
        this.escortService.escortsGet().subscribe( 
          (escortList : Escort[]) => { 
            this.escorts = escortList; 

            // Get the existing Case if a caseID was specified
            this.route.paramMap.subscribe( async (params) => {
              if (params.keys.indexOf('caseID') == -1) { 
                await this.loading.dismiss(); 
                return; 
              }

              this.pageTitle = 'Edit existing Case';
              this.saveButtonText = 'SAVE CHANGES';
              this.caseID = params.get('caseID');
              
              // Get the Case data
              (await this.caseService.getCase('UNKNOWN',this.caseID)).subscribe(
                async (retrievedCases:any[]) => {
                  if (retrievedCases.length == 0) { return; }

                  this.editedCase = (retrievedCases[0]) as CompanyCase;
                  this.savedCase = (retrievedCases[0]) as CompanyCase;
                  if (this.editedCase.escorts !== undefined && this.editedCase.escorts.length > 0) {
                    this.caseEscorts = this.editedCase.escorts.map( (v,i,l) => { return v.escortID; });
                  }

                  if (this.editedCase.firstDayOfTravel != undefined) {
                    this.firstDayOfTravelDateString = this.editedCase.firstDayOfTravel;
                  }

                  // HACK: Force the Escorts dropdown to display the selected escorts
                  this.generalForm.get('escortsControl').setValue(this.caseEscorts);
                  this.cdr.detectChanges();  // I AM A TERRIBLE PERSON!!!


                  // Add the Form validators
                  this.addDocUploadFormValidators();

                  // HACK: Force the Escorts dropdown to display the selected escorts
                  this.generalForm.get('escortsControl').setValue(this.caseEscorts);
                  this.cdr.detectChanges();  // I AM A TERRIBLE PERSON!!!

                  // Get the Case Document data
                  (await this.docsService.getCaseDocuments(this.caseID)).subscribe(
                    async (retrievedCaseDocs : any[]) => {
                      this.caseDocs = { 
                        medicalNote: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='medicalNote';}),
                        passport: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='passport';}),
                        airlineClearance: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='airlineClearance';}),
                        air: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='air';}),
                        hotel: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='hotel';}),
                        ground: retrievedCaseDocs.filter((v,i,a)=>{return v.type=='ground';}),
                      };

                      this.medicalNotesForm.get('medicalNoteFileControl').updateValueAndValidity(); 
                      this.passportsForm.get('passportFileControl').updateValueAndValidity();
                      this.airlineClearancesForm.get('airlineClearanceFileControl').updateValueAndValidity();
                      this.airForm.get('airFileControl').updateValueAndValidity();
                      this.hotelForm.get('hotelFileControl').updateValueAndValidity();
                      this.groundForm.get('groundFileControl').updateValueAndValidity();

                      await this.loading.dismiss();
                    }
                  );
                }
              );    
            });
          } 
        );
      } 
    );
  }


  checkDocumentSectionValidity() : void {
    this.indicateSectionValidity(this.medicalNotesIcon, this.medicalNotesForm.invalid, false);
    this.indicateSectionValidity(this.passportsIcon, this.passportsForm.invalid, false);
    this.indicateSectionValidity(this.airlineClearancesIcon, this.airlineClearancesForm.invalid, false);
    this.indicateSectionValidity(this.airIcon, this.airForm.invalid, false);
    this.indicateSectionValidity(this.hotelIcon, this.hotelForm.invalid, false);
    this.indicateSectionValidity(this.groundIcon, this.groundForm.invalid, false);
  }

  indicateSectionValidity(sectionIcon : MatIcon, isInvalid : boolean, required : boolean) : void {
    sectionIcon._elementRef.nativeElement.innerText = (isInvalid) ?   ((required) ? 'error'     : 'warning') : 'check_circle';
    sectionIcon._elementRef.nativeElement.style.color = (isInvalid) ? ((required) ? 'firebrick' : 'orange')  : 'green';

    this.somethingWasEdited = (this.generalForm.touched || 
                                this.travelDetailsForm.touched ||
                                this.externalAccessForm.touched || 
                                this.documentsHaveChanged);

    this.saveButtonDisabled = (this.generalForm.invalid || 
                               this.travelDetailsForm.invalid ||
                               this.externalAccessForm.invalid ||
                               !this.somethingWasEdited);
  }

  scrollToTop(panelID : string) : void {
    this.accordion.nativeElement.ownerDocument.getElementById(panelID).scrollIntoView();
  }


  prepareForFileUpload(uploadContext : any) : void {
    let caseDocumentToSave : CaseDocument = null;
    let docIndex : number = this.caseDocs[uploadContext.control.filename].findIndex( (value,index,list) => { return (value as CaseDocument).name == uploadContext.filename; } );
    
    if (docIndex > -1) {
      // Use the existing document, but add any missing details
      caseDocumentToSave = this.caseDocs[uploadContext.control.filename][docIndex] as CaseDocument;
      caseDocumentToSave['caseID'] = this.editedCase.caseID;
      caseDocumentToSave['createDate'] = new Date();
      caseDocumentToSave['name'] = uploadContext.filename;
      caseDocumentToSave['type'] = uploadContext.control.filename;

      if (caseDocumentToSave.documentID == undefined) {
        // We found a CaseDocument with a matching filename, but it hasn't been stored in the DB yet????
        // Very strange, but lets create the CaseDocument in the database, then overwrite the entry in the local CaseDocuments array
        this.docsService.createCaseDocument(this.editedCase.caseID, caseDocumentToSave).subscribe(
          (createdCaseDocument : CaseDocument) => {
            this.caseDocs[uploadContext.control.filename][docIndex] = createdCaseDocument;
  
            // Upload the file to SecureDocStorage
            (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.editedCase.caseID, createdCaseDocument.documentID);
          }
        )
      } else {
        // Update the CaseDocument in the database
        this.docsService.updateCaseDocument(this.editedCase.caseID, caseDocumentToSave.documentID, caseDocumentToSave).subscribe(
          (updatedCaseDocument : CaseDocument) => {
            this.caseDocs[uploadContext.control.filename][docIndex] = updatedCaseDocument;
  
            // Upload the file to SecureDocStorage
            (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.editedCase.caseID, updatedCaseDocument.documentID);
          }
        )
      }
    } else {
      // No existing CaseDocument was found, so we will need to create one
      caseDocumentToSave = { 
        documentID : '',
        caseID : this.editedCase.caseID,
        createDate : (new Date()),
        name : uploadContext.filename,
        type : uploadContext.control.filename
      } as CaseDocument;

      // Create the CaseDocument in the database
      this.docsService.createCaseDocument(this.editedCase.caseID, caseDocumentToSave).subscribe(
        (createdCaseDocument : CaseDocument) => {
          // Upload the file to SecureDocStorage
          (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.editedCase.caseID, createdCaseDocument.documentID);
        }
      )
    }
  }

  async fileUploaded(uploadedCaseDocument : CaseDocument) : Promise<void> {
    this.caseDocs[uploadedCaseDocument.type].push(uploadedCaseDocument);
    this.resetFileControl(uploadedCaseDocument.type);

    const toast = await this.toastController.create({
      message: 'Upload confirmd and Case updated',
      duration: 2000       
    })
    await toast.present();
    this.documentsHaveChanged = true;
    this.checkDocumentSectionValidity();
  }

  private resetFileControl(type : string) : void {
    // Remove the text (value) from the file uploader control
    switch(type) {
      case 'medicalNote':
        this.currentMedicalNoteDocument = '';
        this.medicalNoteFileControl.resetUploadFiles();        
        break;
      case 'passport':
        this.currentPassportDocument = '';
        this.passportFileControl.resetUploadFiles();        
        break;
      case 'airlineClearance':
        this.currentAirlineClearanceDocument = '';
        this.airlineClearanceFileControl.resetUploadFiles();        
        break;
      case 'air':
        this.currentAirDocument = '';
        this.airFileControl.resetUploadFiles();        
        break;
      case 'hotel':
        this.currentHotelDocument = '';
        this.hotelFileControl.resetUploadFiles();        
        break;
      case 'ground':
        this.currentGroundDocument = '';
        this.groundFileControl.resetUploadFiles();        
        break;
      default:
        break;
    }
  }
  async showUploadedFile(documentID : string, fileType : string) : Promise<void> {
    let caseDocumentIndex : number = this.caseDocs[fileType].findIndex( (value, index, list) => { return value.documentID == documentID; });
    const modal = await this.modalController.create({
      component: SkycareFileViewerComponent,
      componentProps: { 'document' : this.caseDocs[fileType][caseDocumentIndex] }
    });
    return await modal.present();
  }

  async deleteUploadedFile(documentID : string, fileType : string) : Promise<void> {
    let caseDocumentIndex : number = this.caseDocs[fileType].findIndex( (value, index, list) => { return value.documentID == documentID; });
    let documentName : string = this.caseDocs[fileType][caseDocumentIndex].name;
    
    const alert = await this.alertController.create({
      header: 'Confirm File Delete',
      message: 'Are you sure you want to delete ' + documentName +' ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'OK',
          handler: data => {
            this.docsService.deleteCaseDocumentFile(this.editedCase.caseID, documentID).subscribe(
              async () => {
                (this.caseDocs[fileType] as Array<CaseDocument>).splice(caseDocumentIndex, 1);
                const toast = await this.toastController.create({
                  message: 'Delete confirmd and Case updated',
                  duration: 2000       
                })
                toast.present();
                this.documentsHaveChanged = true;
                this.resetFileControl(fileType);
              },
              catchError( async (err:any) => {
                const toast = await this.toastController.create({
                  message: 'An error occured while deleting the file from SecureStorage',
                  showCloseButton: true       
                })
                toast.present();
              })
            )
          }
        }
      ]
    });

    await alert.present();
  }


  async saveCase() : Promise<void> {
    this.loading = await this.loadingController.create({
      message: 'Saving Case...'
    });
    await this.loading.present();

    if (this.editedCase.caseID == '') {
      this.createCase();
    } else {
      this.editCase();
    }

    this.somethingWasEdited = false;
    this.documentsHaveChanged = false;
  }

  createCase() : void {
    this.saveButtonDisabled = true;

    if (this.firstDayOfTravelDateString != '') {
      this.editedCase.firstDayOfTravel = (new Date(this.firstDayOfTravelDateString)).toISOString();
    }

    if (this.caseEscorts.length == 0) {
      this.editedCase.escorts = [];
    } else {
      this.editedCase.escorts = this.caseEscorts.map( (v,i,l) => { 
                                    let selectedEscort : Escort = this.escorts.filter( (ve,vi,vl)=>{ return (ve.escortID == v); })[0];
                                    return {
                                      escortID: v, 
                                      name: selectedEscort.name, 
                                      email: selectedEscort.user.email,
                                      paid: false} as CaseEscort; 
                                });
    }

    this.caseService.createCase(this.editedCase.companyID, this.editedCase).subscribe(
      async (createdCase : CompanyCase) => {             
        this.editedCase = createdCase;
        this.savedCase = this.editedCase;

        this.pageTitle = 'Edit existing Case';
        this.saveButtonText = 'SAVE CHANGES';

        // Add the Form validators
        this.addDocUploadFormValidators();
        
        await this.loading.dismiss();
        this.saveButtonDisabled = false; 

        // Present a success message
        const toast = await this.toastController.create({
          message: 'Successfully created a new Case!',
          duration: 2000
        });
        toast.present();
      }
    )
  }

  editCase() : void {
    this.saveButtonDisabled = true;

    if (this.firstDayOfTravelDateString != '') {
      this.editedCase.firstDayOfTravel = (new Date(this.firstDayOfTravelDateString)).toISOString();
    }

    if (this.caseEscorts.length == 0) {
      this.editedCase.escorts = [];
    } else {
      let missingEscorts : string[] = this.caseEscorts.filter( (v,i,l) => { 
        return (this.editedCase.escorts.findIndex( (vx,ix,lx) => {
          return (vx.escortID == v);
        }) == -1);
      });

      let escortsToAdd : CaseEscort[] = missingEscorts.map( (v,i,l) => { 
                                          let selectedEscort : Escort = this.escorts.filter( (ve,vi,vl)=>{ return (ve.escortID == v); })[0];
                                          return {
                                            escortID: v, 
                                            name: selectedEscort.name, 
                                            email: selectedEscort.user.email,
                                            paid: false} as CaseEscort; 
                                        });

      this.editedCase.escorts.push(...escortsToAdd);
    }

    this.caseService.updateCase(this.editedCase.companyID, this.editedCase.caseID, this.editedCase).subscribe(
      async () => {             
        await this.loading.dismiss();
        this.saveButtonDisabled = false; 

        // Present a success message
        const toast = await this.toastController.create({
          message: 'Successfully edited a Case!',
          duration: 2000
        });
        await toast.present();

        // Redirect back to the Case View, if that is where they came from
        this.router.navigate(['/case', 'view', this.editedCase.caseID]);

      }
    )
  }

}
