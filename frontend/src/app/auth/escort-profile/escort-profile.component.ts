import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute }             from '@angular/router';
import { ToastController, 
         AlertController, 
         ModalController, 
         LoadingController }                  from '@ionic/angular';
import { Validators, 
         FormBuilder, 
         FormGroup, 
         FormControl }                        from '@angular/forms';
import { MatExpansionModule,
         MatAccordion, 
         MatExpansionPanel, 
         MatExpansionPanelHeader, 
         MatExpansionPanelTitle, 
         MatExpansionPanelDescription,
         MatExpansionPanelActionRow, 
         ThemePalette,
         MatIcon,
         MatFormField,
         MatDatepicker,
         MatInput}                            from '@angular/material';

import { Observable } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';

import { AuthService }                        from '../auth.service';
import { DataService }                        from '../../controls/data.service';
import { DocumentsService }                   from '../../documents/documents.service';
import { Escort, EscortDocument }             from '../../apiClient';
import { SkycareFileUploaderComponent }       from '../../controls/file-uploader/file-uploader.component';
import { SkycareFileViewerComponent }         from '../../controls/file-viewer/file-viewer.component';
import { FileUploadedValidator }              from '../../validators/fileUploaded.validator';
import { DateValidator }                      from '../../validators/date.validator';
import { BankRoutingValidator }               from '../../validators/bankRouting.validator';




@Component({
  selector: 'app-escort-profile',
  templateUrl: './escort-profile.component.html',
  styleUrls: ['./escort-profile.component.scss']
})
export class EscortProfileComponent implements OnInit {

  private savedEscort : Escort = null;
  public editedEscort : Escort = {
    licenseType: '',
    licenseExpiration: (new Date()).toISOString(),
    userID: '',
    escortID: ''
  } as Escort;
  
  public escortDocs : any = {
    'confidentialityOathFile': { name: '' },
    'contractorAgreementFile': { name: '' },
    'controlAttestationFile': { name: '' },
    'licenseFile': { name: '' },
    'alsFile': { name: '' },
    'passportFile': { name: '' },
    'visa1File': { name: '' },
    'visa2File': { name: '' },
    'visa3File': { name: '' }
  };
  
  public bankRoutingType : string = '';

  public passportExpirationDateString : string = '';
  public licenseExpirationDateString : string = '';
  public alsExpirationDateString : string = '';
  public minimumExpirationDateString : string = (new Date()).toISOString();

  public passportCountries : Observable<string[]>;
  public visa1Countries : Observable<string[]>;
  public visa2Countries : Observable<string[]>;
  public visa3Countries : Observable<string[]>;
  public paymentBankCountries : Observable<string[]>;
  public languages1 : Observable<string[]>;
  public languages2 : Observable<string[]>;
  public languages3 : Observable<string[]>;
  public languages4 : Observable<string[]>;

  public generalForm: FormGroup;
  @ViewChild('generalIcon')             public generalIcon : MatIcon;

  public licenseForm: FormGroup;
  @ViewChild('licenseIcon')             public licenseIcon : MatIcon;
  @ViewChild('licenseFileControl')      public licenseFileControl : SkycareFileUploaderComponent;
  @ViewChild('alsFileControl')          public alsFileControl : SkycareFileUploaderComponent;

  public travelDocsForm: FormGroup;
  @ViewChild('travelDocsIcon')          public travelDocsIcon : MatIcon;
  @ViewChild('passportFileControl')     public passportFileControl : SkycareFileUploaderComponent;
  @ViewChild('passportCountryControl')  public passportCountryControl : MatInput;
  @ViewChild('visa1FileControl')        public visa1FileControl : SkycareFileUploaderComponent;
  @ViewChild('visa1CountryControl')     public visa1CountryControl : MatInput;
  @ViewChild('visa2FileControl')        public visa2FileControl : SkycareFileUploaderComponent;
  @ViewChild('visa2CountryControl')     public visa2CountryControl : MatInput;
  @ViewChild('visa3FileControl')        public visa3FileControl : SkycareFileUploaderComponent;
  @ViewChild('visa3CountryControl')     public visa3CountryControl : MatInput;

  public languagesForm: FormGroup;
  @ViewChild('languagesIcon')           public languagesIcon : MatIcon;
  @ViewChild('language1Control')        public language1Control : MatInput;
  @ViewChild('language2Control')        public language2Control : MatInput;
  @ViewChild('language3Control')        public language3Control : MatInput;
  @ViewChild('language4Control')        public language4Control : MatInput;

