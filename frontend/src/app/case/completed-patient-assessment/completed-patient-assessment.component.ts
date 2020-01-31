import { Component, OnInit } from '@angular/core';
import { CompanyCase } from '../../apiClient';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'app-completed-patient-assessment',
  templateUrl: './completed-patient-assessment.component.html',
  styleUrls: ['./completed-patient-assessment.component.scss']
})
export class CompletedPatientAssessmentComponent implements OnInit {


  public currentCase : CompanyCase = {
    patientAssessment : {
      patientAssessmentID: '',
      caseID: '',
      respBreathing : [],
      cardiacEquipment : [],
      abdomenCondition : [],
      abdomenTenderness : [],
      painSensation : [],
      backTrauma : [],
      extremitiesTrauma : [],
      demeanorSkin : [],      
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
    window.open('/case/printAssessment/' + this.currentCase.caseID);
  }

}


