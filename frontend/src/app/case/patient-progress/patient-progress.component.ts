import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { VitalSignsStatus, DeliveredMedications, ProgressNote, CasePatientProgress, Escort } from '../../apiClient';
import { ModalController, NavParams, Platform  } from '@ionic/angular';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-patient-progress',
  templateUrl: './patient-progress.component.html',
  styleUrls: ['./patient-progress.component.scss']
})
export class PatientProgressComponent implements OnInit {

  @ViewChild('scrollTopAnchor') scrollTopAnchor : ElementRef;
  @ViewChild('slidesController') slidesController : any;
  public slideOptions = { 
    effect: 'cube',
    allowTouchMove: false,
    preventClicks: false,
    simulateTouch: false
  };

  @ViewChild('notesControl') notesControl : ElementRef;


  public pp : CasePatientProgress = {
    statusUpdates : [],
    medications : [],
    notes : [],
    caseID : '',
    patientProgressID : '',
    patientBelongings : false
  };
  public escort : Escort;

  public newVS : VitalSignsStatus = {
    userID: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    bloodSugar: '',
    oxygenSaturation: '',
    oxygenFlowRate: '',
    measurementMode: '',
    painMeasurement: 1,
    date: '',
  };
  public newMed : DeliveredMedications = {
    userID: '',
    description: '',
    dose: '',
    route: '',
    patientResponse: '',
    date: '',
  };
  public newNote : ProgressNote = {    
    userID: '',
    text: '',
    date: '',
  };

  /*
  
  */

  public vitalSignsForm: FormGroup;
  public medicationsForm: FormGroup;
  public narrativeForm: FormGroup;

  public shouldShowAddButton : boolean = true;
  public inEditMode : boolean = false;
  public currentVitalSignEditIndex : number = -1;
  public currentMedicationEditIndex : number = -1;
  public currentNoteEditIndex : number = -1;
  
  


  constructor(private platform: Platform,
              private modalController: ModalController,
              private authService: AuthService,
              private navParams: NavParams,
              private formBuilder: FormBuilder,
              private domAccessor : ElementRef,) { }

  ngOnInit() {

    this.vitalSignsForm = this.formBuilder.group({
      vsTemperatureControl: new FormControl(''),
      vsBloodPressureControl: new FormControl(''),
      vsHeartRateControl: new FormControl(''),
      vsRespiratoryRateControl: new FormControl(''),
      vsBloodSugarControl: new FormControl(''),
      vsO2SaturationControl: new FormControl(''),
      vsO2FlowRateControl: new FormControl(''),
      vsMeasurementModeControl: new FormControl(''),
      vsPainMeasurementControl: new FormControl(''),
    });

    this.medicationsForm = this.formBuilder.group({
      medDescriptionControl: new FormControl(''),
      medDoseControl: new FormControl(''),
      medDeliveryControl: new FormControl(''),
      medResponseControl: new FormControl(''),
    });

    this.narrativeForm = this.formBuilder.group({
      notesControl: new FormControl(''),
    });


    this.domAccessor.nativeElement.ownerDocument.defaultView.addEventListener('resize', this.resizeNotes.bind(this));

  }




  ionViewWillEnter() {
    let suppliedPP : CasePatientProgress | undefined = this.navParams.get('progress');
    if ( suppliedPP !== undefined && suppliedPP != null ) {
      this.pp = suppliedPP;
    }
  }


  resizeNotes() : void {
    this.notesControl.nativeElement.style.height = (this.domAccessor.nativeElement.scrollHeight - 135) + 'px';
  }


  next(transitionToNotes : boolean = false) : void { 
    this.slidesController.slideNext().then( () => {  
      this.slidesController.update().then(()=>{ return; });
      if (transitionToNotes) {
        this.notesControl.nativeElement.style.height = (this.domAccessor.nativeElement.scrollHeight - 135) + 'px';
      }
      this.slidesController.isBeginning().then((isBeginning:boolean)=>{ this.shouldShowAddButton=isBeginning; });
      this.scrollTopAnchor.nativeElement.scrollIntoView();
    });
  }
  prev() : void { 
    this.slidesController.slidePrev().then(()=>{ return; }); 
    this.slidesController.isBeginning().then((isBeginning:boolean)=>{ this.shouldShowAddButton=isBeginning; });
    this.scrollTopAnchor.nativeElement.scrollIntoView();
  }


  editVitals(index : number) : void {
    this.inEditMode = true;
    this.currentVitalSignEditIndex = index;
    this.newVS = this.pp.statusUpdates[index]; 
    this.slidesController.slideTo(1).then( () => {  
      this.slidesController.update().then(()=>{ return; });
      this.shouldShowAddButton=false;
    });
  }