  public emergencyContactForm: FormGroup;
  @ViewChild('emergencyContactIcon')    public emergencyContactIcon : MatIcon;

  public availabilityForm: FormGroup;
  @ViewChild('availabilityIcon')        public availabilityIcon : MatIcon;

  public paymentInfoForm: FormGroup;
  @ViewChild('paymentInfoIcon')         public paymentInfoIcon : MatIcon;
  @ViewChild('paymentBankCountryControl') public paymentBankCountryControl : MatInput;
  
  public newHireForm: FormGroup;
  @ViewChild('newHireFormIcon')                     public newHireFormIcon : MatIcon;
  @ViewChild('confidentialityOathFileControl')      public confidentialityOathFileControl : SkycareFileUploaderComponent;
  @ViewChild('contractorAgreementFileControl')      public contractorAgreementFileControl : SkycareFileUploaderComponent;
  @ViewChild('controlAttestationFileControl')       public controlAttestationFileControl : SkycareFileUploaderComponent;
    

  private somethingWasEdited : boolean = false;
  public saveButtonDisabled : boolean = false;

  public validationMessages : any = {
    'name': [
      { type: 'required', message: 'Name is required.' }
    ],
    'homeAirportCity': [
      { type: 'required', message: 'Home airport city is required.' }
    ],
    'confidentialityOathFile': [
      { type: 'not-uploaded', message: 'Confidentiality oath has not been uploaded.' },
    ],
    'contractorAgreementFile': [
      { type: 'not-uploaded', message: 'Contractor agreement has not been uploaded.' },
    ],
    'controlAttestationFile': [
      { type: 'not-uploaded', message: 'Attestation has not been uploaded.' },
    ],
    'licenseExpiration': [
      { type: 'not-after-today', message: 'License expiration must be after today.' }
    ],
    'licenseFile': [
      { type: 'not-uploaded', message: 'License has not been uploaded.' },
    ],
    'alsExpiration': [
      { type: 'not-after-today', message: 'ALS/ACLS expiration must be after today.' }
    ],
    'alsFile': [
      { type: 'not-uploaded', message: 'ALS/ACLS has not been uploaded.' },
    ],
    'passportFile': [
      { type: 'not-uploaded', message: 'Passport has not been uploaded.' },
    ],   
    'passportCountry': [
      { type: 'required', message: 'Passport country is required.' },
    ],
    'passportExpiration': [
      { type: 'not-after-today', message: 'Passport expiration must be after today.' }
    ],
    'visa1File': [
      { type: 'not-uploaded', message: 'Copy of your 1st visa has not been uploaded.' },
    ],   
    'visa1Country': [
      { type: 'required', message: '1st visa country is required.' },
    ],
    'visa2File': [
      { type: 'not-uploaded', message: 'Copy of your 2nd visa has not been uploaded.' },
    ],   
    'visa2Country': [
      { type: 'required', message: '2nd visa country is required.' },
    ],
    'visa3File': [
      { type: 'not-uploaded', message: 'Copy of your 3th visa has not been uploaded.' },
    ],   
    'visa3Country': [
      { type: 'required', message: '3rd visa country is required.' },
    ],
    'emergencyContactName': [
      { type: 'required', message: 'Emergency contact name is required.' }
    ],
    'emergencyContactRelation': [
      { type: 'required', message: 'Relation is required.' }
    ],
    'emergencyContactPhone': [
      { type: 'required', message: 'Emergency contact phone is required.' },
      { type: 'invalid', message: 'Emergency Contact phone is not valid.' },
    ],
    'paymentBankABARoutingNumber': [
      { type: 'invalid-aba', message: 'ABA Number is not valid.' }
    ],
    'paymentBankIBANRoutingNumber': [
      { type: 'invalid-iban', message: 'IBAN Code is not valid.' }
    ],
    'paymentBankBICRoutingNumber': [
      { type: 'invalid-bic', message: 'BIC Code is not valid.' }
    ],
    'paymentBankSWIFTRoutingNumber': [
      { type: 'invalid-swift', message: 'SWIFT Code is not valid.' }
    ],
    'language1': [
      { type: 'required', message: 'Language #1 is required.' }
    ],
    'phone': [
      { type: 'required', message: 'Phone number is required.' },
      { type: 'invalid', message: 'Phone number is not valid.' },
    ]
  };

