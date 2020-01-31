import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { ModalController, NavParams } from '@ionic/angular';
import { CasePatientProgress, CaseTransportConsent, CompanyCase } from '../../apiClient';
import { DateValidator } from '../../validators/date.validator';

@Component({
  selector: 'app-patient-consent',
  templateUrl: './patient-consent.component.html',
  styleUrls: ['./patient-consent.component.scss']
})
export class PatientConsentComponent implements OnInit {

  @ViewChild('slidesController') slidesController : any;
  public slideOptions = { 
    effect: 'cube',
    allowTouchMove: false,
    preventClicks: false,
    simulateTouch: false
  };
  public finishConsentInfoButtonDisabled : boolean = false;
  public finishSignatureButtonDisabled : boolean = false;


  @ViewChild(SignaturePad) signaturePad: SignaturePad; 
  public signaturePadOptions: Object = { 
    'minWidth': 1,
    'canvasWidth': 100,
    'canvasHeight': 100
  };
  

  public relatedCase : CompanyCase;
  public co : CaseTransportConsent = {
    signature: '',
    signersName: '',
    signatureDate: '',
    signersRelationshipToPatient: '',
    patientName: '',
    patientDOB: '',
    fromLocation: '',
    toLocation: ''
  } as CaseTransportConsent;


  public consentInfoForm: FormGroup;

  public validationMessages : any = {
    'patientName': [
      { type: 'required', message: 'Patient name is required.' }
    ],
    'patientDOB': [
      { type: 'required', message: 'Patient date of birth is required.' },
      { type: 'not-before-today', message: 'Patient date of birth must be before today.' }
    ],
    'signerName': [
      { type: 'required', message: 'Signer name is required.' }
    ],
    'signerRelationship': [
      { type: 'required', message: 'Signer relationship is required.' }
    ],
  };



  constructor(private modalController: ModalController,
              private navParams: NavParams,
              private formBuilder: FormBuilder,
              private domAccessor : ElementRef,) { }


  ngOnInit() {

    this.consentInfoForm = this.formBuilder.group({
      patientNameControl: new FormControl('', Validators.required),
      patientDOBControl: new FormControl('', Validators.compose([
                                  Validators.required,
                                  DateValidator.isBeforeToday(true)
      ])),
      signerNameControl: new FormControl('', Validators.required),
      signerRelationshipControl: new FormControl('', Validators.required),
    });

    this.domAccessor.nativeElement.ownerDocument.defaultView.addEventListener('resize', this.resizeSignaturePad.bind(this));

  }



  ionViewWillEnter() {
    let suppliedCase : CompanyCase | undefined = this.navParams.get('relatedCase');
    if ( suppliedCase !== undefined && suppliedCase != null ) {
      this.relatedCase = suppliedCase;
      this.co.patientName = this.relatedCase.patientFirstName + ' ' + this.relatedCase.patientLastName;
      this.co.fromLocation = this.relatedCase.originCity;
      this.co.toLocation = this.relatedCase.destinationCity;
    }
  }



  formControlHasError(form : FormGroup, controlName : string, validationMessages : any) : boolean {
    return form.get(controlName).hasError(validationMessages.type) && 
              (form.get(controlName).dirty || form.get(controlName).touched);
  }



  next(isSignature : boolean = false) : void { 
    this.slidesController.slideNext().then( () => {  
      this.slidesController.update().then(()=>{ return; });
      if (isSignature) { this.resizeSignaturePad(); }
    });
  }
  async prev() : Promise<void> { await this.slidesController.slidePrev(); }



  resizeSignaturePad() : void {
    let originalSignature : string = '';
    if (!this.signaturePad.isEmpty()) { originalSignature = this.signaturePad.toDataURL(); }

    let width : number = parseInt(this.domAccessor.nativeElement.clientWidth)-18;
    let height : number = parseInt(this.domAccessor.nativeElement.clientHeight)-150;
    this.signaturePad.set('canvasWidth', width);
    this.signaturePad.set('canvasHeight', height);

    if (originalSignature.length > 0) { this.signaturePad.fromDataURL(originalSignature, { width, height }); }
  }
  resetSignature() { 
    this.finishSignatureButtonDisabled = true;
    this.signaturePad.clear(); 
  }
  drawComplete() { this.finishSignatureButtonDisabled = false; }




  async finalizeConsent() {
    this.co.signature = this.signaturePad.toDataURL();
    this.co.signatureDate = (new Date()).toISOString();
    await this.modalController.dismiss( { consent: this.co } );
  }

  async closeConsent() {
    await this.modalController.dismiss();
  }



}
