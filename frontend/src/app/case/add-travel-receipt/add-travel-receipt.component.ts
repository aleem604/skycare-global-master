import { Component, OnInit, ViewChild, ElementRef }         from '@angular/core';
import { Router, ActivatedRoute }                           from '@angular/router';
import { HttpClient, HttpRequest }                          from '@angular/common/http';
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl }  from '@angular/forms';
import { MatFormField, MatInput}                            from '@angular/material';
import { Observable }                                       from 'rxjs';
import { debounceTime, switchMap }                          from 'rxjs/operators';
import { ModalController, LoadingController, NavParams, ToastController }    from '@ionic/angular';

import { SkycareFileUploaderComponent } from '../../controls/file-uploader/file-uploader.component';
import { DataService } from '../../controls/data.service';
import { FileUploadedValidator } from '../../validators/fileUploaded.validator';
import { CaseEscortReceipt } from '../../apiClient';
import { DocumentsService } from '../../documents/documents.service';
import { DateValidator } from '../../validators/date.validator';

@Component({
  selector: 'app-add-travel-receipt',
  templateUrl: './add-travel-receipt.component.html',
  styleUrls: ['./add-travel-receipt.component.scss']
})
export class AddTravelReceiptComponent implements OnInit {

  public existingReceipts : CaseEscortReceipt[] = [];
  public receipt : CaseEscortReceipt = {
    receiptID : '',
    caseID : '',
    createDate : new Date(),
    escortID : '',
    alternateName: '',
    name : '',
    amount : undefined,
    currencyType : '',
    storageHash : ''
  };

  public todayDateString : string = (new Date()).toISOString();
  public receiptDateString : string = '';

  public calculatedUSDAmount : number = 0.00;

  public currencyTypes : Observable<string[]>;

  public travelReceiptsForm: FormGroup;
  @ViewChild('amountControl')                                 public amountControl : any;
  @ViewChild('currencyTypeControl')                           public currencyTypeControl : MatInput;
  @ViewChild('receiptDateControl')                            public receiptDateControl : MatInput;
  @ViewChild('travelReceiptFileControl')                      public travelReceiptFileControl : SkycareFileUploaderComponent;


  public validationMessages : any = {
    'amount': [
      { type: 'required', message: 'Receipt amount is required.' },
    ],
    'currencyType': [
      { type: 'required', message: 'Currency type is required.' }
    ],
    'receiptDate': [
      { type: 'required', message: 'Receipt date is required.' },
      { type: 'not-before-today', message: 'Receipt date must be before today.' }
    ],
    'description': [
      { type: 'required', message: 'Description is required.' }
    ],
    'travelReceiptFile': [
      { type: 'required', message: 'Travel receipt is required.' },
      { type: 'not-uploaded', message: 'Travel receipt has not been uploaded.' },
    ]
  };




  constructor(
    private dataService: DataService,
    private docsService : DocumentsService,
    private modalController : ModalController,
    private loadingController : LoadingController,
    private toaster: ToastController,
    private navParams: NavParams,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private domAccessor : ElementRef,
    private httpClient: HttpClient ) { }

  ngOnInit() {
    this.setupForm();
  }

