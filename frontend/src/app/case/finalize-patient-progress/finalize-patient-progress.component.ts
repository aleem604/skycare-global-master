import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { CasePatientProgress, CompanyCase } from '../../apiClient';
import { ModalController, NavParams } from '@ionic/angular';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-finalize-patient-progress',
  templateUrl: './finalize-patient-progress.component.html',
  styleUrls: ['./finalize-patient-progress.component.scss']
})
export class FinalizePatientProgressComponent implements OnInit {

  @ViewChild('slidesController') slidesController : any;
  public slideOptions = { 
    effect: 'cube',
    allowTouchMove: false,
    preventClicks: false,
    simulateTouch: false
  };
  public finishMedicalProviderSignatureButtonDisabled : boolean = true;
  public finishPrimaryEscortSignatureButtonDisabled : boolean = true;
  public secondaryEscortSignatureWasModified : boolean = false;


  @ViewChild('medicalProviderSignaturePad') medicalProviderSignaturePad: SignaturePad; 
  @ViewChild('primaryEscortSignaturePad') primaryEscortSignaturePad: SignaturePad; 
  @ViewChild('secondaryEscortSignaturePad') secondaryEscortSignaturePad: SignaturePad; 
  public signaturePadOptions: Object = { 
    'minWidth': 1,
    'canvasWidth': 100,
    'canvasHeight': 100
  };


  public pp : CasePatientProgress = {
    caseID : '',
    patientProgressID : '',
    patientBelongings : true,
    escort1ID : '',
    escort2ID : '',
    medicalProviderName : ''
  };
  public currentCase : CompanyCase = {
    caseID : '',
    caseNumber : '',
    companyID : '',
    currentStatus : '',
    escorts : [],
    escortReceipts : [],
    statusChanges : [],
    documents : [],
    messages : [],
    escortTracking : []
  };


  constructor(private modalController: ModalController,
              private navParams: NavParams,
              private formBuilder: FormBuilder,
              private domAccessor : ElementRef,) { }


  ngOnInit() {
    this.delayedResize(this.medicalProviderSignaturePad, 0);
    this.delayedResize(this.primaryEscortSignaturePad, 1);
    this.delayedResize(this.secondaryEscortSignaturePad, 2);

    this.domAccessor.nativeElement.ownerDocument.defaultView.addEventListener('resize', this.delayedResize.bind(this, this.medicalProviderSignaturePad, 0));
    this.domAccessor.nativeElement.ownerDocument.defaultView.addEventListener('resize', this.delayedResize.bind(this, this.primaryEscortSignaturePad, 1));
    this.domAccessor.nativeElement.ownerDocument.defaultView.addEventListener('resize', this.delayedResize.bind(this, this.secondaryEscortSignaturePad, 2));
  }


  ionViewWillEnter() {
    let suppliedPP : CasePatientProgress | undefined = this.navParams.get('progress');
    if ( suppliedPP !== undefined && suppliedPP != null ) {
      this.pp = suppliedPP;
    }
    let suppliedCase : CompanyCase | undefined = this.navParams.get('companyCase');
    if ( suppliedCase !== undefined && suppliedCase != null ) {
      this.currentCase = suppliedCase;
    }
  }


  next() : void { 
    this.slidesController.slideNext().then( () => {  
      this.slidesController.update().then(()=>{ return; });
      //this.resizeSignaturePad(this.primaryEscortSignaturePad, 1);
      //this.resizeSignaturePad(this.secondaryEscortSignaturePad, 2);
    });
  }
  prev() : void { 
    this.slidesController.slidePrev().then(()=>{ return; }); 
  }


  delayedResize(sigPad : SignaturePad, titleIndex : number) : void {
    setTimeout(()=>{this.resizeSignaturePad(sigPad,titleIndex);}, 400);
  }
  resizeSignaturePad(sigPad : SignaturePad, titleIndex : number) : void {
    let titlebarHeight : number = this.domAccessor.nativeElement.getElementsByClassName('title')[titleIndex].clientHeight;

    let originalSignature : string = '';
    if (!sigPad.isEmpty()) { originalSignature = sigPad.toDataURL(); }

    let width : number = parseInt(this.domAccessor.nativeElement.clientWidth)-18;
    let height : number = parseInt(this.domAccessor.nativeElement.clientHeight)-(180 + titlebarHeight);
    (sigPad as any).elementRef.nativeElement.firstChild.setAttribute('width', width);
    (sigPad as any).elementRef.nativeElement.firstChild.setAttribute('height', height);

    if (originalSignature.length > 0) { sigPad.fromDataURL(originalSignature, { width, height }); }
  }
  resetSignature(signer : string) { 
    switch (signer) {
      case 'medicalProvider':
        this.medicalProviderSignaturePad.clear();
        this.finishMedicalProviderSignatureButtonDisabled = true;
        break;
      case 'primaryEscort':
        this.primaryEscortSignaturePad.clear();
        this.finishPrimaryEscortSignatureButtonDisabled = true;
        break;
      case 'secondaryEscort':
        this.secondaryEscortSignaturePad.clear();
        this.secondaryEscortSignatureWasModified = false;
        break;
    }
  }
  drawComplete(signer : string) { 
    switch (signer) {
      case 'medicalProvider':
        this.finishMedicalProviderSignatureButtonDisabled = false;
        break;
      case 'primaryEscort':
        this.finishPrimaryEscortSignatureButtonDisabled = false;
        break;
      case 'secondaryEscort':
        this.secondaryEscortSignatureWasModified = true;
        break;
    }
  }




  finalizeProgress() : void {
    this.pp.medicalProviderSignature = this.medicalProviderSignaturePad.toDataURL();
    this.pp.medicalProviderSignatureDate = (new Date()).toISOString();
    this.pp.escort1Signature = this.primaryEscortSignaturePad.toDataURL();
    if (this.secondaryEscortSignatureWasModified) { this.pp.escort2Signature = this.secondaryEscortSignaturePad.toDataURL(); }
    this.modalController.dismiss( { progress: this.pp } ).then( () => {
      console.log('closed modal after save');
    });
  }


  closeProgress() : void { 
    this.modalController.dismiss().then( () => { return; }); 
  }


}
