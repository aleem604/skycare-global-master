
import { FormControl, FormGroupDirective, NgForm, Validators, AbstractControl } from '@angular/forms';
import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, ViewChildren  } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController, NavParams, AlertController, Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { CasePatientAssessment } from '../../apiClient';
import { ImageAnnotatorComponent } from '../../controls/image-annotator/image-annotator.component';


@Component({
  selector: 'app-patient-assessment',
  templateUrl: './patient-assessment.component.html',
  styleUrls: ['./patient-assessment.component.scss']
})
export class PatientAssessmentComponent implements OnInit {

  public currentSlideName : string = '';

  @ViewChild('scrollTopAnchor') scrollTopAnchor : ElementRef;
  @ViewChild('scrollBottomAnchor') scrollBottomAnchor : ElementRef;
  
  @ViewChild('slidesController') slidesController : any;
  public slideOptions = { 
    effect: 'cube',
    allowTouchMove: false,
    preventClicks: false,
    simulateTouch: false
  };
  public finishAirwayButtonDisabled : boolean = false;
  public finishRespChestButtonDisabled : boolean = false;
  public finishCardiacButtonDisabled : boolean = false;
  public finishNeuroButtonDisabled : boolean = false;
  public finishAbdomenButtonDisabled : boolean = false;
  public finishTraumaExtButtonDisabled : boolean = false;
  public finishDiagramButtonDisabled : boolean = false;
  public finishMiscButtonDisabled : boolean = false;
  public finishSignatureButtonDisabled : boolean = true;


  @ViewChild('annotator') imageAnnotator: ImageAnnotatorComponent;


  @ViewChild(SignaturePad) signaturePad: SignaturePad; 
  public signaturePadOptions: Object = { 
    'minWidth': 1,
    'canvasWidth': 100,
    'canvasHeight': 100
  };
  

  public pa : CasePatientAssessment = {
    patientAssessmentID: '',
    caseID: ''
  } as CasePatientAssessment;



  public airwayForm: FormGroup;
  public respiratoryForm: FormGroup;
  public cardiacForm: FormGroup;
  public neuroForm: FormGroup;
  public abdomenForm: FormGroup;
  public traumaExtForm: FormGroup;
  public diagramForm: FormGroup;
  public miscForm: FormGroup;

  
  constructor(private platform: Platform,
              private modalController: ModalController,
              private alertController: AlertController,
              private navParams: NavParams,
              private formBuilder: FormBuilder,
              private domAccessor : ElementRef,) { }



  ngOnInit() {

    this.airwayForm = this.formBuilder.group({
      patientO2SpecifiedControl: new FormControl(''),
      patientO2LPMControl: new FormControl(''),
      usingBVMControl: new FormControl(''),
      usingETTControl: new FormControl(''),
      usingETTSizeControl: new FormControl(''),
      usingETTRateControl: new FormControl(''),
      usingOPANPAControl: new FormControl(''),
      usingTrachControl: new FormControl(''),
      usingTrachSizeControl: new FormControl(''),
      notesControl: new FormControl(''),
    });

    this.respiratoryForm = this.formBuilder.group({
      breathingControl: new FormControl(''),
      tracheaMidlineControl: new FormControl(''),
      chestWallExpansionControl: new FormControl(''),
      coughControl: new FormControl(''),
      coughProductiveControl: new FormControl(''),
      breathSoundsControl: new FormControl(''),
      breathDiminishedRightControl: new FormControl(''),
      breathDiminishedLeftControl: new FormControl(''),
      respMonitorsControl: new FormControl(''),
      supplimentaryO2DeviceControl: new FormControl(''),
      equipLPMControl: new FormControl(''),
      equipPercentControl: new FormControl(''),
    });

    this.cardiacForm = this.formBuilder.group({
      cardiacRateControl: new FormControl(''),
      cardiacRhythmControl: new FormControl(''),
      cardiacSoundsControl: new FormControl(''),
      cardiacJVDControl: new FormControl(''),
      peripheralEdemaControl: new FormControl(''),
      peripheralEdemaScoreControl: new FormControl('', Validators.compose([ Validators.min(1), Validators.max(4) ])),
      cardiacExternalPacingControl: new FormControl(''),
      cardiacExternalPacingMAControl: new FormControl(''),
      cardiacExternalPacingRateControl: new FormControl(''),
      cardiacEcgFindingsControl: new FormControl(''),
      cardiacNotesControl: new FormControl(''),
      cardiacEquipmentControl: new FormControl(''),
    });

    this.neuroForm = this.formBuilder.group({
      neuroEyesControl: new FormControl(''),
      neuroVerbalControl: new FormControl(''),
      neuroMotorControl: new FormControl(''),
      neuroPupilsPERRLAControl: new FormControl(''),
      neuroSizeLeftControl: new FormControl(''),
      neuroSizeRightControl: new FormControl(''),
      neuroReactionLeftControl: new FormControl(''),
      neuroReactionRightControl: new FormControl(''),
      neuroNotesControl: new FormControl(''),
    });

    this.abdomenForm = this.formBuilder.group({
      abdomenConditionControl: new FormControl(''),
      abdomenTendernessControl: new FormControl(''),
      abdomenBowelSoundsControl: new FormControl(''),
      abdomenFeedTubeControl: new FormControl(''),
      abdomenFeedTubeSizeControl: new FormControl(''),
      abdomenFeedTubeStateControl: new FormControl(''),
      abdomenNotesControl: new FormControl(''),
      pelvisStableControl: new FormControl(''),
      pelvisFoleyControl: new FormControl(''),
      pelvisFoleySizeControl: new FormControl(''),
      pelvisAppearanceOfUrineControl: new FormControl(''),
      pelvisNotesControl: new FormControl(''),
    });

    this.traumaExtForm = this.formBuilder.group({
      neuroHEENTTraumaControl: new FormControl(''),
      chestTraumaControl: new FormControl(''),
      backTraumaControl: new FormControl(''),
      backNotesControl: new FormControl(''),
      extremitiesTraumaControl: new FormControl(''),
      extremitiesPulsesRUEControl: new FormControl(''),
      extremitiesPulsesLUEControl: new FormControl(''),
      extremitiesPulsesRLEControl: new FormControl(''),
      extremitiesPulsesLLEControl: new FormControl(''),
    });

    this.diagramForm = this.formBuilder.group({
      diagramNotesControl: new FormControl('')
    });

    this.miscForm = this.formBuilder.group({
      demeanorSpeechControl: new FormControl(''),
      demeanorBehaviorControl: new FormControl(''),
      demeanorSkinControl: new FormControl(''),
      painDeniesControl: new FormControl(''),
      painLocationControl: new FormControl(''),
      painProvokedByControl: new FormControl(''),
      painRelievedByControl: new FormControl(''),
      painSensationControl: new FormControl(''),
      painRadiatesControl: new FormControl(''),
      painRadiatesToControl: new FormControl(''),
      painScaleControl: new FormControl(''),
    });


    this.domAccessor.nativeElement.ownerDocument.defaultView.addEventListener('resize', this.resizeSignaturePad.bind(this));

  }