  setupForm() : void {
    this.travelReceiptsForm = this.formBuilder.group({
      amountControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      currencyTypeControl: new FormControl('', Validators.compose([
                            Validators.required
                        ])),
      receiptDateControl: new FormControl('', Validators.compose([
                            Validators.required,
                            DateValidator.isBeforeToday(true)
      ])),
      alternateNameControl: new FormControl('', Validators.required),
      travelReceiptFileControl: new FormControl('', Validators.compose([
                            FileUploadedValidator.hasBeenUploaded()
                        ]))
    });

    this.currencyTypes = this.travelReceiptsForm.get('currencyTypeControl').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchCurrencies(newValue);
      })
    );
  }


  ionViewWillEnter() {
    let suppliedER : CaseEscortReceipt[] | undefined = this.navParams.get('escortReceipts');    
    if ( suppliedER !== undefined && suppliedER != null ) {
      this.existingReceipts = suppliedER;
    }
    let suppliedCaseID : string | undefined = this.navParams.get('caseID');    
    if ( suppliedCaseID !== undefined && suppliedCaseID != null ) {
      this.receipt.caseID = suppliedCaseID;
    }
    let suppliedEscortID : string | undefined = this.navParams.get('escortID');    
    if ( suppliedEscortID !== undefined && suppliedEscortID != null ) {
      this.receipt.escortID = suppliedEscortID;
    }
  }

  calculateAmount() : void {
    let ctc : AbstractControl = this.travelReceiptsForm.get('currencyTypeControl');
    let ac : AbstractControl = this.travelReceiptsForm.get('amountControl');
    let rdc : AbstractControl = this.travelReceiptsForm.get('receiptDateControl');
    if (ctc.value === undefined || ctc.value.trim() == '' || ctc.errors != null) { return; }
    if (ac.value === undefined || ac.value.trim() == '' || ac.errors != null) { return; }
    if (rdc.errors != null) { return; }
    
    let amount : number = parseFloat(ac.value);
    let selectedCurrencySymbol : string = ctc.value.substr(ctc.value.indexOf('(') + 1, 3);

    if (selectedCurrencySymbol == 'USD') {
      this.calculatedUSDAmount = amount;
      return;
    }

    let selectedDate : Date = new Date(rdc.value.valueOf());

    this.dataService.getCurrencyFOREXRate(selectedDate, selectedCurrencySymbol, 'USD', amount).then( (calculatedAmount:number)=>{
      this.calculatedUSDAmount = calculatedAmount;
    }).catch( async (error)=>{
      let toast = await this.toaster.create({
        color: 'danger',
        message: 'The selected currency could not be converted',
        showCloseButton: true
      });
      await toast.present();
    });
  }

  receiptAmountHasError() : boolean {
    return (this.getReceiptAmountErrorMessage() !== undefined);
  }

  getReceiptAmountErrorMessage() : string|undefined {
    if (this.travelReceiptsForm.get('amountControl').hasError(this.validationMessages.amount[0].type)  && 
          (this.travelReceiptsForm.get('amountControl').dirty || this.travelReceiptsForm.get('amountControl').touched)) {
      return this.validationMessages.amount[0].message;
    }
    if (this.travelReceiptsForm.get('currencyTypeControl').hasError(this.validationMessages.currencyType[0].type)  && 
          (this.travelReceiptsForm.get('currencyTypeControl').dirty || this.travelReceiptsForm.get('currencyTypeControl').touched)) {
      return this.validationMessages.currencyType[0].message;
    }

    return undefined;
  }

  prepareForFileUpload(uploadContext : any) : void {
    let escortReceiptToSave : CaseEscortReceipt = null;
    let docIndex : number = this.existingReceipts.findIndex( (value,index,list) => { return value.name == uploadContext.control.filename; } );
    
    if (docIndex > -1) {
      // Use the existing document, but add any missing details
      escortReceiptToSave = this.existingReceipts[docIndex] as CaseEscortReceipt;
      escortReceiptToSave.createDate = new Date();
      escortReceiptToSave.alternateName = this.receipt.alternateName;
      escortReceiptToSave.amount = parseFloat(this.receipt.amount);
      escortReceiptToSave.currencyType = this.receipt.currencyType;
      escortReceiptToSave.receiptDate = (new Date(this.receiptDateString));
      escortReceiptToSave.usdAmount = this.calculatedUSDAmount;

      if (escortReceiptToSave.receiptID == undefined) {
        // Create the CaseEscortReceipt in the database
        this.docsService.createCaseEscortReceipt(this.receipt.caseID, escortReceiptToSave).subscribe(
          (createdEscortReceipt : CaseEscortReceipt) => {
            this.existingReceipts[docIndex] = createdEscortReceipt;
  
            // Upload the file to SecureDocStorage
            (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.receipt.caseID, createdEscortReceipt.receiptID);
          }
        )
      } else {
        // Update the CaseEscortReceipt in the database
        this.docsService.updateCaseEscortReceipt(this.receipt.caseID, escortReceiptToSave.receiptID, escortReceiptToSave).subscribe(
          (updatedEscortReceipt : CaseEscortReceipt) => {
            this.existingReceipts[docIndex] = updatedEscortReceipt;
  
            // Upload the file to SecureDocStorage
            (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.receipt.caseID, updatedEscortReceipt.receiptID);
          }
        )
      }
    } else {
      // No existing CaseEscortReceipt was found, so we will need to create one
      this.receipt.name = uploadContext.filename;
      this.receipt.createDate = new Date();
      this.receipt.amount = parseFloat(this.receipt.amount);
      this.receipt.receiptDate = (new Date(this.receiptDateString));
      this.receipt.usdAmount = this.calculatedUSDAmount;

      // Create the CaseEscortReceipt in the database
      this.docsService.createCaseEscortReceipt(this.receipt.caseID, this.receipt).subscribe(
        (createdEscortReceipt : CaseEscortReceipt) => {
          // Upload the file to SecureDocStorage
          (uploadContext.control as SkycareFileUploaderComponent).finishUploadFiles(this.receipt.caseID, createdEscortReceipt.receiptID);
        }
      )
    }
  }

  fileUploaded(uploadedEscortReceipt : CaseEscortReceipt) : void {
    //this.existingReceipts[uploadedEscortReceipt.type] = uploadedEscortReceipt;
    console.log(uploadedEscortReceipt);
    this.modalController.dismiss(  { receipt: uploadedEscortReceipt } ).then(()=>{});
  }

  async closeTravelReceipt() { await this.modalController.dismiss(); }

}