  saveVitalSignEdits() : void {
    this.newVS.date = (new Date()).toISOString();
    this.pp.statusUpdates[this.currentVitalSignEditIndex] = this.newVS;
    this.modalController.dismiss( { progress: this.pp } ).then( () => {
      console.log('closed modal after save');
    });
  }

  editMedications(index : number) : void {
    this.inEditMode = true;
    this.currentMedicationEditIndex = index;
    this.newMed = this.pp.medications[index]; 
    this.slidesController.slideTo(2).then( () => {  
      this.slidesController.update().then(()=>{ return; });
      this.shouldShowAddButton=false;
    });
  }

  saveMedicationEdits() : void {
    this.newMed.date = (new Date()).toISOString();
    this.pp.medications[this.currentMedicationEditIndex] = this.newMed;
    this.modalController.dismiss( { progress: this.pp } ).then( () => {
      console.log('closed modal after save');
    });
  }

  editNotes(index : number) : void {
    this.inEditMode = true;
    this.currentNoteEditIndex = index;
    this.newNote = this.pp.notes[index]; 
    this.slidesController.slideTo(3).then( () => {  
      this.slidesController.update().then(()=>{ return; });
      this.shouldShowAddButton=false;
      this.resizeNotes();
    });
  }

  saveNoteEdits() : void {
    this.newNote.date = (new Date()).toISOString();
    this.pp.notes[this.currentNoteEditIndex] = this.newNote;
    this.modalController.dismiss( { progress: this.pp } ).then( () => {
      console.log('closed modal after save');
    });
  }


  saveProgress() : void {
    let somethingWasChanged : boolean = false;
    if (this.vitalSignsForm.dirty && (this.newVS.bloodPressure.trim().length > 0 ||
                                      this.newVS.bloodSugar.trim().length > 0 ||
                                      this.newVS.temperature.trim().length > 0 ||
                                      this.newVS.heartRate.trim().length > 0 ||
                                      this.newVS.measurementMode.trim().length > 0 ||
                                      this.newVS.oxygenFlowRate.trim().length > 0 ||
                                      this.newVS.oxygenSaturation.trim().length > 0 ||
                                      parseInt(this.newVS.painMeasurement) > 0 ||
                                      this.newVS.respiratoryRate.trim().length > 0)) { 
      somethingWasChanged = true;
      this.newVS.date = (new Date()).toISOString();
      this.newVS.userID = this.authService.getUserID();
      if (this.pp.statusUpdates === undefined || this.pp.statusUpdates == null) { this.pp.statusUpdates = []; }
      this.pp.statusUpdates.push(this.newVS);
    }
    if (this.medicationsForm.dirty && (this.newMed.description.trim().length > 0 ||
                                       this.newMed.dose.trim().length > 0 ||
                                       this.newMed.patientResponse.trim().length > 0 ||
                                       this.newMed.route.trim().length > 0)) {
      somethingWasChanged = true;
      this.newMed.date = (new Date()).toISOString();
      this.newMed.userID = this.authService.getUserID();
      if (this.pp.medications === undefined || this.pp.medications == null) { this.pp.medications = []; }
      this.pp.medications.push(this.newMed);
    }
    if (this.narrativeForm.dirty && this.newNote.text.trim().length > 0) {
      somethingWasChanged = true;
      this.newNote.date = (new Date()).toISOString();
      this.newNote.userID = this.authService.getUserID();
      if (this.pp.notes === undefined || this.pp.notes == null) { this.pp.notes = []; }
      this.pp.notes.push(this.newNote);
    }
    
    if (somethingWasChanged) {
      this.modalController.dismiss( { progress: this.pp } ).then( () => {
        console.log('closed modal after save');
      });
    } else {
      this.closeProgress();
    }
  }

  closeProgress() : void { 
    this.modalController.dismiss().then( () => { return; }); 
  }



  private topLevelNodeName = 'APP-PATIENT-PROGRESS';
  showKeyboardOnPhones(evt) {
    if (this.platform.is('ios') || !this.platform.is('ios')) {
      // Scroll the view up to present it above the keyboard
      let topLevelParent = <HTMLElement>(document.getElementsByTagName(this.topLevelNodeName)[0]);

      let iosAvailableScreenHeight = 335; // Pixels viewable on an iPhone 8 when keyboard is present
      topLevelParent.style.top = (iosAvailableScreenHeight - (topLevelParent.offsetHeight + evt.target.offsetHeight)).toString() + 'px';
    }
  }


  hideKeyboardOnPhones(evt) {
    if (this.platform.is('ios') || !this.platform.is('ios')) {
      // Scroll the view down as the keyboard hides
      let topLevelParent = <HTMLElement>(document.getElementsByTagName(this.topLevelNodeName)[0]);
      topLevelParent.style.top = '0px';
    }
  }

}