  ionViewWillEnter() {
    let suppliedPA : CasePatientAssessment | undefined = this.navParams.get('patientAssessment');
    if ( suppliedPA !== undefined && suppliedPA != null ) {
      this.pa = suppliedPA;
    }
  }


  private topLevelNodeName = 'APP-PATIENT-ASSESSMENT';
  showKeyboardOnPhones(evt) {
    if (this.platform.is('ios')) {
      // Scroll the view up to present it above the keyboard
      let topLevelParent = <HTMLElement>(document.getElementsByTagName(this.topLevelNodeName)[0]);

      let iosAvailableScreenHeight = 335; // Pixels viewable on an iPhone 8 when keyboard is present
      console.log(evt.target.offsetParent.offsetParent.offsetHeight + evt.target.offsetParent.offsetParent.offsetTop + evt.target.offsetHeight);
      if (this.currentSlideName == 'diagram') {
        topLevelParent.style.top = (iosAvailableScreenHeight - (evt.target.offsetParent.offsetParent.offsetHeight + evt.target.offsetParent.offsetParent.offsetTop + evt.target.offsetHeight)).toString() + 'px';
      } else {
        topLevelParent.style.top = (iosAvailableScreenHeight - (topLevelParent.offsetHeight + evt.target.offsetHeight)).toString() + 'px';
      }
    }
  }


  hideKeyboardOnPhones(evt) {
    if (this.platform.is('ios')) {
      // Scroll the view down as the keyboard hides
      let topLevelParent = <HTMLElement>(document.getElementsByTagName(this.topLevelNodeName)[0]);
      topLevelParent.style.top = '0px';
    }
  }


  formControlHasError(form : FormGroup, controlName : string, validationMessages : any) : boolean {
    return false;
  }




  computeGCSScore() : void {
    this.pa.neuroGcsScore = ((this.pa.neuroEyes !== undefined ? parseInt(this.pa.neuroEyes) : 0) +
                               (this.pa.neuroVerbal !== undefined ? parseInt(this.pa.neuroVerbal) : 0) +
                               (this.pa.neuroMotor !== undefined ? parseInt(this.pa.neuroMotor) : 0));
  }



  saveDiagramAnnotations(imageData : string) : void {
    this.pa.diagramAnnotations = imageData;
  }



  async next(nextScreen : string = '') : Promise<void> { 
    this.currentSlideName = nextScreen;
    if (nextScreen == 'misc') { this.imageAnnotator.saveImage(); }
    this.slidesController.slideNext().then( () => {  
      this.slidesController.update().then(()=>{ return; });
      if (nextScreen == 'signature') { this.resizeSignaturePad(); }
      this.scrollTopAnchor.nativeElement.scrollIntoView();
    });
  }
  async prev(prevScreen : string = '') : Promise<void> { 
    this.currentSlideName = prevScreen;
    await this.slidesController.slidePrev(); 
    this.scrollTopAnchor.nativeElement.scrollIntoView();
  }



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




  async finalizeAssessment() {
    this.pa.overallSignature = this.signaturePad.toDataURL();
    await this.modalController.dismiss( { assessment: this.pa, finalize: true } );
  }

  async saveAssessmentProgress() {
    if (this.currentSlideName == 'diagram') { this.imageAnnotator.saveImage(); }

    const alert = await this.alertController.create({
      header: 'Assessment not complete',
      message: 'You must sign and finish this Patient Assessment for it to be complete.',
      buttons: [{
          text: 'Okay',
          handler: async (data) => {
            await this.modalController.dismiss( { assessment: this.pa, finalize: false } );
          }
        }
      ]
    });

    await alert.present();
  }


}
