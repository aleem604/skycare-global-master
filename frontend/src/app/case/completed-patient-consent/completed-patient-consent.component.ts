import { Component, OnInit, ElementRef } from '@angular/core';
import { CompanyCase } from '../../apiClient';
import { ModalController, NavParams, ToastController } from '@ionic/angular';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { CaseService } from '../case.service';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-completed-patient-consent',
  templateUrl: './completed-patient-consent.component.html',
  styleUrls: ['./completed-patient-consent.component.scss']
})
export class CompletedPatientConsentComponent implements OnInit {

  public caseID : string = '';

  public currentCase : CompanyCase = {
    patientConsent : {
      fromLocation : '',
      toLocation : '',
      patientDOB : '',
      patientName : '',
      signature : '',
      signatureDate : '',
      signersName : '',
      signersRelationshipToPatient : ''
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
              private toaster: ToastController,
              private caseService: CaseService,
              private navParams: NavParams,
              private domAccessor : ElementRef) { }

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
    window.open('/case/printConsent/' + this.currentCase.caseID);
  }


}