  public paymentValidationMessages : any[] = [];



  constructor(private authService: AuthService,
              private dataService: DataService,
              private docsService: DocumentsService,
              private toastController: ToastController,
              private alertController: AlertController,
              private modalController : ModalController,
              private loadingController : LoadingController,
              private router: Router,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private domAccessor : ElementRef) { 
  }

  async ngOnInit() {

    this.generalForm = this.formBuilder.group({
      nameControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      homeAirportCityControl: new FormControl('', Validators.compose([
                            Validators.required
                        ]))
    });
        
    this.generalForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.generalIcon, this.generalForm.invalid, true); }
    );

    this.licenseForm = this.formBuilder.group({
      licenseTypeControl: new FormControl(''),
      licenseExpirationControl: new FormControl('', Validators.compose([
                            DateValidator.isAfterToday(false)
                        ])),
      licenseFileControl: new FormControl(''),
      alsExpirationControl: new FormControl('', Validators.compose([
                            DateValidator.isAfterToday(false)
                        ])),
      alsFileControl: new FormControl('')
    });
        
    this.licenseForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.licenseIcon, this.licenseForm.invalid, false); }
    );

    this.travelDocsForm = this.formBuilder.group({
      passportFileControl: new FormControl('', Validators.compose([
                            FileUploadedValidator.hasBeenUploaded()
                        ])),
      passportCountryControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      passportExpirationControl: new FormControl('', Validators.compose([
                            DateValidator.isAfterToday(true)
                        ])),
      visa1FileControl: new FormControl('', Validators.compose([
                            FileUploadedValidator.hasBeenUploaded()
                        ])),
      visa1CountryControl: new FormControl(''),
      visa2FileControl: new FormControl('', Validators.compose([
                            FileUploadedValidator.hasBeenUploaded()
                        ])),
      visa2CountryControl: new FormControl(''),
      visa3FileControl: new FormControl('', Validators.compose([
                            FileUploadedValidator.hasBeenUploaded()
                        ])),
      visa3CountryControl: new FormControl('')
    });
        
    this.travelDocsForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.travelDocsIcon, this.travelDocsForm.invalid, false); }
    );

    this.passportCountries = this.travelDocsForm.get('passportCountryControl').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchCountries(newValue);
      })
    );

    this.visa1Countries = this.travelDocsForm.get('visa1CountryControl').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchCountries(newValue);
      })
    );

    this.visa2Countries = this.travelDocsForm.get('visa2CountryControl').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchCountries(newValue);
      })
    );

    this.visa3Countries = this.travelDocsForm.get('visa3CountryControl').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchCountries(newValue);
      })
    );

    this.languagesForm = this.formBuilder.group({
      language1Control: new FormControl('language1Control', Validators.compose([
                            Validators.required
                        ])),
      language2Control: new FormControl('language2Control'),
      language3Control: new FormControl('language3Control'),
      language4Control: new FormControl('language4Control'),
    });
        
    this.languagesForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.languagesIcon, this.languagesForm.invalid, true); }
    );

    this.languages1 = this.languagesForm.get('language1Control').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchLanguages(newValue);
      })
    );

    this.languages2 = this.languagesForm.get('language2Control').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchLanguages(newValue);
      })
    );

    this.languages3 = this.languagesForm.get('language3Control').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchLanguages(newValue);
      })
    );

    this.languages4 = this.languagesForm.get('language4Control').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchLanguages(newValue);
      })
    );

    this.emergencyContactForm = this.formBuilder.group({
      emergencyContactNameControl: new FormControl('emergencyContactNameControl', Validators.required),
      emergencyContactRelationControl: new FormControl('emergencyContactRelationControl', Validators.required),
      emergencyContactPhoneControl: new FormControl('emergencyContactPhoneControl', Validators.required)
    });
    
    this.emergencyContactForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.emergencyContactIcon, this.emergencyContactForm.invalid, true); }
    );

    this.availabilityForm = this.formBuilder.group({
      availabilityCalendarControl: new FormControl('')
    });
        
    this.availabilityForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.availabilityIcon, this.availabilityForm.invalid, false); }
    );

    this.paymentInfoForm = this.formBuilder.group({
      paymentAccountNameControl: new FormControl(''),
      paymentBankNameControl: new FormControl(''),
      paymentBankAddress1Control: new FormControl(''),
      paymentBankAddress2Control: new FormControl(''),
      paymentBankCityControl: new FormControl(''),
      paymentBankRegionControl: new FormControl(''),
      paymentBankCountryControl: new FormControl('paymentBankCountryControl'),
      paymentBankPostalCodeControl: new FormControl(''),
      paymentBankRoutingTypeControl: new FormControl(''),
      paymentBankABARoutingNumberControl: new FormControl('', Validators.compose([
                            BankRoutingValidator.validABA('paymentBankRoutingTypeControl')
                        ])),
      paymentBankIBANRoutingNumberControl: new FormControl('', Validators.compose([
                            BankRoutingValidator.validIBAN('paymentBankRoutingTypeControl')
                        ])),
      paymentBankBICRoutingNumberControl: new FormControl('', Validators.compose([
                            BankRoutingValidator.validBIC('paymentBankRoutingTypeControl')
                        ])),
      paymentBankSWIFTRoutingNumberControl: new FormControl('', Validators.compose([
                            BankRoutingValidator.validSWIFT('paymentBankRoutingTypeControl')
                        ])),
      paymentBankAccountNumberControl: new FormControl('')
    });
        
    this.paymentInfoForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.paymentInfoIcon, this.paymentInfoForm.invalid, false); }
    );

    this.paymentBankCountries = this.paymentInfoForm.get('paymentBankCountryControl').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchCountries(newValue);
      })
    );

    this.paymentInfoForm.get('paymentBankRoutingTypeControl').valueChanges.subscribe(
      (newValue:string) => {
        if (newValue === undefined) { return; }
        switch (newValue) {
          case 'aba':
            this.paymentInfoForm.get('paymentBankIBANRoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankBICRoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankSWIFTRoutingNumberControl').setValue('');
            break;
          case 'iban':
            this.paymentInfoForm.get('paymentBankABARoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankBICRoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankSWIFTRoutingNumberControl').setValue('');
            break;
          case 'bic':
            this.paymentInfoForm.get('paymentBankABARoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankIBANRoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankSWIFTRoutingNumberControl').setValue('');
            break;
          case 'swift':
            this.paymentInfoForm.get('paymentBankABARoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankIBANRoutingNumberControl').setValue('');
            this.paymentInfoForm.get('paymentBankBICRoutingNumberControl').setValue('');
            break;
        }
        this.paymentInfoForm.get('paymentBankABARoutingNumberControl').updateValueAndValidity();
        this.paymentInfoForm.get('paymentBankIBANRoutingNumberControl').updateValueAndValidity();
        this.paymentInfoForm.get('paymentBankBICRoutingNumberControl').updateValueAndValidity();
        this.paymentInfoForm.get('paymentBankSWIFTRoutingNumberControl').updateValueAndValidity();
      }
    )

    this.newHireForm = this.formBuilder.group({
      confidentialityOathFileControl: new FormControl(''),
      contractorAgreementFileControl: new FormControl(''),
      controlAttestationFileControl: new FormControl('')
    });
        
    this.newHireForm.statusChanges.subscribe(
      (observer:any) => { this.indicateSectionValidity(this.newHireFormIcon, this.newHireForm.invalid, false); }
    );



    /*
    this.licenseForm = this.formBuilder.group({
      emailControl: new FormControl('', {
            validators: Validators.compose([
                            Validators.required
                        ]),
            asyncValidators: [ this.emailValidator.emailTaken.bind(this.emailValidator) ],
            updateOn: 'blur'}),
      passwordControl: new FormControl('', Validators.compose([
                            Validators.required,
                            Validators.minLength(8)
                        ])),
      confirmPasswordControl: new FormControl('', Validators.compose([
                            Validators.required,
                            Validators.minLength(8),
                            PasswordValidator.areEqual('passwordControl')
                        ])),
      phoneControl: new FormControl('', Validators.compose([ Validators.required ])),
    });
        
    this.licenseForm.statusChanges.subscribe(
      (observer:any) => {
        this.saveButtonDisabled = this.licenseForm.invalid;
      }
    );
    */


    await this.loadEscort();
  }


  async loadEscort() : Promise<void> {
    (await this.authService.getProfile()).subscribe(
      (profile:any[]) => {
        this.savedEscort = profile[0];
        this.editedEscort = profile[0];

        this.indicateSectionValidity(this.emergencyContactIcon, this.emergencyContactForm.invalid, true);

        if (this.editedEscort.passportExpiration != undefined) {
          this.passportExpirationDateString = this.editedEscort.passportExpiration;
        }

        if (this.editedEscort.licenseExpiration != undefined) {
          this.licenseExpirationDateString = this.editedEscort.licenseExpiration;
        }

        if (this.editedEscort.alsExpiration != undefined) {
          this.alsExpirationDateString = this.editedEscort.alsExpiration;
        }

        if (this.editedEscort.paymentIntlRoutingNumber === undefined) {
          this.bankRoutingType = 'aba';
        } else if (this.editedEscort.paymentIntlRoutingNumber.trim() == '') {
          this.bankRoutingType = 'iban';
        } else {
          let routeNum : string = this.editedEscort.paymentIntlRoutingNumber;
          if (BankRoutingValidator.isValidSWIFT(routeNum)) {
            this.bankRoutingType = 'swift';
          } else if (BankRoutingValidator.isValidBIC(routeNum)) {
            this.bankRoutingType = 'bic';
          } else {
            this.bankRoutingType = 'iban';
          }
        }

        this.docsService.getEscortDocumentsFlattened(profile[0].escortID).subscribe(
          (flattenedEscortDocs : any) => {
            let flattenedKeys : string[] = Object.keys(flattenedEscortDocs);
            for (let i = 0; i < flattenedKeys.length; i++) {
              this.escortDocs[flattenedKeys[i]] = flattenedEscortDocs[flattenedKeys[i]];
            }
          },
          async (docsError:any) => {
            const toast = await this.toastController.create({
              message: 'ERROR: Failed to load the Profile Documents. Contact Support',
              showCloseButton: true       
            })
            toast.present();
            console.log(docsError);
          }
        )
      },
      async (profileError:any) => {
        const toast = await this.toastController.create({
          message: 'ERROR: Failed to load the Escort Profile. Contact Support',
          showCloseButton: true       
        })
        toast.present();
        console.log(profileError);
      }
    );
  }

  indicateSectionValidity(sectionIcon : MatIcon, isInvalid : boolean, required : boolean) : void {
    sectionIcon._elementRef.nativeElement.innerText = (isInvalid) ?   ((required) ? 'error'     : 'warning') : 'check_circle';
    sectionIcon._elementRef.nativeElement.style.color = (isInvalid) ? ((required) ? 'firebrick' : 'orange')  : 'green';

    this.somethingWasEdited = (this.generalForm.touched || 
                                this.newHireForm.touched ||
                                this.licenseForm.touched || 
                                this.travelDocsForm.touched ||
                                this.emergencyContactForm.touched ||
                                this.paymentInfoForm.touched ||
                                this.availabilityForm.touched ||
                                this.languagesForm.touched);

    this.saveButtonDisabled = (this.generalForm.invalid ||
                                this.emergencyContactForm.invalid ||
                                this.languagesForm.invalid ||
                                !this.somethingWasEdited);
  }

  paymentAddressControlHasValidationError(validation : any) : boolean {
    let controlName : string = Object.keys(validation)[0];
    let controlError : any = Object.values(validation)[0][0];
    return this.paymentInfoForm.get(controlName).hasError(controlError.type) && (this.paymentInfoForm.get(controlName).dirty || this.paymentInfoForm.get(controlName).touched);
  }

  getAddressValidationMessage(validation : any) : string {
    return (Object.values(validation)[0][0] as any).message;
  }

  async passwordReset(){
    let alert = await this.alertController.create({
      header: 'Password Reset',
      inputs: [
        {
          name: 'email',
          placeholder: 'Email'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => { console.log('Cancel clicked'); }
        },
        {
          text: 'Reset',
          handler: data => {
            this.authService.resetPassword(data.email).subscribe(
              async (success:boolean) => {
                if (success) {
                  const toast = await this.toastController.create({
                    message: 'A password reset link has been sent to your email.',
                    showCloseButton: true       
                  })
                  toast.present();
                } else {
                  const toast = await this.toastController.create({
                    message: 'An error occured while creating the password reset link.',
                    showCloseButton: true       
                  })
                  toast.present();
                }
              }
            )
          }
        }
      ]
    });
    alert.present();
  }  

  async saveProfile() : Promise<void> {
    this.saveButtonDisabled = true;

    const loading = await this.loadingController.create({
      message: 'Saving Profile...'
    });
    await loading.present();

    if (this.passportExpirationDateString != '') {
      this.editedEscort.passportExpiration = (new Date(this.passportExpirationDateString)).toISOString();
    }
    if (this.licenseExpirationDateString != '') {
      this.editedEscort.licenseExpiration = (new Date(this.licenseExpirationDateString)).toISOString();
    }
    if (this.alsExpirationDateString != '') {
      this.editedEscort.alsExpiration = (new Date(this.alsExpirationDateString)).toISOString();
    }

    this.editedEscort.emergencyContactPhone = this.editedEscort.emergencyContactPhone.toString();
    this.authService.saveProfile(this.editedEscort).subscribe(
      async (profileSaved : boolean) => {
        await loading.dismiss();

        if (profileSaved) {
          this.savedEscort = this.editedEscort;
          this.saveButtonDisabled = false;
          const toast = await this.toastController.create({
            message: 'Successfully saved your profile!',
            duration: 2000
          });
          toast.present();
        } else {
          this.saveButtonDisabled = false;
          const toast = await this.toastController.create({
            message: 'Failed to save the profile.  Contact Support.',
            showCloseButton: true
          });
          toast.present();
        }
      }
    )
  }

  prepareForFileUpload(uploadContext : any) : void {
    let escortDocumentToSave : EscortDocument = null;
    let docIndex : number = Object.keys(this.escortDocs).findIndex( (value,index,list) => { return value == uploadContext.control.filename; } );
    
    if (docIndex > -1) {
      // Use the existing document, but add any missing details
      escortDocumentToSave = Object.values(this.escortDocs)[docIndex] as EscortDocument;
      escortDocumentToSave['escortID'] = this.editedEscort.escortID;
      escortDocumentToSave['createDate'] = new Date();
      escortDocumentToSave['name'] = uploadContext.filename;
      escortDocumentToSave['type'] = uploadContext.control.filename;

      if (escortDocumentToSave.documentID == undefined) {
        // Create the EscortDocument in the database
        this.docsService.createEscortDocument(this.editedEscort.escortID, escortDocumentToSave).subscribe(
          (createdEscortDocument : EscortDocument) => {
            this.escortDocs[uploadContext.control.filename] = createdEscortDocument;
  
            // Upload the file to SecureDocStorage
            (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.editedEscort.escortID, createdEscortDocument.documentID);
          }
        )
      } else {
        // Update the EscortDocument in the database
        this.docsService.updateEscortDocument(this.editedEscort.escortID, escortDocumentToSave.documentID, escortDocumentToSave).subscribe(
          (updatedEscortDocument : EscortDocument) => {
            this.escortDocs[uploadContext.control.filename] = updatedEscortDocument;
  
            // Upload the file to SecureDocStorage
            (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.editedEscort.escortID, updatedEscortDocument.documentID);
          }
        )
      }
    } else {
      // No existing EscortDocument was found, so we will need to create one
      escortDocumentToSave = { 
        documentID : '',
        escortID : this.editedEscort.escortID,
        createDate : (new Date()),
        name : uploadContext.filename,
        type : uploadContext.control.filename
      } as EscortDocument;

      // Create the EscortDocument in the database
      this.docsService.createEscortDocument(this.editedEscort.escortID, escortDocumentToSave).subscribe(
        (createdEscortDocument : EscortDocument) => {
          this.escortDocs[uploadContext.control.filename] = createdEscortDocument;

          // Upload the file to SecureDocStorage
          (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.editedEscort.escortID, createdEscortDocument.documentID);
        }
      )
    }
  }

  fileUploaded(uploadedEscortDocument : EscortDocument) : void {
    this.escortDocs[uploadedEscortDocument.type] = uploadedEscortDocument;
    console.log(uploadedEscortDocument);
  }

  async showUploadedFile(fileType : string) : Promise<void> {
    const modal = await this.modalController.create({
      component: SkycareFileViewerComponent,
      componentProps: { 'document' : this.escortDocs[fileType] }
    });
    return await modal.present();
  }

}
