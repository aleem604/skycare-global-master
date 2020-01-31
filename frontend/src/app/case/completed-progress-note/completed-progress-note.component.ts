import { Component, OnInit } from '@angular/core';
import { CompanyCase } from '../../apiClient';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'app-completed-progress-note',
  templateUrl: './completed-progress-note.component.html',
  styleUrls: ['./completed-progress-note.component.scss']
})
export class CompletedProgressNoteComponent implements OnInit {


  public currentCase : CompanyCase = {
    patientProgress : {
      patientProgressID: '',
      caseID: '',  
      patientBelongings: false,  
      statusUpdates: [],
      medications: [],
      notes: []
    },
    caseID : '',
    caseNumber : '',
    companyID : '',
    currentStatus : '',
    escorts : [],
    escortTracking : [],
    escortReceipts : [],
    statusChanges : [],
    documents : [],
    messages : []
  };


  constructor(private modalController: ModalController,
              private navParams: NavParams,) { }


  ngOnInit() {
  }

  ionViewWillEnter() {
    let suppliedCase : CompanyCase | undefined = this.navParams.get('relatedCase');
    if ( suppliedCase !== undefined && suppliedCase != null ) {
      this.currentCase = suppliedCase;
    }
  }


  async closeConsent() {
    await this.modalController.dismiss();
  }

  print() : void {
    window.open('/case/printProgress/' + this.currentCase.caseID);
  }

}
